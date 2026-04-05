import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { InvoiceSchema } from "@/types/invoice";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyField, InfoRow, TimeField } from "@/components/shared/detail-primitives";
import { InvoiceShareCard } from "@/components/invoices/invoice-share-card";
import { ConfirmDeleteDialog } from "@/components/chains/confirm-delete-dialog";
import {
  ArrowLeft,
  CreditCard,
  Webhook,
  XCircle,
  Clock,
  Wallet,
  Hash,
  Globe,
  Coins,
  Eye,
  EyeOff,
  Link2,
  RotateCcw,
} from "lucide-react";

interface InvoiceDetailProps {
  invoice: InvoiceSchema;
  onBack: () => void;
  onCancelled: () => void;
}

const statusConfig: Record<
  string,
  { badge: "default" | "secondary" | "destructive" | "outline"; dot: string }
> = {
  Pending: { dot: "bg-amber-400", badge: "outline" },
  Paid: { dot: "bg-emerald-500", badge: "default" },
  Expired: { dot: "bg-muted-foreground/50", badge: "secondary" },
  Cancelled: { dot: "bg-destructive/60", badge: "destructive" },
};

export function InvoiceDetail({
  invoice,
  onBack,
  onCancelled,
}: InvoiceDetailProps) {
  const { t } = useTranslation();
  const { apiKey } = useAuth();
  const navigate = useNavigate();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [secretVisible, setSecretVisible] = useState(false);

  const cfg = statusConfig[invoice.status] ?? statusConfig.Pending;

  async function handleCancel() {
    if (!apiKey) return;
    setCancelling(true);
    try {
      const res = await apiFetch<never>(
        `/invoice/${encodeURIComponent(invoice.id)}`,
        apiKey,
        { method: "DELETE" },
      );
      if (res.status === "error") {
        toast.error(res.message ?? t("invoices.detail.failedToCancel"));
        return;
      }
      setCancelOpen(false);
      onCancelled();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex flex-1 items-center justify-center gap-3">
          <h2 className="font-heading text-xl font-semibold">{t("invoices.detail.title")}</h2>
          <Badge variant={cfg.badge} className="gap-1.5">
            <span
              className={cn("inline-block size-1.5 rounded-full", cfg.dot)}
            />
            {t("status." + invoice.status)}
          </Badge>
        </div>
        <div className="size-8" />
      </div>

      <Separator />

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/payments?invoice_id=${invoice.id}`)}
        >
          <CreditCard className="size-3.5" />
          {t("invoices.detail.payments")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/webhooks?invoice_id=${invoice.id}`)}
        >
          <Webhook className="size-3.5" />
          {t("invoices.detail.webhooks")}
        </Button>
        {invoice.status === "Pending" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="size-3.5" />
            {t("invoices.detail.cancelInvoice")}
          </Button>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
        {/* Left column: data cards */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-1 pt-4">
              <InfoRow icon={Hash} label={t("invoices.detail.invoiceId")}>
                <CopyField value={invoice.id} mono />
              </InfoRow>

              <InfoRow icon={Wallet} label={t("invoices.detail.depositAddress")}>
                <CopyField value={invoice.address} mono />
              </InfoRow>

              <Separator />

              <InfoRow icon={Coins} label={t("invoices.detail.amount")}>
                <span>
                  {invoice.amount} {invoice.token}
                </span>
              </InfoRow>

              <InfoRow icon={Coins} label={t("invoices.detail.paid")}>
                <span>
                  {invoice.paid} {invoice.token}
                </span>
              </InfoRow>

              <Separator />

              <InfoRow icon={Globe} label={t("invoices.detail.network")}>
                {invoice.network}
              </InfoRow>

              <InfoRow icon={Hash} label={t("invoices.detail.decimals")}>
                {invoice.decimals}
              </InfoRow>

              <InfoRow icon={Hash} label={t("invoices.detail.addressIndex")}>
                {invoice.address_index}
              </InfoRow>

              <Separator />

              <InfoRow icon={Clock} label={t("invoices.detail.created")}>
                <TimeField date={invoice.created_at} />
              </InfoRow>

              <InfoRow icon={Clock} label={t("invoices.detail.expires")}>
                <TimeField date={invoice.expires_at} warn />
              </InfoRow>
            </CardContent>
          </Card>

          {invoice.webhook_url && (
            <Card>
              <CardContent className="space-y-1 pt-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  {t("invoices.detail.webhookConfiguration")}
                </h3>

                <InfoRow icon={Link2} label={t("invoices.detail.url")}>
                  <CopyField value={invoice.webhook_url} />
                </InfoRow>

                {invoice.webhook_secret && (
                  <InfoRow icon={Eye} label={t("invoices.detail.secret")}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">
                        {secretVisible
                          ? invoice.webhook_secret
                          : "••••••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => setSecretVisible((v) => !v)}
                      >
                        {secretVisible ? (
                          <EyeOff className="size-3" />
                        ) : (
                          <Eye className="size-3" />
                        )}
                      </Button>
                    </div>
                  </InfoRow>
                )}

                {invoice.webhook_max_retries != null && (
                  <InfoRow icon={RotateCcw} label={t("invoices.detail.maxRetries")}>
                    {invoice.webhook_max_retries}
                  </InfoRow>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {t("invoices.detail.rawValues")}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">amount_raw</span>
                  <CopyField value={invoice.amount_raw} mono />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">paid_raw</span>
                  <CopyField value={invoice.paid_raw} mono />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: share card */}
        <div className="lg:w-[320px]">
          <div className="lg:sticky lg:top-8">
            <InvoiceShareCard invoice={invoice} />
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("invoices.detail.cancelTitle")}
        description={t("invoices.detail.cancelDesc")}
        onConfirm={handleCancel}
        loading={cancelling}
      />
    </div>
  );
}
