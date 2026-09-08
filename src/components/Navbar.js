"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { IoClose, IoMenu } from "react-icons/io5";
import { FiMoon, FiSun, FiLogOut, FiDollarSign, FiPlus, FiUser } from "react-icons/fi";
import { SiVercel } from "react-icons/si";
import config from '../lib/config';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <span className="text-xl font-bold">P</span>
          </div>
          <span className="text-xl font-bold">{config.appName}</span>
        </Link>
        {/* Resto del navbar... */}
      </div>
    </header>
  );
}

