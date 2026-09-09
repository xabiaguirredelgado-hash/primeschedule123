"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import config from '../lib/config';

export function Providers({ children }) {
  useEffect(() => {
    // Inicializar configuraciones
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}



