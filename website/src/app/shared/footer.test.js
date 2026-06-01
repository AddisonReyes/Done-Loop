import { render, screen } from "@testing-library/react";

import { Footer } from "./footer";

describe("Footer", () => {
  it("renders legal and external links in English", () => {
    render(<Footer language="en" />);

    expect(screen.getByRole("link", { name: "Addison Reyes" })).toHaveAttribute(
      "href",
      "https://addisonreyes.com"
    );
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
  });

  it("falls back to English for unsupported languages", () => {
    render(<Footer language="fr" />);

    expect(screen.getByText(/made by/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toBeInTheDocument();
  });
});

