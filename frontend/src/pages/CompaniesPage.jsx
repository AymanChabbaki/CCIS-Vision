/**
 * Companies Page - Main companies management interface
 */
import React, { useState } from 'react';
import { CompanyList } from '../components/companies/CompanyList';
import { Modal } from '../components/common';

export const CompaniesPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const handleAddClick = () => {
    setShowAddModal(true);
    setSelectedCompany(null);
  };

  const handleEditClick = (company) => {
    setSelectedCompany(company);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedCompany(null);
  };

  return (
    <>
      <CompanyList onAddClick={handleAddClick} onEditClick={handleEditClick} />

      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          title={selectedCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
          size="lg"
        >
          <div className="py-8 text-center text-gray-500">
            <p>Formulaire d'entreprise à implémenter</p>
            <p className="text-sm mt-2">CompanyForm.jsx sera créé prochainement</p>
          </div>
        </Modal>
      )}
    </>
  );
};

export default CompaniesPage;
