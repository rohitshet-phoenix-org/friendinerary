// Background service worker for Friendinerary extension

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu to save selected text as a place
  chrome.contextMenus.create({
    id: "friendinerary-save-place",
    title: "Save to Friendinerary",
    contexts: ["selection", "link", "page"],
  });
});

// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "friendinerary-save-place") {
    // Open the popup to save
    chrome.action.openPopup?.();
  }
});

// Message handler from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TRIPS") {
    getTrips().then(sendResponse);
    return true; // async
  }
  if (message.type === "SAVE_PLACE") {
    savePlace(message.payload).then(sendResponse);
    return true;
  }
});

async function getApiBase(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiBase"], (result) => {
      resolve(result.apiBase ?? "http://localhost:4000/api");
    });
  });
}

async function getAccessToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["accessToken"], (result) => {
      resolve(result.accessToken ?? null);
    });
  });
}

async function getTrips() {
  const [base, token] = await Promise.all([getApiBase(), getAccessToken()]);
  if (!token) return { error: "Not logged in" };
  try {
    const res = await fetch(`${base}/trips`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return { trips: data.data ?? [] };
  } catch {
    return { error: "Failed to fetch trips" };
  }
}

interface SavePlacePayload {
  tripId: string;
  sectionId: string;
  name: string;
  address?: string;
  googlePlaceId?: string;
  notes?: string;
}

async function savePlace(payload: SavePlacePayload) {
  const [base, token] = await Promise.all([getApiBase(), getAccessToken()]);
  if (!token) return { error: "Not logged in" };
  try {
    const res = await fetch(
      `${base}/trips/${payload.tripId}/sections/${payload.sectionId}/places`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          googlePlaceId: payload.googlePlaceId,
          name: payload.name,
          address: payload.address,
          notes: payload.notes,
        }),
      }
    );
    const data = await res.json();
    return { success: true, place: data.data };
  } catch {
    return { error: "Failed to save place" };
  }
}
