# tea_engine/economics.py

import numpy_financial as npf

def calculate_economics(cashflows, discount_rate_pct, tci, net_annual_benefit):
    """
    Calculate NPV, IRR, and Simple Payback Period.

    cashflows         : list of yearly cash flows [year0, year1, ...]
    discount_rate_pct : discount rate as percentage
    tci               : Total Capital Investment
    net_annual_benefit: net annual benefit for simple payback
    """
    rate = discount_rate_pct / 100.0

    npv = npf.npv(rate, cashflows)

    try:
        irr_val = npf.irr(cashflows)
        irr = irr_val * 100.0 if irr_val is not None and not (irr_val != irr_val) else None
    except Exception:
        irr = None

    # Simple Payback Period
    if net_annual_benefit > 0:
        payback = tci / net_annual_benefit
    else:
        payback = None

    return {
        "npv": float(npv),
        "irr": float(irr) if irr is not None else None,
        "payback_period": float(payback) if payback is not None else None,
    }
