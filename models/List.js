const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  items : [{type: mongoose.Schema.Types.ObjectId, ref: 'Item'}],
  userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId : { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  recordIds : [{type: mongoose.Schema.Types.ObjectId, ref: 'Record'}]
})


const List = mongoose.model('List', listSchema);

module.exports = List;
