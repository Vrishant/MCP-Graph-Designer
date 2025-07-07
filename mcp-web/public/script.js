const micBtn = document.getElementById("micBtn");
const queryInput = document.getElementById("queryInput");

const csvUrl = '../assets/energy_model_data.csv'; 
let csvData = [];
let headers = [];

// Initialize Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

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
      responseDiv.textContent = "Error: " + (errorData.error || "Unknown error");
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
    const finalMessage = data.response.split('\n').filter(line => !line.startsWith('[Tool:')).join('\n');
    responseDiv.innerHTML = marked.parse(finalMessage || "No response");
  } catch (err) {
    responseDiv.innerHTML = marked.parse("Error: " + err.message);
  }
});






// document.getElementById('csvFile').addEventListener('change', function (event) {
//   const file = event.target.files[0];
//   if (!file) return;

//   Papa.parse(file, {
//     header: true,
//     dynamicTyping: true,
//     complete: function (results) {
//       csvData = results.data.filter(row =>
//         Object.values(row).some(val => val !== null && val !== "")
//       );
//       csvHeaders = results.meta.fields;

//       alert("CSV loaded. Columns: " + csvHeaders.join(", "));
//     }
//   });
// });

// document.getElementById('csvFile').addEventListener('change', function (event) {
//   const file = event.target.files[0];
//   if (!file) return;

//   Papa.parse(file, {
//     header: true,
//     dynamicTyping: true,
//     complete: function (results) {
//       csvData = results.data.filter(row => Object.values(row).some(val => val !== null && val !== ""));
//       csvHeaders = results.meta.fields;
//       updateUnusedColumns();
//     }
//   });
// });

// // Dynamically update unused columns and allow adding them
// function updateUnusedColumns() {
//   const used = new Set([
//     ...document.getElementById('xAxis').value.split(',').map(x => x.trim()),
//     ...document.getElementById('yAxis').value.split(',').map(y => y.trim())
//   ]);

//   const unused = csvHeaders.filter(header => header && !used.has(header));
//   const unusedDiv = document.getElementById('unusedColumns');
//   unusedDiv.innerHTML = '';

//   unused.forEach(header => {
//     const btnX = document.createElement('button');
//     btnX.textContent = `+X: ${header}`;
//     btnX.onclick = () => addToAxis('xAxis', header);

//     const btnY = document.createElement('button');
//     btnY.textContent = `+Y: ${header}`;
//     btnY.onclick = () => addToAxis('yAxis', header);

//     const wrapper = document.createElement('div');
//     wrapper.style.margin = '5px 0';
//     wrapper.appendChild(btnX);
//     wrapper.appendChild(btnY);

//     unusedDiv.appendChild(wrapper);
//   });
// }

// // Add to axis input and refresh unused column list
// function addToAxis(axisId, value) {
//   const input = document.getElementById(axisId);
//   const current = input.value.split(',').map(s => s.trim()).filter(Boolean);
//   if (!current.includes(value)) {
//     current.push(value);
//     input.value = current.join(', ');
//     updateUnusedColumns();
//   }
// }

// // Form submit: plot selected X and Y columns
// document.getElementById('axisForm').addEventListener('submit', function (e) {
//   e.preventDefault();

//   const xKeys = document.getElementById('xAxis').value.split(',').map(s => s.trim()).filter(Boolean);
//   const yKeys = document.getElementById('yAxis').value.split(',').map(s => s.trim()).filter(Boolean);

//   if (!xKeys.length || !yKeys.length) {
//     alert("Please enter at least one X and one Y axis column.");
//     return;
//   }

//   // Validate column names
//   const allKeys = [...xKeys, ...yKeys];
//   const invalid = allKeys.filter(key => !csvHeaders.includes(key));
//   if (invalid.length) {
//     alert("Invalid column(s): " + invalid.join(', '));
//     return;
//   }

//   const traces = [];

//   yKeys.forEach(yKey => {
//     const xCombined = csvData.map(row =>
//       xKeys.map(k => row[k]).join(' | ')
//     );

//     const yValues = csvData.map(row => row[yKey]);

//     traces.push({
//       x: xCombined,
//       y: yValues,
//       mode: 'lines+markers',
//       name: yKey,
//       type: 'scatter'
//     });
//   });

//   const layout = {
//     title: `Plot: ${yKeys.join(', ')} vs ${xKeys.join(', ')}`,
//     xaxis: { title: xKeys.join(' + ') },
//     yaxis: { title: yKeys.join(', ') }
//   };

//   Plotly.newPlot('plot', traces, layout);
// });

// // // Function to load CSV from assets folder
// // function loadCSVFromAssets() {
// //   fetch("assets/energy_model_data.csv")
// //     .then(response => {
// //       if (!response.ok) {
// //         throw new Error("Network response was not ok");
// //       }
// //       return response.text();
// //     })
// //     .then(csvText => {
// //       Papa.parse(csvText, {
// //         header: true,
// //         dynamicTyping: true,
// //         complete: function (results) {
// //           csvData = results.data.filter(row =>
// //             Object.values(row).some(val => val !== null && val !== "")
// //           );
// //           csvHeaders = results.meta.fields;
// //           updateUnusedColumns();
// //           alert("CSV loaded from assets. Columns: " + csvHeaders.join(", "));
// //         }
// //       });
// //     })
// //     .catch(error => {
// //       console.error("Error loading CSV from assets:", error);
// //       alert("Failed to load CSV from assets.");
// //     });
// // }

// // // Load CSV from assets on page load
// // window.addEventListener('load', () => {
// //   loadCSVFromAssets();
// // });


const xAxisInput = document.getElementById('xAxisInput');
const yAxisInput = document.getElementById('yAxisInput');
const axisForm = document.getElementById('axisForm');
const unusedColumnsDiv = document.getElementById('unusedColumns');
const plotDiv = document.getElementById('plot');

function parseColumns(input) {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function updateUnusedColumns() {
  // Get currently selected columns
  const usedCols = new Set([
    ...parseColumns(xAxisInput.value),
    ...parseColumns(yAxisInput.value),
  ]);
  unusedColumnsDiv.innerHTML = '';

  headers.forEach(col => {
    if (!usedCols.has(col)) {
      const btn = document.createElement('button');
      btn.textContent = col;
      btn.type = 'button';
      btn.addEventListener('click', () => {
        // Add to X-axis or Y-axis based on user choice (simplified: add to X)
        // You can improve by letting user pick which axis to add to
        const xCols = parseColumns(xAxisInput.value);
        xCols.push(col);
        xAxisInput.value = xCols.join(', ');
        updateUnusedColumns();
      });
      unusedColumnsDiv.appendChild(btn);
    }
  });
}

function plotGraph(xCols, yCols) {
  if (xCols.length === 0 || yCols.length === 0) {
    alert('Please select at least one column for both X and Y axes.');
    return;
  }

  // Prepare traces for each Y column, combining all X columns by concatenation
  // For simplicity, join multiple X columns as labels

  const xData = csvData.map(row =>
    xCols.map(col => row[col]).join(' | ')
  );

  const traces = yCols.map(yCol => ({
    x: xData,
    y: csvData.map(row => Number(row[yCol])),
    mode: 'lines+markers',
    name: yCol,
  }));

  const layout = {
    title: 'CSV Data Plot',
    xaxis: { title: xCols.join(', ') },
    yaxis: { title: yCols.join(', ') },
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
      console.error('CSV load error:', err);
      alert('Failed to load CSV.');
    },
  });
}

axisForm.addEventListener('submit', e => {
  e.preventDefault();
  const xCols = parseColumns(xAxisInput.value);
  const yCols = parseColumns(yAxisInput.value);
  plotGraph(xCols, yCols);
  updateUnusedColumns();
});

async function pollForInputParams() {
  try {
    const res = await fetch("http://localhost:3000/api/set-input-params");
    if (res.ok) {
      const { xParams = [], yParams = [] } = await res.json();
      if (xParams.length || yParams.length) {
        xAxisInput.value = xParams.join(', ');
        yAxisInput.value = yParams.join(', ');
        plotGraph(xParams, yParams);
        updateUnusedColumns();
      }
    }
  } catch (err) {
    console.error("Polling axis input params error:", err);
  } finally {
    setTimeout(pollForInputParams, 1000);
  }
}


function updateAxisInputs(xParams, yParams) {
  const form = document.getElementById("axisForm");

  // Remove previous dynamic inputs
  const dynamicInputs = Array.from(form.querySelectorAll(".dynamic-axis"));
  dynamicInputs.forEach(el => el.remove());

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

  xParams.forEach(p => createInput(p, p, "x"));
  yParams.forEach(p => createInput(p, p, "y"));
}


document.addEventListener("DOMContentLoaded", () => {
  loadCsv();
  pollForInputParams();
  // pollForMoveCommands(); // optional
});