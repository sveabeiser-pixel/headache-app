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

const monthStart = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1
);
const monthEnd = new Date(
  monthStart.getFullYear(),
  monthStart.getMonth() + 11,
  1
);
let selectedMonth = new Date(monthStart);
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
  monthRange.textContent =
    `${getMonthLabel(monthStart)} – ${getMonthLabel(monthEnd)}`;

  previousMonthButton.disabled =
    monthNumber(selectedMonth) <= monthNumber(monthStart);
  nextMonthButton.disabled =
    monthNumber(selectedMonth) >= monthNumber(monthEnd);
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
      medication: false
    };

    summaryByDate.set(dateKey, {
      intensity: Math.max(oldSummary.intensity, clampIntensity(entry.intensity)),
      medication: oldSummary.medication || hasMedication(entry)
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

      cell.setAttribute(
        "aria-label",
        `${labelDate}: ${intensityText}${medicationText}`
      );
      cell.title = cell.getAttribute("aria-label");

      if (summary.medication) {
        const pill = document.createElement("span");
        pill.className = "pill-icon";
        pill.setAttribute("aria-label", "Medikament genommen");
        pill.textContent = "💊";
        indicators.appendChild(pill);
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
  const monthEntries = getMonthEntries();
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const valuesByDay = Array.from({ length: daysInMonth }, () => []);

  for (const entry of monthEntries) {
    const dateKey = getDateKey(entry.date);
    const day = Number(dateKey.slice(8, 10));
    const intensity = clampIntensity(entry.intensity);

    if (day >= 1 && day <= daysInMonth && intensity > 0) {
      valuesByDay[day - 1].push(intensity);
    }
  }

  const dailyMeans = valuesByDay.map((values) => {
    if (values.length === 0) {
      return null;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  });

  const validValues = dailyMeans.filter((value) => value !== null);
  const monthlyMean = validValues.length
    ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
    : null;

  chartSummary.textContent = monthlyMean === null
    ? "Keine Daten"
    : `${monthEntries.length} Einträge · Ø ${monthlyMean.toFixed(1).replace(".", ",")} Sterne`;

  const hasData = monthlyMean !== null;
  monthlyChart.hidden = !hasData;
  chartEmpty.hidden = hasData;
  chartLegend.hidden = !hasData;

  if (!hasData) {
    return;
  }

  const width = 760;
  const height = 330;
  const margin = { top: 28, right: 28, bottom: 46, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const plotBottom = margin.top + plotHeight;
  const slotWidth = plotWidth / daysInMonth;
  const barWidth = Math.max(5, Math.min(20, slotWidth * 0.66));

  const plotY = (value) =>
    plotBottom - (value / 4) * plotHeight;
  const plotX = (index) =>
    margin.left + index * slotWidth + slotWidth / 2;

  monthlyChart.replaceChildren();
  monthlyChart.appendChild(
    svgElement("title", { id: "chart-title" },
      `Kopfschmerzstärke im ${getMonthLabel(selectedMonth)}`)
  );
  monthlyChart.appendChild(
    svgElement("desc", { id: "chart-description" },
      "Tagesmittelwerte als Balken und Monatsmittel als gestrichelte Linie.")
  );

  for (let tick = 0; tick <= 4; tick += 1) {
    const y = plotY(tick);

    monthlyChart.appendChild(
      svgElement("line", {
        x1: margin.left,
        y1: y,
        x2: width - margin.right,
        y2: y,
        class: "chart-grid-line"
      })
    );
    monthlyChart.appendChild(
      svgElement("text", {
        x: margin.left - 13,
        y: y + 4,
        class: "chart-axis-label",
        "text-anchor": "end"
      }, String(tick))
    );
  }

  dailyMeans.forEach((value, index) => {
    if (value === null) {
      return;
    }

    const x = plotX(index) - barWidth / 2;
    const y = plotY(value);

    monthlyChart.appendChild(
      svgElement("rect", {
        x,
        y,
        width: barWidth,
        height: plotBottom - y,
        rx: 7,
        class: "chart-bar",
        fill: colorForIntensity(value)
      })
    );
  });

  const linePoints = dailyMeans
    .map((value, index) => value === null
      ? null
      : [plotX(index), plotY(value)])
    .filter(Boolean);

  if (linePoints.length >= 2) {
    const pathData = linePoints
      .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
      .join(" ");

    monthlyChart.appendChild(
      svgElement("path", {
        d: pathData,
        class: "chart-daily-line"
      })
    );
  }

  const meanY = plotY(monthlyMean);
  monthlyChart.appendChild(
    svgElement("line", {
      x1: margin.left,
      y1: meanY,
      x2: width - margin.right,
      y2: meanY,
      class: "chart-mean-line"
    })
  );
  monthlyChart.appendChild(
    svgElement("text", {
      x: width - margin.right,
      y: meanY - 9,
      class: "chart-mean-label",
      "text-anchor": "end"
    }, `Ø ${monthlyMean.toFixed(1).replace(".", ",")}`)
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    if (day !== 1 && day % 5 !== 0 && day !== daysInMonth) {
      continue;
    }

    monthlyChart.appendChild(
      svgElement("text", {
        x: plotX(day - 1),
        y: height - 17,
        class: "chart-axis-label",
        "text-anchor": "middle"
      }, String(day))
    );
  }
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
      metaElement.textContent = hasMedication(entry)
        ? "Medikament genommen"
        : "Kein Medikament";

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
  if (monthNumber(selectedMonth) > monthNumber(monthStart)) {
    selectedMonth = addMonths(selectedMonth, -1);
    renderInsights();
  }
});

nextMonthButton.addEventListener("click", () => {
  if (monthNumber(selectedMonth) < monthNumber(monthEnd)) {
    selectedMonth = addMonths(selectedMonth, 1);
    renderInsights();
  }
});

dateInput.value = getLocalDateString();

loginButton.addEventListener("click", login);
logoutButton.addEventListener("click", logout);
saveButton.addEventListener("click", saveEntry);

showApp();
