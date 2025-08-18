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
              <div className={styles.cardTitle}>Report</div>
              <div className={styles.cardDesc}>Find records by private pass no, part no, project or date range.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/search">Open</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Edit/View</div>
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

  const handleLogout = async () => {
    try {
      // Call logout endpoint to invalidate session on server
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:8000/api/logout', {
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
            <div className={styles.pageTitle}>Admin - Add User</div>
            <div className={styles.pageActions}>
              <span className={styles.pill}>Admin</span>
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
          <label className={styles.label}>Private Pass No<input className={styles.control} type="number" value={passNo} onChange={(e) => setPassNo(e.target.value)} required /></label>
            <label className={styles.label}>Date In<input className={styles.control} type="date" value={dateIn} onChange={(e) => setDateIn(e.target.value)} /></label>
            <label className={styles.label}>Project Name<input className={styles.control} value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>
            <label className={styles.label}>Customer Name<input className={styles.control} value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></label>
            <label className={styles.label}>Customer Unit Address<input className={styles.control} value={customerUnitAddress} onChange={(e) => setCustomerUnitAddress(e.target.value)} /></label>
            <label className={styles.label}>Customer Location<input className={styles.control} value={customerLocation} onChange={(e) => setCustomerLocation(e.target.value)} /></label>
            <label className={styles.label}>
              Customer Phone No
              <input 
                className={styles.control} 
                value={customerPhoneNo} 
                onChange={(e) => setCustomerPhoneNo(e.target.value)}
                placeholder="Enter 10-digit number (e.g., 9876543210)"
                required
              />
              {customerPhoneNo && !validatePhoneNumber(customerPhoneNo) && (
                <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '2px' }}>
                  Please enter a valid 10-digit phone number
                </div>
              )}
            </label>
          </div>
          <div className={styles.tableWrap} style={{ marginTop: 8 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item Type</th><th>Item Name *</th><th>Part No *</th><th>Serial No *</th><th>Defect</th><th>Actions</th>
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
                        <option value="Accessory">Accessories</option>
                      </select>
                    </td>
                    <td><input className={styles.control} value={it.itemName} onChange={(e) => updateItem(idx, 'itemName', e.target.value)} required /></td>
                    <td><input className={styles.control} value={it.partNumber} onChange={(e) => updateItem(idx, 'partNumber', e.target.value)} required /></td>
                    <td><input className={styles.control} value={it.serialNumber} onChange={(e) => updateItem(idx, 'serialNumber', e.target.value)} required /></td>
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
            <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">Save</button>
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
        itemRectificationDetails: it.itemRectificationDetails || '' 
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
        <div className={styles.pageTitle}>Item Out</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/dashboard')}>Close</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formRow}>
          <label className={styles.label}>Private Pass No<input className={styles.control} placeholder="Pass No" value={passNo} onChange={(e) => setPassNo(e.target.value)} /></label>
          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={fetchRecord}>Search</button>
            {/* <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {
              console.log('=== API TEST ===');
              console.log('API Base:', apiBase());
              console.log('Auth Headers:', authHeaders());
              console.log('Token:', sessionStorage.getItem('token') || localStorage.getItem('token'));
            }}>Test API</button> */}
          </div>
        </div>
      </div>
      {record ? (
        <div className={styles.card} style={{ marginTop: 12 }}>
          <div className={styles.formGrid3}>
            <div><b>Private Pass No:</b> {record.passNo}</div>
            <div><b>Date In:</b> {record.dateIn}</div>
            <div><b>Customer:</b> {record.customer?.name}</div>
            <div><b>Project:</b> {record.projectName}</div>
            <div><b>Phone:</b> {record.customer?.phone}</div>
            <div><b>Unit Address:</b> {record.customer?.unitAddress}</div>
            <div><b>Location:</b> {record.customer?.location}</div>
          </div>
          <div className={styles.tableWrap} style={{ marginTop: 12 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th><th>Name</th><th>Part No</th><th>Serial No</th><th>Defect</th><th>ItemOut</th><th>Date Out</th><th>Rectification Details</th>
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
                        required={it.itemOut}
                      />
                      {it.itemOut && (!it.itemRectificationDetails || it.itemRectificationDetails.trim() === '') && (
                        <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '2px' }}>⚠️ Rectification details required for Item Out</div>
                      )}
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

  // Function to render search results table
  const renderSearchResults = () => {
    if (!result || !result.data || result.data.length === 0) {
      return null;
    }

    return (
      <div className={styles.card} style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <h3>Search Results ({result.count} entries found)</h3>
        </div>
        <div className={styles.tableWrap} style={{ overflowX: 'auto' }}>
          <table className={styles.table} style={{ minWidth: '1400px' }}>
            <thead>
              <tr>
                <th>Pass No</th>
                <th>Project Name</th>
                <th>Customer Name</th>
                <th>Customer Unit Address</th>
                <th>Customer Location</th>
                <th>Customer Phone</th>
                <th>Equipment Type</th>
                <th>Item Name</th>
                <th>Part Number</th>
                <th>Serial Number</th>
                <th>Defect Details</th>
                <th>Status</th>
                <th>Date In</th>
                <th>Date Out</th>
                <th>Item Rectification Details</th>
                <th>Created By</th>
                <th>Updated By</th>
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
                      <td>{item.itemRectificationDetails || ""}</td>
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
        <div className={styles.pageTitle}>View</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/dashboard')}>Close</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formGrid3}>
          <label className={styles.label}>Type
            <select
              className={styles.control}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="PassNo">Private Pass No</option>
              <option value="ItemPartNo">Part No</option>
              <option value="ProjectName">Project Name</option>
              <option value="DateRange">Date Range</option>
            </select>
          </label>
          {type === 'DateRange' ? null : (
            <label className={styles.label}>Value<input className={styles.control} value={value} onChange={(e) => setValue(e.target.value)} /></label>
          )}
          {type != 'PassNo' && (
            <div className={styles.formGrid2}>
              <label className={styles.label}>From<input className={styles.control} type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
              <label className={styles.label}>To<input className={styles.control} type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            </div>
          )}
        </div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={runSearch}>View All Records</button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={download}>Download Report</button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.resetBtn}`}
            onClick={clearForm}
          >
            Reset
          </button>
        </div>
        {status ? <div style={{ marginTop: 12 }}>{status}</div> : null}
      </div>
      
      {/* Display search results table */}
      {renderSearchResults()}
    </div>
  );
}

function EditPage() {
  const [passNo, setPassNo] = useState('');
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const clearForm = () => {
    setPassNo('');
    setDoc(null);
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
      setIsEditing(false); // Reset to readonly mode when fetching new record
    } catch (err) {
      console.error('Error fetching record:', err);
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
      const confirmDelete = window.confirm('Are you sure you want to delete this item?');
      if (confirmDelete) {
        setDoc((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
      }
    }
  };

  const submitChanges = async () => {
    if (!doc) return;
    
    // Validate required fields
    if (!doc.customer?.name || doc.customer.name.trim() === '') {
      alert('Customer Name is required');
      return;
    }
    
    if (!doc.customer?.phone || doc.customer.phone.trim() === '') {
      alert('Customer Phone Number is required');
      return;
    }
    
    // Validate phone number format
    if (doc.customer?.phone && !validatePhoneNumber(doc.customer.phone)) {
      alert('Please enter a valid 10-digit phone number (e.g., 9876543210)');
      return;
    }
    
    // Validate item fields
    const invalidItems = doc.items.filter(item => 
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
      const payload = { dateIn: doc.dateIn, customer: doc.customer, projectName: doc.projectName, items: doc.items };
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(doc.passNo)}`, {
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
      const res = await fetch(`${apiBase()}/items/${encodeURIComponent(doc.passNo)}`, { method: 'DELETE', headers: { ...authHeaders() } });
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
    <div className={styles.page} style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Edit/View</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/dashboard')}>Close</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formRow}>
          <label className={styles.label}>Private Pass No<input className={styles.control} placeholder="Pass No" value={passNo} onChange={(e) => setPassNo(e.target.value)} /></label>
          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={fetchDoc}>Display</button>
          </div>
        </div>
      </div>
      {doc ? (
        <div className={styles.card} style={{ marginTop: 12 }}>
          <div className={styles.pageActions} style={{ marginBottom: 16 }}>
            {!isEditing ? (
              <>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setIsEditing(true)}>Edit</button>
                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={deleteRecord}>Delete</button>
              </>
            ) : (
              <>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submitChanges}>Save Changes</button>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setIsEditing(false)}>Cancel</button>
              </>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (isEditing) submitChanges(); }} className={styles.form}>
            <div className={styles.formGrid2}>
              <label className={styles.label}>Private Pass No<input className={styles.control} value={doc.passNo || ''} readOnly /></label>
              <label className={styles.label}>Date In<input className={styles.control} type="date" value={doc.dateIn || ''} onChange={(e) => updateDocField('dateIn', e.target.value)} readOnly={!isEditing} /></label>
              <label className={styles.label}>Project Name<input className={styles.control} value={doc.projectName || ''} onChange={(e) => updateDocField('projectName', e.target.value)} readOnly={!isEditing} /></label>
              <label className={styles.label}>Customer Name<input className={styles.control} value={doc.customer?.name || ''} onChange={(e) => updateDocField('customer.name', e.target.value)} readOnly={!isEditing} required /></label>
              <label className={styles.label}>Customer Unit Address<input className={styles.control} value={doc.customer?.unitAddress || ''} onChange={(e) => updateDocField('customer.unitAddress', e.target.value)} readOnly={!isEditing} /></label>
              <label className={styles.label}>Customer Location<input className={styles.control} value={doc.customer?.location || ''} onChange={(e) => updateDocField('customer.location', e.target.value)} readOnly={!isEditing} /></label>
              <label className={styles.label}>
                Customer Phone No
                <input 
                  className={styles.control} 
                  value={doc.customer?.phone || ''} 
                  onChange={(e) => updateDocField('customer.phone', e.target.value)}
                  placeholder="Enter 10-digit number (e.g., 9876543210)"
                  readOnly={!isEditing}
                  required
                />
                {doc.customer?.phone && !validatePhoneNumber(doc.customer.phone) && (
                  <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '2px' }}>
                    Please enter a valid 10-digit phone number
                  </div>
                )}
              </label>
            </div>
            <div className={styles.tableWrap} style={{ marginTop: 8, overflowX: 'auto' }}>
              <table className={styles.table} style={{ minWidth: '1200px' }}>
                <thead>
                  <tr>
                    <th>Item Type</th><th>Item Name</th><th>Part No</th><th>Serial No</th><th>Defect</th><th>ItemOut</th><th>Date Out</th><th>Rectification Details</th>
                    {isEditing && <th style={{ minWidth: '100px', textAlign: 'center' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {doc.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <select className={styles.control} value={it.equipmentType || ''} onChange={(e) => updateItem(idx, 'equipmentType', e.target.value)} disabled={!isEditing}>
                          <option value="unit">Unit</option>
                          <option value="module">Module</option>
                          <option value="PCB">PCB</option>
                          <option value="Accessory">Accessories</option>
                        </select>
                      </td>
                      <td><input className={styles.control} value={it.itemName || ''} onChange={(e) => updateItem(idx, 'itemName', e.target.value)} readOnly={!isEditing} required /></td>
                      <td><input className={styles.control} value={it.partNumber || ''} onChange={(e) => updateItem(idx, 'partNumber', e.target.value)} readOnly={!isEditing} required /></td>
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
                          readOnly={!isEditing}
                        />
                      </td>
                      {isEditing && (
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
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {isEditing && (
                <div style={{ marginTop: 8 }}>
                  <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={addItem}>Add Item</button>
                </div>
              )}
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
