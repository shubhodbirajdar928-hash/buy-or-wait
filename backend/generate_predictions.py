import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import csv
from typing import List, Dict
from backend.engine.models import (
    UserProfile, FinancialEvent, ExchangeRate, PaymentOption,
    FinancialRequest, ImageRecord, MessageRecord
)
from backend.engine.currency import CurrencyConverter
from backend.engine.ocr_extractor import OCRExtractor
from backend.engine.forecaster import BalanceForecaster
from backend.engine.evaluator import AffordabilityEvaluator
from backend.engine.validator import OutputValidator, REQUIRED_COLUMNS

def load_data(dataset_dir: str = "dataset"):
    # 1. Profiles
    profiles: Dict[str, UserProfile] = {}
    with open(os.path.join(dataset_dir, "financial_profiles.csv"), mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            profiles[r["user_id"]] = UserProfile(
                user_id=r["user_id"],
                name=r["name"],
                home_currency=r["home_currency"],
                current_balance=float(r["current_balance"]),
                minimum_balance_to_keep=float(r["minimum_balance_to_keep"]),
                accepted_payment_methods=[m.strip() for m in r["accepted_payment_methods"].split(",")],
                financial_priorities=r["financial_priorities"],
                willingness_to_reduce_flexible_spending=r["willingness_to_reduce_flexible_spending"].lower() == "true"
            )

    # 2. Exchange Rates
    rates: List[ExchangeRate] = []
    with open(os.path.join(dataset_dir, "exchange_rates.csv"), mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rates.append(ExchangeRate(
                conversion_date=r["conversion_date"],
                base_currency=r["base_currency"],
                target_currency=r["target_currency"],
                rate=float(r["rate"])
            ))

    # 3. Images mapping
    images: Dict[str, ImageRecord] = {}
    with open(os.path.join(dataset_dir, "images.csv"), mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            images[r["image_id"]] = ImageRecord(
                image_id=r["image_id"],
                related_event_id=r["related_event_id"],
                file_path=r["file_path"],
                description=r["description"]
            )

    # 4. OCR missing amounts for financial events
    ocr = OCRExtractor(media_dir=dataset_dir)
    events: List[FinancialEvent] = []
    with open(os.path.join(dataset_dir, "financial_events.csv"), mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            raw_amt = r["amount"].strip()
            amount_val = None
            extracted = False

            if raw_amt != "":
                amount_val = float(raw_amt)
            else:
                # Resolve via related image!
                rel_img_id = r.get("related_event_id", "").strip()
                # Find image by ID or related_event_id
                target_img = None
                if rel_img_id in images:
                    target_img = images[rel_img_id]
                else:
                    for img in images.values():
                        if img.related_event_id == r["event_id"] or img.image_id == rel_img_id:
                            target_img = img
                            break

                if target_img:
                    extracted_amt, method = ocr.extract_amount_from_image(target_img.file_path)
                    if extracted_amt is not None:
                        amount_val = extracted_amt
                        extracted = True
                        print(f"[OCR] Resolved event {r['event_id']} amount as {amount_val} via {method} ({target_img.file_path})")

            events.append(FinancialEvent(
                event_id=r["event_id"],
                user_id=r["user_id"],
                event_date=r["event_date"],
                event_type=r["event_type"],
                description=r["description"],
                amount=amount_val,
                currency=r["currency"],
                status=r["status"],
                is_essential=r["is_essential"].lower() == "true",
                is_flexible=r["is_flexible"].lower() == "true",
                recurrence_interval=r["recurrence_interval"],
                end_date=r["end_date"] if r["end_date"].strip() else None,
                related_event_id=r["related_event_id"],
                extracted_from_image=extracted
            ))

    # 5. Payment options
    options: List[PaymentOption] = []
    with open(os.path.join(dataset_dir, "request_payment_options.csv"), mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            amounts = [float(x.strip()) for x in r["payment_amounts"].split(",")]
            options.append(PaymentOption(
                payment_option_id=r["payment_option_id"],
                request_id=r["request_id"],
                option_type=r["option_type"],
                first_payment_date=r["first_payment_date"],
                number_of_payments=int(r["number_of_payments"]),
                days_between_payments=int(r["days_between_payments"]),
                financing_fees=float(r["financing_fees"]),
                total_payable_amount=float(r["total_payable_amount"]),
                payment_amounts=amounts
            ))

    # 6. Requests
    requests: List[FinancialRequest] = []
    with open(os.path.join(dataset_dir, "requests.csv"), mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            requests.append(FinancialRequest(
                request_id=r["request_id"],
                user_id=r["user_id"],
                request_date=r["request_date"],
                purchase_description=r["purchase_description"],
                requested_amount=float(r["requested_amount"]),
                currency=r["currency"],
                desired_completion_date=r["desired_completion_date"],
                request_type=r["request_type"],
                allows_partial_payment=r["allows_partial_payment"].lower() == "true"
            ))

    return profiles, rates, events, options, requests, images

def run_batch_evaluation(dataset_dir: str = "dataset", output_file: str = None):
    if output_file is None:
        output_file = os.path.join(dataset_dir, "output.csv")

    profiles, rates, events, options, requests, images = load_data(dataset_dir)
    converter = CurrencyConverter(rates)
    forecaster = BalanceForecaster(converter)
    evaluator = AffordabilityEvaluator(forecaster, converter)
    validator = OutputValidator()

    output_rows = []
    all_valid = True

    print(f"\n=======================================================")
    print(f"   BUY OR WAIT - DETERMINISTIC EVALUATION RUNNER")
    print(f"=======================================================\n")

    for req in requests:
        user = profiles[req.user_id]
        user_events = [e for e in events if e.user_id == req.user_id]
        
        eval_res, scenarios = evaluator.evaluate_request(user, user_events, req, options)
        
        is_valid, validation_errors = validator.validate_evaluation_result(
            eval_res, req, user, user_events, options
        )

        if not is_valid:
            all_valid = False
            print(f"[VALIDATION FAIL] Request {req.request_id}: {validation_errors}")
        else:
            print(f"[VALID] {req.request_id} ({user.name}) -> {eval_res.affordability_status.upper()} | Method: {eval_res.recommended_payment_method} | Plan: {eval_res.payment_plan}")

        output_rows.append({
            "request_id": eval_res.request_id,
            "amount_safe_to_pay": f"{eval_res.amount_safe_to_pay:.2f}",
            "affordability_status": eval_res.affordability_status,
            "recommended_payment_method": eval_res.recommended_payment_method,
            "payment_plan": eval_res.payment_plan,
            "earliest_date_for_full_payment": eval_res.earliest_date_for_full_payment,
            "spending_changes_needed": eval_res.spending_changes_needed,
            "decision_explanation": eval_res.decision_explanation
        })

    # Write output.csv
    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=REQUIRED_COLUMNS)
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"\nSaved {len(output_rows)} validated predictions to: {output_file}")
    print(f"All constraints satisfied: {all_valid}\n")
    return all_valid

if __name__ == "__main__":
    run_batch_evaluation()
