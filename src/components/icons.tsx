// Jeu d'icônes de ligne (façon Uber) pour la navigation.
// Monochromes : elles héritent de la couleur du texte (currentColor), donc
// blanches quand l'onglet est actif, grises sinon.

type IconProps = { name: string; className?: string };

export function Icon({ name, className = "h-6 w-6" }: IconProps) {
  const s = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...s}>
          <path d="M4 11 12 4l8 7" />
          <path d="M6 9.5V20h12V9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "orders":
      return (
        <svg {...s}>
          <path d="M21 8.5 12 3.5 3 8.5v7L12 20.5l9-5v-7Z" />
          <path d="M3 8.5 12 13.5l9-5" />
          <path d="M12 13.5v7" />
          <path d="M7.5 6 16.5 11" />
        </svg>
      );
    case "restaurants":
      return (
        <svg {...s}>
          <path d="M6 3v6a2 2 0 0 0 4 0V3" />
          <path d="M8 11v10" />
          <path d="M16 21V3c-2 .6-3 2.6-3 5.6 0 2.2 1.2 3.4 3 3.4" />
        </svg>
      );
    case "clients":
    case "users":
      return (
        <svg {...s}>
          <path d="M16 21v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
          <circle cx="9.5" cy="7.5" r="3.5" />
          <path d="M21 21v-1a4 4 0 0 0-3-3.87" />
          <path d="M16 3.7a3.5 3.5 0 0 1 0 6.8" />
        </svg>
      );
    case "profile":
      return (
        <svg {...s}>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M5.5 21v-1.2A6 6 0 0 1 11.5 14h1a6 6 0 0 1 6 5.8V21" />
        </svg>
      );
    case "share":
      return (
        <svg {...s}>
          <circle cx="18" cy="5" r="2.6" />
          <circle cx="6" cy="12" r="2.6" />
          <circle cx="18" cy="19" r="2.6" />
          <path d="M8.3 13.3 15.7 17.6" />
          <path d="M15.7 6.4 8.3 10.7" />
        </svg>
      );
    case "billing":
      return (
        <svg {...s}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M3 9.5h18" />
        </svg>
      );
    case "finance":
      return (
        <svg {...s}>
          <path d="M4 21h16" />
          <path d="M6.5 21V11" />
          <path d="M12 21V6" />
          <path d="M17.5 21v-7" />
        </svg>
      );
    case "bell":
      return (
        <svg {...s}>
          <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5" />
          <path d="M10 19.5a2.2 2.2 0 0 0 4 0" />
        </svg>
      );
    case "more":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      );
    default:
      return null;
  }
}
