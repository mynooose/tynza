const Group = require('../models/Group');
const User = require('../models/User');
const Record = require('../models/Record');
const List = require('../models/List');
const Item = require('../models/Item');


//dashboard sowing all the tasks from various groups////
function renderHomePage (req, res) {
  console.log("Tynza : GET :: /home route.");
  if(req.isAuthenticated()){
    console.log("yes authenticated");

  const userId =  req.user.id;
  let itemCount = 0;

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
              //console.log("aaj ki date: " + today);

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
                      itemCount++;
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
            console.log("itemCount" + itemCount);
            //await res.render("home",{groupwiseTasks : groupwiseTasks});
            if(itemCount){
              await res.render("home",{groupwiseTasks : groupwiseTasks});
            }
            else{
              await res.render("homeEmpty");
            }

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

}


module.exports = {
renderHomePage
};
