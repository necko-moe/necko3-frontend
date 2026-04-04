import { useTranslation } from "react-i18next";
import type { ChainConfigSchema } from "@/types/chain";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChainCardProps {
  chain: ChainConfigSchema;
  onClick: () => void;
}

export function ChainCard({ chain, onClick }: ChainCardProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-3 rounded-xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10 transition-all hover:shadow-md hover:ring-foreground/20",
        !chain.active && "opacity-55",
      )}
    >
      {chain.logo_url ? (
        <img
          src={chain.logo_url}
          alt={chain.name}
          className="size-14 rounded-lg object-contain"
        />
      ) : (
        <div className="flex size-14 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
          {chain.name.charAt(0).toUpperCase()}
        </div>
      )}

      <span className="text-sm font-medium">{chain.name}</span>

      <Badge variant={chain.active ? "secondary" : "outline"}>
        {chain.active ? t("common.active") : t("common.inactive")}
      </Badge>
    </button>
  );
}
