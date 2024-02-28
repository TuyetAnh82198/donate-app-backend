const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const DonateModel = new Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  amount: { type: Number, required: true },
  currentAmount: { type: Number, required: true, default: 0 },
  type: { type: String, required: true },
  endDate: { type: Date, required: true },
  img: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
  isDelete: { type: Boolean, required: false },
});

module.exports = mongoose.model("donates", DonateModel);
