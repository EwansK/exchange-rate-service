const { updateExchangeRates, getExchangeRatesCache } = require('./exchangeRateService');

// Helper to avoid excessive refreshes
const isStale = (lastUpdated) => {
  const now = new Date();
  const diffInSeconds = (now - new Date(lastUpdated)) / 1000;
  return diffInSeconds > 60; // Refresh if last update was over 60 seconds ago
};

const getExchangeRates = async (req, res) => {
  console.log('[GET /api/exchange-rates] Request received at', new Date().toISOString());

  try {
    let exchangeRatesCache = getExchangeRatesCache();

    if (!exchangeRatesCache.lastUpdated || isStale(exchangeRatesCache.lastUpdated)) {
      await updateExchangeRates();
      exchangeRatesCache = getExchangeRatesCache(); // refresh cache after update
    }

    res.json({
      rates: exchangeRatesCache.rates,
      lastUpdated: exchangeRatesCache.lastUpdated
    });
  } catch (error) {
    console.error('Error in getExchangeRates:', error.message);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
};

const convertAmount = async (req, res) => {
  console.log('[GET /api/exchange-rates/convert] Request received at', new Date().toISOString());

  const { amount, currency } = req.query;

  if (!amount || isNaN(amount) || !currency || !['USD', 'EUR'].includes(currency)) {
    return res.status(400).json({ error: 'Invalid amount or currency' });
  }

  try {
    let exchangeRatesCache = getExchangeRatesCache();

    if (!exchangeRatesCache.lastUpdated || isStale(exchangeRatesCache.lastUpdated)) {
      await updateExchangeRates();
      exchangeRatesCache = getExchangeRatesCache(); // refresh cache after update
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
    console.error('Error in convertAmount:', error.message);
    res.status(500).json({ error: 'Failed to convert amount' });
  }
};

module.exports = { getExchangeRates, convertAmount };
