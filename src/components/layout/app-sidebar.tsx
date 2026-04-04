import { NavLink } from "react-router";
import {
  Rocket,
  Link2,
  FileText,
  CreditCard,
  Webhook,
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { useSidebar } from "@/context/sidebar-context";
import { VisuallyHidden } from "radix-ui";
import { supportedLngs, type SupportedLng } from "@/i18n";

const langFlags: Record<SupportedLng, string> = {
  en: "🇬🇧",
  ru: "🇷🇺",
  uk: "🇺🇦",
  zh: "🇨🇳",
};

const navItems = [
  { to: "/getting-started", labelKey: "nav.gettingStarted", icon: Rocket },
  { to: "/chains", labelKey: "nav.chains", icon: Link2 },
  { to: "/invoices", labelKey: "nav.invoices", icon: FileText },
  { to: "/payments", labelKey: "nav.payments", icon: CreditCard },
  { to: "/webhooks", labelKey: "nav.webhooks", icon: Webhook },
] as const;

/** Matches footer icon buttons in collapsed sidebar */
const sidebarCollapsedIconBtn =
  "shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground";

function SidebarContent({
  collapsed,
  onNavigate,
  showCollapseToggle = true,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  showCollapseToggle?: boolean;
}) {
  const { clearApiKey } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggle } = useSidebar();
  const { t, i18n } = useTranslation();

  function setLang(lng: SupportedLng) {
    i18n.changeLanguage(lng);
  }

  return (
    <>
      <div
        className={cn(
          "flex h-14 min-w-0 items-center gap-2",
          collapsed ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        <div className={cn("flex items-center gap-2", !collapsed && "min-w-0 flex-1")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            N3
          </div>
          {!collapsed && (
            <span className="whitespace-nowrap overflow-hidden font-heading text-lg font-semibold tracking-tight text-sidebar-foreground">
              necko3
            </span>
          )}
        </div>
        {!collapsed && showCollapseToggle && (
          <Button
            variant="ghost"
            size="icon"
            className={sidebarCollapsedIconBtn}
            onClick={toggle}
            aria-label={t("sidebar.collapseSidebar")}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        )}
      </div>

      <Separator />

      <nav
        className={cn(
          "flex flex-1 flex-col gap-1 py-4",
          collapsed ? "items-center px-0" : "px-3",
        )}
      >
        {navItems.map(({ to, labelKey, icon: Icon }) => {
          const label = t(labelKey);

          if (collapsed) {
            return (
              <Tooltip key={to}>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className={sidebarCollapsedIconBtn}
                  >
                    <NavLink
                      to={to}
                      onClick={onNavigate}
                      aria-label={label}
                      className={({ isActive }) =>
                        cn(
                          isActive &&
                            "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent",
                        )
                      }
                    >
                      <Icon className="size-4" />
                    </NavLink>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="whitespace-nowrap overflow-hidden">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div
        className={cn(
          "flex gap-1 pb-4",
          collapsed ? "flex-col items-center px-0" : "items-center justify-between px-3",
        )}
      >
        {collapsed ? (
          <>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={sidebarCollapsedIconBtn}
                      aria-label={t("sidebar.language")}
                    >
                      <span className="text-base leading-none">{langFlags[i18n.language as SupportedLng]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t("languages." + i18n.language)}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="right" align="end">
                {supportedLngs.map((lng) => (
                  <DropdownMenuItem
                    key={lng}
                    onClick={() => setLang(lng)}
                    className="gap-2"
                  >
                    <span className="text-base leading-none">{langFlags[lng]}</span>
                    <span>{t("languages." + lng)}</span>
                    {i18n.language === lng && <Check className="ml-auto size-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={sidebarCollapsedIconBtn}
                  onClick={toggleTheme}
                  aria-label={t("sidebar.toggleTheme")}
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{t("sidebar.toggleTheme")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={sidebarCollapsedIconBtn}
                  onClick={clearApiKey}
                  aria-label={t("sidebar.signOut")}
                >
                  <LogOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{t("sidebar.signOut")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={sidebarCollapsedIconBtn}
                  onClick={toggle}
                  aria-label={t("sidebar.expandSidebar")}
                >
                  <PanelLeftOpen className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{t("sidebar.expandSidebar")}</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={sidebarCollapsedIconBtn}
                  aria-label={t("sidebar.language")}
                >
                  <span className="text-base leading-none">{langFlags[i18n.language as SupportedLng]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                {supportedLngs.map((lng) => (
                  <DropdownMenuItem
                    key={lng}
                    onClick={() => setLang(lng)}
                    className="gap-2"
                  >
                    <span className="text-base leading-none">{langFlags[lng]}</span>
                    <span>{t("languages." + lng)}</span>
                    {i18n.language === lng && <Check className="ml-auto size-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className={sidebarCollapsedIconBtn}
              onClick={toggleTheme}
              aria-label={t("sidebar.toggleTheme")}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              className="shrink-0 gap-2 px-2 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={clearApiKey}
            >
              <LogOut className="size-4" />
              <span className="whitespace-nowrap overflow-hidden">{t("sidebar.signOut")}</span>
            </Button>
          </>
        )}
      </div>
    </>
  );
}

export function DesktopSidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}

export function MobileHeader() {
  const { setMobileOpen } = useSidebar();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        aria-label={t("sidebar.openMenu")}
      >
        <Menu className="size-5" />
      </Button>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
        N3
      </div>
      <span className="font-heading text-lg font-semibold tracking-tight text-sidebar-foreground">
        necko3
      </span>
    </header>
  );
}

export function MobileDrawer() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { t } = useTranslation();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-64 gap-0 p-0 bg-sidebar text-sidebar-foreground"
      >
        <VisuallyHidden.Root>
          <SheetTitle>{t("sidebar.navigation")}</SheetTitle>
        </VisuallyHidden.Root>
        <SidebarContent
          collapsed={false}
          onNavigate={() => setMobileOpen(false)}
          showCollapseToggle={false}
        />
      </SheetContent>
    </Sheet>
  );
}
