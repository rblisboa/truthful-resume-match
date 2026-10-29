// Builds an ATS-friendly DOCX (single column, no tables) from the approved resume text.
import { AlignmentType, BorderStyle, Document, LevelFormat, Packer, Paragraph, TextRun } from "docx";

export async function buildDocx(text: string): Promise<Blob> {
  const children: Paragraph[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("# ")) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 80 },
          children: [new TextRun({ text: line.slice(2), bold: true, size: 36 })],
        }),
      );
    } else if (line.startsWith("## ")) {
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F3A68", space: 1 } },
          children: [new TextRun({ text: line.slice(3).toUpperCase(), bold: true, size: 24, color: "1F3A68" })],
        }),
      );
    } else if (line.startsWith("### ")) {
      children.push(
        new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: line.slice(4), bold: true, size: 22 })] }),
      );
    } else if (/^[-•*]\s+/.test(line)) {
      children.push(
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 40 },
          children: [new TextRun({ text: line.replace(/^[-•*]\s+/, ""), size: 21 })],
        }),
      );
    } else {
      children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: line, size: 21 })] }));
    }
  }
  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 21 } } } },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 270 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
        children,
      },
    ],
  });
  return Packer.toBlob(doc);
}
