const mongoose = require('mongoose');
const Room = require('./models/Room');
const Message = require('./models/Message');
const User = require('./models/User');
// const cors = require('cors');

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const port = 8124;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
// app.use(cors());

io.origins('*:*');
mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true });
const db = mongoose.connection;
// mongoose.set('debug', true); 

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('ok')
});

const room = new Room({
  _id: new mongoose.Types.ObjectId(),
  name: 'all',
  messages: [],
});

Room.find({ name: /all/i }).exec(
  (err, rooms) => {
    if (rooms.length === 0) {
      room.save()
    }
  }
)


const arrId = [];
const arrClients = [];
const arrEmails = [];
const rooms = ['all'];
let decoded = null;
let info = null;

app.post('/auth', function (req, res) {

  decoded = jwt.decode(req.body.tokken);
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    firstName: decoded.given_name,
    secondName: decoded.family_name,
    email: decoded.email,
    img: decoded.picture,
    google: true,
    rooms: ['all']
  });
  User.find({ email: decoded.email }).exec(
    (err, users) => {
      if (users.length === 0) {
        console.log('new user');
        user.save();
      }
    }
  )

  info = {
    email: decoded.email,
    firstName: decoded.given_name,
    secondName: decoded.family_name,
    picture: decoded.picture
  }

  res.status(200).send(decoded.email);
});

app.post('/rooms', function (req, res) {
  console.log(req.body.email);
  User.findOne({ email: req.body.email }).exec(
    (err, user) => {
      if (user) {
        res.status(200).send(user.rooms);
      }
    }
  )
})

app.get('/users', function (req, res) {
  console.log('debugger');
  User.find().exec(
    (err, users) => {
      res.status(200).send(users)
      console.log(users)
    }
  )
});


app.post('/invite', function (req, res) {
  const {guests, room} = req.body;

  guests.forEach((guest) => {
    User.findOne({ email: guest }).exec(
      (err, user) => {
        const roomDB = user.rooms.find((el) => {
          return el === room
        });
  
        if (!roomDB) {
          user.rooms.push(room);
          user.save();
          // const indGuest = arrEmails.indexOf(req.body.guest.email);
          // if (indGuest >= 0) {
          //   arrClients[indGuest].emit('join', req.body.guest.room)
          // }
        }
      }
    )
  })
})

app.post('/register', function (req, res) {
  User.find({ email: req.body.info.email }).exec(
    (err, users) => {
      if (users.length === 0) {
        const user = new User({
          _id: new mongoose.Types.ObjectId(),
          firstName: req.body.info.userName,
          secondName: '',
          email: req.body.info.email,
          img: 'https://freeicons.io/laravel/public/uploads/icons/png/5770622851556281668-64.png',
          google: false,
          rooms: ['all']
        });

        user.save();
      }
    }
  )

  info = {
    email: req.body.info.email,
    firstName: req.body.info.userName,
    secondName: 'xxx',
    picture: 'https://freeicons.io/laravel/public/uploads/icons/png/5770622851556281668-64.png'
  }

  res.status(200).send(info.email);
})

app.get('/get_info', function (req, res) {
  res.status(200).send(info);
})

app.get('/get_messages', function (req, res) {
  Room.findOne({ name: 'all' }).exec(
    (err, room) => {
      const history = {
        messages: room.messages,
      }
      console.log('is work');
      res.status(200).send(history);
    })
}
)

io.on('connection', (client) => {
  console.log('connected')

  client.join('all');
  arrId.push(client.id);
  arrClients.push(client);
  client.emit('send online', arrId);
  console.log('client connected');

  client.on('disconnect', () => {
    console.log('client disconnect');
    const index = arrId.findIndex((id) => {
      return id === client.id;
    });
    arrId.splice(index, 1);
    arrClients.splice(index, 1);
    arrEmails.splice(index, 1);
    client.emit('send online', arrId);
  });

  client.on('accept_invite', (room) => {
    rooms.push(room)
  })

  client.on('send_email', (email) => {
    arrEmails.push(email);
    User.findOne({ email: email }).exec(
      (err, user) => {

      }
    )
  });
  client.on('remove_email', () => {
    console.log('is work')
  })

  client.on('output message', (message) => {
    Room.findOne({ name: message.room }).exec(
      (err, room) => {
        const mes = new Message({
          id: new mongoose.Types.ObjectId(),
          name: message.name,
          message: message.message,
          room: message.room
        });
        const messages = [] && room.messages;
        messages.push(mes);
        room.messages = messages;
        room.save();
      }
    );
    client.broadcast.to(message.room).emit('input room', message);
  });
  client.on('create', (roomObj) => {
    console.log(roomObj);
    //addd room to BD
    Room.find({ name: roomObj.room }).exec(
      (err, r) => {
        if (r.length === 0) {
          const customRoom = new Room({
            _id: new mongoose.Types.ObjectId(),
            name: roomObj.room,
            messages: []
          });
          rooms.push(roomObj.room);
          console.log(rooms)
          customRoom.save();
        }
      }
    );

    User.findOne({ email: roomObj.email }).exec(
      (err, user) => {
        if (user.rooms.indexOf(roomObj.room) < 0) {
          console.log(roomObj.room)
          user.rooms.push(roomObj.room);
          user.save()

        }
      }
    )

    //socket 
    client.join(roomObj.room);
  });

  client.on('join_room', (room) => {
    client.join(room);
  })

  client.on('leave room', (room) => {
    client.leave(room);
    client.emit('server message', 'you left the room');
  })
});


http.listen(port, () => {
  console.log('SERVER started on port number: ' + port);
});


