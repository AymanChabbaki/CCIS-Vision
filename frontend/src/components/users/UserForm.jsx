import { useForm } from 'react-hook-form';
import { X, Save, User, Mail, Lock, Shield, Building2 } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 1, label: 'Administrateur' },
  { value: 2, label: 'Utilisateur Service' },
  { value: 3, label: 'Lecteur' },
];

const DEPARTMENTS = [
  { value: 1, label: 'Direction Régionale' },
  { value: 2, label: 'Relations Institutionnelles' },
  { value: 3, label: 'Stratégie et Partenariat' },
  { value: 4, label: 'Appui et Promotion' },
  { value: 5, label: 'Administratif et Financier' },
  { value: 6, label: 'Services aux ressortissants et Veille économique' },
  { value: 7, label: 'Audit et Contrôle de Gestion' },
];

export default function UserForm({ user, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: user || {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      role_id: '',
      department_id: '',
      is_active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur créé avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => authService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur mis à jour avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });

  const onSubmit = (data) => {
    // Clean up data
    const cleanData = {};
    
    Object.keys(data).forEach((key) => {
      const value = data[key];
      
      // Skip confirmPassword and empty values
      if (key === 'confirmPassword' || value === '' || value === undefined || value === null) {
        return;
      }
      
      // Parse role_id and department_id to integer
      if (key === 'role_id' || key === 'department_id') {
        if (value) cleanData[key] = parseInt(value);
      }
      // Ensure boolean for is_active
      else if (key === 'is_active') {
        cleanData[key] = Boolean(value);
      }
      // Skip password if empty in edit mode
      else if (key === 'password' && isEdit && !value) {
        return;
      }
      // Keep the value as-is
      else {
        cleanData[key] = value;
      }
    });

    if (isEdit) {
      updateMutation.mutate({ id: user.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const password = watch('password');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <p className="text-sm text-blue-100">
                {isEdit ? 'Mettre à jour les informations' : 'Ajouter un nouvel utilisateur au système'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="p-6 space-y-6">
            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Informations de connexion
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nom d'utilisateur *"
                  {...register('username', { required: 'Le nom d\'utilisateur est requis' })}
                  error={errors.username?.message}
                  placeholder="Ex: ayman"
                  disabled={isEdit}
                />
                <Input
                  label="Email *"
                  type="email"
                  {...register('email', {
                    required: 'L\'email est requis',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email invalide',
                    },
                  })}
                  error={errors.email?.message}
                  placeholder="utilisateur@ccis.ma"
                />
              </div>

              {!isEdit && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Mot de passe *"
                    type="password"
                    {...register('password', {
                      required: !isEdit && 'Le mot de passe est requis',
                      minLength: {
                        value: 8,
                        message: 'Le mot de passe doit contenir au moins 8 caractères',
                      },
                    })}
                    error={errors.password?.message}
                    placeholder="••••••••"
                  />
                  <Input
                    label="Confirmer le mot de passe *"
                    type="password"
                    {...register('confirmPassword', {
                      required: !isEdit && 'Veuillez confirmer le mot de passe',
                      validate: value => value === password || 'Les mots de passe ne correspondent pas',
                    })}
                    error={errors.confirmPassword?.message}
                    placeholder="••••••••"
                  />
                </div>
              )}

              {isEdit && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    Laissez les champs de mot de passe vides pour conserver le mot de passe actuel
                  </p>
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informations personnelles
              </h3>

              <Input
                label="Nom complet *"
                {...register('full_name', { required: 'Le nom complet est requis' })}
                error={errors.full_name?.message}
                placeholder="Ex: Ayman Benali"
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Rôle *"
                  {...register('role_id', { required: 'Le rôle est requis' })}
                  options={ROLES}
                  error={errors.role_id?.message}
                  placeholder="Sélectionner un rôle"
                />
                <Select
                  label="Département"
                  {...register('department_id')}
                  options={DEPARTMENTS}
                  placeholder="Sélectionner un département"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Compte actif
                </label>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Niveaux d'accès:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong>Administrateur:</strong> Accès complet à toutes les fonctionnalités</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Utilisateur Service:</strong> Peut gérer les données et importer des fichiers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-600 font-bold">•</span>
                  <span><strong>Lecteur:</strong> Accès en lecture seule</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
              icon={Save}
            >
              {isEdit ? 'Mettre à jour' : 'Créer l\'utilisateur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
