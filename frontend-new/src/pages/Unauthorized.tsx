import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-20 w-20 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Accès refusé
          </h2>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              Retour
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
