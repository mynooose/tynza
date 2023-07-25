//Schema for item
const itemSchema = new mongoose.Schema({
  name : String,
  status : Number
})
//collection or model for item
const Item = mongoose.model("Item", itemSchema);

//Schema for user
const userSchema = new mongoose.Schema({
  name : String,
  listItems : [itemSchema]
})
//collection for user
const User = mongoose.model("User",userSchema);

const item1 = new Item({
  name : "coding",
  status : 0
})
const item2 = new Item({
  name : "trading",
  status : 0
})


const defaultUser = new User({
  name : "Sunil",
  listItems : [item1,item2]
})
//
// item1.save();
// item2.save();

  //defaultUser.save();
 // defaultUser1.save();

app.get("/", function (req, res) {
  User.find()
  .then(function (allUsers) {
    //const myList;
    //console.log(allUsers);
    User.findOne({name : "Manoj"})
    .then(function (myList) {
      res.render("home",{allUsers : allUsers , myList : myList} )
    })

  })
  .catch(function (err) {
    console.log(err);
  })
})
