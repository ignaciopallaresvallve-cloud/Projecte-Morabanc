"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/toast";
import { approveSpecialRequest, rejectSpecialRequest } from "@/lib/actions/specialRequest";
import { formatDateTime } from "@/utils/format";
import {
  SPECIAL_REQUEST_STATUS_LABELS,
  type SpecialRequest,
  type SpecialRequestStatus,
} from "@/types/specialRequest";
import { cn } from "@/utils/cn";

const STATUS_BADGE_STYLES: Record<SpecialRequestStatus, string> = {
  pendiente: "bg-warning/10 text-warning",
  aprobado: "bg-success/10 text-success",
  rechazado: "bg-danger/10 text-danger",
};

export function SpecialRequestsTable({ initialRequests }: { initialRequests: SpecialRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  function notifyDetailsFor(request: SpecialRequest) {
    return {
      email: request.email,
      buyerName: `${request.firstName} ${request.lastName}`,
      productName: request.productName,
      quantity: request.quantity,
    };
  }

  async function handleApprove(request: SpecialRequest) {
    setPendingActionId(request.id);
    const result = await approveSpecialRequest(request.id, notifyDetailsFor(request));
    setPendingActionId(null);

    if (!result.ok) {
      toast(result.error ?? "No s'ha pogut aprovar la sol·licitud.", "error");
      return;
    }
    setRequests((current) =>
      current.map((r) => (r.id === request.id ? { ...r, status: "aprobado" } : r))
    );
    toast(
      result.emailError
        ? "Sol·licitud aprovada i estoc actualitzat, però no s'ha pogut enviar el correu de notificació."
        : "Sol·licitud aprovada, estoc actualitzat i correu de notificació enviat.",
      result.emailError ? "error" : "success"
    );
  }

  async function handleReject(request: SpecialRequest) {
    setPendingActionId(request.id);
    const result = await rejectSpecialRequest(request.id, notifyDetailsFor(request));
    setPendingActionId(null);

    if (!result.ok) {
      toast(result.error ?? "No s'ha pogut rebutjar la sol·licitud.", "error");
      return;
    }
    setRequests((current) =>
      current.map((r) => (r.id === request.id ? { ...r, status: "rechazado" } : r))
    );
    toast(
      result.emailError
        ? "Sol·licitud rebutjada, però no s'ha pogut enviar el correu de notificació."
        : "Sol·licitud rebutjada i correu de notificació enviat.",
      result.emailError ? "error" : "success"
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-deep">Sol·licituds especials</h1>
        <p className="text-sm text-text-muted">
          {requests.length} {requests.length === 1 ? "sol·licitud rebuda" : "sol·licituds rebudes"}.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
          Encara no s&apos;ha rebut cap sol·licitud especial.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-soft">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Sol·licitant</th>
                <th className="px-4 py-3 font-semibold">Correu</th>
                <th className="px-4 py-3 font-semibold">Departament</th>
                <th className="px-4 py-3 font-semibold">Telèfon</th>
                <th className="px-4 py-3 font-semibold">Producte i quantitat</th>
                <th className="px-4 py-3 font-semibold">Motiu</th>
                <th className="px-4 py-3 font-semibold">Comentaris</th>
                <th className="px-4 py-3 font-semibold">Estat</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Accions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((request) => (
                <tr key={request.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                    {formatDateTime(request.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-text">
                    {request.firstName} {request.lastName}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{request.email}</td>
                  <td className="px-4 py-3 text-text-muted">{request.department}</td>
                  <td className="px-4 py-3 font-mono text-text-muted">{request.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">
                      {request.productName ?? "Producte esborrat"}{" "}
                      <span className="text-text-muted">×{request.quantity}</span>
                    </p>
                    <p className="mt-0.5 max-w-[220px] whitespace-pre-line text-xs text-text-muted">
                      {request.products}
                    </p>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-text-muted">{request.reason}</td>
                  <td className="max-w-[200px] px-4 py-3 text-text-muted">{request.comments ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        STATUS_BADGE_STYLES[request.status]
                      )}
                    >
                      {SPECIAL_REQUEST_STATUS_LABELS[request.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {request.status === "pendiente" && (
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={pendingActionId === request.id}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Aprovar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(request)}
                          disabled={pendingActionId === request.id}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          Rebutjar
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
