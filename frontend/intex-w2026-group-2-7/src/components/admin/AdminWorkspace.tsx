import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type Language,
  isSupportedLanguage,
} from "@/i18n/languages";
import { withPathLanguage } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export type AdminNavItem = {
  label: string;
  icon: LucideIcon;
  to?: string;
  active?: boolean;
  disabled?: boolean;
};

type AdminWorkspaceProps = {
  items: AdminNavItem[];
  signOutPending: boolean;
  onSignOut: () => Promise<void>;
  children: ReactNode;
};

const SidebarLabel = ({
  collapsed,
  className,
  children,
}: {
  collapsed: boolean;
  className?: string;
  children: ReactNode;
}) => (
  <span
    className={cn(
      "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-150",
      collapsed
        ? "max-w-0 opacity-0 group-hover/sidebar:max-w-[180px] group-hover/sidebar:opacity-100"
        : "max-w-[180px] opacity-100",
      className,
    )}
  >
    {children}
  </span>
);

const PreferencesModal = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const currentLanguage = isSupportedLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;
  const [draftTheme, setDraftTheme] = useState<"light" | "dark">(isDark ? "dark" : "light");
  const [draftLanguage, setDraftLanguage] = useState<Language>(currentLanguage);

  useEffect(() => {
    if (open) {
      setDraftTheme(isDark ? "dark" : "light");
      setDraftLanguage(currentLanguage);
    }
  }, [currentLanguage, isDark, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDraftTheme(isDark ? "dark" : "light");
      setDraftLanguage(currentLanguage);
    }

    onOpenChange(nextOpen);
  };

  const handleSave = () => {
    if ((draftTheme === "dark") !== isDark) {
      toggleTheme();
    }

    if (draftLanguage !== currentLanguage) {
      navigate(
        `${withPathLanguage(location.pathname, draftLanguage)}${location.search}${location.hash}`,
        { replace: true },
      );
      void i18n.changeLanguage(draftLanguage);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-none border-border bg-card p-0 shadow-xl sm:max-w-[32rem]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>{t("preferences.title")}</DialogTitle>
          <DialogDescription>{t("preferences.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5">
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">{t("preferences.appearance")}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "justify-start rounded-none border-border bg-background text-foreground hover:bg-muted",
                  draftTheme === "light" ? "border-primary bg-primary/10 text-foreground hover:bg-primary/10" : "",
                )}
                onClick={() => setDraftTheme("light")}
              >
                <Sun className="h-4 w-4" />
                {t("preferences.light")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "justify-start rounded-none border-border bg-background text-foreground hover:bg-muted",
                  draftTheme === "dark" ? "border-primary bg-primary/10 text-foreground hover:bg-primary/10" : "",
                )}
                onClick={() => setDraftTheme("dark")}
              >
                <Moon className="h-4 w-4" />
                {t("preferences.dark")}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">{t("language.label")}</div>
            <Select
              onValueChange={(value) => {
                if (isSupportedLanguage(value)) {
                  setDraftLanguage(value);
                }
              }}
              value={draftLanguage}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder={t("language.label")} />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((language) => (
                  <SelectItem key={language} value={language}>
                    {t(`language.options.${language}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" className="rounded-none" onClick={() => handleOpenChange(false)}>
            {t("preferences.cancel")}
          </Button>
          <Button type="button" className="rounded-none" onClick={handleSave}>
            {t("preferences.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DesktopSidebar = ({
  items,
  signOutPending,
  onSignOut,
  collapsed,
  onToggleCollapsed,
  onOpenPreferences,
}: {
  items: AdminNavItem[];
  signOutPending: boolean;
  onSignOut: () => Promise<void>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenPreferences: () => void;
}) => {
  const { t } = useTranslation("common");
  const [isHoverDisabled, setIsHoverDisabled] = useState(false);

  const handleToggle = () => {
    if (!collapsed) {
      setIsHoverDisabled(true);
    }
    onToggleCollapsed();
  };

  const railRowClassName = collapsed
    ? "justify-center gap-0 px-0 group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-4"
    : "gap-3 px-4";
  const railButtonClassName = collapsed
    ? "justify-center gap-0 px-0 group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-3"
    : "gap-3 px-3";

  return (
    <aside
      onMouseLeave={() => setIsHoverDisabled(false)}
      className={cn(
        "fixed bottom-0 left-0 top-16 z-40 hidden border-r border-white/10 bg-[hsl(200_25%_15%)] text-slate-100 transition-[width] duration-200 lg:flex lg:flex-col",
        !isHoverDisabled && "group/sidebar",
        collapsed ? (isHoverDisabled ? "w-16" : "w-16 hover:w-72") : "w-72",
      )}
    >
      <div className="border-b border-white/10">
        <div
          className={cn(
            "flex items-center py-3",
            collapsed ? "justify-center group-hover/sidebar:justify-between group-hover/sidebar:px-4" : "justify-between px-4",
          )}
        >
          <SidebarLabel
            collapsed={collapsed}
            className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300"
          >
            Admin
          </SidebarLabel>
          <button
            type="button"
            aria-label={collapsed ? "Expand admin navigation" : "Collapse admin navigation"}
            className="flex h-8 w-8 items-center justify-center text-slate-400 transition-colors hover:text-white"
            onClick={handleToggle}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const rowClassName = cn(
            "flex items-center border-l-4 py-3 text-sm transition-colors",
            railRowClassName,
          );

          if (item.disabled || !item.to) {
            return (
              <div
                key={item.label}
                className={cn(rowClassName, "border-transparent text-slate-500")}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <SidebarLabel collapsed={collapsed}>{item.label}</SidebarLabel>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                rowClassName,
                item.active
                  ? "border-primary bg-primary/20 text-white"
                  : "border-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white",
              )}
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <SidebarLabel collapsed={collapsed}>{item.label}</SidebarLabel>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-2 py-3">
        <button
          type="button"
          className={cn(
            "mt-3 flex w-full items-center border border-white/10 bg-white/[0.03] py-2 text-sm text-slate-100 transition-colors hover:bg-white/[0.08]",
            railButtonClassName,
          )}
          onClick={onOpenPreferences}
          title={t("preferences.button")}
        >
          <Settings2 className="h-4 w-4 shrink-0" />
          <SidebarLabel collapsed={collapsed}>{t("preferences.button")}</SidebarLabel>
        </button>

        <button
          type="button"
          className={cn(
            "mt-3 flex w-full items-center border border-white/10 bg-white/[0.03] py-2 text-sm text-slate-100 transition-colors hover:bg-white/[0.08]",
            railButtonClassName,
          )}
          onClick={() => void onSignOut()}
          disabled={signOutPending}
          title="Sign out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <SidebarLabel collapsed={collapsed}>
            {signOutPending ? "Signing out..." : "Sign out"}
          </SidebarLabel>
        </button>
      </div>
    </aside>
  );
};

const MobileNavigation = ({
  items,
  signOutPending,
  onSignOut,
  onOpenPreferences,
}: {
  items: AdminNavItem[];
  signOutPending: boolean;
  onSignOut: () => Promise<void>;
  onOpenPreferences: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation("common");
  const currentLabel = useMemo(
    () => items.find((item) => item.active)?.label ?? "Admin navigation",
    [items],
  );

  return (
    <div className="sticky top-16 z-30 border-b border-white/10 bg-[hsl(200_25%_15%)] text-slate-100 lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Admin Navigation
          </div>
          <div className="mt-1 text-sm font-medium text-slate-100">{currentLabel}</div>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label="Toggle admin navigation"
        >
          <span>Pages</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")} />
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10">
          <nav className="px-2 py-2">
            {items.map((item) => {
              const Icon = item.icon;

              if (item.disabled || !item.to) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 border-l-4 border-transparent px-4 py-3 text-sm text-slate-500"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 border-l-4 px-4 py-3 text-sm",
                    item.active
                      ? "border-primary bg-primary/20 text-white"
                      : "border-transparent text-slate-300",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 px-4 py-4 text-sm">
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-100 hover:bg-white/[0.08]"
              onClick={() => {
                setOpen(false);
                onOpenPreferences();
              }}
            >
              <Settings2 className="h-4 w-4" />
              <span>{t("preferences.button")}</span>
            </button>

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-100 hover:bg-white/[0.08]"
              onClick={() => void onSignOut()}
              disabled={signOutPending}
            >
              <LogOut className="h-4 w-4" />
              <span>{signOutPending ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const AdminWorkspace = ({
  items,
  signOutPending,
  onSignOut,
  children,
}: AdminWorkspaceProps) => {
  const isMobile = useIsMobile();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const sidebarCollapsed = desktopCollapsed && !preferencesOpen;
  const orderedItems = useMemo(() => {
    const socialMediaItems = items.filter((item) => item.to?.includes("/social-media"));
    const donationItems = items.filter((item) => item.to?.includes("/donations"));
    const otherItems = items.filter(
      (item) => !item.to?.includes("/social-media") && !item.to?.includes("/donations"),
    );
    return [...otherItems, ...donationItems, ...socialMediaItems];
  }, [items]);

  useEffect(() => {
    if (isMobile) {
      setDesktopCollapsed(false);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <DesktopSidebar
        items={orderedItems}
        signOutPending={signOutPending}
        onSignOut={onSignOut}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setDesktopCollapsed((current) => !current)}
        onOpenPreferences={() => setPreferencesOpen(true)}
      />
      <main
        className={cn(
          "w-full transition-[padding] duration-200",
          desktopCollapsed ? "lg:pl-16" : "lg:pl-72",
        )}
      >
        <MobileNavigation
          items={orderedItems}
          signOutPending={signOutPending}
          onSignOut={onSignOut}
          onOpenPreferences={() => setPreferencesOpen(true)}
        />
        <section className="min-w-0 space-y-6 px-4 py-4 lg:px-6 lg:py-6">{children}</section>
      </main>
      <PreferencesModal open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </div>
  );
};

export default AdminWorkspace;
