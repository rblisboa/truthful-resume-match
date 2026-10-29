// Browser-side text extraction and validation for uploaded resumes. Files never leave the browser.
import { MAX_FILE_BYTES, hasReadableText, normalizeText } from "./rules";

export class FileError extends Error {}

const MSG_SIZE =
  "Este arquivo é maior que o permitido. O tamanho máximo é de 5 MB. Escolha um arquivo menor ou cole o texto do seu currículo.";
const MSG_READ =
  "Não conseguimos extrair o texto deste arquivo. Tente enviar outro PDF ou DOCX, ou cole o texto do currículo.";
const MSG_TYPE = "Formato não aceito. Envie um arquivo PDF ou DOCX, ou cole o texto do currículo.";

export function preValidate(file: File): "pdf" | "docx" {
  const name = file.name.toLowerCase();
  if (file.size === 0) throw new FileError("O arquivo está vazio. Escolha outro arquivo ou cole o texto.");
  if (file.size > MAX_FILE_BYTES) throw new FileError(MSG_SIZE);
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  throw new FileError(MSG_TYPE);
}

export async function extractText(file: File): Promise<string> {
  const kind = preValidate(file);
  const buf = await file.arrayBuffer();
  const head = new Uint8Array(buf.slice(0, 5));
  // Real type check via magic bytes: PDF = "%PDF-", DOCX (zip) = "PK\x03\x04"
  const isPdf = String.fromCharCode(...head) === "%PDF-";
  const isZip = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
  if ((kind === "pdf" && !isPdf) || (kind === "docx" && !isZip))
    throw new FileError("O conteúdo do arquivo não corresponde a um PDF ou DOCX válido. Escolha outro arquivo ou cole o texto.");

  let text = "";
  try {
    if (kind === "pdf") {
      const pdfjs = await import("pdfjs-dist");
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        let line = "";
        const lines: string[] = [];
        for (const item of content.items as { str?: string; hasEOL?: boolean }[]) {
          line += item.str ?? "";
          if (item.hasEOL) {
            lines.push(line);
            line = "";
          }
        }
        if (line) lines.push(line);
        pages.push(lines.join("\n"));
      }
      await doc.cleanup();
      text = pages.join("\n\n");
    } else {
      const mammoth = await import("mammoth");
      const res = await mammoth.extractRawText({ arrayBuffer: buf });
      text = res.value;
    }
  } catch (e) {
    const name = (e as Error)?.name ?? "";
    if (name === "PasswordException")
      throw new FileError("Este arquivo está protegido por senha. Remova a proteção ou cole o texto do currículo.");
    throw new FileError(MSG_READ);
  }
  text = normalizeText(text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n"));
  if (!hasReadableText(text)) {
    throw new FileError(
      kind === "pdf"
        ? "Não encontramos texto neste PDF. Ele pode ter sido digitalizado como imagem, o que ainda não é suportado. Cole o texto do currículo ou envie outro arquivo."
        : MSG_READ,
    );
  }
  return text;
}
