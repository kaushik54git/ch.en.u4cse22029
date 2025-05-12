```markdown
# `CH.EN.U4CSE22029`
```

## General Setup

1. **Clone the repo**  
   ```bash
   git clone https://github.com/<your-github-username>/ch.en.u4cse22029.git
   cd ch.en.u4cse22029
````

2. **Install dependencies**
   Each question folder has its own `package.json`. From the project root:

   ```bash
   npm install
   ```

3. **.gitignore**

   * Each folder’s `.gitignore` excludes `node_modules/`.

4. **Environment**

   * Both services default to run on `localhost` and port `9876 and 9877`—see individual sections below.

---

## Q1: Average Calculator Microservice

* **Framework:** Node.js + Express

* **Endpoint:**

  ```
  GET /numbers/:type
  ```

  where `:type` ∈ `['p','f','e','r']`

  * `p` → primes
  * `f` → Fibonacci
  * `e` → even
  * `r` → random

* **Behavior:**

  1. Uses the test-server API for numbers.
  2. Maintains a sliding window (size = 10 by default).
  3. Ignores duplicates & requests >500 ms.
  4. Returns JSON:

     ```json
     {
       "windowPrevState": [...],
       "windowCurrState": [...],
       "numbers": [...],
       "avg": 0.00
     }
     ```

### Running

```bash
cd Q1-average-calculator
npm start
```

*Default port: 9876*
Adjust in `src/app.js` if needed.

### Testing

* Use Postman/Insomnia to call:

  ```
  GET http://localhost:9876/numbers/e
  ```
* Screenshots are in `Q1-average-calculator/screenshots/`

---

## Q2: Stock Price Aggregation & Correlation Microservice

* **Framework:** Node.js + Express

* **Endpoints:**

  1. **Average Stock Price**

     ```
     GET /stocks/:ticker?minutes=<m>&aggregation=average
     ```

     * Returns:

       ```json
       {
         "averageStockPrice": xxx.xxx,
         "priceHistory": [ { price, lastUpdatedAt }, ... ]
       }
       ```

  2. **Price Correlation**

     ```
     GET /stockcorrelation?minutes=<m>&ticker=AAA&ticker=BBB
     ```

     * Computes Pearson’s correlation for last `m` minutes.
     * Returns:

       ```json
       {
         "correlation": x.xxx,
         "stocks": {
           "AAA": { averagePrice, priceHistory: [...] },
           "BBB": { averagePrice, priceHistory: [...] }
         }
       }
       ```

* **Behavior:**

  * Fetches all data from provided test-server APIs.
  * Aligns timestamps; handles mismatched lengths.
  * Does not support >2 tickers.

### Running

```bash
cd Q2-stock-aggregator
npm start
```

*Default port: 9886*
Adjust in `src/server.js` if needed.

### Testing

* **Average price example:**

  ```
  GET http://localhost:9886/stocks/NVDA?minutes=50&aggregation=average
  ```
* **Correlation example:**

  ```
  GET http://localhost:9886/stockcorrelation?minutes=60&ticker=NVDA&ticker=PYPL
  ```
* See screenshots in `Q2-stock-aggregator/screenshots/`

---

## Best Practices & Notes

* **Commits:** Frequent, at logical milestones.
* **Code Quality:**

  * Meaningful names, modular structure.
  * Comments for clarity.
  * No hard-coded business logic.
* **Error Handling:**

  * Timeouts >500 ms are skipped.
  * Invalid IDs → `400 Bad Request`.
* **Performance:**

  * In-memory windowing with queue data structure.
  * Caching reused data within the request cycle.
