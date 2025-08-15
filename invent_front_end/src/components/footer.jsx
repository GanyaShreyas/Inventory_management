import React from 'react';
import styles from './styles.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      &copy; {new Date().getFullYear()} Inventory Management. All rights reserved.
    </footer>
  );
}

export default Footer; 