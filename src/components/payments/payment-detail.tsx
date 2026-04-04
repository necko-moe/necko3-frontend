import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import type { PaymentSchema } from "@/types/payment";
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
  XCircle,
  Clock,
  Hash,
  Globe,
  Coins,
  FileText,
  ArrowRightLeft,
  Wallet,
  Layers,
  List,
} from "lucide-react";

interface PaymentDetailProps {
  payment: PaymentSchema;
  onBack: () => void;
  onCancelled: () => void;
}

const statusConfig: Record<
  string,
  { badge: "default" | "secondary" | "destructive" | "outline"; dot: string }
> = {
  Confirming: { dot: "bg-amber-400", badge: "outline" },
  Confirmed: { dot: "bg-emerald-500", badge: "default" },
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

function TimeField({ date }: { date: string }) {
  const dateLocale = useDateLocale();
  const d = new Date(date);
  const relative = formatDistanceToNow(d, { addSuffix: true, locale: dateLocale });
  const exact = format(d, "PPpp", { locale: dateLocale });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{relative}</span>
      </TooltipTrigger>
      <TooltipContent>{exact}</TooltipContent>
    </Tooltip>
  );
}

export function PaymentDetail({
  payment,
  onBack,
  onCancelled,
}: PaymentDetailProps) {
  const { apiKey } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cfg = statusConfig[payment.status] ?? statusConfig.Confirming;

  async function handleCancel() {
    if (!apiKey) return;
    setCancelling(true);
    try {
      const res = await apiFetch<never>(
        `/payment/${encodeURIComponent(payment.id)}`,
        apiKey,
        { method: "DELETE" },
      );
      if (res.status === "error") {
        toast.error(res.message ?? t("payments.detail.failedToCancel"));
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex flex-1 items-center justify-center gap-3">
          <h2 className="font-heading text-xl font-semibold">{t("payments.detail.title")}</h2>
          <Badge variant={cfg.badge} className="gap-1.5">
            <span
              className={cn("inline-block size-1.5 rounded-full", cfg.dot)}
            />
            {t("status." + payment.status)}
          </Badge>
        </div>
        <div className="size-8" />
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/invoices?id=${payment.invoice_id}`)}
        >
          <FileText className="size-3.5" />
          {t("payments.detail.viewInvoice")}
        </Button>
        {payment.status === "Confirming" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="size-3.5" />
            {t("payments.detail.cancelPayment")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-1 pt-4">
            <InfoRow icon={Hash} label={t("payments.detail.paymentId")}>
              <CopyField value={payment.id} mono />
            </InfoRow>

            <InfoRow icon={FileText} label={t("payments.detail.invoiceId")}>
              <CopyField value={payment.invoice_id} mono />
            </InfoRow>

            <Separator />

            <InfoRow icon={Wallet} label={t("payments.detail.from")}>
              <CopyField value={payment.from} mono />
            </InfoRow>

            <InfoRow icon={Wallet} label={t("payments.detail.to")}>
              <CopyField value={payment.to} mono />
            </InfoRow>

            <Separator />

            <InfoRow icon={Globe} label={t("payments.detail.network")}>
              {payment.network}
            </InfoRow>

            <InfoRow icon={Coins} label={t("payments.detail.token")}>
              {payment.token}
            </InfoRow>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-1 pt-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {t("payments.detail.transaction")}
              </h3>

              <InfoRow icon={ArrowRightLeft} label={t("payments.detail.txHash")}>
                <CopyField value={payment.tx_hash} mono />
              </InfoRow>

              <InfoRow icon={Layers} label={t("payments.detail.blockNumber")}>
                {payment.block_number.toLocaleString()}
              </InfoRow>

              <InfoRow icon={List} label={t("payments.detail.logIndex")}>
                {payment.log_index}
              </InfoRow>

              <Separator />

              <InfoRow icon={Clock} label={t("payments.detail.created")}>
                <TimeField date={payment.created_at} />
              </InfoRow>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {t("payments.detail.rawValues")}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">amount_raw</span>
                  <CopyField value={payment.amount_raw} mono />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("payments.detail.cancelTitle")}
        description={t("payments.detail.cancelDesc")}
        onConfirm={handleCancel}
        loading={cancelling}
      />
    </div>
  );
}
