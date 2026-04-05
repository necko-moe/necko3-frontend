import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { enUS } from "date-fns/locale";
import QRCodeStyling from "qr-code-styling";
import { domToPng } from "modern-screenshot";
import { toast } from "sonner";
import i18n from "@/i18n";
import { supportedLngs, type SupportedLng } from "@/i18n";
import { dateLocaleMap } from "@/lib/date-locale";
import { buildExportCard } from "./build-export-card";
import type { InvoiceSchema } from "@/types/invoice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sun, Moon, Download, Loader2, AlertCircle } from "lucide-react";

const PAYMENT_URL = (import.meta.env.VITE_PAYMENT_URL as string) ?? "";

const QR_LIGHT_DOTS = "#2a526a";
const QR_LIGHT_BG = "#faf0e7";
const QR_DARK_DOTS = "#9acad6";
const QR_DARK_BG = "#1e1a16";

const langFlags: Record<SupportedLng, string> = {
  en: "\u{1F1EC}\u{1F1E7}",
  ru: "\u{1F1F7}\u{1F1FA}",
  uk: "\u{1F1FA}\u{1F1E6}",
  zh: "\u{1F1E8}\u{1F1F3}",
};

interface InvoiceExportDialogProps {
  invoice: Pick<
    InvoiceSchema,
    "id" | "amount" | "token" | "network" | "address" | "created_at" | "expires_at"
  >;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function generateQrDataUrl(
  data: string,
  dots: string,
  bg: string,
): Promise<string> {
  const qr = new QRCodeStyling({
    width: 280,
    height: 280,
    data,
    type: "svg",
    dotsOptions: { color: dots, type: "rounded" },
    backgroundOptions: { color: bg },
    cornersSquareOptions: { type: "extra-rounded", color: dots },
    cornersDotOptions: { type: "dot", color: dots },
    qrOptions: { errorCorrectionLevel: "M" },
  });

  const tmp = document.createElement("div");
  tmp.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.appendChild(tmp);
  qr.append(tmp);
  await new Promise((r) => requestAnimationFrame(r));

  const svg = tmp.querySelector("svg");
  if (svg) {
    svg.setAttribute("width", "280");
    svg.setAttribute("height", "280");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.style.display = "block";
  }
  const markup = tmp.innerHTML;
  document.body.removeChild(tmp);

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(markup)))}`;
}

async function renderCard(
  invoice: InvoiceExportDialogProps["invoice"],
  paymentLink: string,
  theme: "light" | "dark",
  lang: SupportedLng,
  pixelRatio: number,
): Promise<string> {
  const isDark = theme === "dark";
  const dots = isDark ? QR_DARK_DOTS : QR_LIGHT_DOTS;
  const bg = isDark ? QR_DARK_BG : QR_LIGHT_BG;

  const qrImageUrl = await generateQrDataUrl(paymentLink, dots, bg);

  const et = i18n.getFixedT(lang);
  const dateLoc = dateLocaleMap[lang] ?? enUS;
  const createdDate = new Date(invoice.created_at);
  const expiresDate = new Date(invoice.expires_at);

  const card = buildExportCard({
    theme,
    qrImageUrl,
    amount: invoice.amount,
    token: invoice.token,
    network: invoice.network,
    invoiceId: invoice.id,
    address: invoice.address,
    createdFormatted: format(createdDate, "dd MMM yyyy, HH:mm", { locale: dateLoc }),
    expiresFormatted: format(expiresDate, "dd MMM yyyy, HH:mm", { locale: dateLoc }),
    expiresRelative: isPast(expiresDate)
      ? null
      : `(${formatDistanceToNow(expiresDate, { addSuffix: true, locale: dateLoc })})`,
    paymentLink,
    labels: {
      scanToPay: et("invoices.share.scanToPay"),
      invoice: et("invoices.share.invoiceLabel"),
      address: et("invoices.share.addressLabel"),
      created: et("invoices.share.createdLabel"),
      expires: et("invoices.share.expiresLabel"),
    },
  });

  const offscreen = document.createElement("div");
  offscreen.style.cssText = "position:fixed;left:-9999px;top:0;overflow:visible";
  offscreen.appendChild(card);
  document.body.appendChild(offscreen);

  await document.fonts.ready;

  const qrImg = card.querySelector("img");
  if (qrImg && !qrImg.complete) {
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => reject(new Error("QR image failed to load"));
    });
  }

  await new Promise((r) => requestAnimationFrame(r));

  try {
    const dataUrl = await domToPng(card, { scale: pixelRatio });
    return dataUrl;
  } finally {
    document.body.removeChild(offscreen);
  }
}

export function InvoiceExportDialog({
  invoice,
  open,
  onOpenChange,
}: InvoiceExportDialogProps) {
  const { t } = useTranslation();

  const [exportTheme, setExportTheme] = useState<"light" | "dark">("light");
  const [exportLang, setExportLang] = useState<SupportedLng>(
    (i18n.language as SupportedLng) || "en",
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [exporting, setExporting] = useState(false);

  const paymentLink = `${PAYMENT_URL}/${invoice.id}`;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreviewUrl(null);
    setPreviewError(false);

    renderCard(invoice, paymentLink, exportTheme, exportLang, 2).then(
      (url) => { if (!cancelled) setPreviewUrl(url); },
      () => { if (!cancelled) setPreviewError(true); },
    );

    return () => { cancelled = true; };
  }, [open, exportTheme, exportLang, invoice, paymentLink]);

  const handleDownload = useCallback(async () => {
    setExporting(true);
    try {
      const url = await renderCard(invoice, paymentLink, exportTheme, exportLang, 3);
      const a = document.createElement("a");
      a.download = `invoice-${invoice.id.slice(0, 8)}.png`;
      a.href = url;
      a.click();
    } catch {
      toast.error(t("invoices.share.exportError"));
    } finally {
      setExporting(false);
    }
  }, [invoice, paymentLink, exportTheme, exportLang, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("invoices.share.exportTitle")}</DialogTitle>
          <DialogDescription>
            {t("invoices.share.exportDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                exportTheme === "light"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setExportTheme("light")}
            >
              <Sun className="size-3.5" />
              {t("invoices.share.themeLight")}
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                exportTheme === "dark"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setExportTheme("dark")}
            >
              <Moon className="size-3.5" />
              {t("invoices.share.themeDark")}
            </button>
          </div>

          <Select
            value={exportLang}
            onValueChange={(v) => setExportLang(v as SupportedLng)}
          >
            <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLngs.map((lng) => (
                <SelectItem key={lng} value={lng} className="text-xs">
                  <span className="mr-1.5">{langFlags[lng]}</span>
                  {t("languages." + lng)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="block w-full" />
          ) : previewError ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
              <AlertCircle className="size-5" />
              <p className="text-xs">{t("invoices.share.exportError")}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            className="w-full gap-2"
            onClick={handleDownload}
            disabled={exporting || !previewUrl}
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {t("invoices.share.exportDownload")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
