import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChainConfigSchema, ChainType } from "@/types/chain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Plus, X } from "lucide-react";

interface AddChainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (chain: ChainConfigSchema) => void;
  loading?: boolean;
}

const EMPTY: ChainConfigSchema = {
  name: "",
  active: true,
  rpc_urls: [""],
  chain_type: "EVM" as ChainType,
  xpub: "",
  native_symbol: "",
  decimals: 18,
  last_processed_block: 0,
  block_lag: 5,
  required_confirmations: 40,
  logo_url: null,
  safe_lag: 0,
  tokens: [],
};

function FieldLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground">
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-56">{tooltip}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function AddChainDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: AddChainDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ChainConfigSchema>({ ...EMPTY });

  function reset() {
    setForm({ ...EMPTY });
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleRpcChange(index: number, value: string) {
    const next = [...form.rpc_urls];
    next[index] = value;
    setForm({ ...form, rpc_urls: next });
  }

  function handleRpcAdd() {
    setForm({ ...form, rpc_urls: [...form.rpc_urls, ""] });
  }

  function handleRpcRemove(index: number) {
    const next = [...form.rpc_urls];
    next.splice(index, 1);
    setForm({ ...form, rpc_urls: next });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: ChainConfigSchema = {
      ...form,
      rpc_urls: form.rpc_urls.filter((u) => u.trim() !== ""),
      logo_url: form.logo_url?.trim() || null,
    };
    onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("chains.addDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("chains.addDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel
                label={t("chains.addDialog.name")}
                tooltip={t("chains.fields.nameTooltip")}
              />
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Polygon"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel
                label={t("chains.addDialog.chainType")}
                tooltip={t("chains.fields.chainTypeTooltip")}
              />
              <Input value={form.chain_type} disabled />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel
                label={t("chains.addDialog.nativeSymbol")}
                tooltip={t("chains.fields.nativeSymbolTooltip")}
              />
              <Input
                required
                value={form.native_symbol}
                onChange={(e) => setForm({ ...form, native_symbol: e.target.value })}
                placeholder="POL"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel
                label={t("chains.addDialog.decimals")}
                tooltip={t("chains.fields.decimalsTooltip")}
              />
              <Input
                required
                type="number"
                min={0}
                value={form.decimals}
                onChange={(e) => setForm({ ...form, decimals: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel
              label={t("chains.addDialog.xpub")}
              tooltip={t("chains.fields.xpubTooltip")}
            />
            <Input
              required
              value={form.xpub}
              onChange={(e) => setForm({ ...form, xpub: e.target.value })}
              placeholder="xpubabc123..."
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel
              label={t("chains.addDialog.rpcUrls")}
              tooltip={t("chains.fields.rpcUrlsTooltip")}
            />
            {form.rpc_urls.map((url, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Input
                  value={url}
                  onChange={(e) => handleRpcChange(i, e.target.value)}
                  placeholder="https://rpc-node..."
                  className="font-mono text-xs"
                />
                {form.rpc_urls.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleRpcRemove(i)}
                    className="shrink-0 text-destructive"
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleRpcAdd}
            >
              <Plus className="size-3" />
              {t("chains.addDialog.addUrl")}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel
                label={t("chains.addDialog.blockLag")}
                tooltip={t("chains.fields.blockLagTooltip")}
              />
              <Input
                type="number"
                min={0}
                value={form.block_lag}
                onChange={(e) => setForm({ ...form, block_lag: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel
                label={t("chains.addDialog.confirmations")}
                tooltip={t("chains.fields.requiredConfirmationsTooltip")}
              />
              <Input
                type="number"
                min={0}
                value={form.required_confirmations}
                onChange={(e) => setForm({ ...form, required_confirmations: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel
                label={t("chains.addDialog.startBlock")}
                tooltip={t("chains.fields.lastProcessedBlockTooltip")}
              />
              <Input
                type="number"
                min={0}
                value={form.last_processed_block}
                onChange={(e) => setForm({ ...form, last_processed_block: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel
                label={t("chains.addDialog.safeLag")}
                tooltip={t("chains.fields.safeLagTooltip")}
              />
              <Input
                type="number"
                min={0}
                value={form.safe_lag}
                onChange={(e) => setForm({ ...form, safe_lag: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel
              label={t("chains.addDialog.logoUrl")}
              tooltip={t("chains.fields.logoUrlTooltip")}
            />
            <Input
              value={form.logo_url ?? ""}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value || null })}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
            <Label>{t("chains.addDialog.active")}</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.adding") : t("chains.addChain")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
