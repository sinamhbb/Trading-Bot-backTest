const { Test } = require("./testschema");

async function saveTest(
  timestamp_human,
  timestamp_unix,
  open,
  high,
  low,
  close,
  volume,
  interval,
  MA50,
  EMA20,
  zlema9,
  ST
) {
  const test = new Test({
    timestamp_human,
    timestamp_unix,
    open,
    high,
    low,
    close,
    volume,
    interval,
    MA50,
    EMA20,
    zlema9,
    ST,
  });

  const result = await test.save(function (err) {
    if (err) {
      handleError(err);
    }
  });
  return result;
}

module.exports = { saveTest };
