import { LegalPage } from "../shared/legal-page";

const content = {
  en: {
    title: "Privacy Policy",
    intro:
      "Done Loop is designed as a local-first productivity app. This page explains the current privacy approach for the marketing website and the app experience.",
    sections: [
      {
        title: "Website data",
        body: "This marketing website does not include accounts, forms, analytics, advertising trackers, or a database for visitor information.",
      },
      {
        title: "App data",
        body: "Done Loop stores habits, tasks, settings, and related productivity data locally on your device. The app is not designed to send that personal data to this website.",
      },
      {
        title: "Google Play",
        body: "When the Android app is available through Google Play, downloads and store interactions may be handled under Google Play policies and Google account settings.",
      },
      {
        title: "Contact",
        body: "Questions about privacy can be directed to Addison Reyes through addisonreyes.com.",
      },
    ],
  },
  es: {
    title: "Política de Privacidad",
    intro:
      "Done Loop está diseñada como una app de productividad local. Esta página explica el enfoque actual de privacidad para el sitio web de marketing y la experiencia de la app.",
    sections: [
      {
        title: "Datos del sitio web",
        body: "Este sitio web de marketing no incluye cuentas, formularios, analíticas, rastreadores publicitarios ni una base de datos para información de visitantes.",
      },
      {
        title: "Datos de la app",
        body: "Done Loop guarda hábitos, tareas, ajustes y datos relacionados con productividad localmente en tu dispositivo. La app no está diseñada para enviar esos datos personales a este sitio web.",
      },
      {
        title: "Google Play",
        body: "Cuando la app de Android esté disponible en Google Play, las descargas e interacciones de la tienda podrán regirse por las políticas de Google Play y los ajustes de tu cuenta de Google.",
      },
      {
        title: "Contacto",
        body: "Las preguntas sobre privacidad pueden dirigirse a Addison Reyes a través de addisonreyes.com.",
      },
    ],
  },
};

export const metadata = {
  title: "Privacy Policy - Done Loop",
};

export default function PrivacyPage() {
  return <LegalPage content={content} />;
}
