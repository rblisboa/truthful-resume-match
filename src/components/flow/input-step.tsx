import { useRef, useState } from "react";
import { FileUp, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { extractText, FileError } from "@/lib/extract";
import { MIN_RESUME_CHARACTERS, countResumeChars, hasReadableText, isJobShort, isResumeShort } from "@/lib/rules";
import { Loading, Notice } from "./ui";
import { PrivacyNote } from "@/components/app-header";
import { cn } from "@/lib/utils";

export type InputState = {
  method: "text" | "file";
  pastedText: string;
  fileName: string | null;
  extractedText: string;
  job: string;
};

export function InputStep({
  value,
  onChange,
  onAnalyze,
}: {
  value: InputState;
  onChange: (v: InputState) => void;
  onAnalyze: () => void;
}) {
  const [extracting, setExtracting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pendingMethod, setPendingMethod] = useState<"text" | "file" | null>(null);
  const [shortOpen, setShortOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resume = value.method === "text" ? value.pastedText : value.extractedText;
  const resumeOk = hasReadableText(resume);
  const jobOk = hasReadableText(value.job);
  const ready = resumeOk && jobOk && !extracting;
  const chars = countResumeChars(resume);

  function switchMethod(m: "text" | "file") {
    if (m === value.method) return;
    const hasContent = value.method === "text" ? value.pastedText.trim() : value.extractedText;
    if (hasContent) setPendingMethod(m);
    else doSwitch(m);
  }
  function doSwitch(m: "text" | "file") {
    setFileError(null);
    onChange({ ...value, method: m, pastedText: "", extractedText: "", fileName: null });
    setPendingMethod(null);
  }

  async function onFile(file: File | undefined) {
    if (!file || extracting) return;
    setFileError(null);
    setExtracting(true);
    try {
      const text = await extractText(file);
      onChange({ ...value, fileName: file.name, extractedText: text });
    } catch (e) {
      setFileError(e instanceof FileError ? e.message : "Não conseguimos extrair o texto deste arquivo. Tente enviar outro PDF ou DOCX, ou cole o texto do currículo.");
      onChange({ ...value, fileName: null, extractedText: "" });
    } finally {
      setExtracting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function submit() {
    if (!ready) return;
    if (isResumeShort(resume)) setShortOpen(true);
    else onAnalyze();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Seu currículo e a vaga</h1>
        <p className="mt-2 text-muted-foreground">Insira seu currículo de uma das formas abaixo e cole a descrição da vaga.</p>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-5" aria-labelledby="cv-h">
        <h2 id="cv-h" className="text-lg font-semibold">1. Currículo</h2>
        <div role="radiogroup" aria-label="Forma de envio do currículo" className="grid grid-cols-2 gap-2 sm:max-w-md">
          {(
            [
              ["text", "Colar texto", Type],
              ["file", "Enviar arquivo", FileUp],
            ] as const
          ).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={value.method === m}
              disabled={extracting}
              onClick={() => switchMethod(m)}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                value.method === m ? "border-primary bg-secondary text-secondary-foreground" : "hover:bg-muted",
              )}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          ))}
        </div>

        {value.method === "text" ? (
          <div className="space-y-2">
            <Label htmlFor="cv-text">Texto do currículo</Label>
            <Textarea
              id="cv-text"
              rows={12}
              value={value.pastedText}
              onChange={(e) => onChange({ ...value, pastedText: e.target.value })}
              placeholder="Cole aqui o conteúdo completo do seu currículo"
              aria-describedby="cv-count"
            />
            <p id="cv-count" className="text-xs text-muted-foreground">{chars} caracteres</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Label htmlFor="cv-file">Arquivo PDF ou DOCX (até 5 MB)</Label>
            <label
              htmlFor="cv-file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center text-sm hover:bg-muted focus-within:ring-2 focus-within:ring-ring"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files?.[0]);
              }}
            >
              <FileUp className="size-6 text-primary" aria-hidden />
              <span className="font-medium">Clique para escolher ou arraste o arquivo aqui</span>
              <span className="text-muted-foreground">PDFs digitalizados como imagem não são suportados.</span>
              <input
                ref={inputRef}
                id="cv-file"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                disabled={extracting}
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
            {extracting && <Loading label="Extraindo e validando o texto do arquivo…" />}
            {fileError && (
              <Notice tone="error" title="Não foi possível usar este arquivo">
                <p>{fileError}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>Tentar outro arquivo</Button>
                  <Button size="sm" variant="outline" onClick={() => doSwitch("text")}>Colar o texto</Button>
                </div>
              </Notice>
            )}
            {value.extractedText && value.fileName && (
              <Notice tone="success" title={`Texto extraído de "${value.fileName}"`}>
                <p>{chars} caracteres. Confira abaixo se o conteúdo está correto.</p>
                <details>
                  <summary className="cursor-pointer font-medium">Ver texto extraído</summary>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-card p-3 text-xs">{value.extractedText}</pre>
                </details>
              </Notice>
            )}
          </div>
        )}
        {resume.trim() && !resumeOk && (
          <Notice tone="error">O conteúdo do currículo parece vazio ou ilegível. Revise o texto antes de continuar.</Notice>
        )}
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-5" aria-labelledby="job-h">
        <h2 id="job-h" className="text-lg font-semibold">2. Descrição da vaga</h2>
        <Label htmlFor="job">Cole a descrição completa da vaga (obrigatório)</Label>
        <Textarea
          id="job"
          rows={10}
          value={value.job}
          onChange={(e) => onChange({ ...value, job: e.target.value })}
          placeholder="Inclua responsabilidades, requisitos e diferenciais"
        />
        {value.job.trim() && jobOk && isJobShort(value.job) && (
          <Notice tone="warning">A descrição parece curta ou incompleta. Se possível, cole o texto completo da vaga para uma análise mais precisa.</Notice>
        )}
        {value.job.trim() && !jobOk && <Notice tone="error">A descrição da vaga parece vazia ou ilegível.</Notice>}
      </section>

      {ready && (
        <Notice tone="success">Tudo pronto para analisar. Seu currículo foi validado e a descrição da vaga está preenchida.</Notice>
      )}
      <PrivacyNote />
      <div className="flex justify-end">
        <Button size="lg" disabled={!ready} onClick={submit}>Analisar currículo</Button>
      </div>

      <AlertDialog open={pendingMethod !== null} onOpenChange={(o) => !o && setPendingMethod(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar a forma de envio?</AlertDialogTitle>
            <AlertDialogDescription>O conteúdo do currículo inserido agora será descartado. A descrição da vaga será mantida.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter conteúdo</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingMethod && doSwitch(pendingMethod)}>Descartar e trocar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={shortOpen} onOpenChange={setShortOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Currículo com poucas informações</AlertDialogTitle>
            <AlertDialogDescription>
              Seu currículo contém poucas informações ({chars} de {MIN_RESUME_CHARACTERS} caracteres recomendados). Podemos continuar, mas
              talvez não haja dados suficientes para avaliar todos os requisitos da vaga. Você pode complementar o currículo ou prosseguir com o conteúdo atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar currículo</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShortOpen(false); onAnalyze(); }}>Continuar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
