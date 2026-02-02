import { useState, useEffect } from 'react';
import axios from 'axios';
import KpiManagementForm from '../components/kpi/KpiManagementForm';
import './KPIsPage.css';

const API_URL = import.meta.env.VITE_API_URL;

const KPIsPage = () => {
  const [activePeriod, setActivePeriod] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [kpiData, setKpiData] = useState({
    audit_control: {},
    relations_institutionnelles: {},
    synthese_departements: {},
    admin_financier: {},
    appui_promotion: {},
    services_ressortissants: {},
    strategie_partenariat: {}
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('synthese');
  const [showManagementForm, setShowManagementForm] = useState(false);
  const [managementCategory, setManagementCategory] = useState(null);

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
      setActivePeriod(response.data.data);
      setSelectedPeriod(response.data.data?.id);
    } catch (error) {
      console.error('Error fetching active period:', error);
    }
  };

  const fetchAllKpis = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/kpis/all/${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKpiData(response.data.data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderKpiCard = (label, value, icon) => (
    <div className="kpi-card">
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-content">
        <h4>{label}</h4>
        <p className="kpi-value">{value !== undefined && value !== null ? value : '0'}</p>
      </div>
    </div>
  );

  const renderPercentageCard = (label, value, icon) => (
    <div className="kpi-card percentage">
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-content">
        <h4>{label}</h4>
        <p className="kpi-value">{value !== undefined && value !== null ? `${value}%` : '0%'}</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${value || 0}%` }}></div>
        </div>
      </div>
    </div>
  );

  const openManagementForm = (category) => {
    setManagementCategory(category);
    setShowManagementForm(true);
  };

  const handleFormSave = () => {
    setShowManagementForm(false);
    setManagementCategory(null);
    fetchAllKpis(); // Refresh data
  };

  const handleFormCancel = () => {
    setShowManagementForm(false);
    setManagementCategory(null);
  };

  const renderSyntheseTab = () => (
    <div className="kpi-grid">
      <div className="kpi-section">
        <div className="section-header">
          <h3>📊 Synthèse par Département</h3>
          <button className="btn-manage" onClick={() => openManagementForm('synthese-departements')}>
            ✏️ Gérer les KPIs
          </button>
        </div>
        <div className="kpi-cards">
          {renderKpiCard(
            'Stratégie & Partenariat - Opportunités Internationales',
            kpiData.synthese_departements?.opportunites_internationales,
            '🌍'
          )}
          {renderKpiCard(
            'Services aux Ressortissants - Demandes Traitées',
            kpiData.synthese_departements?.demandes_traitees,
            '📝'
          )}
          {renderKpiCard(
            'Appui & Promotion - Entreprises Accompagnées',
            kpiData.synthese_departements?.entreprises_accompagnees,
            '🏢'
          )}
          {renderKpiCard(
            'Administratif & Financier - Prestations Réalisées',
            kpiData.synthese_departements?.prestations_realisees,
            '💼'
          )}
        </div>
      </div>
    </div>
  );

  const renderAuditTab = () => (
    <div className="kpi-grid">
      <div className="kpi-section">
        <div className="section-header">
          <h3>🔍 Audit & Contrôle</h3>
          <button className="btn-manage" onClick={() => openManagementForm('audit-control')}>
            ✏️ Gérer les KPIs
          </button>
        </div>
        <div className="kpi-cards">
          {renderKpiCard(
            'Rapports de Gestion Produits',
            kpiData.audit_control?.nombre_rapports_gestion,
            '📄'
          )}
          {renderKpiCard(
            'Tableaux de Bord Élaborés',
            kpiData.audit_control?.nombre_tableaux_bord,
            '📊'
          )}
          {renderKpiCard(
            'Missions d\'Audit Réalisées',
            kpiData.audit_control?.nombre_missions_audit,
            '🔎'
          )}
          {renderPercentageCard(
            'Taux de Mise en Œuvre des Recommandations',
            kpiData.audit_control?.taux_mise_en_oeuvre_recommandations,
            '✅'
          )}
          {renderKpiCard(
            'Procédures Améliorées',
            kpiData.audit_control?.nombre_procedures_ameliorees,
            '⚙️'
          )}
        </div>
      </div>
    </div>
  );

  const renderRelationsTab = () => (
    <div className="kpi-grid">
      <div className="kpi-section">
        <div className="section-header">
          <h3>🤝 Relations Institutionnelles</h3>
          <button className="btn-manage" onClick={() => openManagementForm('relations-institutionnelles')}>
            ✏️ Gérer les KPIs
          </button>
        </div>
        <div className="kpi-cards">
          {renderKpiCard(
            'Réunions AG/Bureau/Commissions',
            kpiData.relations_institutionnelles?.nombre_reunions_ag_bureau_commissions,
            '👥'
          )}
          {renderKpiCard(
            'Conventions / Partenariats Institutionnels',
            kpiData.relations_institutionnelles?.nombre_conventions_partenariats,
            '📜'
          )}
          {renderKpiCard(
            'PV et Rapports Élaborés',
            kpiData.relations_institutionnelles?.nombre_pv_rapports,
            '📋'
          )}
          {renderKpiCard(
            'Relations avec Administrations',
            kpiData.relations_institutionnelles?.nombre_relations_administrations,
            '🏛️'
          )}
          {renderPercentageCard(
            'Taux de Réalisation du Plan d\'Action',
            kpiData.relations_institutionnelles?.taux_realisation_plan_action,
            '🎯'
          )}
        </div>
      </div>
    </div>
  );

  const renderAdminTab = () => (
    <div className="kpi-grid">
      <div className="kpi-section">
        <div className="section-header">
          <h3>💼 Administratif & Financier</h3>
          <button className="btn-manage" onClick={() => openManagementForm('admin-financier')}>
            ✏️ Gérer les KPIs
          </button>
        </div>
        <div className="kpi-cards">
          {renderKpiCard(
            'Assemblées Générales Organisées',
            kpiData.admin_financier?.assemblees_generales_organisees,
            '🏢'
          )}
          {renderKpiCard(
            'Prestations Logistiques Assurées',
            kpiData.admin_financier?.prestations_logistiques,
            '📦'
          )}
          {renderKpiCard(
            'Services de Restauration Fournis',
            kpiData.admin_financier?.services_restauration,
            '🍽️'
          )}
          {renderKpiCard(
            'Salles Mises à Disposition',
            kpiData.admin_financier?.salles_mises_disposition,
            '🚪'
          )}
          {renderKpiCard(
            'Attestations Délivrées',
            kpiData.admin_financier?.attestations_delivrees,
            '📃'
          )}
          {renderKpiCard(
            'Locations de Salles',
            kpiData.admin_financier?.locations_salles,
            '🏛️'
          )}
          {renderKpiCard(
            'Services Agenda Organisés',
            kpiData.admin_financier?.services_agenda_organises,
            '📅'
          )}
        </div>
      </div>
    </div>
  );

  const renderAppuiTab = () => (
    <div className="kpi-grid">
      <div className="kpi-section">
        <div className="section-header">
          <h3>🚀 Appui & Promotion</h3>
          <button className="btn-manage" onClick={() => openManagementForm('appui-promotion')}>
            ✏️ Gérer les KPIs
          </button>
        </div>
        <div className="kpi-cards">
          {renderKpiCard(
            'Porteurs de Projets Accompagnés',
            kpiData.appui_promotion?.porteurs_projets_accompagnes,
            '💡'
          )}
          {renderKpiCard(
            'Créateurs d\'Entreprise Accompagnés',
            kpiData.appui_promotion?.createurs_entreprise_accompagnes,
            '🏭'
          )}
          {renderKpiCard(
            'Entreprises Bénéficiaires des Guichets',
            kpiData.appui_promotion?.entreprises_guichets_proximite,
            '🏢'
          )}
          {renderKpiCard(
            'Demandes Administratives Traitées',
            kpiData.appui_promotion?.demandes_administratives_traitees,
            '📝'
          )}
          {renderKpiCard(
            'Porteurs de Projets Satisfaits',
            kpiData.appui_promotion?.porteurs_projets_satisfaits,
            '😊'
          )}
          {renderKpiCard(
            'Entrepreneurs Satisfaits',
            kpiData.appui_promotion?.entrepreneurs_satisfaits,
            '👍'
          )}
          {renderPercentageCard(
            'Résultat Enquête de Satisfaction',
            kpiData.appui_promotion?.taux_satisfaction,
            '⭐'
          )}
          {renderKpiCard(
            'Entrepreneurs Ayant Bénéficié d\'un Financement',
            kpiData.appui_promotion?.entrepreneurs_financement,
            '💰'
          )}
          {renderKpiCard(
            'Formations des Employés',
            kpiData.appui_promotion?.formations_employes,
            '🎓'
          )}
          {renderKpiCard(
            'Entreprises Radiées',
            kpiData.appui_promotion?.entreprises_radiees,
            '❌'
          )}
          {renderKpiCard(
            'Entreprises Bénéficiaires des Services CCIS',
            kpiData.appui_promotion?.entreprises_beneficiaires_services,
            '✅'
          )}
        </div>
      </div>
    </div>
  );

  const renderServicesTab = () => (
    <div className="kpi-grid">
      <div className="kpi-section">
        <div className="section-header">
          <h3>🇲🇦 Services aux Ressortissants</h3>
          <button className="btn-manage" onClick={() => openManagementForm('services-ressortissants')}>
            ✏️ Gérer les KPIs
          </button>
        </div>
        <div className="kpi-cards">
          {renderKpiCard(
            'Newsletters Éditées',
            kpiData.services_ressortissants?.newsletters_editees,
            '📰'
          )}
          {renderKpiCard(
            'Demandes des Ressortissants',
            kpiData.services_ressortissants?.demandes_ressortissants,
            '📨'
          )}
          {renderKpiCard(
            'Indicateurs Économiques Suivis',
            kpiData.services_ressortissants?.indicateurs_economiques_suivis,
            '📈'
          )}
        </div>
      </div>
    </div>
  );

  const renderStrategieTab = () => (
    <div className="kpi-grid">
      <div className="kpi-section">
        <div className="section-header">
          <h3>🌍 Stratégie & Partenariat</h3>
          <button className="btn-manage" onClick={() => openManagementForm('strategie-partenariat')}>
            ✏️ Gérer les KPIs
          </button>
        </div>
        <div className="kpi-cards">
          {renderKpiCard(
            'Actions Réalisées',
            kpiData.strategie_partenariat?.actions_realisees,
            '✅'
          )}
          {renderKpiCard(
            'Ressortissants Satisfaits (Événements)',
            kpiData.strategie_partenariat?.ressortissants_satisfaits_evenements,
            '😊'
          )}
          {renderKpiCard(
            'Entreprises à Potentiel Export',
            kpiData.strategie_partenariat?.entreprises_potentiel_export,
            '📦'
          )}
          {renderKpiCard(
            'Entreprises Accompagnées',
            kpiData.strategie_partenariat?.entreprises_accompagnees,
            '🏢'
          )}
          {renderKpiCard(
            'Délégations',
            kpiData.strategie_partenariat?.delegations,
            '👔'
          )}
          {renderKpiCard(
            'Opportunités d\'Affaires Internationales',
            kpiData.strategie_partenariat?.opportunites_affaires_internationales,
            '🌐'
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="kpis-page">
      <div className="page-header">
        <h1>📊 Indicateurs de Performance (KPIs)</h1>
        <div className="period-selector">
          <label htmlFor="period-select">Période:</label>
          <select
            id="period-select"
            value={selectedPeriod || ''}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name} {period.is_active && '(Active)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'synthese' ? 'active' : ''}`}
          onClick={() => setActiveTab('synthese')}
        >
          📊 Synthèse
        </button>
        <button
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          🔍 Audit
        </button>
        <button
          className={`tab ${activeTab === 'relations' ? 'active' : ''}`}
          onClick={() => setActiveTab('relations')}
        >
          🤝 Relations
        </button>
        <button
          className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          💼 Admin
        </button>
        <button
          className={`tab ${activeTab === 'appui' ? 'active' : ''}`}
          onClick={() => setActiveTab('appui')}
        >
          🚀 Appui
        </button>
        <button
          className={`tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          🇲🇦 Services
        </button>
        <button
          className={`tab ${activeTab === 'strategie' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategie')}
        >
          🌍 Stratégie
        </button>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="tab-content">
          {activeTab === 'synthese' && renderSyntheseTab()}
          {activeTab === 'audit' && renderAuditTab()}
          {activeTab === 'relations' && renderRelationsTab()}
          {activeTab === 'admin' && renderAdminTab()}
          {activeTab === 'appui' && renderAppuiTab()}
          {activeTab === 'services' && renderServicesTab()}
          {activeTab === 'strategie' && renderStrategieTab()}
        </div>
      )}

      {showManagementForm && (
        <div className="modal-overlay">
          <KpiManagementForm
            periodId={selectedPeriod}
            category={managementCategory}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        </div>
      )}
    </div>
  );
};

export default KPIsPage;
