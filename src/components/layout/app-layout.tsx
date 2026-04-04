import { Outlet } from "react-router";
import { SidebarProvider } from "@/context/sidebar-context";
import { DesktopSidebar, MobileHeader, MobileDrawer } from "./app-sidebar";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <DesktopSidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileHeader />

          <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>

        <MobileDrawer />
      </div>
    </SidebarProvider>
  );
}
