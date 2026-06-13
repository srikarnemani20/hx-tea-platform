# tea_engine/units.py
# All conversions to SI base units

def convert_heat_duty(value, unit):
    """Convert heat duty to Watts."""
    factors = {"W": 1.0, "kW": 1e3, "MW": 1e6}
    return value * factors[unit]

def convert_area(value, unit):
    """Convert area to m²."""
    factors = {"m²": 1.0, "ft²": 0.092903}
    return value * factors[unit]

def convert_pressure(value, unit):
    """Convert pressure to kPa."""
    factors = {"psi": 6.89476, "bar": 100.0, "kPa": 1.0}
    return value * factors[unit]

def convert_temperature(value, unit):
    """Convert temperature to Kelvin."""
    if unit == "°C":
        return value + 273.15
    elif unit == "°F":
        return (value - 32) * 5 / 9 + 273.15
    elif unit == "K":
        return value
    return value
