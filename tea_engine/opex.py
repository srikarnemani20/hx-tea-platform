# tea_engine/opex.py

def calculate_opex(heat_duty_w, operating_hours, utility_cost, tci, maintenance_pct):
    """
    Calculate OPEX components.

    heat_duty_w       : Heat duty in Watts
    operating_hours   : Operating hours per year
    utility_cost      : Utility cost in $/kWh
    tci               : Total Capital Investment in USD
    maintenance_pct   : Maintenance as % of TCI

    Returns a dict with:
        annual_energy_kwh, annual_savings, maintenance_cost, net_annual_benefit
    """
    # Energy recovered in kWh/year (duty in W → kW → kWh)
    annual_energy_kwh = (heat_duty_w / 1000.0) * operating_hours

    annual_savings = annual_energy_kwh * utility_cost
    maintenance_cost = tci * (maintenance_pct / 100.0)
    net_annual_benefit = annual_savings - maintenance_cost

    return {
        "annual_energy_kwh": annual_energy_kwh,
        "annual_savings": annual_savings,
        "maintenance_cost": maintenance_cost,
        "net_annual_benefit": net_annual_benefit,
    }
