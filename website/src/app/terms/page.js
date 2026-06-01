import { LegalPage } from "../shared/legal-page";

const content = {
  en: {
    title: "Terms of Service",
    intro:
      "These terms describe the basic conditions for using the Done Loop mobile app.",
    sections: [
      {
        title: "Using Done Loop",
        body: "Done Loop is a productivity app for managing habits, tasks, calendar context, and local reminders. You are responsible for how you use the app and for keeping your device secure.",
      },
      {
        title: "Local-first data",
        body: "Done Loop stores app data locally on your device. You are responsible for managing your device, backups, and any data you choose to enter into the app.",
      },
      {
        title: "Free app",
        body: "Done Loop is offered as a free productivity app with no ads, memberships, subscriptions, or in-app purchases.",
      },
      {
        title: "Notifications",
        body: "Reminders depend on your device permissions, system settings, and operating system behavior. Done Loop cannot guarantee that notifications will arrive at an exact time or in every device state.",
      },
      {
        title: "Open source",
        body: "The source code is available at https://github.com/AddisonReyes/done-loop. Use, copying, forks, modifications, and contributions to the code are governed by the repository license and contribution terms, not by these terms for using the installed app.",
      },
      {
        title: "Acceptable use",
        body: "Do not use Done Loop or its published code for abuse, harm, unlawful activity, attempts to disrupt devices or services, or to falsely represent an unofficial version as the official Done Loop app.",
      },
      {
        title: "No professional advice",
        body: "Done Loop is a productivity tool. It does not provide medical, legal, financial, or professional advice.",
      },
      {
        title: "Changes",
        body: "These terms may be updated as the app, its listing, or its distribution changes. Continued use means you accept the latest version.",
      },
      {
        title: "Contact",
        body: "Questions about these terms can be directed to Addison Reyes through addisonreyes.com.",
      },
    ],
  },
  es: {
    title: "Términos de Servicio",
    intro:
      "Estos términos describen las condiciones básicas para usar la app móvil Done Loop.",
    sections: [
      {
        title: "Uso de Done Loop",
        body: "Done Loop es una app de productividad para gestionar hábitos, tareas, contexto de calendario y recordatorios locales. Eres responsable de cómo usas la app y de mantener seguro tu dispositivo.",
      },
      {
        title: "Datos locales",
        body: "Done Loop guarda los datos de la app localmente en tu dispositivo. Eres responsable de administrar tu dispositivo, tus copias de seguridad y cualquier dato que decidas introducir en la app.",
      },
      {
        title: "App gratuita",
        body: "Done Loop se ofrece como una app de productividad gratuita, sin anuncios, membresías, suscripciones ni compras dentro de la app.",
      },
      {
        title: "Notificaciones",
        body: "Los recordatorios dependen de los permisos del dispositivo, los ajustes del sistema y el comportamiento del sistema operativo. Done Loop no puede garantizar que las notificaciones lleguen a una hora exacta o en todos los estados del dispositivo.",
      },
      {
        title: "Código abierto",
        body: "El código fuente está disponible en https://github.com/AddisonReyes/done-loop. El uso, copia, forks, modificaciones y contribuciones al código se rigen por la licencia y los términos de contribución del repositorio, no por estos términos de uso de la app instalada.",
      },
      {
        title: "Uso aceptable",
        body: "No uses Done Loop ni su código publicado para abuso, daño, actividades ilegales, intentos de interrumpir dispositivos o servicios, ni para representar falsamente una versión no oficial como la app oficial de Done Loop.",
      },
      {
        title: "Sin asesoría profesional",
        body: "Done Loop es una herramienta de productividad. No proporciona asesoría médica, legal, financiera ni profesional.",
      },
      {
        title: "Cambios",
        body: "Estos términos pueden actualizarse conforme cambien la app, su ficha o su distribución. El uso continuo significa que aceptas la versión más reciente.",
      },
      {
        title: "Contacto",
        body: "Las preguntas sobre estos términos pueden dirigirse a Addison Reyes a través de addisonreyes.com.",
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
