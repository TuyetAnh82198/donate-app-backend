const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserModel = new Schema({
  email: { type: String, required: true },
  pass: { type: String, required: false },
  role: { type: String, required: true, default: "client" },
  code: { type: String, required: false },
  date: { type: Date, required: false },
});

module.exports = mongoose.model("users", UserModel);
