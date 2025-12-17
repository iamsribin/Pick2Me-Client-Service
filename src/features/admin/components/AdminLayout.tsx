import React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/shared/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Car,
  Gift,
  PieChart,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { handleLogout } from "@/shared/utils/auth";
import { RootState } from "@/shared/services/redux/store";
// import { handleLogout } from '@/shared/utils/handleLogout';
interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const issueCount = useSelector(
    (state: RootState) => state.issues.unreadCount
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gray-50 text-gray-800">
        <Sidebar className="bg-white border-r border-gray-200 w-64 shadow-md">
          <SidebarHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Pick2Me</h2>
                <p className="text-xs text-blue-100">Admin Panel</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="py-8">
            <SidebarMenu className="space-y-3 px-4">
              {[
                {
                  to: "/admin/dashboard",
                  icon: LayoutDashboard,
                  label: "Dashboard",
                },
                { to: "/admin/users", icon: Users, label: "Users" },
                { to: "/admin/drivers", icon: Car, label: "Drivers" },
                { to: "/admin/offers", icon: Gift, label: "Offers" },
                {
                  to: "/admin/issues",
                  icon: PieChart,
                  label: "Issues",
                  showCount: true,
                },
              ].map((item) => {
                const isActive = location.pathname.startsWith(item.to);

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      className={`w-full py-3 px-4 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Link
                        to={item.to}
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex items-center">
                          <item.icon className="h-5 w-5 mr-3" />
                          <span>{item.label}</span>
                        </div>

                        {item.showCount && issueCount > 0 && (
                          <span className="relative">
                            <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full animate-pulse">
                              {issueCount}
                            </span>
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-gray-200">
            <SidebarMenuButton
              className="w-full py-3 px-4 rounded-xl text-gray-600 hover:bg-gray-100 transition-all duration-300"
              onClick={() => {
                handleLogout();
              }}
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
            <SidebarTrigger className="md:hidden text-gray-600 hover:bg-gray-100 rounded-lg p-2" />
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 hidden md:block">
                Admin Panel
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">A</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-hidden bg-gray-50">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
