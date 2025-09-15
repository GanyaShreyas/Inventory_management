import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';

const ManageProjects = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/admin/projects'); // Both buttons go to the same page
  };

  return (
    <div className={styles.manageProjectsContainer}>
      <h2>Manage Projects (Admin)</h2>
      <div className={styles.buttonGroup}>
        <button className={styles.projectButton} onClick={handleNavigate}>
          ADD PROJECT
        </button>
        <button className={styles.projectButton} onClick={handleNavigate}>
          SELECT PROJECT
        </button>
      </div>
    </div>
  );
};

export default ManageProjects;
