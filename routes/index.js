const express = require('express');
const authRoutes = require('./authRoutes');
const homeRoutes = require('./homeRoutes');
const groupRoutes = require('./groupRoutes');
const listRoutes = require('./listRoutes');
const profileRoutes = require('./profileRoutes');
const feedbackRoutes = require('./feedbackRoutes');

const router = express.Router();

router.use('/', authRoutes);
router.use('/home', homeRoutes);
router.use('/profile', profileRoutes);
router.use('/groups/', groupRoutes);
router.use('/list/', listRoutes);
router.use('/feedback/', feedbackRoutes);
module.exports = router;
