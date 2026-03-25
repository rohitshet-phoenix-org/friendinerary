import type { ReactNode } from "react";
import { StoreProvider, getRootStore } from "../stores/RootStore";

const store = getRootStore();

export function AppStoreProvider({ children }: { children: ReactNode }) {
  return <StoreProvider value={store}>{children}</StoreProvider>;
}
