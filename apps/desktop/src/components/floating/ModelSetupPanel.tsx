import type { AssistantSnapshot } from "../../stores/assistantStore";
import type { LocalModelInfo, LocalModelRole } from "@deyana/schemas";
import { Cpu, RefreshCw, Zap } from "lucide-react";
import { assistantStore } from "../../stores/assistantStore";

interface ModelSetupPanelProps {
  snapshot: AssistantSnapshot;
}

export function ModelSetupPanel({ snapshot }: ModelSetupPanelProps) {
  const status = snapshot.modelStatusDetail;
  const chatModels = modelOptions(status?.setupModels ?? [], "chat", snapshot.coreSettings.selectedChatModel);
  const embeddingModels = modelOptions(
    status?.setupModels ?? [],
    "embedding",
    snapshot.coreSettings.selectedEmbeddingModel
  );

  return (
    <section className="model-setup" aria-label="Local model setup">
      <header className="model-setup-header">
        <div className="section-heading">
          <Cpu size={15} aria-hidden="true" />
          <span>Ollama</span>
        </div>
        <div className="model-tools">
          <button
            className="icon-button"
            type="button"
            title="Refresh model status"
            aria-label="Refresh model status"
            onClick={() => void assistantStore.loadModelStatus()}
          >
            <RefreshCw size={15} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            title="Run local test prompt"
            aria-label="Run local test prompt"
            disabled={snapshot.modelTestBusy || snapshot.modelStatus !== "available"}
            onClick={() => void assistantStore.testModel()}
          >
            <Zap size={15} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="model-select-grid">
        <label className="model-field">
          <span>Chat</span>
          <select
            value={snapshot.coreSettings.selectedChatModel}
            onChange={(event) => void assistantStore.selectModel({ chatModel: event.target.value })}
          >
            {chatModels.map((model) => (
              <option key={model.name} value={model.name}>
                {modelLabel(model)}
              </option>
            ))}
          </select>
        </label>
        <label className="model-field">
          <span>Embed</span>
          <select
            value={snapshot.coreSettings.selectedEmbeddingModel}
            onChange={(event) => void assistantStore.selectModel({ embeddingModel: event.target.value })}
          >
            {embeddingModels.map((model) => (
              <option key={model.name} value={model.name}>
                {modelLabel(model)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`model-state model-state-${snapshot.modelStatus}`}>
        {status?.message ?? "Checking local model runtime"}
      </div>

      {snapshot.modelTestResponse ? (
        <div className="model-test-result">
          {snapshot.modelTestResponse.model}: {snapshot.modelTestResponse.response}
        </div>
      ) : null}
    </section>
  );
}

const modelOptions = (
  models: LocalModelInfo[],
  role: LocalModelRole,
  selectedModel: string
): LocalModelInfo[] => {
  const matching = models.filter((model) => model.role === role || model.name === selectedModel);
  if (!matching.some((model) => model.name === selectedModel)) {
    matching.unshift({
      name: selectedModel,
      role,
      installed: false,
      recommended: false,
      profile: null,
      sizeBytes: null,
      detail: "Selected local model"
    });
  }
  return matching;
};

const modelLabel = (model: LocalModelInfo) => {
  const state = model.installed ? "installed" : "missing";
  return model.recommended ? `${model.name} (${state}, recommended)` : `${model.name} (${state})`;
};
