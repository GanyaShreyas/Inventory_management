import React from 'react';
import styles from './styles.module.css';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const loc = useLocation();
  const role = sessionStorage.getItem('role') || localStorage.getItem('role');

  const links = role === 'admin' ? [
    { to: '/admin/manage-projects', label: 'MANAGE PROJECTS' },
    { to: '/admin/manage-stores', label: 'MANAGE STORES' },
    { to: '/admin/spares-master-list', label: 'SPARES MASTER' },
    { to: '/admin/add-user', label: 'ADD USER' },
    { to: '/admin/list-users', label: 'LIST USERS' },
    { to: '/admin/reset-password', label: 'RESET USER PASSWORD' },
  ] : [
    { to: '/user/dashboard', label: 'COMPLAINTS MANAGEMENT' },
    { to: '/user/spares', label: 'SPARES MANAGEMENT' },
    { to: '/user/obd', label: 'OBD' },
    { to: '/user/config', label: 'CONFIGURATION MANAGEMENT' },
  ];

  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarLogo}>INVENTORY</div>
      <ul className={styles.sidebarNav}>
        {links.map((l) => (
          <li key={l.to} style={{ width: '100%', marginBottom: 4 }}>
            <Link
              to={l.to}
              style={{
                display: 'block',
                color: '#fff',
                textDecoration: 'none',
                padding: '8px 12px',
                background: loc.pathname === l.to ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: loc.pathname === l.to ? '3px solid #fff' : '3px solid transparent'
              }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;
