import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '../../services/alertService';
import { Bell, AlertTriangle, Info, CheckCircle, X, Clock, Filter } from 'lucide-react';
import { Card, Badge, Button } from '../common';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    color: 'text-blue-600 bg-blue-50',
    badgeVariant: 'primary',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600 bg-yellow-50',
    badgeVariant: 'warning',
  },
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50',
    badgeVariant: 'danger',
  },
};

export default function AlertList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // all, unread, read

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts', filter],
    queryFn: () => alertService.getAll({ is_read: filter === 'read' ? true : filter === 'unread' ? false : undefined }),
  });

  const alerts = alertsData?.data?.alerts || [];

  const markAsReadMutation = useMutation({
    mutationFn: alertService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alerte marquée comme lue');
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: alertService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alerte supprimée');
    },
  });

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) {
      deleteAlertMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alertes et Notifications</h1>
            <p className="text-gray-600 mt-1">{alerts.length} alertes au total</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Non lues
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lues
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des alertes...</p>
            </div>
          </Card>
        ) : alerts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune alerte</p>
              <p className="text-gray-400 text-sm mt-2">
                Vous n'avez pas de nouvelles notifications
              </p>
            </div>
          </Card>
        ) : (
          alerts.map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
            const Icon = config.icon;

            return (
              <Card
                key={alert.id}
                className={`transition-all hover:shadow-md ${
                  !alert.is_read ? 'border-l-4 border-l-blue-600 bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                          {!alert.is_read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatDistanceToNow(new Date(alert.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </div>
                          <Badge variant={config.badgeVariant}>{alert.alert_type_name || alert.severity}</Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!alert.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Marquer comme lu"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Threshold info if available */}
                    {alert.threshold_value && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Seuil défini:</span>
                          <span className="font-medium text-gray-900">{alert.threshold_value}%</span>
                        </div>
                        {alert.current_value && (
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600">Valeur actuelle:</span>
                            <span className="font-medium text-gray-900">{alert.current_value}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
