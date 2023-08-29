const Item = require('../models/Item');


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

module.exports = {
  scheduleFunctionAtSpecificTime
};
