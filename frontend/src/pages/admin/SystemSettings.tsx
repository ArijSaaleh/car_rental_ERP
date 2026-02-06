import { useEffect, useState } from 'react';
import {
  Save,
  Mail,
  CreditCard,
  ToggleLeft,
  Globe,
  AlertCircle,
  CheckCircle,
  Server,
  FileText,
  Wrench,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { settingsService } from '../../services/settings.service';
import { extractErrorMessage } from '../../utils/errorHandler';

interface SystemSettings {
  // General Settings
  appName?: string;
  supportEmail?: string;
  supportPhone?: string;
  defaultLanguage?: string;
  defaultCurrency?: string;
  defaultTimezone?: string;

  // Email Configuration
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  emailFromName?: string;
  emailFromAddress?: string;

  // Payment Gateway Settings
  paymeeEnabled?: boolean;
  paymeeApiKey?: string;
  paymeeSecretKey?: string;
  clicToPayEnabled?: boolean;
  clicToPayMerchantId?: string;
  clicToPayApiKey?: string;

  // Feature Flags
  enableBookings?: boolean;
  enablePayments?: boolean;
  enableContracts?: boolean;
  enableReports?: boolean;
  enableNotifications?: boolean;

  // Maintenance
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  appName: 'Location de Voitures',
  supportEmail: 'support@example.com',
  supportPhone: '+216 XX XXX XXX',
  defaultLanguage: 'fr',
  defaultCurrency: 'TND',
  defaultTimezone: 'Africa/Tunis',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  smtpSecure: true,
  emailFromName: 'Support Location',
  emailFromAddress: 'noreply@example.com',
  paymeeEnabled: false,
  paymeeApiKey: '',
  paymeeSecretKey: '',
  clicToPayEnabled: false,
  clicToPayMerchantId: '',
  clicToPayApiKey: '',
  enableBookings: true,
  enablePayments: true,
  enableContracts: true,
  enableReports: true,
  enableNotifications: true,
  maintenanceMode: false,
  maintenanceMessage: 'Le système est en maintenance. Veuillez réessayer plus tard.',
};

export default function SystemSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await settingsService.getSettings();
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      // Use default settings if backend not available
      setSettings(DEFAULT_SETTINGS);
      toast({
        title: 'Avertissement',
        description: 'Utilisation des paramètres par défaut.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await settingsService.updateSettings(settings);
      toast({
        title: 'Paramètres enregistrés',
        description: 'Les paramètres système ont été mis à jour avec succès.',
        variant: 'success',
      });
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      toast({
        title: 'Erreur',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Paramètres Système
            </h1>
            <p className="text-lg text-gray-600">
              Configuration globale de l'application
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {settings.maintenanceMode && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Le mode maintenance est activé. Les utilisateurs ne peuvent pas accéder
              au système.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 p-1 bg-gray-100 rounded-lg">
            <TabsTrigger value="general" className="gap-2">
              <Globe className="h-4 w-4" />
              Général
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Paiement
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <ToggleLeft className="h-4 w-4" />
              Fonctionnalités
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Paramètres Généraux
                </CardTitle>
                <CardDescription>
                  Configuration de base de l'application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="appName">Nom de l'Application</Label>
                    <Input
                      id="appName"
                      value={settings.appName}
                      onChange={(e) => updateSetting('appName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Email de Support</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => updateSetting('supportEmail', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="supportPhone">Téléphone de Support</Label>
                    <Input
                      id="supportPhone"
                      value={settings.supportPhone}
                      onChange={(e) => updateSetting('supportPhone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">Langue par Défaut</Label>
                    <Select
                      value={settings.defaultLanguage}
                      onValueChange={(value) => updateSetting('defaultLanguage', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency">Devise par Défaut</Label>
                    <Select
                      value={settings.defaultCurrency}
                      onValueChange={(value) => updateSetting('defaultCurrency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TND">TND - Dinar Tunisien</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="USD">USD - Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultTimezone">Fuseau Horaire</Label>
                    <Select
                      value={settings.defaultTimezone}
                      onValueChange={(value) => updateSetting('defaultTimezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Tunis">Africa/Tunis</SelectItem>
                        <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Configuration */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configuration Email (SMTP)
                </CardTitle>
                <CardDescription>
                  Paramètres du serveur SMTP pour l'envoi d'emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">Serveur SMTP</Label>
                    <Input
                      id="smtpHost"
                      value={settings.smtpHost}
                      onChange={(e) => updateSetting('smtpHost', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Port SMTP</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) =>
                        updateSetting('smtpPort', parseInt(e.target.value))
                      }
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">Utilisateur SMTP</Label>
                    <Input
                      id="smtpUser"
                      value={settings.smtpUser}
                      onChange={(e) => updateSetting('smtpUser', e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">Mot de passe SMTP</Label>
                    <Input
                      id="smtpPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={settings.smtpPassword}
                      onChange={(e) => updateSetting('smtpPassword', e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Connexion Sécurisée (TLS/SSL)</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Utiliser une connexion sécurisée pour l'envoi d'emails
                      </p>
                    </div>
                    <Switch
                      checked={settings.smtpSecure}
                      onCheckedChange={(checked) => updateSetting('smtpSecure', checked)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailFromName">Nom de l'Expéditeur</Label>
                    <Input
                      id="emailFromName"
                      value={settings.emailFromName}
                      onChange={(e) => updateSetting('emailFromName', e.target.value)}
                      placeholder="Support Location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailFromAddress">Email de l'Expéditeur</Label>
                    <Input
                      id="emailFromAddress"
                      type="email"
                      value={settings.emailFromAddress}
                      onChange={(e) =>
                        updateSetting('emailFromAddress', e.target.value)
                      }
                      placeholder="noreply@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Gateway Configuration */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Paymee
                </CardTitle>
                <CardDescription>Configuration de la passerelle Paymee</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Activer Paymee</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Permettre les paiements via Paymee
                    </p>
                  </div>
                  <Switch
                    checked={settings.paymeeEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting('paymeeEnabled', checked)
                    }
                  />
                </div>

                {settings.paymeeEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymeeApiKey">Clé API Paymee</Label>
                      <Input
                        id="paymeeApiKey"
                        type={showPasswords ? 'text' : 'password'}
                        value={settings.paymeeApiKey}
                        onChange={(e) => updateSetting('paymeeApiKey', e.target.value)}
                        placeholder="pk_test_..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymeeSecretKey">Clé Secrète Paymee</Label>
                      <Input
                        id="paymeeSecretKey"
                        type={showPasswords ? 'text' : 'password'}
                        value={settings.paymeeSecretKey}
                        onChange={(e) =>
                          updateSetting('paymeeSecretKey', e.target.value)
                        }
                        placeholder="sk_test_..."
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Clic To Pay
                </CardTitle>
                <CardDescription>
                  Configuration de la passerelle Clic To Pay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Activer Clic To Pay</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Permettre les paiements via Clic To Pay
                    </p>
                  </div>
                  <Switch
                    checked={settings.clicToPayEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting('clicToPayEnabled', checked)
                    }
                  />
                </div>

                {settings.clicToPayEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clicToPayMerchantId">ID Commerçant</Label>
                      <Input
                        id="clicToPayMerchantId"
                        value={settings.clicToPayMerchantId}
                        onChange={(e) =>
                          updateSetting('clicToPayMerchantId', e.target.value)
                        }
                        placeholder="merchant_123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clicToPayApiKey">Clé API</Label>
                      <Input
                        id="clicToPayApiKey"
                        type={showPasswords ? 'text' : 'password'}
                        value={settings.clicToPayApiKey}
                        onChange={(e) =>
                          updateSetting('clicToPayApiKey', e.target.value)
                        }
                        placeholder="api_key_..."
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? 'Masquer' : 'Afficher'} les mots de passe
              </Button>
            </div>
          </TabsContent>

          {/* Feature Flags */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ToggleLeft className="h-5 w-5" />
                  Activation des Fonctionnalités
                </CardTitle>
                <CardDescription>
                  Activer ou désactiver les fonctionnalités du système
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Réservations</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Permettre la création et la gestion des réservations
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableBookings}
                      onCheckedChange={(checked) =>
                        updateSetting('enableBookings', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Paiements</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Permettre l'enregistrement et le traitement des paiements
                      </p>
                    </div>
                    <Switch
                      checked={settings.enablePayments}
                      onCheckedChange={(checked) =>
                        updateSetting('enablePayments', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Contrats</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Permettre la génération et la gestion des contrats
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableContracts}
                      onCheckedChange={(checked) =>
                        updateSetting('enableContracts', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Rapports</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Permettre l'accès aux rapports et statistiques
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableReports}
                      onCheckedChange={(checked) =>
                        updateSetting('enableReports', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Notifications</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Envoyer des notifications par email aux utilisateurs
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableNotifications}
                      onCheckedChange={(checked) =>
                        updateSetting('enableNotifications', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Mode */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Mode Maintenance
                </CardTitle>
                <CardDescription>
                  Mettre le système en maintenance pour les mises à jour
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert
                  className={
                    settings.maintenanceMode
                      ? 'bg-red-50 border-red-200'
                      : 'bg-green-50 border-green-200'
                  }
                >
                  {settings.maintenanceMode ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <AlertDescription
                    className={settings.maintenanceMode ? 'text-red-800' : 'text-green-800'}
                  >
                    Le système est actuellement{' '}
                    {settings.maintenanceMode ? 'EN MAINTENANCE' : 'OPÉRATIONNEL'}
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Activer le Mode Maintenance</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Les utilisateurs ne pourront pas accéder au système
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      updateSetting('maintenanceMode', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Message de Maintenance</Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={settings.maintenanceMessage}
                    onChange={(e) =>
                      updateSetting('maintenanceMessage', e.target.value)
                    }
                    rows={4}
                    placeholder="Message affiché aux utilisateurs pendant la maintenance..."
                  />
                </div>

                <Alert>
                  <Server className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Le mode maintenance empêche tous les
                    utilisateurs (sauf les SUPER_ADMIN) d'accéder au système. Utilisez
                    cette fonctionnalité uniquement pour les mises à jour critiques.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Journaux Système
                </CardTitle>
                <CardDescription>Consulter les logs du système</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Fonctionnalité de consultation des logs
                    </p>
                    <Button variant="outline" disabled>
                      Voir les Journaux
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button at Bottom */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les Modifications
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
