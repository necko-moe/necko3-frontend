import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ChainConfigSchema } from "@/types/chain";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { ErrorBlock } from "@/components/error-block";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDownAZ, ArrowUpZA, Link2, Plus, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ChainCard } from "@/components/chains/chain-card";
import { ChainDetail } from "@/components/chains/chain-detail";
import { AddChainDialog } from "@/components/chains/add-chain-dialog";

export function ChainsPage() {
  const { apiKey } = useAuth();
  const { t } = useTranslation();

  const [chains, setChains] = useState<ChainConfigSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const everLoaded = useRef(false);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchChains = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const res = await apiFetch<ChainConfigSchema[]>("/chain", apiKey);
      if (res.status === "error") {
        const msg = res.message ?? t("chains.failedToLoad");
        if (everLoaded.current) {
          toast.error(msg);
        } else {
          setError(msg);
        }
      } else if (res.data) {
        setChains(res.data);
        setError(null);
        everLoaded.current = true;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : t("common.unexpectedError");
      if (everLoaded.current) {
        toast.error(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey, t]);

  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = chains.filter((c) => c.name.toLowerCase().includes(q));
    list.sort((a, b) =>
      sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );
    return list;
  }, [chains, search, sortAsc]);

  const selectedChain = useMemo(
    () => chains.find((c) => c.name === selectedName) ?? null,
    [chains, selectedName],
  );

  async function handleAddChain(chain: ChainConfigSchema) {
    if (!apiKey) return;
    setAdding(true);
    try {
      const res = await apiFetch<never>("/chain", apiKey, {
        method: "POST",
        body: JSON.stringify(chain),
      });
      if (res.status === "error") {
        toast.error(res.message ?? t("chains.failedToAdd"));
        return;
      }
      setAddOpen(false);
      fetchChains();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
    } finally {
      setAdding(false);
    }
  }

  function handleChainUpdated(updated: ChainConfigSchema) {
    setChains((prev) =>
      prev.map((c) => (c.name === updated.name ? updated : c)),
    );
  }

  function handleChainDeleted() {
    setSelectedName(null);
    fetchChains();
  }

  if (selectedChain) {
    return (
      <div className="mx-auto max-w-6xl">
        <ChainDetail
          chain={selectedChain}
          onBack={() => setSelectedName(null)}
          onChainDeleted={handleChainDeleted}
          onChainUpdated={handleChainUpdated}
        />
      </div>
    );
  }

  if (!loading && error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {t("chains.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("chains.subtitle")}
          </p>
        </header>
        <ErrorBlock message={error} onRetry={fetchChains} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("chains.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("chains.subtitle")}
        </p>
      </header>

      <div className="flex items-center gap-2">
        <Input
          placeholder={t("chains.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortAsc((v) => !v)}
        >
          {sortAsc ? <ArrowDownAZ className="size-4" /> : <ArrowUpZA className="size-4" />}
        </Button>
        <div className="flex-1" />
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          {t("chains.addChain")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Link2}
          title={chains.length === 0 ? t("chains.emptyTitle") : t("chains.noResults")}
          description={chains.length === 0 ? t("chains.emptyDescription") : undefined}
          action={chains.length === 0 ? { label: t("chains.addChain"), onClick: () => setAddOpen(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((chain) => (
            <ChainCard
              key={chain.name}
              chain={chain}
              onClick={() => setSelectedName(chain.name)}
            />
          ))}
        </div>
      )}

      <AddChainDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddChain}
        loading={adding}
      />
    </div>
  );
}
