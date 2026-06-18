import type { AssistantSnapshot } from "../../stores/assistantStore";
import { RefreshCw, ShieldAlert, Trash2, Zap } from "lucide-react";
import { assistantStore } from "../../stores/assistantStore";

interface PrivacyAuditPanelProps {
  snapshot: AssistantSnapshot;
}

export function PrivacyAuditPanel({ snapshot }: PrivacyAuditPanelProps) {
  const lastBlocked = snapshot.privacyStatus?.lastBlocked;
  const events = snapshot.privacyAuditEvents.slice(0, 3);

  return (
    <section className="privacy-audit" aria-label="Privacy audit">
      <header className="privacy-audit-header">
        <div className="section-heading">
          <ShieldAlert size={15} aria-hidden="true" />
          <span>Privacy</span>
        </div>
        <div className="privacy-tools">
          <button
            className="icon-button"
            type="button"
            title="Test privacy firewall"
            aria-label="Test privacy firewall"
            disabled={snapshot.privacyBusy}
            onClick={() => void assistantStore.testPrivacyFirewall()}
          >
            <Zap size={15} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            title="Refresh privacy audit"
            aria-label="Refresh privacy audit"
            disabled={snapshot.privacyBusy}
            onClick={() => void assistantStore.loadPrivacyAudit()}
          >
            <RefreshCw size={15} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            title="Clear privacy audit"
            aria-label="Clear privacy audit"
            disabled={snapshot.privacyBusy || !snapshot.privacyAuditEvents.length}
            onClick={() => void assistantStore.clearPrivacyAudit()}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="privacy-meter">
        <span>{snapshot.privacyStatus?.blockedEvents ?? 0} blocked</span>
        <span>{snapshot.privacyStatus?.allowedEvents ?? 0} allowed</span>
      </div>

      {lastBlocked ? (
        <article className="privacy-blocked">
          <strong>{lastBlocked.destinationCategory.replaceAll("_", " ")}</strong>
          <span>{lastBlocked.reason}</span>
          <small>{lastBlocked.safeAlternative}</small>
        </article>
      ) : null}

      <div className="privacy-event-list">
        {events.length ? (
          events.map((event) => (
            <article className={`privacy-event privacy-event-${event.decision}`} key={event.id}>
              <strong>{event.decision}</strong>
              <span>{event.destinationCategory.replaceAll("_", " ")}</span>
              <small>{event.destination}</small>
            </article>
          ))
        ) : (
          <div className="privacy-empty">No audit events</div>
        )}
      </div>
    </section>
  );
}
