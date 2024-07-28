const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  fetchallmembers,
  createTeam,
  getteams,
  joinedteam,
} = require("../controllers/org");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/fetchallmembers", fetchallmembers);
router.post("/v1/createteam/:userId/:orgid", createTeam);
router.get("/getteams/:orgid", getteams);
router.post("/joinedteam/:userId/:teamid", joinedteam);

module.exports = router;
