import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Download } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { InputStep, type InputState } from "@/components/flow/input-step";
import { AnalysisView } from "@/components/flow/analysis-view";
import { Loading, Notice, Stepper } from "@/components/flow/ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analyzeResume, generateResume } from "@/lib/resume.functions";
import { buildDocx } from "@/lib/export-docx";
import type { Analysis } from "@/lib/rules";

export const Route = createFileRoute("/analisar")({
  head: () => ({
    meta: [
      { title: "Analisar currículo — Vaga Certa" },
      { name: "description", content: "Envie seu currículo e a vaga para receber uma análise de compatibilidade e uma versão otimizada." },
      { property: "og:title", content: "Analisar currículo — Vaga Certa" },
      { property: "og:description", content: "Análise de currículo frente à vaga com revisão e exportação em Word." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Flow,
});

type Confirm = { answer: "sim" | "nao" | null; detail: string };

function Flow() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<InputState>({ method: "text", pastedText: "", fileName: null, extractedText: "", job: "" });
  // Versions kept separately: original (from input), suggested, edited, approved.
  const [original, setOriginal] = useState("");
  const [analysis, setAnalysis] = useState<{ analysis: Analysis; score: number | null; forResume: string; forJob: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [confirms, setConfirms] = useState<Record<number, Confirm>>({});
  const [suggested, setSuggested] = useState<string | null>(null);
  const [edited, setEdited] = useState("");
  const [approved, setApproved] = useState<{ text: string; at: Date } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [exportState, setExportState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const busy = useRef(false);

  const analyzeFn = useServerFn(analyzeResume);
  const generateFn = useServerFn(generateResume);

  const hasWork = !!(input.pastedText || input.extractedText || input.job);
  useEffect(() => {
    if (!hasWork) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hasWork]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const approvalValid = approved !== null && approved.text === edited;

  async function runAnalysis() {
    if (busy.current) return;
    const resume = (input.method === "text" ? input.pastedText : input.extractedText).trim();
    setOriginal(resume);
    setStep(1);
    if (analysis && analysis.forResume === resume && analysis.forJob === input.job) return;
    busy.current = true;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await analyzeFn({ data: { resume, job: input.job } });
      if ("error" in res) setAnalysisError(res.error);
      else {
        setAnalysis({ ...res, forResume: resume, forJob: input.job });
        setConfirms({});
        setSuggested(null);
        setEdited("");
        setApproved(null);
      }
    } catch {
      setAnalysisError("Falha de conexão durante a análise. Verifique sua internet e tente novamente.");
    } finally {
      busy.current = false;
      setAnalyzing(false);
    }
  }

  async function runGenerate() {
    if (busy.current || !analysis) return;
    busy.current = true;
    setGenerating(true);
    setGenError(null);
    const confirmations = analysis.analysis.requirements
      .map((r, i) => ({ r, c: confirms[i] }))
      .filter(({ c }) => c?.answer === "sim" && c.detail.trim())
      .map(({ r, c }) => ({ requirement: r.name, detail: c!.detail }));
    try {
      const res = await generateFn({ data: { resume: original, job: input.job, analysis: analysis.analysis, confirmations } });
      if ("error" in res) setGenError(res.error);
      else {
        setSuggested(res.text);
        setEdited(res.text);
        setApproved(null);
      }
    } catch {
      setGenError("Falha de conexão ao gerar o currículo. Seus dados foram mantidos; tente novamente.");
    } finally {
      busy.current = false;
      setGenerating(false);
    }
  }

  async function runExport() {
    if (!approvalValid || exportState === "working") return;
    setExportState("working");
    try {
      const blob = await buildDocx(approved!.text);
      if (docUrl) URL.revokeObjectURL(docUrl);
      setDocUrl(URL.createObjectURL(blob));
      setExportState("done");
    } catch {
      setExportState("error");
    }
  }

  const questions = analysis?.analysis.requirements.map((r, i) => ({ r, i })).filter(({ r }) => r.question && (r.status === "parcial" || r.status === "nao_identificado")) ?? [];

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Stepper current={step} />

        {step === 0 && <InputStep value={input} onChange={setInput} onAnalyze={runAnalysis} />}

        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Resultado da análise</h1>
            {analyzing && <Loading label="Analisando seu currículo frente aos requisitos da vaga. Isso pode levar até um minuto…" />}
            {analysisError && !analyzing && (
              <Notice tone="error" title="A análise não foi concluída">
                <p>{analysisError}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setAnalysis(null); runAnalysis(); }}>Tentar novamente</Button>
                  <Button size="sm" variant="outline" onClick={() => setStep(0)}>Revisar dados</Button>
                </div>
              </Notice>
            )}
            {analysis && !analyzing && !analysisError && <AnalysisView analysis={analysis.analysis} score={analysis.score} />}
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(0)} disabled={analyzing}><ArrowLeft className="size-4" /> Voltar aos dados</Button>
              {analysis && !analyzing && !analysisError && <Button onClick={() => setStep(2)}>Gerar currículo sugerido</Button>}
            </div>
          </div>
        )}

        {step === 2 && analysis && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Revisão do currículo</h1>
            {questions.length > 0 && (
              <section className="space-y-4 rounded-xl border bg-card p-5">
                <h2 className="text-lg font-semibold">Confirme algumas informações (opcional)</h2>
                <p className="text-sm text-muted-foreground">Só usaremos uma resposta se você marcar “Sim” e descrever sua experiência real. Perguntas sem resposta não entram no currículo.</p>
                {questions.map(({ r, i }) => {
                  const c = confirms[i] ?? { answer: null, detail: "" };
                  const set = (v: Partial<Confirm>) => setConfirms({ ...confirms, [i]: { ...c, ...v } });
                  return (
                    <fieldset key={i} className="space-y-2 border-t pt-4">
                      <legend className="text-sm font-medium">{r.question}</legend>
                      <div className="flex gap-2">
                        <Button size="sm" type="button" variant={c.answer === "sim" ? "default" : "outline"} aria-pressed={c.answer === "sim"} onClick={() => set({ answer: "sim" })}>Sim</Button>
                        <Button size="sm" type="button" variant={c.answer === "nao" ? "default" : "outline"} aria-pressed={c.answer === "nao"} onClick={() => set({ answer: "nao", detail: "" })}>Não</Button>
                      </div>
                      {c.answer === "sim" && (
                        <div className="space-y-1">
                          <Label htmlFor={`q${i}`}>Descreva brevemente onde e como (somente informações verdadeiras)</Label>
                          <Textarea id={`q${i}`} rows={2} value={c.detail} onChange={(e) => set({ detail: e.target.value })} />
                        </div>
                      )}
                    </fieldset>
                  );
                })}
              </section>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={runGenerate} disabled={generating}>{suggested ? "Gerar novamente" : "Gerar currículo sugerido"}</Button>
              {suggested && <span className="self-center text-xs text-muted-foreground">Gerar novamente substitui a versão editada.</span>}
            </div>
            {generating && <Loading label="Gerando a versão sugerida do seu currículo…" />}
            {genError && !generating && (
              <Notice tone="error" title="A geração não foi concluída"><p>{genError}</p></Notice>
            )}

            {suggested !== null && !generating && (
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="editor" className="text-lg font-semibold">Edite sua versão</Label>
                  <Button variant="outline" size="sm" disabled={edited === suggested} onClick={() => setEdited(suggested)}>Restaurar sugestão</Button>
                </div>
                <p className="text-sm text-muted-foreground">Formato: “# ” nome, “## ” seção, “### ” cargo, “- ” itens. Corrija ou remova o que não for adequado.</p>
                <Textarea id="editor" rows={22} className="font-mono text-sm" value={edited} onChange={(e) => setEdited(e.target.value)} />
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">Ver currículo original (preservado)</summary>
                  <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded border bg-muted p-3 text-xs">{original}</pre>
                </details>
                {approved && !approvalValid && (
                  <Notice tone="warning">Você alterou o texto depois de aprovar. Aprove novamente para exportar.</Notice>
                )}
                <Notice tone="info">Ao aprovar, o documento Word será preparado exatamente com o texto acima.</Notice>
              </section>
            )}

            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={generating}><ArrowLeft className="size-4" /> Voltar à análise</Button>
              {suggested !== null && !generating && (
                <Button
                  disabled={!edited.trim()}
                  onClick={() => {
                    setApproved({ text: edited, at: new Date() });
                    setExportState("idle");
                    setStep(3);
                  }}
                >
                  Aprovar e exportar
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Exportação</h1>
            {!approvalValid ? (
              <Notice tone="warning" title="Nenhuma versão aprovada">
                <p>Volte à revisão e aprove o texto para exportar.</p>
              </Notice>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Versão aprovada às {approved!.at.toLocaleTimeString("pt-BR")}.</p>
                {exportState === "idle" && <Button onClick={runExport}>Preparar documento Word</Button>}
                {exportState === "working" && <Loading label="Preparando o documento…" />}
                {exportState === "error" && (
                  <Notice tone="error" title="Não foi possível gerar o documento">
                    <p>Seu texto aprovado foi mantido. Tente novamente.</p>
                    <Button size="sm" onClick={runExport}>Tentar novamente</Button>
                  </Notice>
                )}
                {exportState === "done" && docUrl && (
                  <Notice tone="success" title="Seu currículo está pronto">
                    <p>O documento contém exatamente a versão que você aprovou.</p>
                    <Button asChild>
                      <a href={docUrl} download="curriculo-otimizado.docx"><Download className="size-4" /> Baixar currículo em Word</a>
                    </Button>
                  </Notice>
                )}
              </>
            )}
            {exportState === "done" && (
              <div className="rounded-xl border bg-card p-5 text-sm">
                <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-success" aria-hidden /> Processo concluído</p>
                <p className="mt-1 text-muted-foreground">Revise o arquivo no Word antes de enviar. Lembre-se: nada foi salvo; ao fechar a página, os dados desta sessão serão apagados.</p>
              </div>
            )}
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="size-4" /> Voltar à revisão</Button>
              <Button variant="ghost" asChild><Link to="/">Página inicial</Link></Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
