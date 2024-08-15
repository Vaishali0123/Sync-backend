const User = require("../models/User");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const aesjs = require("aes-js");
const Organization = require("../models/Organization");
const uuid = require("uuid").v4;
const jwt = require("jsonwebtoken");

const BUCKET_NAME = process.env.BUCKET_NAME;
const Msgbucket = process.env.MSG_BUCKET;

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});
let k = [16, 12, 3, 7, 9, 5, 11, 6, 3, 2, 10, 1, 13, 3, 13, 4];

//encryption and decryption
const encryptaes = (data) => {
  try {
    const textBytes = aesjs.utils.utf8.toBytes(data);
    const aesCtr = new aesjs.ModeOfOperation.ctr(k, new aesjs.Counter(5));
    const encryptedBytes = aesCtr.encrypt(textBytes);
    const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
    return encryptedHex;
  } catch (e) {
    console.log(e);
  }
};

function generateAccessToken(data) {
  const access_token = jwt.sign(data, process.env.MY_SECRET_KEY, {
    expiresIn: "5d",
  });
  return access_token;
}
function generateRefreshToken(data) {
  const refresh_token = jwt.sign(data, process.env.MY_SECRET_KEY, {
    expiresIn: "10d",
  });
  return refresh_token;
}

const decryptaes = (data) => {
  try {
    if (data === undefined) {
      throw new Error("Invalid data for decryption");
    }

    let d;
    if (typeof data !== "string") {
      d = JSON.stringify(data);
    } else {
      d = data;
    }

    const encryptedBytes = aesjs.utils.hex.toBytes(d);

    if (encryptedBytes.some(isNaN)) {
      throw new Error("Invalid data for decryption");
    }

    const aesCtr = new aesjs.ModeOfOperation.ctr(k, new aesjs.Counter(5));
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);

    if (decryptedBytes.some(isNaN)) {
      throw new Error("Invalid data after decryption");
    }

    const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
    return decryptedText;
  } catch (e) {
    console.error("Decryption error:", e);
    throw new Error("Decryption failed");
  }
};

// exports.signup = async (req, res) => {
//   try {
//     const { email, jobrole, password, org, username } = req.body;

//     const em = await User.findOne({ email });
//     if (em) {
//       //when user already exists with same email
//       res.status(200).json({ data: em, userexists: true, success: true });
//     } else {
//       //when user doesn't exists
//       // const encrpypass = encryptaes(password);
//       const uuidString = uuid();
//       let objectName = "default.png";
//       if (req.file) {
//         objectName = `${Date.now()}_${uuidString}_${req.file.originalname}`;
//         const result = await s3.send(
//           new PutObjectCommand({
//             Bucket: BUCKET_NAME,
//             Key: objectName,
//             Body: req.file.buffer,
//             ContentType: req.file.mimetype,
//           })
//         );
//       }

//       const organization = await Organization.findOne({ title: org });

//       if (organization) {
//         const user = new User({
//           email,
//           jobrole,
//           password: password,
//           dp: objectName,

//           name: username,
//         });
//         await user.save();
//         await Organization.updateOne(
//           { _id: organization._id },
//           { $addToSet: { users: user._id }, $inc: { userscount: 1 } }
//         );
//         await User.updateOne(
//           { _id: user._id },
//           {
//             $addToSet: {
//               organization: organization.title,
//               orgid: organization._id,
//             },
//           }
//         );
//       } else {
//         const user = new User({
//           email,
//           jobrole,
//           password: password,
//           dp: objectName,
//           name: username,
//         });
//         await user.save();
//         const or = new Organization({ title: org, creator: user._id });
//         await or.save();
//         await User.updateOne(
//           { _id: user._id },
//           { $addToSet: { orgid: or._id, organization: or.title } }
//         );
//         await Organization.updateOne(
//           { _id: or._id },
//           { $addToSet: { users: user._id }, $inc: { userscount: 1 } }
//         );
//       }

//       res.status(200).json({ success: true });
//     }
//   } catch (e) {
//     console.log(e);
//     res.status(400).json({ success: false });
//   }
// };

// exports.signin = async (req, res) => {
//   try {
//     const { email, pass, org } = req.body;

//     const user = await User.findOne({ email });

//     if (user) {
//       //  const decp = decryptaes(user.password);

//       if (user.password === pass && user.organization.includes(org)) {
//         res.status(200).json({ user, success: true });
//       } else {
//         res.status(203).json({ success: false, message: "Incorrect Password" });
//       }
//     } else {
//       res.status(404).json({ success: false });
//     }
//   } catch (e) {
//     console.log(e);
//     res.status(400).json({ success: false });
//   }
// };

exports.forgotpass = async (req, res) => {
  try {
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};

// updated
exports.signup = async (req, res) => {
  try {
    const { email, jobrole, password, org, username } = req.body;

    const user = await User.findOne({ email: email });
    if (user) {
      const data = {
        id: user?._id,
        organization: user?.organization,
        admin: user?.admin,
        dp: process.env.URL + user?.dp,
        username: user?.username,
        name: user?.name,
        orgid: user?.orgid,
        jobrole: user?.jobrole,
      };

      const access_token = generateAccessToken(data);
      const refresh_token = generateRefreshToken(data);
      
      res
        .status(200)
        .json({ data: user, success: true, data, access_token, refresh_token });
      //when user already exists with same email
    } else {
      let savedUser;
      const uuidString = uuid();
      let objectName = "default.png";
      if (req.file) {
        objectName = `${Date.now()}_${uuidString}_${req.file.originalname}`;
        const result = await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          })
        );
      }

      const organization = await Organization.findOne({ title: org });

      if (organization) {
        const user = new User({
          email,
          jobrole,
          password: password,
          dp: objectName,
          name: username,
        });
        await user.save();
        await Organization.updateOne(
          { _id: organization._id },
          { $addToSet: { users: user._id }, $inc: { userscount: 1 } }
        );
        await User.updateOne(
          { _id: user._id },
          {
            $addToSet: {
              organization: organization.title,
              orgid: organization._id,
            },
          }
        );
      } else {
        const user = new User({
          email,
          jobrole,
          password: password,
          dp: objectName,
          name: username,
        });
        savedUser = await user.save();
        const or = new Organization({ title: org, creator: user._id });
        await or.save();
        await User.updateOne(
          { _id: user._id },
          { $addToSet: { orgid: or._id, organization: or.title } }
        );
        await Organization.updateOne(
          { _id: or._id },
          { $addToSet: { users: user._id }, $inc: { userscount: 1 } }
        );
      }

      const data = {
        id: savedUser?._id,
        organization: savedUser?.organization,
        orgid: savedUser?.orgid,
        admin: savedUser?.admin,
        dp: process.env.URL + savedUser?.dp,
        username: savedUser?.username,
        name: savedUser?.name,
        jobrole: savedUser?.jobrole,
      };

      const access_token = generateAccessToken(data);
      const refresh_token = generateRefreshToken(data);

      res.status(200).json({ success: true, access_token, refresh_token });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};

// updated
exports.signin = async (req, res) => {
  try {
    const { email, pass, org } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      if (user.password === pass && user.organization.includes(org)) {
        const data = {
          id: user?._id,
          organization: user?.organization,
          admin: user?.admin,
          dp: process.env.URL + user?.dp,
          username: user?.username,
          name: user?.name,
          orgid: user?.orgid,
          jobrole: user?.jobrole,
        };

        const access_token = generateAccessToken(data);
        const refresh_token = generateRefreshToken(data);

        res
          .status(200)
          .json({ user, success: true, data, access_token, refresh_token });
      } else {
        res.status(203).json({ success: false, message: "Incorrect Details" });
      }
    } else {
      res.status(204).json({ success: false, message: "User not found" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//update details
exports.updatedetails = async (req, res) => {
  try {
    const { id, email, password, role, name } = req.body;
    const user = await User.findById(id);
    if (user) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: { email: email, password: password, jobrole: role, name: name },
        }
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

// get userdata
exports.getuserdata = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user) {
      console.log(user?.dp);
      const profile=process.env.URL+user?.dp;
      res.status(200).json({ success: true, user,profile });
    } else {
      res.status(304).json({ success: false });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};
3