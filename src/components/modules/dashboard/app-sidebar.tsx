"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Clock,
  Settings,
  Building2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"

import { useAppSelector } from "@/store/hooks"
import type { NavItem } from "@/types/navigation.types"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)

  // Show loading/minimal sidebar while auth is checking
  if (!isAuthenticated) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </SidebarHeader>
        <SidebarContent>
          <div className="space-y-4 p-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    )
  }

  // ────────────────────────────────────────────────
  // User & Organization Data
  // ────────────────────────────────────────────────
  const data = React.useMemo(
    () => ({
      user: {
        name: user?.organizationName ?? "Your Clinic",
        email: user?.email ?? "admin@clinic.com",
        avatar: user?.organizationLogo ?? "/default-clinic-logo.png", // fallback image
      },
      teams: [
        {
          name: user?.organizationName ?? "Clinic",
          logo: user?.organizationLogo ?? "/default-clinic-logo.png",
          // logo: Building2,           // suitable icon for organization/clinic
          plan: "Organization Admin", // can be removed or made dynamic later
        },
      ],
    }),
    [user]
  )

  // ────────────────────────────────────────────────
  // Navigation Items – relevant to appointment queue system
  // ────────────────────────────────────────────────
  const navMain: NavItem[] = React.useMemo(
    () => [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Appointments",
        url: "/dashboard/appointments",
        icon: Calendar,
      },
      {
        title: "Queue Manager",
        url: "/dashboard/queue",
        icon: Clock,
      },
      {
        title: "Services",
        url: "/dashboard/services",
        icon: Scissors,
      },
      {
        title: "Staff",
        url: "/dashboard/staff",
        icon: Users,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
    []
  )

  // ────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}