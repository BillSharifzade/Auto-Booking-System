import { LayoutDashboard, Car, Users, FileText, Building2, Briefcase, Shield, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Главная", url: "/", icon: LayoutDashboard },
  { title: "Автомобили", url: "/cars", icon: Car },
  { title: "Водители", url: "/drivers", icon: Users },
  { title: "Типы заявок", url: "/types", icon: FileText },
  { title: "Отделы", url: "/departments", icon: Building2 },
  { title: "Должности", url: "/positions", icon: Briefcase },
  { title: "Администраторы", url: "/admins", icon: Shield },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { user, logout } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-6 py-4">
          <h1 className={`font-bold text-sidebar-foreground transition-opacity ${open ? 'text-xl' : 'text-sm text-center'}`}>
            {open ? 'Админ-панель' : 'КТ'}
          </h1>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Меню</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              tooltip="Выйти"
            >
              <LogOut className="h-5 w-5" />
              <span className="truncate">{open ? `Выйти (${user.name})` : 'Выйти'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
