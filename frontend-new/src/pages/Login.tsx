import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, ArrowRight, Star, TrendingUp, Users, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
        navigate('/owner/dashboard');
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
    <div className="min-h-screen w-full relative bg-black flex items-center justify-center p-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-slate-900/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s' }}></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '9s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]"></div>
        
        {/* Dot Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-12">
            {/* Logo */}
            <div className="inline-flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-50"></div>
                <div className="relative p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                  <Car className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">DriveFlow</h1>
                <p className="text-sm text-gray-400">Fleet Management Platform</p>
              </div>
            </div>

            {/* Hero Text */}
            <div className="space-y-6">
              <h2 className="text-6xl font-bold leading-tight">
                <span className="text-white">Gérez votre</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                  flotte automobile
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-lg">
                Plateforme SaaS moderne pour une gestion complète de vos véhicules, réservations et analyses
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-xs text-gray-500">Véhicules actifs</div>
              </div>
              <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-xs text-gray-500">Réservations</div>
              </div>
              <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-white">98%</div>
                <div className="text-xs text-gray-500">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <div className="inline-flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">DriveFlow</h1>
              </div>
            </div>

            {/* Login Card */}
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              
              {/* Card */}
              <div className="relative bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-10">
                {/* Header */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-400 font-medium">CONNEXION SÉCURISÉE</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    Bienvenue de retour
                  </h3>
                  <p className="text-gray-400">
                    Connectez-vous pour accéder à votre tableau de bord
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/50">
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                      Adresse email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-blue-500/50 rounded-xl transition-all"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                        Mot de passe
                      </Label>
                      <button
                        type="button"
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-12 pr-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-blue-500/50 rounded-xl transition-all"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 group"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Connexion...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Se connecter
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-gray-900 text-gray-500">COMPTES DE TEST</span>
                  </div>
                </div>

                {/* Demo Credentials */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors">
                    <div className="text-xs font-semibold text-blue-400 mb-1">Admin</div>
                    <div className="text-[10px] text-gray-500 font-mono">admin@example.com</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">password123</div>
                  </div>
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors">
                    <div className="text-xs font-semibold text-blue-400 mb-1">Owner</div>
                    <div className="text-[10px] text-gray-500 font-mono">owner@example.com</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">password123</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600 mt-6">
              © 2026 DriveFlow. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


