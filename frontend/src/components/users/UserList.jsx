import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { Table, Button, Card, Badge, SearchInput } from '../common';
import { Users, Plus, Pencil, Trash2, Shield, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';
import UserForm from './UserForm';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  admin: {
    label: 'Administrateur',
    variant: 'danger',
    icon: Shield,
  },
  service_user: {
    label: 'Utilisateur Service',
    variant: 'primary',
    icon: Users,
  },
  viewer: {
    label: 'Lecteur',
    variant: 'default',
    icon: Users,
  },
};

export default function UserList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', searchQuery],
    queryFn: () => authService.getUsers({ search: searchQuery }),
  });

  const users = data?.data?.users || [];

  const deleteUserMutation = useMutation({
    mutationFn: authService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) => authService.updateUser(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleToggleStatus = (user) => {
    toggleUserStatusMutation.mutate({
      id: user.id,
      is_active: !user.is_active,
    });
  };

  const columns = [
    {
      key: 'full_name',
      label: 'Utilisateur',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {(value || row.username)?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{value || '-'}</p>
            <p className="text-sm text-gray-500">@{row.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{value}</span>
        </div>
      ),
    },
    {
      key: 'role_name',
      label: 'Rôle',
      render: (value, row) => {
        const config = ROLE_CONFIG[value] || ROLE_CONFIG.viewer;
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        );
      },
    },
    {
      key: 'department_name',
      label: 'Département',
      render: (value) => value || '-',
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (value, row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className="inline-flex items-center gap-2"
        >
          {value ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <Badge variant="success">Actif</Badge>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-gray-400" />
              <Badge variant="default">Inactif</Badge>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'last_login',
      label: 'Dernière connexion',
      render: (value) => value ? (
        <div className="text-sm">
          <p className="text-gray-900">{new Date(value).toLocaleDateString('fr-FR')}</p>
          <p className="text-gray-500">
            {formatDistanceToNow(new Date(value), { addSuffix: true, locale: fr })}
          </p>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">Jamais</span>
      ),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
            <p className="text-gray-600 mt-1">{users.length} utilisateurs au total</p>
          </div>
        </div>
        <Button onClick={() => { setSelectedUser(null); setShowForm(true); }} icon={Plus}>
          Nouvel utilisateur
        </Button>
      </div>

      {/* Search */}
      <Card>
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Rechercher par nom, email, username..."
        />
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          data={users}
          loading={isLoading}
          emptyMessage={
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun utilisateur trouvé</p>
              <p className="text-gray-400 text-sm mt-2">
                Commencez par ajouter un nouvel utilisateur
              </p>
            </div>
          }
        />
      </Card>

      {/* User Form Modal */}
      {showForm && (
        <UserForm
          user={selectedUser}
          onClose={() => {
            setShowForm(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
