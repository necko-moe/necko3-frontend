import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type {
  ChainDataSchema,
  PartialChainUpdateSchema,
  TokenConfigSchema,
  TokenDataSchema,
} from "@/types/chain";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Trash2, FileText, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { ChainInfoFields } from "./chain-info-fields";
import { TokenList } from "./token-list";
import { AddTokenDialog } from "./add-token-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { CopyField } from "@/components/shared/detail-primitives";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ADDR_PAGE_SIZE = 8;

interface ChainDetailProps {
  chain: ChainDataSchema;
  onBack: () => void;
  onChainDeleted: () => void;
  onChainUpdated: (updated: ChainDataSchema) => void;
}

export function ChainDetail({
  chain,
  onBack,
  onChainDeleted,
  onChainUpdated,
}: ChainDetailProps) {
  const navigate = useNavigate();
  const { apiKey } = useAuth();
  const { t } = useTranslation();

  const [draft, setDraft] = useState<PartialChainUpdateSchema>({});
  const [tokens, setTokens] = useState<TokenDataSchema[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addTokenOpen, setAddTokenOpen] = useState(false);
  const [addingToken, setAddingToken] = useState(false);
  const [deletingToken, setDeletingToken] = useState<string | null>(null);
  const [addrPage, setAddrPage] = useState(1);

  const activeValue = draft.active !== undefined ? draft.active! : chain.active;

  const watchAddresses = chain.watch_addresses ?? [];
  const addrTotalPages = Math.max(1, Math.ceil(watchAddresses.length / ADDR_PAGE_SIZE));
  const addrSafePage = Math.min(addrPage, addrTotalPages);
  const addrPageItems = watchAddresses.slice(
    (addrSafePage - 1) * ADDR_PAGE_SIZE,
    addrSafePage * ADDR_PAGE_SIZE,
  );

  const fetchTokens = useCallback(async () => {
    if (!apiKey) return;
    setTokensLoading(true);
    try {
      const res = await apiFetch<{ items: TokenDataSchema[] }>(
        `/v1/chains/${encodeURIComponent(chain.name)}/tokens`,
        apiKey,
      );
      if (res.status === "error") {
        toast.error(res.message ?? t("chains.failedToLoadTokens"));
      } else if (res.data) {
        setTokens(res.data.items || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
    } finally {
      setTokensLoading(false);
    }
  }, [apiKey, chain.name, t]);

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
    draft.xpub !== undefined ||
    draft.safe_lag !== undefined;

  async function handleSave() {
    if (!apiKey || !isDirty) return;
    setSaving(true);
    try {
      const res = await apiFetch<never>(
        `/v1/chains/${encodeURIComponent(chain.name)}`,
        apiKey,
        { method: "PATCH", body: JSON.stringify(draft) },
      );
      if (res.status === "error") {
        toast.error(res.message ?? t("chains.failedToSave"));
        return;
      }
      const merged: ChainDataSchema = {
        ...chain,
        active: draft.active !== undefined ? draft.active ?? chain.active : chain.active,
        block_lag: draft.block_lag !== undefined ? draft.block_lag ?? chain.block_lag : chain.block_lag,
        last_processed_block: draft.last_processed_block !== undefined ? draft.last_processed_block ?? chain.last_processed_block : chain.last_processed_block,
        logo_url: draft.logo_url !== undefined ? draft.logo_url : chain.logo_url,
        required_confirmations: draft.required_confirmations !== undefined ? draft.required_confirmations ?? chain.required_confirmations : chain.required_confirmations,
        rpc_urls: draft.rpc_urls !== undefined ? draft.rpc_urls ?? chain.rpc_urls : chain.rpc_urls,
        xpub: draft.xpub !== undefined ? draft.xpub ?? chain.xpub : chain.xpub,
        safe_lag: draft.safe_lag !== undefined ? draft.safe_lag ?? chain.safe_lag : chain.safe_lag,
      };
      onChainUpdated(merged);
      setDraft({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
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
        `/v1/chains/${encodeURIComponent(chain.name)}`,
        apiKey,
        { method: "DELETE" },
      );
      if (res.status === "error") {
        toast.error(res.message ?? t("chains.failedToDelete"));
        return;
      }
      setDeleteOpen(false);
      onChainDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddToken(token: TokenConfigSchema) {
    if (!apiKey) return;
    setAddingToken(true);
    try {
      const res = await apiFetch<never>(
        `/v1/chains/${encodeURIComponent(chain.name)}/tokens`,
        apiKey,
        { method: "POST", body: JSON.stringify(token) },
      );
      if (res.status === "error") {
        toast.error(res.message ?? t("chains.failedToAddToken"));
        return;
      }
      setAddTokenOpen(false);
      fetchTokens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
    } finally {
      setAddingToken(false);
    }
  }

  async function handleDeleteToken(symbol: string): Promise<boolean> {
    if (!apiKey) return false;
    setDeletingToken(symbol);
    try {
      const res = await apiFetch<never>(
        `/v1/chains/${encodeURIComponent(chain.name)}/tokens/${encodeURIComponent(symbol)}`,
        apiKey,
        { method: "DELETE" },
      );
      if (res.status === "error") {
        toast.error(res.message ?? t("chains.failedToDeleteToken"));
        return false;
      }
      setTokens((prev) => prev.filter((tk) => tk.symbol !== symbol));
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
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
                {activeValue ? t("common.active") : t("common.inactive")}
              </Label>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              {t("chains.deleteChain")}
            </Button>
          </div>

          <Separator />

          <ChainInfoFields chain={chain} draft={draft} onChange={setDraft} />

          <Separator />

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!isDirty || saving}>
              {saving ? t("common.saving") : t("common.saveChanges")}
            </Button>
            <Button variant="outline" onClick={handleRevert} disabled={!isDirty}>
              {t("common.revert")}
            </Button>
          </div>
        </div>

        {/* Right panel -- tokens and watch addresses */}
        <div className="min-w-0 space-y-8">
          {/* Tokens section */}
          <div className="min-w-0">
            <h3 className="mb-4 font-heading text-base font-medium">{t("chains.tokens")}</h3>
            {tokensLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("chains.loadingTokens")}
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

          <Separator />

          {/* Watch Addresses section */}
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-base font-medium">{t("chains.watchAddresses")}</h3>
              {watchAddresses.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {watchAddresses.length}
                </span>
              )}
            </div>

            {watchAddresses.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("chains.watchAddressList.emptyState")}
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  {addrPageItems.map((address) => (
                    <div
                      key={address}
                      className="group/row flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="truncate text-xs font-mono text-muted-foreground flex-1">
                        <CopyField value={address} mono />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => navigate(`/invoices?address=${encodeURIComponent(address)}`)}
                            >
                              <FileText className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("chains.watchAddressList.viewInvoices")}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => navigate(`/payments?to=${encodeURIComponent(address)}`)}
                            >
                              <CreditCard className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("chains.watchAddressList.viewPayments")}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>

                {addrTotalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("common.pageOf", { page: addrSafePage, totalPages: addrTotalPages })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={addrSafePage <= 1}
                        onClick={() => setAddrPage((p) => p - 1)}
                      >
                        <ChevronLeft className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={addrSafePage >= addrTotalPages}
                        onClick={() => setAddrPage((p) => p + 1)}
                      >
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("chains.deleteChainTitle", { name: chain.name })}
        description={t("chains.deleteChainDesc")}
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
