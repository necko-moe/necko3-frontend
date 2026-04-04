import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { AuthGate } from "@/components/auth-gate";
import { AppLayout } from "@/components/layout/app-layout";
import { ThemeProvider } from "@/hooks/use-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GettingStartedPage } from "@/pages/getting-started";
import { ChainsPage } from "@/pages/chains";
import { InvoicesPage } from "@/pages/invoices";
import { PaymentsPage } from "@/pages/payments";
import { WebhooksPage } from "@/pages/webhooks";

export function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <ThemeProvider>
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "!bg-[var(--color-warm-cream)] !text-[var(--color-warm-bark)] !border-[var(--color-warm-sand)]",
          classNames: {
            error:
              "!bg-red-50 !border-red-200 !text-red-900",
          },
        }}
      />
      <AuthProvider>
        <TooltipProvider>
          <AuthGate>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/getting-started" element={<GettingStartedPage />} />
                <Route path="/chains" element={<ChainsPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/webhooks" element={<WebhooksPage />} />
                <Route path="*" element={<Navigate to="/getting-started" replace />} />
              </Route>
            </Routes>
          </AuthGate>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
