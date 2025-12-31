import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Plus,
  Moon,
  Sun,
  Calendar as CalendarIcon,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Collab Task', path: '/' },
  { icon: FolderKanban, label: 'Projets', path: '/projects' },
  { icon: CalendarIcon, label: 'Calendrier', path: '/calendar' },
  { icon: Users, label: 'Équipe', path: '/team' },
  { icon: Mail, label: 'Invitations', path: '/invitations' },
  { icon: Settings, label: 'Paramètres', path: '/settings' },
];

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchPendingInvitations = async () => {
      try {
        const token = localStorage.getItem('authToken');

        // Fetch team invitations
        const teamResponse = await fetch('/api/teams/invitations/pending', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        let teamCount = 0;
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          teamCount = teamData.data?.length || 0;
        }

        // Fetch project invitations
        const projectResponse = await fetch('/api/projects/invitations/pending', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        let projectCount = 0;
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          projectCount = projectData.invitations?.length || 0;
        }

        // Set total count
        setPendingInvitationsCount(teamCount + projectCount);
      } catch (error) {
        console.error('Error fetching pending invitations:', error);
      }
    };

    if (user) {
      fetchPendingInvitations();
    }
  }, [user]);

  const getInitials = (fullName: string) => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className={cn("flex items-center justify-between", collapsed && "justify-center")}>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <FolderKanban className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-lg gradient-text whitespace-nowrap">trello cop</span>
            )}
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className={cn("shrink-0", collapsed && "absolute right-2")}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", collapsed && "rotate-180")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Dépiler" : "Plier"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {!collapsed && (
          <Button variant="gradient" className="w-full mb-4" asChild>
            <Link to="/projects/new">
              <Plus className="w-4 h-4" />
              Nouveau projet
            </Link>
          </Button>
        )}
        
        {collapsed && (
          <Button variant="gradient" size="icon" className="w-full mb-4" asChild>
            <Link to="/projects/new">
              <Plus className="w-4 h-4" />
            </Link>
          </Button>
        )}

        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const showBadge = item.path === '/invitations' && pendingInvitationsCount > 0;

          const navItem = (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative w-full",
                "hover:bg-sidebar-accent",
                collapsed && "justify-center",
                isActive && "bg-sidebar-accent text-sidebar-primary"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={cn("font-medium truncate", isActive && "text-primary")}>
                    {item.label}
                  </span>
                  {showBadge && (
                    <span className="ml-auto px-2 py-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full flex-shrink-0">
                      {pendingInvitationsCount}
                    </span>
                  )}
                </div>
              )}
              {collapsed && showBadge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              )}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                {navItem}
              </TooltipTrigger>
              <TooltipContent side="right">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            navItem
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        {/* Theme Toggle */}
        {!collapsed && (
          <Button
            variant="outline"
            className="w-full flex items-center justify-between"
            onClick={toggleTheme}
          >
            <span className="text-sm">Mode</span>
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>
        )}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full"
                onClick={toggleTheme}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* User Info */}
        <div className={cn("flex items-center gap-3 w-full", collapsed && "justify-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 cursor-help">
                <span className="text-sm font-medium text-secondary-foreground">
                  {user ? getInitials(user.fullName) : 'U'}
                </span>
              </div>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                {user?.fullName || 'User'}
              </TooltipContent>
            )}
          </Tooltip>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || ''}
              </p>
            </div>
          )}
          {!collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Déconnexion
              </TooltipContent>
            </Tooltip>
          )}
          {collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-4 left-1/2 -translate-x-1/2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Déconnexion
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </aside>
  );
}
