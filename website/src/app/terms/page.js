import { LegalPage } from "../shared/legal-page";

const content = {
  en: {
    title: "Terms of Service",
    intro:
      "These terms describe the basic conditions for using the Done Loop marketing website and the Done Loop app once available.",
    sections: [
      {
        title: "Use of the website",
        body: "The website is provided for product information. Do not misuse the website, attempt to disrupt it, or use it in a way that violates applicable law.",
      },
      {
        title: "App availability",
        body: "The Google Play call to action is currently a placeholder. Features, release timing, and store availability may change before public release.",
      },
      {
        title: "No professional advice",
        body: "Done Loop is a productivity tool. It does not provide medical, legal, financial, or professional advice.",
      },
      {
        title: "Changes",
        body: "These terms may be updated as the product, app listing, or website changes. Continued use means you accept the latest version.",
      },
    ],
  },
  es: {
    title: "Términos de Servicio",
    intro:
      "Estos términos describen las condiciones básicas para usar el sitio web de marketing de Done Loop y la app Done Loop cuando esté disponible.",
    sections: [
      {
        title: "Uso del sitio web",
        body: "El sitio web se ofrece para información del producto. No debes abusar del sitio, intentar interrumpirlo ni usarlo de una forma que infrinja la ley aplicable.",
      },
      {
        title: "Disponibilidad de la app",
        body: "El llamado a la acción de Google Play es actualmente temporal. Las funciones, fechas de lanzamiento y disponibilidad en la tienda pueden cambiar antes del lanzamiento público.",
      },
      {
        title: "Sin asesoría profesional",
        body: "Done Loop es una herramienta de productividad. No proporciona asesoría médica, legal, financiera ni profesional.",
      },
      {
        title: "Cambios",
        body: "Estos términos pueden actualizarse conforme cambien el producto, la ficha de la app o el sitio web. El uso continuo significa que aceptas la versión más reciente.",
      },
    ],
  },
};

export const metadata = {
  title: "Terms of Service - Done Loop",
};

export default function TermsPage() {
  return <LegalPage content={content} />;
}
