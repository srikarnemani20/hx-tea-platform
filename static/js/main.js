// static/js/main.js

const BMF = 3.291;

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

async function runTEA() {
  const btn = document.getElementById("runBtn");
  const errDiv = document.getElementById("errorMsg");
  const loading = document.getElementById("loadingOverlay");

  errDiv.style.display = "none";

  // Gather inputs
  const payload = {
    hx_type:           document.getElementById("hx_type").value,
    heat_duty:         document.getElementById("heat_duty").value,
    heat_duty_unit:    document.getElementById("heat_duty_unit").value,
    area:              document.getElementById("area").value,
    area_unit:         document.getElementById("area_unit").value,
    pressure:          document.getElementById("pressure").value,
    pressure_unit:     document.getElementById("pressure_unit").value,
    temperature:       document.getElementById("temperature").value,
    temperature_unit:  document.getElementById("temperature_unit").value,
    material:          document.getElementById("material").value,
    purchase_cost:     document.getElementById("purchase_cost").value,
    plant_life:        document.getElementById("plant_life").value,
    operating_hours:   document.getElementById("operating_hours").value,
    utility_cost:      document.getElementById("utility_cost").value,
    discount_rate:     document.getElementById("discount_rate").value,
    maintenance_pct:   document.getElementById("maintenance_pct").value,
    contingency_pct:   document.getElementById("contingency_pct").value,
    working_capital_pct: document.getElementById("working_capital_pct").value,
  };

  // Basic validation
  for (const [key, val] of Object.entries(payload)) {
    if (val === "" || val === null) {
      errDiv.textContent = `Missing value: ${key}`;
      errDiv.style.display = "block";
      return;
    }
  }

  btn.disabled = true;
  loading.classList.add("active");

  try {
    const resp = await fetch("/run_tea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (data.status === "ok") {
      window.location.href = "/results";
    } else {
      errDiv.textContent = "Error: " + (data.message || "Unknown error");
      errDiv.style.display = "block";
    }
  } catch (e) {
    errDiv.textContent = "Network error: " + e.message;
    errDiv.style.display = "block";
  } finally {
    btn.disabled = false;
    loading.classList.remove("active");
  }
}

// Init preview on load
document.addEventListener("DOMContentLoaded", updatePreview);
