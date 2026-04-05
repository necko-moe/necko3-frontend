import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, isPast } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import type { InvoiceSchema } from "@/types/invoice";
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
import {
  Copy,
  Check,
  ExternalLink,
  Webhook,
  CreditCard,
} from "lucide-react";
import { getConfig } from "@/lib/config";

const PAYMENT_URL = getConfig().PAYMENT_URL;

interface InvoiceTableProps {
  invoices: InvoiceSchema[];
  onSelect: (id: string) => void;
}

const statusConfig: Record<
  string,
  { dot: string; badge: "default" | "secondary" | "destructive" | "outline" }
> = {
  Pending: { dot: "bg-amber-400", badge: "outline" },
  Paid: { dot: "bg-emerald-500", badge: "default" },
  Expired: { dot: "bg-muted-foreground/50", badge: "secondary" },
  Cancelled: { dot: "bg-destructive/60", badge: "destructive" },
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

function RelativeTime({ date, expired }: { date: string; expired?: boolean }) {
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
            expired && past && "text-destructive/70",
            expired && !past && "text-muted-foreground",
            !expired && "text-muted-foreground",
          )}
        >
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent>{d.toLocaleString()}</TooltipContent>
    </Tooltip>
  );
}

export function InvoiceTable({ invoices, onSelect }: InvoiceTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">{t("invoices.table.status")}</TableHead>
          <TableHead>{t("invoices.table.id")}</TableHead>
          <TableHead>{t("invoices.table.amount")}</TableHead>
          <TableHead>{t("invoices.table.network")}</TableHead>
          <TableHead>{t("invoices.table.paid")}</TableHead>
          <TableHead>{t("invoices.table.created")}</TableHead>
          <TableHead>{t("invoices.table.expires")}</TableHead>
          <TableHead className="text-right">{t("invoices.table.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="py-16 text-center text-sm text-muted-foreground"
            >
              {t("invoices.noInvoicesFound")}
            </TableCell>
          </TableRow>
        ) : (
          invoices.map((inv) => {
            const cfg = statusConfig[inv.status] ?? statusConfig.Pending;

            return (
              <TableRow
                key={inv.id}
                className="cursor-pointer"
                onClick={() => onSelect(inv.id)}
              >
                <TableCell>
                  <Badge variant={cfg.badge} className="gap-1.5">
                    <span
                      className={cn("inline-block size-1.5 rounded-full", cfg.dot)}
                    />
                    {t("status." + inv.status)}
                  </Badge>
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground">
                  {inv.id.slice(0, 8)}...
                </TableCell>

                <TableCell className="font-medium">
                  {inv.amount} {inv.token}
                </TableCell>

                <TableCell className="text-sm">{inv.network}</TableCell>

                <TableCell className="font-medium">
                  {inv.paid} {inv.token}
                </TableCell>

                <TableCell>
                  <RelativeTime date={inv.created_at} />
                </TableCell>

                <TableCell>
                  <RelativeTime date={inv.expires_at} expired />
                </TableCell>

                <TableCell>
                  <div
                    className="flex items-center justify-end gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CopyButton
                      value={`${PAYMENT_URL}/${inv.id}`}
                      label={t("invoices.table.copyPaymentLink")}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            navigate(`/payments?invoice_id=${inv.id}`)
                          }
                        >
                          <CreditCard className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("invoices.table.viewPayments")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            navigate(`/webhooks?invoice_id=${inv.id}`)
                          }
                        >
                          <Webhook className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("invoices.table.viewWebhooks")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            window.open(
                              `${PAYMENT_URL}/${inv.id}`,
                              "_blank",
                            )
                          }
                        >
                          <ExternalLink className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("invoices.table.openPaymentPage")}</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
