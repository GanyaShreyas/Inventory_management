import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './styles.module.css';

const SECTIONS = {
  complaints: {
    label: 'COMPLAINTS MANAGEMENT',
    backTo: '/user/dashboard',
    links: [
      { to: '/item-in', label: 'ITEM IN' },
      { to: '/rfd', label: 'RFD' },
      { to: '/item-out', label: 'ITEM OUT' },
      { to: '/search', label: 'REPORT' },
      { to: '/edit', label: 'EDIT/VIEW' },
      { to: '/print-sticker', label: 'PRINT' },
    ],
  },
  spares: {
    label: 'SPARES MANAGEMENT',
    backTo: '/user/spares',
    links: [
      { to: '/spares/spares-in', label: 'SPARES IN' },
      { to: '/spares/spares-out', label: 'SPARES OUT' },
      { to: '/spares/spares-out-returnable', label: 'OUT RETURNABLE' },
      { to: '/spares/spares-in-returned', label: 'IN RETURNED' },
      { to: '/spares/view-item', label: 'VIEW ITEM' },
      { to: '/spares/stock-check', label: 'STOCK CHECK' },
    ],
  },
  obd: {
    label: 'OBD MANAGEMENT',
    backTo: '/user/obd',
    links: [
      { to: '/obd/out', label: 'OBD OUT' },
      { to: '/obd/update', label: 'UPDATE OBD' },
      { to: '/obd/status', label: 'OBD STATUS' },
    ],
  },
  config: {
    label: 'CONFIGURATION MANAGEMENT',
    backTo: '/user/config',
    links: [
      { to: '/config/edit', label: 'EDIT' },
      { to: '/config/view', label: 'VIEW' },
    ],
  },
};

export default function SectionNav({ section }) {
  const loc = useLocation();
  const sec = SECTIONS[section];
  if (!sec) return null;

  return (
    <nav className={styles.sectionNav}>
      <Link to={sec.backTo} className={styles.sectionNavBack} title={sec.label}>
        &#8592;
      </Link>
      <div className={styles.sectionNavLinks}>
        {sec.links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`${styles.sectionNavLink} ${loc.pathname === l.to ? styles.sectionNavLinkActive : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
