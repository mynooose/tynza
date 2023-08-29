const Feedback = require('../models/Feedback');
const User = require('../models/User');

function renderFeedbackForm(req,res) {
  if(req.isAuthenticated()){
    res.render("feedback");
  }
  else{
    res.redirect("/");
  }

}

async function submitFeedbackForm(req,res) {
  if(req.isAuthenticated()){
    const userId = req.user.id;
    const comment = req.body.feedback;


    if(comment.trim().length === 0){
      res.redirect("/feedback");
    }
    else{
      const username = await User.findById(userId).username;

      const feedback = new Feedback({
        username : username,
        feedback : comment
      });

      await feedback.save();
      res.redirect("/feedback");
    }

  }
  else{
    res.redirect("/");
  }
}




module.exports = {
renderFeedbackForm,
submitFeedbackForm
};
