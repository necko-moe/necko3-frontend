import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
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
      <TooltipContent>{copied ? "Copied!" : "Click to copy"}</TooltipContent>
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
  const d = new Date(date);
  const relative = formatDistanceToNow(d, { addSuffix: true });
  const exact = format(d, "PPpp");

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
        toast.error(res.message ?? "Failed to cancel payment");
        return;
      }
      setCancelOpen(false);
      onCancelled();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
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
          <h2 className="font-heading text-xl font-semibold">Payment</h2>
          <Badge variant={cfg.badge} className="gap-1.5">
            <span
              className={cn("inline-block size-1.5 rounded-full", cfg.dot)}
            />
            {payment.status}
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
          View Invoice
        </Button>
        {payment.status === "Confirming" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="size-3.5" />
            Cancel Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-1 pt-4">
            <InfoRow icon={Hash} label="Payment ID">
              <CopyField value={payment.id} mono />
            </InfoRow>

            <InfoRow icon={FileText} label="Invoice ID">
              <CopyField value={payment.invoice_id} mono />
            </InfoRow>

            <Separator />

            <InfoRow icon={Wallet} label="From">
              <CopyField value={payment.from} mono />
            </InfoRow>

            <InfoRow icon={Wallet} label="To">
              <CopyField value={payment.to} mono />
            </InfoRow>

            <Separator />

            <InfoRow icon={Globe} label="Network">
              {payment.network}
            </InfoRow>

            <InfoRow icon={Coins} label="Token">
              {payment.token}
            </InfoRow>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-1 pt-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Transaction
              </h3>

              <InfoRow icon={ArrowRightLeft} label="Tx Hash">
                <CopyField value={payment.tx_hash} mono />
              </InfoRow>

              <InfoRow icon={Layers} label="Block Number">
                {payment.block_number.toLocaleString()}
              </InfoRow>

              <InfoRow icon={List} label="Log Index">
                {payment.log_index}
              </InfoRow>

              <Separator />

              <InfoRow icon={Clock} label="Created">
                <TimeField date={payment.created_at} />
              </InfoRow>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Raw Values
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
        title="Cancel this payment?"
        description="This will permanently cancel the payment. This action cannot be undone."
        onConfirm={handleCancel}
        loading={cancelling}
      />
    </div>
  );
}
