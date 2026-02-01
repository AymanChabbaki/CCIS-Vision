/**
 * Activity List Component
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService } from '../../services/activityService';
import { Card, Button, Badge, FilterPanel, Pagination } from '../common';
import { Plus, Calendar, Users, DollarSign, Map, Pencil, Trash2, Download } from 'lucide-react';
import InteractiveMap from '../map/InteractiveMap';
import ActivityForm from './ActivityForm';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { ACTIVITY_TYPES } from '../../utils/constants';
import toast from 'react-hot-toast';

export const ActivityList = ({ onAddClick, onViewClick }) => {
  const queryClient = useQueryClient();
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [filters, setFilters] = useState({
    search: '',
    activity_type_id: '',
    status: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['activities', filters, page, limit],
    queryFn: () => activityService.getAll({ ...filters, page, limit }),
  });

  // Fetch all activities for map view (no pagination)
  const { data: mapData } = useQuery({
    queryKey: ['activities-map', filters],
    queryFn: () => activityService.getAll({ ...filters, page: 1, limit: 1000 }),
    enabled: showMap, // Only fetch when map is shown
  });

  const activities = data?.data?.activities || [];
  const pagination = data?.data?.pagination || {};
  const allActivities = showMap ? (mapData?.data?.activities || []) : activities;

  const filterConfig = [
    {
      key: 'search',
      label: 'Recherche',
      type: 'text',
      placeholder: 'Nom de l\'activité...',
      fullWidth: true,
    },
    {
      key: 'activity_type_id',
      label: 'Type d\'activité',
      type: 'select',
      options: ACTIVITY_TYPES.map((type) => ({ value: type.id, label: type.label })),
    },
    {
      key: 'status',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'planned', label: 'Planifiée' },
        { value: 'ongoing', label: 'En cours' },
        { value: 'completed', label: 'Terminée' },
        { value: 'cancelled', label: 'Annulée' },
      ],
    },
  ];

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilters({ search: '', activity_type_id: '', status: '' });
    setPage(1);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: activityService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Activité supprimée avec succès');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  const getStatusBadge = (status) => {
    const variants = {
      planned: 'warning',
      ongoing: 'info',
      completed: 'success',
      cancelled: 'danger',
    };
    const labels = {
      planned: 'Planifiée',
      ongoing: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const handleEdit = (activity, e) => {
    e.stopPropagation();
    setSelectedActivity(activity);
    setShowForm(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        cleanFilters[key] = filters[key];
      }
    });

    toast.promise(
      activityService.exportToExcel(cleanFilters),
      {
        loading: 'Export en cours...',
        success: 'Fichier exporté avec succès',
        error: 'Erreur lors de l\'export',
      }
    );
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== '').length;

  const mappableActivities = allActivities
    .filter(a => a.latitude && a.longitude)
    .map((a, index) => ({
      ...a,
      type: 'activity',
      color: 'green',
      // Add small random offset to prevent exact overlaps (0.001 degrees ≈ 100 meters)
      latitude: parseFloat(a.latitude) + (Math.random() - 0.5) * 0.01,
      longitude: parseFloat(a.longitude) + (Math.random() - 0.5) * 0.01,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activités</h1>
            <p className="text-gray-600 mt-1">
              {pagination?.total || 0} activités au total
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowMap(!showMap)} icon={Map}>
            {showMap ? 'Grille' : 'Carte'}
          </Button>
          <Button variant="outline" onClick={handleExport} icon={Download}>
            Exporter
          </Button>
          <Button onClick={() => { setSelectedActivity(null); setShowForm(true); }} icon={Plus}>
            Nouvelle activité
          </Button>
        </div>
      </div>

      {/* Filter Toggle Button */}
      <Card>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">Filtres de recherche</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-semibold">
                {String(activeFiltersCount)}
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              showFilters ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </Card>

      {/* Collapsible Filters */}
      {showFilters && (
        <FilterPanel
          filters={filterConfig}
          values={filters}
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
          title="Filtres de recherche"
        />
      )}

      {/* Map View */}
      {showMap ? (
        <Card className="p-0 overflow-hidden" style={{ height: '600px' }}>
          <InteractiveMap markers={mappableActivities} />
        </Card>
      ) : (
        <>
          {/* Activities Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </Card>
          ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => (
            <Card
              key={activity.id}
              className="hover:shadow-lg transition-shadow duration-300"
            >
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">
                        {ACTIVITY_TYPES.find((t) => t.id === activity.activity_type_id)?.label ||
                          'Autre'}
                      </Badge>
                      {getStatusBadge(activity.status)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEdit(activity, e)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(activity.id, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {activity.title}
                  </h3>
                  {activity.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {activity.start_date
                        ? formatDate(activity.start_date)
                        : 'Date non définie'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {activity.actual_participants || 0} / {activity.max_participants || '-'}{' '}
                      participants
                    </span>
                  </div>

                  {activity.budget_allocated && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatCurrency(activity.budget_allocated)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune activité trouvée</p>
                <p className="text-gray-400 text-sm mt-2">
                  Commencez par créer votre première activité
                </p>
                <Button onClick={onAddClick} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une activité
                </Button>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {pagination?.total > limit && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages || Math.ceil(pagination.total / limit)}
              totalItems={pagination.total}
              pageSize={limit}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Activity Form Modal */}
      {showForm && (
        <ActivityForm
          activity={selectedActivity}
          onClose={() => {
            setShowForm(false);
            setSelectedActivity(null);
          }}
        />
      )}
    </div>
  );
};

export default ActivityList;
