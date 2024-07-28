const Conversations = require("../models/Conversations");
const Message = require("../models/Message");
const User = require("../models/User");

exports.conversations = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    let conversation;
    let savedConversation;
    conversation = await Conversations.findOne({
      members: { $all: [senderId, receiverId] },
    });
    if (!conversation) {
      conversation = new Conversations({
        members: [senderId, receiverId],
      });
      savedConversation = await conversation.save();
      res.status(204).json({
        message: "Conversation created",
        convId: savedConversation._id,
      });
    } else {
      res
        .status(202)
        .json({ message: "Already exist", convId: conversation._id });
    }

    // res.status(200).json({ message: "Conversation updated" });
  } catch (e) {
    console.error("No conversation fetched", e);
    res.status(400).json({ e: "Error in Fetching conversation" });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { receiverId } = req.params;
    // receiverID=myid
    let conversation = await Conversations.find({
      members: { $in: [receiverId] },
    });

    if (!conversation) {
      return res.status(201).json({
        success: true,
        message: "No conversation exists",
      });
    } else {
      const data = [];
      for (let i = 0; i < conversation.length; i++) {
        let frndname = "";
        let email = "";
        const lastMessageId =
          conversation[i].message[conversation[i].message.length - 1];
        let lastText = "";
        if (conversation[i].members[0] != receiverId) {
          const senderid = await User.findById(conversation[i].members[0]);
          console.log(senderid, "senderid0");
          if (senderid) {
            frndname = senderid.name;
            email = senderid.email;
          }
        } else {
          const senderid = await User.findById(conversation[i].members[1]);
          console.log(senderid, "senderid1");
          if (senderid) {
            frndname = senderid.name;
            email = senderid.email;
          }
        }
        if (lastMessageId) {
          const lastMessage = await Message.findById(lastMessageId);
          if (lastMessage) {
            lastText = lastMessage.text;
          }
        }

        const myData = {
          _id: conversation._id,
          members: conversation.members,
          lastMessageText: lastText,
          frndname: frndname,
          email: email,
        };

        data.push(myData);
      }

      return res.status(200).json({
        success: true,
        message: "Conversation found",
        data: data,
      });
    }
  } catch (e) {
    console.error("Error fetching or creating conversation", e);
    return res.status(500).json({
      success: true,
      message: "Error fetching or creating conversation",
    });
  }
};
