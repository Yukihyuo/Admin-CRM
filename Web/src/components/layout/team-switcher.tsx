"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/authStore"

import { ChevronsUpDown, Home } from "lucide-react"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { access, activeStore, setActiveStore } = useAuthStore()

  const stores = access?.stores ?? []
  const selectedStore = activeStore ?? stores[0] ?? null
  const selectedStoreId = selectedStore?._id ?? selectedStore?.id ?? ""

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Home className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{selectedStore?.name ?? "Sin sede"}</span>
                <span className="truncate text-xs">{stores.length ? `${stores.length} sedes` : "Sin acceso"}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel>Sedes</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={selectedStoreId} onValueChange={setActiveStore}>
              {stores.map((store) => {
                const storeId = store._id ?? store.id

                if (!storeId) {
                  return null
                }

                return (
                  <DropdownMenuRadioItem key={storeId} value={storeId}>
                    {store.name}
                  </DropdownMenuRadioItem>
                )
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
