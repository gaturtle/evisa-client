import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  component?: ComponentType;
  href?: string;
  badge?: string;
  badgeVariant?: "warning" | "destructive";
  active?: boolean;
}

export interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
  adminOnly?: boolean;
}

export interface FooterNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  variant?: "default" | "warning";
}
