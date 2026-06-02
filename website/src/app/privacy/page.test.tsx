import { fireEvent, render, screen } from "@testing-library/react";

import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("renders privacy content and navigation", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("link", { name: "Back to Done Loop" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Last updated: June 1, 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Website data" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "App data" })).toBeInTheDocument();
    expect(screen.getByText(/Done Loop is distributed through Google Play/i)).toBeInTheDocument();
    expect(screen.queryByText(/When the Android app is available/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
  });

  it("switches privacy content to Spanish", () => {
    render(<PrivacyPage />);

    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "es" } });

    expect(screen.getByRole("link", { name: "Volver a Done Loop" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Última actualización: 1 de junio de 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Política de Privacidad" })).toBeInTheDocument();
    expect(screen.getByText(/Done Loop se distribuye a través de Google Play/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cuando la app de Android esté disponible/i)).not.toBeInTheDocument();
  });
});
