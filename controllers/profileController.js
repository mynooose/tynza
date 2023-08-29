const User = require('../models/User');




function renderProfile(req, res) {
  if(req.isAuthenticated()){

    const userId =  req.user.id;

    fetchUserInfo();

    async function fetchUserInfo(){
        const myUserDocument = await User.findById(userId);
        console.log(myUserDocument);
        res.render("profile",{myUserDocument : myUserDocument });
    }

  } else{
    res.redirect("/");
  }
}





module.exports = {
renderProfile
};
