const {
  futureHist,
  addSuperTrend,
  addMA,
  addEMA,
  addZlema,
} = require("./testspot");

const { saveTest } = require("./backtestdb/savetest");
const { getTest } = require("./backtestdb/gettest");

const makeDarray = async (start) => {
  const inputs = await futureHist("1d", `${start - 50 * 86400000}`, `${start}`);

  await addMA(inputs);
  await addEMA(inputs);

  await addZlema(inputs);
  await addSuperTrend(inputs);
  return inputs;
};

const makeQarray = async (start, end) => {
  const inputs = await futureHist(
    "15m",
    `${start - 50 * 15 * 60000}`,
    `${end}`
  );

  await addMA(inputs);
  await addEMA(inputs);

  await addZlema(inputs);
  await addSuperTrend(inputs);
  return inputs;
};

const makeMarray = async (start, end) => {
  const inputs = await futureHist("5m", `${start - 20 * 15 * 60000}`, `${end}`);
  await addMA(inputs);
  await addEMA(inputs);

  await addZlema(inputs);
  await addSuperTrend(inputs);
  return inputs;
};

const makeDataSet = async (start, end) => {
  var d1Inputs = await makeDarray(start);
  var m15Inputs = await makeQarray(start, end);
  var m5Inputs = await makeMarray(start, end);

  return { m5Inputs, m15Inputs, d1Inputs };
};

const iterate = async (start, end) => {
  var { m5Inputs, m15Inputs, d1Inputs } = await makeDataSet(start, end);
  var time = start;
  var dataset = [];

  while (time < end) {
    var candle1d = d1Inputs.filter((candle) => candle.timestamp_unix === time);
    var candle15m = m15Inputs.filter(
      (candle) => candle.timestamp_unix === time
    );

    var candle5m = m5Inputs.filter((candle) => candle.timestamp_unix === time);

    if (candle1d[0]) {
      dataset.push(candle1d[0]);
    }

    if (candle15m[0]) {
      dataset.push(candle15m[0]);
    }
    if (candle5m[0]) {
      dataset.push(candle5m[0]);
    }
    time += 60000;
  }

  for (data of dataset) {
    const result = await saveTest(
      data.timestamp_human,
      data.timestamp_unix,
      data.open,
      data.high,
      data.low,
      data.close,
      data.volume,
      data.interval,
      data.MA50,
      data.EMA20,
      data.zlema9,
      data.ST
    );
    console.log(result);
  }
  console.log(dataset);
};

const seperateDays = async (start, end) => {
  let firstMoment;
  let lastMoment;
  var timeTable = [];
  //
  var begin = start;

  while (begin <= end) {
    firstMoment = begin;
    lastMoment = firstMoment + 86394000;
    timeTable.push([firstMoment, lastMoment]);
    begin += 86400000;
  }

  return timeTable;
};

const saveCandlesDB = async (start, end) => {
  const timeTable = await seperateDays(start, end);
  console.log(timeTable);
  for (table of timeTable) {
    try {
      await iterate(table[0], table[1]);
    } catch (error) {
      if (error.message === "Request failed with status code 500") {
        console.log(error.message);
        await iterate(table[0], table[1]);
      } else {
        console.log(error);
      }
    }
  }
};

const Evaluate = async (start, end) => {
  var candles = await getTest(start, end);

  var Positions = [];
  let dayEval = true;

  for (candle of candles) {
    /*==============
     Buy Evaluation
     ===============*/
    //
    /*======================
     1 day candle Evaluation
     =======================*/
    if (candle.interval === "1d") {
      if (candle.MA50 < candle.EMA20) {
        dayEval = true;
      } else if (candle.MA50 > candle.EMA20) {
        dayEval = false;
      }
    }

    if (dayEval === true) {
      /*=========================
     5minute candles evaluation
     ==========================*/

      if (candle.interval === "5m") {
        //  ==============================================
        //   Uptrend Evaluation for opening Long Positions
        //  ==============================================
        if (candle.EMA20 < candle.zlema9) {
          // Previouse Candle assessment
          var prev5mCandle = candles[candles.indexOf(candle) - 1];
          if (
            prev5mCandle.interval === "5m" &&
            prev5mCandle.EMA20 > prev5mCandle.zlema9
          ) {
            // check to see if there is any open position
            if (!Positions[Positions.length - 1]) {
              Positions.push({
                Closed: false,
                trend: "Upward",
                BuyMoment: candle,
                SellMoment: [],
              });
            }
            if (Positions[Positions.length - 1].Closed === true) {
              Positions.push({
                Closed: false,
                trend: "Upward",
                BuyMoment: candle,
                SellMoment: [],
              });
            }
          }
        }

        //  ==================================================
        //   Downtrend Evaluation for opening Short Positions
        //  ==================================================

        if (candle.EMA20 > candle.zlema9) {
          // Previouse Candle assessment
          var prev5mCandle = candles[candles.indexOf(candle) - 1];
          if (
            prev5mCandle.interval === "5m" &&
            prev5mCandle.EMA20 < prev5mCandle.zlema9
          ) {
            // check to see if there is any open position
            if (!Positions[Positions.length - 1]) {
              Positions.push({
                Closed: false,
                trend: "Downward",
                BuyMoment: candle,
                SellMoment: [],
              });
            }
            if (Positions[Positions.length - 1].Closed === true) {
              Positions.push({
                Closed: false,
                trend: "Downward",
                BuyMoment: candle,
                SellMoment: [],
              });
            }
          }
        }
      }
    }
    /*=================
     Sell Evaluation
     ==================*/
    // Evaluate for take profit or stop loss
    // see if the candle is 15minutes
    if (candle.interval === "15m") {
      if (Positions[Positions.length - 1]) {
        if (Positions[Positions.length - 1].Closed === false) {
          // Upward Assessment
          if (Positions[Positions.length - 1].trend === "Upward") {
            if (candle.EMA20 > candle.zlema9) {
              // Previouse Candle assessment

              var prev15mCandle = candles[candles.indexOf(candle) - 4];
              // console.log(prev15mCandle);
              if (
                prev15mCandle.interval === "15m" &&
                prev15mCandle.EMA20 < prev15mCandle.zlema9
              ) {
                // take profit
                Positions[Positions.length - 1].SellMoment.push(candle);
                Positions[Positions.length - 1].action = "CrossProfit";
                Positions[Positions.length - 1].Closed = true;
              }
            }

            //TAKE PROFIT LOGIC
            if (
              (Positions[Positions.length - 1].BuyMoment.open +
                Positions[Positions.length - 1].BuyMoment.close) /
                2 +
                ((Positions[Positions.length - 1].BuyMoment.open +
                  Positions[Positions.length - 1].BuyMoment.close) /
                  2) *
                  0.02 <=
              (candle.open + candle.close) / 2
            ) {
              Positions[Positions.length - 1].SellMoment.push(candle);
              Positions[Positions.length - 1].action = "2%Profit";
              Positions[Positions.length - 1].Closed = true;
            }

            //STOP LOSS LOGIC
            if (
              (Positions[Positions.length - 1].BuyMoment.open +
                Positions[Positions.length - 1].BuyMoment.close) /
                2 -
                ((Positions[Positions.length - 1].BuyMoment.open +
                  Positions[Positions.length - 1].BuyMoment.close) /
                  2) *
                  0.01 >=
              (candle.open + candle.close) / 2
            ) {
              // stop loss
              Positions[Positions.length - 1].SellMoment.push(candle);
              Positions[Positions.length - 1].action = "1%Loss";
              Positions[Positions.length - 1].Closed = true;
              // console.log(2);
            }
          }

          // Downward assessment
          if (Positions[Positions.length - 1].trend === "Downward") {
            if (candle.EMA20 < candle.zlema9) {
              // Previouse Candle assessment

              ///////
              var prev15mCandle = candles[candles.indexOf(candle) - 4];
              // console.log(prev15mCandle);
              if (
                prev15mCandle.interval === "15m" &&
                prev15mCandle.EMA20 > prev15mCandle.zlema9
              ) {
                // take profit
                Positions[Positions.length - 1].SellMoment.push(candle);
                Positions[Positions.length - 1].action = "CrossProfit";
                Positions[Positions.length - 1].Closed = true;
              }
            }

            //TAKE PROFIT LOGIC
            if (
              (Positions[Positions.length - 1].BuyMoment.open +
                Positions[Positions.length - 1].BuyMoment.close) /
                2 -
                ((Positions[Positions.length - 1].BuyMoment.open +
                  Positions[Positions.length - 1].BuyMoment.close) /
                  2) *
                  0.015 >=
              (candle.open + candle.close) / 2
            ) {
              Positions[Positions.length - 1].SellMoment.push(candle);
              Positions[Positions.length - 1].action = "1%Profit";
              Positions[Positions.length - 1].Closed = true;
            }

            //STOP LOSS LOGIC
            if (
              (Positions[Positions.length - 1].BuyMoment.open +
                Positions[Positions.length - 1].BuyMoment.close) /
                2 +
                ((Positions[Positions.length - 1].BuyMoment.open +
                  Positions[Positions.length - 1].BuyMoment.close) /
                  2) *
                  0.005 <=
              (candle.open + candle.close) / 2
            ) {
              // stop loss
              Positions[Positions.length - 1].SellMoment.push(candle);
              Positions[Positions.length - 1].action = "0.5%Loss";
              Positions[Positions.length - 1].Closed = true;
            }
          }
        }
      }
    }
  }

  return Positions;
};

const revenueCalculator = async () => {
  var Positions = await Evaluate();

  var totalrevenue = [];
  Positions.forEach((element) => {
    // console.log(`buy: ${element.BuyMoment}`);
    // console.log(element.Closed);
    // console.log(`actions: ${element.action}`);
    // console.log(`Sell: ${element.SellMoment}`);

    if (element.trend === "Upward") {
      var buyPrice = (element.BuyMoment.open + element.BuyMoment.close) / 2;

      var sellPrice;

      if (element.SellMoment[0] !== undefined) {
        sellPrice =
          (element.SellMoment[0].open + element.SellMoment[0].close) / 2;

        if (sellPrice > buyPrice + buyPrice * 0.02) {
          totalrevenue.push(buyPrice * 0.02 * 0.01);
          //
        } else if (sellPrice < buyPrice - buyPrice * 0.01) {
          totalrevenue.push(-buyPrice * 0.01 * 0.01);
        } else {
          totalrevenue.push((sellPrice - buyPrice) * 0.01);
        }
        // totalrevenue.push((sellPrice - buyPrice) * 0.01);
      }
    }

    // ===============================
    //  Down ward strategy sell moment
    // ===============================

    if (element.trend === "Downward") {
      var buyPrice = (element.BuyMoment.open + element.BuyMoment.close) / 2;

      var sellPrice;

      if (element.SellMoment[0] !== undefined) {
        sellPrice =
          (element.SellMoment[0].open + element.SellMoment[0].close) / 2;
        // to see if the price reached to 1% (sellprice< -buyprice * 1%)
        if (sellPrice < buyPrice - buyPrice * 0.015) {
          totalrevenue.push(buyPrice * 0.01 * 0.015);
          //
        }
        // ==============
        // Stop LOSS downward
        // ===============
        else if (sellPrice > buyPrice + buyPrice * 0.005) {
          totalrevenue.push(-buyPrice * 0.01 * 0.005);
        } else {
          totalrevenue.push((buyPrice - sellPrice) * 0.01);
        }
      }
    }
  });

  try {
    const x = totalrevenue.reduce(
      (accumulator, currentValue) => accumulator + currentValue
    );
    console.log(`sum of revenue: ${x}`);
  } catch (error) {
    if (error.message === "Reduce of empty array with no initial value")
      console.log("No Positions...");
  }

  console.log(totalrevenue);
};
revenueCalculator();
