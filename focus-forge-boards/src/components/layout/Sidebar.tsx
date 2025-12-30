import { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Collab Task', path: '/' },
  { icon: FolderKanban, label: 'Projets', path: '/projects' },
  { icon: CalendarIcon, label: 'Calendrier', path: '/calendar' },
  { icon: Users, label: 'Équipe', path: '/team' },
  { icon: Mail, label: 'Invitations', path: '/invitations' },
  { icon: Settings, label: 'Paramètres', path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
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
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-lg gradient-text">trello cop</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
          </Button>
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

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative",
                "hover:bg-sidebar-accent",
                isActive && "bg-sidebar-accent text-sidebar-primary"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <div className="flex items-center gap-2 flex-1">
                  <span className={cn("font-medium", isActive && "text-primary")}>
                    {item.label}
                  </span>
                  {showBadge && (
                    <span className="ml-auto px-2 py-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
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
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* User Info */}
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-secondary-foreground">
              {user ? getInitials(user.fullName) : 'U'}
            </span>
          </div>
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
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
