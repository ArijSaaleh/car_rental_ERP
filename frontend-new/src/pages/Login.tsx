import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, ArrowRight, Shield, Zap, Globe, Star } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-12 flex-col justify-between overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(white 1px, transparent 1px),
            linear-gradient(90deg, white 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30">
              <Car className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">DriveFlow</h1>
              <p className="text-sm text-blue-100">Car Rental Excellence</p>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-6 max-w-xl">
            <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight">
              La gestion automobile
              <span className="block text-blue-200 mt-2">réinventée</span>
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Gérez l'intégralité de votre flotte avec une plateforme moderne, intuitive et puissante.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">100% Sécurisé</h4>
                  <p className="text-sm text-blue-100">Vos données protégées</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Ultra Rapide</h4>
                  <p className="text-sm text-blue-100">Performances optimales</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Multi-agences</h4>
                  <p className="text-sm text-blue-100">Gestion centralisée</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Support 24/7</h4>
                  <p className="text-sm text-blue-100">Assistance dédiée</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="relative z-10 flex items-center gap-8">
          <div className="flex items-center gap-8 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
            <div>
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-blue-100">Véhicules</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm text-blue-100">Réservations</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-sm text-blue-100">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">DriveFlow</h1>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Bienvenue
            </h2>
            <p className="text-gray-600 text-lg">
              Connectez-vous à votre espace
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="rounded-xl animate-scale-in">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Adresse email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-14 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-0 text-base text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </Label>
                <button
                  type="button"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 h-14 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-0 text-base text-gray-900"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 group"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Connexion en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  Se connecter
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="pt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-50 px-3 text-gray-500 font-medium">Comptes de démonstration</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
                <div className="text-xs font-semibold text-blue-900 mb-2">Super Admin</div>
                <div className="text-xs text-blue-700 font-mono">admin@example.com</div>
                <div className="text-xs text-blue-600 mt-1">password123</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200">
                <div className="text-xs font-semibold text-purple-900 mb-2">Propriétaire</div>
                <div className="text-xs text-purple-700 font-mono">owner@example.com</div>
                <div className="text-xs text-purple-600 mt-1">password123</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 pt-4">
            © 2026 DriveFlow - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
