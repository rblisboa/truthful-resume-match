import { AlertCircle, CheckCircle2, Info, Loader2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { ReqStatus } from "@/lib/rules";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "error";
const toneCls: Record<Tone, string> = {
  info: "bg-secondary text-secondary-foreground border-primary/20",
  success: "bg-success-soft text-foreground border-success/30",
  warning: "bg-warning-soft text-foreground border-warning/40",
  error: "bg-danger-soft text-foreground border-destructive/40",
};
const toneIcon = { info: Info, success: CheckCircle2, warning: TriangleAlert, error: AlertCircle };
const iconCls: Record<Tone, string> = {
  info: "text-primary",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
};

export function Notice({ tone, title, children, className }: { tone: Tone; title?: string; children?: ReactNode; className?: string }) {
  const Icon = toneIcon[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border p-4 text-sm", toneCls[tone], className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconCls[tone])} aria-hidden />
      <div className="space-y-2">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-lg border bg-card p-6 text-sm">
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

const statusMeta: Record<ReqStatus, { label: string; cls: string; Icon: typeof Info }> = {
  atendido: { label: "Atendido", cls: "bg-success-soft text-success border-success/30", Icon: CheckCircle2 },
  parcial: { label: "Parcial", cls: "bg-warning-soft text-warning border-warning/40", Icon: TriangleAlert },
  nao_identificado: { label: "Não identificado", cls: "bg-danger-soft text-destructive border-destructive/30", Icon: AlertCircle },
  nao_avaliavel: { label: "Não avaliável", cls: "bg-muted text-muted-foreground border-border", Icon: Info },
};

export function StatusBadge({ status }: { status: ReqStatus }) {
  const m = statusMeta[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", m.cls)}>
      <m.Icon className="size-3.5" aria-hidden />
      {m.label}
    </span>
  );
}

const steps = ["Dados", "Análise", "Revisão", "Exportação"];
export function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="Etapas">
      <ol className="flex flex-wrap gap-2 text-sm">
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={i === current ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1",
              i === current ? "border-primary bg-primary text-primary-foreground" : i < current ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
            )}
          >
            <span className="font-semibold">{i + 1}</span> {s}
          </li>
        ))}
      </ol>
    </nav>
  );
}
