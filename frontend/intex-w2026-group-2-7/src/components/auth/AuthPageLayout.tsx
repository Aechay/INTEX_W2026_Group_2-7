import type { PropsWithChildren } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

type AuthPageLayoutProps = PropsWithChildren<{
  className?: string;
}>;

const AuthPageLayout = ({ children, className }: AuthPageLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div
          className={cn(
            "container mx-auto flex min-h-full items-center justify-center px-4 py-12 md:py-16",
            className,
          )}
        >
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthPageLayout;
