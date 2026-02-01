/**
 * Excel Import Page - File upload and import history
 */
import { useState } from 'react';
import { FileSpreadsheet, Upload, History } from 'lucide-react';
import { Card, Button } from '../components/common';
import FileUpload from '../components/excel/FileUpload';
import ImportHistory from '../components/excel/ImportHistory';

export default function ExcelPage() {
  const [activeTab, setActiveTab] = useState('upload');

  const handleUploadComplete = () => {
    // Switch to history tab after successful upload
    setActiveTab('history');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
          <FileSpreadsheet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import de fichiers Excel</h1>
          <p className="text-gray-600 mt-1">Importez et gérez vos fichiers de données</p>
        </div>
      </div>

      {/* Tabs */}
      <Card className="p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            Importer un fichier
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4" />
            Historique
          </button>
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'upload' ? (
        <FileUpload onUploadComplete={handleUploadComplete} />
      ) : (
        <ImportHistory />
      )}
    </div>
  );
}
