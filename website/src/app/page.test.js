import { fireEvent, render, screen } from "@testing-library/react";

import Home from "./page";

describe("Home", () => {
  it("renders the main marketing surface", () => {
    render(<Home />);

    expect(screen.getByText("Done Loop")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /keep your day moving/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /download on google play/i })).toHaveLength(2);
    expect(screen.getByText("Built for daily follow-through")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
  });

  it("switches visible copy to Spanish", () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "es" } });

    expect(screen.getByRole("heading", { name: /mantén tu día avanzando/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /descargar en google play/i })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Política de Privacidad" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Términos de Servicio" })).toHaveAttribute("href", "/terms");
  });
});

