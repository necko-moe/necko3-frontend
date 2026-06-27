import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ChainDataSchema, TokenDataSchema } from "@/types/chain";
import type { InvoiceSchema } from "@/types/invoice";
import type { CreateInvoiceReq } from "@/types/invoice";
import { useAuth } from "@/context/auth-context";
import { apiFetch, apiFetchSilent } from "@/lib/api";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { InvoiceShareCard } from "@/components/invoices/invoice-share-card";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateInvoiceDialogProps) {
  const { t } = useTranslation();
  const { apiKey } = useAuth();

  const [chains, setChains] = useState<ChainDataSchema[]>([]);
  const [chainsLoading, setChainsLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenDataSchema[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);

  const [network, setNetwork] = useState("");
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [expireMinutes, setExpireMinutes] = useState("");
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookMaxRetries, setWebhookMaxRetries] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<InvoiceSchema | null>(null);

  const selectedChain = chains.find((c) => c.name === network);
  const nativeSymbol = selectedChain?.native_symbol;

  const fetchChains = useCallback(async () => {
    if (!apiKey) return;
    setChainsLoading(true);
    const res = await apiFetchSilent<{ items: ChainDataSchema[] }>("/v1/chains", apiKey);
    if (res?.status === "success" && res.data) {
      setChains((res.data.items || []).filter((c) => c.active));
    }
    setChainsLoading(false);
  }, [apiKey]);

  useEffect(() => {
    if (open) fetchChains();
  }, [open, fetchChains]);

  useEffect(() => {
    if (!network || !apiKey) {
      setTokens([]);
      return;
    }
    setToken("");
    setTokensLoading(true);
    apiFetchSilent<{ items: TokenDataSchema[] }>(
      `/v1/chains/${encodeURIComponent(network)}/tokens`,
      apiKey,
    ).then((res) => {
      if (res?.status === "success" && res.data) {
        setTokens(res.data.items || []);
      } else {
        setTokens([]);
      }
      setTokensLoading(false);
    });
  }, [network, apiKey]);

  function reset() {
    setNetwork("");
    setToken("");
    setAmount("");
    setExpireMinutes("");
    setWebhookOpen(false);
    setWebhookUrl("");
    setWebhookSecret("");
    setWebhookMaxRetries("");
    setCreatedInvoice(null);
  }

  function handleClose(v: boolean) {
    if (!v) {
      if (createdInvoice) onCreated();
      reset();
    }
    onOpenChange(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey || !network || !token || !amount) return;

    const body: CreateInvoiceReq = {
      amount: parseFloat(amount),
      asset: token,
      network,
    };

    const mins = parseFloat(expireMinutes);
    if (mins > 0) body.duration = Math.round(mins * 60);

    const url = webhookUrl.trim();
    if (url) {
      body.webhook_config = {
        url,
        secret: webhookSecret.trim() || undefined,
        max_retries: parseInt(webhookMaxRetries) >= 0 ? parseInt(webhookMaxRetries) : undefined,
      };
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<InvoiceSchema>("/v1/invoices", apiKey, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.status === "error") {
        toast.error(res.message ?? t("invoices.create.failedToCreate"));
        return;
      }
      if (res.data) {
        setCreatedInvoice(res.data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (createdInvoice) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("invoices.share.created")}</DialogTitle>
            <DialogDescription>
              {t("invoices.share.createdDescription")}
            </DialogDescription>
          </DialogHeader>

          <InvoiceShareCard invoice={createdInvoice} compact />

          <DialogFooter>
            <Button className="w-full" onClick={() => handleClose(false)}>
              {t("invoices.share.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("invoices.create.title")}</DialogTitle>
          <DialogDescription>
            {t("invoices.create.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("invoices.create.network")}</Label>
            {chainsLoading ? (
              <div className="flex h-8 items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t("invoices.create.loadingChains")}
              </div>
            ) : chains.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {t("invoices.create.noActiveNetworks")}
              </p>
            ) : (
              <Select
                value={network || undefined}
                onValueChange={setNetwork}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("invoices.create.selectNetwork")} />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[100]">
                  {chains.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t("invoices.create.token")}</Label>
            {tokensLoading ? (
              <div className="flex h-8 items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t("invoices.create.loadingTokens")}
              </div>
            ) : (
              <Select
                value={token || undefined}
                onValueChange={setToken}
                disabled={!network}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      network ? t("invoices.create.selectToken") : t("invoices.create.selectNetworkFirst")
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[100]">
                {nativeSymbol && (
                  <SelectItem key={nativeSymbol} value={nativeSymbol}>
                    {nativeSymbol} (Native)
                  </SelectItem>
                )}
                {tokens.map((tk) => (
                  <SelectItem key={tk.symbol} value={tk.symbol}>
                    {tk.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t("invoices.create.amount")}</Label>
            <Input
              required
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="25.37"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("invoices.create.expireAfter")}</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={expireMinutes}
              onChange={(e) => setExpireMinutes(e.target.value)}
              placeholder="15"
            />
            <p className="text-xs text-muted-foreground">
              {t("invoices.create.leaveEmpty")}
            </p>
          </div>

          <Separator />

          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setWebhookOpen((v) => !v)}
          >
            {t("invoices.create.webhookSettings")}
            {webhookOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>

          {webhookOpen && (
            <div className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="space-y-1.5">
                <Label>{t("invoices.create.webhookUrl")}</Label>
                <Input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://merchant.website/payment"
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("invoices.create.webhookSecret")}</Label>
                <Input
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="my-secret-string"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("invoices.create.maxRetries")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={webhookMaxRetries}
                  onChange={(e) => setWebhookMaxRetries(e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submitting || !network || !token || !amount}
            >
              {submitting ? t("common.creating") : t("invoices.createInvoice")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
