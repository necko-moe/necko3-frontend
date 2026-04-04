import { useState } from "react";
import { useNavigate } from "react-router";
import { formatDistanceToNow, isPast } from "date-fns";
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

const PAYMENT_URL = (import.meta.env.VITE_PAYMENT_URL as string) ?? "";

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
      <TooltipContent>{copied ? "Copied!" : label}</TooltipContent>
    </Tooltip>
  );
}

function RelativeTime({ date, expired }: { date: string; expired?: boolean }) {
  const d = new Date(date);
  const past = isPast(d);
  const text = formatDistanceToNow(d, { addSuffix: true });

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
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Network</TableHead>
          <TableHead>Paid</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="py-16 text-center text-sm text-muted-foreground"
            >
              No invoices found.
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
                    {inv.status}
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
                      label="Copy payment link"
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
                      <TooltipContent>View payments</TooltipContent>
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
                      <TooltipContent>View webhooks</TooltipContent>
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
                      <TooltipContent>Open payment page</TooltipContent>
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
