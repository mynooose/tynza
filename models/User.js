const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const _ = require('lodash');

const userSchema = new mongoose.Schema({
  username : String,
  password : String,
  phone : Number,
  name : String,
  googleId : String,
  groups : [{type: mongoose.Schema.Types.ObjectId, ref: 'Group'}]
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://tynza.onrender.com/auth/google/secrets",
    scope: ['profile',"email"]
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(JSON.stringify(profile));
    console.log(profile.emails[0].value);
    User.findOrCreate({ googleId: profile.id, username : profile.emails[0].value, name : _.startCase(profile.displayName) }, function (err, user) {
      return cb(err, user);
    });
  }
));


module.exports = User;
