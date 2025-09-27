import React from 'react';
import styles from './styles.module.css';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const loc = useLocation();
  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  
  // Show different navigation based on user role
  const links = role === 'admin' ? [
    { to: '/admin/manage-projects', label: 'MANAGE PROJECTS' },
    { to: '/admin/add-user', label: 'ADD USER' },
  ] : [
    { to: '/dashboard', label: 'DASHBOARD' },
    { to: '/item-in', label: 'ITEM IN' },
    { to: '/item-out', label: 'ITEM OUT' },
    { to: '/search', label: 'REPORT' },
    { to: '/edit', label: 'EDIT/VIEW' },
  ];
  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarLogo}>INVENTORY</div>
      <ul className={styles.sidebarNav}>
        {links.map((l) => (
          <li key={l.to} style={{ width: '100%', marginBottom: 4 }}>
            <Link to={l.to} style={{
              display: 'block',
              color: '#fff',
              textDecoration: 'none',
              padding: '8px 12px',
              background: loc.pathname === l.to ? 'rgba(255,255,255,0.12)' : 'transparent',
              borderLeft: loc.pathname === l.to ? '3px solid #fff' : '3px solid transparent'
            }}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar; 