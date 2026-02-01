import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Building2, FileText, MapPin, Phone, Mail, Users, BarChart3 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../services/companyService';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import toast from 'react-hot-toast';

const SIZE_OPTIONS = [
  { value: 'TPE', label: 'TPE (Très Petite Entreprise)' },
  { value: 'PME', label: 'PME (Petite et Moyenne Entreprise)' },
  { value: 'ETI', label: 'ETI (Entreprise de Taille Intermédiaire)' },
  { value: 'GE', label: 'GE (Grande Entreprise)' },
];

// Static sectors from database schema
const SECTORS = [
  { value: 1, label: 'Agriculture' },
  { value: 2, label: 'Industrie' },
  { value: 3, label: 'Commerce' },
  { value: 4, label: 'Services' },
  { value: 5, label: 'Tourisme' },
  { value: 6, label: 'Technologies' },
  { value: 7, label: 'Artisanat' },
  { value: 8, label: 'BTP' },
];

const PROVINCES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fès',
  'Tanger',
  'Agadir',
  'Meknès',
  'Oujda',
  'Kenitra',
  'Tétouan',
  'Safi',
  'El Jadida',
  'Nador',
  'Mohammedia',
  'Khouribga',
];

export default function CompanyForm({ company, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(company);
  const [activeTab, setActiveTab] = useState('general');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: company || {
      name: '',
      legal_name: '',
      ice: '',
      sector_id: '',
      size_category: '',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      country: 'Maroc',
      phone: '',
      email: '',
      website: '',
      contact_person: '',
      contact_position: '',
      contact_phone: '',
      contact_email: '',
      is_member: false,
      membership_date: '',
      description: '',
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: companyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Entreprise créée avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la création');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => companyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Entreprise mise à jour avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });

  const onSubmit = (data) => {
    // Clean up data - only send non-empty values
    const cleanData = {};
    
    Object.keys(data).forEach((key) => {
      const value = data[key];
      
      // Skip empty strings and undefined - don't add them to cleanData at all
      if (value === '' || value === undefined || value === null) {
        // For updates, we still need to explicitly set null for some fields
        // But for create, we omit them entirely
        if (isEdit && (key === 'ice' || key === 'postal_code' || key === 'membership_date')) {
          cleanData[key] = null;
        }
        return;
      }
      
      // Parse sector_id to integer
      if (key === 'sector_id') {
        cleanData[key] = parseInt(value);
      }
      // Ensure boolean for is_member
      else if (key === 'is_member') {
        cleanData[key] = Boolean(value);
      }
      // Keep the value as-is
      else {
        cleanData[key] = value;
      }
    });

    if (isEdit) {
      updateMutation.mutate({ id: company.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const isMember = watch('is_member');

  const tabs = [
    { id: 'general', label: 'Informations générales', icon: Building2 },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'details', label: 'Détails supplémentaires', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEdit ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
              </h2>
              <p className="text-sm text-blue-100">
                {isEdit ? 'Mettre à jour les informations' : 'Ajouter une nouvelle entreprise au système'}
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

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex gap-1 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(90vh-220px)]">
          <div className="p-6 space-y-6">
            {/* General Information Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nom commercial *"
                    {...register('name', { required: 'Le nom est requis' })}
                    error={errors.name?.message}
                    placeholder="Ex: Société ABC"
                  />
                  <Input
                    label="Raison sociale"
                    {...register('legal_name')}
                    placeholder="Dénomination juridique officielle"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="ICE"
                    {...register('ice', {
                      pattern: {
                        value: /^[0-9]{15}$/,
                        message: 'L\'ICE doit contenir exactement 15 chiffres',
                      },
                    })}
                    error={errors.ice?.message}
                    placeholder="000000000000000"
                    maxLength={15}
                  />
                  <Select
                    label="Secteur d'activité"
                    {...register('sector_id')}
                    options={SECTORS}
                    placeholder="Sélectionner un secteur"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Taille de l'entreprise"
                    {...register('size_category')}
                    options={SIZE_OPTIONS}
                    placeholder="Sélectionner la taille"
                  />
                  <div className="flex items-center gap-4 pt-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('is_member')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Adhérent CCIS</span>
                    </label>
                    {isMember && (
                      <Input
                        type="date"
                        label="Date d'adhésion"
                        {...register('membership_date')}
                        className="flex-1"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <TextArea
                    label="Adresse"
                    {...register('address')}
                    placeholder="Numéro, rue, quartier"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Ville"
                    {...register('city')}
                    placeholder="Ex: Casablanca"
                  />
                  <Select
                    label="Province/Préfecture"
                    {...register('province')}
                    options={PROVINCES.map((p) => ({ value: p, label: p }))}
                    placeholder="Sélectionner"
                  />
                  <Input
                    label="Code postal"
                    {...register('postal_code')}
                    placeholder="20000"
                  />
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Coordonnées de l'entreprise
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Input
                      label="Téléphone"
                      {...register('phone', {
                        pattern: {
                          value: /^(\+212|0)[5-7][0-9]{8}$/,
                          message: 'Format invalide (ex: +212612345678 ou 0612345678)',
                        },
                      })}
                      error={errors.phone?.message}
                      placeholder="+212 6XX XXX XXX"
                    />
                    <Input
                      label="Email"
                      type="email"
                      {...register('email', {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email invalide',
                        },
                      })}
                      error={errors.email?.message}
                      placeholder="contact@entreprise.ma"
                    />
                  </div>
                  <div className="mt-4">
                    <Input
                      label="Site web"
                      {...register('website')}
                      placeholder="https://www.entreprise.ma"
                    />
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Personne à contacter
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Input
                      label="Nom complet"
                      {...register('contact_person')}
                      placeholder="Ex: Ahmed Bennani"
                    />
                    <Input
                      label="Fonction"
                      {...register('contact_position')}
                      placeholder="Ex: Directeur Général"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Input
                      label="Téléphone"
                      {...register('contact_phone', {
                        pattern: {
                          value: /^(\+212|0)[5-7][0-9]{8}$/,
                          message: 'Format invalide',
                        },
                      })}
                      error={errors.contact_phone?.message}
                      placeholder="+212 6XX XXX XXX"
                    />
                    <Input
                      label="Email"
                      type="email"
                      {...register('contact_email', {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email invalide',
                        },
                      })}
                      error={errors.contact_email?.message}
                      placeholder="contact@entreprise.ma"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <TextArea
                  label="Description de l'entreprise"
                  {...register('description')}
                  placeholder="Décrivez l'activité principale, les produits/services, la clientèle cible..."
                  rows={6}
                />

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Informations supplémentaires
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Les champs marqués d'un astérisque (*) sont obligatoires</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>L'ICE (Identifiant Commun de l'Entreprise) doit contenir 15 chiffres</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>La qualité des données sera calculée automatiquement selon les informations fournies</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
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
              {isEdit ? 'Mettre à jour' : 'Créer l\'entreprise'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
