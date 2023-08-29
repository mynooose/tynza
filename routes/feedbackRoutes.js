const express = require('express');
const feedbackController = require('../controllers/feedbackController');
const feedbackRouter = express.Router();

// Route for user registration
feedbackRouter.get('/', feedbackController.renderFeedbackForm);
feedbackRouter.post('/', feedbackController.submitFeedbackForm);

module.exports = feedbackRouter;
