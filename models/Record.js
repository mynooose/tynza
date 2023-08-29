const mongoose = require('mongoose');
const Item = require('../models/Item');

const itemSchema = new mongoose.Schema({
  name : String,
  status : String,
  listId : { type: mongoose.Schema.Types.ObjectId, ref: 'List' }
})

const recordSchema = new mongoose.Schema({
  date : Date,
  score : Number,
  userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  listId : { type: mongoose.Schema.Types.ObjectId, ref: 'List' },
  items : [itemSchema]
})

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;
