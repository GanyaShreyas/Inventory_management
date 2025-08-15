import React from 'react';
import styles from './styles.module.css';

function Sidebar() {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarLogo}>Inventory</div>
    </nav>
  );
}

export default Sidebar; 