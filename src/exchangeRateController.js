const { updateExchangeRates, exchangeRatesCache } = require('./exchangeRateService');

   const getExchangeRates = async (req, res) => {
     try {
       if (!exchangeRatesCache.lastUpdated) {
         await updateExchangeRates();
       }
       res.json({
         rates: exchangeRatesCache.rates,
         lastUpdated: exchangeRatesCache.lastUpdated
       });
     } catch (error) {
       res.status(500).json({ error: 'Failed to fetch exchange rates' });
     }
   };

   const convertAmount = async (req, res) => {
     const { amount, currency } = req.query;

     if (!amount || isNaN(amount) || !currency || !['USD', 'EUR'].includes(currency)) {
       return res.status(400).json({ error: 'Invalid amount or currency' });
     }

     try {
       if (!exchangeRatesCache.lastUpdated) {
         await updateExchangeRates();
       }

       const rate = exchangeRatesCache.rates[currency];
       if (!rate) {
         return res.status(500).json({ error: `No rate available for ${currency}` });
       }

       const convertedAmount = Math.round(parseFloat(amount) / rate);
       res.json({
         originalAmount: parseFloat(amount),
         currency,
         convertedAmount,
         rate,
         lastUpdated: exchangeRatesCache.lastUpdated
       });
     } catch (error) {
       res.status(500).json({ error: 'Failed to convert amount' });
     }
   };

   module.exports = { getExchangeRates, convertAmount };