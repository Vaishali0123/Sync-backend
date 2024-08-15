const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  signup,
  signin,
  forgotpass,
  updatedetails,
  getuserdata,
} = require("../controllers/userAuth");
const { members } = require("../controllers/members");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/signup", upload.single("dp"), signup);
router.post("/signin", signin);
router.post("/forgotpass", forgotpass);
router.post("/updatedetails", updatedetails);
router.get("/getmembers/:userid/:orgid", members);
router.get("/getuserdata/:id", getuserdata);

module.exports = router;
