import { fireEvent, render, screen } from "@testing-library/react";

import TermsPage from "./page";

describe("TermsPage", () => {
  it("renders terms content and navigation", () => {
    render(<TermsPage />);

    expect(screen.getByRole("link", { name: "Back to Done Loop" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("heading", { name: "Terms of Service" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Use of the website" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No professional advice" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  });

  it("switches terms content to Spanish", () => {
    render(<TermsPage />);

    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "es" } });

    expect(screen.getByRole("link", { name: "Volver a Done Loop" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("heading", { name: "Términos de Servicio" })).toBeInTheDocument();
  });
});

