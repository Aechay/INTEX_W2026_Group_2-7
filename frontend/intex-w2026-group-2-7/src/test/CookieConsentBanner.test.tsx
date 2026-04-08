import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookie-consent";

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders until the user acknowledges the cookie notice", () => {
    render(
      <MemoryRouter initialEntries={["/impact"]}>
        <CookieConsentBanner />
      </MemoryRouter>,
    );

    expect(screen.getByText("Cookie Notice")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/privacy-policy",
    );

    fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));

    expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBe("acknowledged");
    expect(screen.queryByText("Cookie Notice")).not.toBeInTheDocument();
  });

  it("uses the active route language for the privacy-policy link", () => {
    render(
      <MemoryRouter initialEntries={["/es/get-help"]}>
        <CookieConsentBanner />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/es/privacy-policy",
    );
  });

  it("stays hidden when consent has already been acknowledged", () => {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, "acknowledged");

    render(
      <MemoryRouter initialEntries={["/"]}>
        <CookieConsentBanner />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Cookie Notice")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Acknowledge" })).not.toBeInTheDocument();
  });
});
