const csvInput = document.getElementById("csv-input");
const preview = document.getElementById("csv-preview");
const analyzeButton = document.getElementById("analyze");
const demoButton = document.getElementById("load-demo");
const resultsBody = document.getElementById("results");
const totalItems = document.getElementById("total-items");
const xCount = document.getElementById("x-count");
const yCount = document.getElementById("y-count");
const zCount = document.getElementById("z-count");
const chart = document.getElementById("chart");
const chartCtx = chart.getContext("2d");

const demoCsv = `product,demand
Alpha,120
Beta,118
Gamma,140
Delta,122
Epsilon,80
Zeta,95
Eta,75
Theta,60
Iota,45
Kappa,30
Lambda,28
Mu,24
Nu,18
Xi,15
Omicron,12
Pi,10
Rho,8
Sigma,6
Tau,4
Upsilon,3
Phi,2
Chi,2
Psi,1
Omega,1`;

const neuralWeights = {
  hidden: [
    [1.1, -0.4, 0.6],
    [-0.8, 0.9, -0.3],
    [0.4, 0.2, 1.0]
  ],
  output: [
    [1.2, -0.6, -0.4],
    [-0.2, 1.1, -0.3],
    [-0.6, -0.2, 1.4]
  ],
  biasHidden: [0.2, -0.1, 0.1],
  biasOutput: [0.1, 0.1, 0.1]
};

const categoryLabels = ["X", "Y", "Z"];

const parseCsv = (text) => {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const [product, demand] = lines[i].split(",");
    if (!product || !demand) continue;
    rows.push({ product: product.trim(), demand: Number(demand) });
  }
  return rows;
};

const groupByProduct = (rows) => {
  const map = new Map();
  rows.forEach(({ product, demand }) => {
    const current = map.get(product) ?? [];
    current.push(demand);
    map.set(product, current);
  });
  return [...map.entries()].map(([product, demands]) => ({ product, demands }));
};

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const stdDev = (values) => {
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
};

const softmax = (values) => {
  const max = Math.max(...values);
  const exp = values.map((v) => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map((v) => v / sum);
};

const neuralPredict = (features) => {
  const hidden = neuralWeights.hidden.map((weights, index) => {
    const score = weights.reduce((sum, weight, i) => sum + weight * features[i], neuralWeights.biasHidden[index]);
    return Math.tanh(score);
  });

  const output = neuralWeights.output.map((weights, index) => {
    return weights.reduce((sum, weight, i) => sum + weight * hidden[i], neuralWeights.biasOutput[index]);
  });

  const probabilities = softmax(output);
  const bestIndex = probabilities.indexOf(Math.max(...probabilities));
  return {
    label: categoryLabels[bestIndex],
    confidence: probabilities[bestIndex]
  };
};

const classifyItem = (demands) => {
  const avg = mean(demands);
  const deviation = stdDev(demands);
  const cv = avg === 0 ? 0 : deviation / avg;
  const features = [avg / 200, cv, deviation / 100];

  const { label, confidence } = neuralPredict(features);

  return {
    avg: avg.toFixed(1),
    cv: cv.toFixed(2),
    label,
    confidence
  };
};

const updateSummary = (items) => {
  totalItems.textContent = items.length;
  xCount.textContent = items.filter((item) => item.label === "X").length;
  yCount.textContent = items.filter((item) => item.label === "Y").length;
  zCount.textContent = items.filter((item) => item.label === "Z").length;
};

const renderTable = (items) => {
  resultsBody.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.product}</td>
      <td class="table-muted">${item.avg}</td>
      <td class="table-muted">${item.cv}</td>
      <td><span class="table-tag tag-${item.label.toLowerCase()}">${item.label}</span></td>
    `;
    resultsBody.appendChild(row);
  });
};

const renderChart = (items) => {
  chartCtx.clearRect(0, 0, chart.width, chart.height);
  const padding = 40;
  const barWidth = 60;
  const gap = 32;
  const categories = [
    { label: "X", color: "#22c55e" },
    { label: "Y", color: "#f59e0b" },
    { label: "Z", color: "#ef4444" }
  ];
  const totals = categories.map((cat) => items.filter((item) => item.label === cat.label).length);
  const max = Math.max(1, ...totals);

  chartCtx.font = "14px Inter, sans-serif";
  chartCtx.fillStyle = "#475569";
  chartCtx.fillText("XYZ санаттары", padding, 24);

  categories.forEach((category, index) => {
    const height = (totals[index] / max) * (chart.height - 100);
    const x = padding + index * (barWidth + gap);
    const y = chart.height - padding - height;

    chartCtx.fillStyle = category.color;
    chartCtx.fillRect(x, y, barWidth, height);
    chartCtx.fillStyle = "#0f172a";
    chartCtx.fillText(category.label, x + 22, chart.height - 16);
    chartCtx.fillText(totals[index], x + 20, y - 8);
  });
};

const runAnalysis = (text) => {
  const rows = parseCsv(text);
  const grouped = groupByProduct(rows);
  const items = grouped.map(({ product, demands }) => {
    const result = classifyItem(demands);
    return { product, ...result };
  });

  updateSummary(items);
  renderTable(items);
  renderChart(items);
};

csvInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  preview.value = text;
});

analyzeButton.addEventListener("click", () => {
  if (!preview.value.trim()) return;
  runAnalysis(preview.value);
});

demoButton.addEventListener("click", () => {
  preview.value = demoCsv;
  runAnalysis(demoCsv);
});
