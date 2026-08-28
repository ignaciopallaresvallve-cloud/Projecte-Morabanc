"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { cn } from "@/utils/cn";
import { Container } from "@/components/ui/Container";
import { CartButton } from "@/components/cart/CartButton";
import { Navigation } from "./Navigation";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const scrolled = useScrollPosition();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-surface/95 backdrop-blur transition-shadow duration-200",
        scrolled ? "border-border shadow-soft" : "border-transparent"
      )}
    >
      <Container className="relative flex h-16 items-center justify-between sm:h-20">
        <Link href="/" className="flex items-center" aria-label="Anar a l'inici">
          <Logo />
        </Link>

        <Navigation className="hidden items-center gap-8 md:flex" />

        <div className="flex items-center gap-1 sm:gap-2">
          <CartButton />
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
