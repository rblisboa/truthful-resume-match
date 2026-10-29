import type { Analysis, Requirement } from "@/lib/rules";
import { MIN_ASSESSABLE_REQUIREMENTS } from "@/lib/rules";
import { Notice, StatusBadge } from "./ui";

function ReqCard({ r }: { r: Requirement }) {
  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-semibold">{r.name}</h4>
        <StatusBadge status={r.status} />
        <span className="text-xs text-muted-foreground">{r.type === "obrigatorio" ? "Obrigatório" : "Desejável"}</span>
      </div>
      <p className="mt-2 text-sm">{r.justification}</p>
      {r.evidence && (
        <blockquote className="mt-2 border-l-4 border-primary/40 bg-muted px-3 py-2 text-sm italic">
          <span className="sr-only">Trecho do currículo: </span>“{r.evidence}”
        </blockquote>
      )}
      {r.status === "nao_identificado" && (
        <p className="mt-2 text-sm text-muted-foreground">Não encontramos evidências suficientes deste requisito no currículo analisado.</p>
      )}
      {r.missing && r.status !== "atendido" && (
        <p className="mt-2 text-sm"><strong>O que falta ou está ambíguo:</strong> {r.missing}</p>
      )}
      {r.suggestion && <p className="mt-1 text-sm"><strong>Sugestão:</strong> {r.suggestion}</p>}
    </li>
  );
}

function Section({ title, items, empty }: { title: string; items: Requirement[]; empty: string }) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">{title} <span className="text-muted-foreground">({items.length})</span></h3>
      {items.length ? <ul className="space-y-3">{items.map((r, i) => <ReqCard key={i} r={r} />)}</ul> : <p className="text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}

export function AnalysisView({ analysis, score }: { analysis: Analysis; score: number | null }) {
  const by = (s: Requirement["status"]) => analysis.requirements.filter((r) => r.status === s);
  const notAssessable = by("nao_avaliavel");
  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-card p-5" aria-labelledby="score-h">
        <h3 id="score-h" className="text-lg font-semibold">Compatibilidade estimada</h3>
        {score !== null ? (
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <p className="font-display text-5xl font-extrabold text-primary">{score}%</p>
            <div className="min-w-48 flex-1">
              <div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Compatibilidade estimada">
                <div className="h-full bg-primary" style={{ width: `${score}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <Notice tone="info" className="mt-3" title="Não há dados suficientes para uma estimativa confiável">
            <p>{analysis.insufficientReason ?? `É preciso ao menos ${MIN_ASSESSABLE_REQUIREMENTS} requisitos avaliáveis para calcular a estimativa.`}</p>
          </Notice>
        )}
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium">Como calculamos</summary>
          <p className="mt-2 text-muted-foreground">
            Cada requisito obrigatório vale 2 pontos e cada desejável vale 1. Atendido recebe o valor total, parcial recebe metade e não
            identificado recebe zero. Requisitos que não podem ser avaliados por um currículo ficam fora da conta. O resultado é a
            porcentagem de pontos obtidos sobre o total possível.
          </p>
        </details>
        <p className="mt-3 text-xs text-muted-foreground">
          Esta é uma estimativa própria do aplicativo, baseada na correspondência identificada entre o currículo e os requisitos da vaga.
          Não representa uma pontuação oficial de um ATS nem uma previsão de contratação.
        </p>
      </section>

      <Section title="Competências encontradas" items={by("atendido")} empty="Nenhum requisito com evidência clara foi identificado." />
      <Section title="Requisitos parcialmente atendidos" items={by("parcial")} empty="Nenhum requisito parcialmente atendido." />
      <Section title="Requisitos não identificados" items={by("nao_identificado")} empty="Todos os requisitos tiveram alguma evidência." />
      {notAssessable.length > 0 && <Section title="Requisitos que não puderam ser avaliados" items={notAssessable} empty="" />}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Sugestões de melhoria</h3>
        <ul className="space-y-2">
          {analysis.suggestions.map((s, i) => (
            <li key={i} className="rounded-lg border bg-card p-4 text-sm">
              <p>{s.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">Relacionado a: {s.relatedTo}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
