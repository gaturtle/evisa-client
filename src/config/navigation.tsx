import type { NavSection } from "@/types/navigation";
import {
  Building2,
  Clock,
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
        id: "slas",
        label: "SLAs",
        icon: Clock,
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
    id: "administration",
    title: "Administration",
    items: [
      {
        id: "workspace",
        label: "Workspace",
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
