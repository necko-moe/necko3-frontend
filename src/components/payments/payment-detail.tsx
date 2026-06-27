import { useTranslation } from "react-i18next";
import type { PaymentSchema } from "@/types/payment";
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
  Globe,
  Coins,
  ArrowRightLeft,
  Wallet,
  Layers,
  List,
} from "lucide-react";

interface PaymentDetailProps {
  payment: PaymentSchema;
  onBack: () => void;
}

const statusConfig: Record<
  string,
  { badge: "default" | "secondary" | "destructive" | "outline"; dot: string }
> = {
  Pending: { dot: "bg-zinc-400 dark:bg-zinc-500", badge: "secondary" },
  Confirming: { dot: "bg-amber-400", badge: "outline" },
  Confirmed: { dot: "bg-emerald-500", badge: "default" },
  Lost: { dot: "bg-rose-400 dark:bg-rose-500", badge: "outline" },
  Failed: { dot: "bg-destructive", badge: "destructive" },
};

export function PaymentDetail({
  payment,
  onBack,
}: PaymentDetailProps) {
  const { t } = useTranslation();

  const cfg = statusConfig[payment.status] ?? statusConfig.Confirming;

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-1 pt-4">
            <InfoRow icon={Hash} label={t("payments.detail.paymentId")}>
              <CopyField value={payment.id} mono />
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

              <InfoRow icon={Hash} label={t("payments.detail.blockHash")}>
                <CopyField value={payment.block_hash} mono />
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
    </div>
  );
}
