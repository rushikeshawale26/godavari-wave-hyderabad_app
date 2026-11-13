const { createModel, requireFields } = require("./postgresModel");

module.exports = createModel({
  tableName: "chatconversations",
  defaults: {
    messages: [],
    userQuestionsCount: 0,
    unansweredCount: 0,
    lastQuestion: "",
    lastReply: "",
  },
  normalize(document) {
    document.lastMessageAt = document.lastMessageAt || new Date().toISOString();
  },
  validate(document) {
    requireFields(document, ["sessionId"]);
    if (!Array.isArray(document.messages)) {
      throw new Error("Messages must be an array");
    }
  },
});
