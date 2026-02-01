import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Building2, Users, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color = 'blue') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative">
        <div class="w-8 h-8 bg-${color}-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to fit map bounds to markers
function FitBounds({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (markers && markers.length > 0) {
      const validMarkers = markers.filter(m => m.latitude && m.longitude);
      if (validMarkers.length > 0) {
        const bounds = validMarkers.map(m => [m.latitude, m.longitude]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [markers, map]);

  return null;
}

export default function InteractiveMap({ 
  markers = [], 
  center = [33.9716, -6.8498], // Rabat, Morocco
  zoom = 6,
  height = '600px',
  onMarkerClick,
}) {
  const mapRef = useRef(null);

  const validMarkers = markers.filter(m => m.latitude && m.longitude);

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg border border-gray-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validMarkers.length > 0 && <FitBounds markers={validMarkers} />}

        {validMarkers.map((marker, index) => (
          <Marker
            key={marker.id || index}
            position={[marker.latitude, marker.longitude]}
            icon={createCustomIcon(marker.color || 'blue')}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) onMarkerClick(marker);
              },
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {marker.type === 'company' ? (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    ) : marker.type === 'activity' ? (
                      <Activity className="w-5 h-5 text-blue-600" />
                    ) : (
                      <MapPin className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{marker.name || marker.title}</h3>
                    {marker.subtitle && (
                      <p className="text-sm text-gray-600">{marker.subtitle}</p>
                    )}
                  </div>
                </div>

                {marker.address && (
                  <div className="text-sm text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {marker.address}
                  </div>
                )}

                {marker.city && (
                  <div className="text-sm text-gray-600">
                    {marker.city}{marker.province && `, ${marker.province}`}
                  </div>
                )}

                {marker.description && (
                  <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                    {marker.description}
                  </p>
                )}

                {marker.stats && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {marker.stats.map((stat, i) => (
                      <div key={i} className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-600">{stat.label}</p>
                        <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {marker.onClick && (
                  <button
                    onClick={() => marker.onClick(marker)}
                    className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Voir les détails
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      {markers.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Légende</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">Entreprises ({validMarkers.filter(m => m.type === 'company').length})</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-gray-700">Activités ({validMarkers.filter(m => m.type === 'activity').length})</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
            Total: {validMarkers.length} marqueurs
          </div>
        </div>
      )}
    </div>
  );
}
