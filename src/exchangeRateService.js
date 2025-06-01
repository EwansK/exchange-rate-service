const axios = require('axios');
   const dotenv = require('dotenv');

   dotenv.config();

   const BCCH_API_URL = 'https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx';
   const BCCH_USER = process.env.BCCH_API_USER;
   const BCCH_PASS = process.env.BCCH_API_PASS;

   const CURRENCY_SERIES = {
     USD: 'F073.TCO.PRE.Z.D', // Daily USD exchange rate
     EUR: 'F073.TCO.PRE.EUR.D' // Daily EUR exchange rate
   };

   let exchangeRatesCache = {
     rates: { USD: null, EUR: null },
     lastUpdated: null
   };

   const getTodayDate = () => {
     const today = new Date();
     return today.toISOString().split('T')[0];
   };

   const fetchExchangeRate = async (currency) => {
     try {
       const seriesCode = CURRENCY_SERIES[currency];
       if (!seriesCode) throw new Error(`Unsupported currency: ${currency}`);

       const response = await axios.get(BCCH_API_URL, {
         params: {
           user: BCCH_USER,
           pass: BCCH_PASS,
           function: 'GetSeries',
           timeseries: seriesCode,
           firstdate: getTodayDate(),
           lastdate: getTodayDate()
         }
       });

       const seriesData = response.data.Series.Obs;
       if (!seriesData || seriesData.length === 0) {
         throw new Error(`No data available for ${currency}`);
       }

       return parseFloat(seriesData[0].value);
     } catch (error) {
       throw new Error(`Error fetching ${currency} exchange rate: ${error.message}`);
     }
   };

   const updateExchangeRates = async () => {
     try {
       const rates = {};
       for (const currency of Object.keys(CURRENCY_SERIES)) {
         rates[currency] = await fetchExchangeRate(currency);
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

   module.exports = { fetchExchangeRate, updateExchangeRates, exchangeRatesCache };