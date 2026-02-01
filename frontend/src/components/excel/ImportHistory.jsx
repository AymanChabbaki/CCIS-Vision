import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { excelService } from '../../services/excelService';
import { Table, Card, Badge } from '../common';
import { FileSpreadsheet, CheckCircle, XCircle, Clock, AlertTriangle, Download, Play, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  completed: {
    label: 'Terminé',
    variant: 'success',
    icon: CheckCircle,
  },
  processing: {
    label: 'En cours',
    variant: 'warning',
    icon: Clock,
  },
  failed: {
    label: 'Échoué',
    variant: 'danger',
    icon: XCircle,
  },
  pending: {
    label: 'En attente',
    variant: 'default',
    icon: Clock,
  },
};

export default function ImportHistory() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['import-history'],
    queryFn: () => excelService.getHistory(),
  });

  const imports = data?.data?.imports || [];

  const validateMutation = useMutation({
    mutationFn: (importId) => excelService.validate(importId),
    onSuccess: (response) => {
      console.log('Validation response:', response);
      const { valid, invalid, total } = response.data;
      if (invalid > 0) {
        toast.error(`Validation: ${valid}/${total} lignes valides, ${invalid} erreurs détectées`, {
          duration: 5000,
        });
      } else {
        toast.success(`✅ Toutes les ${total} lignes sont valides!`, {
          duration: 4000,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
    },
    onError: (error) => {
      console.error('Validation error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    },
  });

  const processMutation = useMutation({
    mutationFn: (importId) => excelService.process(importId),
    onSuccess: () => {
      toast.success('Traitement terminé avec succès');
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors du traitement');
    },
  });

  const handleValidate = (importId) => {
    validateMutation.mutate(importId);
  };

  const handleProcess = (importId) => {
    processMutation.mutate(importId);
  };

  const handleDownloadReport = async (importId) => {
    try {
      await excelService.downloadImportReport(importId);
      toast.success('Rapport téléchargé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const columns = [
    {
      key: 'filename',
      label: 'Fichier',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{row.data_type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'upload_date',
      label: 'Date',
      render: (value) => (
        <div>
          <p className="text-gray-900">{new Date(value).toLocaleDateString('fr-FR')}</p>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(value), { addSuffix: true, locale: fr })}
          </p>
        </div>
      ),
    },
    {
      key: 'uploaded_by',
      label: 'Importé par',
      render: (value, row) => row.uploaded_by_username || row.username || value || '-',
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value) => {
        const config = STATUS_CONFIG[value] || STATUS_CONFIG.pending;
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
      key: 'total_rows',
      label: 'Lignes',
      render: (value, row) => (
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{value}</span>
            <span className="text-gray-500">lignes</span>
          </div>
          {row.status === 'completed' && (
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-3 h-3" />
                <span>{row.rows_imported} importées</span>
              </div>
              {row.rows_with_errors > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-3 h-3" />
                  <span>{row.rows_with_errors} erreurs</span>
                </div>
              )}
              {row.rows_skipped > 0 && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{row.rows_skipped} ignorées</span>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'success_rate',
      label: 'Taux de succès',
      render: (_, row) => {
        if (row.status !== 'completed' || !row.total_rows) return '-';
        const rate = Math.round((row.rows_imported / row.total_rows) * 100);
        return (
          <div>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${rate}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700">{rate}%</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => handleValidate(row.id)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Valider les données"
                disabled={validateMutation.isPending}
              >
                <Shield className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleProcess(row.id)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Traiter les données"
                disabled={processMutation.isPending}
              >
                <Play className="w-4 h-4" />
              </button>
            </>
          )}
          {row.status === 'completed' && (
            <button
              onClick={() => handleDownloadReport(row.id)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Télécharger le rapport"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historique des importations</h2>
          <p className="text-gray-600 mt-1">{imports.length} importations au total</p>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={imports}
          loading={isLoading}
          emptyMessage={
            <div className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune importation</p>
              <p className="text-gray-400 text-sm mt-2">
                Commencez par importer un fichier Excel
              </p>
            </div>
          }
        />
      </Card>
    </div>
  );
}
