// index.js

// A very basic Express server for the Average Calculator microservice
const express = require('express');
const axios = require('axios');  // HTTP client
const app = express();
const PORT = 9876;

// Window size configuration
const WINDOW_SIZE = 10;

// In-memory storage of windows per ID
// Example: { 'e': [2,4,6], 'p': [2,3,5] }
var windows = {};

// Map from ID to test-server endpoint path
var endpointMap = {
  'p': 'primes',
  'f': 'fibo',
  'e': 'even',
  'r': 'rand'
};

const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ3MDU2NDM4LCJpYXQiOjE3NDcwNTYxMzgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjhmYmZhYWU0LThkMDctNDhjYy1iMDU3LTlmM2U1YmU3MzAxNiIsInN1YiI6ImNoLmVuLnU0Y3NlMjIwMjlAY2guc3R1ZGVudHMuYW1yaXRhLmVkdSJ9LCJlbWFpbCI6ImNoLmVuLnU0Y3NlMjIwMjlAY2guc3R1ZGVudHMuYW1yaXRhLmVkdSIsIm5hbWUiOiJrYXVzaGlrIGt1bWJoYXQiLCJyb2xsTm8iOiJjaC5lbi51NGNzZTIyMDI5IiwiYWNjZXNzQ29kZSI6IlN3dXVLRSIsImNsaWVudElEIjoiOGZiZmFhZTQtOGQwNy00OGNjLWIwNTctOWYzZTViZTczMDE2IiwiY2xpZW50U2VjcmV0IjoiZ0dWUEJzQUdaR1ZYUXdDViJ9.wX7-HmWaCS9aCfACPYvt09Qiq-1nMSeKrE7OcTxm7CI";


// Helper to fetch numbers from test server
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


// Compute average of array of numbers (rounded to 2 decimals)
function computeAverage(arr) {
  if (arr.length === 0) return 0;
  var sum = arr.reduce((a, b) => a + b, 0);
  return Math.round((sum / arr.length) * 100) / 100;
}

// Route handler
app.get('/numbers/:numberid', async function(req, res) {
  var id = req.params.numberid;

  // Validate ID
  if (!endpointMap[id]) {
    return res.status(400).json({ error: 'Invalid number ID' });
  }

  // Initialize window if missing
  if (!windows[id]) {
    windows[id] = [];
  }

  // Save previous state
  var prevState = windows[id].slice();

  // Fetch new numbers
  var numbers = await fetchNumbers(id);
  if (!numbers) {
    // If fetch failed or timed out, respond with current state unmodified
    return res.json({
      windowPrevState: prevState,
      windowCurrState: windows[id],
      numbers: [],
      avg: computeAverage(windows[id])
    });
  }

  // Add only new unique numbers
  numbers.forEach(function(n) {
    if (!windows[id].includes(n)) {
      windows[id].push(n);
    }
  });

  // If window too big, drop oldest
  if (windows[id].length > WINDOW_SIZE) {
    windows[id] = windows[id].slice(-WINDOW_SIZE);
  }

  // Prepare response
  var currState = windows[id];
  var avg = computeAverage(currState);

  res.json({
    windowPrevState: prevState,
    windowCurrState: currState,
    numbers: numbers,
    avg: avg
  });
});

// Start server
app.listen(PORT, function() {
  console.log(`Average Calculator service running on port ${PORT}`);
});
