import { PaymentSettingsForm } from "@/components/admin/PaymentSettingsForm";
import { getPaymentSettings } from "@/services/paymentSettings";

export const metadata = {
  title: "Ajustos de pagament · Administració",
};

export default async function PagosPage() {
  const settings = await getPaymentSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-deep">Ajustos de pagament</h1>
        <p className="max-w-2xl text-sm text-text-muted">
          Aquestes dades es mostren als empleats en finalitzar una
          sol·licitud, perquè facin la transferència bancària pel seu
          compte. MoraBanc Office Store no processa cap cobrament: només
          registra la comanda com a «Pendent de pagament» i mostra aquesta
          informació.
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-border bg-surface p-6 shadow-soft">
        <PaymentSettingsForm settings={settings} />
      </div>
    </div>
  );
}
