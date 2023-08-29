const Group = require('../models/Group');
const User = require('../models/User');
const Record = require('../models/Record');
const List = require('../models/List');
const Item = require('../models/Item');

async function renderGroupForm(req, res){
  try {
    console.log("Tynza : GET :: /groupform route.");
    if(req.isAuthenticated()){
      res.render("groupform");
    } else{
      res.redirect("/login");
    }
  } catch (e) {
    console.log(e);
  }
}


async function renderGroupInfo(req, res) {
  console.log("Tynza : GET :: /groupinfo/:groupIdToBePassed route.");
  if (req.isAuthenticated()) {
    const userId = req.user.id;
    const groupIdReceived = req.params.groupIdToBePassed;

    try {
      const myUserDocument = await User.findById(userId);
      const myUserName = myUserDocument.username;

      const groupDocument = await Group.findById(groupIdReceived).populate('members');
      const groupName = groupDocument.name;
      const adminName = groupDocument.admin;
      //console.log("Group Docs : " + groupDocument);
      const groupMembers = groupDocument.members;
      //console.log("Group Members : " + groupMembers);
      const fetchedUsers = new Map();

      /////////////////date set for search///////////////////////////
      const today = new Date(); // Get the current date
      //console.log("aaj ki date: " + today);

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

        //console.log("dateobject: " + dateObject);

        let i=1;
        let monthlyScore = 0;
        while(i<=day){
          dateObject.setDate(i);
          //console.log("dateobject: " + dateObject);
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
        //console.log("score monthly: " ,member.username, Math.round(monthlyScore));



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
      await res.render("groupinfo", { fetchedUsers, groupIdReceived, myUserName,groupName,adminName });
    } catch (err) {
      console.log(err);
    }
  } else {
    res.redirect("/login");
  }
}




//create group form POST
 function createGroup(req, res) {
  console.log("Tynza : POST :: /groupform route.");
  if(req.isAuthenticated()){
    console.log("authenticated");
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
            group.admin = myUserName;
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
      await res.redirect(`/groups/groupinfo/${groupIdToBePassed}`);
      console.log("group created");

    }


  } else{
    console.log("unauthenticated user");
    res.redirect("/login");
  }
}


async function fetchAllGroups(req, res) {
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
}

function addMemberToGroup(req,res) {
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

        // const userIndex = group.members.indexOf(fetchedUser._id);
        // console.log("userIndex: " + userIndex);
        // if (userIndex !== -1) {
        //   console.log("addNewMember : User already exists in group.");
        //   await res.redirect(`/groups/groupinfo/${groupIdReceived}`)
        // }else{

        if (fetchedUser) {

          const userIndex = group.members.indexOf(fetchedUser._id);
          console.log("userIndex: " + userIndex);
          if (userIndex !== -1) {
            console.log("addNewMember : User already exists in group.");
            return res.redirect(`/groups/groupinfo/${groupIdReceived}`);
          }

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

      await res.redirect(`/groups/groupinfo/${groupIdReceived}`);


  }

}


async function leaveGroup(req, res) {
  const groupId = req.body.groupId;
  const userId = req.user.id;
  console.log("groupId while leave: " + groupId);
  try {
    // deleting group from user membership array
    const user = await User.findById(userId);
    if (!user) {
      console.log("leaveGroup : User not found while deleting user.");
    }
    // Find the index of the group you want to remove from the user's groups array
    const groupIndex = user.groups.indexOf(groupId);
    if (groupIndex === -1) {
      rconsole.log("leaveGroup : Group not found in user's groups");
    }
    // Remove the group from the user's groups array
    user.groups.splice(groupIndex, 1);
    // Save the updated user document
    await user.save();

    ////////////////////////////part-2/////////////////////////////////
    //deleting user from group members array
    const group = await Group.findById(groupId);
    if (!group) {
      console.log("leaveGroup : Group not found while deleting group.");
    }
    // Find the index of the group you want to remove from the user's groups array
    const userIndex = group.members.indexOf(userId);
    if (userIndex === -1) {
      console.log("leaveGroup : User not found while deleting group.");
    }
    // Remove the group from the user's groups array
    group.members.splice(userIndex, 1);
    // Save the updated user document
    await group.save();

    //////////////deleting list/////////////////////////////
    const list = await List.findOneAndDelete({groupId: groupId , userId : userId});

    //////////////deleting items/////////////////////////////
    const items = await Item.deleteMany({listId : list._id });
    await res.redirect("/groups")

  } catch (error) {
    // Handle errors
    console.error('Error leaving group:', error);
  }
}



module.exports = {
  renderGroupForm,
  renderGroupInfo,
  createGroup,
  fetchAllGroups,
  addMemberToGroup,
  leaveGroup


};
