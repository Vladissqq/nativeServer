const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        default: 'User',
    },
    message: String,
    room: String
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;