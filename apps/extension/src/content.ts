// Content script — injected into Google Maps, TripAdvisor, Yelp, etc.
// Extracts place info from the page and communicates with the extension popup

interface ExtractedPlace {
  name: string;
  address?: string;
  googlePlaceId?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  category?: string;
}

function extractFromGoogleMaps(): ExtractedPlace | null {
  // Extract place info from Google Maps URL and DOM
  const url = window.location.href;

  // Try to get place ID from URL (/maps/place/.../@lat,lng,...!/data=...0x...:0x...)
  const placeIdMatch = url.match(/!1s(0x[a-f0-9]+:[a-f0-9]+)/);
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

  // Extract name from h1 or title
  const nameEl = document.querySelector('h1[class*="DUwDvf"]') ??
                 document.querySelector('[data-attrid="title"]') ??
                 document.querySelector("h1");
  const name = nameEl?.textContent?.trim() ?? document.title.split(" - ")[0]?.trim() ?? "";

  // Address from the address line
  const addressEl = document.querySelector('[data-item-id="address"]') ??
                    document.querySelector('[class*="rogA2c"]');
  const address = addressEl?.textContent?.trim();

  if (!name) return null;

  return {
    name,
    address,
    googlePlaceId: placeIdMatch?.[1],
    lat: coordMatch ? parseFloat(coordMatch[1]) : undefined,
    lng: coordMatch ? parseFloat(coordMatch[2]) : undefined,
  };
}

function extractFromTripadvisor(): ExtractedPlace | null {
  const nameEl = document.querySelector("h1");
  const name = nameEl?.textContent?.trim();
  if (!name) return null;
  const addressEl = document.querySelector('[class*="biGQs _P pZUbB"]');
  return { name, address: addressEl?.textContent?.trim() };
}

function extractFromYelp(): ExtractedPlace | null {
  const nameEl = document.querySelector("h1") ?? document.querySelector('[class*="businessName"]');
  const name = nameEl?.textContent?.trim();
  if (!name) return null;
  const addressEl = document.querySelector('[class*="mapbox-place-name"]') ??
                    document.querySelector('address');
  return { name, address: addressEl?.textContent?.trim() };
}

function extractPlace(): ExtractedPlace | null {
  const host = window.location.hostname;
  if (host.includes("google.com/maps") || host.includes("maps.app.goo.gl")) {
    return extractFromGoogleMaps();
  }
  if (host.includes("tripadvisor.com")) {
    return extractFromTripadvisor();
  }
  if (host.includes("yelp.com")) {
    return extractFromYelp();
  }
  // Generic fallback: use page title
  return { name: document.title.split(" - ")[0]?.trim() ?? document.title };
}

// Listen for popup requesting place info
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PLACE_INFO") {
    sendResponse({ place: extractPlace() });
  }
});
