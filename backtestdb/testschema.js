const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost/test")
  .then(() => console.log(mongoose.connection.readyState))
  .catch((err) => console.log("Could not connect to the dataBase...", err));

const TestSchema = new mongoose.Schema({
  timestamp_human: Date,
  timestamp_unix: Number,
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
  interval: String,
  MA50: Number,
  EMA20: Number,
  zlema9: Number,
  ST: Number,
});

const Test = mongoose.model("test", TestSchema);

module.exports = { Test };
