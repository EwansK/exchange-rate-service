const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BCCH_API_URL = 'https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx';
const BCCH_USER = process.env.BCCH_API_USER;
const BCCH_PASS = process.env.BCCH_API_PASS;

const CURRENCY_SERIES = {
  USD: 'F073.TCO.PRE.Z.D', // Daily USD exchange rate
  // EUR: 'F073.TCO.PRE.EUR.D' // Daily EUR exchange rate
};

let exchangeRatesCache = {
  rates: { USD: null }, // EUR removed
  lastUpdated: null
};

const getExchangeRatesCache = () => exchangeRatesCache;

// Helper to parse "dd-mm-yyyy" string to Date object
const parseDDMMYYYY = (str) => {
  const [day, month, year] = str.split('-');
  return new Date(`${year}-${month}-${day}`);
};

// Get the "last available date" as today unless it's weekend
const getLastAvailableDate = () => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0) today.setDate(today.getDate() - 2); // Sunday -> Friday
  else if (day === 6) today.setDate(today.getDate() - 1); // Saturday -> Friday
  return today;
};

// Fetch exchange rate for a given currency and date (Date object)
const fetchExchangeRate = async (currency, date) => {
  try {
    const seriesCode = CURRENCY_SERIES[currency];
    if (!seriesCode) throw new Error(`Unsupported currency: ${currency}`);

    const dateStr = date.toISOString().split('T')[0];
    console.log(`Trying ${currency} for date ${dateStr}`);

    const response = await axios.get(BCCH_API_URL, {
      params: {
        user: BCCH_USER,
        pass: BCCH_PASS,
        function: 'GetSeries',
        timeseries: seriesCode,
        firstdate: dateStr,
        lastdate: dateStr
      }
    });

    const observations = response.data.Series.Obs;
    if (!observations || observations.length === 0) {
      throw new Error(`No data available for ${currency}`);
    }

    const matchedObs = observations.find(obs => {
      const obsDate = parseDDMMYYYY(obs.indexDateString);
      return obsDate.toISOString().split('T')[0] === dateStr;
    });

    if (!matchedObs) {
      throw new Error(`No matching data for ${currency} on ${dateStr}`);
    }

    return parseFloat(matchedObs.value);
  } catch (error) {
    throw new Error(`Error fetching ${currency} exchange rate: ${error.message}`);
  }
};

// Try to fetch exchange rate for today or fallback up to 5 days back if no data
const fetchExchangeRateWithFallback = async (currency) => {
  const maxDaysBack = 5;
  let date = getLastAvailableDate();

  for (let i = 0; i <= maxDaysBack; i++) {
    try {
      return await fetchExchangeRate(currency, date);
    } catch (err) {
      date.setDate(date.getDate() - 1); // Try previous day
    }
  }
  throw new Error(`No data available for ${currency} in the past ${maxDaysBack} days`);
};

// Update cache for all currencies
const updateExchangeRates = async () => {
  try {
    const rates = {};
    for (const currency of Object.keys(CURRENCY_SERIES)) {
      rates[currency] = await fetchExchangeRateWithFallback(currency);
    }
    exchangeRatesCache = {
      rates,
      lastUpdated: new Date()
    };
    console.log('Exchange rates updated:', exchangeRatesCache);
    return exchangeRatesCache;
  } catch (error) {
    throw new Error(`Error updating exchange rates: ${error.message}`);
  }
};

module.exports = {
  updateExchangeRates,
  getExchangeRatesCache,
  fetchExchangeRate
};
