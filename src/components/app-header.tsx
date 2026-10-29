import { Link } from "@tanstack/react-router";
import { FileCheck2 } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 rounded-md font-display text-lg font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <FileCheck2 className="size-4" aria-hidden />
          </span>
          Vaga Certa
        </Link>
        <span className="hidden text-sm text-muted-foreground sm:block">Sem cadastro · Nada é salvo</span>
      </div>
    </header>
  );
}

export function PrivacyNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      <strong className="text-foreground">Privacidade:</strong> não salvamos seu currículo. Arquivos são lidos no seu
      navegador; para a análise e a geração, o texto do currículo e da vaga é enviado a um serviço de inteligência
      artificial externo e não fica armazenado no aplicativo. Ao recarregar ou fechar a página, o trabalho é perdido.
    </p>
  );
}
