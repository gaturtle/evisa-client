import type { NavSection } from "@/types/navigation";
import { Building2, CalendarDays, FileText, Shield, Tag } from "lucide-react";

export const navigationSections: NavSection[] = [
  {
    id: "nationalities",
    title: "nationalities",
    items: [
      {
        id: "nationality-labels",
        label: "Nationalities",
        icon: Tag,
      },
      {
        id: "holidays",
        label: "Holidays",
        icon: CalendarDays,
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    items: [
      {
        id: "Type-setup",
        label: "Type setup",
        icon: Tag,
      },
      {
        id: "Processing-setup",
        label: "Processing setup",
        icon: FileText,
      },
    ],
  },
  {
    id: "Application",
    title: "Application",
    items: [
      {
        id: "Application-list",
        label: "Applications",
        icon: Building2,
      },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    adminOnly: true,
    items: [
      {
        id: "users",
        label: "Users",
        icon: Shield,
      },
    ],
  },
];
