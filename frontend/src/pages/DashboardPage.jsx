/**
 * Dashboard Page - Main overview with KPIs and Charts
 */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { dashboardService } from '../services/dashboardService';
import { companyService } from '../services/companyService';
import { activityService } from '../services/activityService';
import { Card, Loader } from '../components/common';
import { KPICard } from '../components/dashboard/KPICard';
import InteractiveMap from '../components/map/InteractiveMap';
import { 
  Building2, 
  Calendar, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  BarChart3,
  TrendingDown,
  CheckCircle,
  Clock,
  Map,
  Settings,
  Shield,
  Briefcase,
  DollarSign as Finance,
  Megaphone,
  UserCheck,
  Handshake
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export const DashboardPage = () => {
  const currentYear = new Date().getFullYear();
  const [activeKpiTab, setActiveKpiTab] = useState('synthese');
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [kpiData, setKpiData] = useState({
    audit_control: {},
    relations_institutionnelles: {},
    synthese_departements: {},
    admin_financier: {},
    appui_promotion: {},
    services_ressortissants: {},
    strategie_partenariat: {}
  });

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['dashboard-overview', currentYear],
    queryFn: () => dashboardService.getOverview({ year: currentYear }),
  });

  const { data: companyStats, isLoading: loadingCompanies } = useQuery({
    queryKey: ['company-stats'],
    queryFn: () => companyService.getStats(),
  });

  const { data: activityStats, isLoading: loadingActivities } = useQuery({
    queryKey: ['activity-stats', currentYear],
    queryFn: () => activityService.getStats({ year: currentYear }),
  });

  const { data: dataQuality, isLoading: loadingQuality } = useQuery({
    queryKey: ['data-quality'],
    queryFn: () => dashboardService.getDataQuality(),
  });

  // Fetch KPI periods
  useEffect(() => {
    fetchPeriods();
    fetchActivePeriod();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchAllKpis();
    }
  }, [selectedPeriod]);

  const fetchPeriods = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/kpis/periods`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPeriods(response.data.data);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const fetchActivePeriod = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/kpis/periods/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.data) {
        setSelectedPeriod(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching active period:', error);
    }
  };

  const fetchAllKpis = async () => {
    if (!selectedPeriod) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/kpis/all/${selectedPeriod.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKpiData(response.data.data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };



  // Fetch companies and activities for map
  const { data: companiesData } = useQuery({
    queryKey: ['companies-dashboard'],
    queryFn: () => companyService.getAll({ limit: 100 }),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['activities-dashboard'],
    queryFn: () => activityService.getAll({ limit: 100 }),
  });

  // Extract data from API responses
  const metrics = overview?.data?.metrics || {};
  const activityTrends = overview?.data?.activityTrend || [];
  const budgetUtilization = overview?.data?.budgetUtilization || [];
  
  const companies = companiesData?.data?.companies || [];
  const activities = activitiesData?.data?.activities || [];
  const mappableCompanies = companies.filter(c => c.latitude && c.longitude);
  const mappableActivities = activities.filter(a => a.latitude && a.longitude);
  
  // Combine companies and activities into markers for the map
  const mapMarkers = [
    ...mappableCompanies.map(c => ({
      ...c,
      type: 'company',
      color: 'blue',
    })),
    ...mappableActivities.map(a => ({
      ...a,
      type: 'activity',
      color: 'green',
    })),
  ];
  
  // Calculate budget totals
  const totalBudgetAllocated = parseFloat(metrics.total_budget) || 0;
  const totalBudgetSpent = parseFloat(metrics.total_expenses) || 0;
  const budgetRemaining = totalBudgetAllocated - totalBudgetSpent;
  const budgetUtilizationPercentage = totalBudgetAllocated > 0 
    ? ((totalBudgetSpent / totalBudgetAllocated) * 100).toFixed(1) 
    : 0;

  const getCategoryFromTab = (tab) => {
    const mapping = {
      'synthese': 'synthese_departements',
      'audit': 'audit_control',
      'relations': 'relations_institutionnelles',
      'admin': 'admin_financier',
      'appui': 'appui_promotion',
      'services': 'services_ressortissants',
      'strategie': 'strategie_partenariat'
    };
    return mapping[tab];
  };

  const getColorScheme = (index) => {
    const colors = [
      { from: 'from-blue-500', to: 'to-blue-600', text: 'text-white', icon: TrendingUp },
      { from: 'from-green-500', to: 'to-green-600', text: 'text-white', icon: CheckCircle },
      { from: 'from-purple-500', to: 'to-purple-600', text: 'text-white', icon: BarChart3 },
      { from: 'from-orange-500', to: 'to-orange-600', text: 'text-white', icon: DollarSign },
      { from: 'from-pink-500', to: 'to-pink-600', text: 'text-white', icon: Users },
      { from: 'from-indigo-500', to: 'to-indigo-600', text: 'text-white', icon: Building2 },
      { from: 'from-teal-500', to: 'to-teal-600', text: 'text-white', icon: Calendar },
      { from: 'from-red-500', to: 'to-red-600', text: 'text-white', icon: AlertTriangle },
      { from: 'from-cyan-500', to: 'to-cyan-600', text: 'text-white', icon: Briefcase },
    ];
    return colors[index % colors.length];
  };

  const renderKpiTab = () => {
    const category = getCategoryFromTab(activeKpiTab);
    const data = kpiData[category] || {};
    
    if (Object.keys(data).length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune donnée KPI disponible pour cette catégorie</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data).map(([key, value], index) => {
          if (key === 'id' || key === 'period_id' || key === 'created_by' || key === 'created_at' || key === 'updated_at' || key === 'notes') return null;
          
          const label = key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          const colorScheme = getColorScheme(index);
          const Icon = colorScheme.icon;
          
          return (
            <div key={key} className={`p-5 bg-gradient-to-br ${colorScheme.from} ${colorScheme.to} rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-8 w-8 ${colorScheme.text} opacity-80`} />
                <div className={`text-xs ${colorScheme.text} opacity-75 font-medium px-2 py-1 bg-white bg-opacity-20 rounded-full`}>
                  {activeKpiTab.toUpperCase()}
                </div>
              </div>
              <p className={`text-sm ${colorScheme.text} opacity-90 mb-2`}>{label}</p>
              <p className={`text-3xl font-bold ${colorScheme.text}`}>
                {typeof value === 'number' ? value.toLocaleString() : value || 0}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de vos activités et performances - {currentYear}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Entreprises"
          value={parseInt(companyStats?.data?.stats?.total_companies) || parseInt(metrics.total_companies) || 0}
          subtitle={`${parseInt(companyStats?.data?.stats?.active_members) || 0} adhérents actifs`}
          icon={Building2}
          color="blue"
          loading={loadingCompanies}
        />

        <KPICard
          title="Activités"
          value={parseInt(activityStats?.data?.stats?.total_activities) || parseInt(metrics.total_activities) || 0}
          subtitle={`${parseInt(activityStats?.data?.stats?.in_progress) || 0} en cours`}
          icon={Calendar}
          color="green"
          loading={loadingActivities}
        />

        <KPICard
          title="Participants"
          value={parseInt(metrics.total_participants) || 0}
          subtitle="Cette année"
          icon={Users}
          color="purple"
          loading={loadingOverview}
        />

        <KPICard
          title="Budget"
          value={`${budgetUtilizationPercentage}%`}
          subtitle={totalBudgetAllocated > 0 ? `${(totalBudgetAllocated / 1000000).toFixed(1)}M MAD alloués` : 'Non défini'}
          icon={TrendingUp}
          color="orange"
          loading={loadingOverview}
        />
      </div>

      {/* Charts and Stats Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Activity Trends Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tendances des activités</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          {loadingOverview ? (
            <div className="flex items-center justify-center h-64">
              <Loader />
            </div>
          ) : activityTrends && activityTrends.length > 0 ? (
            <div className="space-y-4">
              {activityTrends.slice(0, 6).map((trend, index) => {
                const month = trend.month ? new Date(trend.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : `Mois ${index + 1}`;
                const colors = [
                  { from: 'from-blue-500', to: 'to-blue-600', bg: 'bg-blue-50' },
                  { from: 'from-purple-500', to: 'to-purple-600', bg: 'bg-purple-50' },
                  { from: 'from-pink-500', to: 'to-pink-600', bg: 'bg-pink-50' },
                  { from: 'from-orange-500', to: 'to-orange-600', bg: 'bg-orange-50' },
                  { from: 'from-green-500', to: 'to-green-600', bg: 'bg-green-50' },
                  { from: 'from-teal-500', to: 'to-teal-600', bg: 'bg-teal-50' },
                ];
                const color = colors[index % colors.length];
                return (
                  <div key={index} className={`p-3 ${color.bg} rounded-lg`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {month}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {parseInt(trend.count) || 0} activités
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 shadow-inner">
                      <div
                        className={`bg-gradient-to-r ${color.from} ${color.to} h-3 rounded-full transition-all duration-500 shadow-md`}
                        style={{ width: `${Math.min((parseInt(trend.count) || 0) * 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <BarChart3 className="h-16 w-16 mb-4" />
              <p>Aucune donnée de tendance disponible</p>
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Statistiques rapides</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Complétées</p>
                  <p className="text-xs text-gray-500">Activités terminées</p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">
                {parseInt(activityStats?.data?.stats?.completed) || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">En cours</p>
                  <p className="text-xs text-gray-500">Activités actives</p>
                </div>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {parseInt(activityStats?.data?.stats?.in_progress) || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Planifiées</p>
                  <p className="text-xs text-gray-500">À venir</p>
                </div>
              </div>
              <span className="text-lg font-bold text-orange-600">
                {parseInt(activityStats?.data?.stats?.planned) || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Annulées</p>
                  <p className="text-xs text-gray-500">Activités annulées</p>
                </div>
              </div>
              <span className="text-lg font-bold text-red-600">
                {activityStats?.data?.stats?.cancelled || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Stats Row 2 - Company & Regional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Company Sector Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Répartition par secteur</h3>
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {[
              { sector: 'Technologie', count: 45, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
              { sector: 'Commerce', count: 38, color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
              { sector: 'Services', count: 32, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
              { sector: 'Industrie', count: 28, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
              { sector: 'Agriculture', count: 15, color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50' },
            ].map((item, index) => {
              const total = 158;
              const percentage = Math.round((item.count / total) * 100);
              return (
                <div key={index} className={`p-3 ${item.bg} rounded-lg`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.sector}</span>
                    <span className="text-xs font-semibold text-gray-600">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2 shadow-inner">
                    <div
                      className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Regional Performance Chart */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance régionale</h3>
            <Map className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {[
              { region: 'Casablanca-Settat', score: 92, activities: 45, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-600' },
              { region: 'Rabat-Salé-Kénitra', score: 88, activities: 38, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600' },
              { region: 'Tanger-Tétouan', score: 75, activities: 28, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-600' },
              { region: 'Fès-Meknès', score: 68, activities: 22, color: 'from-orange-500 to-orange-600', textColor: 'text-orange-600' },
              { region: 'Marrakech-Safi', score: 62, activities: 18, color: 'from-pink-500 to-pink-600', textColor: 'text-pink-600' },
            ].map((region, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{region.region}</span>
                    <span className={`text-xs font-bold ${region.textColor}`}>{region.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-gradient-to-r ${region.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${region.score}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{region.activities} activités</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Comparison Chart */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Comparaison mensuelle</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {[
              { month: 'Jan', value: 85, change: '+12%', color: 'bg-gradient-to-t from-blue-500 to-blue-400', positive: true },
              { month: 'Fév', value: 92, change: '+8%', color: 'bg-gradient-to-t from-green-500 to-green-400', positive: true },
              { month: 'Mar', value: 78, change: '-15%', color: 'bg-gradient-to-t from-orange-500 to-orange-400', positive: false },
              { month: 'Avr', value: 95, change: '+22%', color: 'bg-gradient-to-t from-purple-500 to-purple-400', positive: true },
              { month: 'Mai', value: 88, change: '-7%', color: 'bg-gradient-to-t from-pink-500 to-pink-400', positive: false },
            ].map((item, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{item.month}</span>
                    <span className={`text-xs font-bold ${
                      item.positive ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {item.change}
                    </span>
                  </div>
                  <div className="h-20 bg-gray-100 rounded-lg flex items-end overflow-hidden">
                    <div
                      className={`${item.color} w-full rounded-t-lg transition-all duration-500 shadow-lg`}
                      style={{ height: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts and Stats Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Budget Pie Chart */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Distribution du budget</h3>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="flex flex-col items-center">
            {/* Donut Chart */}
            <div className="relative w-48 h-48 mb-6">
              <svg className="transform -rotate-90" width="192" height="192" viewBox="0 0 192 192">
                {/* Background circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="32"
                />
                {/* Formations - 35% - Blue */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="url(#gradient-blue)"
                  strokeWidth="32"
                  strokeDasharray="175.93 502.65"
                  strokeDashoffset="0"
                  className="transition-all duration-1000"
                />
                {/* Événements - 25% - Purple */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="url(#gradient-purple)"
                  strokeWidth="32"
                  strokeDasharray="125.66 502.65"
                  strokeDashoffset="-175.93"
                  className="transition-all duration-1000"
                />
                {/* Développement - 20% - Green */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="url(#gradient-green)"
                  strokeWidth="32"
                  strokeDasharray="100.53 502.65"
                  strokeDashoffset="-301.59"
                  className="transition-all duration-1000"
                />
                {/* Marketing - 12% - Orange */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="url(#gradient-orange)"
                  strokeWidth="32"
                  strokeDasharray="60.32 502.65"
                  strokeDashoffset="-402.12"
                  className="transition-all duration-1000"
                />
                {/* Infrastructure - 8% - Pink */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="url(#gradient-pink)"
                  strokeWidth="32"
                  strokeDasharray="40.21 502.65"
                  strokeDashoffset="-462.44"
                  className="transition-all duration-1000"
                />
                
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#9333ea" />
                  </linearGradient>
                  <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="gradient-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  <linearGradient id="gradient-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#db2777" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-900">7.0M</p>
                <p className="text-xs text-gray-500">Total Budget</p>
              </div>
            </div>
            
            {/* Legend */}
            <div className="w-full space-y-2">
              {[
                { label: 'Formations', value: '35%', color: 'bg-blue-500' },
                { label: 'Événements', value: '25%', color: 'bg-purple-500' },
                { label: 'Développement', value: '20%', color: 'bg-green-500' },
                { label: 'Marketing', value: '12%', color: 'bg-orange-500' },
                { label: 'Infrastructure', value: '8%', color: 'bg-pink-500' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Activity Status Donut Chart */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Statut des activités</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="flex flex-col items-center">
            {/* Donut Chart */}
            <div className="relative w-48 h-48 mb-6">
              <svg className="transform -rotate-90" width="192" height="192" viewBox="0 0 192 192">
                {/* Background */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="40"
                />
                {/* Completed - 45% */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  fill="none"
                  stroke="url(#gradient-success)"
                  strokeWidth="40"
                  strokeDasharray="197.92 439.82"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                {/* In Progress - 35% */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  fill="none"
                  stroke="url(#gradient-info)"
                  strokeWidth="40"
                  strokeDasharray="153.94 439.82"
                  strokeDashoffset="-197.92"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                {/* Planned - 15% */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  fill="none"
                  stroke="url(#gradient-warning)"
                  strokeWidth="40"
                  strokeDasharray="65.97 439.82"
                  strokeDashoffset="-351.86"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                {/* Cancelled - 5% */}
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  fill="none"
                  stroke="url(#gradient-danger)"
                  strokeWidth="40"
                  strokeDasharray="21.99 439.82"
                  strokeDashoffset="-417.83"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                
                <defs>
                  <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="gradient-info" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="gradient-danger" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-900">
                  {parseInt(activityStats?.data?.stats?.total_activities) || 0}
                </p>
                <p className="text-xs text-gray-500">Activités</p>
              </div>
            </div>
            
            {/* Legend */}
            <div className="w-full space-y-2">
              {[
                { label: 'Complétées', value: parseInt(activityStats?.data?.stats?.completed) || 0, color: 'bg-green-500' },
                { label: 'En cours', value: parseInt(activityStats?.data?.stats?.in_progress) || 0, color: 'bg-blue-500' },
                { label: 'Planifiées', value: parseInt(activityStats?.data?.stats?.planned) || 0, color: 'bg-orange-500' },
                { label: 'Annulées', value: activityStats?.data?.stats?.cancelled || 0, color: 'bg-red-500' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Radial Progress Chart */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Score de performance</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="flex flex-col items-center">
            {/* Multi-ring Progress */}
            <div className="relative w-48 h-48 mb-6">
              {/* Overall Performance - Outer ring */}
              <svg className="transform -rotate-90 absolute inset-0" width="192" height="192" viewBox="0 0 192 192">
                <circle
                  cx="96"
                  cy="96"
                  r="85"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="12"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="85"
                  fill="none"
                  stroke="url(#gradient-emerald)"
                  strokeWidth="12"
                  strokeDasharray="534.07"
                  strokeDashoffset={534.07 * (1 - 0.92)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              
              {/* Budget Utilization - Middle ring */}
              <svg className="transform -rotate-90 absolute inset-0" width="192" height="192" viewBox="0 0 192 192">
                <circle
                  cx="96"
                  cy="96"
                  r="68"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="12"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="68"
                  fill="none"
                  stroke="url(#gradient-blue-ring)"
                  strokeWidth="12"
                  strokeDasharray="427.26"
                  strokeDashoffset={427.26 * (1 - (budgetUtilizationPercentage / 100))}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              
              {/* Data Quality - Inner ring */}
              <svg className="transform -rotate-90 absolute inset-0" width="192" height="192" viewBox="0 0 192 192">
                <circle
                  cx="96"
                  cy="96"
                  r="51"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="12"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="51"
                  fill="none"
                  stroke="url(#gradient-purple-ring)"
                  strokeWidth="12"
                  strokeDasharray="320.44"
                  strokeDashoffset={320.44 * (1 - 0.85)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              
              <defs>
                <linearGradient id="gradient-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="gradient-blue-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="gradient-purple-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
              </defs>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-900">A+</p>
                <p className="text-xs text-gray-500">Excellent</p>
              </div>
            </div>
            
            {/* Legend */}
            <div className="w-full space-y-2">
              {[
                { label: 'Performance globale', value: '92%', color: 'bg-emerald-500' },
                { label: 'Utilisation budget', value: `${budgetUtilizationPercentage}%`, color: 'bg-blue-500' },
                { label: 'Qualité données', value: '85%', color: 'bg-purple-500' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Original Budget Overview and Data Quality Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Budget Overview */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Aperçu du budget</h3>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          
          {loadingOverview ? (
            <div className="flex items-center justify-center h-48">
              <Loader />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg text-white text-center">
                    <DollarSign className="h-5 w-5 mx-auto mb-1 opacity-80" />
                    <p className="text-xs opacity-90 mb-1">Alloué</p>
                    <p className="text-sm font-bold">
                      {totalBudgetAllocated > 0 ? `${(totalBudgetAllocated / 1000000).toFixed(1)}M` : '0'}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white text-center">
                    <TrendingDown className="h-5 w-5 mx-auto mb-1 opacity-80" />
                    <p className="text-xs opacity-90 mb-1">Dépensé</p>
                    <p className="text-sm font-bold">
                      {totalBudgetSpent > 0 ? `${(totalBudgetSpent / 1000000).toFixed(1)}M` : '0'}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white text-center">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1 opacity-80" />
                    <p className="text-xs opacity-90 mb-1">Restant</p>
                    <p className="text-sm font-bold">
                      {budgetRemaining > 0 ? `${(budgetRemaining / 1000000).toFixed(1)}M` : '0'}
                    </p>
                  </div>
                </div>
                
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        Utilisation
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {budgetUtilizationPercentage}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-200">
                    <div
                      style={{ width: `${budgetUtilizationPercentage}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                        budgetUtilizationPercentage > 90
                          ? 'bg-red-500'
                          : budgetUtilizationPercentage > 75
                          ? 'bg-orange-500'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Data Quality */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Qualité des données</h3>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          
          {loadingQuality ? (
            <div className="flex items-center justify-center h-48">
              <Loader />
            </div>
          ) : dataQuality?.data ? (
            <div className="space-y-4">
              {/* Calculate average score from distribution */}
              {(() => {
                const distribution = dataQuality.data.qualityDistribution || [];
                const avgScore = distribution.length > 0 
                  ? distribution.reduce((sum, item) => sum + (parseFloat(item.avg_score) || 0) * (parseInt(item.count) || 0), 0) / 
                    distribution.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0)
                  : parseFloat(metrics.avg_quality_score) || 0;
                
                const highCount = distribution.find(d => d.quality_level === 'High (80-100)')?.count || 0;
                const mediumCount = distribution.find(d => d.quality_level === 'Medium (50-79)')?.count || 0;
                const lowCount = distribution.find(d => d.quality_level === 'Low (0-49)')?.count || 0;

                return (
                  <>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Score moyen</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Math.round(avgScore)}/100
                        </p>
                      </div>
                      <div className="h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-green-600">
                          {Math.round(avgScore)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Excellente</p>
                        <p className="text-lg font-bold text-blue-600">
                          {parseInt(highCount)}
                        </p>
                        <p className="text-xs text-gray-500">80-100</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Bonne</p>
                        <p className="text-lg font-bold text-green-600">
                          {parseInt(mediumCount)}
                        </p>
                        <p className="text-xs text-gray-500">60-79</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Moyenne</p>
                        <p className="text-lg font-bold text-orange-600">
                          0
                        </p>
                        <p className="text-xs text-gray-500">40-59</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Faible</p>
                        <p className="text-lg font-bold text-red-600">
                          {parseInt(lowCount)}
                        </p>
                        <p className="text-xs text-gray-500">0-39</p>
                      </div>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            {parseInt(metrics.open_quality_issues) || 0} problèmes détectés
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Vérifiez les données pour améliorer la qualité
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <AlertTriangle className="h-16 w-16 mb-4" />
              <p>Aucune donnée de qualité disponible</p>
            </div>
          )}
        </Card>
      </div>

      {/* Gauge Charts Row - Team Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {[
          { title: 'Productivité', value: 87, color: 'emerald', max: 100, unit: '%' },
          { title: 'Satisfaction', value: 4.6, color: 'blue', max: 5, unit: '/5' },
          { title: 'Engagement', value: 78, color: 'purple', max: 100, unit: '%' },
          { title: 'Innovation', value: 92, color: 'orange', max: 100, unit: '%' },
        ].map((gauge, index) => {
          const percentage = (gauge.value / gauge.max) * 100;
          const rotation = (percentage / 100) * 180;
          
          return (
            <Card key={index}>
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">{gauge.title}</h4>
                
                {/* Semi-circular Gauge */}
                <div className="relative w-40 h-20 mb-4">
                  <svg width="160" height="80" viewBox="0 0 160 80" className="overflow-visible">
                    {/* Background arc */}
                    <path
                      d="M 10 80 A 70 70 0 0 1 150 80"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                    
                    {/* Progress arc */}
                    <path
                      d="M 10 80 A 70 70 0 0 1 150 80"
                      fill="none"
                      stroke={`url(#gauge-gradient-${gauge.color}-${index})`}
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray="219.91"
                      strokeDashoffset={219.91 * (1 - percentage / 100)}
                      className="transition-all duration-1000"
                    />
                    
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id={`gauge-gradient-${gauge.color}-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={
                          gauge.color === 'emerald' ? '#10b981' :
                          gauge.color === 'blue' ? '#3b82f6' :
                          gauge.color === 'purple' ? '#a855f7' :
                          '#f97316'
                        } />
                        <stop offset="100%" stopColor={
                          gauge.color === 'emerald' ? '#059669' :
                          gauge.color === 'blue' ? '#2563eb' :
                          gauge.color === 'purple' ? '#9333ea' :
                          '#ea580c'
                        } />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center value */}
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
                    <p className={`text-2xl font-bold ${
                      gauge.color === 'emerald' ? 'text-emerald-600' :
                      gauge.color === 'blue' ? 'text-blue-600' :
                      gauge.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`}>
                      {gauge.value}{gauge.unit}
                    </p>
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  percentage >= 80 ? 'bg-green-100 text-green-700' :
                  percentage >= 60 ? 'bg-blue-100 text-blue-700' :
                  percentage >= 40 ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {percentage >= 80 ? 'Excellent' :
                   percentage >= 60 ? 'Bien' :
                   percentage >= 40 ? 'Moyen' : 'Faible'}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts and Stats Row 4 - Budget & Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Budget Breakdown by Category */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Répartition budgétaire</h3>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {[
              { category: 'Formations', amount: 2.5, color: 'from-blue-500 to-blue-600', icon: Users },
              { category: 'Événements', amount: 1.8, color: 'from-purple-500 to-purple-600', icon: Calendar },
              { category: 'Développement', amount: 1.2, color: 'from-green-500 to-green-600', icon: TrendingUp },
              { category: 'Marketing', amount: 0.9, color: 'from-orange-500 to-orange-600', icon: Megaphone },
              { category: 'Infrastructure', amount: 0.6, color: 'from-pink-500 to-pink-600', icon: Building2 },
            ].map((item, index) => {
              const Icon = item.icon;
              const total = 7.0;
              const percentage = Math.round((item.amount / total) * 100);
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 bg-gradient-to-br ${item.color} rounded-lg`}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.amount}M MAD</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Performing Activities */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top activités</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {[
              { name: 'Formation Leadership', participants: 156, rating: 4.8, color: 'from-emerald-500 to-emerald-600' },
              { name: 'Salon Export', participants: 142, rating: 4.6, color: 'from-blue-500 to-blue-600' },
              { name: 'Workshop Innovation', participants: 128, rating: 4.5, color: 'from-purple-500 to-purple-600' },
              { name: 'Networking Event', participants: 115, rating: 4.4, color: 'from-orange-500 to-orange-600' },
              { name: 'Conférence Tech', participants: 98, rating: 4.2, color: 'from-pink-500 to-pink-600' },
            ].map((activity, index) => (
              <div key={index} className={`p-3 bg-gradient-to-r ${activity.color} rounded-lg text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{activity.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-300 text-xs">★</span>
                    <span className="text-xs font-bold">{activity.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 opacity-80" />
                    <span className="text-xs opacity-90">{activity.participants} participants</span>
                  </div>
                  <span className="text-xs opacity-75">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Timeline */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Timeline performance</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {[
              { quarter: 'Q1 2026', progress: 95, status: 'Excellent', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
              { quarter: 'Q4 2025', progress: 88, status: 'Très bien', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
              { quarter: 'Q3 2025', progress: 76, status: 'Bien', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
              { quarter: 'Q2 2025', progress: 82, status: 'Très bien', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50' },
              { quarter: 'Q1 2025', progress: 71, status: 'Bien', color: 'from-pink-500 to-pink-600', bg: 'bg-pink-50' },
            ].map((quarter, index) => (
              <div key={index} className={`p-3 ${quarter.bg} rounded-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">{quarter.quarter}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${quarter.bg}`}>
                    {quarter.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="w-full bg-white rounded-full h-2 shadow-inner">
                      <div
                        className={`bg-gradient-to-r ${quarter.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${quarter.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{quarter.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Interactive Map Section */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Carte géographique</h3>
          </div>
          <div className="text-sm text-gray-600">
            {mappableCompanies.length} entreprises • {mappableActivities.length} activités
          </div>
        </div>
        <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '400px' }}>
          <InteractiveMap 
            markers={mapMarkers}
          />
        </div>
      </Card>

      {/* Recent Activity Summary */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Résumé de l'activité</h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
            <Building2 className="h-8 w-8 mb-2 opacity-80" />
            <p className="text-sm opacity-90">Total Entreprises</p>
            <p className="text-3xl font-bold mt-1">
              {parseInt(companyStats?.data?.stats?.total_companies) || parseInt(metrics.total_companies) || 0}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
            <Users className="h-8 w-8 mb-2 opacity-80" />
            <p className="text-sm opacity-90">Adhérents Actifs</p>
            <p className="text-3xl font-bold mt-1">
              {parseInt(companyStats?.data?.stats?.active_members) || 0}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
            <Calendar className="h-8 w-8 mb-2 opacity-80" />
            <p className="text-sm opacity-90">Activités {currentYear}</p>
            <p className="text-3xl font-bold mt-1">
              {parseInt(activityStats?.data?.stats?.total_activities) || parseInt(metrics.total_activities) || 0}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
            <TrendingUp className="h-8 w-8 mb-2 opacity-80" />
            <p className="text-sm opacity-90">Taux de complétion</p>
            <p className="text-3xl font-bold mt-1">
              {(() => {
                const completed = parseInt(activityStats?.data?.stats?.completed) || 0;
                const total = parseInt(activityStats?.data?.stats?.total_activities) || 0;
                return total > 0 ? Math.round((completed / total) * 100) : 0;
              })()}%
            </p>
          </div>
        </div>
      </Card>

      {/* KPI Management Section */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            <h3 className="text-xl font-semibold text-gray-900">Indicateurs de Performance (KPIs)</h3>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod?.id || ''}
              onChange={(e) => {
                const period = periods.find(p => p.id === e.target.value);
                setSelectedPeriod(period);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              style={{ minWidth: '200px' }}
            >
              <option value="">Sélectionner une période</option>
              {periods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.name} {period.is_active ? '(Actif)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {[
              { id: 'synthese', label: 'Synthèse Départements', icon: Briefcase },
              { id: 'audit', label: 'Audit & Contrôle', icon: Shield },
              { id: 'relations', label: 'Relations Institutionnelles', icon: Handshake },
              { id: 'admin', label: 'Admin & Financier', icon: Finance },
              { id: 'appui', label: 'Appui Promotion', icon: Megaphone },
              { id: 'services', label: 'Services Ressortissants', icon: UserCheck },
              { id: 'strategie', label: 'Stratégie Partenariat', icon: TrendingUp }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveKpiTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap transition-colors ${
                    activeKpiTab === tab.id
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI Content */}
        {selectedPeriod ? (
          <div>
            {renderKpiTab()}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sélectionnez une période pour voir les KPIs</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
