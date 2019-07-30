const mongoose = require('mongoose');

const UserSchema = mongoose.Schema( {
  id: mongoose.Schema.Types.ObjectId,
  firstName: {
    type: String,
    default: 'User'
  },
  secondName: {
    type: String,
    default: 'User'
  },
  email: String,
  rooms: {
    type: Array,
    default: []
  },
  img: String,
  google: Boolean
})

const User = mongoose.model('User', UserSchema);
module.exports = User;