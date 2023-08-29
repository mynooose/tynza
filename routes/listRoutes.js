const express = require('express');
const passport = require('passport');
const listController = require('../controllers/listController');
const listRouter = express.Router();

// Route for user registration
listRouter.post('/addNewItem', listController.addNewItem);
listRouter.post('/deleteTask', listController.deleteTask);
listRouter.post('/updateTaskStatus', listController.updateTaskStatus);

module.exports = listRouter;
