import {
  DEFAULT_BACKEND_PROCESS_STATUS,
  DEFAULT_DESKTOP_SETTINGS,
  type AssistantState,
  type BackendProcessStatus,
  type BackendStatusResponse,
  type ConnectorPreview,
  type CoreWebSocketEvent,
  type MemoryPreviewItem,
  type ModelStatus,
  type DesktopSettings,
  type QuickAction,
  type SyncStatus,
  type UiMode
} from "@deyana/schemas";
import { useSyncExternalStore } from "react";
import { backendClient, type BackendEventConnection } from "../services/backendClient";
import { tauriClient } from "../services/tauriClient";

export interface AssistantSnapshot {
  assistantState: AssistantState;
  settings: DesktopSettings;
  modelStatus: ModelStatus;
  syncStatus: SyncStatus;
  backend: BackendProcessStatus;
  backendStatus?: BackendStatusResponse;
  backendEventStreamConnected: boolean;
  lastBackendEventType?: string;
  connectors: ConnectorPreview[];
  memoryPreview: MemoryPreviewItem[];
  quickActions: QuickAction[];
  error?: string;
}

const initialSnapshot: AssistantSnapshot = {
  assistantState: "COMPACT_FLOATING",
  settings: DEFAULT_DESKTOP_SETTINGS,
  modelStatus: "checking",
  syncStatus: "idle",
  backend: DEFAULT_BACKEND_PROCESS_STATUS,
  backendEventStreamConnected: false,
  connectors: [
    {
      id: "gmail",
      name: "Gmail",
      status: "not_connected",
      lastSyncLabel: "Local sync off"
    },
    {
      id: "calendar",
      name: "Calendar",
      status: "not_connected",
      lastSyncLabel: "Local sync off"
    },
    {
      id: "github",
      name: "GitHub",
      status: "not_connected",
      lastSyncLabel: "Local sync off"
    }
  ],
  memoryPreview: [
    {
      id: "vault",
      title: "Vault setup waits for Phase 3",
      source: "Local memory",
      updatedLabel: "Ready"
    },
    {
      id: "model",
      title: "Low-spec model profile selected",
      source: "qwen3:1.7b",
      updatedLabel: "Local"
    }
  ],
  quickActions: [
    {
      id: "memory",
      label: "Memory",
      state: "RETRIEVING_MEMORY"
    },
    {
      id: "search",
      label: "Search",
      state: "SEARCHING_WEB"
    },
    {
      id: "code",
      label: "Code",
      state: "CODING"
    }
  ]
};

type Listener = () => void;

class AssistantStore {
  private listeners = new Set<Listener>();
  private snapshot = initialSnapshot;
  private coreStatusUnlisten?: () => void;
  private backendConnection?: BackendEventConnection;
  private backendReconnectTimer?: number;
  private intentionalBackendDisconnect = false;

  getSnapshot = () => this.snapshot;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  hydrate = async () => {
    try {
      const [settings, backend] = await Promise.all([
        tauriClient.getDesktopSettings(),
        tauriClient.getCoreStatus()
      ]);
      this.setSnapshot({
        settings,
        backend,
        assistantState: settings.uiMode === "expanded" ? "EXPANDED_PANEL" : "COMPACT_FLOATING",
        error: undefined
      });
      await this.subscribeToCoreStatus();
      await this.refreshBackendStatus();
      this.connectBackendEvents();
    } catch (error) {
      this.setSnapshot({
        error: error instanceof Error ? error.message : "Unable to load local settings"
      });
    }
  };

  setAssistantState = (assistantState: AssistantState) => {
    this.setSnapshot({ assistantState });

    window.setTimeout(() => {
      const current = this.snapshot.settings.uiMode;
      this.setSnapshot({
        assistantState: current === "expanded" ? "EXPANDED_PANEL" : "COMPACT_FLOATING"
      });
    }, 1400);
  };

  setFloatingMode = async (uiMode: UiMode) => {
    const optimisticSettings = { ...this.snapshot.settings, uiMode };
    this.setSnapshot({
      settings: optimisticSettings,
      assistantState: uiMode === "expanded" ? "EXPANDED_PANEL" : "COMPACT_FLOATING",
      error: undefined
    });

    try {
      const settings = await tauriClient.setFloatingMode(uiMode);
      this.setSnapshot({ settings });
    } catch (error) {
      this.setSnapshot({
        error: error instanceof Error ? error.message : "Unable to resize floating window"
      });
    }
  };

  setAlwaysOnTop = async (alwaysOnTop: boolean) => {
    this.setSnapshot({
      settings: { ...this.snapshot.settings, alwaysOnTop },
      error: undefined
    });

    try {
      const settings = await tauriClient.setAlwaysOnTop(alwaysOnTop);
      this.setSnapshot({ settings });
    } catch (error) {
      this.setSnapshot({
        error: error instanceof Error ? error.message : "Unable to update window preference"
      });
    }
  };

  hideWindow = async () => {
    await tauriClient.hideMainWindow();
  };

  restartBackend = async () => {
    this.disconnectBackendEvents();
    this.setSnapshot({
      backend: {
        ...this.snapshot.backend,
        lifecycle: "starting",
        updatedAtMs: Date.now(),
        lastError: undefined
      },
      backendEventStreamConnected: false,
      error: undefined
    });

    try {
      const backend = await tauriClient.restartCore();
      this.setSnapshot({ backend });
      this.scheduleBackendReconnect(700);
    } catch (error) {
      this.setSnapshot({
        backend: {
          ...this.snapshot.backend,
          lifecycle: "unavailable",
          updatedAtMs: Date.now(),
          lastError: error instanceof Error ? error.message : "Unable to restart backend"
        },
        error: error instanceof Error ? error.message : "Unable to restart backend"
      });
    }
  };

  private subscribeToCoreStatus = async () => {
    if (this.coreStatusUnlisten) {
      return;
    }

    this.coreStatusUnlisten = await tauriClient.onCoreStatus((backend) => {
      this.setSnapshot({
        backend,
        error: backend.lifecycle === "crashed" ? backend.lastError ?? "Backend core crashed" : undefined
      });

      if (backend.lifecycle === "running") {
        this.scheduleBackendReconnect(200);
      }
    });
  };

  private refreshBackendStatus = async () => {
    try {
      const backendStatus = await backendClient.getStatus();
      this.setSnapshot({
        backendStatus,
        backend: {
          ...this.snapshot.backend,
          lifecycle: "running",
          updatedAtMs: Date.now(),
          lastError: undefined
        },
        modelStatus: backendStatus.featureFlags.models ? "available" : "checking",
        error: undefined
      });
    } catch {
      if (this.snapshot.backend.lifecycle === "running") {
        this.setSnapshot({
          backend: {
            ...this.snapshot.backend,
            lifecycle: "starting",
            updatedAtMs: Date.now()
          }
        });
      }
      this.scheduleBackendReconnect(900);
    }
  };

  private connectBackendEvents = () => {
    this.disconnectBackendEvents();

    try {
      this.backendConnection = backendClient.connectEvents(
        (event) => this.handleBackendEvent(event),
        (reason) => this.handleBackendClose(reason)
      );
    } catch {
      this.scheduleBackendReconnect(1200);
    }
  };

  private handleBackendEvent = (event: CoreWebSocketEvent) => {
    if (event.type === "app.ready") {
      this.setSnapshot({
        backend: {
          ...this.snapshot.backend,
          lifecycle: "running",
          updatedAtMs: Date.now(),
          lastError: undefined
        },
        backendEventStreamConnected: true,
        lastBackendEventType: event.type,
        error: undefined
      });
      void this.refreshBackendStatus();
      return;
    }

    if (event.type === "backend.heartbeat") {
      this.setSnapshot({
        backend: {
          ...this.snapshot.backend,
          lifecycle: event.payload.lifecycle,
          updatedAtMs: Date.now(),
          lastError: undefined
        },
        backendEventStreamConnected: true,
        lastBackendEventType: event.type,
        error: undefined
      });
      return;
    }

    if (event.type === "backend.lifecycle.changed") {
      this.setSnapshot({
        backend: {
          ...this.snapshot.backend,
          lifecycle: event.payload.lifecycle,
          updatedAtMs: Date.now(),
          lastError: undefined
        },
        backendEventStreamConnected: true,
        lastBackendEventType: event.type
      });
      return;
    }

    const _exhaustive: never = event;
    return _exhaustive;
  };

  private handleBackendClose = (reason: string) => {
    if (this.intentionalBackendDisconnect) {
      this.intentionalBackendDisconnect = false;
      return;
    }

    if (this.snapshot.backend.lifecycle === "stopping" || this.snapshot.backend.lifecycle === "stopped") {
      return;
    }

    this.setSnapshot({
      backendEventStreamConnected: false,
      backend: {
        ...this.snapshot.backend,
        lifecycle: this.snapshot.backend.lifecycle === "crashed" ? "crashed" : "unavailable",
        updatedAtMs: Date.now(),
        lastError: reason
      }
    });
    this.scheduleBackendReconnect(1400);
  };

  private scheduleBackendReconnect = (delayMs: number) => {
    if (this.backendReconnectTimer) {
      window.clearTimeout(this.backendReconnectTimer);
    }

    this.backendReconnectTimer = window.setTimeout(() => {
      void this.refreshBackendStatus();
      this.connectBackendEvents();
    }, delayMs);
  };

  private disconnectBackendEvents = () => {
    if (this.backendConnection) {
      this.intentionalBackendDisconnect = true;
      this.backendConnection.disconnect();
      this.backendConnection = undefined;
    }
  };

  private setSnapshot = (patch: Partial<AssistantSnapshot>) => {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  };
}

export const assistantStore = new AssistantStore();

export const useAssistantSnapshot = () =>
  useSyncExternalStore(assistantStore.subscribe, assistantStore.getSnapshot);
