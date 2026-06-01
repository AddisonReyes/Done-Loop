import { LegalPage } from "../shared/legal-page";

const content = {
  en: {
    title: "Privacy Policy",
    intro:
      "Done Loop is a free, local-first productivity app for habits and tasks. This page explains the privacy approach for the website and app.",
    sections: [
      {
        title: "Website data",
        body: "This marketing website does not include accounts, forms, analytics, advertising trackers, or a database for visitor information.",
      },
      {
        title: "App data",
        body: "Done Loop stores habits, tasks, reminders, settings, and related productivity data locally on your device. The app does not provide accounts, cloud sync, analytics, advertising, memberships, subscriptions, or payment features.",
      },
      {
        title: "Notifications",
        body: "If you enable reminders, Done Loop uses your device notification permission to schedule local habit and task reminders. Reminder content is generated on your device.",
      },
      {
        title: "Retention and deletion",
        body: "App data remains on your device until you edit it, delete it, or remove the app and its local data from your device.",
      },
      {
        title: "Google Play",
        body: "Done Loop is distributed through Google Play, where downloads and store interactions may be handled under Google Play policies and Google account settings.",
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
      "Done Loop es una app gratuita de productividad local para hábitos y tareas. Esta página explica el enfoque de privacidad para el sitio web y la app.",
    sections: [
      {
        title: "Datos del sitio web",
        body: "Este sitio web de marketing no incluye cuentas, formularios, analíticas, rastreadores publicitarios ni una base de datos para información de visitantes.",
      },
      {
        title: "Datos de la app",
        body: "Done Loop guarda hábitos, tareas, recordatorios, ajustes y datos relacionados con productividad localmente en tu dispositivo. La app no ofrece cuentas, sincronización en la nube, analíticas, anuncios, membresías, suscripciones ni pagos.",
      },
      {
        title: "Notificaciones",
        body: "Si activas recordatorios, Done Loop usa el permiso de notificaciones de tu dispositivo para programar recordatorios locales de hábitos y tareas. El contenido de los recordatorios se genera en tu dispositivo.",
      },
      {
        title: "Retención y eliminación",
        body: "Los datos de la app permanecen en tu dispositivo hasta que los edites, los elimines o borres la app y sus datos locales de tu dispositivo.",
      },
      {
        title: "Google Play",
        body: "Done Loop se distribuye a través de Google Play, donde las descargas e interacciones de la tienda pueden regirse por las políticas de Google Play y los ajustes de tu cuenta de Google.",
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
