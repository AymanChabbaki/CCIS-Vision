/**
 * Activities Page - Main activities management interface
 */
import React, { useState } from 'react';
import { ActivityList } from '../components/activities/ActivityList';
import { Modal } from '../components/common';

export const ActivitiesPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleAddClick = () => {
    setShowModal(true);
    setSelectedActivity(null);
  };

  const handleViewClick = (activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedActivity(null);
  };

  return (
    <>
      <ActivityList onAddClick={handleAddClick} onViewClick={handleViewClick} />

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={handleCloseModal}
          title={selectedActivity ? 'Détails de l\'activité' : 'Nouvelle activité'}
          size="lg"
        >
          <div className="py-8 text-center text-gray-500">
            <p>Formulaire d'activité à implémenter</p>
            <p className="text-sm mt-2">ActivityForm.jsx sera créé prochainement</p>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ActivitiesPage;
