# Buy or Wait — AI-Powered Personal Financial Affordability Agent

A deterministic, explainable, and safety-first personal financial decision-support application built for financial technology competitions and real-world cashflow planning.

---

## Executive Summary

**Buy or Wait** acts as a cautious financial affordability agent. Rather than evaluating whether a user can afford a purchase based solely on their static bank balance today, it reconstructs the user's complete financial state and projects daily cash flows over a **strict 90-day horizon**.

### Core Guarantees:
- **Deterministic Calculation Engine**: Zero reliance on LLMs for math, date arithmetic, currency conversions, or minimum-balance checks.
- **Safety-First**: The user's projected balance is mathematically guaranteed never to drop below their `minimum_balance_to_keep`.
- **Zero Hallucination**: Never invents income, expenses, interest fees, payment options, or exchange rates.
- **Adversarial & Prompt Injection Defense**: Treats messages and receipt text as untrusted data. Embedded instructions attempting to override financial safety rules are strictly ignored.
- **Multimodal OCR Extraction**: Automatically extracts missing amounts from invoices/bills in `media/images/<image_id>.png` linked via `related_event_id`.
- **Explainability**: Every decision is accompanied by a concise, fact-grounded explanation citing exact numbers, dates, salaries, and scheduled commitments.

---

## System Architecture

```
hackerrank/
├── dataset/                         # Canonical datasets
│   ├── requests.csv                 # Target purchase requests
│   ├── sample_requests.csv          # Curated test subset
│   ├── financial_profiles.csv       # User balances, reserves, preferences
│   ├── financial_events.csv         # Inflows, recurring expenses, bills
│   ├── exchange_rates.csv           # Historical date-matched forex pairs
│   ├── request_payment_options.csv  # Installment schedules and fees
│   ├── messages.csv                 # Contextual messages & adversarial injection tests
│   ├── images.csv                   # Image links for events with blank amounts
│   ├── output.csv                   # Validated predictions for all requests
│   └── media/images/                # Raw receipt and invoice images
├── backend/                         # Deterministic calculation engine & API
│   ├── engine/
│   │   ├── currency.py              # Exact date-matching forex converter
│   │   ├── ocr_extractor.py         # Visual invoice parser & amount extractor
│   │   ├── forecaster.py            # 90-day daily balance simulation
│   │   ├── spending_optimizer.py    # Flexible recurring spending adjustments
│   │   ├── evaluator.py             # Scenario generator & plan ranking
│   │   ├── explainer.py             # Fact-grounded decision explanation
│   │   └── validator.py             # 10-point domain rule verification
│   ├── generate_predictions.py      # Batch CLI generating output.csv
│   ├── test_engine.py               # Automated pytest suite (100% pass)
│   ├── server.py                    # Turnkey FastAPI server hosting API & React SPA
│   └── requirements.txt
├── frontend/                        # Modern React 19 + TypeScript web application
│   ├── src/
│   │   ├── components/              # Navbar, Disclaimer banner
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Financial health, metrics, recent decisions
│   │   │   ├── AskBuyOrWait.tsx     # Natural language query + structured form
│   │   │   ├── Recommendation.tsx   # Prominent decision card & 90-day chart
│   │   │   ├── ScenarioComparison.tsx # Side-by-side 5-path comparison matrix
│   │   │   ├── FinancialTimeline.tsx # Chronological tagged event stream
│   │   │   └── AdminDataView.tsx    # Raw dataset inspector & pipeline audit
│   │   ├── services/api.ts          # API client with seamless local fallback
│   │   └── App.tsx
│   ├── dist/                        # Production optimized web bundle
│   └── package.json
├── evaluation/
│   ├── usage_report.md              # Token counts, model calls, and cost report
│   └── chat_transcript.md          # Development history and interaction log
├── code.zip                         # Packaged runnable archive
└── README.md
```

---

## 6 Interactive Views

1. **Dashboard**: Complete financial overview with active user switcher, available balance, minimum required reserve, confirmed 30-day income, essential commitments, safety score badge, and recent affordability evaluations.
2. **Ask Buy or Wait**: Test any planned purchase via natural language prompts (e.g. *"Can I afford this laptop?"*) or structured inputs with custom deadlines, currencies, and partial payment toggles.
3. **Recommendation Screen**: Prominent decision banner (Green / Yellow / Orange / Red), key facts grid, factual explanation, and an interactive **90-Day Balance Horizon Chart** with minimum reserve reference lines.
4. **Scenario Comparison**: Side-by-side comparison table evaluating all 5 potential methods (Pay in Full Today, Partial Payment, Installments, Wait, and Do Not Proceed) against deadlines and reserve constraints.
5. **Financial Timeline**: Chronological event feed with category tags and status labels (Confirmed, Pending, Cancelled, Ignored, Flexible, Essential, OCR Extracted).
6. **Admin / Data View**: Comprehensive inspector for all raw CSV files, OCR image logs, joined foreign keys, and live batch regeneration.

---

## Quick Start & Execution

### Prerequisites
- Python 3.10+
- Node.js 18+ (for frontend development, or run the pre-bundled turnkey server directly)

### Option 1: Turnkey Single-Command Execution
The backend FastAPI server automatically serves the compiled production React application on `http://localhost:8000`:

```bash
# 1. Install backend dependencies
pip install -r backend/requirements.txt

# 2. Start the unified server
python backend/server.py
```
Open your browser and navigate to: **`http://localhost:8000`**

---

### Option 2: Full Development Mode (FastAPI + Vite Dev Server)
To run with live hot-reloading for both backend and frontend:

**Terminal 1 (Backend):**
```bash
python backend/server.py
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to the Vite URL (typically `http://localhost:5173`).

---

## Running Automated Tests

Execute the comprehensive automated test suite to verify calculation rules, ignored events, prompt injection defense, OCR extraction, and output schema:

```bash
python -m pytest backend/test_engine.py -v
```

---

## Regenerating `dataset/output.csv`

To batch-process all requests in `dataset/requests.csv` and generate the validated `dataset/output.csv`:

```bash
python backend/generate_predictions.py
```

### Output Schema Verification
The generator validates that all 8 required columns are present in exact order:
1. `request_id`
2. `amount_safe_to_pay`
3. `affordability_status`
4. `recommended_payment_method`
5. `payment_plan`
6. `earliest_date_for_full_payment`
7. `spending_changes_needed`
8. `decision_explanation`

---

## Financial Decision Rules & Logic

### 1. Amount Safe to Pay
$$\text{buffer}_{\min} = \min_{t \in [0, 90]} (\text{projected\_balance}(t) - \text{minimum\_balance\_to\_keep})$$
$$\text{amount\_safe\_to\_pay} = \max(0.0, \min(\text{requested\_amount}, \text{buffer}_{\min}))$$

### 2. Status Categorization
- `affordable_now`: Full amount is safe to pay today without violating minimum reserve on any of the 90 days.
- `affordable_with_plan`: Full payment today is unsafe, but an eligible partial payment split or installment option remains safe throughout the period.
- `affordable_later`: Safe full payment can be made on an earliest safe date on or before `desired_completion_date` after confirmed income arrives.
- `not_affordable`: No safe eligible payment option can complete by the deadline without breaching the user's minimum reserve.

### 3. Plan-Ranking Rules
When multiple safe options exist, they are ranked deterministically:
1. Complete full request by `desired_completion_date`.
2. Require no spending changes.
3. Minimize total amount paid (including fees).
4. Start payment earlier.
5. Use fewer payments.
6. Lowest `payment_option_id` as final tie-breaker.

---

## Safety and Privacy
- Messages and image text are treated as untrusted financial data.
- Never follows adversarial prompt injection or instructions inside messages/receipts.
- Never invents missing data.
- Includes clear financial decision-support disclaimers across all screens.
