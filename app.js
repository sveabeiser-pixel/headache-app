const SUPABASE_URL = "HIER_DEINE_PROJECT_URL";
const SUPABASE_KEY = "HIER_DEINEN_PUBLISHABLE_KEY";

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
const intensityInput = document.getElementById("intensity");
const durationInput = document.getElementById("duration");
const medicationInput = document.getElementById("medication");
const notesInput = document.getElementById("notes");

const saveButton = document.getElementById("save-button");

const entriesDiv = document.getElementById("entries");


async function login() {

  loginMessage.textContent = "";

  const email = emailInput.value;
  const password = passwordInput.value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
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

  loadEntries();
}


async function saveEntry() {

  saveMessage.textContent = "";

  const entry = {
    date: dateInput.value,
    intensity: intensityInput.value
      ? Number(intensityInput.value)
      : null,
    duration: durationInput.value
      ? Number(durationInput.value)
      : null,
    medication: medicationInput.value || null,
    notes: notesInput.value || null
  };

  const { error } = await supabaseClient
    .from("headache_entries")
    .insert(entry);

  if (error) {
    saveMessage.textContent =
      "Fehler beim Speichern: " + error.message;
    return;
  }

  saveMessage.textContent = "Gespeichert.";

  intensityInput.value = "";
  durationInput.value = "";
  medicationInput.value = "";
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

  entriesDiv.innerHTML = "";

  for (const entry of data) {

    const div = document.createElement("div");
    div.className = "entry";

    div.textContent =
      `${entry.date} – Stärke ${entry.intensity ?? "-"} – ` +
      `${entry.duration ?? "-"} h – ` +
      `${entry.medication ?? "kein Medikament"}`;

    entriesDiv.appendChild(div);
  }
}


loginButton.addEventListener("click", login);
logoutButton.addEventListener("click", logout);
saveButton.addEventListener("click", saveEntry);

showApp();
