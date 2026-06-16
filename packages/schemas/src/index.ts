export const ASSISTANT_STATES = [
  "BOOTING",
  "ONBOARDING",
  "IDLE",
  "COMPACT_FLOATING",
  "EXPANDED_PANEL",
  "LISTENING",
  "TRANSCRIBING",
  "THINKING",
  "RETRIEVING_MEMORY",
  "SUMMARIZING",
  "SEARCHING_WEB",
  "READING_FILE",
  "CODING",
  "SYNCING",
  "SPEAKING",
  "WAITING_FOR_CONFIRMATION",
  "BLOCKED_BY_PRIVACY",
  "CONNECTOR_ERROR",
  "MODEL_MISSING",
  "OFFLINE",
  "ERROR",
  "SHUTTING_DOWN"
] as const;

export type AssistantState = (typeof ASSISTANT_STATES)[number];

export const UI_MODES = ["compact", "expanded"] as const;

export type UiMode = (typeof UI_MODES)[number];

export type ConnectorStatus =
  | "not_connected"
  | "connected"
  | "syncing"
  | "paused"
  | "error";

export type ModelStatus =
  | "available"
  | "missing"
  | "checking"
  | "offline";

export type SyncStatus = "idle" | "syncing" | "paused" | "error";

export interface FloatingWindowPosition {
  x: number;
  y: number;
  monitor?: string;
}

export interface Phase1Settings {
  uiMode: UiMode;
  alwaysOnTop: boolean;
  lowPowerMode: boolean;
  reduceMotion: boolean;
  lastPosition?: FloatingWindowPosition;
}

export interface AssistantStateEvent {
  type: "assistant.state.changed";
  payload: {
    from: AssistantState;
    to: AssistantState;
    timestamp: string;
  };
}

export interface UiFloatingPositionEvent {
  type: "ui.floating.position.updated";
  payload: {
    position: FloatingWindowPosition;
    timestamp: string;
  };
}

export type Phase1Event = AssistantStateEvent | UiFloatingPositionEvent;

export interface ConnectorPreview {
  id: string;
  name: string;
  status: ConnectorStatus;
  lastSyncLabel: string;
}

export interface MemoryPreviewItem {
  id: string;
  title: string;
  source: string;
  updatedLabel: string;
}

export interface QuickAction {
  id: string;
  label: string;
  state: AssistantState;
}

export const DEFAULT_PHASE1_SETTINGS: Phase1Settings = {
  uiMode: "compact",
  alwaysOnTop: true,
  lowPowerMode: true,
  reduceMotion: false
};

