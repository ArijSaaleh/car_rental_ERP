import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { authService } from '../services/auth.service';
import { extractErrorMessage } from '../utils/errorHandler';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login({ email, password });
      const user = await authService.getCurrentUser();
      
      // Redirect based on user role
      if (user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'proprietaire') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-8 py-12 text-center">
          <div className="mb-8">
            <div className="inline-flex p-6 rounded-3xl bg-primary/20 border-2 border-primary/50 shadow-2xl shadow-primary/20">
              <Car className="h-24 w-24 text-primary" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4">
            Car Rental ERP
          </h1>
          
          <p className="text-xl text-slate-300 max-w-md mb-12">
            Solution complète de gestion de location de véhicules
          </p>
          
          <div className="grid grid-cols-1 gap-4 max-w-sm w-full">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
              <p className="text-white font-semibold mb-1">Gestion de Flotte</p>
              <p className="text-slate-400 text-sm">Gérez vos véhicules efficacement</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
              <p className="text-white font-semibold mb-1">Réservations</p>
              <p className="text-slate-400 text-sm">Suivez toutes vos locations</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
              <p className="text-white font-semibold mb-1">Rapports & Analytics</p>
              <p className="text-slate-400 text-sm">Analysez vos performances</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center bg-white dark:bg-slate-950 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="p-4 rounded-full bg-primary/10 border-2 border-primary">
              <Car className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Connexion
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Connectez-vous à votre compte pour continuer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-200 font-medium">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 font-medium">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 text-base mt-6"
              disabled={loading}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Version 1.0.0 - Car Rental Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
