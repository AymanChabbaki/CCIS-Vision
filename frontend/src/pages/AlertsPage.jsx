/**
 * Alerts Page - Notifications and alerts management
 */
import { AlertCircle } from 'lucide-react';
import AlertList from '../components/alerts/AlertList';

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centre de notifications</h1>
          <p className="text-gray-600 mt-1">Gérez vos alertes et notifications système</p>
        </div>
      </div>

      <AlertList />
    </div>
  );
}
