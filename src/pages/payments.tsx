import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import type { ChainConfigSchema } from "@/types/chain";
import type { PaymentSchema, PaymentStatus } from "@/types/payment";
import type { PaginatedResponse } from "@/types/invoice";
import { useAuth } from "@/context/auth-context";
import { apiFetch, apiFetchSilent } from "@/lib/api";
import { ErrorBlock } from "@/components/error-block";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { PaymentTable } from "@/components/payments/payment-table";
import { PaymentDetail } from "@/components/payments/payment-detail";

const PAGE_SIZE = 20;
const STATUSES: PaymentStatus[] = ["Confirming", "Confirmed", "Cancelled"];

export function PaymentsPage() {
  const { apiKey } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const statusFilter = searchParams.get("status") ?? "";
  const networkFilter = searchParams.get("network") ?? "";
  const tokenFilter = searchParams.get("token") ?? "";
  const invoiceIdFilter = searchParams.get("invoice_id") ?? "";
  const fromFilter = searchParams.get("from") ?? "";
  const toFilter = searchParams.get("to") ?? "";
  const blockFilter = searchParams.get("block_number") ?? "";
  const selectedId = searchParams.get("id") ?? "";

  const [payments, setPayments] = useState<PaymentSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chains, setChains] = useState<ChainConfigSchema[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState<PaymentSchema | null>(
    null,
  );
  const [detailError, setDetailError] = useState<string | null>(null);
  const everLoaded = useRef(false);

  const advancedFilterCount = [fromFilter, toFilter, blockFilter].filter(
    Boolean,
  ).length;

  useEffect(() => {
    if (advancedFilterCount > 0) setShowAdvanced(true);
  }, []);

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

  const hasFilters =
    statusFilter ||
    networkFilter ||
    tokenFilter ||
    invoiceIdFilter ||
    fromFilter ||
    toFilter ||
    blockFilter;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchChains = useCallback(async () => {
    if (!apiKey) return;
    const res = await apiFetchSilent<ChainConfigSchema[]>("/chain", apiKey);
    if (res?.status === "success" && res.data) setChains(res.data);
  }, [apiKey]);

  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  const chainNames = useMemo(
    () => chains.map((c) => c.name).sort(),
    [chains],
  );

  const fetchPayments = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));
    if (statusFilter) params.set("status", statusFilter);
    if (networkFilter) params.set("network", networkFilter);
    if (tokenFilter) params.set("token", tokenFilter);
    if (invoiceIdFilter) params.set("invoice_id", invoiceIdFilter);
    if (fromFilter) params.set("from", fromFilter);
    if (toFilter) params.set("to", toFilter);
    if (blockFilter) params.set("block_number", blockFilter);

    try {
      const res = await apiFetch<PaginatedResponse<PaymentSchema>>(
        `/payment?${params.toString()}`,
        apiKey,
      );
      if (res.status === "error") {
        if (res.message) toast.error(res.message);
      } else if (res.data) {
        setPayments(res.data.items);
        setTotal(res.data.total);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [
    apiKey,
    page,
    statusFilter,
    networkFilter,
    tokenFilter,
    invoiceIdFilter,
    fromFilter,
    toFilter,
    blockFilter,
  ]);

  useEffect(() => {
    if (!selectedId) fetchPayments();
  }, [fetchPayments, selectedId]);

  const fetchSinglePayment = useCallback(async () => {
    if (!apiKey || !selectedId) {
      setSelectedPayment(null);
      setDetailError(null);
      return;
    }
    try {
      const res = await apiFetch<PaymentSchema>(
        `/payment/${encodeURIComponent(selectedId)}`,
        apiKey,
      );
      if (res.status === "error") {
        const msg = res.message ?? "Could not load payment";
        if (everLoaded.current) {
          toast.error(msg);
        } else {
          setDetailError(msg);
        }
        return;
      }
      if (res.data) {
        setSelectedPayment(res.data);
        setDetailError(null);
        everLoaded.current = true;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Unexpected error";
      if (everLoaded.current) {
        toast.error(msg);
      } else {
        setDetailError(msg);
      }
    }
  }, [apiKey, selectedId]);

  useEffect(() => {
    fetchSinglePayment();
  }, [fetchSinglePayment]);

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
    fetchPayments();
  }

  if (selectedId && detailError) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <ErrorBlock
          message={detailError}
          onRetry={fetchSinglePayment}
        />
      </div>
    );
  }

  if (selectedId && selectedPayment) {
    return (
      <div className="mx-auto max-w-6xl">
        <PaymentDetail
          payment={selectedPayment}
          onBack={handleBack}
          onCancelled={handleCancelled}
        />
      </div>
    );
  }

  if (selectedId && !selectedPayment) {
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
          Payments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor and manage incoming payments.
        </p>
      </header>

      {/* Primary filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Invoice ID..."
          value={invoiceIdFilter}
          onChange={(e) => setParam("invoice_id", e.target.value)}
          className="w-48"
        />

        <Select
          value={networkFilter || "__all__"}
          onValueChange={(v) => setParam("network", v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Networks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Networks</SelectItem>
            {chainNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Token..."
          value={tokenFilter}
          onChange={(e) => setParam("token", e.target.value)}
          className="w-32"
        />

        <Select
          value={statusFilter || "__all__"}
          onValueChange={(v) => setParam("status", v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced((v) => !v)}
          className="gap-1.5"
        >
          <SlidersHorizontal className="size-3.5" />
          Advanced
          {advancedFilterCount > 0 && !showAdvanced && (
            <Badge variant="secondary" className="ml-1 size-5 justify-center rounded-full p-0 text-[10px]">
              {advancedFilterCount}
            </Badge>
          )}
          {showAdvanced ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <RotateCcw className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
          <Input
            placeholder="From address..."
            value={fromFilter}
            onChange={(e) => setParam("from", e.target.value)}
            className="w-48"
          />
          <Input
            placeholder="To address..."
            value={toFilter}
            onChange={(e) => setParam("to", e.target.value)}
            className="w-48"
          />
          <Input
            placeholder="Block number..."
            type="number"
            value={blockFilter}
            onChange={(e) => setParam("block_number", e.target.value)}
            className="w-40"
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PaymentTable payments={payments} onSelect={handleSelect} />
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} payment{total !== 1 && "s"} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setParam("page", String(page - 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setParam("page", String(page + 1))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
