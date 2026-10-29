<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Resume analyzer
- Business limits (file size, min chars, scoring weights) live only in `src/lib/rules.ts`, tested in `src/test/rules.test.ts` — single source for client and server.
- Compatibility score is computed in code from AI-classified requirements, never asked from the model — keeps the methodology documented and deterministic.
- AI output is sanitized against the resume (evidence must exist verbatim) before display — prevents fabricated evidence.
- Files are parsed in the browser (pdfjs/mammoth) and DOCX is built in the browser; no resume storage anywhere — MVP has no persistence by design.
