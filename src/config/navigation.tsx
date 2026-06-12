import type { NavSection } from "@/types/navigation";
import {
  Building2,
  CalendarDays,
  FileText,
  Tag,
  UserCheck,
  Users,
} from "lucide-react";

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
        id: "nationality-exemption",
        label: "Exemption",
        icon: FileText,
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
      {
        id: "teams",
        label: "Teams",
        icon: Users,
      },
      {
        id: "members",
        label: "Members",
        icon: UserCheck,
      },
    ],
  },
];
