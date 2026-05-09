import React from 'react';
import styles from './components/styles.module.css';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function DashboardChoice() {
  const navigate = useNavigate();

  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>USER DASHBOARD</div>
            <span className={styles.pill}>USER</span>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>COMPLAINTS MANAGEMENT</div>
              <div className={styles.cardDesc}>MANAGE ITEMS.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/user/dashboard">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>SPARES MANAGEMENT</div>
              <div className={styles.cardDesc}>MANAGE SPARES.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/user/spares">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>OBD</div>
              <div className={styles.cardDesc}>MANAGE OBD OUTBOUND RECORDS.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/user/obd">OPEN</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>

    </div>
  )
}
