import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ChainConfigSchema, TokenConfigSchema } from "@/types/chain";
import type { InvoiceSchema, InvoiceStatus, PaginatedResponse } from "@/types/invoice";
import { useAuth } from "@/context/auth-context";
import { apiFetch, apiFetchSilent } from "@/lib/api";
import { ErrorBlock } from "@/components/error-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog";
import { EmptyState } from "@/components/shared/empty-state";

const PAGE_SIZE = 20;
const STATUSES: InvoiceStatus[] = ["Pending", "Paid", "Expired", "Cancelled"];

export function InvoicesPage() {
  const { t } = useTranslation();
  const { apiKey } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const statusFilter = searchParams.get("status") ?? "";
  const networkFilter = searchParams.get("network") ?? "";
  const tokenFilter = searchParams.get("token") ?? "";
  const addressFilter = searchParams.get("address") ?? "";
  const selectedId = searchParams.get("id") ?? "";

  const [invoices, setInvoices] = useState<InvoiceSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chains, setChains] = useState<ChainConfigSchema[]>([]);
  const [filterTokens, setFilterTokens] = useState<TokenConfigSchema[]>([]);
  const [filterTokensLoading, setFilterTokensLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSchema | null>(
    null,
  );
  const [detailError, setDetailError] = useState<string | null>(null);
  const everLoaded = useRef(false);

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  function clearFilters() {
    setSearchParams({});
  }

  const hasFilters = statusFilter || networkFilter || tokenFilter || addressFilter;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchChains = useCallback(async () => {
    if (!apiKey) return;
    const res = await apiFetchSilent<ChainConfigSchema[]>("/chain", apiKey);
    if (res?.status === "success" && res.data) setChains(res.data);
  }, [apiKey]);

  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  useEffect(() => {
    if (!networkFilter || !apiKey) {
      setFilterTokens([]);
      setFilterTokensLoading(false);
      return;
    }
    setFilterTokensLoading(true);
    apiFetchSilent<TokenConfigSchema[]>(
      `/chain/${encodeURIComponent(networkFilter)}/token`,
      apiKey,
    ).then((res) => {
      if (res?.status === "success" && res.data) {
        setFilterTokens(res.data);
      } else {
        setFilterTokens([]);
      }
      setFilterTokensLoading(false);
    });
  }, [networkFilter, apiKey]);

  useEffect(() => {
    if (!networkFilter && tokenFilter) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("token");
        next.delete("page");
        return next;
      });
    }
  }, [networkFilter, tokenFilter, setSearchParams]);

  useEffect(() => {
    if (
      !networkFilter ||
      filterTokensLoading ||
      !tokenFilter ||
      filterTokens.some((tk) => tk.symbol === tokenFilter)
    ) {
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("token");
      next.delete("page");
      return next;
    });
  }, [
    networkFilter,
    tokenFilter,
    filterTokens,
    filterTokensLoading,
    setSearchParams,
  ]);

  const chainNames = useMemo(
    () => chains.map((c) => c.name).sort(),
    [chains],
  );

  const fetchInvoices = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));
    if (statusFilter) params.set("status", statusFilter);
    if (networkFilter) params.set("network", networkFilter);
    if (tokenFilter) params.set("token", tokenFilter);
    if (addressFilter) params.set("address", addressFilter);

    try {
      const res = await apiFetch<PaginatedResponse<InvoiceSchema>>(
        `/invoice?${params.toString()}`,
        apiKey,
      );
      if (res.status === "error") {
        if (res.message) toast.error(res.message);
      } else if (res.data) {
        setInvoices(res.data.items);
        setTotal(res.data.total);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey, page, statusFilter, networkFilter, tokenFilter, addressFilter]);

  useEffect(() => {
    if (!selectedId) fetchInvoices();
  }, [fetchInvoices, selectedId]);

  const fetchSingleInvoice = useCallback(async () => {
    if (!apiKey || !selectedId) {
      setSelectedInvoice(null);
      setDetailError(null);
      return;
    }
    try {
      const res = await apiFetch<InvoiceSchema>(
        `/invoice/${encodeURIComponent(selectedId)}`,
        apiKey,
      );
      if (res.status === "error") {
        const msg = res.message ?? t("invoices.failedToLoad");
        if (everLoaded.current) {
          toast.error(msg);
        } else {
          setDetailError(msg);
        }
        return;
      }
      if (res.data) {
        setSelectedInvoice(res.data);
        setDetailError(null);
        everLoaded.current = true;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : t("common.unexpectedError");
      if (everLoaded.current) {
        toast.error(msg);
      } else {
        setDetailError(msg);
      }
    }
  }, [apiKey, selectedId, t]);

  useEffect(() => {
    fetchSingleInvoice();
  }, [fetchSingleInvoice]);

  function handleSelect(id: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("id", id);
      return next;
    });
  }

  function handleBack() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("id");
      return next;
    });
  }

  function handleCancelled() {
    handleBack();
    fetchInvoices();
  }

  if (selectedId && detailError) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <ErrorBlock
          message={detailError}
          onRetry={fetchSingleInvoice}
        />
      </div>
    );
  }

  if (selectedId && selectedInvoice) {
    return (
      <div className="mx-auto max-w-6xl">
        <InvoiceDetail
          invoice={selectedInvoice}
          onBack={handleBack}
          onCancelled={handleCancelled}
        />
      </div>
    );
  }

  if (selectedId && !selectedInvoice) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("invoices.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("invoices.subtitle")}
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("invoices.filterByAddress")}
          value={addressFilter}
          onChange={(e) => setParam("address", e.target.value)}
          className="w-48"
        />

        <Select
          value={networkFilter || "__all__"}
          onValueChange={(v) => {
            const net = v === "__all__" ? "" : v;
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              if (net) next.set("network", net);
              else next.delete("network");
              next.delete("token");
              next.delete("page");
              return next;
            });
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("common.allNetworks")} />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="__all__">{t("common.allNetworks")}</SelectItem>
            {chainNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={tokenFilter || "__all__"}
          onValueChange={(v) => setParam("token", v === "__all__" ? "" : v)}
          disabled={!networkFilter || filterTokensLoading}
        >
          <SelectTrigger className="w-36">
            <SelectValue
              placeholder={
                networkFilter
                  ? filterTokensLoading
                    ? t("common.loading")
                    : t("common.allTokens")
                  : t("invoices.networkFirst")
              }
            />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="__all__">{t("common.allTokens")}</SelectItem>
            {filterTokens.map((tk) => (
              <SelectItem key={tk.symbol} value={tk.symbol}>
                {tk.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter || "__all__"}
          onValueChange={(v) => setParam("status", v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t("common.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("common.allStatuses")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t("status." + s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <RotateCcw className="size-3.5" />
            {t("common.clear")}
          </Button>
        )}

        <div className="flex-1" />

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t("invoices.createInvoice")}
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("invoices.emptyTitle")}
          description={t("invoices.emptyDescription")}
          action={!hasFilters ? { label: t("invoices.createInvoice"), onClick: () => setCreateOpen(true) } : undefined}
        />
      ) : (
        <InvoiceTable invoices={invoices} onSelect={handleSelect} />
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("invoices.total", { count: total })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setParam("page", String(page - 1))}
            >
              <ChevronLeft className="size-4" />
              {t("common.previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("common.pageOf", { page, totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setParam("page", String(page + 1))}
            >
              {t("common.next")}
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <CreateInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchInvoices}
      />
    </div>
  );
}
