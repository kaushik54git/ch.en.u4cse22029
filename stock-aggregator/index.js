
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 9877;

const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ3MDU2NDM4LCJpYXQiOjE3NDcwNTYxMzgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjhmYmZhYWU0LThkMDctNDhjYy1iMDU3LTlmM2U1YmU3MzAxNiIsInN1YiI6ImNoLmVuLnU0Y3NlMjIwMjlAY2guc3R1ZGVudHMuYW1yaXRhLmVkdSJ9LCJlbWFpbCI6ImNoLmVuLnU0Y3NlMjIwMjlAY2guc3R1ZGVudHMuYW1yaXRhLmVkdSIsIm5hbWUiOiJrYXVzaGlrIGt1bWJoYXQiLCJyb2xsTm8iOiJjaC5lbi51NGNzZTIyMDI5IiwiYWNjZXNzQ29kZSI6IlN3dXVLRSIsImNsaWVudElEIjoiOGZiZmFhZTQtOGQwNy00OGNjLWIwNTctOWYzZTViZTczMDE2IiwiY2xpZW50U2VjcmV0IjoiZ0dWUEJzQUdaR1ZYUXdDViJ9.wX7-HmWaCS9aCfACPYvt09Qiq-1nMSeKrE7OcTxm7CI";

async function fetchPriceHistory(ticker, minutes) {
  let url = `http://20.244.56.144/evaluation-service/stocks/${ticker}`;
  if (minutes) url += `?minutes=${minutes}`;
  try {
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` },
      timeout: 500
    });
    if (!minutes) return [ response.data.stock ];
    return response.data; 
  } catch (err) {
    console.log(`Error fetching ${ticker}:`, err.message);
    return null;
  }
}

function computeAverage(arr) {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((s, p) => s + p.price, 0);
  return sum / arr.length;
}

function computeCovariance(a, b, meanA, meanB) {
  const n = a.length;
  let cov = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i].price - meanA) * (b[i].price - meanB);
  }
  return cov / n;
}

function computeStd(arr, mean) {
  const n = arr.length;
  let sumSq = 0;
  for (const p of arr) {
    sumSq += Math.pow(p.price - mean, 2);
  }
  return Math.sqrt(sumSq / n);
}

app.get('/stocks/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const minutes = req.query.minutes;
  const aggregation = req.query.aggregation;

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

app.get('/stockcorrelation', async (req, res) => {
  const tickers = req.query.ticker; 
  const minutes = req.query.minutes;
  if (!Array.isArray(tickers) || tickers.length !== 2) {
    return res.status(400).json({ error: 'Provide exactly two ticker parameters' });
  }
  const histA = await fetchPriceHistory(tickers[0], minutes);
  const histB = await fetchPriceHistory(tickers[1], minutes);
  if (!histA || !histB || histA.length !== histB.length) {
    return res.status(502).json({ error: 'Failed or mismatched data from test server' });
  }
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

app.listen(PORT, () => {
  console.log(`Stock Aggregation service running on port ${PORT}`);
});
