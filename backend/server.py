import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from backend.generate_predictions import load_data, run_batch_evaluation
from backend.engine.currency import CurrencyConverter
from backend.engine.ocr_extractor import OCRExtractor
from backend.engine.forecaster import BalanceForecaster
from backend.engine.evaluator import AffordabilityEvaluator
from backend.engine.validator import OutputValidator
from backend.engine.models import FinancialRequest, UserProfile, FinancialEvent, PaymentOption

app = FastAPI(title="Buy or Wait Affordability API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASET_DIR = "dataset"

class EvaluateCustomRequest(BaseModel):
    user_id: str
    purchase_description: str
    requested_amount: float
    currency: str
    desired_completion_date: str
    request_type: str = "one_time_purchase"
    allows_partial_payment: bool = True
    request_date: Optional[str] = None

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "Buy or Wait Engine"}

@app.get("/api/users")
def get_users():
    profiles, _, events, _, requests, _ = load_data(DATASET_DIR)
    results = []
    for u in profiles.values():
        u_reqs = [r for r in requests if r.user_id == u.user_id]
        results.append({
            "user_id": u.user_id,
            "name": u.name,
            "home_currency": u.home_currency,
            "current_balance": u.current_balance,
            "minimum_balance_to_keep": u.minimum_balance_to_keep,
            "accepted_payment_methods": u.accepted_payment_methods,
            "financial_priorities": u.financial_priorities,
            "willingness_to_reduce_flexible_spending": u.willingness_to_reduce_flexible_spending,
            "request_count": len(u_reqs)
        })
    return results

@app.get("/api/users/{user_id}")
def get_user_detail(user_id: str):
    profiles, rates, events, options, requests, images = load_data(DATASET_DIR)
    if user_id not in profiles:
        raise HTTPException(status_code=404, detail="User not found")
    
    u = profiles[user_id]
    u_events = [e for e in events if e.user_id == user_id]
    u_reqs = [r for r in requests if r.user_id == user_id]

    converter = CurrencyConverter(rates)
    forecaster = BalanceForecaster(converter)
    evaluator = AffordabilityEvaluator(forecaster, converter)

    # Calculate upcoming confirmed income & commitments in next 30 days
    now_str = "2026-09-12"
    baseline_days, is_safe, min_buffer, lowest_balance = forecaster.run_forecast(
        u, u_events, now_str, days_ahead=90
    )

    upcoming_income_30d = 0.0
    upcoming_essential_30d = 0.0
    for day in baseline_days[:30]:
        for ev in day.events:
            if ev.get("is_income"):
                upcoming_income_30d += ev.get("amount_home_currency", 0.0)
            elif ev.get("is_essential"):
                upcoming_essential_30d += ev.get("amount_home_currency", 0.0)

    # Evaluate user's existing requests
    evaluated_requests = []
    for req in u_reqs:
        eval_res, scenarios = evaluator.evaluate_request(u, u_events, req, options)
        evaluated_requests.append({
            "request_id": req.request_id,
            "purchase_description": req.purchase_description,
            "requested_amount": req.requested_amount,
            "currency": req.currency,
            "request_date": req.request_date,
            "desired_completion_date": req.desired_completion_date,
            "affordability_status": eval_res.affordability_status,
            "recommended_payment_method": eval_res.recommended_payment_method,
            "amount_safe_to_pay": eval_res.amount_safe_to_pay,
            "payment_plan": eval_res.payment_plan,
            "earliest_date_for_full_payment": eval_res.earliest_date_for_full_payment,
            "spending_changes_needed": eval_res.spending_changes_needed,
            "decision_explanation": eval_res.decision_explanation
        })

    return {
        "profile": {
            "user_id": u.user_id,
            "name": u.name,
            "home_currency": u.home_currency,
            "current_balance": u.current_balance,
            "minimum_balance_to_keep": u.minimum_balance_to_keep,
            "accepted_payment_methods": u.accepted_payment_methods,
            "financial_priorities": u.financial_priorities,
            "willingness_to_reduce_flexible_spending": u.willingness_to_reduce_flexible_spending
        },
        "metrics": {
            "upcoming_income_30d": round(upcoming_income_30d, 2),
            "upcoming_essential_30d": round(upcoming_essential_30d, 2),
            "min_buffer_90d": min_buffer,
            "lowest_projected_balance": lowest_balance,
            "is_currently_safe": is_safe
        },
        "requests": evaluated_requests
    }

@app.get("/api/requests")
def list_requests():
    profiles, rates, events, options, requests, images = load_data(DATASET_DIR)
    converter = CurrencyConverter(rates)
    forecaster = BalanceForecaster(converter)
    evaluator = AffordabilityEvaluator(forecaster, converter)

    results = []
    for req in requests:
        u = profiles[req.user_id]
        u_events = [e for e in events if e.user_id == req.user_id]
        eval_res, _ = evaluator.evaluate_request(u, u_events, req, options)
        results.append({
            "request_id": req.request_id,
            "user_id": req.user_id,
            "user_name": u.name,
            "request_date": req.request_date,
            "purchase_description": req.purchase_description,
            "requested_amount": req.requested_amount,
            "currency": req.currency,
            "desired_completion_date": req.desired_completion_date,
            "request_type": req.request_type,
            "allows_partial_payment": req.allows_partial_payment,
            "affordability_status": eval_res.affordability_status,
            "recommended_payment_method": eval_res.recommended_payment_method,
            "amount_safe_to_pay": eval_res.amount_safe_to_pay,
            "earliest_date_for_full_payment": eval_res.earliest_date_for_full_payment
        })
    return results

@app.get("/api/evaluate/{request_id}")
def evaluate_existing_request(request_id: str):
    profiles, rates, events, options, requests, images = load_data(DATASET_DIR)
    target_req = next((r for r in requests if r.request_id == request_id), None)
    if not target_req:
        raise HTTPException(status_code=404, detail="Request not found")

    u = profiles[target_req.user_id]
    u_events = [e for e in events if e.user_id == target_req.user_id]
    
    converter = CurrencyConverter(rates)
    forecaster = BalanceForecaster(converter)
    evaluator = AffordabilityEvaluator(forecaster, converter)

    eval_res, scenarios = evaluator.evaluate_request(u, u_events, target_req, options)

    # Format chart series
    chart_data = []
    for day in eval_res.recommended_forecast:
        chart_data.append({
            "date": day.date,
            "day_offset": day.day_offset,
            "balance": day.ending_balance,
            "min_balance": day.min_required_balance,
            "income": day.income_total,
            "expenses": day.expense_total,
            "is_safe": day.is_safe,
            "events_count": len(day.events)
        })

    return {
        "evaluation": {
            "request_id": eval_res.request_id,
            "user_id": u.user_id,
            "user_name": u.name,
            "home_currency": u.home_currency,
            "purchase_description": target_req.purchase_description,
            "requested_amount": target_req.requested_amount,
            "currency": target_req.currency,
            "amount_safe_to_pay": eval_res.amount_safe_to_pay,
            "affordability_status": eval_res.affordability_status,
            "recommended_payment_method": eval_res.recommended_payment_method,
            "payment_plan": eval_res.payment_plan,
            "earliest_date_for_full_payment": eval_res.earliest_date_for_full_payment,
            "spending_changes_needed": eval_res.spending_changes_needed,
            "decision_explanation": eval_res.decision_explanation,
            "desired_completion_date": target_req.desired_completion_date
        },
        "scenarios": [
            {
                "scenario_name": s.scenario_name,
                "method": s.method,
                "is_safe": s.is_safe,
                "is_accepted_by_user": s.is_accepted_by_user,
                "completed_by_deadline": s.completed_by_deadline,
                "requires_spending_changes": s.requires_spending_changes,
                "spending_changes": s.spending_changes,
                "total_amount_paid": s.total_amount_paid,
                "first_payment_date": s.first_payment_date,
                "final_payment_date": s.final_payment_date,
                "lowest_projected_balance": s.lowest_projected_balance,
                "payment_plan": s.payment_plan,
                "payment_option_id": s.payment_option_id,
                "rejection_reason": s.rejection_reason
            }
            for s in scenarios
        ],
        "chart_data": chart_data
    }

@app.post("/api/evaluate")
def evaluate_custom(body: EvaluateCustomRequest):
    profiles, rates, events, options, requests, images = load_data(DATASET_DIR)
    if body.user_id not in profiles:
        raise HTTPException(status_code=404, detail="User not found")

    u = profiles[body.user_id]
    u_events = [e for e in events if e.user_id == body.user_id]
    
    req_date = body.request_date or "2026-09-12"
    custom_req = FinancialRequest(
        request_id="REQ_CUSTOM",
        user_id=body.user_id,
        request_date=req_date,
        purchase_description=body.purchase_description,
        requested_amount=body.requested_amount,
        currency=body.currency,
        desired_completion_date=body.desired_completion_date,
        request_type=body.request_type,
        allows_partial_payment=body.allows_partial_payment
    )

    converter = CurrencyConverter(rates)
    forecaster = BalanceForecaster(converter)
    evaluator = AffordabilityEvaluator(forecaster, converter)

    eval_res, scenarios = evaluator.evaluate_request(u, u_events, custom_req, options)

    chart_data = []
    for day in eval_res.recommended_forecast:
        chart_data.append({
            "date": day.date,
            "day_offset": day.day_offset,
            "balance": day.ending_balance,
            "min_balance": day.min_required_balance,
            "income": day.income_total,
            "expenses": day.expense_total,
            "is_safe": day.is_safe,
            "events_count": len(day.events)
        })

    return {
        "evaluation": {
            "request_id": "REQ_CUSTOM",
            "user_id": u.user_id,
            "user_name": u.name,
            "home_currency": u.home_currency,
            "purchase_description": custom_req.purchase_description,
            "requested_amount": custom_req.requested_amount,
            "currency": custom_req.currency,
            "amount_safe_to_pay": eval_res.amount_safe_to_pay,
            "affordability_status": eval_res.affordability_status,
            "recommended_payment_method": eval_res.recommended_payment_method,
            "payment_plan": eval_res.payment_plan,
            "earliest_date_for_full_payment": eval_res.earliest_date_for_full_payment,
            "spending_changes_needed": eval_res.spending_changes_needed,
            "decision_explanation": eval_res.decision_explanation,
            "desired_completion_date": custom_req.desired_completion_date
        },
        "scenarios": [
            {
                "scenario_name": s.scenario_name,
                "method": s.method,
                "is_safe": s.is_safe,
                "is_accepted_by_user": s.is_accepted_by_user,
                "completed_by_deadline": s.completed_by_deadline,
                "requires_spending_changes": s.requires_spending_changes,
                "spending_changes": s.spending_changes,
                "total_amount_paid": s.total_amount_paid,
                "first_payment_date": s.first_payment_date,
                "final_payment_date": s.final_payment_date,
                "lowest_projected_balance": s.lowest_projected_balance,
                "payment_plan": s.payment_plan,
                "payment_option_id": s.payment_option_id,
                "rejection_reason": s.rejection_reason
            }
            for s in scenarios
        ],
        "chart_data": chart_data
    }

@app.get("/api/timeline/{user_id}")
def get_user_timeline(user_id: str):
    profiles, rates, events, options, requests, images = load_data(DATASET_DIR)
    if user_id not in profiles:
        raise HTTPException(status_code=404, detail="User not found")
    
    u = profiles[user_id]
    converter = CurrencyConverter(rates)
    forecaster = BalanceForecaster(converter)
    u_events = [e for e in events if e.user_id == user_id]

    days, _, _, _ = forecaster.run_forecast(u, u_events, "2026-09-12", days_ahead=90)

    # Collect distinct chronologically sorted items
    timeline_items = []
    
    # 1. Initial balance event
    timeline_items.append({
        "id": "INIT_BAL",
        "date": "2026-09-12",
        "title": "Starting Available Balance",
        "category": "Balance",
        "amount": u.current_balance,
        "currency": u.home_currency,
        "status": "Confirmed",
        "is_essential": True,
        "is_flexible": False,
        "description": f"Verified initial liquid reserves ({u.home_currency} {u.current_balance:.2f})"
    })

    # 2. Raw events including ignored ones for full transparency
    import csv
    with open(os.path.join(DATASET_DIR, "financial_events.csv"), mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if r["user_id"] == user_id:
                amt = r["amount"]
                is_extracted = False
                if amt == "":
                    # check if resolved in events
                    ev_match = next((e for e in u_events if e.event_id == r["event_id"]), None)
                    amt_num = ev_match.amount if ev_match else 0.0
                    is_extracted = True
                else:
                    amt_num = float(amt)

                status_label = r["status"].capitalize()
                etype = r["event_type"]
                if etype in ["pending_credit", "failed_transaction", "cancelled_transaction"] or r["status"] in ["pending", "failed", "cancelled"]:
                    status_label = "Ignored (" + status_label + ")"

                timeline_items.append({
                    "id": r["event_id"],
                    "date": r["event_date"],
                    "title": r["description"],
                    "category": r["event_type"].replace("_", " ").title(),
                    "amount": amt_num,
                    "currency": r["currency"],
                    "status": status_label,
                    "is_essential": r["is_essential"].lower() == "true",
                    "is_flexible": r["is_flexible"].lower() == "true",
                    "description": f"{'OCR Extracted from Invoice | ' if is_extracted else ''}{r['description']}"
                })

    # Sort chronological
    timeline_items.sort(key=lambda x: x["date"])
    return timeline_items

@app.get("/api/admin/data")
def get_admin_data():
    import csv
    def read_csv(fname):
        path = os.path.join(DATASET_DIR, fname)
        if not os.path.exists(path):
            return []
        with open(path, mode="r", encoding="utf-8") as f:
            return list(csv.DictReader(f))

    profiles = read_csv("financial_profiles.csv")
    events = read_csv("financial_events.csv")
    rates = read_csv("exchange_rates.csv")
    options = read_csv("request_payment_options.csv")
    messages = read_csv("messages.csv")
    images = read_csv("images.csv")
    output = read_csv("output.csv")
    requests = read_csv("requests.csv")

    ocr = OCRExtractor(DATASET_DIR)
    ocr_logs = []
    for img in images:
        amt, method = ocr.extract_amount_from_image(img["file_path"])
        ocr_logs.append({
            "image_id": img["image_id"],
            "related_event_id": img["related_event_id"],
            "file_path": img["file_path"],
            "description": img["description"],
            "extracted_amount": amt,
            "extraction_method": method
        })

    return {
        "financial_profiles": profiles,
        "financial_events": events,
        "exchange_rates": rates,
        "request_payment_options": options,
        "messages": messages,
        "images": images,
        "requests": requests,
        "output": output,
        "ocr_extractions": ocr_logs
    }

@app.post("/api/admin/generate")
def regenerate_predictions():
    success = run_batch_evaluation(DATASET_DIR)
    return {"success": success, "message": "Predictions regenerated and output.csv updated."}

# Serve static frontend if built
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # Don't hijack API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        file_candidate = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_candidate) and os.path.isfile(file_candidate):
            return FileResponse(file_candidate)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
