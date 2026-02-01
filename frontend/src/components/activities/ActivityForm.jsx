import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Calendar, FileText, MapPin, Users, DollarSign } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { activityService } from '../../services/activityService';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import toast from 'react-hot-toast';
import { ACTIVITY_TYPES } from '../../utils/constants';

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planifiée' },
  { value: 'ongoing', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
];

const LOCATIONS = [
  { value: 1, label: 'Siège Régional Rabat' },
  { value: 2, label: 'Annexe Kénitra' },
  { value: 3, label: 'Annexe Khémisset' },
];

export default function ActivityForm({ activity, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(activity);
  const [activeTab, setActiveTab] = useState('general');

  // Format dates for HTML date inputs (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0]; // Extract YYYY-MM-DD from ISO string
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: activity ? {
      ...activity,
      start_date: formatDateForInput(activity.start_date),
      end_date: formatDateForInput(activity.end_date),
      registration_deadline: formatDateForInput(activity.registration_deadline),
    } : {
      title: '',
      description: '',
      activity_type_id: '',
      location_id: '',
      venue_name: '',
      venue_address: '',
      start_date: '',
      end_date: '',
      registration_deadline: '',
      max_participants: '',
      is_online: false,
      is_free: true,
      participation_fee: '',
      budget_allocated: '',
      status: 'planned',
      partners: '',
      impact_notes: '',
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: activityService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Activité créée avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la création');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => activityService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Activité mise à jour avec succès');
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
      
      // Parse numbers (skip if empty)
      if (key === 'activity_type_id' || key === 'location_id' || key === 'max_participants') {
        cleanData[key] = value && value !== '' ? parseInt(value) : null;
      }
      // Parse decimals (skip if empty)
      else if (key === 'participation_fee' || key === 'budget_allocated') {
        cleanData[key] = value && value !== '' ? parseFloat(value) : null;
      }
      // Ensure booleans
      else if (key === 'is_online' || key === 'is_free') {
        cleanData[key] = Boolean(value);
      }
      // Keep strings as-is (including empty strings)
      else {
        cleanData[key] = value || '';
      }
    });

    if (isEdit) {
      updateMutation.mutate({ id: activity.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const isFree = watch('is_free');
  const isOnline = watch('is_online');

  const tabs = [
    { id: 'general', label: 'Informations générales', icon: Calendar },
    { id: 'location', label: 'Lieu et date', icon: MapPin },
    { id: 'details', label: 'Détails', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-600 to-green-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEdit ? 'Modifier l\'activité' : 'Nouvelle activité'}
              </h2>
              <p className="text-sm text-green-100">
                {isEdit ? 'Mettre à jour les informations' : 'Ajouter une nouvelle activité au calendrier'}
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
                      ? 'border-green-600 text-green-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Form Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      label="Titre de l'activité"
                      placeholder="Ex: Formation en marketing digital"
                      required
                      error={errors.title?.message}
                      icon={FileText}
                      {...register('title', { required: 'Le titre est obligatoire' })}
                    />
                  </div>

                  <Select
                    label="Type d'activité"
                    required
                    error={errors.activity_type_id?.message}
                    {...register('activity_type_id', { required: 'Le type est obligatoire' })}
                  >
                    <option value="">Sélectionner un type</option>
                    {ACTIVITY_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Statut"
                    required
                    {...register('status')}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Select>

                  <div className="md:col-span-2">
                    <TextArea
                      label="Description"
                      placeholder="Décrivez l'activité, ses objectifs et le public cible..."
                      rows={4}
                      {...register('description')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-2 md:col-span-2">
                    <input
                      type="checkbox"
                      id="is_online"
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      {...register('is_online')}
                    />
                    <label htmlFor="is_online" className="text-sm font-medium text-gray-700">
                      Activité en ligne
                    </label>
                  </div>

                  {!isOnline && (
                    <>
                      <Select
                        label="Lieu"
                        icon={MapPin}
                        {...register('location_id')}
                      >
                        <option value="">Sélectionner un lieu</option>
                        {LOCATIONS.map((loc) => (
                          <option key={loc.value} value={loc.value}>
                            {loc.label}
                          </option>
                        ))}
                      </Select>

                      <Input
                        label="Nom du lieu (optionnel)"
                        placeholder="Ex: Salle de conférence A"
                        {...register('venue_name')}
                      />

                      <div className="md:col-span-2">
                        <Input
                          label="Adresse du lieu"
                          placeholder="Adresse complète"
                          required
                          {...register('venue_address', { required: !isOnline })}
                        />
                      </div>
                    </>
                  )}

                  <Input
                    label="Date de début"
                    type="date"
                    required
                    icon={Calendar}
                    error={errors.start_date?.message}
                    {...register('start_date', { required: 'La date de début est obligatoire' })}
                  />

                  <Input
                    label="Date de fin"
                    type="date"
                    icon={Calendar}
                    {...register('end_date')}
                  />

                  <Input
                    label="Date limite d'inscription"
                    type="date"
                    icon={Calendar}
                    {...register('registration_deadline')}
                  />

                  <Input
                    label="Nombre maximum de participants"
                    type="number"
                    min="0"
                    placeholder="Ex: 30"
                    icon={Users}
                    {...register('max_participants')}
                  />
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-2 md:col-span-2">
                    <input
                      type="checkbox"
                      id="is_free"
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      {...register('is_free')}
                    />
                    <label htmlFor="is_free" className="text-sm font-medium text-gray-700">
                      Participation gratuite
                    </label>
                  </div>

                  {!isFree && (
                    <Input
                      label="Frais de participation"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      icon={DollarSign}
                      {...register('participation_fee')}
                    />
                  )}

                  <Input
                    label="Budget alloué"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    icon={DollarSign}
                    {...register('budget_allocated')}
                  />

                  <div className="md:col-span-2">
                    <TextArea
                      label="Partenaires"
                      placeholder="Liste des partenaires impliqués..."
                      rows={3}
                      {...register('partners')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TextArea
                      label="Notes sur l'impact"
                      placeholder="Impact attendu ou résultats obtenus..."
                      rows={3}
                      {...register('impact_notes')}
                    />
                  </div>
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
              icon={Save}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Enregistrement...'
                : isEdit
                ? 'Mettre à jour'
                : 'Créer l\'activité'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
