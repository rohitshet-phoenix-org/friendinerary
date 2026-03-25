import { makeAutoObservable } from "mobx";
import type { RootStore } from "./RootStore";

export type TripTab = "overview" | "itinerary" | "reservations" | "stories" | "hotels" | "map" | "explore" | "budget";
export type MapColorMode = "by-day" | "by-category";

export class UIStore {
  darkMode = false;
  activeTab: TripTab = "itinerary";
  mapColorMode: MapColorMode = "by-day";
  selectedPlaceItemId: string | null = null;
  expandedSections = new Set<string>();
  compactView = false;
  sidebarOpen = true;
  createTripModalOpen = false;
  inviteModalOpen = false;
  addPlaceModalOpen = false;
  addPlaceSectionId: string | null = null;
  budgetModalOpen = false;
  reservationModalOpen = false;
  aiPanelOpen = false;
  mapFullscreen = false;
  exportModalOpen = false;
  directionsModalOpen = false;

  constructor(_root: RootStore) {
    makeAutoObservable(this);
    // Persist dark mode
    const saved = localStorage.getItem("darkMode");
    if (saved) this.darkMode = saved === "true";
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem("darkMode", String(this.darkMode));
  }

  setActiveTab(tab: TripTab) {
    this.activeTab = tab;
  }

  setMapColorMode(mode: MapColorMode) {
    this.mapColorMode = mode;
  }

  selectPlaceItem(id: string | null) {
    this.selectedPlaceItemId = id;
  }

  toggleSection(sectionId: string) {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
  }

  expandAllSections(sectionIds: string[]) {
    sectionIds.forEach((id) => this.expandedSections.add(id));
  }

  toggleCompactView() {
    this.compactView = !this.compactView;
  }

  openCreateTripModal() { this.createTripModalOpen = true; }
  closeCreateTripModal() { this.createTripModalOpen = false; }

  openAddPlace(sectionId: string) {
    this.addPlaceSectionId = sectionId;
    this.addPlaceModalOpen = true;
  }
  closeAddPlace() {
    this.addPlaceModalOpen = false;
    this.addPlaceSectionId = null;
  }

  openInviteModal() { this.inviteModalOpen = true; }
  closeInviteModal() { this.inviteModalOpen = false; }

  openBudgetModal() { this.budgetModalOpen = true; }
  closeBudgetModal() { this.budgetModalOpen = false; }

  toggleAIPanel() { this.aiPanelOpen = !this.aiPanelOpen; }
  toggleMapFullscreen() { this.mapFullscreen = !this.mapFullscreen; }
  openExportModal() { this.exportModalOpen = true; }
  closeExportModal() { this.exportModalOpen = false; }
  openDirectionsModal() { this.directionsModalOpen = true; }
  closeDirectionsModal() { this.directionsModalOpen = false; }
}
