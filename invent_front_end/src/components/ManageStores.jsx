import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './header';
import Sidebar from './sidebar';
import Footer from './footer';
import styles from './styles.module.css';
import { apiBase, authHeaders } from '../apiConfig';

export default function ManageStores() {
  const [mode, setMode] = React.useState('');
  const navigate = useNavigate();
  const [stores, setStores] = React.useState([]);
  const [newName, setNewName] = React.useState('');
  const [oldName, setOldName] = React.useState('');
  const [editNewName, setEditNewName] = React.useState('');
  const [status, setStatus] = React.useState('');

  const fetchStores = async () => {
    setStatus('');
    try {
      const res = await fetch(`${apiBase()}/admin/stores/list`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setStores(data.stores || []);
    } catch (e) {
      setStatus(e.message);
    }
  };

  React.useEffect(() => {
    if (mode === 'list' || mode === 'edit') fetchStores();
  }, [mode]);

  const clearForm = () => {
    setMode('');
    setNewName('');
    setOldName('');
    setEditNewName('');
    setStatus('');
    setStores([]);
  };

  const addStore = async () => {
    setStatus('');
    const name = newName.trim();
    if (!name) {
      setStatus('Store name required');
      return;
    }
    try {
      const res = await fetch(`${apiBase()}/admin/stores/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert('Store added.');
      setNewName('');
      setStatus('Store added.');
    } catch (e) {
      alert(e.message);
      setStatus(e.message);
    }
  };

  const saveEdit = async () => {
    setStatus('');
    const o = oldName.trim();
    const n = editNewName.trim();
    if (!o || !n) {
      setStatus('Select a store and enter new name');
      return;
    }
    try {
      const res = await fetch(`${apiBase()}/admin/stores/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ oldName: o, newName: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert('Store updated. Master list entries using this store were updated.');
      setEditNewName('');
      setOldName('');
      fetchStores();
      setStatus('Store renamed.');
    } catch (e) {
      alert(e.message);
      setStatus(e.message);
    }
  };

  if (!mode) {
    return (
      <div className={styles.inventoryLayout}>
        <Sidebar />
        <div className={styles.inventoryMain}>
          <Header />
          <div className={styles.page}>
            <div className={styles.pageHeader}>
              <div className={styles.pageTitle}>MANAGE STORES (ADMIN)</div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => { navigate('/admin/admin-dashboard'); clearForm(); }}
              >
                BACK
              </button>
            </div>
            <div className={styles.card} style={{ maxWidth: 560, margin: '0 auto', padding: 32 }}>
              <div className={styles.buttonGroup} style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setMode('add')}>ADD STORE</button>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setMode('edit'); fetchStores(); }}>EDIT STORE</button>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setMode('list'); fetchStores(); }}>LIST STORES</button>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (mode === 'add') {
    return (
      <div className={styles.inventoryLayout}>
        <Sidebar />
        <div className={styles.inventoryMain}>
          <Header />
          <div className={styles.page}>
            <div className={styles.pageHeader}>
              <div className={styles.pageTitle}>ADD STORE</div>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setMode('')}>BACK</button>
            </div>
            <div className={styles.card} style={{ maxWidth: 560, margin: '0 auto', padding: 32 }}>
              <label className={styles.label}>
                STORE NAME
                <input className={styles.control} value={newName} onChange={(e) => setNewName(e.target.value)} />
              </label>
              <div style={{ marginTop: 16 }}>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={addStore}>SAVE</button>
              </div>
              {status ? <div style={{ marginTop: 12 }}>{status}</div> : null}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (mode === 'edit') {
    return (
      <div className={styles.inventoryLayout}>
        <Sidebar />
        <div className={styles.inventoryMain}>
          <Header />
          <div className={styles.page}>
            <div className={styles.pageHeader}>
              <div className={styles.pageTitle}>EDIT STORE</div>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setMode('')}>BACK</button>
            </div>
            <div className={styles.card} style={{ maxWidth: 560, margin: '0 auto', padding: 32 }}>
              <label className={styles.label}>
                EXISTING STORE
                <select className={styles.control} value={oldName} onChange={(e) => setOldName(e.target.value)}>
                  <option value="">— Select —</option>
                  {stores.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                NEW NAME
                <input className={styles.control} value={editNewName} onChange={(e) => setEditNewName(e.target.value)} />
              </label>
              <div style={{ marginTop: 16 }}>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveEdit}>UPDATE</button>
              </div>
              {status ? <div style={{ marginTop: 12 }}>{status}</div> : null}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (mode === 'list') {
    return (
      <div className={styles.inventoryLayout}>
        <Sidebar />
        <div className={styles.inventoryMain}>
          <Header />
          <div className={styles.page}>
            <div className={styles.pageHeader}>
              <div className={styles.pageTitle}>STORE LIST</div>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setMode('')}>BACK</button>
            </div>
            <div className={styles.card} style={{ maxHeight: '750px', overflowY: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>SL NO.</th>
                    <th>STORE NAME</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.length === 0 ? (
                    <tr><td colSpan={2}>No stores. Add stores first.</td></tr>
                  ) : (
                    stores.map((s, idx) => (
                      <tr key={s}>
                        <td>{idx + 1}</td>
                        <td>{s}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return null;
}
