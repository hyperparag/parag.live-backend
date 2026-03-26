const express = require("express");
const { addReport, getReport , deleteReport, updateReports  } = require("../reports/controllers");
const verifyAdmin = require("../middleware/adminCheck");
const router = express.Router();



router.post("/", addReport);
router.get("/" , verifyAdmin , getReport);
router.patch("/:id", verifyAdmin , updateReports);
router.delete("/:id", verifyAdmin , deleteReport);

module.exports = router;
