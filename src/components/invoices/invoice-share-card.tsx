import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCodeStyling from "qr-code-styling";
import type { InvoiceSchema } from "@/types/invoice";
import { useTheme } from "@/hooks/use-theme";
import { InvoiceExportDialog } from "./invoice-export-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check, ExternalLink, Download } from "lucide-react";
import { getConfig } from "@/lib/config";

const PAYMENT_URL = getConfig().PAYMENT_URL;

interface InvoiceShareCardProps {
  invoice: Pick<InvoiceSchema, "id" | "amount" | "token" | "network" | "address" | "created_at" | "expires_at">;
  compact?: boolean;
}

const LIGHT_DOTS = "#2a526a";
const LIGHT_BG = "#faf0e7";
const DARK_DOTS = "#9acad6";
const DARK_BG = "#1e1a16";

function useQRCode(data: string, theme: "light" | "dark") {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    const isDark = theme === "dark";
    const qr = new QRCodeStyling({
      width: 200,
      height: 200,
      data,
      dotsOptions: {
        color: isDark ? DARK_DOTS : LIGHT_DOTS,
        type: "rounded",
      },
      backgroundOptions: {
        color: isDark ? DARK_BG : LIGHT_BG,
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: isDark ? DARK_DOTS : LIGHT_DOTS,
      },
      cornersDotOptions: {
        type: "dot",
        color: isDark ? DARK_DOTS : LIGHT_DOTS,
      },
      qrOptions: {
        errorCorrectionLevel: "M",
      },
    });

    qrInstance.current = qr;

    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qr.append(qrRef.current);
    }
  }, [data, theme]);

  return { qrRef, qrInstance };
}

export function InvoiceShareCard({ invoice, compact }: InvoiceShareCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const paymentLink = `${PAYMENT_URL}/${invoice.id}`;
  const { qrRef } = useQRCode(paymentLink, theme);

  const [linkCopied, setLinkCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(paymentLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }, [paymentLink]);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="bg-card">
          <CardContent className={compact ? "px-4 py-5" : "px-6 py-6"}>
            <div className="flex flex-col items-center gap-4 text-center">
              <div ref={qrRef} className="rounded-lg [&>canvas]:rounded-lg" />

              <div className="space-y-1">
                <p className="text-lg font-semibold tracking-tight">
                  {t("invoices.share.title", {
                    amount: invoice.amount,
                    token: invoice.token,
                    network: invoice.network,
                  })}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="mx-auto block max-w-[240px] truncate font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      {paymentLink}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {linkCopied ? t("common.copied") : t("common.clickToCopy")}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="flex border-t border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 rounded-none gap-2 text-xs h-10"
                onClick={handleCopyLink}
              >
                {linkCopied ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {t("invoices.share.copyLink")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("invoices.share.copyLink")}</TooltipContent>
          </Tooltip>

          <div className="w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 rounded-none gap-2 text-xs h-10"
                onClick={() => window.open(paymentLink, "_blank")}
              >
                <ExternalLink className="size-3.5" />
                {t("invoices.share.openInTab")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("invoices.share.openInTab")}</TooltipContent>
          </Tooltip>

          <div className="w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="flex-1 rounded-none gap-2 text-xs h-10"
                onClick={() => setExportOpen(true)}
              >
                <Download className="size-3.5" />
                {t("invoices.share.exportCard")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("invoices.share.exportCard")}</TooltipContent>
          </Tooltip>
        </div>
      </Card>

      <InvoiceExportDialog
        invoice={invoice}
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
    </>
  );
}
