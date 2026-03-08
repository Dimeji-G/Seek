"use client";

import { File, Moon, PlusIcon, Sun } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
// import useAuthStore from "@/store/auth.store";
// import authService from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { AppSidebar } from "../app-sidebar";
import authService from "@/services/auth.service";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();
  const route = useRouter();
  const logout = () => {
    authService.logout();
    route.push("/auth/login");
  };
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <main className="flex-1 relative min-h-screen bg-[#262626]">
        <div className="flex items-center gap-3 absolute right-[20px] top-[20px]">
          <SidebarTrigger className="md:hidden" />
          <PlusIcon width={20} height={20} />
          <File className="mr-[30px]" width={20} height={20} />
          <Button variant="outline" size="icon" onClick={logout}>
            Logout
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
