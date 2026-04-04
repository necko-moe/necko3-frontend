import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import type { PaymentSchema } from "@/types/payment";
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

interface PaymentTableProps {
  payments: PaymentSchema[];
  onSelect: (id: string) => void;
}

const statusConfig: Record<
  string,
  { dot: string; badge: "default" | "secondary" | "destructive" | "outline" }
> = {
  Confirming: { dot: "bg-amber-400", badge: "outline" },
  Confirmed: { dot: "bg-emerald-500", badge: "default" },
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

function RelativeTime({ date }: { date: string }) {
  const dateLocale = useDateLocale();
  const d = new Date(date);
  const text = formatDistanceToNow(d, { addSuffix: true, locale: dateLocale });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-xs text-muted-foreground">{text}</span>
      </TooltipTrigger>
      <TooltipContent>{d.toLocaleString()}</TooltipContent>
    </Tooltip>
  );
}

function TruncatedMono({
  value,
  len = 8,
}: {
  value: string;
  len?: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="font-mono text-xs text-muted-foreground">
          {value.slice(0, len)}...
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs break-all font-mono text-xs">
        {value}
      </TooltipContent>
    </Tooltip>
  );
}

export function PaymentTable({ payments, onSelect }: PaymentTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[110px]">{t("payments.table.status")}</TableHead>
          <TableHead>{t("payments.table.id")}</TableHead>
          <TableHead>{t("payments.table.invoice")}</TableHead>
          <TableHead>{t("payments.table.fromTo")}</TableHead>
          <TableHead>{t("payments.table.token")}</TableHead>
          <TableHead>{t("payments.table.network")}</TableHead>
          <TableHead>{t("payments.table.txHash")}</TableHead>
          <TableHead>{t("payments.table.block")}</TableHead>
          <TableHead>{t("payments.table.created")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="py-16 text-center text-sm text-muted-foreground"
            >
              {t("payments.noPaymentsFound")}
            </TableCell>
          </TableRow>
        ) : (
          payments.map((p) => {
            const cfg = statusConfig[p.status] ?? statusConfig.Confirming;

            return (
              <TableRow
                key={p.id}
                className="cursor-pointer"
                onClick={() => onSelect(p.id)}
              >
                <TableCell>
                  <Badge variant={cfg.badge} className="gap-1.5">
                    <span
                      className={cn(
                        "inline-block size-1.5 rounded-full",
                        cfg.dot,
                      )}
                    />
                    {t("status." + p.status)}
                  </Badge>
                </TableCell>

                <TableCell>
                  <TruncatedMono value={p.id} />
                </TableCell>

                <TableCell>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TruncatedMono value={p.invoice_id} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() =>
                            navigate(`/invoices?id=${p.invoice_id}`)
                          }
                        >
                          <FileText className="size-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("payments.table.openInvoice")}</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.from.slice(0, 6)}...{p.from.slice(-4)}
                      </span>
                      <CopyButton value={p.from} label={t("payments.table.copyFromAddress")} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.to.slice(0, 6)}...{p.to.slice(-4)}
                      </span>
                      <CopyButton value={p.to} label={t("payments.table.copyToAddress")} />
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-sm font-medium">{p.token}</TableCell>

                <TableCell className="text-sm">{p.network}</TableCell>

                <TableCell>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TruncatedMono value={p.tx_hash} len={10} />
                    <CopyButton value={p.tx_hash} label={t("payments.table.copyTxHash")} />
                  </div>
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.block_number.toLocaleString()}
                </TableCell>

                <TableCell>
                  <RelativeTime date={p.created_at} />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
