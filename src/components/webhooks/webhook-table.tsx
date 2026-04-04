import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, isPast } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import type { WebhookSchema } from "@/types/webhook";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check, FileText } from "lucide-react";

interface WebhookTableProps {
  webhooks: WebhookSchema[];
  onSelect: (id: string) => void;
}

const statusConfig: Record<
  string,
  { dot: string; badge: "default" | "secondary" | "destructive" | "outline" }
> = {
  Pending: { dot: "bg-amber-400", badge: "outline" },
  Processing: { dot: "bg-blue-400", badge: "outline" },
  Sent: { dot: "bg-emerald-500", badge: "default" },
  Failed: { dot: "bg-destructive/60", badge: "destructive" },
  Cancelled: { dot: "bg-muted-foreground/50", badge: "secondary" },
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? t("common.copied") : label}</TooltipContent>
    </Tooltip>
  );
}

function RelativeTime({ date, warn }: { date: string; warn?: boolean }) {
  const dateLocale = useDateLocale();
  const d = new Date(date);
  const past = isPast(d);
  const text = formatDistanceToNow(d, { addSuffix: true, locale: dateLocale });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "text-xs",
            warn && past ? "text-destructive/70" : "text-muted-foreground",
          )}
        >
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent>{d.toLocaleString()}</TooltipContent>
    </Tooltip>
  );
}

export function WebhookTable({ webhooks, onSelect }: WebhookTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[110px]">{t("webhooks.table.status")}</TableHead>
          <TableHead>{t("webhooks.table.id")}</TableHead>
          <TableHead>{t("webhooks.table.invoice")}</TableHead>
          <TableHead>{t("webhooks.table.event")}</TableHead>
          <TableHead>{t("webhooks.table.url")}</TableHead>
          <TableHead>{t("webhooks.table.attempts")}</TableHead>
          <TableHead>{t("webhooks.table.nextRetry")}</TableHead>
          <TableHead>{t("webhooks.table.created")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {webhooks.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="py-16 text-center text-sm text-muted-foreground"
            >
              {t("webhooks.noWebhooksFound")}
            </TableCell>
          </TableRow>
        ) : (
          webhooks.map((wh) => {
            const cfg = statusConfig[wh.status] ?? statusConfig.Pending;
            const isRetrying =
              wh.status === "Pending" || wh.status === "Processing";

            return (
              <TableRow
                key={wh.id}
                className="cursor-pointer"
                onClick={() => onSelect(wh.id)}
              >
                <TableCell>
                  <Badge variant={cfg.badge} className="gap-1.5">
                    <span
                      className={cn(
                        "inline-block size-1.5 rounded-full",
                        cfg.dot,
                      )}
                    />
                    {t("status." + wh.status)}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-mono text-xs text-muted-foreground">
                        {wh.id.slice(0, 8)}...
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs break-all font-mono text-xs">
                      {wh.id}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>

                <TableCell>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-xs text-muted-foreground">
                          {wh.invoice_id.slice(0, 8)}...
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs break-all font-mono text-xs">
                        {wh.invoice_id}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() =>
                            navigate(`/invoices?id=${wh.invoice_id}`)
                          }
                        >
                          <FileText className="size-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("webhooks.openInvoice")}</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {t("webhooks.event." + wh.payload.event_type) ??
                      wh.payload.event_type}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                          {wh.url}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm break-all text-xs">
                        {wh.url}
                      </TooltipContent>
                    </Tooltip>
                    <CopyButton value={wh.url} label={t("webhooks.copyUrl")} />
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm tabular-nums">
                    {wh.attempts}{" "}
                    <span className="text-muted-foreground">
                      / {wh.max_retries}
                    </span>
                  </span>
                </TableCell>

                <TableCell>
                  {isRetrying ? (
                    <RelativeTime date={wh.next_retry} warn />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell>
                  <RelativeTime date={wh.created_at} />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
