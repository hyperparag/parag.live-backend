const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(
    __dirname,
    `../../../../${process.env.NODE_ENV ?? ""}.env`,
  ),
});
// nrrabby871_db_user
// rqHlneR3X2mOHrzc
module.exports = {
  NODE_ENV: process.env.NODE_ENV || "dev",
  HOST: process.env.HOST || "localhost",
  PORT: process.env.PORT || 5000,
  dbConnection: () =>
    mongoose
      .connect(
        "mongodb+srv://parag0045_db_user:DHitZqC50v1XPGpl@cluster0.tvtilag.mongodb.net/skipthegames?appName=Cluster0",
      )
      .then(console.log(`DB connection successfull`))
      .catch((error) => console.log(`Error to connect DB: ${error.message}`)),
};
