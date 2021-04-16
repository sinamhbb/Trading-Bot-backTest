# Trading-Bot-backTest
This Back test bot tests the specified strategy to see if it will be profitable in the specified period.

There is a CSV file that contains 1day, 15 minutes and 5minutes canlde data with four Technical Indicators.
These Indicators are correct and have been tested multiple times. 

The Technical indicaters are:
 1. Super Trend
 2. Moving Average(Length = 50)
 3. Exponential moving Average(Length = 20)
 4. Zero Lag Exponential Moving Average(Length = 9)

Based on correlation between these indicators, The backtesting bot will decide to buy or sell Bitcoin.
