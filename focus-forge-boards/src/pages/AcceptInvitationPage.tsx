import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, token: authToken } = useAuth();
  const [invitationData, setInvitationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [showAccountChoice, setShowAccountChoice] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authToken) {
      // If user is already logged in, accept invitation directly
      acceptInvitationAsAuthenticatedUser();
    } else {
      // Show account choice screen
      setLoading(false);
      setShowAccountChoice(true);
    }
  }, [token, isAuthenticated, authToken]);

  const acceptInvitationAsAuthenticatedUser = async () => {
    try {
      setLoading(true);
      // For authenticated users, use the protected endpoint
      const response = await fetch(`/api/teams/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to accept invitation');
        setLoading(false);
        return;
      }

      setAccepted(true);
      toast.success('Invitation acceptée ! Vous avez rejoint l\'équipe.');

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      toast.error(err instanceof Error ? err.message : 'Failed to accept invitation');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      // Use the accept-invitation endpoint for new users
      const response = await fetch(`/api/teams/accept-invitation/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          fullName,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invitation');
      }

      setAccepted(true);
      toast.success('Compte créé et invitation acceptée !');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      toast.error(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex items-center justify-center min-h-48">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle>Invitation acceptée !</CardTitle>
            <CardDescription>Vous avez rejoint l'équipe.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirection vers l'accueil...
            </p>
            <Button asChild className="w-full" variant="gradient">
              <a href="/">Aller à l'accueil</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show account choice screen for non-authenticated users
  if (showAccountChoice && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accepter l'invitation</CardTitle>
            <CardDescription>
              Vous avez reçu une invitation à rejoindre une équipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Avez-vous déjà un compte Focus Forge ?
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => navigate(`/login?redirect=/accept-invitation/${token}`)}
                variant="outline"
                className="w-full"
              >
                Se connecter
              </Button>
              <Button
                onClick={() => navigate(`/signup?redirect=/accept-invitation/${token}`)}
                variant="gradient"
                className="w-full"
              >
                Créer un compte
              </Button>
            </div>
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground text-center">
                Vous serez redirigé vers l'acceptation d'invitation après la connexion
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Team Invitation</CardTitle>
          <CardDescription>
            Create your account to join the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              variant="gradient"
              disabled={submitting}
            >
              {submitting ? 'Creating Account...' : 'Accept Invitation & Create Account'}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Log in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
