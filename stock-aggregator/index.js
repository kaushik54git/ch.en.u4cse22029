// index.js

// Very basic Express server for Stock Price Aggregation
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 9877; // you can pick any free port

// Paste your token here
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ3MDU2NDM4LCJpYXQiOjE3NDcwNTYxMzgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjhmYmZhYWU0LThkMDctNDhjYy1iMDU3LTlmM2U1YmU3MzAxNiIsInN1YiI6ImNoLmVuLnU0Y3NlMjIwMjlAY2guc3R1ZGVudHMuYW1yaXRhLmVkdSJ9LCJlbWFpbCI6ImNoLmVuLnU0Y3NlMjIwMjlAY2guc3R1ZGVudHMuYW1yaXRhLmVkdSIsIm5hbWUiOiJrYXVzaGlrIGt1bWJoYXQiLCJyb2xsTm8iOiJjaC5lbi51NGNzZTIyMDI5IiwiYWNjZXNzQ29kZSI6IlN3dXVLRSIsImNsaWVudElEIjoiOGZiZmFhZTQtOGQwNy00OGNjLWIwNTctOWYzZTViZTczMDE2IiwiY2xpZW50U2VjcmV0IjoiZ0dWUEJzQUdaR1ZYUXdDViJ9.wX7-HmWaCS9aCfACPYvt09Qiq-1nMSeKrE7OcTxm7CI";

// Helper to fetch price history for a ticker
// If minutes is provided, appends ?minutes=m; otherwise fetches latest
async function fetchPriceHistory(ticker, minutes) {
  let url = `http://20.244.56.144/evaluation-service/stocks/${ticker}`;
  if (minutes) url += `?minutes=${minutes}`;
  try {
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` },
      timeout: 500
    });
    // For the single‐price endpoint (no minutes), wrap in array for uniformity
    if (!minutes) return [ response.data.stock ];
    return response.data; // array of { price, lastUpdatedAt }
  } catch (err) {
    console.log(`Error fetching ${ticker}:`, err.message);
    return null;
  }
}

// Compute average price (unrounded)
function computeAverage(arr) {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((s, p) => s + p.price, 0);
  return sum / arr.length;
}

// Compute covariance of two arrays of prices (assumes same length and order)
function computeCovariance(a, b, meanA, meanB) {
  const n = a.length;
  let cov = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i].price - meanA) * (b[i].price - meanB);
  }
  return cov / n;
}

// Compute standard deviation of an array of prices
function computeStd(arr, mean) {
  const n = arr.length;
  let sumSq = 0;
  for (const p of arr) {
    sumSq += Math.pow(p.price - mean, 2);
  }
  return Math.sqrt(sumSq / n);
}

// Route: Average Stock Price in the last “m” minutes
// GET /stocks/:ticker?minutes=m&aggregation=average
app.get('/stocks/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const minutes = req.query.minutes;
  const aggregation = req.query.aggregation;

  // Only support aggregation=average
  if (aggregation !== 'average') {
    return res.status(400).json({ error: 'Only aggregation=average supported' });
  }

  const history = await fetchPriceHistory(ticker, minutes);
  if (!history) {
    return res.status(502).json({ error: 'Failed to fetch from test server' });
  }

  const avg = computeAverage(history);
  res.json({
    averageStockPrice: avg,
    priceHistory: history
  });
});

// Route: Correlation of Price Movement between 2 stocks
// GET /stockcorrelation?minutes=m&ticker=AAA&ticker=BBB
app.get('/stockcorrelation', async (req, res) => {
  const tickers = req.query.ticker; 
  const minutes = req.query.minutes;
  
  // Ensure exactly two tickers
  if (!Array.isArray(tickers) || tickers.length !== 2) {
    return res.status(400).json({ error: 'Provide exactly two ticker parameters' });
  }
  
  // Fetch both histories
  const histA = await fetchPriceHistory(tickers[0], minutes);
  const histB = await fetchPriceHistory(tickers[1], minutes);
  if (!histA || !histB || histA.length !== histB.length) {
    return res.status(502).json({ error: 'Failed or mismatched data from test server' });
  }
  
  // Compute means, covariance, std devs
  const meanA = computeAverage(histA);
  const meanB = computeAverage(histB);
  const cov = computeCovariance(histA, histB, meanA, meanB);
  const stdA = computeStd(histA, meanA);
  const stdB = computeStd(histB, meanB);
  const correlation = cov / (stdA * stdB);
  
  res.json({
    correlation: Number(correlation.toFixed(4)),
    stocks: {
      [tickers[0]]: {
        averagePrice: Number(meanA.toFixed(6)),
        priceHistory: histA
      },
      [tickers[1]]: {
        averagePrice: Number(meanB.toFixed(6)),
        priceHistory: histB
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Stock Aggregation service running on port ${PORT}`);
});
