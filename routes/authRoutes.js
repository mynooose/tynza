const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const authRouter = express.Router();

// Route for user registration
authRouter.post('/register', authController.registerUser);
authRouter.get('/register', authController.renderRegistrationForm);

// Route for user login
authRouter.post('/login', authController.loginUser);
authRouter.get('/login', authController.renderLoginForm);
authRouter.get('/', authController.renderLoginForm);

//google
authRouter.get('/auth/google',authController.googleAuth);
authRouter.get('/auth/google/secrets',authController.googleAuthCallback);

// Route for user logout
authRouter.get('/logout', authController.logoutUser);

module.exports = authRouter;
