/**
 * Map Page - Interactive map showing companies and activities
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map, Building2, Calendar } from 'lucide-react';
import { Card, Button } from '../components/common';
import InteractiveMap from '../components/map/InteractiveMap';
import { companyService } from '../services/companyService';
import { activityService } from '../services/activityService';

export default function MapPage() {
  const [showCompanies, setShowCompanies] = useState(true);
  const [showActivities, setShowActivities] = useState(true);

  const { data: companiesData } = useQuery({
    queryKey: ['companies-map'],
    queryFn: () => companyService.getAll({ limit: 1000 }),
    enabled: showCompanies,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['activities-map'],
    queryFn: () => activityService.getAll({ limit: 1000 }),
    enabled: showActivities,
  });

  const companies = companiesData?.data?.companies || [];
  const activities = activitiesData?.data?.activities || [];

  // Filter items with valid coordinates
  const mappableCompanies = companies.filter(c => c.latitude && c.longitude);
  const mappableActivities = activities.filter(a => a.latitude && a.longitude);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Carte interactive</h1>
            <p className="text-gray-600 mt-1">
              {mappableCompanies.length} entreprises • {mappableActivities.length} activités
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={showCompanies ? 'primary' : 'outline'}
            onClick={() => setShowCompanies(!showCompanies)}
            icon={Building2}
            size="sm"
          >
            Entreprises
          </Button>
          <Button
            variant={showActivities ? 'primary' : 'outline'}
            onClick={() => setShowActivities(!showActivities)}
            icon={Calendar}
            size="sm"
          >
            Activités
          </Button>
        </div>
      </div>

      {/* Map */}
      <Card className="p-0 overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
        <InteractiveMap
          companies={showCompanies ? mappableCompanies : []}
          activities={showActivities ? mappableActivities : []}
        />
      </Card>

      {/* Info */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-600">{mappableCompanies.length}</p>
            <p className="text-sm text-gray-600 mt-1">Entreprises géolocalisées</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{mappableActivities.length}</p>
            <p className="text-sm text-gray-600 mt-1">Activités géolocalisées</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-600">
              {mappableCompanies.length + mappableActivities.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total marqueurs</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
