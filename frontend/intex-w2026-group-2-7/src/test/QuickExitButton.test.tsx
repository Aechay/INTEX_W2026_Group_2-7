import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@/i18n/config";
import QuickExitButton from "@/components/QuickExitButton";

describe("QuickExitButton", () => {
  const replaceSpy = vi.fn();

  beforeEach(async () => {
    replaceSpy.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        replace: replaceSpy,
      },
    });

    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("uses the shared translation namespace across languages", async () => {
    const { rerender } = render(<QuickExitButton />);

    expect(screen.getByRole("button", { name: "Quick Exit" })).toBeInTheDocument();

    await act(async () => {
      await i18n.changeLanguage("es");
    });
    rerender(<QuickExitButton />);

    expect(screen.getByRole("button", { name: "Salida rápida" })).toBeInTheDocument();
  });

  it("redirects to the configured quick-exit destination", () => {
    render(<QuickExitButton exitUrl="https://example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Quick Exit" }));

    expect(replaceSpy).toHaveBeenCalledWith("https://example.com");
  });
});
