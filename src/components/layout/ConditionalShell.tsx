"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { ReactNode } from "react";

/**
 * Renderiza Header e Footer apenas em rotas que não sejam
 * do grupo /auth/* (login, cadastro, verificar-email, etc.).
 */
export default function ConditionalShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/auth");
  const isAnuncieRoute = pathname === "/anuncie";

  if (isAuthRoute || isAnuncieRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
