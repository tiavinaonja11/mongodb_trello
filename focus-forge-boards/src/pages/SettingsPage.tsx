import { User, Bell, Shield, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth, NotificationPreferences } from '@/contexts/AuthContext';
import { currentUser } from '@/data/mockData';

const SettingsPage = () => {
  const { user, changePassword, updateProfile, getNotificationPreferences, updateNotificationPreferences } = useAuth();
  const [fullName, setFullName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    newComments: true,
    ticketAssignment: true,
  });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user]);

  useEffect(() => {
    const loadNotificationPreferences = async () => {
      try {
        const prefs = await getNotificationPreferences();
        setNotificationPrefs(prefs);
      } catch (error) {
        toast.error('Impossible de charger les préférences de notification');
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    loadNotificationPreferences();
  }, [getNotificationPreferences]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Le nom complet est requis');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile(fullName);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNotificationToggle = async (key: keyof NotificationPreferences) => {
    const newPrefs = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key],
    };

    setNotificationPrefs(newPrefs);
    setIsSavingNotifications(true);

    try {
      await updateNotificationPreferences(newPrefs);
      toast.success('Préférences de notification mises à jour');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour des préférences');
      setNotificationPrefs(notificationPrefs);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Tous les champs de mot de passe sont requis');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Mot de passe changé avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez vos préférences et votre profil.
          </p>
        </div>

        {/* Profile Section */}
        <section className="ticket-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Profil</h2>
          </div>
          <Separator />

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Sauvegarde en cours...' : 'Sauvegarder'}
              </Button>
            </div>
          </form>
        </section>

        {/* Notifications Section */}
        <section className="ticket-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          </div>
          <Separator />

          {isLoadingNotifications ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Chargement des préférences...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Notifications par email</p>
                  <p className="text-sm text-muted-foreground">Recevoir des emails pour les mises à jour importantes</p>
                </div>
                <Switch
                  checked={notificationPrefs.emailNotifications}
                  onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                  disabled={isSavingNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Nouveaux commentaires</p>
                  <p className="text-sm text-muted-foreground">Être notifié des nouveaux commentaires sur vos tickets</p>
                </div>
                <Switch
                  checked={notificationPrefs.newComments}
                  onCheckedChange={() => handleNotificationToggle('newComments')}
                  disabled={isSavingNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Assignation de tickets</p>
                  <p className="text-sm text-muted-foreground">Être notifié quand un ticket vous est assigné</p>
                </div>
                <Switch
                  checked={notificationPrefs.ticketAssignment}
                  onCheckedChange={() => handleNotificationToggle('ticketAssignment')}
                  disabled={isSavingNotifications}
                />
              </div>
            </div>
          )}
        </section>

        {/* Security Section */}
        <section className="ticket-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Sécurité</h2>
          </div>
          <Separator />

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="outline"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Changement en cours...' : 'Changer le mot de passe'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
