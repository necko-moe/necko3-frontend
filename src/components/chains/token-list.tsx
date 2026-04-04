import { useMemo, useState } from "react";
import type { TokenConfigSchema } from "@/types/chain";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowDownAZ,
  ArrowUpZA,
  Copy,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";

interface TokenListProps {
  tokens: TokenConfigSchema[];
  onAddToken: () => void;
  onDeleteToken: (symbol: string) => Promise<boolean>;
  deletingToken: string | null;
}

function CopyCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 truncate text-left transition-colors hover:text-primary"
        >
          <span className="truncate">{value}</span>
          {copied ? (
            <Check className="size-3 shrink-0 text-green-600" />
          ) : (
            <Copy className="size-3 shrink-0 opacity-0 group-hover/row:opacity-50" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : "Click to copy"}</TooltipContent>
    </Tooltip>
  );
}

export function TokenList({
  tokens,
  onAddToken,
  onDeleteToken,
  deletingToken,
}: TokenListProps) {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.contract.toLowerCase().includes(q),
    );
    list.sort((a, b) =>
      sortAsc
        ? a.symbol.localeCompare(b.symbol)
        : b.symbol.localeCompare(a.symbol),
    );
    return list;
  }, [tokens, search, sortAsc]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search tokens..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortAsc((v) => !v)}
        >
          {sortAsc ? <ArrowDownAZ className="size-4" /> : <ArrowUpZA className="size-4" />}
        </Button>
        <Button variant="default" size="sm" onClick={onAddToken}>
          <Plus className="size-4" />
          Add Token
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {tokens.length === 0 ? "No tokens configured yet." : "No tokens match your search."}
        </p>
      ) : (
        <div className="space-y-1">
          {filtered.map((token) => (
            <div
              key={token.symbol}
              className="group/row flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
            >
              {token.logo_url ? (
                <img
                  src={token.logo_url}
                  alt={token.symbol}
                  className="size-8 rounded-full object-contain"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {token.symbol.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1 grid grid-cols-[1fr_1.5fr_auto] items-center gap-3">
                <div className="font-medium text-sm">
                  <CopyCell value={token.symbol} />
                </div>
                <div className="truncate text-xs text-muted-foreground font-mono">
                  <CopyCell value={token.contract} />
                </div>
                <div className="text-xs text-muted-foreground">
                  <CopyCell value={String(token.decimals)} />
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 text-destructive/60 hover:text-destructive"
                    onClick={() => setDeleteTarget(token.symbol)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete token</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Delete token ${deleteTarget}?`}
        description={`This will permanently remove the token "${deleteTarget}" from this chain. This action cannot be undone.`}
        loading={deletingToken === deleteTarget}
        onConfirm={() => {
          const symbol = deleteTarget;
          if (!symbol) return;
          void (async () => {
            const ok = await onDeleteToken(symbol);
            if (ok) setDeleteTarget(null);
          })();
        }}
      />
    </div>
  );
}
