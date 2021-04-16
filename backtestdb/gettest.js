const { Test } = require("./testschema");

const getTest = async (start, end) => {
  const test = await Test.find({
    timestamp_unix: { $gte: start, $lte: end },
  }).sort({
    timestamp_unix: 1,
  });
  return test;
};

module.exports = { getTest };
