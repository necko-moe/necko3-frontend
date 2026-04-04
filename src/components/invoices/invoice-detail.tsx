import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import type { InvoiceSchema } from "@/types/invoice";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDeleteDialog } from "@/components/chains/confirm-delete-dialog";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
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

const PAYMENT_URL = (import.meta.env.VITE_PAYMENT_URL as string) ?? "";

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

function CopyField({ value, mono }: { value: string; mono?: boolean }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "group flex items-center gap-1.5 text-left transition-colors hover:text-primary",
            mono && "font-mono text-xs",
          )}
        >
          <span className="truncate">{value}</span>
          {copied ? (
            <Check className="size-3 shrink-0 text-emerald-600" />
          ) : (
            <Copy className="size-3 shrink-0 opacity-0 group-hover:opacity-60" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? t("common.copied") : t("common.clickToCopy")}</TooltipContent>
    </Tooltip>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

function TimeField({ date, isExpiry }: { date: string; isExpiry?: boolean }) {
  const dateLocale = useDateLocale();
  const d = new Date(date);
  const past = isPast(d);
  const relative = formatDistanceToNow(d, { addSuffix: true, locale: dateLocale });
  const exact = format(d, "PPpp", { locale: dateLocale });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            isExpiry && past && "text-destructive/80",
            isExpiry && !past && "text-foreground",
          )}
        >
          {relative}
        </span>
      </TooltipTrigger>
      <TooltipContent>{exact}</TooltipContent>
    </Tooltip>
  );
}

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
  const [linkCopied, setLinkCopied] = useState(false);

  const cfg = statusConfig[invoice.status] ?? statusConfig.Pending;
  const paymentLink = `${PAYMENT_URL}/${invoice.id}`;

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

  function handleCopyLink() {
    navigator.clipboard.writeText(paymentLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
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
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {linkCopied ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <Link2 className="size-3.5" />
          )}
          {linkCopied ? t("common.copied") : t("invoices.detail.copyPaymentLink")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(paymentLink, "_blank")}
        >
          <ExternalLink className="size-3.5" />
          {t("invoices.detail.openPaymentPage")}
        </Button>
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: invoice info */}
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
              <TimeField date={invoice.expires_at} isExpiry />
            </InfoRow>
          </CardContent>
        </Card>

        {/* Right: webhook info */}
        <div className="space-y-6">
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

          {/* Raw data card */}
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
