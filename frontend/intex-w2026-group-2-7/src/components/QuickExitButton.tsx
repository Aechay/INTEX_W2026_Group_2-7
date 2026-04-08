import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type QuickExitButtonProps = {
  className?: string;
  exitUrl?: string;
};

const DEFAULT_EXIT_URL = "https://www.google.com";

const QuickExitButton = ({ className, exitUrl = DEFAULT_EXIT_URL }: QuickExitButtonProps) => {
  const { t } = useTranslation("common");

  const handleQuickExit = () => {
    window.location.replace(exitUrl);
  };

  return (
    <button
      aria-label={t("quickExit")}
      className={cn(
        "fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border-2 border-black bg-black px-6 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2",
        className,
      )}
      onClick={handleQuickExit}
      type="button"
    >
      <X className="h-4 w-4" />
      <span>{t("quickExit")}</span>
    </button>
  );
};

export default QuickExitButton;
