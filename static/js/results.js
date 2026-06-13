// static/js/results.js
// Read data from localStorage and render KPIs and Plotly charts client-side

(function () {
  const emptyState = document.getElementById("emptyState");
  const resultsPage = document.getElementById("resultsPage");

  // Read results from localStorage
  const resultsStr = localStorage.getItem("tea_results");
  if (!resultsStr) {
    if (emptyState) emptyState.style.display = "flex";
    if (resultsPage) resultsPage.style.display = "none";
    return;
  }

  // Parse results
  const results = JSON.parse(resultsStr);
  if (emptyState) emptyState.style.display = "none";
  if (resultsPage) resultsPage.style.display = "block";

  // Helper: Format to currency
  function fmt(n) {
    if (n === null || isNaN(n) || typeof n === "undefined") return "—";
    const sign = n < 0 ? "-" : "";
    return sign + "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  // Helper: Format to simple currency string
  function fmtTbl(n) {
    return fmt(n);
  }

  // ── 1. Populate Header & Badges ─────────────────────────────────────
  document.getElementById("res_hx_type").textContent = results.inputs.hx_type;
  document.getElementById("res_material").textContent = results.inputs.material;
  document.getElementById("res_plant_life").textContent = results.inputs.plant_life + " years";
  document.getElementById("res_operating_hours").textContent = results.inputs.operating_hours.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " hr/yr";

  const badgesContainer = document.getElementById("res_badges");
  badgesContainer.innerHTML = ""; // Clear placeholders

  // NPV Badge
  if (results.economics.npv > 0) {
    badgesContainer.innerHTML += `<span class="badge badge-success">✓ NPV Positive</span>`;
  } else {
    badgesContainer.innerHTML += `<span class="badge badge-danger">✗ NPV Negative</span>`;
  }

  // IRR Badge
  if (results.economics.irr !== null) {
    if (results.economics.irr > results.inputs.discount_rate_pct) {
      badgesContainer.innerHTML += `<span class="badge badge-success">IRR &gt; Hurdle Rate</span>`;
    } else {
      badgesContainer.innerHTML += `<span class="badge badge-warning">IRR &lt; Hurdle Rate</span>`;
    }
  }

  // ── 2. Populate KPI Cards ──────────────────────────────────────────
  document.getElementById("kpi_purchase_cost").textContent = fmt(results.capex.purchase_cost);
  document.getElementById("kpi_bare_module_cost").textContent = fmt(results.capex.bare_module_cost);
  document.getElementById("res_bmf_factor").textContent = results.capex.bare_module_factor.toFixed(3);
  document.getElementById("kpi_fci").textContent = fmt(results.capex.fci);
  document.getElementById("kpi_tci").textContent = fmt(results.capex.tci);
  document.getElementById("kpi_annual_energy").textContent = results.opex.annual_energy_kwh.toLocaleString("en-US", { maximumFractionDigits: 0 });
  document.getElementById("kpi_annual_savings").textContent = fmt(results.opex.annual_savings);
  document.getElementById("kpi_annual_maintenance").textContent = fmt(results.opex.maintenance_cost);
  
  const netBenefitEl = document.getElementById("kpi_net_annual_benefit");
  netBenefitEl.textContent = fmt(results.opex.net_annual_benefit);
  netBenefitEl.className = "kpi-value " + (results.opex.net_annual_benefit >= 0 ? "positive" : "negative");

  const npvEl = document.getElementById("kpi_npv");
  npvEl.textContent = fmt(results.economics.npv);
  npvEl.className = "kpi-value " + (results.economics.npv >= 0 ? "positive" : "negative");
  document.getElementById("res_discount_rate").textContent = results.inputs.discount_rate_pct;

  document.getElementById("kpi_irr").textContent = results.economics.irr !== null ? results.economics.irr.toFixed(1) + "%" : "N/A";
  document.getElementById("kpi_payback_period").textContent = results.economics.payback_period !== null ? results.economics.payback_period.toFixed(1) + " yr" : "N/A";

  // ── 3. Populate Summary Tables ──────────────────────────────────────
  document.getElementById("tbl_purchase_cost").textContent = fmtTbl(results.capex.purchase_cost);
  document.getElementById("tbl_bmf_factor").textContent = results.capex.bare_module_factor.toFixed(3);
  document.getElementById("tbl_bare_module_cost").textContent = fmtTbl(results.capex.bare_module_cost);
  document.getElementById("tbl_contingency_cost").textContent = fmtTbl(results.capex.contingency_cost);
  document.getElementById("tbl_fci").textContent = fmtTbl(results.capex.fci);
  document.getElementById("tbl_working_capital").textContent = fmtTbl(results.capex.working_capital);
  document.getElementById("tbl_tci").textContent = fmtTbl(results.capex.tci);

  document.getElementById("tbl_annual_energy").textContent = results.opex.annual_energy_kwh.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " kWh/yr";
  document.getElementById("tbl_annual_savings").textContent = fmtTbl(results.opex.annual_savings) + "/yr";
  document.getElementById("tbl_annual_maintenance").textContent = fmtTbl(results.opex.maintenance_cost) + "/yr";
  document.getElementById("tbl_net_annual_benefit").textContent = fmtTbl(results.opex.net_annual_benefit) + "/yr";
  document.getElementById("tbl_npv").textContent = fmtTbl(results.economics.npv);
  document.getElementById("tbl_irr").textContent = results.economics.irr !== null ? results.economics.irr.toFixed(2) + "%" : "N/A";
  document.getElementById("tbl_payback_period").textContent = results.economics.payback_period !== null ? results.economics.payback_period.toFixed(2) + " years" : "N/A";

  // ── 4. Render Charts ────────────────────────────────────────────────
  const { years, cashflows, cumulative } = results.cashflow;

  const AMBER  = "#f0a500";
  const TEAL   = "#2dd4bf";
  const RED    = "#f85149";
  const GREEN  = "#3fb950";
  const GRID   = "rgba(48,54,61,0.6)";
  const BG     = "#161b22";
  const TEXT   = "#8b949e";

  const layout_base = {
    paper_bgcolor: BG,
    plot_bgcolor:  BG,
    font:  { family: "DM Mono, Fira Mono, monospace", color: TEXT, size: 11 },
    margin: { t: 10, r: 20, b: 50, l: 70 },
    xaxis: {
      gridcolor: GRID,
      zerolinecolor: GRID,
      title: { text: "Year", font: { size: 11 } },
    },
    yaxis: {
      gridcolor: GRID,
      zerolinecolor: "rgba(139,148,158,0.4)",
      tickprefix: "$",
      title: { text: "USD", font: { size: 11 } },
    },
    hoverlabel: {
      bgcolor: "#1c2330",
      bordercolor: "#30363d",
      font: { family: "DM Mono, monospace", size: 11 },
    },
    showlegend: false,
  };

  const config = { responsive: true, displayModeBar: false };

  // ── Chart 1: Annual Cash Flow ─────────────────────
  const cfColors = cashflows.map(v =>
    v < 0 ? "rgba(248,81,73,0.7)" : "rgba(63,185,80,0.7)"
  );
  const cfBorder = cashflows.map(v => v < 0 ? RED : GREEN);

  Plotly.newPlot("chartCashflow", [
    {
      type: "bar",
      x: years,
      y: cashflows,
      marker: {
        color: cfColors,
        line: { color: cfBorder, width: 1.5 },
      },
      hovertemplate: "Year %{x}<br>Cash Flow: $%{y:,.0f}<extra></extra>",
    }
  ], {
    ...layout_base,
    shapes: [{
      type: "line",
      x0: years[0], x1: years[years.length - 1],
      y0: 0, y1: 0,
      line: { color: "rgba(139,148,158,0.4)", width: 1 },
    }],
  }, config);

  // ── Chart 2: Cumulative Cash Flow ─────────────────
  // Find break-even point
  let breakEvenX = null;
  for (let i = 1; i < cumulative.length; i++) {
    if (cumulative[i - 1] < 0 && cumulative[i] >= 0) {
      // Linear interpolation
      const t = -cumulative[i-1] / (cumulative[i] - cumulative[i-1]);
      breakEvenX = years[i - 1] + t;
      break;
    }
  }

  const shapes = [
    {
      type: "line",
      x0: years[0], x1: years[years.length - 1],
      y0: 0, y1: 0,
      line: { color: "rgba(139,148,158,0.4)", width: 1 },
    }
  ];

  const annotations = [];

  if (breakEvenX !== null) {
    shapes.push({
      type: "line",
      x0: breakEvenX, x1: breakEvenX,
      y0: Math.min(...cumulative),
      y1: Math.max(...cumulative),
      line: { color: AMBER, width: 1, dash: "dot" },
    });
    annotations.push({
      x: breakEvenX,
      y: 0,
      text: `Payback ≈ ${breakEvenX.toFixed(1)} yr`,
      showarrow: true,
      arrowhead: 2,
      arrowcolor: AMBER,
      font: { color: AMBER, size: 11, family: "DM Mono, monospace" },
      bgcolor: BG,
      bordercolor: AMBER,
      borderwidth: 1,
      ax: 40, ay: -40,
    });
  }

  Plotly.newPlot("chartCumulative", [
    {
      type: "scatter",
      mode: "lines+markers",
      x: years,
      y: cumulative,
      line: { color: TEAL, width: 2.5, shape: "spline" },
      marker: { color: TEAL, size: 5 },
      fill: "tozeroy",
      fillcolor: "rgba(45,212,191,0.08)",
      hovertemplate: "Year %{x}<br>Cumulative: $%{y:,.0f}<extra></extra>",
    }
  ], {
    ...layout_base,
    shapes,
    annotations,
  }, config);

})();
