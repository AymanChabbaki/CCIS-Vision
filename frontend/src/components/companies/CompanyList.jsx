/**
 * Company List Component with Filters
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../services/companyService';
import { Table, Button, Card, Badge, FilterPanel, Pagination } from '../common';
import { Plus, Download, Map, Building2, Pencil, Trash2, MapPin } from 'lucide-react';
import CompanyForm from './CompanyForm';
import InteractiveMap from '../map/InteractiveMap';
import toast from 'react-hot-toast';

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

const SIZE_OPTIONS = [
  { value: 'TPE', label: 'TPE (Très Petite Entreprise)' },
  { value: 'PME', label: 'PME (Petite et Moyenne Entreprise)' },
  { value: 'ETI', label: 'ETI (Entreprise de Taille Intermédiaire)' },
  { value: 'GE', label: 'GE (Grande Entreprise)' },
];

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

export const CompanyList = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    province: '',
    sector: '',
    size: '',
    is_member: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['companies', filters, page, limit],
    queryFn: () => companyService.getAll({ ...filters, page, limit }),
  });

  // Fetch all companies for map view (no pagination)
  const { data: mapData } = useQuery({
    queryKey: ['companies-map', filters],
    queryFn: () => companyService.getAll({ ...filters, page: 1, limit: 1000 }),
    enabled: showMap, // Only fetch when map is shown
  });

  const companies = data?.data?.companies || [];
  const pagination = data?.data?.pagination || {};
  const allCompanies = showMap ? (mapData?.data?.companies || []) : companies;

  const filterConfig = [
    {
      key: 'search',
      label: 'Recherche',
      type: 'text',
      placeholder: 'Nom, ICE, RC...',
      fullWidth: true,
    },
    {
      key: 'province',
      label: 'Province',
      type: 'select',
      options: PROVINCES.map((p) => ({ value: p, label: p })),
    },
    {
      key: 'sector',
      label: 'Secteur',
      type: 'select',
      options: SECTORS,
    },
    {
      key: 'size',
      label: 'Taille',
      type: 'select',
      options: SIZE_OPTIONS,
    },
    {
      key: 'is_member',
      label: 'Adhésion',
      type: 'select',
      options: [
        { value: 'true', label: 'Adhérent' },
        { value: 'false', label: 'Non-adhérent' },
      ],
    },
  ];

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const handleFilterReset = () => {
    setFilters({
      search: '',
      province: '',
      sector: '',
      size: '',
      is_member: '',
    });
    setPage(1);
  };

  const columns = [
    {
      key: 'name',
      label: 'Entreprise',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            {row.legal_name && row.legal_name !== row.name && (
              <p className="text-sm text-gray-500">{row.legal_name}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'ice',
      label: 'ICE',
      render: (value) => <span className="font-mono text-sm">{value || '-'}</span>,
    },
    {
      key: 'city',
      label: 'Localisation',
      render: (city, row) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{city || row.province || '-'}</span>
        </div>
      ),
    },
    {
      key: 'sector_name',
      label: 'Secteur',
      render: (value) => value ? <Badge variant="primary">{value}</Badge> : '-',
    },
    {
      key: 'size_category',
      label: 'Taille',
      render: (value) => value || '-',
    },
    {
      key: 'is_member',
      label: 'Statut',
      render: (value) => (
        <Badge variant={value ? 'success' : 'default'}>
          {value ? 'Adhérent' : 'Non-adhérent'}
        </Badge>
      ),
    },
    {
      key: 'data_quality_score',
      label: 'Qualité',
      render: (value) => {
        const score = value || 0;
        const color = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger';
        return <Badge variant={color}>{score}%</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: companyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Entreprise supprimée avec succès');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    // Clean filters - only send non-empty values
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        cleanFilters[key] = filters[key];
      }
    });

    toast.promise(
      companyService.exportToExcel(cleanFilters),
      {
        loading: 'Export en cours...',
        success: 'Fichier exporté avec succès',
        error: 'Erreur lors de l\'export',
      }
    );
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== '').length || 0;
  const mappableCompanies = allCompanies
    .filter(c => c.latitude && c.longitude)
    .map(c => ({ ...c, type: 'company' }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Entreprises</h1>
            <p className="text-gray-600 mt-1">
              {pagination?.total || 0} entreprises au total
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setShowMap(!showMap)}
            icon={Map}
          >
            {showMap ? 'Liste' : 'Carte'}
          </Button>
          <Button variant="outline" onClick={handleExport} icon={Download}>
            Exporter
          </Button>
          <Button onClick={() => { setSelectedCompany(null); setShowForm(true); }} icon={Plus}>
            Nouvelle entreprise
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
          <InteractiveMap markers={mappableCompanies} />
        </Card>
      ) : (
        <>
          {/* Table */}
          <Card>
            <Table
              columns={columns}
              data={companies}
              loading={isLoading}
              emptyMessage={
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Aucune entreprise trouvée</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Essayez d'ajuster vos filtres ou ajoutez une nouvelle entreprise
                  </p>
                </div>
              }
            />
          </Card>

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

      {/* Company Form Modal */}
      {showForm && (
        <CompanyForm
          company={selectedCompany}
          onClose={() => {
            setShowForm(false);
            setSelectedCompany(null);
          }}
        />
      )}
    </div>
  );
};

export default CompanyList;
