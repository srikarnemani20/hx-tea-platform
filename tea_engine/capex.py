# tea_engine/capex.py

BARE_MODULE_FACTOR = 3.291

def calculate_capex(purchase_cost, contingency_pct, working_capital_pct):
    """
    Calculate CAPEX components.

    Returns a dict with:
        bare_module_cost, contingency_cost, fci, working_capital, tci
    """
    bare_module_cost = purchase_cost * BARE_MODULE_FACTOR
    contingency_cost = bare_module_cost * (contingency_pct / 100.0)
    fci = bare_module_cost + contingency_cost
    working_capital = fci * (working_capital_pct / 100.0)
    tci = fci + working_capital

    return {
        "purchase_cost": purchase_cost,
        "bare_module_factor": BARE_MODULE_FACTOR,
        "bare_module_cost": bare_module_cost,
        "contingency_cost": contingency_cost,
        "fci": fci,
        "working_capital": working_capital,
        "tci": tci,
    }
