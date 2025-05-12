
const express = require('express');
const axios = require('axios'); 
const app = express();
const PORT = 9876;

const WINDOW_SIZE = 10;

var windows = {};

var endpointMap = {
  'p': 'primes',
  'f': 'fibo',
  'e': 'even',
  'r': 'rand'
};

const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ3MDU2NDM4LCJpYXQiOjE3NDcwNTYxMzgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjhmYmZhYWU0LThkMDctNDhjYy1iMDU3LTlmM2U1YmU3MzAxNiIsInN1YiI6ImNoLmVuLnU0Y3NlMjIwMjlAY2guc3R1ZGVudHMuYW1yaXRhLmVkdSJ9LCJlbWFpbCI6ImNoLmVuLnU0Y3NlMjIwMjlAY2guc3R1ZGVudHMuYW1yaXRhLmVkdSIsIm5hbWUiOiJrYXVzaGlrIGt1bWJoYXQiLCJyb2xsTm8iOiJjaC5lbi51NGNzZTIyMDI5IiwiYWNjZXNzQ29kZSI6IlN3dXVLRSIsImNsaWVudElEIjoiOGZiZmFhZTQtOGQwNy00OGNjLWIwNTctOWYzZTViZTczMDE2IiwiY2xpZW50U2VjcmV0IjoiZ0dWUEJzQUdaR1ZYUXdDViJ9.wX7-HmWaCS9aCfACPYvt09Qiq-1nMSeKrE7OcTxm7CI";


function fetchNumbers(id) {
  const url = `http://20.244.56.144/evaluation-service/${endpointMap[id]}`;
  return axios.get(url, {
      timeout: 500,
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    })
    .then(response => response.data.numbers)
    .catch(err => {
      console.log(`Fetch error for ID ${id}:`, err.message);
      return null;
    });
}


function computeAverage(arr) {
  if (arr.length === 0) return 0;
  var sum = arr.reduce((a, b) => a + b, 0);
  return Math.round((sum / arr.length) * 100) / 100;
}

app.get('/numbers/:numberid', async function(req, res) {
  var id = req.params.numberid;

  if (!endpointMap[id]) {
    return res.status(400).json({ error: 'Invalid number ID' });
  }

  if (!windows[id]) {
    windows[id] = [];
  }

  var prevState = windows[id].slice();

  var numbers = await fetchNumbers(id);
  if (!numbers) {
    return res.json({
      windowPrevState: prevState,
      windowCurrState: windows[id],
      numbers: [],
      avg: computeAverage(windows[id])
    });
  }

  numbers.forEach(function(n) {
    if (!windows[id].includes(n)) {
      windows[id].push(n);
    }
  });

  if (windows[id].length > WINDOW_SIZE) {
    windows[id] = windows[id].slice(-WINDOW_SIZE);
  }

  var currState = windows[id];
  var avg = computeAverage(currState);

  res.json({
    windowPrevState: prevState,
    windowCurrState: currState,
    numbers: numbers,
    avg: avg
  });
});

app.listen(PORT, function() {
  console.log(`Average Calculator service running on port ${PORT}`);
});
