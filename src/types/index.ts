export interface NavItem {
  label: string;
  href: string;
  /** Marca el enlace como no disponible todavía (fase futura del proyecto). */
  disabled?: boolean;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  description: string;
}
