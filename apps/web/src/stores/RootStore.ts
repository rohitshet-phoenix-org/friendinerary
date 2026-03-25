import { createContext, useContext } from "react";
import { AuthStore } from "./AuthStore";
import { TripStore } from "./TripStore";
import { UIStore } from "./UIStore";
import { MapStore } from "./MapStore";
import { BudgetStore } from "./BudgetStore";
import { ExploreStore } from "./ExploreStore";
import { AIStore } from "./AIStore";
import { CollaborationStore } from "./CollaborationStore";

export class RootStore {
  auth: AuthStore;
  trips: TripStore;
  ui: UIStore;
  map: MapStore;
  budget: BudgetStore;
  explore: ExploreStore;
  ai: AIStore;
  collaboration: CollaborationStore;

  constructor() {
    this.auth = new AuthStore(this);
    this.trips = new TripStore(this);
    this.ui = new UIStore(this);
    this.map = new MapStore(this);
    this.budget = new BudgetStore(this);
    this.explore = new ExploreStore(this);
    this.ai = new AIStore(this);
    this.collaboration = new CollaborationStore(this);
  }
}

const StoreContext = createContext<RootStore | null>(null);
export const StoreProvider = StoreContext.Provider;

let rootStore: RootStore;

export function getRootStore(): RootStore {
  if (!rootStore) rootStore = new RootStore();
  return rootStore;
}

export function useStore(): RootStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within StoreProvider");
  return store;
}
