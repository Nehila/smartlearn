"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconBook,
  IconChartBar,
  IconClipboardCheck,
  IconDashboard,
  IconFileText,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconSettings,
  IconClipboard,
  IconLogout,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavDocuments } from "@/components/nav-documents"
import { Button } from "@/components/ui/button"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard", // student dashboard
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Learning Path", // was Lifecycle
      url: "/learning-path",
      icon: IconListDetails,
    },
    {
      title: "My Courses", // was Projects
      url: "/courses",
      icon: IconFolder,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Help & FAQ", // small rename
      url: "#",
      icon: IconHelp,
    },
  ],
  documents: [
    {
      name: "Generate Courses",
      url: "/generate/courses",
      icon: IconBook,
    },
    {
      name: "Generate Summaries",
      url: "/generate/summaries",
      icon: IconFileText,
    },
    {
      name: "Generate Exercises",
      url: "/generate/exercises",
      icon: IconClipboardCheck,
    },
  ],
  aiWorkspace: [
    {
      name: "Generate Courses",
      description: "Full outlines tailored to you",
      url: "/generate/courses",
      icon: IconBook,
    },
    {
      name: "Generate Summaries",
      description: "Condense lessons and papers",
      url: "/generate/summaries",
      icon: IconFileText,
    },
    {
      name: "Generate Exercises",
      description: "Build quizzes and practice sets",
      url: "/generate/exercises",
      icon: IconClipboardCheck,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()

  const handleLogout = () => {
    // Clear authentication
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Redirect to login
    router.push('/login')
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! rounded-xl border border-blue-100 bg-blue-50/80 text-blue-900 shadow-sm"
            >
              <a href="#">
                <IconInnerShadowTop className="size-5 text-blue-600" />
                <span className="text-base font-semibold tracking-tight">
                  SmartLearn
                </span>
                <span className="ml-auto rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  Beta
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 pb-3">
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <Button
          variant="outline"
          className="w-full justify-start text-sm font-medium"
          onClick={handleLogout}
        >
          <IconLogout className="mr-2 size-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
