const mongoose = require("mongoose");

const chatTurnSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    source: {
      type: String,
      enum: ["ai", "fallback"],
      default: "fallback",
    },
    isFallback: {
      type: Boolean,
      default: false,
    },
    needsHumanSupport: {
      type: Boolean,
      default: false,
    },
    failedOrUnanswered: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const chatConversationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    messages: {
      type: [chatTurnSchema],
      default: [],
    },
    userQuestionsCount: {
      type: Number,
      default: 0,
    },
    unansweredCount: {
      type: Number,
      default: 0,
    },
    lastQuestion: {
      type: String,
      default: "",
      trim: true,
    },
    lastReply: {
      type: String,
      default: "",
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "chatconversations",
  }
);

chatConversationSchema.index({ lastMessageAt: -1 });
chatConversationSchema.index({ unansweredCount: -1, lastMessageAt: -1 });

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
