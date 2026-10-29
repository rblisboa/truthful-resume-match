import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileSearch, PenLine, FileDown } from "lucide-react";
import { AppHeader, PrivacyNote } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vaga Certa — Adapte seu currículo à vaga que você deseja" },
      { name: "description", content: "Compare seu currículo com a descrição da vaga, veja lacunas e gere uma versão otimizada para ATS em Word." },
      { property: "og:title", content: "Vaga Certa — Adapte seu currículo à vaga" },
      { property: "og:description", content: "Análise fundamentada do currículo frente à vaga, com revisão e exportação em Word." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const benefits = [
  { icon: FileSearch, title: "Veja o que a vaga pede", text: "Requisitos atendidos, parciais e não identificados, cada um com justificativa." },
  { icon: PenLine, title: "Sugestões com base no que é real", text: "Nada é inventado: o app só usa o que está no seu currículo ou o que você confirmar." },
  { icon: FileDown, title: "Você revisa e aprova", text: "Edite a versão sugerida e exporte em Word somente depois de aprovar." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
        <section className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
            <CheckCircle2 className="size-4" aria-hidden /> Gratuito e sem cadastro
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Adapte seu currículo à vaga que você deseja
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Compare seu currículo com a descrição da vaga, entenda o que já está claro e o que pode melhorar, e gere uma
            versão mais organizada para sistemas de triagem (ATS) — os programas que muitas empresas usam para ler
            currículos.
          </p>
          <Button asChild size="lg" className="mt-8 h-12 px-6 text-base">
            <Link to="/analisar">Analisar meu currículo</Link>
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            Você poderá revisar e editar todo o conteúdo antes de exportar.
          </p>
        </section>

        <ul className="mt-16 grid gap-6 sm:grid-cols-3">
          {benefits.map((b) => (
            <li key={b.title} className="rounded-xl border bg-card p-5">
              <b.icon className="size-6 text-primary" aria-hidden />
              <h2 className="mt-3 font-semibold">{b.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-xl border bg-secondary/50 p-5">
          <PrivacyNote />
          <p className="mt-2 text-sm text-muted-foreground">
            O aplicativo não garante aprovação em ATS nem contratação; ele ajuda a apresentar melhor suas experiências reais.
          </p>
        </div>
      </main>
    </div>
  );
}
