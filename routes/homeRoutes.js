const express = require('express');
const passport = require('passport');
const homeController = require('../controllers/homeController');
const homeRouter = express.Router();

// Route for user registration
homeRouter.get('/', homeController.renderHomePage);


module.exports = homeRouter;
