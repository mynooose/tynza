const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name : String,
  status : String,
  listId : { type: mongoose.Schema.Types.ObjectId, ref: 'List' }
})

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
