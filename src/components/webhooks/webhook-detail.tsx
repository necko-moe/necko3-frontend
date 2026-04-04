import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import type { WebhookSchema } from "@/types/webhook";
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
  Link2,
  FileText,
  RotateCcw,
  Zap,
  Timer,
} from "lucide-react";

interface WebhookDetailProps {
  webhook: WebhookSchema;
  onBack: () => void;
  onCancelled: () => void;
}

const statusConfig: Record<
  string,
  { badge: "default" | "secondary" | "destructive" | "outline"; dot: string }
> = {
  Pending: { dot: "bg-amber-400", badge: "outline" },
  Processing: { dot: "bg-blue-400", badge: "outline" },
  Sent: { dot: "bg-emerald-500", badge: "default" },
  Failed: { dot: "bg-destructive/60", badge: "destructive" },
  Cancelled: { dot: "bg-muted-foreground/50", badge: "secondary" },
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

function TimeField({ date, isRetry }: { date: string; isRetry?: boolean }) {
  const dateLocale = useDateLocale();
  const d = new Date(date);
  const past = isPast(d);
  const relative = formatDistanceToNow(d, { addSuffix: true, locale: dateLocale });
  const exact = format(d, "PPpp", { locale: dateLocale });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(isRetry && past && "text-destructive/80")}
        >
          {relative}
        </span>
      </TooltipTrigger>
      <TooltipContent>{exact}</TooltipContent>
    </Tooltip>
  );
}

export function WebhookDetail({
  webhook,
  onBack,
  onCancelled,
}: WebhookDetailProps) {
  const { apiKey } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cfg = statusConfig[webhook.status] ?? statusConfig.Pending;
  const canCancel =
    webhook.status === "Pending" || webhook.status === "Processing";
  const isRetrying = canCancel;

  async function handleCancel() {
    if (!apiKey) return;
    setCancelling(true);
    try {
      const res = await apiFetch<never>(
        `/webhook/${encodeURIComponent(webhook.id)}`,
        apiKey,
        { method: "DELETE" },
      );
      if (res.status === "error") {
        toast.error(res.message ?? t("webhooks.detail.failedToCancel"));
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
          <h2 className="font-heading text-xl font-semibold">{t("webhooks.detail.title")}</h2>
          <Badge variant={cfg.badge} className="gap-1.5">
            <span
              className={cn("inline-block size-1.5 rounded-full", cfg.dot)}
            />
            {t("status." + webhook.status)}
          </Badge>
        </div>
        <div className="size-8" />
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/invoices?id=${webhook.invoice_id}`)}
        >
          <FileText className="size-3.5" />
          {t("webhooks.detail.viewInvoice")}
        </Button>
        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="size-3.5" />
            {t("webhooks.detail.cancelWebhook")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-1 pt-4">
            <InfoRow icon={Hash} label={t("webhooks.detail.webhookId")}>
              <CopyField value={webhook.id} mono />
            </InfoRow>

            <InfoRow icon={FileText} label={t("webhooks.detail.invoiceId")}>
              <CopyField value={webhook.invoice_id} mono />
            </InfoRow>

            <Separator />

            <InfoRow icon={Link2} label={t("webhooks.detail.url")}>
              <CopyField value={webhook.url} />
            </InfoRow>

            <Separator />

            <InfoRow icon={RotateCcw} label={t("webhooks.detail.attempts")}>
              <span className="tabular-nums">
                {webhook.attempts}{" "}
                <span className="text-muted-foreground">
                  / {webhook.max_retries}
                </span>
              </span>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-cool-teal transition-all"
                    style={{
                      width: `${Math.min((webhook.attempts / Math.max(webhook.max_retries, 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </InfoRow>

            {isRetrying && (
              <InfoRow icon={Timer} label={t("webhooks.detail.nextRetry")}>
                <TimeField date={webhook.next_retry} isRetry />
              </InfoRow>
            )}

            <Separator />

            <InfoRow icon={Clock} label={t("webhooks.detail.created")}>
              <TimeField date={webhook.created_at} />
            </InfoRow>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("webhooks.detail.eventPayload")}
              </h3>
              <Badge variant="secondary" className="text-xs font-normal">
                <Zap className="mr-1 size-3" />
                {t("webhooks.eventFull." + webhook.payload.event_type) ??
                  webhook.payload.event_type}
              </Badge>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <pre className="overflow-x-auto text-xs leading-relaxed text-foreground/80">
                {JSON.stringify(webhook.payload, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("webhooks.detail.cancelTitle")}
        description={t("webhooks.detail.cancelDesc")}
        onConfirm={handleCancel}
        loading={cancelling}
      />
    </div>
  );
}
