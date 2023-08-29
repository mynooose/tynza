const Group = require('../models/Group');
const User = require('../models/User');
const Record = require('../models/Record');
const List = require('../models/List');
const Item = require('../models/Item');
//const _ = require('lodash');


//adding new item to a list
function addNewItem(req, res) {
  console.log("Tynza : POST :: /groupinfo route.");
  if(req.isAuthenticated()){

  const itemToBeAdded = req.body.newItem;
  const groupId = req.body.button;
  const userId =  req.user.id;
  console.log("userId :" + userId);
  console.log("groupId :" + groupId);
  //console.log("item is : " + itemToBeAdded);

      if(itemToBeAdded.trim().length === 0){
          console.log("Khaali hai ");
          res.redirect(`/groups/groupinfo/${groupId}`);
      }else {

          //add item to the list
          async function addItemToList(){
            try{
              let listDocument = await List.findOne({userId : userId, groupId : groupId});
              console.log("listDocument :" + listDocument);
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




              res.redirect(`/groups/groupinfo/${groupId}`);
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

}




//deleteTask
function deleteTask(req, res) {

  if(req.isAuthenticated){
  const groupId = req.body.groupId;
  const taskId = req.body.taskId;

  deleteTaskFromList();

  async function deleteTaskFromList(){
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

    const fetchedItem = await Item.findOne({_id : taskId});
    //const fetchedList = await List.findOne({_id : fetchedItem.listId});

    const fetchedList = await List.findOneAndUpdate({_id : fetchedItem.listId} , {$pull: { items: taskId}},{ new: true });
    const totalTodosLeft = fetchedList.items.length;
    //console.log("totalTodosBeforeDeletion : " + totalTodosLeft);

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

    //console.log("recored : " + recordWithTodaysDate);
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
       res.redirect(`/groups/groupinfo/${groupId}`);
    })
    .catch(function (error) {
      console.log(error);
    });
  }
}  else {
    res.redirect("/login");
}
}

//changing status of a task
function updateTaskStatus(req, res) {
  console.log("Tynza : POST :: /updateStatus route.");
  const checkBoxValue = req.body.checkBox;
  const requestOrigin = req.body.requestOrigin;
  console.log("checkBoxValue : " + checkBoxValue);
  console.log("requestOrigin : " + requestOrigin);
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
                              //console.log("aaj ki date: " + today);
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
        res.redirect(`/groups/groupinfo/${groupId}`);
      }else{
        res.redirect("/home");
      }

    }
    catch(error){
      console.log(error);
    }
  }


}


module.exports = {
  addNewItem,
  deleteTask,
  updateTaskStatus
};
