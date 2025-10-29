import { Link } from "wouter";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <AlertTriangle className="w-20 h-20 mx-auto text-muted-foreground opacity-50" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Página não encontrada</h1>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <Link href="/">
          <Button className="gap-2" data-testid="button-home">
            <Home className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
