const { parsePhoneNumberFromString } = require("libphonenumber-js");

function parsePhoneToE164(raw, defaultCountry = "IN") {
  // default India; change to your user base
  if (!raw) return null;
  const num = parsePhoneNumberFromString(raw, defaultCountry);
  return num ? num.number : null; // E.164
}
module.exports = { parsePhoneToE164 };
