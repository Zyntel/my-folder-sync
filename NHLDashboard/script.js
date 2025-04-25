async function fetchData() {
  const response = await fetch("data.csv");
  const text = await response.text();
  const rows = text.split("\n").slice(1);
  const data = [];

  for (let row of rows) {
    const cols = row.split(",");
    if (cols.length < 10) continue;

    const department = cols[6];
    const expected = new Date(cols[8]);
    const timeout = new Date(cols[10]);

    if (isNaN(expected) || isNaN(timeout)) continue;

    const diffMin = (timeout - expected) / 60000;
    let status = "On Time";

    if (diffMin < -15) status = "Swift";
    else if (diffMin > 0 && diffMin < 15) status = "Delayed";
    else if (diffMin >= 15) status = "Over Delayed";

    const shift = (expected.getHours() < 8 || expected.getHours() >= 20) ? "NIGHT" : "DAY";

    data.push({ department, shift, status });
  }

  return data;
}

function groupCounts(data, key) {
  return data.reduce((acc, curr) => {
    const k = curr[key];
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function updateCharts(data) {
  const selectedDept = document.getElementById("departmentFilter").value;
  const filtered = selectedDept === "ALL" ? data : data.filter(d => d.department === selectedDept);

  const statusCounts = groupCounts(filtered, "status");
  const shiftCounts = groupCounts(filtered, "shift");

  tatChart.data.labels = Object.keys(statusCounts);
  tatChart.data.datasets[0].data = Object.values(statusCounts);
  tatChart.update();

  shiftChart.data.labels = Object.keys(shiftCounts);
  shiftChart.data.datasets[0].data = Object.values(shiftCounts);
  shiftChart.update();
}

let tatChart, shiftChart;

async function init() {
  const data = await fetchData();

  const departments = [...new Set(data.map(d => d.department))].sort();
  const filter = document.getElementById("departmentFilter");

  for (let dept of departments) {
    const opt = document.createElement("option");
    opt.value = dept;
    opt.textContent = dept;
    filter.appendChild(opt);
  }

  filter.addEventListener("change", () => updateCharts(data));

  const ctx1 = document.getElementById("tatChart").getContext("2d");
  const ctx2 = document.getElementById("shiftChart").getContext("2d");

  tatChart = new Chart(ctx1, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{
        label: "TAT Status",
        data: [],
        backgroundColor: ["#28a745", "#ffc107", "#dc3545", "#007bff"]
      }]
    }
  });

  shiftChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: [],
      datasets: [{
        label: "Shifts",
        data: [],
        backgroundColor: ["#6c757d", "#17a2b8"]
      }]
    }
  });

  updateCharts(data);
}

init();
