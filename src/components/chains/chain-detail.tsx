import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  ChainConfigSchema,
  PartialChainUpdateSchema,
  TokenConfigSchema,
} from "@/types/chain";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Trash2 } from "lucide-react";
import { ChainInfoFields } from "./chain-info-fields";
import { TokenList } from "./token-list";
import { AddTokenDialog } from "./add-token-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";

interface ChainDetailProps {
  chain: ChainConfigSchema;
  onBack: () => void;
  onChainDeleted: () => void;
  onChainUpdated: (updated: ChainConfigSchema) => void;
}

export function ChainDetail({
  chain,
  onBack,
  onChainDeleted,
  onChainUpdated,
}: ChainDetailProps) {
  const { apiKey } = useAuth();

  const [draft, setDraft] = useState<PartialChainUpdateSchema>({});
  const [tokens, setTokens] = useState<TokenConfigSchema[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addTokenOpen, setAddTokenOpen] = useState(false);
  const [addingToken, setAddingToken] = useState(false);
  const [deletingToken, setDeletingToken] = useState<string | null>(null);

  const activeValue = draft.active !== undefined ? draft.active! : chain.active;

  const fetchTokens = useCallback(async () => {
    if (!apiKey) return;
    setTokensLoading(true);
    try {
      const res = await apiFetch<TokenConfigSchema[]>(
        `/chain/${encodeURIComponent(chain.name)}/token`,
        apiKey,
      );
      if (res.status === "error") {
        toast.error(res.message ?? "Failed to load tokens");
      } else if (res.data) {
        setTokens(res.data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setTokensLoading(false);
    }
  }, [apiKey, chain.name]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const isDirty =
    draft.active !== undefined ||
    draft.block_lag !== undefined ||
    draft.last_processed_block !== undefined ||
    draft.logo_url !== undefined ||
    draft.required_confirmations !== undefined ||
    draft.rpc_urls !== undefined ||
    draft.xpub !== undefined;

  async function handleSave() {
    if (!apiKey || !isDirty) return;
    setSaving(true);
    try {
      const res = await apiFetch<never>(
        `/chain/${encodeURIComponent(chain.name)}`,
        apiKey,
        { method: "PATCH", body: JSON.stringify(draft) },
      );
      if (res.status === "error") {
        toast.error(res.message ?? "Failed to save changes");
        return;
      }
      const merged: ChainConfigSchema = {
        ...chain,
        active: draft.active ?? chain.active,
        block_lag: draft.block_lag ?? chain.block_lag,
        last_processed_block: draft.last_processed_block ?? chain.last_processed_block,
        logo_url: draft.logo_url !== undefined ? draft.logo_url : chain.logo_url,
        required_confirmations: draft.required_confirmations ?? chain.required_confirmations,
        rpc_urls: draft.rpc_urls ?? chain.rpc_urls,
        xpub: draft.xpub ?? chain.xpub,
      };
      onChainUpdated(merged);
      setDraft({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  function handleRevert() {
    setDraft({});
  }

  async function handleDeleteChain() {
    if (!apiKey) return;
    setDeleting(true);
    try {
      const res = await apiFetch<never>(
        `/chain/${encodeURIComponent(chain.name)}`,
        apiKey,
        { method: "DELETE" },
      );
      if (res.status === "error") {
        toast.error(res.message ?? "Failed to delete chain");
        return;
      }
      setDeleteOpen(false);
      onChainDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddToken(token: TokenConfigSchema) {
    if (!apiKey) return;
    setAddingToken(true);
    try {
      const res = await apiFetch<never>(
        `/chain/${encodeURIComponent(chain.name)}/token`,
        apiKey,
        { method: "POST", body: JSON.stringify(token) },
      );
      if (res.status === "error") {
        toast.error(res.message ?? "Failed to add token");
        return;
      }
      setAddTokenOpen(false);
      fetchTokens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setAddingToken(false);
    }
  }

  async function handleDeleteToken(symbol: string): Promise<boolean> {
    if (!apiKey) return false;
    setDeletingToken(symbol);
    try {
      const res = await apiFetch<never>(
        `/chain/${encodeURIComponent(chain.name)}/token/${encodeURIComponent(symbol)}`,
        apiKey,
        { method: "DELETE" },
      );
      if (res.status === "error") {
        toast.error(res.message ?? "Failed to delete token");
        return false;
      }
      setTokens((prev) => prev.filter((t) => t.symbol !== symbol));
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
      return false;
    } finally {
      setDeletingToken(null);
    }
  }

  function handleActiveToggle(checked: boolean) {
    setDraft((d) => ({ ...d, active: checked }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex flex-1 items-center justify-center gap-3">
          {chain.logo_url ? (
            <img
              src={chain.logo_url}
              alt={chain.name}
              className="size-8 rounded-lg object-contain"
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              {chain.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="font-heading text-xl font-semibold">{chain.name}</h2>
        </div>
        <div className="size-8" />
      </div>

      <Separator />

      {/* Split layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_3fr]">
        {/* Left panel -- chain config */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={activeValue}
                onCheckedChange={handleActiveToggle}
              />
              <Label className="text-sm">
                {activeValue ? "Active" : "Inactive"}
              </Label>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Delete Chain
            </Button>
          </div>

          <Separator />

          <ChainInfoFields chain={chain} draft={draft} onChange={setDraft} />

          <Separator />

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!isDirty || saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button variant="outline" onClick={handleRevert} disabled={!isDirty}>
              Revert
            </Button>
          </div>
        </div>

        {/* Right panel -- tokens */}
        <div className="min-w-0">
          <h3 className="mb-4 font-heading text-base font-medium">Tokens</h3>
          {tokensLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading tokens...
            </p>
          ) : (
            <TokenList
              tokens={tokens}
              onAddToken={() => setAddTokenOpen(true)}
              onDeleteToken={handleDeleteToken}
              deletingToken={deletingToken}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete chain "${chain.name}"?`}
        description="This will permanently remove this chain and all its tokens. This action cannot be undone."
        onConfirm={handleDeleteChain}
        loading={deleting}
      />

      <AddTokenDialog
        open={addTokenOpen}
        onOpenChange={setAddTokenOpen}
        chainName={chain.name}
        onSubmit={handleAddToken}
        loading={addingToken}
      />
    </div>
  );
}
