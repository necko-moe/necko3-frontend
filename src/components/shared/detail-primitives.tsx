import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { useDateLocale } from "@/lib/date-locale";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check } from "lucide-react";

export function CopyField({ value, mono }: { value: string; mono?: boolean }) {
  const { t } = useTranslation();
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
          className={cn(
            "group flex items-center gap-1.5 text-left transition-colors hover:text-primary",
            mono && "font-mono text-xs",
          )}
        >
          <span className="truncate">{value}</span>
          {copied ? (
            <Check className="size-3 shrink-0 text-emerald-600" />
          ) : (
            <Copy className="size-3 shrink-0 opacity-0 group-hover:opacity-60" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? t("common.copied") : t("common.clickToCopy")}</TooltipContent>
    </Tooltip>
  );
}

export function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export function TimeField({ date, warn }: { date: string; warn?: boolean }) {
  const dateLocale = useDateLocale();
  const d = new Date(date);
  const past = isPast(d);
  const relative = formatDistanceToNow(d, { addSuffix: true, locale: dateLocale });
  const exact = format(d, "PPpp", { locale: dateLocale });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            warn && past && "text-destructive/80",
            warn && !past && "text-foreground",
          )}
        >
          {relative}
        </span>
      </TooltipTrigger>
      <TooltipContent>{exact}</TooltipContent>
    </Tooltip>
  );
}
