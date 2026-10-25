import { Capacitor, registerPlugin } from "@capacitor/core";

export type PrimeWidgetState = {
  dayLabel: string;
  profileName: string;
  splitName: string;
  focus: string;
  isRest: boolean;
  exerciseCount: number;
  status: string;
};

type PrimeWidgetPlugin = {
  syncWidgetState: (state: PrimeWidgetState) => Promise<void>;
};

const PrimeWidget = registerPlugin<PrimeWidgetPlugin>("PrimeWidget");

export async function syncPrimeWidgetState(state: PrimeWidgetState) {
  if (typeof window === "undefined" || Capacitor.getPlatform() !== "android") return;
  try {
    await PrimeWidget.syncWidgetState(state);
  } catch {
    // The web app remains fully functional if the native widget bridge is unavailable.
  }
}
