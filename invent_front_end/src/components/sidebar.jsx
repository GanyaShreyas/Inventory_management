import React, { useState } from 'react';
import styles from './styles.module.css';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const loc = useLocation();
  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

  const adminLinks = [
    { to: '/admin/manage-projects', label: 'MANAGE PROJECTS' },
    { to: '/admin/manage-stores', label: 'MANAGE STORES' },
    { to: '/admin/spares-master-list', label: 'SPARES MASTER' },
    { to: '/admin/add-user', label: 'ADD USER' },
    { to: '/admin/list-users', label: 'LIST USERS' },
    { to: '/admin/reset-password', label: 'RESET USER PASSWORD' },
  ];
  const userLinks = [
    { to: '/user/dashboard', label: 'COMPLAINTS MANAGEMENT' },
    { to: '/user/spares', label: 'SPARES MANAGEMENT' },
    { to: '/user/obd', label: 'OBD' },
    { to: '/user/config', label: 'CONFIGURATION MANAGEMENT' },
    { to: '/wbs', label: 'WBS DETAILS' },
    { to: '/field-complaints-report', label: 'FIELD COMPLAINTS REPORT' },
  ];
  const links = role === 'admin'
    ? [
        { to: '/edit', label: 'ITEM EDIT - COMPLAINTS' },
        ...adminLinks,
      ]
    : userLinks;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  };

  return (
    <nav className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <button
        className={styles.sidebarToggle}
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        {collapsed ? '▶' : '◀'}
      </button>
      {!collapsed && <div className={styles.sidebarLogo}>INVENTORY</div>}
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
              {collapsed ? l.label.slice(0, 2) : l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;
