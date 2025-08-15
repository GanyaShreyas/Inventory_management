import './App.css';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import styles from './components/styles.module.css';
import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

function apiBase() {
  return 'http://localhost:8000/api';
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function LoginPage({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure no prefilled values
    setUsername('');
    setPassword('');
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase()}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Login failed');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      if (typeof onLoggedIn === 'function') onLoggedIn(data.role);
      if (data.role === 'admin') {
        navigate('/admin/add-user', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.loginTitle}>Welcome back</div>
        <div className={styles.loginSubtitle}>Sign in to continue</div>
        <form onSubmit={onSubmit} className={styles.form} autoComplete="off">
          <label className={styles.label}>Username
            <input
              id="login-username"
              name="username"
              className={styles.control}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </label>
          <label className={styles.label}>Password
            <input
              id="login-password"
              name="password"
              className={styles.control}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </label>
          {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}
          <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>Dashboard</div>
            <span className={styles.pill}>User</span>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Item In</div>
              <div className={styles.cardDesc}>Create a new incoming pass with customer and item details.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/item-in">Open</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Item Out</div>
              <div className={styles.cardDesc}>Mark items as out for a given pass number.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/item-out">Open</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Search</div>
              <div className={styles.cardDesc}>Find records by pass no, part no, project or date range.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/search">Open</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Edit</div>
              <div className={styles.cardDesc}>Edit or delete a record by pass number.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/edit">Open</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

function AdminAddUserPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const clearForm = () => {
    setName('');
    setUsername('');
    setPassword('');
    setRole('user');
    setStatus('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const res = await fetch(`${apiBase()}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name, username, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setStatus('User created');
      clearForm();
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Admin - Add User</div>
        <div className={styles.pageActions}>
          <span className={styles.pill}>Admin</span>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/dashboard')}>Close</button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => {
              try {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('name');
                localStorage.removeItem('user');
              } catch {}
              navigate('/login', { replace: true });
            }}
          >Logout</button>
        </div>
      </div>
      <div className={styles.card}>
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGrid2}>
            <label className={styles.label}>Name<input className={styles.control} value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label className={styles.label}>Username<input className={styles.control} value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="off" /></label>
            <label className={styles.label}>Password<input className={styles.control} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" /></label>
            <label className={styles.label}>Role
              <select className={styles.control} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          {status ? <div>{status}</div> : null}
          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemInPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateIn, setDateIn] = useState(today);
  const [customerName, setCustomerName] = useState('');
  const [customerUnitAddress, setCustomerUnitAddress] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [customerPhoneNo, setCustomerPhoneNo] = useState('');
  const [projectName, setProjectName] = useState('');
  const [passNo, setPassNo] = useState('');
  const [items, setItems] = useState([{ equipmentType: 'unit', itemName: '', partNumber: '', serialNumber: '', defectDetails: '' }]);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const clearForm = () => {
    setDateIn(today);
    setCustomerName('');
    setCustomerUnitAddress('');
    setCustomerLocation('');
    setCustomerPhoneNo('');
    setProjectName('');
    setPassNo('');
    setItems([{ equipmentType: 'unit', itemName: '', partNumber: '', serialNumber: '', defectDetails: '' }]);
    setStatus('');
  };

  const addItem = () => {
    setItems([...items, { equipmentType: 'unit', itemName: '', partNumber: '', serialNumber: '', defectDetails: '' }]);
  };

  const deleteItem = (idx) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (idx, key, value) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [key]: value } : it));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const payload = { dateIn, customerName, customerUnitAddress, customerLocation, customerPhoneNo, projectName, passNo, items };
      const res = await fetch(`${apiBase()}/items/in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setStatus('Saved');
      clearForm();
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page} style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Item In</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/dashboard')}>Close</button>
        </div>
      </div>
      <div className={styles.card}>
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGrid2}>
            <label className={styles.label}>Date In<input className={styles.control} type="date" value={dateIn} onChange={(e) => setDateIn(e.target.value)} /></label>
            <label className={styles.label}>Project Name<input className={styles.control} value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>
            <label className={styles.label}>Customer Name<input className={styles.control} value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></label>
            <label className={styles.label}>Pass No<input className={styles.control} value={passNo} onChange={(e) => setPassNo(e.target.value)} required /></label>
            <label className={styles.label}>Customer Unit Address<input className={styles.control} value={customerUnitAddress} onChange={(e) => setCustomerUnitAddress(e.target.value)} /></label>
            <label className={styles.label}>Customer Location<input className={styles.control} value={customerLocation} onChange={(e) => setCustomerLocation(e.target.value)} /></label>
            <label className={styles.label}>Customer Phone No<input className={styles.control} value={customerPhoneNo} onChange={(e) => setCustomerPhoneNo(e.target.value)} /></label>
          </div>
          <div className={styles.tableWrap} style={{ marginTop: 8 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th><th>Item Name</th><th>Part No</th><th>Serial No</th><th>Defect</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <select className={styles.control} value={it.equipmentType} onChange={(e) => updateItem(idx, 'equipmentType', e.target.value)}>
                        <option value="unit">Unit</option>
                        <option value="module">Module</option>
                        <option value="PCB">PCB</option>
                        <option value="Accessory">Accessory</option>
                      </select>
                    </td>
                    <td><input className={styles.control} value={it.itemName} onChange={(e) => updateItem(idx, 'itemName', e.target.value)} /></td>
                    <td><input className={styles.control} value={it.partNumber} onChange={(e) => updateItem(idx, 'partNumber', e.target.value)} /></td>
                    <td><input className={styles.control} value={it.serialNumber} onChange={(e) => updateItem(idx, 'serialNumber', e.target.value)} /></td>
                    <td><input className={styles.control} value={it.defectDetails} onChange={(e) => updateItem(idx, 'defectDetails', e.target.value)} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={() => deleteItem(idx)} disabled={items.length === 1}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 8 }}>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={addItem}>Add Item</button>
            </div>
          </div>
          <div className={styles.pageActions} style={{ marginTop: 16 }}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">Submit</button>
          </div>
          {status ? <div style={{ marginTop: 12 }}>{status}</div> : null}
        </form>
      </div>
    </div>
  );
}

function ItemOutPage() {
  const [passNo, setPassNo] = useState('');
  const [record, setRecord] = useState(null);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const clearForm = () => {
    setPassNo('');
    setRecord(null);
    setStatus('');
  };

  const fetchRecord = async () => {
    setStatus('');
    try {
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(passNo)}`, { headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Not found');
      console.log('Fetched record data:', data);
      console.log('Items in fetched record:', data.items);
      setRecord(data);
    } catch (err) {
      setRecord(null);
      setStatus(`Error: ${err.message}`);
    }
  };

  const updateItemOut = (idx, value) => {
    setRecord((prev) => {
      const newItems = prev.items.map((it, i) => {
        if (i === idx) {
          const updatedItem = { ...it, itemOut: value };
          
          // Auto-set dateOut when itemOut is checked and no dateOut exists
          if (value === true && (!updatedItem.dateOut || updatedItem.dateOut === '')) {
            updatedItem.dateOut = new Date().toISOString().slice(0, 10);
          }
          // Clear dateOut when itemOut is unchecked
          else if (value === false) {
            console.log(`Clearing dateOut for item ${idx} since itemOut is now false`);
            updatedItem.dateOut = null;
          }
          
          return updatedItem;
        }
        return it;
      });
      
      return { ...prev, items: newItems };
    });
  };

  const updateDateOut = (idx, value) => {
    console.log(`Updating dateOut for item ${idx} to:`, value);
    setRecord((prev) => {
      const newItems = prev.items.map((it, i) => {
        if (i === idx) {
          console.log(`Item ${idx} before update:`, it);
          const updatedItem = { ...it, dateOut: value };
          console.log(`Item ${idx} after update:`, updatedItem);
          return updatedItem;
        }
        return it;
      });
      console.log('New items array:', newItems);
      return { ...prev, items: newItems };
    });
  };

  const updateRectificationDetails = (idx, value) => {
    setRecord((prev) => ({ ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, itemRectificationDetails: value } : it) }));
  };

  const onSubmit = async () => {
    if (!record) return;
    setStatus('');
    try {
      const updates = record.items.map((it) => ({ 
        serialNumber: it.serialNumber, 
        itemOut: !!it.itemOut, 
        dateOut: it.dateOut, 
        itemRectificationDetails: it.itemRectificationDetails 
      }));
      
      console.log('Submitting updates:', updates);
      console.log('Record items before submit:', record.items);
      
      const res = await fetch(`${apiBase()}/items/out/${encodeURIComponent(record.passNo)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ items: updates })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setStatus('Updated');
      clearForm();
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Item Out</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/dashboard')}>Close</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formRow}>
          <label className={styles.label}>Pass No<input className={styles.control} placeholder="Pass No" value={passNo} onChange={(e) => setPassNo(e.target.value)} /></label>
          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={fetchRecord}>Search</button>
          </div>
        </div>
      </div>
      {record ? (
        <div className={styles.card} style={{ marginTop: 12 }}>
          <div className={styles.formGrid3}>
            <div><b>Date In:</b> {record.dateIn}</div>
            <div><b>Customer:</b> {record.customer?.name}</div>
            <div><b>Project:</b> {record.projectName}</div>
            <div><b>Phone:</b> {record.customer?.phone}</div>
            <div><b>Unit Address:</b> {record.customer?.unitAddress}</div>
            <div><b>Location:</b> {record.customer?.location}</div>
            <div><b>Pass No:</b> {record.passNo}</div>
          </div>
          <div className={styles.tableWrap} style={{ marginTop: 12 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th><th>Name</th><th>Part No</th><th>Serial No</th><th>Defect</th><th>ItemIn</th><th>ItemOut</th><th>Date Out</th><th>Rectification Details</th>
                </tr>
              </thead>
              <tbody>
                {record.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.equipmentType}</td>
                    <td>{it.itemName}</td>
                    <td>{it.partNumber}</td>
                    <td>{it.serialNumber}</td>
                    <td>{it.defectDetails}</td>
                    <td><input type="checkbox" checked={!!it.itemIn} readOnly /></td>
                    <td><input type="checkbox" checked={!!it.itemOut} onChange={(e) => updateItemOut(idx, e.target.checked)} /></td>
                    <td>
                      <input 
                        type="date" 
                        className={styles.control} 
                        value={it.dateOut || ''} 
                        onChange={(e) => updateDateOut(idx, e.target.value)}
                        placeholder="Select date"
                      />
                      {!it.dateOut && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>No date set</div>}
                      {it.itemOut && !it.dateOut && <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '2px' }}>⚠️ Date required for Item Out</div>}
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className={styles.control} 
                        placeholder="Rectification details"
                        value={it.itemRectificationDetails || ''} 
                        onChange={(e) => updateRectificationDetails(idx, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pageActions} style={{ marginTop: 12 }}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSubmit}>Submit</button>
          </div>
        </div>
      ) : null}
      {status ? <div className={styles.card} style={{ marginTop: 12, padding: 12 }}>{status}</div> : null}
    </div>
  );
}

function SearchPage() {
  const [type, setType] = useState('PassNo');
  const [value, setValue] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const clearForm = () => {
    setType('PassNo');
    setValue('');
    setFrom('');
    setTo('');
    setResult(null);
    setStatus('');
  };

  const runSearch = async () => {
    setStatus('');
    try {
      const params = new URLSearchParams();
      params.set('type', type);
      if (type !== 'DateRange' && value) params.set('value', value);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`${apiBase()}/search?${params.toString()}`, { headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setResult(data);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const download = async () => {
    try {
      const params = new URLSearchParams();
      params.set('type', type);
      if (type !== 'DateRange' && value) params.set('value', value);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`${apiBase()}/search/download?${params.toString()}`, { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'search_results.csv'; a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Search</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/dashboard')}>Close</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formGrid3}>
          <label className={styles.label}>Type
            <select className={styles.control} value={type} onChange={(e) => setType(e.target.value)}>
              <option>PassNo</option>
              <option>ItemPartNo</option>
              <option>ProjectName</option>
              <option>DateRange</option>
            </select>
          </label>
          {type === 'DateRange' ? null : (
            <label className={styles.label}>Value<input className={styles.control} value={value} onChange={(e) => setValue(e.target.value)} /></label>
          )}
          <div className={styles.formRow}>
            <label className={styles.label}>From<input className={styles.control} type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className={styles.label}>To<input className={styles.control} type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
        </div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={runSearch}>Search</button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={download}>Download CSV</button>
        </div>
        {result ? <div style={{ marginTop: 12 }}>{result.count} entries found</div> : null}
        {status ? <div style={{ marginTop: 12 }}>{status}</div> : null}
      </div>
    </div>
  );
}

function EditPage() {
  const [passNo, setPassNo] = useState('');
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const clearForm = () => {
    setPassNo('');
    setDoc(null);
    setStatus('');
  };

  const fetchDoc = async () => {
    setStatus('');
    try {
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(passNo)}`, { headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Not found');
      setDoc(data);
    } catch (err) {
      setDoc(null);
      setStatus(`Error: ${err.message}`);
    }
  };

  const updateDocField = (path, value) => {
    setDoc((prev) => {
      const next = { ...prev };
      const set = (obj, keys, val) => {
        const [k, ...rest] = keys;
        if (!k) return;
        if (rest.length === 0) obj[k] = val; else { obj[k] = { ...(obj[k] || {}) }; set(obj[k], rest, val); }
      };
      set(next, path.split('.'), value);
      return next;
    });
  };

              const updateItem = (idx, key, value) => {
              setDoc((prev) => {
                const newItems = prev.items.map((it, i) => {
                  if (i === idx) {
                    const updatedItem = { ...it, [key]: value };
                    
                    // Auto-set dateOut when itemOut is checked and no dateOut exists
                    if (key === 'itemOut' && value === true && (!updatedItem.dateOut || updatedItem.dateOut === '')) {
                      updatedItem.dateOut = new Date().toISOString().slice(0, 10);
                    }
                    // Clear dateOut when itemOut is unchecked
                    else if (key === 'itemOut' && value === false) {
                      console.log(`Clearing dateOut for item ${idx} since itemOut is now false`);
                      updatedItem.dateOut = null;
                    }
                    
                    return updatedItem;
                  }
                  return it;
                });
                
                return { ...prev, items: newItems };
              });
            };

  const addItem = () => {
    setDoc((prev) => ({ ...prev, items: [...prev.items, { equipmentType: 'unit', itemName: '', partNumber: '', serialNumber: '', defectDetails: '', itemIn: true, itemOut: false, dateOut: null, itemRectificationDetails: '' }] }));
  };

  const deleteItem = (idx) => {
    console.log('Delete item clicked:', idx, 'Total items:', doc.items.length);
    if (doc.items.length > 1) {
      setDoc((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    }
  };

  const submitChanges = async () => {
    if (!doc) return;
    setStatus('');
    try {
      const payload = { dateIn: doc.dateIn, customer: doc.customer, projectName: doc.projectName, items: doc.items };
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(doc.passNo)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setStatus('Updated');
      clearForm();
    } catch (err) { setStatus(`Error: ${err.message}`); }
  };

  const deleteRecord = async () => {
    if (!doc) return;
    if (!window.confirm('Delete this record?')) return;
    setStatus('');
    try {
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(doc.passNo)}`, { method: 'DELETE', headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setStatus('Deleted');
      clearForm();
    } catch (err) { setStatus(`Error: ${err.message}`); }
  };

  return (
    <div className={styles.page} style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Edit</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/dashboard')}>Close</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formRow}>
          <label className={styles.label}>Pass No<input className={styles.control} placeholder="Pass No" value={passNo} onChange={(e) => setPassNo(e.target.value)} /></label>
          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={fetchDoc}>Fetch</button>
          </div>
        </div>
      </div>
      {doc ? (
        <div className={styles.card} style={{ marginTop: 12 }}>
          <form onSubmit={(e) => { e.preventDefault(); submitChanges(); }} className={styles.form}>
            <div className={styles.formGrid2}>
              <label className={styles.label}>Date In<input className={styles.control} type="date" value={doc.dateIn || ''} onChange={(e) => updateDocField('dateIn', e.target.value)} /></label>
              <label className={styles.label}>Project Name<input className={styles.control} value={doc.projectName || ''} onChange={(e) => updateDocField('projectName', e.target.value)} /></label>
              <label className={styles.label}>Customer Name<input className={styles.control} value={doc.customer?.name || ''} onChange={(e) => updateDocField('customer.name', e.target.value)} /></label>
              <label className={styles.label}>Pass No<input className={styles.control} value={doc.passNo || ''} readOnly /></label>
              <label className={styles.label}>Customer Unit Address<input className={styles.control} value={doc.customer?.unitAddress || ''} onChange={(e) => updateDocField('customer.unitAddress', e.target.value)} /></label>
              <label className={styles.label}>Customer Location<input className={styles.control} value={doc.customer?.location || ''} onChange={(e) => updateDocField('customer.location', e.target.value)} /></label>
              <label className={styles.label}>Customer Phone No<input className={styles.control} value={doc.customer?.phone || ''} onChange={(e) => updateDocField('customer.phone', e.target.value)} /></label>
            </div>
            <div className={styles.tableWrap} style={{ marginTop: 8, overflowX: 'auto' }}>
              <table className={styles.table} style={{ minWidth: '1200px' }}>
                <thead>
                  <tr>
                    <th>Type</th><th>Item Name</th><th>Part No</th><th>Serial No</th><th>Defect</th><th>ItemOut</th><th>Date Out</th><th>Rectification Details</th><th style={{ minWidth: '100px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <select className={styles.control} value={it.equipmentType || ''} onChange={(e) => updateItem(idx, 'equipmentType', e.target.value)}>
                          <option value="unit">Unit</option>
                          <option value="module">Module</option>
                          <option value="PCB">PCB</option>
                          <option value="Accessory">Accessory</option>
                        </select>
                      </td>
                      <td><input className={styles.control} value={it.itemName || ''} onChange={(e) => updateItem(idx, 'itemName', e.target.value)} /></td>
                      <td><input className={styles.control} value={it.partNumber || ''} onChange={(e) => updateItem(idx, 'partNumber', e.target.value)} /></td>
                      <td><input className={styles.control} value={it.serialNumber || ''} onChange={(e) => updateItem(idx, 'serialNumber', e.target.value)} /></td>
                      <td><input className={styles.control} value={it.defectDetails || ''} onChange={(e) => updateItem(idx, 'defectDetails', e.target.value)} /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!it.itemOut} onChange={(e) => updateItem(idx, 'itemOut', e.target.checked)} /></td>
                      <td>
                        <input 
                          type="date" 
                          className={styles.control} 
                          value={it.dateOut || ''} 
                          onChange={(e) => updateItem(idx, 'dateOut', e.target.value)}
                        />
                        {!it.dateOut && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>No date set</div>}
                        {it.itemOut && !it.dateOut && <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '2px' }}>⚠️ Date required for Item Out</div>}
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className={styles.control} 
                          placeholder="Rectification details"
                          value={it.itemRectificationDetails || ''} 
                          onChange={(e) => updateItem(idx, 'itemRectificationDetails', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'center', minWidth: '100px' }}>
                        <button 
                          type="button" 
                          className={`${styles.btn} ${styles.btnDanger}`} 
                          onClick={() => deleteItem(idx)} 
                          disabled={doc.items.length === 1}
                          style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 8 }}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={addItem}>Add Item</button>
              </div>
            </div>
            <div className={styles.pageActions} style={{ marginTop: 16 }}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">Submit Changes</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} type="button" onClick={deleteRecord}>Delete</button>
            </div>
            {status ? <div style={{ marginTop: 12 }}>{status}</div> : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const [authTick, setAuthTick] = React.useState(0);
  const token = React.useMemo(() => localStorage.getItem('token'), [authTick]);
  const role = React.useMemo(() => localStorage.getItem('role'), [authTick]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLoggedIn={() => setAuthTick((t) => t + 1)} />} />
        <Route path="/admin/add-user" element={token && role === 'admin' ? <AdminAddUserPage /> : <Navigate to="/login" replace />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/item-in" element={token ? <ItemInPage /> : <Navigate to="/login" replace />} />
        <Route path="/item-out" element={token ? <ItemOutPage /> : <Navigate to="/login" replace />} />
        <Route path="/search" element={token ? <SearchPage /> : <Navigate to="/login" replace />} />
        <Route path="/edit" element={token ? <EditPage /> : <Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to={token ? (role === 'admin' ? '/admin/add-user' : '/dashboard') : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
