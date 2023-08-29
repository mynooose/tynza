const express = require('express');
const passport = require('passport');
const groupController = require('../controllers/groupController');
const groupRouter = express.Router();

// Route for user registration
groupRouter.get('/', groupController.fetchAllGroups);
groupRouter.get('/groupform', groupController.renderGroupForm);
groupRouter.get('/groupInfo/:groupIdToBePassed', groupController.renderGroupInfo);
groupRouter.post('/groupform', groupController.createGroup);
groupRouter.post('/addMemberToGroup', groupController.addMemberToGroup);
groupRouter.post('/leaveGroup', groupController.leaveGroup);

module.exports = groupRouter;
