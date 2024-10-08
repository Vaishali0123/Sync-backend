const Storage = require("../models/Storage");
const User = require("../models/User");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const Organization = require("../models/Organization");
const uuid = require("uuid").v4;
const AWS = require("aws-sdk");

const BUCKET_NAME = process.env.BUCKET_NAME;
const Msgbucket = process.env.MSG_BUCKET;

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

function convertSize(sizeInBytes) {
  // (KB)
  const sizeInKB = sizeInBytes / 1000;

  // (MB)
  const sizeInMB = sizeInKB / 1000;

  // (GB)
  const sizeInGB = sizeInMB / 1000;

  return {
    kb: sizeInKB.toFixed(2),
    mb: sizeInMB.toFixed(2),
    gb: sizeInGB.toFixed(2),
  };
}

exports.fetchstorage = async (req, res) => {
  try {
    const { orgid } = req.params;

    const org = await Organization.findById(orgid);

    if (org) {
      const storage = await Storage.find({ orgid: org._id }).populate(
        "userid",
        "email"
      );

      res
        .status(200)
        .json({ success: true, storage, storageused: org.storageused });
    } else {
      res.status(404).json({ success: false });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};

exports.uploadtostorage = async (req, res) => {
  try {
    const { id, orgid } = req.body;

    const user = await User.findById(id);
    const org = await Organization.findById(orgid);

    if (user && org) {
      const uuidString = uuid();
      const size = convertSize(req.file.size);
      const objectName = `${Date.now()}_${uuidString}_${req.file.originalname}`;
      const result = await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: objectName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );
      const st = new Storage({
        size: size.kb,
        date: new Date(),
        orgid: org._id,
        userid: user._id,
        filename: req.file.originalname,
        objectName: objectName,
      });
      console.log(st, "st");
      await st.save();
      await Organization.updateOne(
        { _id: org._id },
        { $inc: { storageused: size.kb }, $addToSet: { storage: st._id } }
      );
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ success: false });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};

exports.deleteitem = async (req, res) => {
  try {
    const { id, sid } = req.body;

    const org = await Organization.findById(id);

    const st = await Storage.findById(sid);

    if (org) {
      await Organization.updateOne(
        { _id: org._id },
        { $pull: { storage: st._id }, $inc: { storageused: -st.size } }
      );
      await Storage.deleteOne({ _id: st._id });
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ success: false });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};

// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_KEY,
//   region: process.env.BUCKET_REGION,
// });

// const s3 = new AWS.S3();
exports.downloadhandler = async (req, res) => {
  const { key } = req.query;
  console.log(key, "Key");
  const params = {
    Bucket: "nexoo",
    Key: key,
  };

  try {
    const command = new GetObjectCommand(params);
    const data = await s3.send(command);

    // Set headers
    res.setHeader("Content-Type", data.ContentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${key || "defaultpic.png"}"`
    );

    // Stream the file to the response
    data.Body.pipe(res).on("error", (err) => {
      console.error(err);
      res.status(500).json({ error: "Error streaming the file" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to download file from S3" });
  }
};
