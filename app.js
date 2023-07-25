require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const lodash = require('lodash');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

app.use(session({
  secret : "my name is mynooose",
  resave : false,
  saveUninitialized : false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/tynzaDB");

const userSchema = new mongoose.Schema({
  username : String,
  password : String,
  phone : Number,
  name : String,
  groups : [{type: mongoose.Schema.Types.ObjectId, ref: 'Group'}]
  //listItems : [itemSchema]
})

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

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


app.get("/", function (req, res) {
  if(req.isAuthenticated()){
    res.redirect("/home");
  } else{
    res.redirect("/login");
  }
})

// app.get("/login", function (req, res) {
//     res.render("login");
// })


app.get("/register", function (req, res) {
  res.render("register",{signupError : ""});
})

//user logout
app.get("/logout", function (req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})



app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/profile", function (req, res) {
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
})

//user registration
app.post("/register", function (req, res) {

      const password = req.body.password;
      const confirmPassword = req.body.confirmPassword;
      let signupError = "";

      if(password !== confirmPassword){
          console.log("Pasword mismatch");
          signupError = "Password mismatch";
          res.render("register", {signupError : signupError});
      }else{
        User.register({username : req.body.username}, req.body.password,function ( err, user) {
          //console.log(user );
          User.findOneAndUpdate({username :  req.body.username}, {name: req.body.name})
          .then(function (foundUser) {
            console.log("found user is" + foundUser.username);
          })

          if(err){
            console.log(err);
            res.redirect("/register");
          } else{
            //console.log("trying authentication");
            passport.authenticate("local")(req, res, function() {
              //console.log("trying dasdada");

              res.redirect('/');
            })
          }
        })
      }


})


//user login
app.post("/login", function (req, res) {
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
})








//group schema /////////////////////////////

const groupSchema = new mongoose.Schema({
  name : String,
  members : [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  admin : {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
})

const Group = mongoose.model("Group", groupSchema);


//item schema///////////////////////////////////
const itemSchema = new mongoose.Schema({
  name : String,
  status :  {
    type: String,
    enum: ['complete', 'pending']
  },
  isActive : String,
  recurring: {
    type: String,
    enum: ['daily', 'weekly', 'monthly']
  },
  listId : { type: mongoose.Schema.Types.ObjectId, ref: 'List' }
})

const Item = mongoose.model("Item", itemSchema);

//Record schema///////////////////////////////////
const recordSchema = new mongoose.Schema({
  date : Date,
  score : Number,
  listId : { type: mongoose.Schema.Types.ObjectId, ref: 'List' },
  items : [itemSchema]
})

const Record = mongoose.model("Record", recordSchema);

//list schema///////////////////////////////////
const listSchema = new mongoose.Schema({
  items : [{type: mongoose.Schema.Types.ObjectId, ref: 'Item'}],
  userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId : { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  recordIds : [{type: mongoose.Schema.Types.ObjectId, ref: 'Record'}]
})

const List = mongoose.model("List", listSchema);








app.get("/groupinfo/:groupIdToBePassed", async function (req, res) {
  console.log("Tynza : GET :: /groupinfo/:groupIdToBePassed route.");
  if (req.isAuthenticated()) {
    const userId = req.user.id;
    const groupIdReceived = req.params.groupIdToBePassed;

    try {
      const myUserDocument = await User.findById(userId);
      const myUserName = myUserDocument.username;

      const groupDocument = await Group.findById(groupIdReceived).populate('members');
      //console.log("Group Docs : " + groupDocument);
      const groupMembers = groupDocument.members;
      //console.log("Group Members : " + groupMembers);
      const fetchedUsers = new Map();

      for (const member of groupMembers) {

        const list = await List.findOne({ userId: member._id, groupId: groupIdReceived }).populate('items');
        //console.log("Tynza : GroupInfo : list is : " + list);

        //initial filling the map with empty values
        fetchedUsers.set(member, {
          tasks: []
        });

        for (const item of list.items) {
          //console.log("Tynza : GroupInfo : item is : " + item + "for member : " + await member.username);
          // const itemObjectToPass = {
          //   itemName: item.name,
          //   itemId: item._id
          // };

          if (fetchedUsers.has(member)) {
            //console.log("member push kr rha map me");
            fetchedUsers.get(member).tasks.push(item);
          } else {//not required anymore
            //console.log("member add kr rha map me");
            fetchedUsers.set(member, {
              tasks: [item]
            });
          }
        }
      }

      //console.log("Tynza : FetchedUSers in groupinfo" + fetchedUsers);
      await res.render("groupinfo", { fetchedUsers, groupIdReceived, myUserName });
    } catch (err) {
      console.log(err);
    }
  } else {
    res.redirect("/login");
  }
});


//changing status of a task
app.post("/updateStatus", function (req, res) {
  console.log("Tynza : POST :: /updateStatus route.");
  const checkBoxValue = req.body.checkBox;
  console.log("checkBoxValue : " + checkBoxValue);
  const [itemId , groupId] = checkBoxValue.split("_");

  updateStatus();

  async function updateStatus(){
    try{
      const item = await Item.findOne({_id : itemId});
      console.log("Item name & status is : " + item.name + " " + item.status);
      if(item.status === "no"){
        item.status = "yes";
        await item.save();
        //update database status to yes
      }else{
        item.status = "no";
        await item.save();
      }


      res.redirect(`/groupinfo/${groupId}`);
    }
    catch(error){
      console.log(error);
    }
  }


})




//adding new item to a list
app.post("/groupinfo", function (req, res) {
  console.log("Tynza : POST :: /groupinfo route.");
  if(req.isAuthenticated()){

  const itemToBeAdded = req.body.newItem;
  const groupId = req.body.button;
  const userId =  req.user.id;
  if(itemToBeAdded === ""){
      res.redirect(`/groupinfo/${groupId}`)
  }
  //console.log("id is :" + user.id);


  //add item to the list
  async function addItemToList(){
    try{
      const listDocument = await List.findOne({userId : userId, groupId : groupId});

      const newItemObject = new Item({
        name : itemToBeAdded,
        status : "yes",
        listId : listDocument._id
      })
      await newItemObject.save();
      listDocument.items.push(newItemObject._id);
      await listDocument.save();
      res.redirect(`/groupinfo/${groupId}`)
    }
    catch(err){
      console.log(err);
    }

  }

  addItemToList();


} else{
  console.log("not authenticated user");
  res.redirect("/login");
}

})


//dashboard sowing all the tasks from various groups////
app.get("/home", function (req, res) {
  console.log("Tynza : GET :: /home route.");
  if(req.isAuthenticated()){
    console.log("yes authenticated");

  const userId =  req.user.id;

  async function listAllTasks(){
        try{
            const allLists = await List.find({userId : userId});
            const allTaskItems= [];
            let groupwiseTasks = new Map();
            //console.log(allLists);

            //loop through the fetched lists for a particular user
            for(const list of allLists){
                //console.log(list);
                for(const itemId of list.items){
                  //console.log("item is: " + item);

                  const itemDocument = await Item.findOne({_id : itemId})
                  //console.log("item doc : " + itemDocument);
                  if(itemDocument !== undefined && itemDocument !== null){

                      //console.log("item doc : " + itemDocument);
                      const groupIdOfList = list.groupId;
                      if(groupIdOfList !== undefined || groupIdOfList !== null){
                        //fetch the corresponding group name
                        const fetchedGroupDocument = await Group.findOne({_id : groupIdOfList});
                        const fetchedGroupName = fetchedGroupDocument.name;

                        //add group name and item to a map
                        if(groupwiseTasks.has(fetchedGroupName)){
                          groupwiseTasks.get(fetchedGroupName).tasks.push(itemDocument);
                        }else{
                            groupwiseTasks.set(fetchedGroupName, {
                              groupId: groupIdOfList,
                              tasks: [itemDocument]
                            });
                        }
                      }else{
                        console.log("GroupId is undefined, why?");
                      }

                }
              }
            }

            //printing groupwisetasks map
            // for(const [groupName,groupData] of groupwiseTasks.entries()){
            //   for(const task of groupData.tasks){
            //     console.log("task : " + task.name);
            //   }
            // }


            //console.log("groupwiseTasks : " + groupwiseTasks);
            await res.render("home",{groupwiseTasks : groupwiseTasks});


         }
        catch(err){
          console.log(err);
        }

    }
  listAllTasks();
  }
  else{
    console.log("wait please");
      res.redirect("/login");
  }

})


//create group form GET

app.get("/groupform", function (req, res) {
  console.log("Tynza : GET :: /groupform route.");
  if(req.isAuthenticated()){
    res.render("groupform");
  } else{
    res.redirect("/login");
  }

})


//create group form POST
app.post("/groupform", function (req, res) {
  console.log("Tynza : POST :: /groupform route.");
  if(req.isAuthenticated()){

    const groupName = req.body.groupname;
    let membersString = req.body.members;


    const userId =  req.user.id;

    const group = new Group({
      name : groupName
    })

    updateGroup();
    //group.save();
    //console.log("Group created");
    async function updateGroup() {
      try {
        const myUserDocument = await User.findById(userId);
        const myUserName = myUserDocument.username;

        membersString = membersString + " " + myUserName ;

        const membersArray = membersString.split(" ");
        console.log("All members input : " + membersString);


        for (const member of membersArray) {
          const fetchedUser = await User.findOne({ username: member });
          //console.log("before db comment" + fetchedUser);
          if (fetchedUser) {
            group.members.push(fetchedUser._id);
            fetchedUser.groups.push(group._id);

            const list = new List({
              userId: fetchedUser._id,
              groupId: group._id
            });
            await fetchedUser.save();
            await list.save();
            await group.save();
          } else {
            console.log("Not found in our database.");
          }
        }

      } catch (error) {
        console.error(error);
      }

      const groupIdToBePassed= group._id;
      //const groupIdToBePassed = req.params.parameter;
      await res.redirect(`/groupinfo/${groupIdToBePassed}`);
      console.log("group created");

    }


  } else{
    console.log("unauthenticated user");
    res.redirect("/login");
  }
})


app.get("/groups", async function (req, res) {
  console.log("Tynza : GET :: /groups route.");

  if (req.isAuthenticated()) {
    const userId = req.user.id;

    try {
      const myUserDocument = await User.findById(userId).populate('groups');
      const groupIds = myUserDocument.groups;
      const groupInfo = [];

      for (const groupId of groupIds) {
        const groupDocument = await Group.findById(groupId);
        if (groupDocument) {
          groupInfo.push({
            groupName: groupDocument.name,
            groupId: groupId
          });
        } else {
          console.log("Error fetching group with ID: " + groupId);
        }
      }

      console.log("Tynza: Groupinfo : "+  groupInfo);
      res.render("groups", { groupInfo: groupInfo });

    } catch (err) {
      console.log("Error fetching user or groups: ", err);
      // Handle the error, show an error page, or redirect to an error route.
      // For simplicity, let's redirect to the home page in case of an error.
      res.redirect("/home");
    }
  } else {
    // User is not authenticated, redirect to the login page.
    res.redirect("/login");
  }
});


app.get("/addMemberToGroup", function (req, res) {
    res.redirect("/");
})

app.post("/addMemberToGroup", function functionName(req,res) {
  const member = req.body.newMember;
  const groupIdReceived = req.body.groupIdReceived;
  console.log("Member : " + member);
  console.log("Group : " + groupIdReceived);


  addNewMember();

    async function addNewMember(){
        const fetchedUser = await User.findOne({ username: member });
        console.log(fetchedUser);

        const group = await Group.findById( groupIdReceived);
        console.log(group.name);


        if (fetchedUser) {
          group.members.push(fetchedUser._id);
          fetchedUser.groups.push(group._id);

          const list = new List({
            userId: fetchedUser._id,
            groupId: group._id
          });
          await fetchedUser.save();
          await list.save();
          await group.save();

          //const groupIdToBePassed = req.params.parameter;


        } else {
          console.log("Not found in our database.");
          //await res.redirect(`/groupinfo/${groupIdReceived}`)
      }
      await res.redirect(`/groupinfo/${groupIdReceived}`)

  }

})





app.listen(3000, function () {
  console.log("Server is up and running at port 3000.");
})
