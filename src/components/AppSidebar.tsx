import {
  Calendar as CalendarIcon,
  Users,
  BarChart3,
  Wallet,
  ClipboardList,
  Printer,
  Package,
  CalendarClock,
  MessageSquare,
  FlaskRound,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  hideForReception?: boolean;
  badge?: number;
}

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
  isReception: boolean;
  unreadCount?: number;
}

const navItems: NavItem[] = [
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'patients', label: 'Pacienți', icon: Users },
  { id: 'reports', label: 'Rapoarte', icon: BarChart3, hideForReception: true },
  { id: 'expenses', label: 'Cheltuieli', icon: Wallet, adminOnly: true },
  { id: 'treatment-plan', label: 'Plan Tratament', icon: ClipboardList },
  { id: 'printabile', label: 'Printabile', icon: Printer },
  { id: 'stock', label: 'Stoc', icon: Package },
  { id: 'schedule', label: 'Program', icon: CalendarClock },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'laborator', label: 'Laborator', icon: FlaskRound },
];

export function AppSidebar({ activeTab, onTabChange, isAdmin, isReception, unreadCount = 0 }: AppSidebarProps) {
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.hideForReception && isReception) return false;
    return true;
  });

  const handleClick = (id: string) => {
    onTabChange(id);
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badge = item.id === 'whatsapp' ? unreadCount : 0;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => handleClick(item.id)}
                      className="relative"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                      {badge > 0 && (
                        <span className={`absolute ${isCollapsed ? 'top-0 right-0' : 'right-2'} flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium px-1`}>
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
