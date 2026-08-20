"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import {
  Home,
  Users,
  Wallet,
  Calculator,
  ChevronDown,
  FileText,
  Folder,
  ReceiptText,
  User,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: typeof Home;
  href: string;
}

const navGroups: { items: NavItem[] }[] = [
  {
    items: [
      { label: "Home", icon: Home, href: "/" },
      { label: "Customers", icon: Users, href: "/customers" },
      { label: "Payments", icon: Wallet, href: "/payments" },
      { label: "Billing", icon: ReceiptText, href: "/billing" },
      { label: "FX Calc", icon: Calculator, href: "/fx" },
    ],
  },
  {
    items: [
      // { label: "Webhooks", icon: Webhook, href: "/webhooks" },
      { label: "Documentation", icon: FileText, href: "/documentation" },
    ],
  },
  {
    items: [
      { label: "Profile", icon: User, href: "/profile" },
    ],
  },
];

interface SidebarProps {
  active?: string;
}

export default function Sidebar(_props: SidebarProps) {
  return null;
}
