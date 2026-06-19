import type { AssistantSnapshot } from "../../stores/assistantStore";
import { CalendarDays, Download, FolderKanban, FolderOpen, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { assistantStore } from "../../stores/assistantStore";

interface MemoryBrowserProps {
  snapshot: AssistantSnapshot;
}

export function MemoryBrowser({ snapshot }: MemoryBrowserProps) {
  return (
    <section className="memory-browser" aria-label="Memory browser">
      <header className="memory-browser-header">
        <div className="section-heading">
          <Search size={15} aria-hidden="true" />
          <span>Memory</span>
        </div>
        <div className="memory-tools">
          <button
            className="icon-button"
            type="button"
            title="Reindex memory"
            aria-label="Reindex memory"
            onClick={() => void assistantStore.reindexMemory()}
          >
            <RefreshCw size={15} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            title="Export memory"
            aria-label="Export memory"
            onClick={() => void assistantStore.exportMemory()}
          >
            <Download size={15} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            title="Open vault"
            aria-label="Open vault"
            onClick={() => void assistantStore.openVault()}
          >
            <FolderOpen size={15} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="memory-search">
        <input
          type="search"
          value={snapshot.memoryQuery}
          placeholder="Search local memory"
          aria-label="Search local memory"
          onChange={(event) => assistantStore.setMemoryQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void assistantStore.loadMemory();
            }
          }}
        />
        <button
          className="icon-button"
          type="button"
          title="Search memory"
          aria-label="Search memory"
          onClick={() => void assistantStore.loadMemory()}
        >
          <Search size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="memory-summary-tools">
        <button
          className="inline-text-button"
          type="button"
          disabled={snapshot.memoryBusy}
          onClick={() => void assistantStore.generateDailySummary()}
        >
          <CalendarDays size={13} aria-hidden="true" />
          <span>Daily</span>
        </button>
        <input
          value={snapshot.memoryProjectDraft}
          placeholder="Project"
          aria-label="Project summary name"
          onChange={(event) => assistantStore.setMemoryProjectDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void assistantStore.generateProjectSummary();
            }
          }}
        />
        <button
          className="inline-text-button"
          type="button"
          disabled={snapshot.memoryBusy || !snapshot.memoryProjectDraft.trim()}
          onClick={() => void assistantStore.generateProjectSummary()}
        >
          <FolderKanban size={13} aria-hidden="true" />
          <span>Project</span>
        </button>
      </div>

      <div className="memory-create">
        <input
          value={snapshot.memoryDraft.title}
          placeholder="Title"
          aria-label="Memory title"
          onChange={(event) => assistantStore.setMemoryDraft({ title: event.target.value })}
        />
        <input
          value={snapshot.memoryDraft.summary}
          placeholder="Summary"
          aria-label="Memory summary"
          onChange={(event) => assistantStore.setMemoryDraft({ summary: event.target.value })}
        />
        <textarea
          value={snapshot.memoryDraft.contentMarkdown}
          placeholder="Markdown note"
          aria-label="Memory markdown"
          onChange={(event) => assistantStore.setMemoryDraft({ contentMarkdown: event.target.value })}
        />
        <button
          className="primary-action memory-add"
          type="button"
          disabled={snapshot.memoryBusy}
          onClick={() => void assistantStore.createMemory()}
        >
          <Plus size={15} aria-hidden="true" />
          <span>Add memory</span>
        </button>
      </div>

      <div className="memory-browser-list">
        {snapshot.memoryItems.length ? (
          snapshot.memoryItems.map((item) => (
            <article className="memory-browser-item" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.summary}</span>
                <small>{memoryDetailLabel(item)}</small>
                {item.tags.length || item.actionItems.length || item.decisions.length ? (
                  <div className="memory-extraction-row">
                    {item.tags.slice(0, 3).map((tag) => (
                      <em key={tag}>{tag}</em>
                    ))}
                    {item.actionItems.length ? <em>{item.actionItems.length} actions</em> : null}
                    {item.decisions.length ? <em>{item.decisions.length} decisions</em> : null}
                  </div>
                ) : null}
              </div>
              <button
                className="icon-button"
                type="button"
                title="Delete memory"
                aria-label={`Delete ${item.title}`}
                disabled={snapshot.memoryBusy}
                onClick={() => void assistantStore.deleteMemory(item.id)}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </article>
          ))
        ) : (
          <div className="memory-empty">No local memory yet</div>
        )}
      </div>

      {snapshot.memoryExportedAt ? (
        <div className="memory-export-state">Exported {new Date(snapshot.memoryExportedAt).toLocaleTimeString()}</div>
      ) : null}
    </section>
  );
}

function memoryDetailLabel(item: AssistantSnapshot["memoryItems"][number]) {
  const entityCount = item.entities.length;
  const source = item.markdownPath ?? item.sourceType;
  return entityCount ? `${source} | ${entityCount} entities | importance ${item.importance}` : source;
}
