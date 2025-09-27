import './App.css';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import styles from './components/styles.module.css';
import React, { use, useEffect, useMemo, useState } from 'react';
import { useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

function apiBase() {
  return 'http://localhost:8000/api';
}

function authHeaders() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Function to validate token and check if user is still authenticated
async function validateToken() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const res = await fetch(`${apiBase()}/validate-token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  } catch (error) {
    return false;
  }
}

// Function to clear all authentication data
function clearAuthData() {
  try {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('loginTime');
    
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('loginTime');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
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
      
      // Store authentication data with session storage for better security
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('role', data.role);
      sessionStorage.setItem('username', data.username || username);
      sessionStorage.setItem('name', data.name || '');
      sessionStorage.setItem('loginTime', Date.now().toString());
      
      // Also store in localStorage for persistence across browser sessions
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', data.username || username);
      localStorage.setItem('name', data.name || '');
      localStorage.setItem('loginTime', Date.now().toString());
      
      if (typeof onLoggedIn === 'function') onLoggedIn(data.role);
      if (data.role === 'admin') {
        navigate('/admin/admin-dashboard', { replace: true });
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

function AdminDashboard() {
  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>ADMIN DASHBOARD</div>
            <span className={styles.pill}>ADMIN</span>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>MANAGE PROJECTS</div>
              <div className={styles.cardDesc}>ADD NEW PROJECTS OR MANAGE EXISTING PROJECTS.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/admin/manage-projects">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>ADD USERS</div>
              <div className={styles.cardDesc}>CREATE NEW USERS.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/admin/add-user">OPEN</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>

    </div>
  )
}

function Dashboard() {
  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>DASHBOARD</div>
            <span className={styles.pill}>USER</span>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>ITEM IN</div>
              <div className={styles.cardDesc}>Create a new incoming pass with customer and item details.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/item-in">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>ITEM OUT</div>
              <div className={styles.cardDesc}>Mark items as out for a given pass number.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/item-out">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>REPORT</div>
              <div className={styles.cardDesc}>Find records by private pass no, part no, project or date range.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/search">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>EDIT/VIEW</div>
              <div className={styles.cardDesc}>Edit or delete a record by pass number.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/edit">OPEN</Link>
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

  const handleLogout = async () => {
    try {
      // Call logout endpoint to invalidate session on server
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) {
        await fetch(`${apiBase()}//logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all authentication data
      try {
        sessionStorage.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('name');
        localStorage.removeItem('loginTime');
      } catch (error) {
        console.error('Error clearing auth data:', error);
      }
      navigate('/login', { replace: true });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Confirm submission
    const confirmSubmit = window.confirm(`Are you sure you want to create a new user?\n\nName: ${name}\nUsername: ${username}\nRole: ${role}`);
    if (!confirmSubmit) {
      return;
    }
    
    setStatus('');
    try {
      const res = await fetch(`${apiBase()}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name, username, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      
  alert('User created successfully!');
  setStatus('User created');
  clearForm();
    } catch (err) {
      alert(`Error: ${err.message}`);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>ADMIN - ADD USER</div>    
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/admin/admin-dashboard'); clearForm()}}>CLOSE</button>
          </div>
      <div className={styles.card}>
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGrid2}>
            <label className={styles.label}>NAME<input className={styles.control} value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label className={styles.label}>USERNAME<input className={styles.control} value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="off" /></label>
            <label className={styles.label}>PASSWORD<input className={styles.control} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" /></label>
            <label className={styles.label}>ROLE
              <select className={styles.control} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">USER</option>
                <option value="admin">ADMIN</option>
              </select>
            </label>
          </div>
          {status ? <div>{status}</div> : null}
          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">CREATE</button>
          </div>
        </form>
      </div>
        </div>
        <Footer />
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
  const [projectOptions, setProjectOptions] = useState([]);
  
    // Per-row item options
  const [passNo, setPassNo] = useState('');
  // (Already declared below with per-row options)
    const [items, setItems] = useState([
      {
        equipmentType: '',
        itemName: '',
        partNumber: '',
        serialNumber: '',
        defectDetails: '',
        itemTypeOptions: [],
        itemNameOptions: [],
        partNoOptions: []
      }
    ]);
    // Get unique item types for the row (call on focus of Type dropdown)
const fetchItemTypeOptions = async (idx) => {
  if (!projectName) return;
  const res = await fetch(`${apiBase()}/admin/projects/items?projectName=${encodeURIComponent(projectName)}`, { headers: { ...authHeaders() } });
  const data = await res.json();
  const uniqueTypes = [...new Set((data.items || []).map(it => it.itemType).filter(Boolean))];
  setItems(prev => prev.map((it, i) => i === idx ? { ...it, itemTypeOptions: uniqueTypes } : it));
};

// Get item names for a given equipmentType — pass type explicitly to avoid stale reads
const fetchItemNameOptions = async (idx, equipmentType) => {
  if (!projectName || !equipmentType) return;
  const res = await fetch(`${apiBase()}/admin/projects/items?projectName=${encodeURIComponent(projectName)}`, { headers: { ...authHeaders() } });
  const data = await res.json();
  const names = [...new Set((data.items || [])
    .filter(it => it.itemType === equipmentType)
    .map(it => it.itemName)
    .filter(Boolean)
  )];
  setItems(prev => prev.map((it, i) => i === idx ? { ...it, itemNameOptions: names } : it));
};

// Get part numbers for a given equipmentType + itemName
const fetchPartNoOptions = async (idx, equipmentType, itemName) => {
  if (!projectName || !equipmentType || !itemName) return;
  const res = await fetch(`${apiBase()}/admin/projects/items?projectName=${encodeURIComponent(projectName)}`, { headers: { ...authHeaders() } });
  const data = await res.json();
  const parts = [...new Set((data.items || [])
    .filter(it => it.itemType === equipmentType && it.itemName === itemName)
    .map(it => it.partNo)
    .filter(Boolean)
  )];
  setItems(prev => prev.map((it, i) => i === idx ? { ...it, partNoOptions: parts } : it));
};

  // Fetch projects on dropdown open
  const fetchProjects = async () => {
    const res = await fetch(`${apiBase()}/admin/projects/list`, { headers: { ...authHeaders() } });
    const data = await res.json();
    setProjectOptions(data.projects || []);
  };

    // Duplicate item row (already declared, remove duplicate)
  // Duplicate item row
  // const duplicateItem = (idx) => {
  //   setItems((prev) => {
  //     const copy = [...prev];
  //     copy.splice(idx + 1, 0, { ...prev[idx] });
  //     return copy;
  //   });
  // };
  const duplicateItem = (idx) => {
    setItems(prev => {
      const copy = [...prev];
      const src = prev[idx] || {};

      const newRow = {
        equipmentType: src.equipmentType || '',
        itemName: src.itemName || '',
        partNumber: src.partNumber || '',
        serialNumber: '',            // keep blank (or use src.serialNumber to copy)
        defectDetails: '',          // keep blank (or copy)
        itemTypeOptions: Array.isArray(src.itemTypeOptions) ? [...src.itemTypeOptions] : [],
        itemNameOptions: Array.isArray(src.itemNameOptions) ? [...src.itemNameOptions] : [],
        partNoOptions: Array.isArray(src.partNoOptions) ? [...src.partNoOptions] : []
      };

      copy.splice(idx + 1, 0, newRow);
      return copy;
    });
  };


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
    clearItemDetails();
    setStatus('');
  };

  const clearItemDetails = () => {
    setItems([{
      equipmentType: '',
      itemName: '',
      partNumber: '',
      serialNumber: '',
      defectDetails: '',
      itemTypeOptions: [],
      itemNameOptions: [],
      partNoOptions: []
    }]);
  }

  const addItem = () => {
      setItems([
        ...items,
        {
          equipmentType: '',
          itemName: '',
          partNumber: '',
          serialNumber: '',
          defectDetails: '',
          itemTypeOptions: [],
          itemNameOptions: [],
          partNoOptions: []
        }
      ]);
  };

  const deleteItem = (idx) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

 const updateItem = (idx, key, value) => {
  setItems((prev) =>
    prev.map((it, i) => {
      if (i !== idx) return it; // only update the target row

      const updated = { ...it, [key]: value };

      if (key === 'equipmentType') {
        updated.itemName = '';
        updated.partNumber = '';
        updated.itemNameOptions = [];
        updated.partNoOptions = [];

        // trigger fetch only for this row
        fetchItemTypeOptions(idx);
        fetchItemNameOptions(idx, value);
      }

      if (key === 'itemName') {
        updated.partNumber = '';
        updated.partNoOptions = [];

        // trigger fetch only for this row
        fetchPartNoOptions(idx, it.equipmentType, value);
      }

      return updated;
    })
  );
};


  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's 10 digits (Indian mobile number)
    if (cleaned.length === 10) {
      return true;
    }
    // Check if it's 12 digits (with country code)
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return true;
    }
    return false;
  };

  // Check for duplicate pass number
  const checkDuplicatePassNo = async (passNo) => {
    try {
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(passNo)}`, {
        headers: { ...authHeaders() }
      });
      return res.ok; // If response is ok, pass number exists
    } catch (error) {
      return false; // If error, assume it doesn't exist
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');

    // Validate required fields
    if (!customerName || customerName.trim() === '') {
      alert('Customer Name is required');
      return;
    }
    
    if (!customerPhoneNo || customerPhoneNo.trim() === '') {
      alert('Customer Phone Number is required');
      return;
    }

    // Validate phone number
    if (customerPhoneNo && !validatePhoneNumber(customerPhoneNo)) {
      alert('Please enter a valid 10-digit phone number (e.g., 9876543210)');
      return;
    }

    // Validate item fields - all items must have Item Name, Part Number, and Serial Number
    const invalidItems = items.filter(item => 
      !item.itemName || item.itemName.trim() === '' ||
      !item.partNumber || item.partNumber.trim() === '' ||
      !item.serialNumber || item.serialNumber.trim() === ''
    );
    
    if (invalidItems.length > 0) {
      alert('All items must have Item Name, Part Number, and Serial Number filled');
      return;
    }

    // Check for duplicate pass number
    const isDuplicate = await checkDuplicatePassNo(passNo);
    if (isDuplicate) {
      alert('Duplicate Pass Number! This pass number already exists. Please use a different pass number.');
      return;
    }

    // Confirm submission
    const confirmSubmit = window.confirm('Are you sure you want to save this record?');
    if (!confirmSubmit) {
      return;
    }

    try {
      const payload = { dateIn, customerName, customerUnitAddress, customerLocation, customerPhoneNo, projectName, passNo, items };
      const res = await fetch(`${apiBase()}/items/in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      
      alert('Record saved successfully!');
      setStatus('Saved');
      clearForm();
    } catch (err) {
      alert(`Error: ${err.message}`);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page} style={{ height: 'calc(100vh - 10px)', overflow: 'auto' }}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>ITEM IN</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/dashboard'); clearForm()}}>CLOSE</button>
        </div>
      </div>
      <div className={styles.card}>
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGrid2}>
          <label className={styles.label}>PRIVATE PASS NO<input className={styles.control} type="number" value={passNo} onChange={(e) => setPassNo(e.target.value)} required /></label>
            <label className={styles.label}>DATE IN<input className={styles.control} type="date" value={dateIn} onChange={(e) => setDateIn(e.target.value)} /></label>
            <label className={styles.label}>PROJECT NAME
              <select className={styles.control} value={projectName} onChange={e => { setProjectName(e.target.value); clearItemDetails(); }} onFocus={fetchProjects} required>
                <option value="">SELECT PROJECT</option>
                {projectOptions.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
              </select>
            </label>
            <label className={styles.label}>CUSTOMER NAME<input className={styles.control} value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></label>
            <label className={styles.label}>CUSTOMER UNIT ADDRESS<input className={styles.control} value={customerUnitAddress} onChange={(e) => setCustomerUnitAddress(e.target.value)} /></label>
            <label className={styles.label}>CUSTOMER LOCATION<input className={styles.control} value={customerLocation} onChange={(e) => setCustomerLocation(e.target.value)} /></label>
            <label className={styles.label}>
              CUSTOMER PHONE NO
              <input 
                className={styles.control} 
                value={customerPhoneNo} 
                onChange={(e) => setCustomerPhoneNo(e.target.value)}
                placeholder="ENTER 10-DIGIT NUMBER (E.G., 9876543210)"
                required
              />
              {customerPhoneNo && !validatePhoneNumber(customerPhoneNo) && (
                <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '2px' }}>
                  PLEASE ENTER A VALID 10-DIGIT PHONE NUMBER
                </div>
              )}
            </label>
          </div>
          <div className={styles.tableWrap} style={{ marginTop: 8, maxHeight: 350, overflowY: 'auto', overflowX: 'auto' }}>
            <table className={styles.table} style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>ITEM TYPE</th><th>ITEM NAME *</th><th>PART NO *</th><th>SERIAL NO *</th><th>DEFECT</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          className={styles.control}
                          value={it.equipmentType}
                          onChange={e => updateItem(idx, 'equipmentType', e.target.value)}
                          onFocus={() => fetchItemTypeOptions(idx)}
                          required
                        >
                          <option value="">SELECT TYPE</option>
                          {it.itemTypeOptions.map((type, i) => <option key={i} value={type}>{type}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className={styles.control}
                          value={it.itemName}
                          onChange={e => updateItem(idx, 'itemName', e.target.value)}
                          onFocus={() => fetchItemNameOptions(idx, it.equipmentType)}
                          required
                        >
                          <option value="">SELECT ITEM NAME</option>
                          {it.itemNameOptions.map((name, i) => <option key={i} value={name}>{name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className={styles.control}
                          value={it.partNumber}
                          onChange={e => updateItem(idx, 'partNumber', e.target.value)}
                          onFocus={() => fetchPartNoOptions(idx, it.equipmentType, it.itemName)}
                          required
                        >
                          <option value="">SELECT PART NO</option>
                          {it.partNoOptions.map((no, i) => <option key={i} value={no}>{no}</option>)}
                        </select>
                      </td>
                      <td><input className={styles.control} value={it.serialNumber} onChange={(e) => updateItem(idx, 'serialNumber', e.target.value)} required /></td>
                      <td>
                        <textarea
                          className={styles.control}
                          value={it.defectDetails}
                          onChange={(e) => updateItem(idx, 'defectDetails', e.target.value)}
                          rows={1} // looks like an input initially
                        />
                        {/* <input className={styles.control} value={it.defectDetails} onChange={(e) => updateItem(idx, 'defectDetails', e.target.value)} /> */}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => duplicateItem(idx)} style={{ marginRight: 4 }}>DUPLICATE</button>
                        <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={() => deleteItem(idx)} disabled={items.length === 1}>DELETE</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div style={{ marginTop: 8 }}>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={addItem}>ADD ITEM</button>
            </div>
          </div>
          <div className={styles.pageActions} style={{ marginTop: 16 }}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">SAVE</button>
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
  const [projectOptions, setProjectOptions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false); // collapse, but keep suggestions in memory
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (passNo.length >= 2) {
      const fetchSuggestions = async () => {
        try {
          const params = new URLSearchParams();
          params.set('type', 'passNo');
          params.set('value', passNo);
          const res = await fetch(`${apiBase()}/search/suggestions?${params.toString()}`, { headers: { ...authHeaders() } });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || 'Failed to fetch suggestions');
          setSuggestions(data.suggestions || []);
        }
        catch (err) {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
        }
      };
      fetchSuggestions();
    }
    else {
      setSuggestions([]);
    }
  }, [passNo]);

  // Fetch project options on mount
  useEffect(() => {
    fetch(`${apiBase()}/admin/projects/list`, { headers: { ...authHeaders() } })
      .then(res => res.json())
      .then(data => setProjectOptions(data.projects || []));
  }, []);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const clearForm = () => {
    setPassNo('');
    setRecord(null);
    setStatus('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const fetchRecord = async () => {
    setStatus('');
    try {
      console.log('=== FETCHING RECORD DEBUG ===');
      console.log('Pass Number:', passNo);
      console.log('Auth headers:', authHeaders());
      
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(passNo)}`, { headers: { ...authHeaders() } });
      console.log('Fetch response status:', res.status);
      
      const data = await res.json();
      console.log('Fetch response data:', data);
      
      if (!res.ok) throw new Error(data?.error || 'Not found');
      console.log('Fetched record data:', data);
      console.log('Items in fetched record:', data.items);
      setRecord(data);
    } catch (err) {
      console.error('Error fetching record:', err);
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

  const updateFeedback1Details = (idx, value) => {
    setRecord((prev) => ({ ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, itemFeedback1Details: value } : it) }));
  };

  const updateFeedback2Details = (idx, value) => {
    setRecord((prev) => ({ ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, itemFeedback2Details: value } : it) }));
  };

  const onSubmit = async () => {
    if (!record) return;
    
    // Validate that all items marked as "out" have a date
    const itemsWithoutDate = record.items.filter(item => item.itemOut && (!item.dateOut || item.dateOut === ''));
    if (itemsWithoutDate.length > 0) {
      alert('Please set a date for all items marked as "Item Out"');
      return;
    }
    
    // Validate that all items marked as "out" have rectification details
    const itemsWithoutDetails = record.items.filter(item => item.itemOut && (!item.itemRectificationDetails || item.itemRectificationDetails.trim() === ''));
    if (itemsWithoutDetails.length > 0) {
      alert('Please enter rectification details for all items marked as "Item Out"');
      return;
    }
    
    // Confirm submission
    const confirmSubmit = window.confirm('Are you sure you want to update this record?');
    if (!confirmSubmit) {
      return;
    }
    
    setStatus('');
    try {
      // Send all items in the same order as the original record
      // This ensures the backend can match items by position, avoiding issues with duplicate serial numbers
      const updates = record.items.map((it) => ({ 
        serialNumber: it.serialNumber, 
        itemOut: !!it.itemOut, 
        dateOut: it.dateOut || null, 
        itemRectificationDetails: it.itemRectificationDetails || '',
        itemFeedback1Details: it.itemFeedback1Details || '',
        itemFeedback2Details: it.itemFeedback2Details || ''
      }));
      
      console.log('=== ITEM OUT SUBMISSION DEBUG ===');
      console.log('Pass Number:', record.passNo);
      console.log('Original record items:', record.items);
      console.log('Submitting updates:', updates);
      console.log('Request URL:', `${apiBase()}/items/out/${encodeURIComponent(record.passNo)}`);
      console.log('Request payload:', JSON.stringify({ items: updates }, null, 2));
      
      const res = await fetch(`${apiBase()}/items/out/${encodeURIComponent(record.passNo)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ items: updates })
      });
      
      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));
      
      const data = await res.json();
      console.log('Response data:', data);
      
      if (!res.ok) throw new Error(data?.error || 'Failed');
      
      alert('Record updated successfully!');
      setStatus('Updated');
      clearForm();
    } catch (err) {
      console.error('Error in ItemOut submission:', err);
      alert(`Error: ${err.message}`);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>ITEM OUT</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/dashboard'); clearForm()}}>CLOSE</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formRow}>
          <label className={styles.label}>
            PRIVATE PASS NO
            <div className={styles.relativeContainer} ref={suggestionRef}>
              <input 
                className={styles.control} 
                placeholder="PASS NO" 
                value={passNo} 
                onChange={(e) => setPassNo(e.target.value)}
                onFocus={() => setShowSuggestions(true)} // expand again when input is focused 
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className={styles.suggestionsList}>
                  {suggestions.map((s, i) => (
                    <li key={i} onClick={() => { setPassNo(s); setShowSuggestions(false); }}>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>
          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={fetchRecord}>SEARCH</button>
          </div>
        </div>
      </div>
      {record ? (
        <div className={styles.cardItemOut} style={{ marginTop: 12 }}>
          <div className={styles.formGrid3}>
            <div><b>PRIVATE PASS NO:</b> {record.passNo}</div>
            <div><b>DATE IN:</b> {record.dateIn}</div>
            <div><b>CUSTOMER:</b> {record.customer?.name}</div>
            <div><b>PROJECT:</b> {record.projectName || ''}</div>
            <div><b>PHONE:</b> {record.customer?.phone}</div>
            <div><b>UNIT ADDRESS:</b> {record.customer?.unitAddress}</div>
            <div><b>LOCATION:</b> {record.customer?.location}</div>
          </div>
          <div className={styles.tableWrap} style={{ marginTop: 12, maxHeight: 350, overflowY: 'auto', overflowX: 'auto' }}>
            <table className={styles.table} style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>TYPE</th><th>NAME</th><th>PART NO</th><th>SERIAL NO</th><th>DEFECT</th><th>ITEMOUT</th><th>DATE OUT</th><th>RECTIFICATION DETAILS</th><th>REMARKS 1</th><th>REMARKS 2</th>
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
                    {/* <td><input type="checkbox" checked={!!it.itemIn} readOnly /></td> */}
                    <td><input type="checkbox" checked={!!it.itemOut} onChange={(e) => updateItemOut(idx, e.target.checked)} /></td>
                    <td>
                      <input 
                        type="date" 
                        className={styles.control} 
                        value={it.dateOut || ''} 
                        onChange={(e) => updateDateOut(idx, e.target.value)}
                        placeholder="SELECT DATE"
                      />
                      {!it.dateOut && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>NO DATE SET</div>}
                      {it.itemOut && !it.dateOut && <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '2px' }}>⚠️ DATE REQUIRED FOR ITEM OUT</div>}
                    </td>
                    <td>
                      <textarea
                        className={styles.control}
                        value={it.itemRectificationDetails || ""}
                        onChange={(e) => updateRectificationDetails(idx, e.target.value)}
                        required={it.itemOut}
                        rows={1} // looks like an input initially
                      />
                      {it.itemOut &&
                        (!it.itemRectificationDetails ||
                          it.itemRectificationDetails.trim() === "") && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#ff6b6b",
                              marginTop: "2px",
                            }}
                          >
                            ⚠️ Rectification details required for Item Out
                          </div>
                        )}
                    </td>
                    <td>
                      <textarea
                        className={styles.control}
                        value={it.itemFeedback1Details || ""}
                        onChange={(e) => updateFeedback1Details(idx, e.target.value)}
                        rows={1} // looks like an input initially
                      />
                    </td>
                    <td>
                      <textarea
                        className={styles.control}
                        value={it.itemFeedback2Details || ""}
                        onChange={(e) => updateFeedback2Details(idx, e.target.value)}
                        rows={1} // looks like an input initially
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pageActions} style={{ marginTop: 12 }}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSubmit}>Save</button>
          </div>
        </div>
      ) : null}
      {status ? <div className={styles.card} style={{ marginTop: 12, padding: 12 }}>{status}</div> : null}
    </div>
  );
}

function ManageProjects() {
  const [mode, setMode] = React.useState(''); // '' | 'add' | 'select'
  const navigate = useNavigate();
  // Add Project State
  const [projectName, setProjectName] = React.useState('');
  const [addStatus, setAddStatus] = React.useState('');
  const [items, setItems] = React.useState([{ itemType: '', itemName: '', partNo: '' }]);

  // Select Project State
  const [projects, setProjects] = React.useState([]);
  const [selectedProject, setSelectedProject] = React.useState('');
  const [projectItems, setProjectItems] = React.useState([]);
  const [selectStatus, setSelectStatus] = React.useState('');

  // Edit/Delete Item State
  const [editIdx, setEditIdx] = React.useState(-1);
  const [editItem, setEditItem] = React.useState(null);

  // Add item data state for Select Project page (move hooks to very top)
  const [newItem, setNewItem] = React.useState({ itemType: '', itemName: '', partNo: '' });
  const [addItemStatus, setAddItemStatus] = React.useState('');
    React.useEffect(() => {
    if (mode === 'list') {
      fetchProjects();
    }
  }, [mode]);

  const clearForm = () => {
      setMode('');
      setProjectName('');
      setAddStatus('');
      setItems([{ itemType: '', itemName: '', partNo: '' }]);
      setProjects([]);
      setSelectedProject('');
      setProjectItems([]);
      setSelectStatus('');
      setEditIdx(-1);
      setEditItem(null);
  }

  // Add Project Handlers
  const handleAddProject = async () => {
    setAddStatus('');
    if (!projectName.trim()) {
      setAddStatus('Project name required');
      return;
    }
    try {
      const res = await fetch(`${apiBase()}/admin/projects/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ projectName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
  // Clear project name field before navigating further
  setProjectName('');
  // Switch to select mode, pre-select new project, fetch items
  setMode('select');
  setSelectedProject(projectName);
  fetchProjects();
  fetchProjectItems(projectName);
  alert('Project created successfully! You can now add items.');
  setAddStatus('Project created. You can now add items.');
    } catch (err) {
      alert(err.message);
      setAddStatus(err.message);
    }
  };
  const fetchProjects = async () => {
    setSelectStatus('');
    try {
      const res = await fetch(`${apiBase()}/admin/projects/list`, {
        headers: { ...authHeaders() }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setProjects(data.projects || []);
    } catch (err) {
      setSelectStatus(err.message);
    }
  };

  const fetchProjectItems = async (projectName) => {
    setSelectStatus('');
    try {
      const res = await fetch(`${apiBase()}/admin/projects/items?projectName=${encodeURIComponent(projectName)}`, {
        headers: { ...authHeaders() }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setProjectItems(data.items || []);
    } catch (err) {
      setSelectStatus(err.message);
    }
  };

  // Edit Item Handlers
  const startEditItem = (idx) => {
    setEditIdx(idx);
    setEditItem({ ...projectItems[idx] });
  };

  const handleEditItemChange = (key, value) => {
    setEditItem((prev) => ({ ...prev, [key]: value }));
  };

  const saveEditItem = async () => {
    if (!editItem.itemType || !editItem.itemName || !editItem.partNo) {
      setSelectStatus('All fields required');
      return;
    }
    // Get the original item for lookup
    const originalItem = projectItems[editIdx];
    try {
      const res = await fetch(`${apiBase()}/admin/projects/items/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          projectName: selectedProject,
          oldItemType: originalItem.itemType,
          oldItemName: originalItem.itemName,
          oldPartNo: originalItem.partNo,
          newData: editItem
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setSelectStatus('Item updated');
      setEditIdx(-1);
      setEditItem(null);
      fetchProjectItems(selectedProject);
    } catch (err) {
      setSelectStatus(err.message);
    }
  };

  const deleteItem = async (idx) => {
    const item = projectItems[idx];
    if (!window.confirm('Delete this item?')) return;
    try {
      const res = await fetch(`${apiBase()}/admin/projects/items/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          projectName: selectedProject,
          itemType: item.itemType,
          itemName: item.itemName,
          partNo: item.partNo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setSelectStatus('Item deleted');
      fetchProjectItems(selectedProject);
    } catch (err) {
      setSelectStatus(err.message);
    }
  };
  const [saveAllStatus, setSaveAllStatus] = React.useState('');

  // --- UI ---
  if (!mode) {
    return (
      <div className={styles.inventoryLayout}>
        <Sidebar />
        <div className={styles.inventoryMain}>
          <Header />
          <div className={styles.page}>
            <div className={styles.pageHeader}>
              <div className={styles.pageTitle}>MANAGE PROJECTS (ADMIN)</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/admin/admin-dashboard'); clearForm()}}>CLOSE</button>
            </div>
            <div className={styles.card} style={{ maxWidth: 500, margin: '0 auto', padding: 32 }}>
              <div className={styles.buttonGroup} style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setMode('add')}>ADD NEW PROJECT</button>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setMode('select'); fetchProjects(); }}>EDIT PROJECT</button>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setMode('list'); fetchProjects(); }}>LIST PROJECT</button>
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
              <div className={styles.pageTitle}>ADD PROJECT</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/admin/manage-projects'); clearForm()}}>CLOSE</button>
            </div>
            <div className={styles.card} style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>
              <div style={{ marginBottom: 16 }}>
                <label className={styles.label}>PROJECT NAME:
                  <input value={projectName} onChange={e => setProjectName(e.target.value)} className={styles.control} style={{ marginLeft: 8 }} />
                </label>
                <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginLeft: 12, marginTop: 10 }} onClick={handleAddProject}>CREATE PROJECT</button>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }
  if (mode === 'select') {
    const handleSaveAllItems = async () => {
      setSaveAllStatus('');
      if (!selectedProject) {
        setSaveAllStatus('Select a project first');
        return;
      }
      if (!projectItems.length) {
        setSaveAllStatus('No items to save');
        return;
      }
      // Validate all items
      for (const item of projectItems) {
        if (!item.itemType || !item.itemName || !item.partNo) {
          setSaveAllStatus('All item fields required');
          return;
        }
      }
      try {
        const res = await fetch(`${apiBase()}/admin/projects/items/edit`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            projectName: selectedProject,
            items: projectItems
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed');
  alert('All items updated successfully!');
  setSaveAllStatus('All items updated successfully!');
  fetchProjectItems(selectedProject);
      } catch (err) {
        setSaveAllStatus(err.message);
      }
    };
    const handleAddNewItem = async () => {
      setAddItemStatus('');
      if (!selectedProject) {
        setAddItemStatus('Select a project first');
        return;
      }
      if (!newItem.itemType || !newItem.itemName || !newItem.partNo) {
        setAddItemStatus('All fields required');
        return;
      }
      try {
        const res = await fetch(`${apiBase()}/admin/projects/items/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            projectName: selectedProject,
            itemType: newItem.itemType,
            itemName: newItem.itemName,
            partNo: newItem.partNo
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed');
  alert('Item added successfully!');
  setAddItemStatus('Item added successfully!');
  setNewItem({ itemType: '', itemName: '', partNo: '' });
  fetchProjectItems(selectedProject);
      } catch (err) {
        alert(err.message);
        setAddItemStatus(err.message);
      }
    };

    return (
      <div className={styles.inventoryLayout}>
        <Sidebar />
        <div className={styles.inventoryMain}>
          <Header />
          <div className={styles.page} style={{ height: 'calc(100vh - 120px)', overflowY: 'auto', overflowX: 'auto' }}>
            <div className={styles.pageHeader}>
              <div className={styles.pageTitle}>Select Project</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/admin/manage-projects'); clearForm()}}>CLOSE</button>
            </div>
            <div className={styles.card} style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>
              <div style={{ marginBottom: 16 }}>
                <label className={styles.label}>PROJECT:
                  <select className={styles.control} value={selectedProject} onChange={e => { setSelectedProject(e.target.value); fetchProjectItems(e.target.value); }} style={{ marginLeft: 8 }}>
                    <option value="">SELECT</option>
                    {projects.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              {selectStatus && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{selectStatus}</div>}
              {selectedProject && (
                <div>
                  <h3 style={{ marginTop: 24 }}>ITEMS OF PROJECT {selectedProject}</h3>
                  <div className={styles.tableWrap} style={{ marginTop: 8, maxHeight: 350, overflowY: 'auto', overflowX: 'auto'}}>
                    <table className={styles.table} style={{ minWidth: 600 }}>
                      <thead>
                        <tr>
                          <th>Item Type</th><th>ITEM NAME</th><th>Part No</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectItems.map((it, idx) => (
                          <tr key={idx}>
                            {editIdx === idx ? (
                              <>
                                <td>
                                  <select className={styles.control} value={editItem.itemType} onChange={e => handleEditItemChange('itemType', e.target.value)}>
                                    <option value="UNIT">UNIT</option>
                                    <option value="MODULE">MODULE</option>
                                    <option value="PCB">PCB</option>
                                    <option value="ACCESSORIES">ACCESSORIES</option>
                                  </select>
                                </td>
                                <td><input className={styles.control} value={editItem.itemName} onChange={e => handleEditItemChange('itemName', e.target.value)} /></td>
                                <td><input className={styles.control} value={editItem.partNo} onChange={e => handleEditItemChange('partNo', e.target.value)} /></td>
                                <td>
                                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveEditItem}>SAVE</button>
                                  <button className={`${styles.btn} ${styles.btnGhost}`} style={{ marginLeft: 8 }} onClick={() => { setEditIdx(-1); setEditItem(null); }}>CANCEL</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td>{it.itemType}</td>
                                <td>{it.itemName}</td>
                                <td>{it.partNo}</td>
                                <td>
                                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => startEditItem(idx)}>EDIT</button>
                                  <button className={`${styles.btn} ${styles.btnDanger}`} style={{ marginLeft: 8 }} onClick={() => deleteItem(idx)}>DELETE</button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Add new item form */}
                  <div style={{ marginTop: 24, marginBottom: 12, borderTop: '1px solid #eee', paddingTop: 16 }}>
                    <h4>ADD NEW ITEM</h4>
                    <div className={styles.formGrid2}>
                      <label className={styles.label}>Item Type
                        <select className={styles.control} value={newItem.itemType} onChange={e => setNewItem({ ...newItem, itemType: e.target.value })}>
                          <option value="">Select</option>
                          <option value="UNIT">UNIT</option>
                          <option value="MODULE">MODULE</option>
                          <option value="PCB">PCB</option>
                          <option value="ACCESSORIES">ACCESSORIES</option>
                        </select>
                      </label>
                      <label className={styles.label}>ITEM NAME
                        <input className={styles.control} value={newItem.itemName} onChange={e => setNewItem({ ...newItem, itemName: e.target.value })} />
                      </label>
                      <label className={styles.label}>PART NO
                        <input className={styles.control} value={newItem.partNo} onChange={e => setNewItem({ ...newItem, partNo: e.target.value })} />
                      </label>
                    </div>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: 8 }} onClick={handleAddNewItem}>ADD ITEM</button>
                    {addItemStatus && <div style={{ color: addItemStatus.includes('success') ? 'green' : '#b91c1c', marginTop: 8 }}>{addItemStatus}</div>}
                  </div>
                </div>
              )}
              <div className={styles.pageActions} style={{ marginTop: 16 }}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginRight: 12 }} onClick={handleSaveAllItems}>SAVE ALL</button>
                <button className={`${styles.btn} ${styles.btnGhost}`} style={{ marginLeft: 12 }} onClick={() => setMode('')}>BACK</button>
              </div>
              {saveAllStatus && <div style={{ color: saveAllStatus.includes('success') ? 'green' : '#b91c1c', marginTop: 8 }}>{saveAllStatus}</div>}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (mode === 'list') {
    // CSV download handler
    const handleDownloadCSV = () => {
      if (!projects || projects.length === 0) return;
      const header = ['SERIAL NO.', 'PROJECT NAME'];
      // Properly quote and escape all project names, and ensure all are included
      const rows = projects.map((proj, idx) => [
        idx + 1,
        '"' + String(proj).replace(/"/g, '""') + '"'
      ]);
      let csvContent = header.join(',') + '\n';
      csvContent += rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project_list.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <div className={styles.page} style={{ height: 'calc(100vh - 10px)', overflow: 'auto' }}>
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>PROJECT LIST</div>
          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleDownloadCSV}>DOWNLOAD CSV</button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setMode('')}>CLOSE</button>
          </div>
        </div>
        <div className={styles.card} style={{ maxHeight: '750px', overflowY: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SERIAL NO.</th>
                <th>PROJECT NAME</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={2}>No projects found.</td></tr>
              ) : (
                projects.map((proj, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{proj}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

function SearchPage() {
  const [type, setType] = useState('passNo');
  const [fstatus, setFStatus] = useState('All');
  const [value, setValue] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [projectOptions, setProjectOptions] = useState([]);
  const suggestionRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false); // collapse, but keep suggestions in memory
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log("selectionMode changed:", selectionMode);
    if (selectionMode){
      setSelectionMode(false);
      return;
    }

    if (value.length >= 2 && (type === 'DateRange')) {
      setSuggestions([]);
      return;
    }
    if (value.length >= 2) {
      const fetchSuggestions = async () => {
        try {
          const params = new URLSearchParams();
          params.set('type', type);
          params.set('value', value);
          const res = await fetch(`${apiBase()}/search/suggestions?${params.toString()}`, { headers: { ...authHeaders() } });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || 'Failed to fetch suggestions');
          setSuggestions(data.suggestions || []);
        }
        catch (err) {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
        }
      };
      fetchSuggestions();
    }
    else{
      setSuggestions([]);
    }
  }, [value, type, selectionMode]);

  const clearForm = () => {
    setType('passNo');
    setValue('');
    setFrom('');
    setTo('');
    setResult(null);
    setStatus('');
    setFStatus('All');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const clearOnChange = () =>{
    setValue('');
    setFrom('');
    setTo('');
    setFStatus('All');
  }

  const runSearch = async () => {
    setStatus('');
    try {
      const params = new URLSearchParams();
      params.set('type', type);
      if (type !== 'DateRange' && !value) {
        setStatus('Please enter a value');
        return;
      }
      if (type === 'DateRange' && !from && !to) {
        setStatus('Please enter a date range');
        return;
      }
      if (type !== 'DateRange' && value) params.set('value', value);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('status',fstatus);
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
      if (type !== 'DateRange' && !value) {
        setStatus('Please enter a value');
        return;
      }
      if (type === 'DateRange' && !from && !to) {
        setStatus('Please enter a date range');
        return;
      }
      if (type !== 'DateRange' && value) params.set('value', value);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('status',fstatus);
      const res = await fetch(`${apiBase()}/search/download?${params.toString()}`, { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; 
      const defaultName = `${new Date().toISOString().split('T')[0]}_item_details.csv`;
      a.download = defaultName;
      a.click();
      // a.download = 'search_results.csv'; a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleSelectSuggestion = (s) => {
    setValue(s);
    setShowSuggestions(false);
    setSelectionMode(true);
  };

  const fetchProjects = async () => {
    const res = await fetch(`${apiBase()}/admin/projects/list`, { headers: { ...authHeaders() } });
    const data = await res.json();
    setProjectOptions(data.projects || []);
  };

  // Function to render search results table
  const renderSearchResults = () => {
    if (!result || !result.data || result.data.length === 0) {
      return null;
    }

    return (
      <div className={styles.card} style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <h3>SEARCH RESULTS ({result.count} ENTRIES FOUND)</h3>
        </div>
        <div className={styles.tableWrap} style={{ overflowX: 'auto', maxHeight: 450, overflowY: 'auto', overflowX: 'auto' }}>
          <table className={styles.table} style={{ minWidth: '1400px' }}>
            <thead>
              <tr>
                <th>SL NO.</th>
                <th>PASS NO</th>
                <th>PROJECT NAME</th>
                <th>CUSTOMER NAME</th>
                <th>CUSTOMER UNIT ADDRESS</th>
                <th>CUSTOMER LOCATION</th>
                <th>CUSTOMER PHONE</th>
                <th>EQUIPMENT TYPE</th>
                <th>ITEM NAME</th>
                <th>PART NUMBER</th>
                <th>SERIAL NUMBER</th>
                <th>DEFECT DETAILS</th>
                <th>STATUS</th>
                <th>DATE IN</th>
                <th>DATE OUT</th>
                <th>RECTIFICATION DETAILS</th>
                <th>REMARKS 1 </th>
                <th>REMARKS 2 </th>
                <th>CREATED BY</th>
                <th>UPDATED BY</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((doc, docIndex) => {
                const items = doc.items || [];
                return items.map((item, itemIndex) => {
                  // Determine status: OUT if both itemIn and itemOut are true, else IN
                  const status = item.itemIn && item.itemOut ? "OUT" : "IN";
                  
                  // Format phone number properly
                  const phone = doc.customer?.phone || "";
                  const formattedPhone = phone && !isNaN(phone) ? String(phone) : phone;
                  
                  // Format dates
                  const dateIn = doc.dateIn || "";
                  const dateOut = item.dateOut || "";
                  
                  return (
                    <tr key={`${docIndex}-${itemIndex}`}>
                      <td>{item.serialNo || ""}</td>
                      <td>{doc.passNo || ""}</td>
                      <td>{doc.projectName || ""}</td>
                      <td>{doc.customer?.name || ""}</td>
                      <td>{doc.customer?.unitAddress || ""}</td>
                      <td>{doc.customer?.location || ""}</td>
                      <td>{formattedPhone}</td>
                      <td>{item.equipmentType || ""}</td>
                      <td>{item.itemName || ""}</td>
                      <td>{item.partNumber || ""}</td>
                      <td>{item.serialNumber || ""}</td>
                      <td>{item.defectDetails || ""}</td>
                      <td>{status}</td>
                      <td>{dateIn}</td>
                      <td>{dateOut}</td>
                      <td style={{textAlign: 'left'}}>{item.itemRectificationDetails || ""}</td>
                      <td style={{textAlign: 'left'}}>{item.itemFeedback1Details || ""}</td>
                      <td style={{textAlign: 'left'}}>{item.itemFeedback2Details || ""}</td>
                      <td>{doc.createdBy || ""}</td>
                      <td>{doc.updatedBy || ""}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>REPORT</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/dashboard'); clearForm()}}>CLOSE</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formGrid3}>
          <label className={styles.label}>TYPE
            <select
              className={styles.control}
              value={type}
              onChange={(e) => {setType(e.target.value); clearOnChange();}}
            >
              <option value="passNo">PRIVATE PASS NO</option>
              <option value="ItemPartNo">PART NO</option>
              <option value="ProjectName">PROJECT NAME</option>
              <option value="DateRange">DATE RANGE</option>
            </select>
          </label>
          {type === 'DateRange' ? null : (

            <label className={styles.label}>
              {type === 'passNo' ? 'PRIVATE PASS NO' : type === 'ItemPartNo' ? 'PART NO' : 'PROJECT NAME'}
              {type === 'ProjectName' ?
                <select 
                  className={styles.control} 
                  value={value} 
                  onChange={(e) => {setValue(e.target.value)}}
                  onFocus={fetchProjects} required>
                  <option value="">SELECT PROJECT</option>
                  {projectOptions.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
                </select>
                :
                <div className={styles.relativeContainer} ref={suggestionRef}>
                  <input
                    className={styles.control}
                    value={value}
                    onFocus={() => setShowSuggestions(true)} // expand again when input is focused
                    onChange={(e) => setValue(e.target.value)}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className={styles.suggestionsList}>
                      {suggestions.map((s, i) => (
                        <li key={i} onClick={() => { handleSelectSuggestion(s); }}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              }
            </label>
          )}
          <label className={styles.label}>STATUS
            <select
              className={styles.control}
              value={fstatus}
              onChange={(e) => setFStatus(e.target.value)}
            >
              <option value = "All">ALL</option>
              <option value = "In">IN</option>
              <option value = "Out">OUT</option>
            </select>
          </label>
          {type != 'passNo' && (
            <div className={styles.formGrid2}>
              <label className={styles.label}>From<input className={styles.control} type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
              <label className={styles.label}>To<input className={styles.control} type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            </div>
          )}
        </div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={runSearch}>VIEW ALL RECORDS</button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={download}>DOWNLOAD REPORT</button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.resetBtn}`}
            onClick={clearForm}
          >
            RESET
          </button>
        </div>
        {status ? <div style={{ marginTop: 12 }}>{status}</div> : null}
      </div>
      
      {/* Display search results table */}
      {/* {renderSearchResults()} */}
      {result && result.data && result.data.length > 0 ? (
        renderSearchResults()
      ) : (
        <div
          className={styles.card}
          style={{
            marginTop: 12,
            minHeight: "600px", // enough height to mimic the table area
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
          }}
        >
          {/* Optional placeholder text */}
          <span>No records loaded yet</span>
        </div>
      )}
    </div>
  );
}

function EditPage() {
  const [passNo, setPassNo] = useState('');
  const [doc, setDoc] = useState({
    passNo: "",
    projectName: "",
    dateIn: "",
    customer: { name: "", phone: "", unitAddress: "", location: "" },
    items: []
  });
  const [prevData, setPrevData] = useState({
    passNo: "",
    projectName: "",
    dateIn: "",
    customer: { name: "", phone: "", unitAddress: "", location: "" },
    items: []
  }); // To store original data for change detection
  const [cancel,setCancel] = useState(false);
  const [projectOptions, setProjectOptions] = useState([]);
  
    const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false); // collapse, but keep suggestions in memory
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (passNo.length >= 2) {
      const fetchSuggestions = async () => {
        try {
          const params = new URLSearchParams();
          params.set('type', 'passNo');
          params.set('value', passNo);
          const res = await fetch(`${apiBase()}/search/suggestions?${params.toString()}`, { headers: { ...authHeaders() } });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || 'Failed to fetch suggestions');
          setSuggestions(data.suggestions || []);
        }
        catch (err) {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
        }
      };
      fetchSuggestions();
    }
    else {
      setSuggestions([]);
    }
  }, [passNo]);



  const prevItemsRef = useRef([]);
  // Preload dropdown options for each row on first render
  useEffect(() => {
    if (!doc?.projectName) return;
    if (!doc?.items || doc.items.length === 0) return;

    // Run only for newly added rows
    doc?.items.forEach((row, idx) => {
      const prevRow = prevItemsRef.current[idx];
      if (!prevRow || JSON.stringify(prevRow) !== JSON.stringify(row)) {
        fetchOptionsForRow(row, idx);
      }
    });
    prevItemsRef.current = doc.items;
  }, [doc?.projectName, doc?.items]);

      // --- API call function ---
  const fetchItems = async (projectName) => {
    const res = await fetch(
      `${apiBase()}/admin/projects/items?projectName=${encodeURIComponent(projectName)}`,
      { headers: { ...authHeaders() } }
    );
    const data = await res.json();
    return data.items || [];
  };

  // --- Row update function ---
  const updateOptionsForRow = (items, row, idx) => {
    console.log(items, "items fetched");

    // Item Types
    const typeOptions = [...new Set(items.map(it => it.itemType).filter(Boolean))];
    updateItem(idx, "itemTypeOptions", typeOptions);

    // Item Names (based on saved equipmentType)
    if (row.equipmentType) {
      const nameOptions = [...new Set(
        items.filter(it => it.itemType === row.equipmentType).map(it => it.itemName).filter(Boolean)
      )];
      updateItem(idx, "itemNameOptions", nameOptions);
    }

    // Part Numbers (based on saved equipmentType + itemName)
    if (row.equipmentType && row.itemName) {
      const partOptions = [...new Set(
        items.filter(it => it.itemType === row.equipmentType && it.itemName === row.itemName)
            .map(it => it.partNo)
            .filter(Boolean)
      )];
      updateItem(idx, "partNoOptions", partOptions);
    }
  };

  // --- Combined function (calls API then updates row) ---
  const fetchOptionsForRow = async (row, idx) => {
    const items = await fetchItems(doc.projectName);
    updateOptionsForRow(items, row, idx);
  };



  useEffect(() => {
    if (cancel) {
      setDoc(prevData);
      setCancel(false);
    }
  }, [cancel]);

  const fetchItemTypeOptions = async (idx) => {
    if (!doc?.projectName) return;
    const res = await fetch(`${apiBase()}/admin/projects/items?projectName=${encodeURIComponent(doc.projectName)}`, { headers: { ...authHeaders() } });
    const data = await res.json();
    const uniqueTypes = [...new Set((data.items || []).map(it => it.itemType).filter(Boolean))];
    updateItem(idx, 'itemTypeOptions', uniqueTypes);
  };

  const fetchItemNameOptions = async (idx, equipmentType) => {
    if (!doc?.projectName || !equipmentType) return;
    const res = await fetch(`${apiBase()}/admin/projects/items?projectName=${encodeURIComponent(doc.projectName)}`, { headers: { ...authHeaders() } });
    const data = await res.json();
    const names = [...new Set((data.items || [])
      .filter(it => it.itemType === equipmentType)
      .map(it => it.itemName)
      .filter(Boolean)
    )];
    updateItem(idx, 'itemNameOptions', names);
  };

  const fetchPartNoOptions = async (idx, equipmentType, itemName) => {
    if (!doc?.projectName || !equipmentType || !itemName) return;
    const res = await fetch(`${apiBase()}/admin/projects/items?projectName=${encodeURIComponent(doc.projectName)}`, { headers: { ...authHeaders() } });
    const data = await res.json();
    const parts = [...new Set((data.items || [])
      .filter(it => it.itemType === equipmentType && it.itemName === itemName)
      .map(it => it.partNo)
      .filter(Boolean)
    )];
    updateItem(idx, 'partNoOptions', parts);
  };

    // Duplicate item row (already declared, remove duplicate)
  // Duplicate item row
  // const duplicateItem = (idx) => {
  //   setDoc((prev) => {
  //     const copy = [...prev];
  //     copy.splice(idx + 1, 0, { ...prev[idx] });
  //     return copy;
  //   });
  // };
  const duplicateItem = (idx) => {
  setDoc(prev => {
    const items = prev.items || [];
    const src = items[idx] || {};

    const newRow = {
      equipmentType: src.equipmentType || '',
      itemName: src.itemName || '',
      partNumber: src.partNumber || '',
      serialNumber: '',
      defectDetails: '',
      itemTypeOptions: [],
      itemNameOptions: [],
      partNoOptions: [],
      itemIn: src.itemIn ?? true,
      itemOut: false,
      dateOut: null
    };

    const newItems = [...items.slice(0, idx + 1), newRow, ...items.slice(idx + 1)];
    return { ...prev, items: newItems };
  });
};


  // Fetch project options on mount
  useEffect(() => {
    fetch(`${apiBase()}/admin/projects/list`, { headers: { ...authHeaders() } })
      .then(res => res.json())
      .then(data => setProjectOptions(data.projects || []));
  }, []);

  const [status, setStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const clearForm = () => {
    setPassNo('');
    setDoc({
      passNo: "",
      projectName: "",
      dateIn: "",
      customer: { name: "", phone: "", unitAddress: "", location: "" },
      items: []
    });
    setStatus('');
    setIsEditing(false);
  };

  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's 10 digits (Indian mobile number)
    if (cleaned.length === 10) {
      return true;
    }
    // Check if it's 12 digits (with country code)
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return true;
    }
    return false;
  };

  const fetchDoc = async () => {
    setStatus('');
    try {
      console.log('=== FETCHING RECORD DEBUG ===');
      console.log('Pass Number:', passNo);
      console.log('Auth headers:', authHeaders());
      
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(passNo)}`, { headers: { ...authHeaders() } });
      console.log('Fetch response status:', res.status);
      
      const data = await res.json();
      console.log('Fetch response data:', data);
      
      if (!res.ok) throw new Error(data?.error || 'Not found');
      console.log('Fetched record data:', data);
      console.log('Items in fetched record:', data.items);
      setDoc(data);
      setPrevData(data); // Store original data for change detection
      setIsEditing(false); // Reset to readonly mode when fetching new record
    } catch (err) {
      console.error('Error fetching record:', err);
      setDoc({
        passNo: "",
        projectName: "",
        dateIn: "",
        customer: { name: "", phone: "", unitAddress: "", location: "" },
        items: []
      });
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
    setDoc((prev) => ({ ...prev, items: [...prev.items, { equipmentType: '', itemName: '', partNumber: '', serialNumber: '', defectDetails: '', itemIn: true, itemOut: false, dateOut: null, itemRectificationDetails: '', itemFeedback1Details: '', itemFeedback2Details: ''}] }));
  };

  const deleteItem = (idx) => {
    console.log('Delete item clicked:', idx, 'Total items:', doc?.items.length);
    if (doc?.items.length > 1) {
      const confirmDelete = window.confirm('Are you sure you want to delete this item?');
      if (confirmDelete) {
        setDoc((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
      }
    }
  };

  const submitChanges = async () => {
    if (!doc) return;
    
    // Validate required fields
    if (!doc?.customer?.name || doc?.customer.name.trim() === '') {
      alert('Customer Name is required');
      return;
    }
    
    if (!doc?.customer?.phone || doc?.customer.phone.trim() === '') {
      alert('Customer Phone Number is required');
      return;
    }
    
    // Validate phone number format
    if (doc?.customer?.phone && !validatePhoneNumber(doc?.customer.phone)) {
      alert('Please enter a valid 10-digit phone number (e.g., 9876543210)');
      return;
    }
    
    const itemsWithoutDetails = doc.items.filter(item => item.itemOut && (!item.itemRectificationDetails || item.itemRectificationDetails.trim() === ''));
    if (itemsWithoutDetails.length > 0) {
      alert('Please enter rectification details for all items marked as "Item Out"');
      return;
    }

    // Validate item fields
    const invalidItems = doc?.items.filter(item => 
      !item.itemName || item.itemName.trim() === '' ||
      !item.partNumber || item.partNumber.trim() === '' ||
      !item.serialNumber || item.serialNumber.trim() === ''
    );
    
    if (invalidItems.length > 0) {
      alert('All items must have Item Name, Part Number, and Serial Number filled');
      return;
    }
    
    // Confirm submission
    const confirmSubmit = window.confirm('Are you sure you want to save these changes?');
    if (!confirmSubmit) {
      return;
    }
    
    setStatus('');
    try {
      const payload = { dateIn: doc?.dateIn, customer: doc?.customer, projectName: doc?.projectName, items: doc?.items };
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(doc?.passNo)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      
      alert('Record updated successfully!');
      setStatus('Updated');
      setIsEditing(false); // Return to readonly mode after successful update
    } catch (err) { 
      alert(`Error: ${err.message}`);
      setStatus(`Error: ${err.message}`); 
    }
  };

  const deleteRecord = async () => {
    if (!doc) return;
    
    // Enhanced confirmation for record deletion
    const confirmDelete = window.confirm('⚠️ WARNING: This action cannot be undone!\n\nAre you sure you want to delete this record permanently?');
    if (!confirmDelete) return;
    
    setStatus('');
    try {
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(doc?.passNo)}`, { method: 'DELETE', headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      
      alert('Record deleted successfully!');
      setStatus('Deleted');
      clearForm();
    } catch (err) { 
      alert(`Error: ${err.message}`);
      setStatus(`Error: ${err.message}`); 
    }
  };

  return (
    <div className={styles.page} style={{ height: 'calc(100vh - 10px)', overflow: 'auto' }}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>EDIT/VIEW</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/dashboard'); clearForm()}}>CLOSE</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formRow}>
          <label className={styles.label}>
            PRIVATE PASS NO
            <div className={styles.relativeContainer} ref={suggestionRef}>
              <input 
                className={styles.control} 
                placeholder="PASS NO" 
                value={passNo} 
                onChange={(e) => setPassNo(e.target.value)}
                onFocus={() => setShowSuggestions(true)} // expand again when input is focused 
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className={styles.suggestionsList}>
                  {suggestions.map((s, i) => (
                    <li key={i} onClick={() => { setPassNo(s); setShowSuggestions(false); }}>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>
          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={fetchDoc}>DISPLAY</button>
          </div>
        </div>
      </div>
      {doc?.projectName ? (
        <div className={styles.cardEdit} style={{ marginTop: 12 }}>
          <div className={styles.pageActions} style={{ marginBottom: 16 }}>
            {!isEditing ? (
              <>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setIsEditing(true)}>EDIT</button>
                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={deleteRecord}>DELETE</button>
              </>
            ) : (
              <>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submitChanges}>SAVE CHANGES</button>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {setIsEditing(false); setCancel(true);}}>CANCEL</button>
              </>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (isEditing) submitChanges(); }} className={`${styles.form} ${isEditing ? "" : styles.freeze}`}>
            <div className={styles.formGrid2}>
              <label className={styles.label}>PRIVATE PASS NO<input className={styles.control} value={doc.passNo || ''} readOnly /></label>
              <label className={styles.label}>DATE IN<input className={styles.control} type="date" value={doc.dateIn || ''} onChange={(e) => updateDocField('dateIn', e.target.value)} readOnly={!isEditing} /></label>
              <label className={`${styles.label} ${styles.freeze}`}>PROJECT NAME
                <select className={styles.control} value={doc?.projectName || ''} onChange={e => updateDocField('projectName', e.target.value)} disabled={!isEditing} required>
                  <option value="">SELECT PROJECT</option>
                  {projectOptions.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
                </select>
              </label>
              <label className={styles.label}>CUSTOMER NAME<input className={styles.control} value={doc.customer?.name || ''} onChange={(e) => updateDocField('customer.name', e.target.value)} readOnly={!isEditing} required /></label>
              <label className={styles.label}>CUSTOMER UNIT ADDRESS<input className={styles.control} value={doc.customer?.unitAddress || ''} onChange={(e) => updateDocField('customer.unitAddress', e.target.value)} readOnly={!isEditing} /></label>
              <label className={styles.label}>CUSTOMER LOCATION<input className={styles.control} value={doc.customer?.location || ''} onChange={(e) => updateDocField('customer.location', e.target.value)} readOnly={!isEditing} /></label>
              <label className={styles.label}>
                CUSTOMER PHONE NO
                <input 
                  className={styles.control} 
                  value={doc.customer?.phone || ''} 
                  onChange={(e) => updateDocField('customer.phone', e.target.value)}
                  placeholder="ENTER 10-DIGIT NUMBER (E.G., 9876543210)"
                  readOnly={!isEditing}
                  required
                />
                {doc.customer?.phone && !validatePhoneNumber(doc.customer.phone) && (
                  <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '2px' }}>
                    PLEASE ENTER A VALID 10-DIGIT PHONE NUMBER
                  </div>
                )}
              </label>
            </div>
            <div className={styles.tableWrap} style={{ marginTop: 8, overflowX: 'auto', maxHeight: 350, overflowY: 'auto', overflowX: 'auto' }}>
              <table className={styles.table} style={{ minWidth: '1200px' }}>
                <thead>
                  <tr>
                    <th>ITEM TYPE</th><th>ITEM NAME</th><th>PART NO</th><th>SERIAL NO</th><th>DEFECT</th><th>ITEMOUT</th><th>DATE OUT</th><th>RECTIFICATION DETAILS</th><th>REMARKS 1 DETAILS</th><th>REMARKS 2 DETAILS</th>
                    {isEditing && <th style={{ minWidth: '100px', textAlign: 'center' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {doc?.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          className={styles.control}
                          value={it.equipmentType || ''}
                          onFocus={() => fetchItemTypeOptions(idx)}
                          onChange={e => updateItem(idx, 'equipmentType', e.target.value)}
                        >
                          <option value="">SELECT TYPE</option>
                          {it.itemTypeOptions?.map((t, i) => <option key={i} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className={styles.control}
                          value={it.itemName || ''}
                          onFocus={() => fetchItemNameOptions(idx, it.equipmentType)}
                          onChange={e => updateItem(idx, 'itemName', e.target.value)}
                        >
                          <option value="">SELECT NAME</option>
                          {it.itemNameOptions?.map((n, i) => <option key={i} value={n}>{n}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className={styles.control}
                          value={it.partNumber || ''}
                          onFocus={() => fetchPartNoOptions(idx, it.equipmentType, it.itemName)}
                          onChange={e => updateItem(idx, 'partNumber', e.target.value)}
                        >
                          <option value="">SELECT PART</option>
                          {it.partNoOptions?.map((p, i) => <option key={i} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td><input className={styles.control} value={it.serialNumber || ''} onChange={(e) => updateItem(idx, 'serialNumber', e.target.value)} readOnly={!isEditing} required /></td>
                      <td><input className={styles.control} value={it.defectDetails || ''} onChange={(e) => updateItem(idx, 'defectDetails', e.target.value)} readOnly={!isEditing} /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!it.itemOut} onChange={(e) => updateItem(idx, 'itemOut', e.target.checked)} disabled={!isEditing} /></td>
                      <td>
                        <input 
                          type="date" 
                          className={styles.control} 
                          value={it.dateOut || ''} 
                          onChange={(e) => updateItem(idx, 'dateOut', e.target.value)}
                          readOnly={!isEditing}
                        />
                        {!it.dateOut && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>NO DATE SET</div>}
                        {it.itemOut && !it.dateOut && <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '2px' }}>⚠️ DATE REQUIRED FOR ITEM OUT</div>}
                      </td>
                      <td>
                          <textarea
                            className={styles.control}
                            value={it.itemRectificationDetails || ""}
                            onChange={(e) => updateItem(idx, 'itemRectificationDetails', e.target.value)}
                            readOnly={!isEditing}
                            rows={1} // looks like an input initially
                          />
                          {it.itemOut &&
                            (!it.itemRectificationDetails ||
                              it.itemRectificationDetails.trim() === "") && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#ff6b6b",
                                  marginTop: "2px",
                                }}
                              >
                                ⚠️ Rectification details required for Item Out
                              </div>
                          )}
                      </td>
                      <td>
                        <textarea
                            className={styles.control}
                            value={it.itemFeedback1Details || ""}
                            onChange={(e) => updateItem(idx, 'itemFeedback1Details', e.target.value)}
                            readOnly={!isEditing}
                            rows={1} // looks like an input initially
                          />
                      </td>
                      <td>
                        <textarea
                            className={styles.control}
                            value={it.itemFeedback2Details || ""}
                            onChange={(e) => updateItem(idx, 'itemFeedback2Details', e.target.value)}
                            readOnly={!isEditing}
                            rows={1} // looks like an input initially
                          />
                      </td>
                      {isEditing && (
                        <td style={{ textAlign: 'center', minWidth: '100px', whiteSpace: 'nowrap' }}>
                          <button 
                            type="button" 
                            className={`${styles.btn} ${styles.btnGhost}`} 
                            onClick={() => duplicateItem(idx)} 
                            style={{ fontSize: '0.85rem', padding: '6px 12px', marginRight: 4 }}
                          >
                            DUPLICATE
                          </button>
                          <button 
                            type="button" 
                            className={`${styles.btn} ${styles.btnDanger}`} 
                            onClick={() => deleteItem(idx)} 
                            disabled={doc?.items.length === 1}
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                          >
                            DELETE
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {isEditing && (
                <div style={{ marginTop: 8 }}>
                  <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={addItem}>ADD ITEM</button>
                </div>
              )}
            </div>
            {status ? <div style={{ marginTop: 12 }}>{status}</div> : null}
          </form>
        </div>
      ) : <div className = {styles.errMsg}>{status}</div>}
    </div>
  );
}

function App() {
  const [authTick, setAuthTick] = React.useState(0);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const token = React.useMemo(() => {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }, [authTick]);
  
  const role = React.useMemo(() => {
    return sessionStorage.getItem('role') || localStorage.getItem('role');
  }, [authTick]);

  // Check authentication status on mount and when authTick changes
  React.useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      if (token) {
        const isValid = await validateToken();
        if (!isValid) {
          clearAuthData();
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token, authTick]);

  // Protected Route Component
  const ProtectedRoute = ({ children, requiredRole = null }) => {
    const [isValidating, setIsValidating] = React.useState(true);
    const [isValid, setIsValid] = React.useState(false);
    const [userRole, setUserRole] = React.useState(null);

    React.useEffect(() => {
      const validateAccess = async () => {
        setIsValidating(true);
        const currentToken = sessionStorage.getItem('token') || localStorage.getItem('token');
        
        if (!currentToken) {
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        try {
          const response = await fetch(`${apiBase()}/validate-token`, {
            headers: { Authorization: `Bearer ${currentToken}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
            
            // Check role requirement
            if (requiredRole === "user") {
              // User pages can only be accessed by user role (not admin)
              setIsValid(data.role === "user");
            } else if (requiredRole === "admin") {
              // Admin pages can only be accessed by admin role
              setIsValid(data.role === "admin");
            } else {
              setIsValid(true);
            }
          } else {
            setIsValid(false);
            clearAuthData();
          }
        } catch (error) {
          console.error('Token validation error:', error);
          setIsValid(false);
          clearAuthData();
        }
        
        setIsValidating(false);
      };

      validateAccess();
    }, []);

    if (isValidating) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px'
        }}>
          Validating...
        </div>
      );
    }

    if (!isValid) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  // Handle browser back/forward navigation
  React.useEffect(() => {
    const handlePopState = () => {
      if (!token) {
        clearAuthData();
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [token]);

  // Handle page visibility change (when user switches tabs or minimizes browser)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && token) {
        // Optional: Clear session storage when page becomes hidden for extra security
        // sessionStorage.clear();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token]);

  // Check for session timeout (24 hours)
  React.useEffect(() => {
    const checkSessionTimeout = () => {
      const loginTime = sessionStorage.getItem('loginTime') || localStorage.getItem('loginTime');
      if (loginTime) {
        const loginTimestamp = parseInt(loginTime);
        const currentTime = Date.now();
        const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (currentTime - loginTimestamp > sessionTimeout) {
          clearAuthData();
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      }
    };

    // Check immediately
    checkSessionTimeout();
    
    // Check every 5 minutes
    const interval = setInterval(checkSessionTimeout, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <LoginPage onLoggedIn={() => setAuthTick((t) => t + 1)} />
        } />
        <Route path="/admin/add-user" element={
          <ProtectedRoute requiredRole="admin">
            <AdminAddUserPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/manage-projects" element={
          <ProtectedRoute requiredRole="admin">
            <ManageProjects />
          </ProtectedRoute>
        } />
        <Route path="/admin/admin-Dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="user">
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/item-in" element={
          <ProtectedRoute requiredRole="user">
            <ItemInPage />
          </ProtectedRoute>
        } />
        <Route path="/item-out" element={
          <ProtectedRoute requiredRole="user">
            <ItemOutPage />
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute requiredRole="user">
            <SearchPage />
          </ProtectedRoute>
        } />
        <Route path="/edit" element={
          <ProtectedRoute requiredRole="user">
            <EditPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
