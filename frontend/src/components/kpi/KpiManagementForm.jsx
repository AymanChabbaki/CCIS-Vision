import { useState, useEffect } from 'react';
import axios from 'axios';
import './KpiManagementForm.css';

const API_URL = import.meta.env.VITE_API_URL;

const KpiManagementForm = ({ periodId, category, onSave, onCancel }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categoryConfigs = {
    'audit-control': {
      title: '🔍 Audit & Contrôle',
      endpoint: 'audit-control',
      fields: [
        { name: 'nombre_rapports_gestion', label: 'Rapports de Gestion Produits', type: 'number' },
        { name: 'nombre_tableaux_bord', label: 'Tableaux de Bord Élaborés', type: 'number' },
        { name: 'nombre_missions_audit', label: 'Missions d\'Audit Réalisées', type: 'number' },
        { name: 'taux_mise_en_oeuvre_recommandations', label: 'Taux de Mise en Œuvre (%)', type: 'number', max: 100 },
        { name: 'nombre_procedures_ameliorees', label: 'Procédures Améliorées', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]
    },
    'relations-institutionnelles': {
      title: '🤝 Relations Institutionnelles',
      endpoint: 'relations-institutionnelles',
      fields: [
        { name: 'nombre_reunions_ag_bureau_commissions', label: 'Réunions AG/Bureau/Commissions', type: 'number' },
        { name: 'nombre_conventions_partenariats', label: 'Conventions / Partenariats', type: 'number' },
        { name: 'nombre_pv_rapports', label: 'PV et Rapports Élaborés', type: 'number' },
        { name: 'nombre_relations_administrations', label: 'Relations avec Administrations', type: 'number' },
        { name: 'taux_realisation_plan_action', label: 'Taux de Réalisation du Plan (%)', type: 'number', max: 100 },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]
    },
    'synthese-departements': {
      title: '📊 Synthèse Départements',
      endpoint: 'synthese-departements',
      fields: [
        { name: 'opportunites_internationales', label: 'Opportunités Internationales', type: 'number' },
        { name: 'demandes_traitees', label: 'Demandes Traitées', type: 'number' },
        { name: 'entreprises_accompagnees', label: 'Entreprises Accompagnées', type: 'number' },
        { name: 'prestations_realisees', label: 'Prestations Réalisées', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]
    },
    'admin-financier': {
      title: '💼 Administratif & Financier',
      endpoint: 'admin-financier',
      fields: [
        { name: 'assemblees_generales_organisees', label: 'Assemblées Générales Organisées', type: 'number' },
        { name: 'prestations_logistiques', label: 'Prestations Logistiques', type: 'number' },
        { name: 'services_restauration', label: 'Services de Restauration', type: 'number' },
        { name: 'salles_mises_disposition', label: 'Salles Mises à Disposition', type: 'number' },
        { name: 'attestations_delivrees', label: 'Attestations Délivrées', type: 'number' },
        { name: 'locations_salles', label: 'Locations de Salles', type: 'number' },
        { name: 'services_agenda_organises', label: 'Services Agenda Organisés', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]
    },
    'appui-promotion': {
      title: '🚀 Appui & Promotion',
      endpoint: 'appui-promotion',
      fields: [
        { name: 'porteurs_projets_accompagnes', label: 'Porteurs de Projets Accompagnés', type: 'number' },
        { name: 'createurs_entreprise_accompagnes', label: 'Créateurs d\'Entreprise Accompagnés', type: 'number' },
        { name: 'entreprises_guichets_proximite', label: 'Entreprises Bénéficiaires des Guichets', type: 'number' },
        { name: 'demandes_administratives_traitees', label: 'Demandes Administratives Traitées', type: 'number' },
        { name: 'porteurs_projets_satisfaits', label: 'Porteurs de Projets Satisfaits', type: 'number' },
        { name: 'entrepreneurs_satisfaits', label: 'Entrepreneurs Satisfaits', type: 'number' },
        { name: 'taux_satisfaction', label: 'Taux de Satisfaction (%)', type: 'number', max: 100 },
        { name: 'entrepreneurs_financement', label: 'Entrepreneurs avec Financement', type: 'number' },
        { name: 'formations_employes', label: 'Formations des Employés', type: 'number' },
        { name: 'entreprises_radiees', label: 'Entreprises Radiées', type: 'number' },
        { name: 'entreprises_beneficiaires_services', label: 'Entreprises Bénéficiaires Services CCIS', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]
    },
    'services-ressortissants': {
      title: '🇲🇦 Services aux Ressortissants',
      endpoint: 'services-ressortissants',
      fields: [
        { name: 'newsletters_editees', label: 'Newsletters Éditées', type: 'number' },
        { name: 'demandes_ressortissants', label: 'Demandes des Ressortissants', type: 'number' },
        { name: 'indicateurs_economiques_suivis', label: 'Indicateurs Économiques Suivis', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]
    },
    'strategie-partenariat': {
      title: '🌍 Stratégie & Partenariat',
      endpoint: 'strategie-partenariat',
      fields: [
        { name: 'actions_realisees', label: 'Actions Réalisées', type: 'number' },
        { name: 'ressortissants_satisfaits_evenements', label: 'Ressortissants Satisfaits (Événements)', type: 'number' },
        { name: 'entreprises_potentiel_export', label: 'Entreprises à Potentiel Export', type: 'number' },
        { name: 'entreprises_accompagnees', label: 'Entreprises Accompagnées', type: 'number' },
        { name: 'delegations', label: 'Délégations', type: 'number' },
        { name: 'opportunites_affaires_internationales', label: 'Opportunités d\'Affaires Internationales', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]
    }
  };

  const config = categoryConfigs[category];

  useEffect(() => {
    if (periodId && config) {
      fetchKpiData();
    }
  }, [periodId, category]);

  const fetchKpiData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_URL}/kpis/${config.endpoint}/${periodId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormData(response.data.data || {});
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      
      const payload = {
        period_id: periodId,
        ...formData
      };

      await axios.post(
        `${API_URL}/kpis/${config.endpoint}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('KPIs sauvegardés avec succès!');
      onSave?.();
    } catch (error) {
      console.error('Error saving KPIs:', error);
      alert('Erreur lors de la sauvegarde des KPIs');
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <div className="kpi-management-form">
      <div className="form-header">
        <h2>{config.title}</h2>
        <button className="close-btn" onClick={onCancel}>✕</button>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {config.fields.map((field) => (
              <div key={field.name} className="form-field">
                <label htmlFor={field.name}>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    rows="3"
                  />
                ) : (
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    min="0"
                    max={field.max}
                    step={field.type === 'number' ? '0.01' : undefined}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Annuler
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default KpiManagementForm;
