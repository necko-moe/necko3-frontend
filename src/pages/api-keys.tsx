import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ApiKeyRecordSchema, CreateKeyReqSchema, CreateKeyResSchema, ApiKeyPrefixSchema, PermissionSchema } from "@/types/api-key";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ErrorBlock } from "@/components/error-block";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownAZ, ArrowUpAZ, Key, Plus, Loader2, Copy, Check, Trash2, ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CopyField, InfoRow, TimeField } from "@/components/shared/detail-primitives";
import { formatDistanceToNow } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDeleteDialog } from "@/components/chains/confirm-delete-dialog";

function RelativeTime({ date }: { date: string }) {
  const dateLocale = useDateLocale();
  const d = new Date(date);
  const text = formatDistanceToNow(d, { addSuffix: true, locale: dateLocale });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-xs text-muted-foreground">
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent>{d.toLocaleString()}</TooltipContent>
    </Tooltip>
  );
}

const EMPTY_CREATE: CreateKeyReqSchema = {
  name: "",
  prefix: "sk_live",
  permissions: [],
};

const ALL_PERMISSIONS: PermissionSchema[] = ["full_access", "write_invoices", "read_invoices", "public_read"];

function ApiKeyCard({ apiKey, onClick }: { apiKey: ApiKeyRecordSchema; onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <Card
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors",
        !apiKey.is_active && "opacity-60",
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base truncate">{apiKey.name}</CardTitle>
          <Badge variant={apiKey.is_active ? "default" : "secondary"}>
            {apiKey.is_active ? t("apiKeys.active") : t("apiKeys.revoked")}
          </Badge>
        </div>
        <CardDescription className="font-mono text-xs">
          {apiKey.prefix}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <div className="flex flex-wrap gap-1">
          {apiKey.permissions.slice(0, 3).map((perm) => (
            <Badge key={perm} variant="outline" className="text-xs">
              {t("apiKeys.permission." + perm)}
            </Badge>
          ))}
          {apiKey.permissions.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{apiKey.permissions.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <RelativeTime date={apiKey.created_at} />
      </CardFooter>
    </Card>
  );
}

function CreateApiKeyDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (req: CreateKeyReqSchema) => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateKeyReqSchema>({ ...EMPTY_CREATE });

  function reset() {
    setForm({ ...EMPTY_CREATE });
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.permissions.length === 0) {
      toast.error(t("apiKeys.addDialog.permissionsRequired"));
      return;
    }
    onSubmit(form);
  }

  function togglePermission(perm: PermissionSchema) {
    if (form.prefix === "pk_live") {
      setForm({ ...form, permissions: ["public_read"] });
      return;
    }
    if (form.permissions.includes(perm)) {
      setForm({ ...form, permissions: form.permissions.filter((p) => p !== perm) });
    } else {
      setForm({ ...form, permissions: [...form.permissions, perm] });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("apiKeys.addDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("apiKeys.addDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("apiKeys.addDialog.name")}</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("apiKeys.addDialog.namePlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("apiKeys.addDialog.prefix")}</Label>
            <Select
              value={form.prefix}
              onValueChange={(v) => setForm({ ...form, prefix: v as ApiKeyPrefixSchema, permissions: v === "pk_live" ? ["public_read"] : [] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sk_live">Secret Key (sk_live)</SelectItem>
                <SelectItem value="pk_live">Publishable Key (pk_live)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("apiKeys.addDialog.permissions")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map((perm) => (
                <div
                  key={perm}
                  className="flex items-center gap-2 rounded-md border p-2"
                >
                  <Checkbox
                    id={perm}
                    checked={form.permissions.includes(perm)}
                    onCheckedChange={() => togglePermission(perm)}
                    disabled={form.prefix === "pk_live" && perm !== "public_read"}
                  />
                  <Label htmlFor={perm} className="text-sm">
                    {t("apiKeys.permission." + perm)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.adding") : t("apiKeys.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeyDetail({
  apiKey,
  onBack,
  onRevoke,
  revoking,
}: {
  apiKey: ApiKeyRecordSchema;
  onBack: () => void;
  onRevoke: () => void;
  revoking: boolean;
}) {
  const { t } = useTranslation();
  const [revokeOpen, setRevokeOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex flex-1 items-center justify-center gap-3">
          <h2 className="font-heading text-xl font-semibold">{t("apiKeys.detail.title")}</h2>
          <Badge variant={apiKey.is_active ? "default" : "secondary"}>
            {apiKey.is_active ? t("apiKeys.active") : t("apiKeys.revoked")}
          </Badge>
        </div>
        <div className="size-8" />
      </div>

      <Separator />

      {apiKey.is_active && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setRevokeOpen(true)}
            disabled={revoking}
          >
            <Trash2 className="size-3.5" />
            {t("apiKeys.detail.revoke")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-1 pt-4">
            <InfoRow icon={Key} label={t("apiKeys.detail.name")}>
              <span className="font-medium">{apiKey.name}</span>
            </InfoRow>

            <InfoRow icon={Key} label={t("apiKeys.detail.prefix")}>
              <span className="font-mono text-sm">{apiKey.prefix}</span>
            </InfoRow>

            <Separator />

            <InfoRow icon={Key} label={t("apiKeys.detail.id")}>
              <CopyField value={apiKey.id} mono />
            </InfoRow>

            <Separator />

            <InfoRow icon={Key} label={t("apiKeys.detail.permissions")}>
              <div className="flex flex-wrap gap-1">
                {apiKey.permissions.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-xs">
                    {t("apiKeys.permission." + perm)}
                  </Badge>
                ))}
              </div>
            </InfoRow>

            <Separator />

            <InfoRow icon={Key} label={t("apiKeys.detail.created")}>
              <TimeField date={apiKey.created_at} />
            </InfoRow>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title={t("apiKeys.detail.revokeTitle")}
        description={t("apiKeys.detail.revokeDesc")}
        onConfirm={onRevoke}
        loading={revoking}
        confirmText={t("apiKeys.detail.revoke")}
      />
    </div>
  );
}

function ApiKeyCreatedDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CreateKeyResSchema | null;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (data) {
      navigator.clipboard.writeText(data.raw_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("apiKeys.createdDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("apiKeys.createdDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">{t("apiKeys.createdDialog.warning")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-destructive">{t("apiKeys.createdDialog.apiKey")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={data?.raw_key}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button size="icon" onClick={handleCopy}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t("apiKeys.createdDialog.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApiKeysPage() {
  const { apiKey } = useAuth();
  const { t } = useTranslation();

  const [apiKeys, setApiKeys] = useState<ApiKeyRecordSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const everLoaded = useRef(false);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [createdData, setCreatedData] = useState<CreateKeyResSchema | null>(null);
  const [createdOpen, setCreatedOpen] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ items: ApiKeyRecordSchema[] }>("/v1/api-keys", apiKey);
      if (res.status === "error") {
        const msg = res.message ?? t("apiKeys.failedToLoad");
        if (everLoaded.current) {
          toast.error(msg);
        } else {
          setError(msg);
        }
      } else if (res.data) {
        setApiKeys(res.data.items || []);
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
    fetchApiKeys();
  }, [fetchApiKeys]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = apiKeys.filter((k) => k.name.toLowerCase().includes(q));
    list.sort((a, b) =>
      sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );
    return list;
  }, [apiKeys, search, sortAsc]);

  const selectedApiKey = useMemo(
    () => apiKeys.find((k) => k.id === selectedId) ?? null,
    [apiKeys, selectedId],
  );

  async function handleCreateApiKey(req: CreateKeyReqSchema) {
    if (!apiKey) return;
    setAdding(true);
    try {
      const res = await apiFetch<CreateKeyResSchema>("/v1/api-keys", apiKey, {
        method: "POST",
        body: JSON.stringify(req),
      });
      if (res.status === "error") {
        toast.error(res.message ?? t("apiKeys.failedToAdd"));
        return;
      }
      if (res.data) {
        setCreatedData(res.data);
        setCreatedOpen(true);
      }
      setAddOpen(false);
      fetchApiKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
    } finally {
      setAdding(false);
    }
  }

  async function handleRevoke() {
    if (!apiKey || !selectedApiKey) return;
    setRevoking(true);
    try {
      const res = await apiFetch<never>(`/v1/api-keys/${encodeURIComponent(selectedApiKey.id)}/revoke`, apiKey, {
        method: "POST",
      });
      if (res.status === "error") {
        toast.error(res.message ?? t("apiKeys.failedToRevoke"));
        return;
      }
      setSelectedId(null);
      fetchApiKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
    } finally {
      setRevoking(false);
    }
  }

  if (selectedApiKey) {
    return (
      <div className="mx-auto max-w-6xl">
        <ApiKeyDetail
          apiKey={selectedApiKey}
          onBack={() => setSelectedId(null)}
          onRevoke={handleRevoke}
          revoking={revoking}
        />
      </div>
    );
  }

  if (!loading && error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {t("apiKeys.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("apiKeys.subtitle")}
          </p>
        </header>
        <ErrorBlock message={error} onRetry={fetchApiKeys} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("apiKeys.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("apiKeys.subtitle")}
        </p>
      </header>

      <div className="flex items-center gap-2">
        <Input
          placeholder={t("apiKeys.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortAsc((v) => !v)}
        >
          {sortAsc ? <ArrowDownAZ className="size-4" /> : <ArrowUpAZ className="size-4" />}
        </Button>
        <div className="flex-1" />
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          {t("apiKeys.add")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Key}
          title={apiKeys.length === 0 ? t("apiKeys.emptyTitle") : t("apiKeys.noResults")}
          description={apiKeys.length === 0 ? t("apiKeys.emptyDescription") : undefined}
          action={apiKeys.length === 0 ? { label: t("apiKeys.add"), onClick: () => setAddOpen(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((apiKey) => (
            <ApiKeyCard
              key={apiKey.id}
              apiKey={apiKey}
              onClick={() => setSelectedId(apiKey.id)}
            />
          ))}
        </div>
      )}

      <CreateApiKeyDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleCreateApiKey}
        loading={adding}
      />

      <ApiKeyCreatedDialog
        open={createdOpen}
        onOpenChange={setCreatedOpen}
        data={createdData}
      />
    </div>
  );
}
