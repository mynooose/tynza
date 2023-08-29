const express = require('express');
const passport = require('passport');
const profileController = require('../controllers/profileController');
const profileRouter = express.Router();

// Route for user registration
profileRouter.get('/', profileController.renderProfile);


module.exports = profileRouter;
