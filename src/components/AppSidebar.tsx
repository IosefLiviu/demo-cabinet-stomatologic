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
  Bell,
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
  badgeType?: 'whatsapp' | 'reminders';
  iconColor?: string;
}

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
  isReception: boolean;
  unreadCount?: number;
  pendingRemindersCount?: number;
}

const navItems: NavItem[] = [
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon, iconColor: 'text-blue-500' },
  { id: 'patients', label: 'Pacienți', icon: Users, iconColor: 'text-indigo-500' },
  { id: 'reports', label: 'Rapoarte', icon: BarChart3, hideForReception: true, iconColor: 'text-purple-500' },
  { id: 'expenses', label: 'Cheltuieli', icon: Wallet, adminOnly: true, iconColor: 'text-red-500' },
  { id: 'treatment-plan', label: 'Plan Tratament', icon: ClipboardList, iconColor: 'text-cyan-500' },
  { id: 'printabile', label: 'Printabile', icon: Printer, iconColor: 'text-slate-500' },
  { id: 'stock', label: 'Stoc', icon: Package, iconColor: 'text-amber-600' },
  { id: 'schedule', label: 'Program', icon: CalendarClock, iconColor: 'text-teal-500' },
  { id: 'laborator', label: 'Laborator', icon: FlaskRound, iconColor: 'text-pink-500' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, badgeType: 'whatsapp', iconColor: 'text-green-500' },
  { id: 'reminders', label: 'Rechemări', icon: Bell, badgeType: 'reminders', iconColor: 'text-orange-500' },
];

export function AppSidebar({ activeTab, onTabChange, isAdmin, isReception, unreadCount = 0, pendingRemindersCount = 0 }: AppSidebarProps) {
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
                const badge = item.badgeType === 'whatsapp' ? unreadCount : item.badgeType === 'reminders' ? pendingRemindersCount : 0;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => handleClick(item.id)}
                      className="relative"
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${item.iconColor || ''}`} />
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
