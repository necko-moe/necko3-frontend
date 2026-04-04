import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ChainConfigSchema, TokenConfigSchema } from "@/types/chain";
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
  const { apiKey } = useAuth();

  const [chains, setChains] = useState<ChainConfigSchema[]>([]);
  const [chainsLoading, setChainsLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenConfigSchema[]>([]);
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

  const fetchChains = useCallback(async () => {
    if (!apiKey) return;
    setChainsLoading(true);
    const res = await apiFetchSilent<ChainConfigSchema[]>("/chain", apiKey);
    if (res?.status === "success" && res.data) {
      setChains(res.data.filter((c) => c.active));
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
    apiFetchSilent<TokenConfigSchema[]>(
      `/chain/${encodeURIComponent(network)}/token`,
      apiKey,
    ).then((res) => {
      if (res?.status === "success" && res.data) {
        setTokens(res.data);
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
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey || !network || !token || !amount) return;

    const body: CreateInvoiceReq = {
      amount,
      token,
      network,
    };

    const mins = parseFloat(expireMinutes);
    if (mins > 0) body.expire_after = Math.round(mins * 60);

    const url = webhookUrl.trim();
    if (url) {
      body.webhook_url = url;
      const secret = webhookSecret.trim();
      if (secret) body.webhook_secret = secret;
      const retries = parseInt(webhookMaxRetries);
      if (retries >= 0) body.webhook_max_retries = retries;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<unknown>("/invoice", apiKey, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.status === "error") {
        toast.error(res.message ?? "Failed to create invoice");
        return;
      }
      handleClose(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Create a new payment invoice. It cannot be edited after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Network *</Label>
            {chainsLoading ? (
              <div className="flex h-8 items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading chains...
              </div>
            ) : chains.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                No active networks. Add a chain in Chains first.
              </p>
            ) : (
              <Select
                value={network || undefined}
                onValueChange={setNetwork}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select network" />
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
            <Label>Token *</Label>
            {tokensLoading ? (
              <div className="flex h-8 items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading tokens...
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
                      network ? "Select token" : "Select network first"
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[100]">
                  {tokens.map((t) => (
                    <SelectItem key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Amount *</Label>
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
            <Label>Expire After (minutes)</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={expireMinutes}
              onChange={(e) => setExpireMinutes(e.target.value)}
              placeholder="15"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for the server default.
            </p>
          </div>

          <Separator />

          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setWebhookOpen((v) => !v)}
          >
            Webhook Settings (optional)
            {webhookOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>

          {webhookOpen && (
            <div className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="space-y-1.5">
                <Label>Webhook URL</Label>
                <Input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://merchant.website/payment"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Webhook Secret</Label>
                <Input
                  type="text"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="my-secret-string"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Max Retries</Label>
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !network || !token || !amount}
            >
              {submitting ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
