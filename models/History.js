const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const HistoryModel = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "users", required: true },
  donate: { type: Schema.Types.ObjectId, ref: "donates", required: true },
  amount: { type: Number, required: true },
  note: { type: String, required: false },
  date: { type: Date, required: false },
  sessionId: { type: String, required: true },
  status: { type: String, required: true, default: "paying" },
});

module.exports = mongoose.model("histories", HistoryModel);
