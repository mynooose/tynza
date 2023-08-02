require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const lodash = require('lodash');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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

mongoose.connect("mongodb://localhost:27017/tynzaDB");

const userSchema = new mongoose.Schema({
  username : String,
  password : String,
  phone : Number,
  name : String,
  googleId : String,
  groups : [{type: mongoose.Schema.Types.ObjectId, ref: 'Group'}]
  //listItems : [itemSchema]
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

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


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    scope: ['profile',"email"]
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(JSON.stringify(profile));
    console.log(profile.emails[0].value);
    User.findOrCreate({ googleId: profile.id, username : profile.emails[0].value, name : profile.displayName }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function (req, res) {
  if(req.isAuthenticated()){
    res.redirect("/home");
  } else{
    res.redirect("/login");
  }
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile',"email"] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {

    // Successful authentication, redirect home.
    res.redirect('/');
  });
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
  status : String,
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
  userId : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
      const groupName = groupDocument.name;
      //console.log("Group Docs : " + groupDocument);
      const groupMembers = groupDocument.members;
      //console.log("Group Members : " + groupMembers);
      const fetchedUsers = new Map();

      /////////////////date set for search///////////////////////////
      const today = new Date(); // Get the current date
      console.log("aaj ki date: " + today);

      const startOfDay = new Date(today);
      // Set the time to 00:00:00 for today's date
      startOfDay.setHours(0, 0, 0, 0);

      // Set the time to 23:59:59 for today's date
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      /////////////////date fetch///////////////////////////

      for (const member of groupMembers) {

        const list = await List.findOne({ userId: member._id, groupId: groupIdReceived }).populate('items');
        //console.log("Tynza : GroupInfo : list is : " + list);



        //////////////////monthly Score of a user(list)/////////////////////////
        const dateObject = new Date();
        const year = dateObject.getFullYear();
        const month = dateObject.getMonth(); // Months are zero-indexed, so add 1
        const day = dateObject.getDate();

        dateObject.setFullYear(year, month, 1);

        console.log("dateobject: " + dateObject);

        let i=1;
        let monthlyScore = 0;
        while(i<=day){
          dateObject.setDate(i);
          console.log("dateobject: " + dateObject);
          const startOfDay = new Date(dateObject);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(dateObject);
          endOfDay.setHours(23, 59, 59, 999);

          const recordWithTodaysDate = await Record.findOne({
            listId: list._id,
            date: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          });

          i++;
          if(!recordWithTodaysDate)
            continue;

          monthlyScore+=recordWithTodaysDate.score;


        }
        console.log("score monthly: " ,member.username, Math.round(monthlyScore));



        //////////////////monthly Score of a user(list)/////////////////////////

        //fetching score for particular list of Today
        const recordWithTodaysDate = await Record.findOne({
          listId: list._id,
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });

        //initial filling the map with empty values
        fetchedUsers.set(member, {
          score : recordWithTodaysDate ? Math.round(recordWithTodaysDate.score) : 0,
          monthlyScore : Math.round(monthlyScore),
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
      await res.render("groupinfo", { fetchedUsers, groupIdReceived, myUserName,groupName });
    } catch (err) {
      console.log(err);
    }
  } else {
    res.redirect("/login");
  }
});





app.post('/deleteTask', function (req, res) {

  if(req.isAuthenticated){
  const groupId = req.body.groupId;
  const taskId = req.body.taskId;

  deleteTaskFromList();

  async function deleteTaskFromList(){
    /////////////////date set for search///////////////////////////
    const today = new Date(); // Get the current date
    console.log("aaj ki date: " + today);

    const startOfDay = new Date(today);
    // Set the time to 00:00:00 for today's date
    startOfDay.setHours(0, 0, 0, 0);

    // Set the time to 23:59:59 for today's date
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    /////////////////date fetch///////////////////////////

    const fetchedItem = await Item.findOne({_id : taskId});
    //const fetchedList = await List.findOne({_id : fetchedItem.listId});

    const fetchedList = await List.findOneAndUpdate({_id : fetchedItem.listId} , {$pull: { items: taskId}},{ new: true });
    const totalTodosLeft = fetchedList.items.length;
    console.log("totalTodosBeforeDeletion : " + totalTodosLeft);

    //fetching score for particular list
    const recordWithTodaysDate = await Record.findOneAndUpdate(
      {
        listId: fetchedItem.listId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        }

      },
      {
        $pull: { 'items': { _id: taskId } },
      },
      { new: true } // This option returns the updated document
    ).exec(); // Add .exec() to actually execute the query

    console.log("recored : " + recordWithTodaysDate);
    let totalCompletedToDos = 0;
    let updatedScore = 0;
    if(recordWithTodaysDate){
       totalCompletedToDos =  recordWithTodaysDate.items.length;
    }
    if(totalTodosLeft){
      updatedScore = totalCompletedToDos/(totalTodosLeft)*100;
    }else{
      updatedScore = 0;
    }


    await Record.updateOne({
        listId: fetchedItem.listId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        }
      },
      {
          $set: { 'score': updatedScore }
      });


    await Item.findOneAndDelete({_id : taskId})
    .then(function () {
       res.redirect(`/groupinfo/${groupId}`);
    })
    .catch(function (error) {
      console.log(error);
    });
  }
}  else {
    res.redirect("/login");
}
});




//changing status of a task
app.post("/updateStatus", function (req, res) {
  console.log("Tynza : POST :: /updateStatus route.");
  const checkBoxValue = req.body.checkBox;
  const requestOrigin = req.body.requestOrigin;
  console.log("checkBoxValue : " + checkBoxValue);
  const [itemId , groupId] = checkBoxValue.split("_");
  const userId =  req.user.id;

  updateStatus();

  async function updateStatus(){
    try{
      const item = await Item.findOne({_id : itemId});
      console.log("Item name & list_id is : " + item.name + " " + item.listId);
      const listDocument = await List.findOne({_id : item.listId});

                          const totalToDos = listDocument.items.length;


                          const today = new Date(); // Get the current date
                          const startOfDay = new Date(today);
                          startOfDay.setHours(0, 0, 0, 0);
                          const endOfDay = new Date(today);
                          endOfDay.setHours(23, 59, 59, 999);

                          // Search for a record with today's date
                          const recordWithTodaysDate = await Record.findOne({
                            listId: item.listId,
                            date: {
                              $gte: startOfDay,
                              $lte: endOfDay,
                            },
                          });


                          const newItem = {
                            _id : itemId,
                            name: item.name,
                            status: "complete", // Set the status as required
                            listId: item.listId,
                          };
                          console.log("totalToDos: " + totalToDos);

                          if (recordWithTodaysDate) {
                            const totalCompletedToDos = recordWithTodaysDate.items.length;
                            console.log("totalToDos: " + totalToDos);
                            console.log("totalCompletedToDos: " + totalCompletedToDos);
                            // Record with today's date exists, check if the item is already present
                            const existingItemIndex = recordWithTodaysDate.items.findIndex(function(item) {
                              return item._id.toString() === itemId; // Modify the condition based on your item identification criteria
                            });

                            if (existingItemIndex !== -1) {
                              // Item already exists, remove it from the array
                              recordWithTodaysDate.score = ((totalCompletedToDos-1)/totalToDos)*100;
                              recordWithTodaysDate.items.splice(existingItemIndex, 1);
                              await recordWithTodaysDate.save();
                              console.log("Item removed from existing record:", newItem);
                            } else {
                              // Item does not exist, push the new item to its items array
                              recordWithTodaysDate.score = ((totalCompletedToDos+1)/totalToDos)*100;
                              recordWithTodaysDate.items.push(newItem);
                              await recordWithTodaysDate.save();
                              console.log("Item added to existing record:", newItem);
                            }
                          } else {
                            // No record found with today's date, create a new record and push the new item
                            const newRecord = new Record({
                              date: today,
                              userId : userId,
                              score: (1/totalToDos)*100, // Set the score as required
                              listId: item.listId,
                              items: [newItem],
                            });
                              console.log("aaj ki date: " + today);
                            await newRecord.save();
                            console.log("New record created with the item:", newItem);
                          }


      if(item.status === "complete"){
        item.status = "pending";
        await item.save();
        //update database status to yes
      }else{
        item.status = "complete";
        await item.save();
      }

      if(requestOrigin === "requestFromGroupInfo"){
        res.redirect(`/groupinfo/${groupId}`);
      }else{
        res.redirect("/home");
      }

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
  //console.log("item is : " + itemToBeAdded);

      if(itemToBeAdded.trim().length === 0){
          console.log("Khaali hai ");
          res.redirect(`/groupinfo/${groupId}`);
      }else {

          //add item to the list
          async function addItemToList(){
            try{
              let listDocument = await List.findOne({userId : userId, groupId : groupId});

              const newItemObject = new Item({
                name : itemToBeAdded,
                status : "pending",
                listId : listDocument._id
              })
              await newItemObject.save();
              listDocument.items.push(newItemObject._id);
              await listDocument.save();
              //////////////score/////////////
              const today = new Date(); // Get the current date
              const startOfDay = new Date(today);
              startOfDay.setHours(0, 0, 0, 0);
              const endOfDay = new Date(today);
              endOfDay.setHours(23, 59, 59, 999);

              listDocument = await List.findOne({userId : userId, groupId : groupId});
              let totalTodosLeft = listDocument.items.length;
              const recordWithTodaysDate = await Record.findOne({
                listId: listDocument._id,
                date: {
                  $gte: startOfDay,
                  $lte: endOfDay,
                },
              });

              let totalCompletedToDos = 0;
              let updatedScore = 0;
              if(recordWithTodaysDate){
                 totalCompletedToDos =  recordWithTodaysDate.items.length;
              }
              if(totalTodosLeft){
                updatedScore = totalCompletedToDos/(totalTodosLeft)*100;
              }else{
                updatedScore = 0;
              }


              await Record.updateOne({
                  listId: listDocument._id,
                  date: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                  }
                },
                {
                    $set: { 'score': updatedScore }
                });




              res.redirect(`/groupinfo/${groupId}`);
            }
            catch(err){
              console.log(err);
            }

          }

          addItemToList();

      }
  //console.log("id is :" + user.id);




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

              /////////////////date set for search///////////////////////////
              const today = new Date(); // Get the current date
              console.log("aaj ki date: " + today);

              const startOfDay = new Date(today);
              // Set the time to 00:00:00 for today's date
              startOfDay.setHours(0, 0, 0, 0);

              // Set the time to 23:59:59 for today's date
              const endOfDay = new Date(today);
              endOfDay.setHours(23, 59, 59, 999);
              /////////////////date fetch///////////////////////////

              //fetching score for particular list
              const recordWithTodaysDate = await Record.findOne({
                listId: list._id,
                date: {
                  $gte: startOfDay,
                  $lte: endOfDay,
                },
              });



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
                        if(groupwiseTasks.has(groupIdOfList)){
                          groupwiseTasks.get(groupIdOfList).tasks.push(itemDocument);
                        }else{
                            groupwiseTasks.set(groupIdOfList, {
                              groupName : fetchedGroupName,
                              groupId: groupIdOfList,
                              score: recordWithTodaysDate ? Math.round(recordWithTodaysDate.score) : 0,
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

    createOrUpdateGroup();
    //group.save();
    //console.log("Group created");
    async function createOrUpdateGroup() {
      try {
        const myUserDocument = await User.findById(userId);
        const myUserName = myUserDocument.username;

        membersString = membersString + "," + myUserName ;

        const membersArray = membersString.split(",");
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


async function updateTaskStatusRegularly() {
  // Your function code here
  console.log('This function will be called at the specified time every day.');

  const allItems = await Item.find();
  console.log(allItems);
  for(const item of allItems){
    item.status = "pending";
    await item.save();
  }



}

function scheduleFunctionAtSpecificTime(hour, minute) {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour);
  scheduledTime.setMinutes(minute);
  scheduledTime.setSeconds(0);

  // Calculate the time remaining until the next occurrence
  let timeUntilNextOccurrence = scheduledTime.getTime() - now.getTime();
  if (timeUntilNextOccurrence < 0) {
    // If the scheduled time has already passed today, add 24 hours to schedule for the next day
    timeUntilNextOccurrence += 24 * 60 * 60 * 1000;
  }

  // Schedule the first function call at the specified time
  setTimeout(() => {
    updateTaskStatusRegularly();
    // Schedule the next function call to repeat daily
    setInterval(updateTaskStatusRegularly, 24 * 60 * 60 * 1000);
  }, timeUntilNextOccurrence);
}

// Call the scheduleFunctionAtSpecificTime function with the desired hour and minute
scheduleFunctionAtSpecificTime(10, 44); // This will call yourFunction at 12:30 PM every day





app.listen(3000, function () {
  console.log("Server is up and running at port 3000.");
})
