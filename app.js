require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const routes = require('./routes');
const { scheduleFunctionAtSpecificTime } = require('./utils/scheduleUtils');

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

app.use(session({
  secret : process.env.SESSION_SECRET,
  resave : false,
  saveUninitialized : false,
  cookie: {
  //secure: true,
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year (in milliseconds)
}
}))

app.use(passport.initialize());
app.use(passport.session());
// mongodb+srv://admin-tynza:<password>@cluster0.beel02a.mongodb.net/?retryWrites=true&w=majority
mongoose.connect("mongodb+srv://admin-tynza:12345@cluster0.beel02a.mongodb.net/tynzaDB");

app.use(routes);

scheduleFunctionAtSpecificTime(9, 47);


app.listen(3000, function () {
  console.log("Server is up and running at port 3000.");
})
