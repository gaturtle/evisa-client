import type { NavSection } from "@/types/navigation";
import {
  Building2,
  Circle,
  Clock,
  FileText,
  RefreshCw,
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
        id: "project-labels",
        label: "Labels",
        icon: Tag,
      },
      {
        id: "project-templates",
        label: "Templates",
        icon: FileText,
      },
      {
        id: "statuses",
        label: "Statuses",
        icon: Circle,
      },
      {
        id: "updates",
        label: "Updates",
        icon: RefreshCw,
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
