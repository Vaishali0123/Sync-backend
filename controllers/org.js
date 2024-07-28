const Organization = require("../models/Organization");
const Team = require("../models/Team");
const User = require("../models/User");

exports.fetchallmembers = async (req, res) => {
  try {
    const { orgid } = req.body;
    const org = await Organization.findById(orgid).populate(
      "users",
      "dp name username"
    );
    if (org) {
      let data = [];
      for (let i = 0; i < org.users.length; i++) {
        const dp = process.env.URL + org.users[i].dp;
        let d = {
          dp,
          name: org.users[i].name,
          username: org.users[i].username,
        };
        data.push(d);
      }
      res.status(200).json({ success: true, data });
    } else {
      res.status(404).json({ success: false });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ success: false });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const { orgid, userId } = req.params;
    const { teamname, email } = req.body;

    const organization = await Organization.findById(orgid);

    console.log(organization.title);

    const team = new Team({
      admin: userId,
      email,
      teamname,
      members: [userId],
      totalMembers: 1,
      organization: {
        id: organization._id,
        name: organization.title,
      },
    });

    const savedTeam = await team.save();

    await User.updateOne(
      { _id: userId },
      { $addToSet: { joinedteam: savedTeam._id } }
    );
    await Organization.updateOne(
      { _id: orgid },
      { $addToSet: { teams: savedTeam._id } }
    );

    res
      .status(200)
      .json({ success: true, message: "Team Created Successfully!" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: "Something Went Wrong!" });
  }
};

exports.getteams = async (req, res) => {
  try {
    const { orgid } = req.params;
    const organisation = await Organization.findById(orgid);

    let teams = [];
    //console.log(organisation.teams.length, "organisation.teams.length");
    for (let i = 0; i < organisation.teams.length; i++) {
      const team = await Team.findById(organisation.teams[i])
        .populate({
          path: "members admin totalMembers",
        })
        .populate({
          path: "assignedtasks",
          populate: {
            path: "assignedBy",
            model: "User", // Assuming assignedBy is a reference to the User model
          },
        });
      teams.push(team);
    }
    res.status(200).json({ success: true, teams });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: "Something Went Wrong!" });
  }
};

exports.joinedteam = async (req, res) => {
  try {
    const { teamid, userId } = req.params;

    const user = await User.findById(userId);
    const team = await Team.findById(teamid);

    if (!team) {
      return res
        .status(200)
        .json({ success: false, message: "Team Not Found" });
    }
    await Team.updateOne(
      { _id: team._id },
      { $addToSet: { members: user._id }, $inc: { totalMembers: 1 } }
    );
    await User.updateOne(
      { _id: user._id },
      { $addToSet: { joinedteam: team._id } }
    );

    res
      .status(200)
      .json({ success: true, message: "Team Joined Successfully!" });
  } catch (error) {
    console.log(error);
  }
};
