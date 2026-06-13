# app.py
from flask import Flask, render_template, request, jsonify, session
import json

from tea_engine.units import (
    convert_heat_duty, convert_area, convert_pressure, convert_temperature
)
from tea_engine.capex import calculate_capex
from tea_engine.opex import calculate_opex
from tea_engine.cashflow import build_cashflows
from tea_engine.economics import calculate_economics

app = Flask(__name__)
app.secret_key = "tea-platform-secret-key-2024"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analysis")
def analysis():
    return render_template("analysis.html")


@app.route("/results")
def results():
    results_data = session.get("results", None)
    if not results_data:
        return render_template("results.html", results=None)
    return render_template("results.html", results=results_data)


@app.route("/run_tea", methods=["POST"])
def run_tea():
    try:
        data = request.get_json()

        # ── Technical Inputs ──────────────────────────────────────────────
        hx_type       = data["hx_type"]
        heat_duty_raw = float(data["heat_duty"])
        heat_duty_unit = data["heat_duty_unit"]
        area_raw      = float(data["area"])
        area_unit     = data["area_unit"]
        pressure_raw  = float(data["pressure"])
        pressure_unit = data["pressure_unit"]
        temp_raw      = float(data["temperature"])
        temp_unit     = data["temperature_unit"]
        material      = data["material"]

        # ── Economic Inputs ───────────────────────────────────────────────
        purchase_cost     = float(data["purchase_cost"])
        plant_life        = int(data["plant_life"])
        operating_hours   = float(data["operating_hours"])
        utility_cost      = float(data["utility_cost"])
        discount_rate_pct = float(data["discount_rate"])
        maintenance_pct   = float(data["maintenance_pct"])
        contingency_pct   = float(data["contingency_pct"])
        working_capital_pct = float(data["working_capital_pct"])

        # ── Unit Conversions ──────────────────────────────────────────────
        heat_duty_w  = convert_heat_duty(heat_duty_raw, heat_duty_unit)
        area_m2      = convert_area(area_raw, area_unit)
        pressure_kpa = convert_pressure(pressure_raw, pressure_unit)
        temp_k       = convert_temperature(temp_raw, temp_unit)

        # ── CAPEX ─────────────────────────────────────────────────────────
        capex = calculate_capex(purchase_cost, contingency_pct, working_capital_pct)

        # ── OPEX ──────────────────────────────────────────────────────────
        opex = calculate_opex(
            heat_duty_w, operating_hours, utility_cost,
            capex["tci"], maintenance_pct
        )

        # ── Cash Flows ────────────────────────────────────────────────────
        cf_data = build_cashflows(capex["tci"], opex["net_annual_benefit"], plant_life)

        # ── Economics ─────────────────────────────────────────────────────
        econ = calculate_economics(
            cf_data["cashflows"], discount_rate_pct,
            capex["tci"], opex["net_annual_benefit"]
        )

        # ── Assemble Result ───────────────────────────────────────────────
        result = {
            "inputs": {
                "hx_type": hx_type,
                "heat_duty_w": heat_duty_w,
                "area_m2": area_m2,
                "pressure_kpa": pressure_kpa,
                "temp_k": temp_k,
                "material": material,
                "plant_life": plant_life,
                "operating_hours": operating_hours,
                "discount_rate_pct": discount_rate_pct,
            },
            "capex": capex,
            "opex": opex,
            "cashflow": cf_data,
            "economics": econ,
        }

        # Store in session for results page
        session["results"] = result

        return jsonify({"status": "ok", "result": result})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)
