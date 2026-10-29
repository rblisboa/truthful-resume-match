// Central business rules for the resume/job analysis flow (shared by client and server).

export const MIN_RESUME_CHARACTERS = 800;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MIN_JOB_CHARACTERS = 200;
export const MAX_TEXT_CHARACTERS = 30000;
export const MIN_ASSESSABLE_REQUIREMENTS = 3;

export type ReqType = "obrigatorio" | "desejavel";
export type ReqStatus = "atendido" | "parcial" | "nao_identificado" | "nao_avaliavel";

export type Requirement = {
  name: string;
  type: ReqType;
  status: ReqStatus;
  justification: string;
  evidence: string | null;
  missing: string | null;
  suggestion: string | null;
  question: string | null;
};

export type Analysis = {
  jobTitle: string | null;
  requirements: Requirement[];
  suggestions: { text: string; relatedTo: string }[];
  insufficientData: boolean;
  insufficientReason: string | null;
};

export function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, "\n").trim();
}

/** Counts characters after trimming surrounding whitespace. */
export function countResumeChars(text: string): number {
  return normalizeText(text).length;
}

/** True when the text has real letters (not only spaces/symbols). */
export function hasReadableText(text: string): boolean {
  const letters = normalizeText(text).match(/\p{L}/gu);
  return !!letters && letters.length >= 20;
}

export function isResumeShort(text: string): boolean {
  return countResumeChars(text) < MIN_RESUME_CHARACTERS;
}

export function isJobShort(text: string): boolean {
  return countResumeChars(text) < MIN_JOB_CHARACTERS;
}

/**
 * Compatibility methodology:
 * - Weight: required requirement = 2, desirable = 1.
 * - Credit: met = 1, partially met = 0.5, not identified = 0.
 * - Requirements that could not be assessed are excluded.
 * - Score = sum(weight * credit) / sum(weight) * 100, rounded.
 * - Returns null (no score) if fewer than MIN_ASSESSABLE_REQUIREMENTS are assessable.
 */
export const WEIGHTS: Record<ReqType, number> = { obrigatorio: 2, desejavel: 1 };
export const CREDITS: Record<Exclude<ReqStatus, "nao_avaliavel">, number> = {
  atendido: 1,
  parcial: 0.5,
  nao_identificado: 0,
};

export function computeCompatibility(reqs: Pick<Requirement, "type" | "status">[]): number | null {
  const assessable = reqs.filter((r) => r.status !== "nao_avaliavel");
  if (assessable.length < MIN_ASSESSABLE_REQUIREMENTS) return null;
  let total = 0;
  let earned = 0;
  for (const r of assessable) {
    const w = WEIGHTS[r.type];
    total += w;
    earned += w * CREDITS[r.status as keyof typeof CREDITS];
  }
  return total === 0 ? null : Math.round((earned / total) * 100);
}

function squash(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Checks that a quoted evidence excerpt actually exists in the resume. */
export function evidenceExists(resume: string, evidence: string): boolean {
  const e = squash(evidence);
  if (e.length < 3) return false;
  return squash(resume).includes(e);
}

/** Validates AI output against the resume: drops fabricated evidence, downgrades unsupported "met". */
export function sanitizeAnalysis(raw: Analysis, resume: string): Analysis {
  const requirements = raw.requirements
    .filter((r) => r.name?.trim())
    .map((r) => {
      const req = { ...r };
      if (req.evidence && !evidenceExists(resume, req.evidence)) req.evidence = null;
      if (req.status === "atendido" && !req.evidence) {
        req.status = "parcial";
        req.missing =
          req.missing ??
          "Não localizamos no currículo um trecho que demonstre claramente este requisito.";
      }
      if (req.status === "parcial" && !req.evidence) {
        req.status = "nao_identificado";
      }
      return req;
    });
  return { ...raw, requirements };
}
