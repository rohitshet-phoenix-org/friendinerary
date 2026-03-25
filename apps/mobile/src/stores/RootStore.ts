import { createContext, useContext } from "react";
import { AuthStore } from "./AuthStore";
import { TripStore } from "./TripStore";

export class RootStore {
  auth: AuthStore;
  trips: TripStore;

  constructor() {
    this.auth = new AuthStore();
    this.trips = new TripStore();
  }
}

const rootStore = new RootStore();
export const StoreContext = createContext(rootStore);

export function useStore() {
  return useContext(StoreContext);
}
