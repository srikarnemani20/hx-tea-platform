// static/js/results.js
// Plotly chart rendering for the TEA results page

(function () {
  if (typeof CF_DATA === "undefined") return;

  const { years, cashflows, cumulative } = CF_DATA;

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

  const posColors = cumulative.map(v =>
    v >= 0 ? "rgba(45,212,191,0.15)" : "rgba(248,81,73,0.1)"
  );

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
