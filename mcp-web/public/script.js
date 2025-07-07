const micBtn = document.getElementById("micBtn");
const queryInput = document.getElementById("queryInput");

const csvUrl = "../assets/energy_model_data.csv";
let csvData = [];
let headers = [];

// Initialize Web Speech API
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  micBtn.addEventListener("click", () => {
    recognition.start();
    micBtn.textContent = "🎙️ Listening...";
  });

  recognition.addEventListener("result", (event) => {
    const transcript = event.results[0][0].transcript.trim();
    queryInput.value = transcript;
    micBtn.textContent = "🎤 Speak";

    // Optionally auto-submit after recognition:
    document.getElementById("sendBtn").click();
  });

  recognition.addEventListener("end", () => {
    micBtn.textContent = "🎤 Speak";
  });

  recognition.addEventListener("error", (event) => {
    console.error("Speech recognition error:", event.error);
    micBtn.textContent = "🎤 Speak";
  });
} else {
  micBtn.disabled = true;
  micBtn.textContent = "🎤 Not supported";
  console.warn("Web Speech API not supported in this browser.");
}

document.getElementById("sendBtn").addEventListener("click", async () => {
  const queryInput = document.getElementById("queryInput");
  const responseDiv = document.getElementById("response");
  const query = queryInput.value.trim();

  if (!query) {
    responseDiv.textContent = "Please enter a query.";
    return;
  }

  responseDiv.textContent = "Loading...";

  try {
    const res = await fetch("http://localhost:3000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { error: "Unknown error" };
      }
      responseDiv.textContent =
        "Error: " + (errorData.error || "Unknown error");
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch {
      responseDiv.textContent = "Error: Invalid JSON response from server";
      return;
    }
    // Show only the final message, not intermediate tool messages
    const finalMessage = data.response
      .split("\n")
      .filter((line) => !line.startsWith("[Tool:"))
      .join("\n");
    responseDiv.innerHTML = marked.parse(finalMessage || "No response");
  } catch (err) {
    responseDiv.innerHTML = marked.parse("Error: " + err.message);
  }
});

const xAxisInput = document.getElementById("xAxisInput");
const yAxisInput = document.getElementById("yAxisInput");
const axisForm = document.getElementById("axisForm");
const unusedColumnsDiv = document.getElementById("unusedColumns");
const plotDiv = document.getElementById("plot");

function parseColumns(input) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function updateUnusedColumns() {
  // Get currently selected columns
  const usedCols = new Set([
    ...parseColumns(xAxisInput.value),
    ...parseColumns(yAxisInput.value),
  ]);
  unusedColumnsDiv.innerHTML = "";

  headers.forEach((col) => {
    if (!usedCols.has(col)) {
      const btn = document.createElement("button");
      btn.textContent = col;
      btn.type = "button";
      btn.addEventListener("click", () => {
        // Add to X-axis or Y-axis based on user choice (simplified: add to X)
        // You can improve by letting user pick which axis to add to
        const xCols = parseColumns(xAxisInput.value);
        xCols.push(col);
        xAxisInput.value = xCols.join(", ");
        updateUnusedColumns();
      });
      unusedColumnsDiv.appendChild(btn);
    }
  });
}

function plotGraph(xCols, yCols) {
  if (xCols.length === 0 || yCols.length === 0) {
    alert("Please select at least one column for both X and Y axes.");
    return;
  }

  const filterCol = document.getElementById("filterColumn").value.trim();
  const filterVal = document.getElementById("filterValue").value.trim();

  let filteredData = csvData;
  if (filterCol && filterVal) {
    filteredData = csvData.filter((row) => String(row[filterCol]) === filterVal);
  }

  const xData = filteredData.map((row) => xCols.map((col) => row[col]).join(" | "));
  const traces = yCols.map((yCol) => ({
    x: xData,
    y: filteredData.map((row) => Number(row[yCol])),
    mode: "lines+markers",
    name: yCol,
  }));

  const layout = {
    title: `CSV Data Plot ${filterCol && filterVal ? `(Filtered: ${filterCol}=${filterVal})` : ""}`,
    xaxis: { title: xCols.join(", ") },
    yaxis: { title: yCols.join(", ") },
    height: 500,
    margin: { t: 50, b: 100 },
  };

  Plotly.newPlot(plotDiv, traces, layout, { responsive: true });
}


function loadCsv() {
  Papa.parse(csvUrl, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      csvData = results.data;
      headers = results.meta.fields;
      updateUnusedColumns();
    },
    error: (err) => {
      console.error("CSV load error:", err);
      alert("Failed to load CSV.");
    },
  });
}

axisForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const xCols = parseColumns(xAxisInput.value);
  const yCols = parseColumns(yAxisInput.value);
  plotGraph(xCols, yCols);
  updateUnusedColumns();
});

const functionMap = {
  showDataTable: () => showDataTable(),
  plotGraph: ({ xCols = [], yCols = [] }) => plotGraph(xCols, yCols),
  filterAndPlot: ({ xCols = [], yCols = [], filterCol = "", filterVal = "" }) => {
    document.getElementById("xAxisInput").value = xCols.join(", ");
    document.getElementById("yAxisInput").value = yCols.join(", ");
    document.getElementById("filterColumn").value = filterCol;
    document.getElementById("filterValue").value = filterVal;
    plotGraph(xCols, yCols);
  },
  setInputs: ({ xCols = [], yCols = [] }) => {
    document.getElementById("xAxisInput").value = xCols.join(", ");
    document.getElementById("yAxisInput").value = yCols.join(", ");
    updateUnusedColumns();
  },
};

async function pollForInputParams() {
  try {
    const res = await fetch("http://localhost:3000/api/set-input-params");
    console.log(res);
    if (res.ok) {
      const command = await res.json();

      if (command.function && typeof functionMap[command.function] === "function") {
        functionMap[command.function](command.params || {});
      } else {
        console.warn(`Unknown function: ${command.function}`);
      }
    }
  } catch (err) {
    console.error("Polling error:", err);
  } finally {
    setTimeout(pollForInputParams, 2000); // Poll again
  }
}


function showDataTable() {
  const tableDiv = document.getElementById("dataTable");
  tableDiv.innerHTML = "";

  if (csvData.length === 0 || headers.length === 0) {
    tableDiv.textContent = "No data available.";
    return;
  }

  const table = document.createElement("table");
  table.border = "1";
  table.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  csvData.forEach((row) => {
    const tr = document.createElement("tr");
    headers.forEach((h) => {
      const td = document.createElement("td");
      td.textContent = row[h];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
}

document.getElementById("showDataBtn").addEventListener("click", showDataTable);



function updateAxisInputs(xParams, yParams) {
  const form = document.getElementById("axisForm");

  // Remove previous dynamic inputs
  const dynamicInputs = Array.from(form.querySelectorAll(".dynamic-axis"));
  dynamicInputs.forEach((el) => el.remove());

  function createInput(labelText, paramName, axisType) {
    const label = document.createElement("label");
    label.textContent = `${axisType.toUpperCase()}: ${paramName}`;
    label.className = "dynamic-axis";

    const input = document.createElement("input");
    input.type = "text";
    input.name = `${axisType}-${paramName}`;
    input.placeholder = `Enter ${paramName}`;
    input.className = "dynamic-axis";

    form.insertBefore(label, form.lastElementChild);
    form.insertBefore(input, form.lastElementChild);
  }

  xParams.forEach((p) => createInput(p, p, "x"));
  yParams.forEach((p) => createInput(p, p, "y"));
}

document.addEventListener("DOMContentLoaded", () => {
  loadCsv();
  pollForInputParams();
  // pollForMoveCommands(); // optional
});
