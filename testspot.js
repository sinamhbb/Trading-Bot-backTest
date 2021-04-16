const axios = require("axios");
const crypto = require("crypto");
const HeikinAshi = require("heikinashi");

const spotHist = async (interval, start, end) => {
  var burl = "https://api.binance.com";
  var endPoint = "/api/v3/klines";
  var data;

  var dataQueryString = `symbol=BTCUSDT&interval=${interval}&startTime=${start}&endTime=${end}`;

  var url = `${burl}${endPoint}?${dataQueryString}`;
  console.log(url);
  await axios.get(url).then((response) => (data = response.data));
  var newdata = [];
  data.forEach((candle) => {
    newdata.push({
      timestamp: new Date(candle[0]).toUTCString(),
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    });
  });

  return newdata;
};

const futureHist = async (interval, start, end) => {
  var burl = "https://fapi.binance.com";
  var endPoint = "/fapi/v1/klines";
  var data;

  var dataQueryString = `symbol=BTCUSDT&interval=${interval}&startTime=${start}&endTime=${end}`;

  var url = `${burl}${endPoint}?${dataQueryString}`;
  console.log(url);
  await axios.get(url).then((response) => (data = response.data));
  //   console.log(data[0][0]);
  var newdata = [];
  data.forEach((candle) => {
    newdata.push({
      timestamp_human: new Date(candle[0]).toUTCString(),
      timestamp_unix: parseInt(candle[0]),
      open: parseInt(candle[1]),
      high: parseInt(candle[2]),
      low: parseInt(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      interval,
    });

    // return newdata;
    // console.log(newdata);
  });

  return newdata;
};

const heikinAshiCandle = async () => {
  const inputs = await futureHist("1d", 1609545600000, 1609718340000);
  const jsoninput = JSON.stringify(inputs);
  var output = [];
  console.log(inputs);

  for (input of inputs) {
    await axios
      .post(`https://api.taapi.io/candle`, {
        secret: "",
        backtrack: inputs.length - 1 - inputs.indexOf(input),
        period: 10,
        candles: jsoninput,
        chart: "heikinashi",
      })
      .then(function (response) {
        output.push(response.data);
      });
  }

  console.log(output);
};

const addSuperTrend = async (inputs) => {
  const jsoninput = JSON.stringify(inputs);

  for (input of inputs) {
    await axios
      .post(`https://api.taapi.io/supertrend`, {
        secret: "",
        backtrack: inputs.length - 1 - inputs.indexOf(input),
        period: 10,
        candles: jsoninput,
      })
      .then(function (response) {
        inputs[inputs.indexOf(input)].ST = response.data.value;
      });
  }
};

const addMA = async (inputs) => {
  const jsoninput = JSON.stringify(inputs);

  for (input of inputs) {
    await axios
      .post(`https://api.taapi.io/ma`, {
        secret: "",
        backtrack: inputs.length - 1 - inputs.indexOf(input),
        optInTimePeriod: 50,
        candles: jsoninput,
      })
      .then(function (response) {
        inputs[inputs.indexOf(input)].MA50 = response.data.value;
      });
  }
};
const addEMA = async (inputs, interval) => {
  var indicator;
  if (interval === "15m") indicator = "Q_EMA20";
  if (interval === "5m") indicator = "5m_EMA20";
  const jsoninput = JSON.stringify(inputs);

  for (input of inputs) {
    await axios
      .post(`https://api.taapi.io/ema`, {
        secret: "",
        backtrack: inputs.length - 1 - inputs.indexOf(input),
        optInTimePeriod: 20,
        candles: jsoninput,
      })
      .then(function (response) {
        inputs[inputs.indexOf(input)].EMA20 = response.data.value;
      });
  }
};
const addZlema = async (inputs) => {
  const jsoninput = JSON.stringify(inputs);

  for (input of inputs) {
    await axios
      .post(`https://api.taapi.io/zlema`, {
        secret: "",
        backtrack: inputs.length - 1 - inputs.indexOf(input),
        period: 9,
        candles: jsoninput,
      })
      .then(function (response) {
        inputs[inputs.indexOf(input)].zlema9 = response.data.value;
      });
  }
};

module.exports = {
  spotHist,
  futureHist,
  addSuperTrend,
  addMA,
  addEMA,
  addZlema,
};
