import { useState, useEffect } from 'react';
import { Save, Database, Shield, Bell, Mail, Globe, Server } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import api from '../../services/api';

export default function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // System Settings
  const [settings, setSettings] = useState({
    // General
    app_name: 'Car Rental ERP',
    app_version: '1.0.0',
    maintenance_mode: false,
    
    // Email
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: '',
    
    // Database
    backup_enabled: true,
    backup_frequency: 'daily',
    backup_retention_days: '30',
    
    // Security
    password_min_length: '8',
    session_timeout: '30',
    max_login_attempts: '5',
    two_factor_enabled: false,
    
    // Notifications
    email_notifications: true,
    sms_notifications: false,
    push_notifications: false,
    
    // API
    api_rate_limit: '100',
    api_timeout: '30',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data) {
        setSettings((prev) => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres');
    }
  };

  const handleSave = async (section: string) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/admin/settings', { section, settings });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Paramètres Système
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Configuration globale de la plateforme
        </p>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Paramètres enregistrés avec succès
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Paramètres Généraux</CardTitle>
          </div>
          <CardDescription>Configuration de base de l'application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="app_name">Nom de l'application</Label>
              <Input
                id="app_name"
                value={settings.app_name}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app_version">Version</Label>
              <Input
                id="app_version"
                value={settings.app_version}
                onChange={(e) => setSettings({ ...settings, app_version: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('general')} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Configuration Email (SMTP)</CardTitle>
          </div>
          <CardDescription>Paramètres d'envoi d'emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">Serveur SMTP</Label>
              <Input
                id="smtp_host"
                placeholder="smtp.gmail.com"
                value={settings.smtp_host}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_port">Port</Label>
              <Input
                id="smtp_port"
                value={settings.smtp_port}
                onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_user">Utilisateur</Label>
              <Input
                id="smtp_user"
                type="email"
                value={settings.smtp_user}
                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_password">Mot de passe</Label>
              <Input
                id="smtp_password"
                type="password"
                value={settings.smtp_password}
                onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_from_email">Email expéditeur</Label>
              <Input
                id="smtp_from_email"
                type="email"
                value={settings.smtp_from_email}
                onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_from_name">Nom expéditeur</Label>
              <Input
                id="smtp_from_name"
                value={settings.smtp_from_name}
                onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('email')} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Sauvegardes Base de Données</CardTitle>
          </div>
          <CardDescription>Configuration des sauvegardes automatiques</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backup_frequency">Fréquence</Label>
              <Select
                value={settings.backup_frequency}
                onValueChange={(value) =>
                  setSettings({ ...settings, backup_frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Toutes les heures</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup_retention_days">Rétention (jours)</Label>
              <Input
                id="backup_retention_days"
                type="number"
                value={settings.backup_retention_days}
                onChange={(e) =>
                  setSettings({ ...settings, backup_retention_days: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Créer une sauvegarde maintenant
            </Button>
            <Button onClick={() => handleSave('database')} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Sécurité</CardTitle>
          </div>
          <CardDescription>Paramètres de sécurité et authentification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password_min_length">
                Longueur minimale mot de passe
              </Label>
              <Input
                id="password_min_length"
                type="number"
                value={settings.password_min_length}
                onChange={(e) =>
                  setSettings({ ...settings, password_min_length: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_login_attempts">Tentatives de connexion max</Label>
              <Input
                id="max_login_attempts"
                type="number"
                value={settings.max_login_attempts}
                onChange={(e) =>
                  setSettings({ ...settings, max_login_attempts: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session_timeout">Timeout session (minutes)</Label>
              <Input
                id="session_timeout"
                type="number"
                value={settings.session_timeout}
                onChange={(e) =>
                  setSettings({ ...settings, session_timeout: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('security')} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <CardTitle>Configuration API</CardTitle>
          </div>
          <CardDescription>Limites et paramètres API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api_rate_limit">
                Rate Limit (requêtes/minute)
              </Label>
              <Input
                id="api_rate_limit"
                type="number"
                value={settings.api_rate_limit}
                onChange={(e) =>
                  setSettings({ ...settings, api_rate_limit: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_timeout">Timeout (secondes)</Label>
              <Input
                id="api_timeout"
                type="number"
                value={settings.api_timeout}
                onChange={(e) =>
                  setSettings({ ...settings, api_timeout: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('api')} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Activer/désactiver les notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_notifications">Notifications par email</Label>
              <Select
                value={settings.email_notifications.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, email_notifications: value === 'true' })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activé</SelectItem>
                  <SelectItem value="false">Désactivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms_notifications">Notifications SMS</Label>
              <Select
                value={settings.sms_notifications.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, sms_notifications: value === 'true' })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activé</SelectItem>
                  <SelectItem value="false">Désactivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => handleSave('notifications')} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
