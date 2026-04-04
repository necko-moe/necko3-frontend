import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { apiKey, setApiKey } = useAuth();
  const [draft, setDraft] = useState("");

  if (apiKey) return <>{children}</>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (trimmed) setApiKey(trimmed);
  };

  return (
    <Dialog open>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <KeyRound className="size-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {t("auth.welcome")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("auth.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            autoFocus
            placeholder={t("auth.placeholder")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-10 font-mono"
          />
          <DialogFooter className="sm:justify-center">
            <Button type="submit" disabled={!draft.trim()} className="w-full sm:w-auto">
              {t("auth.continue")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
