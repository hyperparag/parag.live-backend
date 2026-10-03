/**
 * One-off backfill: give every existing user a referral code.
 *
 * New accounts get one at signup (users/services.js), but accounts created
 * before the referral programme have none, and the sparse unique index means a
 * missing code is allowed -- so they would simply never be able to refer anyone.
 *
 * Usage:  node seedReferralCodes.js
 */
const mongoose = require("mongoose");
const { dbConnection } = require("./src/api/v1/config");
const { User } = require("./src/api/v1/models");
const { generateReferralCode } = require("./src/api/v1/users/services");

async function main() {
  await dbConnection();

  const pending = await User.find({
    $or: [{ referralCode: { $exists: false } }, { referralCode: null }, { referralCode: "" }],
  })
    .select("_id email")
    .lean()
    .exec();

  console.log(`${pending.length} user(s) need a referral code.`);

  let updated = 0;
  let failed = 0;

  for (const user of pending) {
    try {
      const code = await generateReferralCode();
      await User.updateOne({ _id: user._id }, { $set: { referralCode: code } });
      updated += 1;
      if (updated % 50 === 0) console.log(`  ...${updated} done`);
    } catch (error) {
      failed += 1;
      console.error(`  failed for ${user.email || user._id}:`, error.message);
    }
  }

  console.log(`Done. ${updated} updated, ${failed} failed.`);
  await mongoose.connection.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.connection.close();
  } catch (_) {
    /* already closed */
  }
  process.exit(1);
});
