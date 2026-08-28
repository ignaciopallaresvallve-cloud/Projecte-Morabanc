import { AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui/Container";

interface SetupNoticeProps {
  title: string;
  description: string;
}

export function SetupNotice({ title, description }: SetupNoticeProps) {
  return (
    <Container className="py-20">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border border-warning/30 bg-warning/10 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-warning" aria-hidden="true" />
        <h1 className="font-heading text-xl font-bold text-brand-deep">{title}</h1>
        <p className="text-sm leading-relaxed text-text-muted">{description}</p>
      </div>
    </Container>
  );
}
