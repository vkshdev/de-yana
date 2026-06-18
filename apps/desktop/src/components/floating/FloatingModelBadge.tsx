import type { ModelStatus } from "@deyana/schemas";
import { Cpu } from "lucide-react";

interface FloatingModelBadgeProps {
  status: ModelStatus;
  modelName?: string;
}

export function FloatingModelBadge({ status, modelName }: FloatingModelBadgeProps) {
  const label = status === "available" && modelName ? shortModelName(modelName) : "Model";

  return (
    <div className={`status-badge model-badge model-${status}`} title="Local model status">
      <Cpu size={14} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

const shortModelName = (name: string) => name.replace(":latest", "").replace(":1.7b", " 1.7B");
