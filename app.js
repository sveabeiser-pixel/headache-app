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


function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
  const parsed = new Date(`${value}T00:00:00`);

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
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 1) {
    return "Keine Angabe";
  }

  const filled = Math.min(4, Math.max(1, Math.round(numericValue)));
  return "★".repeat(filled) + "☆".repeat(4 - filled);
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
    entriesDiv.textContent =
      "Fehler beim Laden: " + error.message;
    return;
  }

  entriesDiv.replaceChildren();

  if (!data || data.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent =
      "Noch keine Einträge vorhanden. Dein erster Check-in wartet auf dich.";
    entriesDiv.appendChild(emptyState);
    return;
  }

  for (const entry of data) {
    const entryElement = document.createElement("article");
    entryElement.className = "entry";

    const topLine = document.createElement("div");
    topLine.className = "entry-topline";

    const dateElement = document.createElement("time");
    dateElement.className = "entry-date";
    dateElement.dateTime = entry.date || "";
    dateElement.textContent = formatEntryDate(entry.date);

    const ratingElement = document.createElement("span");
    ratingElement.className = "entry-rating";
    ratingElement.setAttribute("aria-label", "Kopfschmerzstärke");
    ratingElement.textContent = formatRating(entry.intensity);

    topLine.append(dateElement, ratingElement);

    const metaElement = document.createElement("p");
    metaElement.className = "entry-meta";
    metaElement.textContent = entry.medication
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


intensityInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateStarDisplay(Number(input.value));
  });
});

dateInput.value = getLocalDateString();

loginButton.addEventListener("click", login);
logoutButton.addEventListener("click", logout);
saveButton.addEventListener("click", saveEntry);

showApp();
