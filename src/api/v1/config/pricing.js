/**
 * Single source of truth for every price and quota in the app.
 *
 * Before this file, PREMIUM_COST lived in product/service.js and the
 * multi-city rate existed only in the browser (postForm.js), which meant
 * multi-city ads were effectively free server-side.
 */
module.exports = {
  // premiumDay (hours) -> cost in credits. 7d / 14d / 30d.
  PREMIUM_COST: { 168: 7, 336: 10, 720: 15 },

  // Charged per city on a multi-city ad.
  MULTI_CITY_RATE: 0.05,

  // Share of a referred user's purchase credited to the referrer.
  REFERRAL_SHARE: 0.5,
};
