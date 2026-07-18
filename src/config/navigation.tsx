import type { NavSection } from "@/types/navigation";
import { NationalitiesPage } from "@/pages/nationalities";
import { NationalityGroupsPage } from "@/pages/nationality-groups";
import { VisaTypesPage } from "@/pages/visa-types";
import { VisaProcessingsPage } from "@/pages/visa-processings";
import { ApplicationsPage } from "@/pages/applications";
import { HolidaysPage } from "@/pages/holidays";
import { UsersPage } from "@/pages/users";
import { CategoriesPage } from "@/pages/categories";
import { PostsPage } from "@/pages/posts";
import { Building2, CalendarDays, FileText, FolderOpen, Newspaper, Shield, Tag, Users } from "lucide-react";

export const navigationSections: NavSection[] = [
  {
    id: "nationalities",
    title: "nationalities",
    items: [
      {
        id: "nationality-labels",
        label: "Nationalities",
        icon: Tag,
        component: NationalitiesPage,
      },
      {
        id: "nationality-groups",
        label: "Nationality Groups",
        icon: Users,
        component: NationalityGroupsPage,
      },
      {
        id: "holidays",
        label: "Holidays",
        icon: CalendarDays,
        component: HolidaysPage,
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
        component: VisaTypesPage,
      },
      {
        id: "Processing-setup",
        label: "Processing setup",
        icon: FileText,
        component: VisaProcessingsPage,
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
        component: ApplicationsPage,
      },
    ],
  },
  {
    id: "content",
    title: "Content",
    items: [
      {
        id: "categories",
        label: "Categories",
        icon: FolderOpen,
        component: CategoriesPage,
      },
      {
        id: "posts",
        label: "Posts",
        icon: Newspaper,
        component: PostsPage,
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
        component: UsersPage,
      },
    ],
  },
];
