const passport = require('passport');
const User = require('../models/User');
// const ejs = require('ejs');



async function registerUser(req, res){

      try {
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;
        let signupError = "";

        if(password !== confirmPassword){
            console.log("Pasword mismatch");
            signupError = "Password mismatch";
            res.status(400).render("register", {signupError : signupError});
            console.log('Error:' + res.statusCode);
            return;

        }else{
          User.register({username : req.body.username}, req.body.password,function ( err, user) {
            //console.log(user );
            if(err){
                  console.log(err);
                  return res.status(500).redirect("/register");
            }else{
                  User.findOneAndUpdate({username :  req.body.username}, {name: req.body.name})
                  .then(function (foundUser) {
                    console.log("found user is" + foundUser.username);
                  })

                  if(err){
                    console.log(err);
                    res.status(500).redirect("/register");
                  } else{
                    //console.log("trying authentication");
                    passport.authenticate("local")(req, res, function() {
                      //console.log("trying dasdada");

                      res.redirect('/');
                    })
                  }
            }

          })
        }

      } catch (e) {
          console.log(e);
      }


}

// Controller function for user login
//user login
async function loginUser(req, res){
  try {
    const user = new User({
      username : req.body.username,
      password : req.body.password
    })

    req.login(user, function (err) {
      if(err){
        console.log(err);
        res.redirect("/");
      }else{
        passport.authenticate("local",{ successRedirect: '/',
                                         failureRedirect: '/login' })(req, res, function() {
          //console.log("manoj login");
          //res.redirect('/about');
        })
      }
    })
  } catch (e) {
    console.log(e);
  }

}


// Controller function for user logout
 async function logoutUser (req, res) {
   try {
     req.logout(function(err) {
       if (err) { return next(err); }
       res.redirect('/');
     });
   } catch (e) {
     console.log(e);
   }

}


async function renderRegistrationForm (req, res) {
  try {

    if(req.isAuthenticated()){
        res.render("home");
    }
     else{
        res.render("register");
     }
  } catch (e) {
    console.log(e);
  }

}


async function renderLoginForm (req, res) {
  try {
    console.log("tynza auth check : " + req.isAuthenticated());
    if(req.isAuthenticated()){
        res.redirect("/home");
    }
     else{
        res.render("login");
     }
  } catch (e) {
    console.log(e);
  }

}



async function googleAuth(req, res) {
  try {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
    console.log("tynza auth");
  } catch (e) {
    console.log(e);
  }
}

async function googleAuthCallback(req, res) {
  try {
    passport.authenticate('google', { failureRedirect: '/login' })(req, res, function () {
      // Successful authentication, redirect home.
      res.redirect('/');
    });
    console.log("tynza authCallback");
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  renderLoginForm,
  registerUser,
  loginUser,
  logoutUser,
  renderRegistrationForm,
  googleAuth,
  googleAuthCallback
};
