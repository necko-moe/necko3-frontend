import { useTranslation } from "react-i18next";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorBlockProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorBlock({
  title,
  message,
  onRetry,
}: ErrorBlockProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center py-20">
      <Card className="w-full max-w-md border-destructive/30">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{title ?? t("common.error")}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw className="size-3.5" />
              {t("common.tryAgain")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
