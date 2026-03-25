// Extension popup logic

interface Trip {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
}

interface ExtractedPlace {
  name: string;
  address?: string;
  googlePlaceId?: string;
}

let selectedTrip: Trip | null = null;
let currentPlace: ExtractedPlace | null = null;

document.addEventListener("DOMContentLoaded", async () => {
  const loginSection = document.getElementById("login-section")!;
  const mainSection = document.getElementById("main-section")!;
  const loginBtn = document.getElementById("login-btn")!;
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;
  const tripSelect = document.getElementById("trip-select") as HTMLSelectElement;
  const sectionSelect = document.getElementById("section-select") as HTMLSelectElement;
  const placeNameInput = document.getElementById("place-name") as HTMLInputElement;
  const placeAddressInput = document.getElementById("place-address") as HTMLInputElement;
  const notesInput = document.getElementById("notes") as HTMLTextAreaElement;
  const saveBtn = document.getElementById("save-btn")!;
  const statusEl = document.getElementById("status")!;
  const logoutBtn = document.getElementById("logout-btn")!;

  function showStatus(msg: string, type: "success" | "error" | "info" = "info") {
    statusEl.textContent = msg;
    statusEl.className = `status status-${type}`;
    statusEl.style.display = "block";
    if (type === "success") {
      setTimeout(() => { statusEl.style.display = "none"; }, 3000);
    }
  }

  // Check if already logged in
  const { accessToken } = await chrome.storage.local.get(["accessToken"]);
  if (accessToken) {
    await loadTrips();
    loginSection.style.display = "none";
    mainSection.style.display = "block";
    await loadCurrentPlace();
  }

  // Login
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) { showStatus("Please enter email and password", "error"); return; }

    loginBtn.textContent = "Signing in...";
    try {
      const apiBase = "http://localhost:4000/api";
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      await chrome.storage.local.set({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        user: JSON.stringify(data.data.user),
        apiBase,
      });
      loginSection.style.display = "none";
      mainSection.style.display = "block";
      await loadTrips();
      await loadCurrentPlace();
    } catch {
      showStatus("Login failed. Check your credentials.", "error");
    } finally {
      loginBtn.textContent = "Sign in";
    }
  });

  // Logout
  logoutBtn?.addEventListener("click", async () => {
    await chrome.storage.local.remove(["accessToken", "refreshToken", "user"]);
    mainSection.style.display = "none";
    loginSection.style.display = "block";
  });

  // Trip selection
  tripSelect.addEventListener("change", async () => {
    const tripId = tripSelect.value;
    const result = await chrome.runtime.sendMessage({ type: "GET_TRIPS" });
    const trips: Trip[] = result.trips ?? [];
    selectedTrip = trips.find((t) => t.id === tripId) ?? null;
    if (selectedTrip) {
      sectionSelect.innerHTML = selectedTrip.sections
        .map((s) => `<option value="${s.id}">${s.name}</option>`)
        .join("");
    }
  });

  // Save button
  saveBtn.addEventListener("click", async () => {
    const tripId = tripSelect.value;
    const sectionId = sectionSelect.value;
    const name = placeNameInput.value.trim();
    if (!tripId || !sectionId || !name) {
      showStatus("Please select a trip, section, and enter a place name", "error");
      return;
    }

    saveBtn.textContent = "Saving...";
    const result = await chrome.runtime.sendMessage({
      type: "SAVE_PLACE",
      payload: {
        tripId,
        sectionId,
        name,
        address: placeAddressInput.value.trim() || undefined,
        googlePlaceId: currentPlace?.googlePlaceId,
        notes: notesInput.value.trim() || undefined,
      },
    });

    if (result.success) {
      showStatus("✓ Saved to your trip!", "success");
      notesInput.value = "";
    } else {
      showStatus(result.error ?? "Failed to save", "error");
    }
    saveBtn.textContent = "Save to trip";
  });

  async function loadTrips() {
    const result = await chrome.runtime.sendMessage({ type: "GET_TRIPS" });
    const trips: Trip[] = result.trips ?? [];
    tripSelect.innerHTML = trips.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
    if (trips.length > 0) {
      selectedTrip = trips[0]!;
      sectionSelect.innerHTML = selectedTrip.sections
        .map((s) => `<option value="${s.id}">${s.name}</option>`)
        .join("");
    } else {
      tripSelect.innerHTML = '<option value="">No trips found</option>';
    }
  }

  async function loadCurrentPlace() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_PLACE_INFO" });
      if (response?.place) {
        currentPlace = response.place;
        placeNameInput.value = response.place.name ?? "";
        placeAddressInput.value = response.place.address ?? "";
      }
    } catch {
      // Not on a supported page — leave inputs empty
    }
  }
});
