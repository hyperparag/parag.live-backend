const moment = require("moment");
const { Product } = require("../models");

// for today
const startOfDay = moment().startOf("day");
const endOfDay = moment().endOf("day");
// for yesterday
const today = moment();
const yesterday = moment().subtract(1, "days");
const threeDaysAgo = moment().subtract(3, "days").startOf("day");
// 15 days
const fifteenDaysAgo = moment().subtract(15, "days").startOf("day");
// last 7 days
const sevenDaysAgo = moment().subtract(6, "days");
// for this month
const startOfMonth = moment().startOf("month");
const endOfMonth = moment().endOf("month");
// last month
const currentMonthStartDate = moment().startOf("month");
const lastMonthStartDate = moment(currentMonthStartDate)
  .subtract(1, "months")
  .startOf("month");

// if (date == "today") {
//   newDate = {
//     $gte: startOfDay.toDate(),
//     $lte: endOfDay.toDate(),
//   };
// }

// if (date == "last3days") {
//   newDate = {
//     $gte: threeDaysAgo.startOf("day").toDate(),
//   };
// }
// if (date == "last3days") {
//   newDate = {
//     $gte: sevenDaysAgo.startOf("day").toDate(),
//   };
// }

// if (date == "thismonth") {
//   newDate = {
//     $gte: startOfMonth.toDate(),
//     $lte: endOfMonth.toDate(),
//   };
// }
// if (date == "lastmonth") {
//   newDate = {
//     $gte: lastMonthStartDate.toDate(),
//     $lt: currentMonthStartDate.toDate(),
//   };
// }

exports.getToday = async (req, res) => {
  let newDate = {
    $gte: startOfDay.toDate(),
    $lte: endOfDay.toDate(),
  };

  try {
    const allProducts = await Product.find({
      createdAt: newDate,
    });
    res.send(allProducts);
  } catch (error) {
    console.log(error);
    res.status(400).json("error");
  }
};

exports.getYesterDay = async (req, res) => {
  let newDate = {
    $gte: yesterday.startOf("day").toDate(),
    $lt: today.startOf("day").toDate(),
  };
  try {
    const allProducts = await Product.find({
      createdAt: newDate,
    });
    res.send(allProducts);
  } catch (error) {
    console.log(error);
    res.status(400).json("error");
  }
};

exports.getLast3Days = async (req, res) => {
  let newDate = {
    $gte: threeDaysAgo.toDate(),
    $lte: endOfDay.toDate(),
  };
  try {
    const allProducts = await Product.find({
      createdAt: newDate,
    });
    res.send(allProducts);
  } catch (error) {
    console.log(error);
    res.status(400).json("error");
  }
};
exports.getLast7Days = async (req, res) => {
  let newDate = {
    $gte: sevenDaysAgo.toDate(),
    $lte: endOfDay.toDate(),
  };
  try {
    const allProducts = await Product.find({
      createdAt: newDate,
    });
    res.send(allProducts);
  } catch (error) {
    console.log(error);
    res.status(400).json("error");
  }
};
exports.getLast15Days = async (req, res) => {
  let newDate = {
    $gte: fifteenDaysAgo.toDate(),
    $lte: endOfDay.toDate(),
  };
  try {
    const allProducts = await Product.find({
      createdAt: newDate,
    });
    res.send(allProducts);
  } catch (error) {
    console.log(error);
    res.status(400).json("error");
  }
};

exports.getThisMonths = async (req, res) => {
  let newDate = {
    $gte: startOfMonth.toDate(),
    $lte: endOfMonth.toDate(),
  };
  try {
    const allProducts = await Product.find({
      createdAt: newDate,
    });
    res.send(allProducts);
  } catch (error) {
    console.log(error);
    res.status(400).json("error");
  }
};
exports.getLastMonths = async (req, res) => {
  let newDate = {
    $gte: lastMonthStartDate.toDate(),
    $lt: currentMonthStartDate.toDate(),
  };
  try {
    const allProducts = await Product.find({
      createdAt: newDate,
    });
    res.send(allProducts);
  } catch (error) {
    console.log(error);
    res.status(400).json("error");
  }
};
