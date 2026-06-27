import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { WebhookSchema } from "@/types/webhook";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyField, InfoRow, TimeField } from "@/components/shared/detail-primitives";
import {
  ArrowLeft,
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
}

const statusConfig: Record<
  string,
  { badge: "default" | "secondary" | "destructive" | "outline"; dot: string }
> = {
  Pending: { dot: "bg-amber-400", badge: "outline" },
  Processing: { dot: "bg-blue-400", badge: "outline" },
  Delivered: { dot: "bg-emerald-500", badge: "default" },
  Failed: { dot: "bg-destructive/60", badge: "destructive" },
};

export function WebhookDetail({
  webhook,
  onBack,
}: WebhookDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const cfg = statusConfig[webhook.status] ?? statusConfig.Pending;
  const isRetrying =
    webhook.status === "Pending" || webhook.status === "Processing";

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
            </InfoRow>

            {isRetrying && (
              <InfoRow icon={Timer} label={t("webhooks.detail.nextRetry")}>
                <TimeField date={webhook.next_retry} warn />
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
    </div>
  );
}
