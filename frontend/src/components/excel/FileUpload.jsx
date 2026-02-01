import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { excelService } from '../../services/excelService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const DATA_TYPES = [
  { value: 'company', label: 'Entreprises' },
  { value: 'activity', label: 'Activités' },
  { value: 'participant', label: 'Participants' },
  { value: 'budget', label: 'Budgets' },
];

export default function FileUpload({ onUploadComplete }) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [dataType, setDataType] = useState('company');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [autoProcess, setAutoProcess] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: ({ file, dataType }) => excelService.uploadFile(file, dataType, (progress) => {
      setUploadProgress(progress);
    }),
    onSuccess: async (response) => {
      console.log('Upload success:', response);
      toast.success('Fichier importé avec succès');
      
      // Auto-process if enabled
      if (autoProcess && response.data?.importId) {
        try {
          toast.loading('Traitement automatique en cours...', { id: 'auto-process' });
          await excelService.process(response.data.importId);
          toast.success('Données traitées avec succès', { id: 'auto-process' });
        } catch (error) {
          console.error('Auto-process error:', error);
          toast.error('Erreur lors du traitement automatique', { id: 'auto-process' });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSelectedFile(null);
      setUploadProgress(0);
      if (onUploadComplete) onUploadComplete(response);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'importation';
      toast.error(errorMessage);
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
  });

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    console.log('Starting upload:', { file: selectedFile.name, dataType });
    uploadMutation.mutate({ file: selectedFile, dataType });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Data Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de données à importer
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DATA_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setDataType(type.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                dataType === type.value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <FileSpreadsheet className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File Drop Zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fichier Excel
        </label>
        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
            <p className="text-gray-700 font-medium mb-1">
              {isDragActive
                ? 'Déposez le fichier ici...'
                : 'Glissez-déposez un fichier Excel ici'}
            </p>
            <p className="text-gray-500 text-sm mb-4">ou cliquez pour parcourir</p>
            <p className="text-xs text-gray-400">
              Formats acceptés: .xlsx, .xls, .csv (max 10MB)
            </p>
          </div>
        ) : (
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <File className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  {!uploadMutation.isPending && (
                    <button
                      onClick={handleRemoveFile}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Upload Progress */}
                {uploadMutation.isPending && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Importation en cours...</span>
                      <span className="font-medium text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Process Toggle */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <input
          type="checkbox"
          id="autoProcess"
          checked={autoProcess}
          onChange={(e) => setAutoProcess(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        <label htmlFor="autoProcess" className="flex-1 cursor-pointer">
          <div className="font-medium text-gray-900">Traitement automatique</div>
          <div className="text-sm text-gray-600">
            Traiter les données immédiatement après l'importation
          </div>
        </label>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-2">Instructions d'importation:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Le fichier doit contenir les colonnes appropriées pour le type sélectionné</li>
              <li>{autoProcess ? 'Les données seront traitées automatiquement après l\'importation' : 'Vous pourrez valider et traiter les données manuellement'}</li>
              <li>Les doublons seront détectés et signalés</li>
              <li>Un rapport d'importation sera généré à la fin</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleRemoveFile}
          disabled={!selectedFile || uploadMutation.isPending}
        >
          Annuler
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          isLoading={uploadMutation.isPending}
          icon={Upload}
        >
          {uploadMutation.isPending ? 'Importation...' : 'Importer le fichier'}
        </Button>
      </div>
    </div>
  );
}
