import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  computeCompatibility,
  hasReadableText,
  isResumeShort,
  sanitizeAnalysis,
} from "@/lib/rules";

describe("regras do currículo", () => {
  it("alerta com menos de 800 caracteres", () => {
    expect(isResumeShort("a".repeat(799))).toBe(true);
  });
  it("exatamente 800 caracteres não aciona o alerta", () => {
    expect(isResumeShort("  " + "a".repeat(800) + "  ")).toBe(false);
  });
  it("texto só com espaços não é legível", () => {
    expect(hasReadableText("      \n   ")).toBe(false);
  });
  it("limite de arquivo é 5 MB", () => {
    expect(MAX_FILE_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe("compatibilidade", () => {
  it("usa pesos 2 (obrigatório) e 1 (desejável)", () => {
    expect(
      computeCompatibility([
        { type: "obrigatorio", status: "atendido" },
        { type: "obrigatorio", status: "parcial" },
        { type: "desejavel", status: "nao_identificado" },
      ]),
    ).toBe(60);
  });
  it("sem pontuação com menos de 3 requisitos avaliáveis", () => {
    expect(
      computeCompatibility([
        { type: "obrigatorio", status: "atendido" },
        { type: "obrigatorio", status: "nao_avaliavel" },
      ]),
    ).toBeNull();
  });
  it("rebaixa 'atendido' quando a evidência não existe no currículo", () => {
    const out = sanitizeAnalysis(
      {
        jobTitle: null,
        insufficientData: false,
        insufficientReason: null,
        suggestions: [],
        requirements: [
          {
            name: "Power BI",
            type: "obrigatorio",
            status: "atendido",
            justification: "x",
            evidence: "Especialista em Power BI",
            missing: null,
            suggestion: null,
            question: null,
          },
        ],
      },
      "Analista com experiência em Excel.",
    );
    expect(out.requirements[0]!.status).toBe("nao_identificado");
    expect(out.requirements[0]!.evidence).toBeNull();
  });
});
