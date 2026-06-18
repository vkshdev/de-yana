import type { AssistantSnapshot } from "../../stores/assistantStore";
import type { MemorySourceReference } from "@deyana/schemas";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { assistantStore } from "../../stores/assistantStore";

interface LocalChatProps {
  snapshot: AssistantSnapshot;
}

export function LocalChat({ snapshot }: LocalChatProps) {
  const disabled = snapshot.chatBusy || snapshot.modelStatus !== "available";
  const emptyMessage =
    snapshot.modelStatus === "available"
      ? "Local model ready."
      : snapshot.modelStatusDetail?.message ?? "Local model unavailable.";

  return (
    <section className="chat-surface" aria-label="Local chat">
      <header className="chat-header">
        <div className="section-heading">
          <MessageSquare size={15} aria-hidden="true" />
          <span>Chat</span>
        </div>
        <button
          className="icon-button"
          type="button"
          title="Clear chat"
          aria-label="Clear chat"
          disabled={snapshot.chatBusy || !snapshot.chatMessages.length}
          onClick={() => void assistantStore.clearChatHistory()}
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </header>

      <div className="chat-log">
        {snapshot.chatMessages.length ? (
          snapshot.chatMessages.map((message) => (
            <article
              className={message.role === "user" ? "message message-user" : "message message-assistant"}
              key={message.id}
            >
              <span>{message.content}</span>
              {message.sourceReferences.length ? (
                <div className="source-stack" aria-label="Local memory sources">
                  {message.sourceReferences.map((source) => (
                    <SourceReference source={source} key={`${message.id}-${source.id}`} />
                  ))}
                </div>
              ) : null}
              {message.model ? <small>{message.model}</small> : null}
            </article>
          ))
        ) : (
          <article className="message message-assistant">
            <span>{emptyMessage}</span>
          </article>
        )}
      </div>

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          void assistantStore.sendChatMessage();
        }}
      >
        <input
          value={snapshot.chatDraft}
          placeholder="Message local model"
          aria-label="Message local model"
          disabled={disabled}
          onChange={(event) => assistantStore.setChatDraft(event.target.value)}
        />
        <button
          className="icon-button"
          type="submit"
          title="Send"
          aria-label="Send"
          disabled={disabled || !snapshot.chatDraft.trim()}
        >
          <Send size={15} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function SourceReference({ source }: { source: MemorySourceReference }) {
  const path = source.markdownPath ?? source.sourceUri ?? source.sourceType;

  return (
    <details className="source-reference">
      <summary>
        <span>[{source.label}]</span>
        <strong>{source.title}</strong>
      </summary>
      <p>{source.snippet}</p>
      <small>{path}</small>
    </details>
  );
}
