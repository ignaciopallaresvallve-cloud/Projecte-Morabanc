import type { NavItem, SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "MoraBanc Office Store",
  shortName: "Office Store",
  description:
    "Plataforma interna de MoraBanc per a la gestió i venda de mobiliari d'oficina.",
};

export const mainNavItems: NavItem[] = [
  { label: "Inici", href: "/" },
  { label: "Catàleg", href: "/catalogo" },
];

/** Màxim d'unitats que es poden sol·licitar en un mateix carret (política de negoci). */
export const MAX_CART_UNITS = 3;

export const CART_STORAGE_KEY = "morabanc-office-store:cart";

/** Màxim d'imatges que es poden pujar per producte. */
export const MAX_PRODUCT_IMAGES = 10;

/** Mida màxima (en bytes) per a cada imatge de producte. */
export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
