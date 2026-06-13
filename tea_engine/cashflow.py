# tea_engine/cashflow.py

def build_cashflows(tci, net_annual_benefit, plant_life):
    """
    Build yearly cash flow array.

    Year 0  : -TCI  (initial investment)
    Year 1+ : net_annual_benefit

    Returns list of cash flows indexed [year_0, year_1, ..., year_n]
    """
    cashflows = [-tci] + [net_annual_benefit] * int(plant_life)
    years = list(range(int(plant_life) + 1))

    cumulative = []
    running = 0.0
    for cf in cashflows:
        running += cf
        cumulative.append(running)

    return {
        "years": years,
        "cashflows": cashflows,
        "cumulative": cumulative,
    }
