# Buy or Wait — Development & Execution Chat Transcript

This transcript records the interaction, design decisions, verification tests, and operational workflows used during the development of the **Buy or Wait** Personal Financial Affordability Agent.

---

### Phase 1: Problem Definition & Architecture
**User**: 
> Build a polished full-stack web application called “Buy or Wait”. The application is an AI-powered personal financial affordability agent. Its purpose is to determine whether a user can safely afford a requested purchase or financial commitment, considering the user’s complete financial situation rather than only their current balance...

**Agent**:
> Formulated implementation plan highlighting:
> 1. Strict separation of deterministic financial forecasting from AI explanation layer.
> 2. Zero-hallucination policy for numbers, currencies, dates, and payment options.
> 3. Defense-in-depth against prompt injections embedded in messages/images.
> 4. Automated OCR/multimodal extraction for blank event amounts.
> 5. Interactive 6-page dashboard built with React, TypeScript, Tailwind CSS, and Recharts.

---

### Phase 2: Implementation & Engine Verification
**Agent**:
> Built the deterministic calculation engine:
> - `backend/engine/currency.py`: Date-matched currency converter supporting exact pairs and triangular cross-currency rates.
> - `backend/engine/ocr_extractor.py`: Multimodal & regex receipt parser resolving missing event amounts.
> - `backend/engine/forecaster.py`: Strict daily 90-day balance simulation tracking liquid buffers above user's minimum reserve.
> - `backend/engine/evaluator.py`: Computing exact `amount_safe_to_pay`, evaluating 5 candidate methods, and applying the 6 plan-ranking tie-breakers.
> - `backend/engine/validator.py`: Continuous verification of all 10 domain rules.

---

### Phase 3: Automated Testing Run
**Terminal Command**:
```bash
python -m pytest backend/test_engine.py
```
**Output**:
```
collected 8 items
backend/test_engine.py ........ [100%]
============================== 8 passed in 0.64s ==============================
```

---

### Phase 4: Output CSV Batch Generation
**Terminal Command**:
```bash
python backend/generate_predictions.py
```
**Output**:
```
[OCR] Resolved event EVT_005 amount as 250.0 via Multimodal Visual Analysis (media/images/img_utility_01.png)
[OCR] Resolved event EVT_014 amount as 450.0 via Multimodal Visual Analysis (media/images/img_medical_02.png)
[OCR] Resolved event EVT_019 amount as 600.0 via Multimodal Visual Analysis (media/images/img_tax_03.png)

=======================================================
   BUY OR WAIT - DETERMINISTIC EVALUATION RUNNER
=======================================================

[VALID] REQ_001 (Alex Rivera) -> AFFORDABLE_NOW | Method: full_payment | Plan: 2026-09-12:850.00
[VALID] REQ_002 (Alex Rivera) -> AFFORDABLE_WITH_PLAN | Method: partial_payment | Plan: 2026-09-12:1700.00|2026-09-15:500.00
[VALID] REQ_003 (Priya Sharma) -> AFFORDABLE_WITH_PLAN | Method: installments | Plan: 2026-09-12:20000.00|2026-10-12:20000.00|2026-11-11:20000.00
[VALID] REQ_004 (Marco Rossi) -> AFFORDABLE_LATER | Method: wait | Plan: 2026-09-25:2500.00
[VALID] REQ_005 (Emma Watson) -> AFFORDABLE_NOW | Method: full_payment | Plan: 2026-09-12:1200.00
[VALID] REQ_006 (David Kim) -> NOT_AFFORDABLE | Method: not_recommended | Plan: none
[VALID] REQ_007 (Alex Rivera) -> AFFORDABLE_NOW | Method: full_payment | Plan: 2026-09-12:300.00
[VALID] REQ_008 (Priya Sharma) -> NOT_AFFORDABLE | Method: not_recommended | Plan: none

Saved 8 validated predictions to: dataset\output.csv
All constraints satisfied: True
```

---

### Phase 5: Web UI Verification & Turnkey Delivery
- Assembled React 19 + TypeScript frontend with 6 views:
  1. **Dashboard**: High-level liquidity metrics, safety indicator, recent decisions list.
  2. **Ask Buy or Wait**: Natural language inquiry with quick chips and structured overrides.
  3. **Recommendation**: Prominent decision card, factual breakdown, and interactive 90-day balance chart with minimum reserve reference lines.
  4. **Scenario Comparison**: Side-by-side table comparing all 5 payment options against deadlines and reserve constraints.
  5. **Financial Timeline**: Chronological event feed with category and status tags.
  6. **Admin / Data View**: Raw CSV tables, OCR results, and live schema validation audit.
- Built production bundle in `frontend/dist` and mounted it directly into FastAPI for single-command turnkey execution.
