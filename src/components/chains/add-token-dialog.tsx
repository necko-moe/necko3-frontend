import { useState } from "react";
import type { TokenConfigSchema } from "@/types/chain";
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

interface AddTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chainName: string;
  onSubmit: (token: TokenConfigSchema) => void;
  loading?: boolean;
}

const EMPTY: TokenConfigSchema = {
  symbol: "",
  contract: "",
  decimals: 6,
  logo_url: null,
};

export function AddTokenDialog({
  open,
  onOpenChange,
  chainName,
  onSubmit,
  loading,
}: AddTokenDialogProps) {
  const [form, setForm] = useState<TokenConfigSchema>({ ...EMPTY });

  function reset() {
    setForm({ ...EMPTY });
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      ...form,
      logo_url: form.logo_url?.trim() || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Token to {chainName}</DialogTitle>
          <DialogDescription>
            Add an ERC-20 token to track on this chain.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Symbol *</Label>
              <Input
                required
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                placeholder="USDC"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Decimals *</Label>
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
            <Label>Contract Address *</Label>
            <Input
              required
              value={form.contract}
              onChange={(e) => setForm({ ...form, contract: e.target.value })}
              placeholder="0xabc123..."
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Logo URL</Label>
            <Input
              value={form.logo_url ?? ""}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value || null })}
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Token"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
