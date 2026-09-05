const SUPABASE_URL = "https://abhyszqpkmdsdmxswpqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_tezeZtjs7W4XlRUkX02GXQ_ddRMNITh";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const loginSection = document.getElementById("login-section");
const appSection = document.getElementById("app-section");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");

const loginMessage = document.getElementById("login-message");
const saveMessage = document.getElementById("save-message");

const dateInput = document.getElementById("date");
const medicationInput = document.getElementById("medication");
const periodInput = document.getElementById("period");
const notesInput = document.getElementById("notes");
const intensityInputs = Array.from(
  document.querySelectorAll('input[name="intensity"]')
);
const intensityLabels = Array.from(
  document.querySelectorAll(".star-rating label")
);

const saveButton = document.getElementById("save-button");
const entriesDiv = document.getElementById("entries");

const previousMonthButton = document.getElementById("previous-month");
const nextMonthButton = document.getElementById("next-month");
const monthTitle = document.getElementById("month-title");
const monthRange = document.getElementById("month-range");
const calendarGrid = document.getElementById("calendar-grid");

const monthlyChart = document.getElementById("monthly-chart");
const chartEmpty = document.getElementById("chart-empty");
const chartLegend = document.getElementById("chart-legend");
const chartSummary = document.getElementById("chart-summary");

const currentMonth = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1
);
let selectedMonth = new Date(currentMonth);
let entriesData = [];


function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}


function monthNumber(date) {
  return date.getFullYear() * 12 + date.getMonth();
}


function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}


function getDateKey(value) {
  return String(value || "").slice(0, 10);
}


function getMonthLabel(date) {
  return date.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric"
  });
}


function getMonthEntries() {
  const monthKey = getMonthKey(selectedMonth);

  return entriesData.filter((entry) =>
    getDateKey(entry.date).startsWith(monthKey)
  );
}


function clampIntensity(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(4, Math.max(0, Math.round(numericValue)));
}


function hasMedication(entry) {
  return entry.medication === true || entry.medication === "true";
}


function hasPeriod(entry) {
  return String(entry.period ?? "").trim() === "1";
}


function updateStarDisplay(value) {
  intensityLabels.forEach((label, index) => {
    label.classList.toggle("is-filled", index < value);
  });
}


function getSelectedIntensity() {
  const selected = document.querySelector(
    'input[name="intensity"]:checked'
  );

  return selected ? Number(selected.value) : null;
}


function resetIntensity() {
  intensityInputs.forEach((input) => {
    input.checked = false;
  });
  updateStarDisplay(0);
}


function formatEntryDate(value) {
  const dateKey = getDateKey(value);
  const parsed = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}


function formatRating(value) {
  const intensity = clampIntensity(value);

  if (intensity < 1) {
    return "Keine Angabe";
  }

  return "★".repeat(intensity) + "☆".repeat(4 - intensity);
}


function updateMonthNavigation() {
  monthTitle.textContent = getMonthLabel(selectedMonth);
  monthRange.textContent = "Alle gespeicherten Einträge";
  previousMonthButton.disabled = false;
  nextMonthButton.disabled = false;
}

function getCalendarSummary() {
  const summaryByDate = new Map();
  const monthKey = getMonthKey(selectedMonth);

  for (const entry of entriesData) {
    const dateKey = getDateKey(entry.date);

    if (!dateKey.startsWith(monthKey)) {
      continue;
    }

    const oldSummary = summaryByDate.get(dateKey) || {
      intensity: 0,
      medication: false,
      period: false
    };

    summaryByDate.set(dateKey, {
      intensity: Math.max(oldSummary.intensity, clampIntensity(entry.intensity)),
      medication: oldSummary.medication || hasMedication(entry),
      period: oldSummary.period || hasPeriod(entry)
    });
  }

  return summaryByDate;
}


function renderCalendar() {
  const summaryByDate = getCalendarSummary();
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  calendarGrid.replaceChildren();

  for (let index = 0; index < firstWeekday; index += 1) {
    const emptyCell = document.createElement("span");
    emptyCell.className = "calendar-day calendar-empty";
    emptyCell.setAttribute("aria-hidden", "true");
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const summary = summaryByDate.get(dateKey);
    const cell = document.createElement("div");

    cell.className = "calendar-day";
    cell.setAttribute("role", "gridcell");

    const dayNumber = document.createElement("span");
    dayNumber.className = "day-number";
    dayNumber.textContent = String(day);

    const indicators = document.createElement("span");
    indicators.className = "day-indicators";

    if (summary) {
      cell.classList.add("has-entry");

      if (summary.intensity > 0) {
        cell.classList.add(`intensity-${summary.intensity}`);
      } else {
        cell.classList.add("intensity-none");
      }

      const labelDate = new Date(year, month, day).toLocaleDateString(
        "de-DE",
        { day: "numeric", month: "long" }
      );
      const intensityText = summary.intensity > 0
        ? formatRating(summary.intensity)
        : "keine Stärke angegeben";
      const medicationText = summary.medication
        ? ", Medikament genommen"
        : "";
      const periodText = summary.period
        ? ", Periode"
        : "";

      cell.setAttribute(
        "aria-label",
        labelDate + ": " + intensityText + medicationText + periodText
      );
      cell.title = cell.getAttribute("aria-label");

      if (summary.medication) {
        const pill = document.createElement("span");
        pill.className = "pill-icon";
        pill.setAttribute("aria-label", "Medikament genommen");
        pill.textContent = "💊";
        indicators.appendChild(pill);
      }

      if (summary.period) {
        const period = document.createElement("span");
        period.className = "period-icon";
        period.setAttribute("aria-label", "Periode");
        period.textContent = "🩸";
        indicators.appendChild(period);
      }
    } else {
      cell.setAttribute(
        "aria-label",
        new Date(year, month, day).toLocaleDateString(
          "de-DE",
          { day: "numeric", month: "long" }
        )
      );
    }

    cell.append(dayNumber, indicators);
    calendarGrid.appendChild(cell);
  }
}


function svgElement(name, attributes = {}, text = "") {
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    name
  );

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (text) {
    element.textContent = text;
  }

  return element;
}


function colorForIntensity(value) {
  const intensity = clampIntensity(value);

  return {
    1: "#f6c4bb",
    2: "#ee9e9e",
    3: "#e47b8d",
    4: "#c95776"
  }[intensity] || "#d9d5dc";
}


function renderMonthlyChart() {
  const monthEntries = entriesData;
  const recordsByDate = new Map();

  for (const entry of monthEntries) {
    const dateKey = getDateKey(entry.date);

    if (!dateKey) {
      continue;
    }

    const record = recordsByDate.get(dateKey) || {
      intensities: [],
      medication: false,
      period: false
    };
    const intensity = clampIntensity(entry.intensity);

    if (intensity > 0) {
      record.intensities.push(intensity);
    }

    record.medication = record.medication || hasMedication(entry);
    record.period = record.period || hasPeriod(entry);
    recordsByDate.set(dateKey, record);
  }

  const dates = Array.from(recordsByDate.keys()).sort();
  const dailyRecords = dates.map((date) => {
    const record = recordsByDate.get(date);
    const mean = record.intensities.length
      ? record.intensities.reduce((sum, value) => sum + value, 0) /
        record.intensities.length
      : null;

    return {
      date,
      mean,
      medication: record.medication,
      period: record.period
    };
  });
  const intensityRecords = dailyRecords.filter((record) => record.mean !== null);
  const allIntensityValues = monthEntries
    .map((entry) => clampIntensity(entry.intensity))
    .filter((value) => value > 0);
  const overallMean = allIntensityValues.length
    ? allIntensityValues.reduce((sum, value) => sum + value, 0) /
      allIntensityValues.length
    : null;
  const medicationDates = dailyRecords
    .filter((record) => record.medication)
    .map((record) => record.date);
  const periodDates = dailyRecords
    .filter((record) => record.period)
    .map((record) => record.date);
  const hasData = dailyRecords.length > 0;
  const summaryParts = [];

  if (monthEntries.length > 0) {
    summaryParts.push(monthEntries.length + " Einträge");
  }

  if (overallMean !== null) {
    summaryParts.push(
      "Ø " + overallMean.toFixed(1).replace(".", ",") + " Sterne"
    );
  }

  if (medicationDates.length > 0) {
    summaryParts.push("💊 " + medicationDates.length + " Medikamententage");
  }

  if (periodDates.length > 0) {
    summaryParts.push("🩸 " + periodDates.length + " Periodentage");
  }

  chartSummary.textContent = summaryParts.length
    ? summaryParts.join(" · ")
    : "Keine Daten";
  monthlyChart.hidden = !hasData;
  chartEmpty.hidden = hasData;
  chartLegend.hidden = !hasData;

  if (!hasData) {
    if (typeof Plotly !== "undefined" && monthlyChart.data) {
      Plotly.purge(monthlyChart);
    }
    return;
  }

  if (typeof Plotly === "undefined") {
    chartSummary.textContent = "Diagramm-Bibliothek konnte nicht geladen werden.";
    chartEmpty.textContent = "Plotly konnte nicht geladen werden.";
    chartEmpty.hidden = false;
    monthlyChart.hidden = true;
    chartLegend.hidden = true;
    return;
  }

  const barDates = intensityRecords.map((record) => record.date);
  const barValues = intensityRecords.map((record) => record.mean);
  const barColors = barValues.map((value) => colorForIntensity(value));
  const chartData = [
    {
      x: barDates,
      y: barValues,
      type: "bar",
      name: "Tagesstärke",
      marker: {
        color: barColors,
        line: {
          color: "#ffffff",
          width: 0.7
        }
      },
      hovertemplate: "%{x|%d.%m.%Y}<br>Ø %{y:.1f} Sterne<extra></extra>"
    },
    {
      x: barDates,
      y: barValues,
      type: "scatter",
      mode: "lines+markers",
      name: "Tagesverlauf",
      line: {
        color: "#6f6ca9",
        width: 2.5
      },
      marker: {
        color: "#6f6ca9",
        size: 5
      },
      connectgaps: false,
      hovertemplate: "%{x|%d.%m.%Y}<br>Verlauf: %{y:.1f} Sterne<extra></extra>"
    }
  ];

  if (overallMean !== null && barDates.length > 0) {
    chartData.push({
      x: [barDates[0], barDates[barDates.length - 1]],
      y: [overallMean, overallMean],
      type: "scatter",
      mode: "lines",
      name: "Mittelwert",
      line: {
        color: "#242332",
        width: 1.7,
        dash: "dash"
      },
      hovertemplate: "Mittelwert: %{y:.1f} Sterne<extra></extra>"
    });
  }

  if (medicationDates.length > 0) {
    chartData.push({
      x: medicationDates,
      y: medicationDates.map(() => 4.35),
      type: "scatter",
      mode: "markers+text",
      name: "Medikament",
      text: medicationDates.map(() => "💊"),
      textposition: "middle center",
      textfont: {
        size: 14
      },
      marker: {
        symbol: "circle",
        size: 19,
        color: "#6f6ca9",
        line: {
          color: "#ffffff",
          width: 1.5
        }
      },
      hovertemplate: "%{x|%d.%m.%Y}<br>Medikament genommen<extra></extra>"
    });
  }

  if (periodDates.length > 0) {
    chartData.push({
      x: periodDates,
      y: periodDates.map(() => 4.78),
      type: "scatter",
      mode: "markers+text",
      name: "Periode",
      text: periodDates.map(() => "🩸"),
      textposition: "middle center",
      textfont: {
        size: 14
      },
      marker: {
        symbol: "diamond",
        size: 19,
        color: "#c95776",
        line: {
          color: "#ffffff",
          width: 1.5
        }
      },
      hovertemplate: "%{x|%d.%m.%Y}<br>Periode<extra></extra>"
    });
  }

  const selectorOptions = {
    buttons: [
      {
        step: "month",
        stepmode: "backward",
        count: 1,
        label: "1 M"
      },
      {
        step: "month",
        stepmode: "backward",
        count: 3,
        label: "3 M"
      },
      {
        step: "month",
        stepmode: "backward",
        count: 6,
        label: "6 M"
      },
      {
        step: "year",
        stepmode: "backward",
        count: 1,
        label: "1 J"
      },
      {
        step: "all",
        label: "Alles"
      }
    ]
  };
  const layout = {
    autosize: true,
    height: 430,
    margin: {
      l: 52,
      r: 18,
      t: 28,
      b: 88
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(255,255,255,0.26)",
    hovermode: "x unified",
    showlegend: false,
    legend: {
      orientation: "h",
      y: -0.28,
      x: 0,
      font: {
        size: 11,
        color: "#77758a"
      }
    },
    xaxis: {
      type: "date",
      rangeselector: selectorOptions,
      rangeslider: {
        visible: true,
        thickness: 0.08
      },
      gridcolor: "#ebe7e7",
      linecolor: "#e9e5e1",
      tickformat: "%d.%m.%Y"
    },
    yaxis: {
      title: {
        text: "Sterne"
      },
      range: [0, 5.15],
      dtick: 1,
      gridcolor: "#ebe7e7",
      zeroline: false,
      fixedrange: true
    }
  };
  const config = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d"]
  };

  Plotly.react(monthlyChart, chartData, layout, config);
}

function renderInsights() {
  updateMonthNavigation();
  renderCalendar();
  renderMonthlyChart();
}


async function login() {
  loginMessage.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    loginMessage.textContent = "Bitte E-Mail-Adresse und Passwort eingeben.";
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginMessage.textContent = "Login fehlgeschlagen: " + error.message;
    return;
  }

  showApp();
}


async function logout() {
  await supabaseClient.auth.signOut();

  loginSection.hidden = false;
  appSection.hidden = true;
}


async function showApp() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    loginSection.hidden = false;
    appSection.hidden = true;
    return;
  }

  loginSection.hidden = true;
  appSection.hidden = false;

  if (!dateInput.value) {
    dateInput.value = getLocalDateString();
  }

  renderInsights();
  loadEntries();
}


async function saveEntry() {
  saveMessage.textContent = "";

  if (!dateInput.value) {
    saveMessage.textContent = "Bitte ein Datum auswählen.";
    return;
  }

  const entry = {
    date: dateInput.value,
    intensity: getSelectedIntensity(),
    medication: medicationInput.checked,
    period: periodInput.checked ? "1" : null,
    notes: notesInput.value.trim() || null
  };

  const { error } = await supabaseClient
    .from("headache_entries")
    .insert(entry);

  if (error) {
    saveMessage.textContent =
      "Fehler beim Speichern: " + error.message;
    return;
  }

  saveMessage.textContent = "Eintrag gespeichert.";
  resetIntensity();
  medicationInput.checked = false;
  periodInput.checked = false;
  notesInput.value = "";

  loadEntries();
}


async function loadEntries() {
  const { data, error } = await supabaseClient
    .from("headache_entries")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    entriesData = [];
    entriesDiv.textContent =
      "Fehler beim Laden: " + error.message;
    renderInsights();
    return;
  }

  entriesData = data || [];
  entriesDiv.replaceChildren();

  if (entriesData.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent =
      "Noch keine Einträge vorhanden. Dein erster Check-in wartet auf dich.";
    entriesDiv.appendChild(emptyState);
  } else {
    for (const entry of entriesData) {
      const entryElement = document.createElement("article");
      entryElement.className = "entry";

      const topLine = document.createElement("div");
      topLine.className = "entry-topline";

      const dateElement = document.createElement("time");
      dateElement.className = "entry-date";
      dateElement.dateTime = getDateKey(entry.date);
      dateElement.textContent = formatEntryDate(entry.date);

      const ratingElement = document.createElement("span");
      ratingElement.className = "entry-rating";
      ratingElement.setAttribute("aria-label", "Kopfschmerzstärke");
      ratingElement.textContent = formatRating(entry.intensity);

      topLine.append(dateElement, ratingElement);

      const metaElement = document.createElement("p");
      metaElement.className = "entry-meta";
      const statusParts = [
        hasMedication(entry)
          ? "Medikament genommen"
          : "Kein Medikament"
      ];

      if (hasPeriod(entry)) {
        statusParts.push("🩸 Periode");
      }

      metaElement.textContent = statusParts.join(" · ");

      entryElement.append(topLine, metaElement);

      if (entry.notes) {
        const noteElement = document.createElement("p");
        noteElement.className = "entry-note";
        noteElement.textContent = entry.notes;
        entryElement.appendChild(noteElement);
      }

      entriesDiv.appendChild(entryElement);
    }
  }

  renderInsights();
}


intensityInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateStarDisplay(Number(input.value));
  });
});

previousMonthButton.addEventListener("click", () => {
  selectedMonth = addMonths(selectedMonth, -1);
  renderInsights();
});

nextMonthButton.addEventListener("click", () => {
  selectedMonth = addMonths(selectedMonth, 1);
  renderInsights();
});

dateInput.value = getLocalDateString();

loginButton.addEventListener("click", login);
logoutButton.addEventListener("click", logout);
saveButton.addEventListener("click", saveEntry);

showApp();
