import { fireEvent, render, screen } from "@testing-library/react";

import Home from "./page";

describe("Home", () => {
  it("renders the main marketing surface", () => {
    render(<Home />);

    expect(screen.getByText("Done Loop")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /keep your day moving/i })).toBeInTheDocument();
    const playLinks = screen.getAllByRole("link", { name: /download on google play/i });
    expect(playLinks).toHaveLength(2);
    expect(playLinks[0]).toHaveAttribute("href", "#google-play");
    expect(playLinks[1]).toHaveAttribute("href", "#google-play");
    expect(screen.getByText("Built for daily follow-through")).toBeInTheDocument();
    expect(screen.getByText("Done Loop is available for Android on Google Play.")).toBeInTheDocument();
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/being prepared/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
  });

  it("switches visible copy to Spanish", () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "es" } });

    expect(screen.getByRole("heading", { name: /mantén tu día avanzando/i })).toBeInTheDocument();
    const playLinks = screen.getAllByRole("link", { name: /descargar en google play/i });
    expect(playLinks).toHaveLength(2);
    expect(playLinks[0]).toHaveAttribute("href", "#google-play");
    expect(playLinks[1]).toHaveAttribute("href", "#google-play");
    expect(screen.getByText("Done Loop está disponible para Android en Google Play.")).toBeInTheDocument();
    expect(screen.queryByText(/temporal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/preparación/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Política de Privacidad" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Términos de Servicio" })).toHaveAttribute("href", "/terms");
  });
});
