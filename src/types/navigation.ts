import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: string;
  badgeVariant?: "warning" | "destructive";
  active?: boolean;
}

export interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
}

export interface FooterNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  variant?: "default" | "warning";
}
