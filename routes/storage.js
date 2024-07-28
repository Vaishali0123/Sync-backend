const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  fetchstorage,
  uploadtostorage,
  deleteitem,
} = require("../controllers/storage");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/fetchstorage/:orgid", fetchstorage);
router.post("/uploadtostorage", upload.single("file"), uploadtostorage);
router.post("/deleteitem", deleteitem);

module.exports = router;
