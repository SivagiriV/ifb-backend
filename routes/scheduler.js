const cron = require("node-cron");
const User = require("../models/User");
const sendSms = require("./smsService");

function parseDate(str) {
  if (!str) return null; // prevent crash
  const [day, month, year] = str.split(".");
  if (!day || !month || !year) return null;
  return new Date(`${year}-${month}-${day}`);
}

function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return null;
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function startScheduler() {
  // For testing: every minute. Change to "0 9 * * *" for 9AM daily
  cron.schedule("* * * * *", async () => {
    const today = formatDate(new Date());
    console.log("⏰ Cron running at", today);

    try {
      const users = await User.find();
      if (!Array.isArray(users)) {
        console.error("❌ User.find() did not return array:", users);
        return;
      }

      for (const user of users) {
        const doeDate = parseDate(user.DOE);
        const doeStr = doeDate ? formatDate(doeDate) : null;

        console.log("Checking user:", user.name, "DOE:", doeStr);

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
