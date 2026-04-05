import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { WebhookSchema, WebhookStatus, WebhookEventType } from "@/types/webhook";
import type { PaginatedResponse } from "@/types/invoice";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
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
  Loader2,
  RotateCcw,
  Webhook,
} from "lucide-react";
import { WebhookTable } from "@/components/webhooks/webhook-table";
import { WebhookDetail } from "@/components/webhooks/webhook-detail";
import { EmptyState } from "@/components/shared/empty-state";

const PAGE_SIZE = 20;
const STATUSES: WebhookStatus[] = [
  "Pending",
  "Processing",
  "Sent",
  "Failed",
  "Cancelled",
];
const EVENT_TYPES: WebhookEventType[] = [
  "tx_detected",
  "tx_confirmed",
  "invoice_paid",
  "invoice_expired",
];

export function WebhooksPage() {
  const { apiKey } = useAuth();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const statusFilter = searchParams.get("status") ?? "";
  const eventTypeFilter = searchParams.get("event_type") ?? "";
  const invoiceIdFilter = searchParams.get("invoice_id") ?? "";
  const urlFilter = searchParams.get("url") ?? "";
  const selectedId = searchParams.get("id") ?? "";

  const [webhooks, setWebhooks] = useState<WebhookSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedWebhook, setSelectedWebhook] = useState<WebhookSchema | null>(
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

  const hasFilters =
    statusFilter || eventTypeFilter || invoiceIdFilter || urlFilter;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchWebhooks = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));
    if (statusFilter) params.set("status", statusFilter);
    if (eventTypeFilter) params.set("event_type", eventTypeFilter);
    if (invoiceIdFilter) params.set("invoice_id", invoiceIdFilter);
    if (urlFilter) params.set("url", urlFilter);

    try {
      const res = await apiFetch<PaginatedResponse<WebhookSchema>>(
        `/webhook?${params.toString()}`,
        apiKey,
      );
      if (res.status === "error") {
        if (res.message) toast.error(res.message);
      } else if (res.data) {
        setWebhooks(res.data.items);
        setTotal(res.data.total);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey, page, statusFilter, eventTypeFilter, invoiceIdFilter, urlFilter]);

  useEffect(() => {
    if (!selectedId) fetchWebhooks();
  }, [fetchWebhooks, selectedId]);

  const fetchSingleWebhook = useCallback(async () => {
    if (!apiKey || !selectedId) {
      setSelectedWebhook(null);
      setDetailError(null);
      return;
    }
    try {
      const res = await apiFetch<WebhookSchema>(
        `/webhook/${encodeURIComponent(selectedId)}`,
        apiKey,
      );
      if (res.status === "error") {
        const msg = res.message ?? t("webhooks.failedToLoad");
        if (everLoaded.current) {
          toast.error(msg);
        } else {
          setDetailError(msg);
        }
        return;
      }
      if (res.data) {
        setSelectedWebhook(res.data);
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
    fetchSingleWebhook();
  }, [fetchSingleWebhook]);

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
    fetchWebhooks();
  }

  if (selectedId && detailError) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <ErrorBlock
          message={detailError}
          onRetry={fetchSingleWebhook}
        />
      </div>
    );
  }

  if (selectedId && selectedWebhook) {
    return (
      <div className="mx-auto max-w-6xl">
        <WebhookDetail
          webhook={selectedWebhook}
          onBack={handleBack}
          onCancelled={handleCancelled}
        />
      </div>
    );
  }

  if (selectedId && !selectedWebhook) {
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
          {t("webhooks.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("webhooks.subtitle")}
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("webhooks.invoiceId")}
          value={invoiceIdFilter}
          onChange={(e) => setParam("invoice_id", e.target.value)}
          className="w-48"
        />

        <Select
          value={eventTypeFilter || "__all__"}
          onValueChange={(v) =>
            setParam("event_type", v === "__all__" ? "" : v)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("common.allEvents")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("common.allEvents")}</SelectItem>
            {EVENT_TYPES.map((et) => (
              <SelectItem key={et} value={et}>
                {t("webhooks.event." + et)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder={t("webhooks.url")}
          value={urlFilter}
          onChange={(e) => setParam("url", e.target.value)}
          className="w-48"
        />

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
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : webhooks.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title={t("webhooks.emptyTitle")}
          description={t("webhooks.emptyDescription")}
        />
      ) : (
        <WebhookTable webhooks={webhooks} onSelect={handleSelect} />
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("webhooks.total", { count: total })}
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
    </div>
  );
}
