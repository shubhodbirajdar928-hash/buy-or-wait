from typing import List, Dict, Tuple, Optional
from datetime import datetime
from backend.engine.models import ExchangeRate

class CurrencyConverter:
    def __init__(self, rates: List[ExchangeRate]):
        self.rates = rates
        # Key: (date_str, base_curr, target_curr) -> rate
        self.rate_map: Dict[Tuple[str, str, str], float] = {}
        # Distinct dates sorted
        self.dates_available = set()
        
        for r in rates:
            b = r.base_currency.upper().strip()
            t = r.target_currency.upper().strip()
            d = r.conversion_date.strip()
            self.rate_map[(d, b, t)] = float(r.rate)
            self.dates_available.add(d)

    def get_rate(self, from_curr: str, to_curr: str, conversion_date: str) -> float:
        b = from_curr.upper().strip()
        t = to_curr.upper().strip()
        d = conversion_date.strip()

        if b == t:
            return 1.0

        # Direct exact match
        if (d, b, t) in self.rate_map:
            return self.rate_map[(d, b, t)]

        # Inverse exact match
        if (d, t, b) in self.rate_map:
            inv = self.rate_map[(d, t, b)]
            return 1.0 / inv if inv != 0 else 1.0

        # Closest preceding date match
        all_dates = sorted(list(self.dates_available))
        candidate_date = None
        for cand in all_dates:
            if cand <= d:
                candidate_date = cand
            else:
                break
                
        if not candidate_date and all_dates:
            candidate_date = all_dates[0]

        if candidate_date:
            if (candidate_date, b, t) in self.rate_map:
                return self.rate_map[(candidate_date, b, t)]
            if (candidate_date, t, b) in self.rate_map:
                inv = self.rate_map[(candidate_date, t, b)]
                return 1.0 / inv if inv != 0 else 1.0

        # Check bridge via USD
        if b != "USD" and t != "USD":
            r_b_usd = self.get_rate(b, "USD", conversion_date)
            r_usd_t = self.get_rate("USD", t, conversion_date)
            return r_b_usd * r_usd_t

        return 1.0

    def convert(self, amount: float, from_curr: str, to_curr: str, conversion_date: str) -> float:
        if amount is None:
            return 0.0
        rate = self.get_rate(from_curr, to_curr, conversion_date)
        return round(amount * rate, 2)
