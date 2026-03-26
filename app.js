const express = require("express");
const cors = require("cors");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { readdirSync } = require("fs");
const bodyParser = require("body-parser");
require("dotenv").config();
const csrfProtection = csrf({ cookie: true });

const app = express();
require("./src/api/v1/config").dbConnection();

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: "10mb",
  })
);
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   next();
// });
app.options("*", cors(corsOptions));

app.use(cookieParser());
app.use(morgan("dev"));

// app.use(csrfProtection);

readdirSync("./src/api/v1/routes").map((route) =>
  app.use(
    `/api/${route.split(".")[0]}`,
    require(`./src/api/v1/routes/${route}`)
  )
);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: "" });
});
app.get("/", (req, res) => {
  res.json({ message: "server is running" });
});

module.exports = app;
