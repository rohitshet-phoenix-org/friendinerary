import { makeAutoObservable } from "mobx";
import type { RootStore } from "./RootStore";
import type { Coordinates } from "@friendinerary/types";

export class MapStore {
  center: Coordinates = { lat: 20, lng: 0 };
  zoom = 2;
  visibleLayerIds = new Set<string>(); // section IDs visible on map
  hoveredPlaceItemId: string | null = null;

  constructor(_root: RootStore) {
    makeAutoObservable(this);
  }

  setCenter(coords: Coordinates) {
    this.center = coords;
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
  }

  panTo(coords: Coordinates, zoom?: number) {
    this.center = coords;
    if (zoom !== undefined) this.zoom = zoom;
  }

  toggleLayer(sectionId: string) {
    if (this.visibleLayerIds.has(sectionId)) {
      this.visibleLayerIds.delete(sectionId);
    } else {
      this.visibleLayerIds.add(sectionId);
    }
  }

  showAllLayers(sectionIds: string[]) {
    sectionIds.forEach((id) => this.visibleLayerIds.add(id));
  }

  hideLayer(sectionId: string) {
    this.visibleLayerIds.delete(sectionId);
  }

  setHoveredPlace(id: string | null) {
    this.hoveredPlaceItemId = id;
  }

  isLayerVisible(sectionId: string) {
    return this.visibleLayerIds.size === 0 || this.visibleLayerIds.has(sectionId);
  }
}
