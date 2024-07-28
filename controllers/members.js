const User = require("../models/User");
exports.members = async (req, res) => {
  try {
    const { orgid } = req.params;
    const data = await User.find({ orgid: orgid });
    res.status(200).json(data);
  } catch (e) {
    console.error("No data fetched", e);
    res.status(400).json({ e: "Error in Fetching Data" });
  }
};
