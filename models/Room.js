
const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    messages: {
      type: Array,
      default: []
    },
  });
  
  const Room = mongoose.model('Room', roomSchema);

  module.exports = Room;