import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Settings, Save, Database, Mail, Bell, Globe, Lock, Shield, Palette } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';
import toast from 'react-hot-toast';

export default function SettingsForm() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // General
      app_name: 'CCIS-Vision',
      app_description: 'Système de gestion pour la CCIS Rabat-Salé-Kénitra',
      default_language: 'fr',
      timezone: 'Africa/Casablanca',
      
      // Database
      backup_enabled: true,
      backup_frequency: 'daily',
      retention_days: 30,
      
      // Email
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_from: 'noreply@ccis.ma',
      
      // Notifications
      email_notifications: true,
      alert_notifications: true,
      budget_threshold: 90,
      
      // Security
      session_timeout: 60,
      password_expiry_days: 90,
      max_login_attempts: 5,
      require_2fa: false,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast.success('Paramètres sauvegardés avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const onSubmit = (data) => {
    saveMutation.mutate(data);
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'database', label: 'Base de données', icon: Database },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres de l'application</h1>
          <p className="text-gray-600 mt-1">Configuration et préférences du système</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3">
          <Card className="p-2">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="col-span-9">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="p-6">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Paramètres généraux</h2>
                    <div className="space-y-4">
                      <Input
                        label="Nom de l'application"
                        {...register('app_name', { required: 'Le nom est requis' })}
                        error={errors.app_name?.message}
                      />
                      <Input
                        label="Description"
                        {...register('app_description')}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Langue par défaut"
                          {...register('default_language')}
                          options={[
                            { value: 'fr', label: 'Français' },
                            { value: 'ar', label: 'العربية' },
                            { value: 'en', label: 'English' },
                          ]}
                        />
                        <Select
                          label="Fuseau horaire"
                          {...register('timezone')}
                          options={[
                            { value: 'Africa/Casablanca', label: 'Casablanca (GMT+1)' },
                            { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Database Tab */}
              {activeTab === 'database' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Sauvegarde de la base de données</h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register('backup_enabled')}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Activer les sauvegardes automatiques
                        </label>
                      </div>
                      <Select
                        label="Fréquence de sauvegarde"
                        {...register('backup_frequency')}
                        options={[
                          { value: 'hourly', label: 'Toutes les heures' },
                          { value: 'daily', label: 'Quotidienne' },
                          { value: 'weekly', label: 'Hebdomadaire' },
                          { value: 'monthly', label: 'Mensuelle' },
                        ]}
                      />
                      <Input
                        type="number"
                        label="Jours de rétention"
                        {...register('retention_days')}
                        placeholder="30"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email Tab */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Configuration SMTP</h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Serveur SMTP"
                          {...register('smtp_host')}
                          placeholder="smtp.gmail.com"
                        />
                        <Input
                          type="number"
                          label="Port"
                          {...register('smtp_port')}
                          placeholder="587"
                        />
                      </div>
                      <Input
                        label="Utilisateur SMTP"
                        {...register('smtp_user')}
                        placeholder="your_email@gmail.com"
                      />
                      <Input
                        label="Email d'envoi"
                        type="email"
                        {...register('smtp_from')}
                        placeholder="noreply@ccis.ma"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Préférences de notification</h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register('email_notifications')}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Notifications par email
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register('alert_notifications')}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Alertes système
                        </label>
                      </div>
                      <Input
                        type="number"
                        label="Seuil d'alerte budget (%)"
                        {...register('budget_threshold')}
                        placeholder="90"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Paramètres de sécurité</h2>
                    <div className="space-y-4">
                      <Input
                        type="number"
                        label="Timeout de session (minutes)"
                        {...register('session_timeout')}
                        placeholder="60"
                      />
                      <Input
                        type="number"
                        label="Expiration mot de passe (jours)"
                        {...register('password_expiry_days')}
                        placeholder="90"
                      />
                      <Input
                        type="number"
                        label="Tentatives de connexion max"
                        {...register('max_login_attempts')}
                        placeholder="5"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register('require_2fa')}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Exiger l'authentification à deux facteurs (2FA)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
                <Button
                  type="submit"
                  isLoading={saveMutation.isPending}
                  icon={Save}
                >
                  Sauvegarder les modifications
                </Button>
              </div>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
