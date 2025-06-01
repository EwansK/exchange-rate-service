const express = require('express');
   const cors = require('cors');
   const dotenv = require('dotenv');
   const { getExchangeRates, convertAmount } = require('./src/exchangeRateController');
   const { updateExchangeRates } = require('./src/exchangeRateService');

   dotenv.config();

   const app = express();
   const PORT = process.env.PORT || 3001;

   app.use(cors());
   app.use(express.json());

   app.get('/api/exchange-rates', getExchangeRates);
   app.get('/api/exchange-rates/convert', convertAmount);

   // Initialize cache and set up periodic updates
   updateExchangeRates().catch((err) => console.error('Initial cache update failed:', err));
   setInterval(updateExchangeRates, 30 * 60 * 1000);

   app.listen(PORT, () => {
     console.log(`Exchange rate microservice running on port ${PORT}`);
   });