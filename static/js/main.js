// static/js/main.js

const BMF = 3.291;

// ── Unit Conversions ──────────────────────────────────────────────
function convertHeatDuty(value, unit) {
  const factors = { "W": 1.0, "kW": 1e3, "MW": 1e6 };
  return value * (factors[unit] || 1.0);
}

function convertArea(value, unit) {
  const factors = { "m²": 1.0, "ft²": 0.092903 };
  return value * (factors[unit] || 1.0);
}

function convertPressure(value, unit) {
  const factors = { "psi": 6.89476, "bar": 100.0, "kPa": 1.0 };
  return value * (factors[unit] || 1.0);
}

function convertTemperature(value, unit) {
  if (unit === "°C") {
    return value + 273.15;
  } else if (unit === "°F") {
    return (value - 32) * 5 / 9 + 273.15;
  } else if (unit === "K") {
    return value;
  }
  return value;
}

// ── Calculators ───────────────────────────────────────────────────
function calculateCapex(purchaseCost, contingencyPct, workingCapitalPct) {
  const bareModuleCost = purchaseCost * BMF;
  const contingencyCost = bareModuleCost * (contingencyPct / 100.0);
  const fci = bareModuleCost + contingencyCost;
  const workingCapital = fci * (workingCapitalPct / 100.0);
  const tci = fci + workingCapital;

  return {
    purchase_cost: purchaseCost,
    bare_module_factor: BMF,
    bare_module_cost: bareModuleCost,
    contingency_cost: contingencyCost,
    fci: fci,
    working_capital: workingCapital,
    tci: tci
  };
}

function calculateOpex(heatDutyW, operatingHours, utilityCost, tci, maintenancePct) {
  const annualEnergyKwh = (heatDutyW / 1000.0) * operatingHours;
  const annualSavings = annualEnergyKwh * utilityCost;
  const maintenanceCost = tci * (maintenancePct / 100.0);
  const netAnnualBenefit = annualSavings - maintenanceCost;

  return {
    annual_energy_kwh: annualEnergyKwh,
    annual_savings: annualSavings,
    maintenance_cost: maintenanceCost,
    net_annual_benefit: netAnnualBenefit
  };
}

function buildCashflows(tci, netAnnualBenefit, plantLife) {
  const cashflows = [-tci];
  for (let i = 0; i < plantLife; i++) {
    cashflows.push(netAnnualBenefit);
  }

  const years = Array.from({ length: plantLife + 1 }, (_, i) => i);
  const cumulative = [];
  let running = 0.0;
  for (let i = 0; i < cashflows.length; i++) {
    running += cashflows[i];
    cumulative.push(running);
  }

  return {
    years: years,
    cashflows: cashflows,
    cumulative: cumulative
  };
}

function calculateNPV(rate, cashflows) {
  let npv = 0.0;
  for (let t = 0; t < cashflows.length; t++) {
    npv += cashflows[t] / Math.pow(1 + rate, t);
  }
  return npv;
}

function calculateIRR(cashflows) {
  const maxIterations = 1000;
  const precision = 1e-7;

  // Primary guess: 10%
  let guess = 0.1;
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0.0;
    let dNpv = 0.0;

    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / Math.pow(1 + guess, t);
      if (t > 0) {
        dNpv -= t * cashflows[t] / Math.pow(1 + guess, t + 1);
      }
    }

    if (Math.abs(dNpv) < 1e-12) {
      break;
    }

    let nextGuess = guess - npv / dNpv;
    if (Math.abs(nextGuess - guess) < precision) {
      return nextGuess * 100.0;
    }
    guess = nextGuess;
  }

  // Alternate guess: -10% if primary guess fails
  guess = -0.1;
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0.0;
    let dNpv = 0.0;

    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / Math.pow(1 + guess, t);
      if (t > 0) {
        dNpv -= t * cashflows[t] / Math.pow(1 + guess, t + 1);
      }
    }

    if (Math.abs(dNpv) < 1e-12) {
      break;
    }

    let nextGuess = guess - npv / dNpv;
    if (Math.abs(nextGuess - guess) < precision) {
      return nextGuess * 100.0;
    }
    guess = nextGuess;
  }

  return null;
}

function calculateEconomics(cashflows, discountRatePct, tci, netAnnualBenefit) {
  const rate = discountRatePct / 100.0;
  const npv = calculateNPV(rate, cashflows);
  const irr = calculateIRR(cashflows);

  let payback = null;
  if (netAnnualBenefit > 0) {
    payback = tci / netAnnualBenefit;
  }

  return {
    npv: npv,
    irr: irr,
    payback_period: payback
  };
}

// ── UI Integration ────────────────────────────────────────────────
function fmt(n) {
  if (n === null || isNaN(n)) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function updatePreview() {
  const pc  = parseFloat(document.getElementById("purchase_cost").value)  || 0;
  const oh  = parseFloat(document.getElementById("operating_hours").value) || 0;
  const uc  = parseFloat(document.getElementById("utility_cost").value)    || 0;
  const mp  = parseFloat(document.getElementById("maintenance_pct").value) || 0;
  const cp  = parseFloat(document.getElementById("contingency_pct").value) || 0;
  const wcp = parseFloat(document.getElementById("working_capital_pct").value) || 0;
  const hd  = parseFloat(document.getElementById("heat_duty").value)       || 0;
  const hdu = document.getElementById("heat_duty_unit").value;
  const type = document.getElementById("hx_type").value;

  // Convert heat duty to kW
  let hd_kw = hd;
  if (hdu === "W")  hd_kw = hd / 1000;
  if (hdu === "MW") hd_kw = hd * 1000;

  const bmc  = pc * BMF;
  const cont = bmc * (cp / 100);
  const fci  = bmc + cont;
  const wc   = fci * (wcp / 100);
  const tci  = fci + wc;

  const energy_kwh  = hd_kw * oh;
  const savings     = energy_kwh * uc;
  const maintenance = tci * (mp / 100);
  const net_benefit = savings - maintenance;
  const payback     = net_benefit > 0 ? (tci / net_benefit) : null;

  document.getElementById("prev_type").textContent    = type;
  document.getElementById("prev_bmc").textContent     = fmt(bmc);
  document.getElementById("prev_tci").textContent     = fmt(tci);
  document.getElementById("prev_energy").textContent  =
    energy_kwh > 0 ? energy_kwh.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " kWh/yr" : "—";
  document.getElementById("prev_savings").textContent = fmt(savings);
  document.getElementById("prev_payback").textContent =
    payback !== null ? payback.toFixed(1) + " yr" : "—";
}

function runTEA() {
  const btn = document.getElementById("runBtn");
  const errDiv = document.getElementById("errorMsg");
  const loading = document.getElementById("loadingOverlay");

  errDiv.style.display = "none";

  // Gather inputs
  const inputs = {
    hx_type:             document.getElementById("hx_type").value,
    heat_duty:           parseFloat(document.getElementById("heat_duty").value),
    heat_duty_unit:      document.getElementById("heat_duty_unit").value,
    area:                parseFloat(document.getElementById("area").value),
    area_unit:           document.getElementById("area_unit").value,
    pressure:            parseFloat(document.getElementById("pressure").value),
    pressure_unit:       document.getElementById("pressure_unit").value,
    temperature:         parseFloat(document.getElementById("temperature").value),
    temperature_unit:    document.getElementById("temperature_unit").value,
    material:            document.getElementById("material").value,
    purchase_cost:       parseFloat(document.getElementById("purchase_cost").value),
    plant_life:          parseInt(document.getElementById("plant_life").value),
    operating_hours:     parseFloat(document.getElementById("operating_hours").value),
    utility_cost:        parseFloat(document.getElementById("utility_cost").value),
    discount_rate:       parseFloat(document.getElementById("discount_rate").value),
    maintenance_pct:     parseFloat(document.getElementById("maintenance_pct").value),
    contingency_pct:     parseFloat(document.getElementById("contingency_pct").value),
    working_capital_pct: parseFloat(document.getElementById("working_capital_pct").value)
  };

  // Basic validation
  for (const [key, val] of Object.entries(inputs)) {
    if (val === "" || val === null || isNaN(val)) {
      errDiv.textContent = `Missing or invalid value: ${key.replace('_', ' ')}`;
      errDiv.style.display = "block";
      return;
    }
  }

  btn.disabled = true;
  loading.classList.add("active");

  // Run Calculations
  setTimeout(() => {
    try {
      const heatDutyW = convertHeatDuty(inputs.heat_duty, inputs.heat_duty_unit);
      const areaM2 = convertArea(inputs.area, inputs.area_unit);
      const pressureKpa = convertPressure(inputs.pressure, inputs.pressure_unit);
      const tempK = convertTemperature(inputs.temperature, inputs.temperature_unit);

      const capex = calculateCapex(inputs.purchase_cost, inputs.contingency_pct, inputs.working_capital_pct);
      const opex = calculateOpex(heatDutyW, inputs.operating_hours, inputs.utility_cost, capex.tci, inputs.maintenance_pct);
      const cashflow = buildCashflows(capex.tci, opex.net_annual_benefit, inputs.plant_life);
      const economics = calculateEconomics(cashflow.cashflows, inputs.discount_rate, capex.tci, opex.net_annual_benefit);

      const result = {
        inputs: {
          hx_type: inputs.hx_type,
          heat_duty_w: heatDutyW,
          area_m2: areaM2,
          pressure_kpa: pressureKpa,
          temp_k: tempK,
          material: inputs.material,
          plant_life: inputs.plant_life,
          operating_hours: inputs.operating_hours,
          discount_rate_pct: inputs.discount_rate
        },
        capex: capex,
        opex: opex,
        cashflow: cashflow,
        economics: economics
      };

      // Store in localStorage
      localStorage.setItem("tea_results", JSON.stringify(result));

      // Redirect to results
      window.location.href = "results.html";

    } catch (e) {
      errDiv.textContent = "Error running calculation: " + e.message;
      errDiv.style.display = "block";
      btn.disabled = false;
      loading.classList.remove("active");
    }
  }, 800); // Add a small delay for a realistic loading feel
}

// Init preview on load
document.addEventListener("DOMContentLoaded", updatePreview);
