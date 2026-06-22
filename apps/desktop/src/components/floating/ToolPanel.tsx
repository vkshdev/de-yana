import type { AssistantSnapshot } from "../../stores/assistantStore";
import type { ToolId } from "@deyana/schemas";
import { CheckCircle2, FileText, GitBranch, Globe2, ListTodo, ShieldCheck, TerminalSquare } from "lucide-react";
import { assistantStore } from "../../stores/assistantStore";

interface ToolPanelProps {
  snapshot: AssistantSnapshot;
}

const tools: Array<{ id: ToolId; label: string; placeholder: string }> = [
  { id: "web_search", label: "Search", placeholder: "Public web query" },
  { id: "fetch_page", label: "Page", placeholder: "https://example.com/page" },
  { id: "read_file", label: "File", placeholder: "Approved local file path" },
  { id: "git_status", label: "Status", placeholder: "Approved git repo path" },
  { id: "git_diff", label: "Diff", placeholder: "Approved git repo path" },
  { id: "commit_message", label: "Commit", placeholder: "Approved git repo path" },
  { id: "code_task", label: "Code", placeholder: "Code question or change goal" },
  { id: "day_planner", label: "Plan", placeholder: "Main focus for today" }
];

const icons = {
  web_search: Globe2,
  fetch_page: Globe2,
  read_file: FileText,
  git_status: GitBranch,
  git_diff: GitBranch,
  commit_message: GitBranch,
  code_task: TerminalSquare,
  day_planner: ListTodo
};

export function ToolPanel({ snapshot }: ToolPanelProps) {
  const active = tools.find((tool) => tool.id === snapshot.toolActive) ?? tools[0];
  const ActiveIcon = icons[active.id];

  return (
    <section className="tool-panel" aria-label="Tools">
      <div className="section-heading">
        <TerminalSquare size={15} aria-hidden="true" />
        <span>Tools</span>
      </div>

      <div className="tool-tabs" role="tablist" aria-label="Tool selection">
        {tools.map((tool) => {
          const Icon = icons[tool.id];
          return (
            <button
              className="tool-tab"
              key={tool.id}
              type="button"
              role="tab"
              aria-selected={tool.id === snapshot.toolActive}
              title={tool.label}
              onClick={() => assistantStore.setToolActive(tool.id)}
            >
              <Icon size={13} aria-hidden="true" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      <div className="tool-runner">
        <ActiveIcon size={14} aria-hidden="true" />
        <input
          value={snapshot.toolInput}
          placeholder={active.placeholder}
          aria-label={`${active.label} input`}
          onChange={(event) => assistantStore.setToolInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void assistantStore.runActiveTool();
            }
          }}
        />
        <button
          className="inline-text-button"
          type="button"
          disabled={snapshot.toolBusy}
          onClick={() => void assistantStore.runActiveTool()}
        >
          <CheckCircle2 size={13} aria-hidden="true" />
          <span>Run</span>
        </button>
      </div>

      <label className="tool-approval">
        <input
          type="checkbox"
          checked={snapshot.toolApproved}
          onChange={(event) => assistantStore.setToolApproved(event.currentTarget.checked)}
        />
        <ShieldCheck size={13} aria-hidden="true" />
        <span>Approve this tool request</span>
      </label>

      {snapshot.toolResult ? (
        <article className="tool-result">
          <strong>{snapshot.toolResult.title}</strong>
          <span>{snapshot.toolResult.summary}</span>
          <pre>{snapshot.toolResult.content}</pre>
        </article>
      ) : null}
    </section>
  );
}
