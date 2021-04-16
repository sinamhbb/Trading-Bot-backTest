const { Test } = require("./testschema");

const deleteAllTestData = async () => {
  const result = await Test.deleteMany({ interval: "1d" });
  console.log(result);
};

// deleteAllTestData();
