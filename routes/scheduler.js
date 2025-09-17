const cron = require("node-cron");
const User = require("../models/User");
const sendSms = require("./smsService");

function parseDate(str) {
  // str format: DD.MM.YYYY
  const [day, month, year] = str?.split(".");
  return new Date(`${year}-${month}-${day}`); // convert to JS Date
}

function formatDate(date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function startScheduler() {
  // Run every day at 9 AM
  cron.schedule("* * * * *", async () => {
    const today = formatDate(new Date());
    try {
      const users = await User.find();

      for (const user of users) {
        const doeDate = parseDate(user.DOE);
        const doeStr = formatDate(doeDate);

        if (doeStr === today) {
          const msg = `Hello ${user.name}, your ${user.product} service date ends today.`;
          await sendSms(user.phone, msg);
        }
      }
    } catch (err) {
      console.error("DB Error:", err.message);
    }
  });
}

module.exports = startScheduler;
