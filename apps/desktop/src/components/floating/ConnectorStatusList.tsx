import type { ConnectorItem, ConnectorSyncRun } from "@deyana/schemas";
import { KeyRound, Link2, Power, RefreshCcw, Unplug } from "lucide-react";
import type { AssistantSnapshot } from "../../stores/assistantStore";
import { assistantStore } from "../../stores/assistantStore";

interface ConnectorStatusListProps {
  snapshot: AssistantSnapshot;
}

const intervalOptions = [
  { value: 60, label: "1h" },
  { value: 180, label: "3h" },
  { value: 360, label: "6h" },
  { value: 720, label: "12h" },
  { value: 1440, label: "24h" }
];

export function ConnectorStatusList({ snapshot }: ConnectorStatusListProps) {
  const recentRuns = snapshot.connectorSyncRuns.slice(0, 3);

  return (
    <section className="panel-section connector-panel" aria-label="Connectors">
      <div className="section-heading connector-heading">
        <span>
          <Link2 size={15} aria-hidden="true" />
          <span>Connectors</span>
        </span>
        <small>{snapshot.syncStatus}</small>
      </div>
      <div className="connector-list">
        {snapshot.connectors.map((connector) => (
          <ConnectorRow
            connector={connector}
            busy={Boolean(snapshot.connectorBusy[connector.id])}
            key={connector.id}
          />
        ))}
      </div>
      <div className="connector-run-list" aria-label="Recent connector sync runs">
        {recentRuns.length ? (
          recentRuns.map((run) => <ConnectorRunRow connectors={snapshot.connectors} run={run} key={run.id} />)
        ) : (
          <span className="connector-empty-log">No sync runs yet</span>
        )}
      </div>
    </section>
  );
}

function ConnectorRow({ connector, busy }: { connector: ConnectorItem; busy: boolean }) {
  const canSync = connector.tokenStored && connector.enabled && connector.status !== "syncing" && !busy;
  const canDisconnect = connector.tokenStored && connector.status !== "syncing" && !busy;
  const canConnect = !connector.tokenStored && !busy;

  return (
    <div className="connector-row">
      <span className={`connector-dot connector-${connector.status}`} />
      <div className="connector-main">
        <div className="connector-title-row">
          <strong>{connector.name}</strong>
          <span>{connector.status.replaceAll("_", " ")}</span>
        </div>
        <div className="connector-meta">
          <span>{connector.tokenStored ? "Token local" : "No token"}</span>
          <span>{connector.lastSyncAt ? compactDate(connector.lastSyncAt) : "Never synced"}</span>
          {connector.lastError ? <span className="connector-error-text">{connector.lastError}</span> : null}
        </div>
        <div className="connector-settings-row">
          <label className="connector-toggle" title={connector.enabled ? "Pause sync" : "Enable sync"}>
            <input
              type="checkbox"
              checked={connector.enabled}
              disabled={!connector.tokenStored || busy}
              onChange={(event) =>
                void assistantStore.updateConnectorSettings(connector.id, {
                  enabled: event.currentTarget.checked
                })
              }
            />
            <span>
              <Power size={12} aria-hidden="true" />
            </span>
          </label>
          <select
            aria-label={`${connector.name} sync interval`}
            value={connector.syncIntervalMinutes}
            disabled={!connector.tokenStored || busy}
            onChange={(event) =>
              void assistantStore.updateConnectorSettings(connector.id, {
                syncIntervalMinutes: Number(event.currentTarget.value)
              })
            }
          >
            {intervalOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="connector-actions">
            <button
              className="inline-icon-button"
              type="button"
              title="Approve mock OAuth"
              aria-label={`Approve mock OAuth for ${connector.name}`}
              disabled={!canConnect}
              onClick={() => void assistantStore.connectConnector(connector.id)}
            >
              <KeyRound size={14} aria-hidden="true" />
            </button>
            <button
              className="inline-icon-button"
              type="button"
              title="Run manual sync"
              aria-label={`Run manual sync for ${connector.name}`}
              disabled={!canSync}
              onClick={() => void assistantStore.syncConnector(connector.id)}
            >
              <RefreshCcw size={14} aria-hidden="true" />
            </button>
            <button
              className="inline-icon-button"
              type="button"
              title="Disconnect"
              aria-label={`Disconnect ${connector.name}`}
              disabled={!canDisconnect}
              onClick={() => void assistantStore.disconnectConnector(connector.id)}
            >
              <Unplug size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectorRunRow({
  connectors,
  run
}: {
  connectors: ConnectorItem[];
  run: ConnectorSyncRun;
}) {
  const connector = connectors.find((item) => item.id === run.connectorId);
  return (
    <div className={`connector-run connector-run-${run.status}`}>
      <span>{connector?.name ?? run.connectorId}</span>
      <strong>{run.status}</strong>
      <time>{compactDate(run.completedAt ?? run.startedAt)}</time>
    </div>
  );
}

function compactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
