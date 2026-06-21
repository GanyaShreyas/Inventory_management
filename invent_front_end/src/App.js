import './App.css';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import styles from './components/styles.module.css';
import Sticker from './components/sticker';
import React, { use, useEffect, useMemo, useState } from 'react';
import { useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
// import formElements from './components/FormElements';
//import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import UserDashboardChoice from './DashboardChoice';          
import SparesManagement from './SparesManagement';  
import DashboardChoice from './DashboardChoice';
import { SparesMasterListPage, SparesInPage, SparesOutPage, ViewItemPage, StockCheckPage, SparesOutReturnablePage, SparesInReturnedPage } from './SparesManagement';
import OBDManagement, { OBDOutPage, OBDStatusPage, UpdateOBDPage } from './OBDManagement';
import ConfigurationManagement, { ConfigEditPage, ConfigViewPage } from './ConfigurationManagement';
import ManageStores from './components/ManageStores';
import SectionNav from './components/SectionNav';
import { Outlet } from "react-router-dom";
import { createPortal } from 'react-dom';
import { apiBase, authHeaders } from './apiConfig';

/** Optional field: whole number 2000–2100, or empty */
function parseYearOfMfgInput(raw) {
  if (raw === '' || raw === null || raw === undefined) return { ok: true, value: null };
  const s = String(raw).trim();
  if (!/^\d+$/.test(s)) {
    return { ok: false, msg: 'Year of MFG must be a whole number between 2000 and 2100' };
  }
  const n = parseInt(s, 10);
  if (n < 2000 || n > 2100) {
    return { ok: false, msg: 'Year of MFG must be between 2000 and 2100' };
  }
  return { ok: true, value: n };
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
        navigate('/choice', { replace: true });
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
            <div className={styles.card}>
              <div className={styles.cardTitle}>LIST USERS</div>
              <div className={styles.cardDesc}>View all users and delete if needed.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/admin/list-users">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>RESET USER PASSWORD</div>
              <div className={styles.cardDesc}>Reset any user's password by username.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/admin/reset-password">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>MANAGE MASTER LIST — SPARES</div>
              <div className={styles.cardDesc}>Add or update spares master items (part no, project, store, bins).</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/admin/spares-master-list">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>MANAGE STORES</div>
              <div className={styles.cardDesc}>Define store names used in Spares master list.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/admin/manage-stores">OPEN</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>

    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate();

  const handleBackup = async () => {
    try {
      const res = await fetch(`${apiBase()}/admin/backup`, { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error('Backup failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const kolkataNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const pad2 = (n) => String(n).padStart(2, '0');
      const dd = pad2(kolkataNow.getDate());
      const mm = pad2(kolkataNow.getMonth() + 1);
      const yyyy = kolkataNow.getFullYear();
      a.download = `mongo_backup_${dd}-${mm}-${yyyy}.zip`;

      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>COMPLAINTS MANAGEMENT</div>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/choice');}}>BACK</button>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>ITEM IN</div>
              <div className={styles.cardDesc}>Create a new incoming pass with customer and item details.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/item-in">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>RFD</div>
              <div className={styles.cardDesc}>Mark items Ready For Dispatch.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/rfd">OPEN</Link>
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
            <div className={styles.card}>
              <div className={styles.cardTitle}>MONGO BACKUP</div>
              <div className={styles.cardDesc}>Export every MongoDB collection as JSON.</div>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleBackup}>
                Backup
              </button>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>PRINT FORMS</div>
              <div className={styles.cardDesc}>Print stickers, handover form, or acknowledgement.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/print-sticker">OPEN</Link>
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
        await fetch(`${apiBase()}/logout`, {
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
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/admin/admin-dashboard'); clearForm()}}>BACK</button>
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

function AdminListUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null); // { username, name, designation, mobile, store }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/admin/users/list`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setUsers(data.users || []);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (username) => {
    const confirmDel = window.confirm(`Are you sure you want to delete user "${username}"?\n\nThis action cannot be undone.`);
    if (!confirmDel) return;
    try {
      const res = await fetch(`${apiBase()}/admin/users/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert(data.message || 'User deleted');
      fetchUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEdit = (u) => {
    setEditUser({ username: u.username, name: u.name || '', designation: u.designation || '', mobile: u.mobile || '' });
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    try {
      const res = await fetch(`${apiBase()}/admin/users/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(editUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert(data.message || 'User updated');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>ADMIN - LIST USERS</div>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/admin/admin-dashboard')}>BACK</button>
          </div>
          <div className={styles.card}>
            {loading ? <div>Loading...</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.productsTable} style={{ minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th>SL</th>
                      <th>NAME</th>
                      <th>USERNAME</th>
                      <th>DESIGNATION</th>
                      <th>MOBILE</th>
                      <th>ROLE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u.id}>
                        <td>{idx + 1}</td>
                        <td>{u.name}</td>
                        <td>{u.username}</td>
                        <td>{u.designation || '-'}</td>
                        <td>{u.mobile || '-'}</td>
                        <td><span className={styles.pill}>{u.role?.toUpperCase()}</span></td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={() => handleEdit(u)}
                            style={{ padding: '4px 12px', fontSize: '0.8rem', marginRight: 6 }}
                          >EDIT</button>
                          <button
                            className={`${styles.btn} ${styles.btnDanger}`}
                            onClick={() => handleDelete(u.username)}
                            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                          >DELETE</button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center' }}>No users found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit User Modal */}
          {editUser && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
              <div style={{ background: '#fff', borderRadius: 12, minWidth: 360, maxWidth: 480, width: '90%', padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>EDIT USER — {editUser.username}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label className={styles.label}>NAME
                    <input className={styles.control} value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} />
                  </label>
                  <label className={styles.label}>DESIGNATION
                    <input className={styles.control} value={editUser.designation} onChange={(e) => setEditUser({ ...editUser, designation: e.target.value })} />
                  </label>
                  <label className={styles.label}>MOBILE NUMBER
                    <input className={styles.control} value={editUser.mobile} onChange={(e) => setEditUser({ ...editUser, mobile: e.target.value })} />
                  </label>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setEditUser(null)}>CANCEL</button>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleEditSave}>SAVE</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}

function AdminResetPasswordPage() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    if (newPassword.length < 4) {
      setStatus('New password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('Passwords do not match');
      return;
    }
    const confirmSubmit = window.confirm(`Reset password for user: ${username}?`);
    if (!confirmSubmit) return;

    try {
      const res = await fetch(`${apiBase()}/admin/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ username: username.trim().toLowerCase(), new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert('Password reset successfully');
      setUsername('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus('Password reset successfully');
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>ADMIN — RESET USER PASSWORD</div>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/admin/admin-dashboard')}>BACK</button>
          </div>
          <div className={styles.card}>
            <form onSubmit={onSubmit} className={styles.form}>
              <div className={styles.formGrid2}>
                <label className={styles.label}>USERNAME<input className={styles.control} value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="off" /></label>
                <label className={styles.label}>NEW PASSWORD<input className={styles.control} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" minLength={4} /></label>
                <label className={styles.label}>CONFIRM PASSWORD<input className={styles.control} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" minLength={4} /></label>
              </div>
              {status ? <div style={{ color: status.includes('success') ? 'green' : '#b91c1c', marginTop: 8 }}>{status}</div> : null}
              <div className={styles.pageActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">RESET PASSWORD</button>
              </div>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

function UserChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    if (newPassword.length < 4) {
      setStatus('New password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('Passwords do not match');
      return;
    }

    try {
      const res = await fetch(`${apiBase()}/user/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert('Password changed successfully. Please log in again.');
      clearAuthData();
      navigate('/login', { replace: true });
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>CHANGE PASSWORD</div>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate(-1)}>BACK</button>
          </div>
          <div className={styles.card}>
            <form onSubmit={onSubmit} className={styles.form}>
              <div className={styles.formGrid2}>
                <label className={styles.label}>CURRENT PASSWORD<input className={styles.control} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" /></label>
                <label className={styles.label}>NEW PASSWORD<input className={styles.control} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" minLength={4} /></label>
                <label className={styles.label}>CONFIRM NEW PASSWORD<input className={styles.control} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" minLength={4} /></label>
              </div>
              {status ? <div style={{ color: status.includes('success') ? 'green' : '#b91c1c', marginTop: 8 }}>{status}</div> : null}
              <div className={styles.pageActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">CHANGE PASSWORD</button>
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
  const MAX_ITEMS_PER_PASS = 20;
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
        yearOfMfg: '',
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
    if (items.length >= MAX_ITEMS_PER_PASS) {
      setStatus(`Maximum ${MAX_ITEMS_PER_PASS} items are allowed per pass.`);
      return;
    }
    setItems(prev => {
      const copy = [...prev];
      const src = prev[idx] || {};

      const newRow = {
        equipmentType: src.equipmentType || '',
        itemName: src.itemName || '',
        partNumber: src.partNumber || '',
        serialNumber: '',            // keep blank (or use src.serialNumber to copy)
        yearOfMfg: '',
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
      yearOfMfg: '',
      defectDetails: '',
      itemTypeOptions: [],
      itemNameOptions: [],
      partNoOptions: []
    }]);
  }

  const addItem = () => {
      if (items.length >= MAX_ITEMS_PER_PASS) {
        setStatus(`Maximum ${MAX_ITEMS_PER_PASS} items are allowed per pass.`);
        return;
      }
      setItems([
        ...items,
        {
          equipmentType: '',
          itemName: '',
          partNumber: '',
          serialNumber: '',
          yearOfMfg: '',
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

    if (items.length > MAX_ITEMS_PER_PASS) {
      alert(`Maximum ${MAX_ITEMS_PER_PASS} items are allowed per pass.`);
      return;
    }

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

    for (let i = 0; i < items.length; i++) {
      const yr = parseYearOfMfgInput(items[i]?.yearOfMfg ?? '');
      if (!yr.ok) {
        alert(`Item ${i + 1}: ${yr.msg}`);
        return;
      }
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
      const payload = {
        dateIn,
        customerName,
        customerUnitAddress,
        customerLocation,
        customerPhoneNo,
        projectName,
        passNo,
        items: items.map((row) => {
          const yr = parseYearOfMfgInput(row.yearOfMfg ?? '');
          return {
            ...row,
            yearOfMfg: yr.ok ? yr.value : null,
          };
        }),
      };
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
      <SectionNav section="complaints" />
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>ITEM IN</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/user/dashboard'); clearForm()}}>BACK</button>
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
            <table className={styles.table} style={{ minWidth: 1020 }}>
              <thead>
                <tr>
                  <th>SL NO</th><th>ITEM TYPE</th><th>ITEM NAME *</th><th>PART NO *</th><th>SERIAL NO *</th><th>YEAR OF MFG</th><th>DEFECT</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
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
                      <td><input className={styles.control} value={(it.serialNumber).toUpperCase()} onChange={(e) => updateItem(idx, 'serialNumber', e.target.value)} required /></td>
                      <td>
                        <input
                          className={styles.control}
                          type="text"
                          inputMode="numeric"
                          value={it.yearOfMfg ?? ''}
                          onChange={(e) => updateItem(idx, 'yearOfMfg', e.target.value)}
                          placeholder="2000–2100"
                        />
                        {String(it.yearOfMfg ?? '').trim() !== '' && !parseYearOfMfgInput(it.yearOfMfg).ok && (
                          <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '2px' }}>
                            {parseYearOfMfgInput(it.yearOfMfg).msg}
                          </div>
                        )}
                      </td>
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

function RFDPage() {
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
    if (!passNo || passNo.trim() === "") {
      alert("Please enter a Pass No");
      return;
    }
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

  const updateRfd = (idx, value) => {
    setRecord((prev) => {
      const newItems = prev.items.map((it, i) => {
        if (i === idx) {
          const updatedItem = { ...it, itemRfd: value };

          // Auto-set dateOut when itemRfd is checked and no dateRfd exists
          if (value === true && (!updatedItem.dateRfd || updatedItem.dateRfd === '')) {
            updatedItem.dateRfd = new Date().toISOString().slice(0, 10);
          }
          // Clear dateRfd when itemRfd is unchecked
          else if (value === false) {
            console.log(`Clearing dateRfd for item ${idx} since itemRfd is now false`);
            updatedItem.dateRfd = null;
          }
          return updatedItem;
        }
        return it;
      });
      console.log('New items array:', newItems);
      return { ...prev, items: newItems };
    });
  };

  const updateDateRfd = (idx, value) => {
    console.log(`Updating dateRfd for item ${idx} to:`, value);
    setRecord((prev) => {
      const newItems = prev.items.map((it, i) => {
        if (i === idx) {
          console.log(`Item ${idx} before update:`, it);
          const updatedItem = { ...it, dateRfd: value };
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

    // Validate that all items marked as "rfd" have a date
    const itemsWithoutDate = record.items.filter(item => item.itemRfd && (!item.dateRfd || item.dateRfd === ''));
    if (itemsWithoutDate.length > 0) {
      alert('Please set a date for all items marked as "RFD"');
      return;
    }

    // Validate that all items marked as "rfd" have rectification details
    const itemsWithoutDetails = record.items.filter(item => item.itemRfd && (!item.itemRectificationDetails || item.itemRectificationDetails.trim() === ''));
    if (itemsWithoutDetails.length > 0) {
      alert('Please enter rectification details for all items marked as "RFD"');
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
        itemRfd: !!it.itemRfd, 
        dateRfd: it.dateRfd || null, 
        itemRectificationDetails: it.itemRectificationDetails || '',
        itemFeedback1Details: it.itemFeedback1Details || '',
        itemFeedback2Details: it.itemFeedback2Details || ''
      }));

      console.log('=== RFD SUBMISSION DEBUG ===');
      console.log('Pass Number:', record.passNo);
      console.log('Original record items:', record.items);
      console.log('Submitting updates:', updates);
      console.log('Request URL:', `${apiBase()}/items/rfd/${encodeURIComponent(record.passNo)}`);
      console.log('Request payload:', JSON.stringify({ items: updates }, null, 2));

      const res = await fetch(`${apiBase()}/items/rfd/${encodeURIComponent(record.passNo)}`, {
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
      console.error('Error in ItemRFD submission:', err);
      alert(`Error: ${err.message}`);
      setStatus(`Error: ${err.message}`);
    }
  };

  return(
    <div className={`${styles.page} ${styles.pageScroll}`}>
      <SectionNav section="complaints" />
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>RFD</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/user/dashboard'); clearForm()}}>BACK</button>
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
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); fetchRecord(); }
                }}
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
        <div className={`${styles.cardItemOut} ${styles.mt12}`}>
          <div className={styles.formGrid3}>
            <div><b>PRIVATE PASS NO:</b> {record.passNo}</div>
            <div><b>DATE IN:</b> {record.dateIn}</div>
            <div><b>CUSTOMER:</b> {record.customer?.name}</div>
            <div><b>PROJECT:</b> {record.projectName || ''}</div>
            <div><b>PHONE:</b> {record.customer?.phone}</div>
            <div><b>UNIT ADDRESS:</b> {record.customer?.unitAddress}</div>
            <div><b>LOCATION:</b> {record.customer?.location}</div>
          </div>
          <div className={`${styles.tableWrap} ${styles.tableWrapScroll}`}>
            <table className={`${styles.table} ${styles.tableMin900}`}>
              <thead>
                <tr>
                  <th>SL NO</th><th>TYPE</th><th>NAME</th><th>PART NO</th><th>SERIAL NO</th><th>YEAR OF MFG</th><th>DEFECT</th><th>RFD</th><th>RFD DATE</th><th>RECTIFICATION DETAILS</th><th>Dispatch Details</th><th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {record.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>{it.equipmentType}</td>
                    <td>{it.itemName}</td>
                    <td>{it.partNumber}</td>
                    <td>{it.serialNumber}</td>
                    <td>{it.yearOfMfg !== undefined && it.yearOfMfg !== null && it.yearOfMfg !== '' ? it.yearOfMfg : '—'}</td>
                    <td>{it.defectDetails}</td>
                    {/* <td><input type="checkbox" checked={!!it.itemIn} readOnly /></td> */}
                    <td><input type="checkbox" checked={!!it.itemRfd} disabled={it.itemOut === true} onChange={(e) => updateRfd(idx, e.target.checked)} /></td>
                    <td>
                      <input 
                        type="date" 
                        className={styles.control} 
                        value={it.dateRfd || ''} 
                        onChange={(e) => updateDateRfd(idx, e.target.value)}
                        placeholder="SELECT DATE"
                      />
                      {!it.dateRfd && <div className={styles.hintNoDate}>NO DATE SET</div>}
                      {it.itemRfd && !it.dateRfd && <div className={styles.hintRequiredDate}>⚠️ DATE REQUIRED FOR RFD</div>}
                    </td>
                    <td>
                      <textarea
                        className={styles.control}
                        value={it.itemRectificationDetails || ""}
                        onChange={(e) => updateRectificationDetails(idx, e.target.value)}
                        required={it.itemRfd}
                        rows={1} // looks like an input initially
                      />
                      {it.itemRfd &&
                        (!it.itemRectificationDetails ||
                          it.itemRectificationDetails.trim() === "") && (
                          <div className={styles.hintRequiredRectification}>⚠️ Rectification details required for RFD</div>
                        )}
                    </td>
                    <td>
                      <textarea
                        className={styles.control}
                        value={it.itemFeedback2Details || ""}
                        onChange={(e) => updateFeedback2Details(idx, e.target.value)}
                        rows={1} // looks like an input initially
                      />
                    </td>
                    <td>
                      <textarea
                        className={styles.control}
                        value={it.itemFeedback1Details || ""}
                        onChange={(e) => updateFeedback1Details(idx, e.target.value)}
                        rows={1} // looks like an input initially
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`${styles.pageActions} ${styles.pageActionsMt12}`}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSubmit}>Save</button>
          </div>
        </div>
      ) : null}
      {status ? <div className={`${styles.card} ${styles.statusCard}`}>{status}</div> : null}
    </div>
  );
}

function ItemOutPage() {
  const [passNo, setPassNo] = useState('');
  const [record, setRecord] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [originalRecord, setOriginalRecord] = useState(null); // Store original DB state to check what was already saved

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
    setOriginalRecord(null);
    setStatus('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const fetchRecord = async () => {
    if (!passNo || passNo.trim() === "") {
      alert("Please enter a Pass No");
      return;
    }
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
      const dataCopy = JSON.parse(JSON.stringify(data));
      setRecord(data);
      setOriginalRecord(dataCopy);
    } catch (err) {
      console.error('Error fetching record:', err);
      setRecord(null);
      setOriginalRecord(null);
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
            updatedItem.dispatchThrough = '';
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

  const updateDispatchThrough = (idx, value) => {
    setRecord((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === idx ? { ...it, dispatchThrough: value } : it
      ),
    }));
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

    const itemsWithoutDispatchThrough = record.items.filter((item, idx) => {
      const alreadyOutInDb = originalRecord?.items?.[idx]?.itemOut === true;
      return item.itemOut && !alreadyOutInDb && (!item.dispatchThrough || item.dispatchThrough.trim() === '');
    });
    if (itemsWithoutDispatchThrough.length > 0) {
      alert('Please select Dispatch Through for all items marked as "Item Out"');
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
        dispatchThrough: it.dispatchThrough || '',
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
      
      // Fetch the updated record from DB to update originalRecord with the saved state
      try {
        const refetchRes = await fetch(`${apiBase()}/items/${encodeURIComponent(record.passNo)}`, { headers: { ...authHeaders() } });
        if (refetchRes.ok) {
          const refetchedData = await refetchRes.json();
          console.log('Refetched data after save:', refetchedData);
          const refetchedCopy = JSON.parse(JSON.stringify(refetchedData));
          setRecord(refetchedData);
          setOriginalRecord(refetchedCopy); // Set originalRecord to the new DB state - this disables checkboxes
          console.log('Updated originalRecord:', refetchedCopy);
        } else {
          console.warn('Refetch failed with status:', refetchRes.status);
        }
      } catch (err) {
        console.error('Error refetching record after save:', err);
      }
      
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
    <div className={`${styles.page} ${styles.pageScroll}`}>
      <SectionNav section="complaints" />
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>ITEM OUT</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/user/dashboard'); clearForm()}}>BACK</button>
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
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); fetchRecord(); }
                }}
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
        <div className={`${styles.cardItemOut} ${styles.mt12}`}>
          <div className={styles.formGrid3}>
            <div><b>PRIVATE PASS NO:</b> {record.passNo}</div>
            <div><b>DATE IN:</b> {record.dateIn}</div>
            <div><b>CUSTOMER:</b> {record.customer?.name}</div>
            <div><b>PROJECT:</b> {record.projectName || ''}</div>
            <div><b>PHONE:</b> {record.customer?.phone}</div>
            <div><b>UNIT ADDRESS:</b> {record.customer?.unitAddress}</div>
            <div><b>LOCATION:</b> {record.customer?.location}</div>
          </div>
          <div className={`${styles.tableWrap} ${styles.tableWrapScroll}`}>
            <table className={`${styles.table} ${styles.tableMin900}`}>
              <thead>
                <tr>
                  <th>SL NO</th><th>TYPE</th><th>NAME</th><th>PART NO</th><th>SERIAL NO</th><th>YEAR OF MFG</th><th>DEFECT</th><th>RECTIFICATION DETAILS</th><th>ITEMOUT</th><th>DATE OUT</th><th>DISPATCH THROUGH</th><th>Dispatch Details</th><th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {record.items?.map((it, idx) => {
                  const rowDisabled = !it.itemRfd;
                  // Disable only if it was ALREADY itemOut=true in the ORIGINAL DB state (before user edits)
                  const itemOutLocked = originalRecord?.items?.[idx]?.itemOut === true;
                  return (
                    <tr key={idx} className={rowDisabled ? styles.rowDisabled : ''}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td>{it.equipmentType}</td>
                      <td>{it.itemName}</td>
                      <td>{it.partNumber}</td>
                      <td>{it.serialNumber}</td>
                      <td>{it.yearOfMfg !== undefined && it.yearOfMfg !== null && it.yearOfMfg !== '' ? it.yearOfMfg : '—'}</td>
                      <td>{it.defectDetails}</td>
                      <td>{it.itemRectificationDetails || "-"}</td>
                      {/* <td><input type="checkbox" checked={!!it.itemIn} readOnly /></td> */}
                      <td><input type="checkbox" checked={!!it.itemOut} disabled={itemOutLocked} onChange={(e) => updateItemOut(idx, e.target.checked)} /></td>
                      <td>
                        <input 
                          type="date" 
                          className={styles.control} 
                          value={it.dateOut || ''} 
                          onChange={(e) => updateDateOut(idx, e.target.value)}
                          placeholder="SELECT DATE"
                        />
                        {!it.dateOut && <div className={styles.hintNoDate}>NO DATE SET</div>}
                        {it.itemOut && !it.dateOut && <div className={styles.hintRequiredDate}>⚠️ DATE REQUIRED FOR ITEM OUT</div>}
                      </td>
                      <td>
                        <select
                          className={styles.control}
                          value={itemOutLocked ? '' : (it.dispatchThrough || '')}
                          onChange={(e) => updateDispatchThrough(idx, e.target.value)}
                          disabled={itemOutLocked}
                        >
                          <option value="">SELECT</option>
                          <option value="Direct Collection">Direct Collection</option>
                          <option value="Through Shipping">Through Shipping</option>
                        </select>
                        {it.itemOut && !itemOutLocked && !it.dispatchThrough && <div className={styles.hintRequiredDate}>⚠️ DISPATCH THROUGH REQUIRED FOR ITEM OUT</div>}
                      </td>
                      <td>
                        <textarea
                          className={styles.control}
                          value={it.itemFeedback2Details || ""}
                          onChange={(e) => updateFeedback2Details(idx, e.target.value)}
                          rows={1} // looks like an input initially
                        />
                      </td>
                      <td>
                        <textarea
                          className={styles.control}
                          value={it.itemFeedback1Details || ""}
                          onChange={(e) => updateFeedback1Details(idx, e.target.value)}
                          rows={1} // looks like an input initially
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={`${styles.pageActions} ${styles.pageActionsMt12}`}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSubmit}>Save</button>
          </div>
        </div>
      ) : null}
      {status ? <div className={`${styles.card} ${styles.statusCard}`}>{status}</div> : null}
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
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/admin/admin-dashboard'); clearForm()}}>BACK</button>
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
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/admin/manage-projects'); clearForm()}}>BACK</button>
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
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/admin/manage-projects'); clearForm()}}>BACK</button>
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
        '"' + String(proj).replace(/\r\n|\r|\n/g, ' ').replace(/"/g, '""') + '"'
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
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setMode('')}>BACK</button>
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
  const [fDispatchThrough, setFDispatchThrough] = useState('All');
  const [value, setValue] = useState('');
  const [projectPartNo, setProjectPartNo] = useState('');
  const [partNoSuggestions, setPartNoSuggestions] = useState([]);
  const [showPartNoSuggestions, setShowPartNoSuggestions] = useState(false);
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
  const partNoSuggestionRef = useRef(null);
  const [projectValue, setProjectValue] = useState('');
  // const {MultiSelectAutocomplete} = formElements;

  const allReportColumns = React.useMemo(() => ([
    { id: 'slNo', label: 'SL NO.' },
    { id: 'passNo', label: 'PASS NO' },
    { id: 'projectName', label: 'PROJECT NAME' },
    { id: 'customerName', label: 'CUSTOMER NAME' },
    { id: 'customerUnitAddress', label: 'CUSTOMER UNIT ADDRESS' },
    { id: 'customerLocation', label: 'CUSTOMER LOCATION' },
    { id: 'customerPhone', label: 'CUSTOMER PHONE' },
    { id: 'equipmentType', label: 'EQUIPMENT TYPE' },
    { id: 'itemName', label: 'ITEM NAME' },
    { id: 'partNumber', label: 'PART NUMBER' },
    { id: 'serialNumber', label: 'SERIAL NUMBER' },
    { id: 'yearOfMfg', label: 'YEAR OF MFG' },
    { id: 'defectDetails', label: 'DEFECT DETAILS' },
    { id: 'status', label: 'STATUS' },
    { id: 'dateIn', label: 'DATE IN' },
    { id: 'dateRfd', label: 'DATE RFD' },
    { id: 'dateOut', label: 'DATE OUT' },
    { id: 'dispatchThrough', label: 'DISPATCH THROUGH' },
    { id: 'rectificationDetails', label: 'RECTIFICATION DETAILS' },
    { id: 'remarks2', label: 'Dispatch Details' },
    { id: 'remarks1', label: 'REMARKS' },
    { id: 'createdBy', label: 'CREATED BY' },
    { id: 'updatedBy', label: 'UPDATED BY' }
  ]), []);

  const defaultSelectedReportColumns = React.useMemo(() => ([
    'slNo',
    'passNo',
    'customerUnitAddress',
    'customerLocation',
    'itemName',
    'partNumber',
    'serialNumber',
    'yearOfMfg',
    'status',
    'dateIn',
    'dateRfd',
    'dateOut',
    'dispatchThrough',
    'rectificationDetails',
    'remarks2',
    'remarks1'
  ]), []);

  const [selectedReportColumns, setSelectedReportColumns] = useState(defaultSelectedReportColumns);

  const selectedColumnSet = React.useMemo(
    () => new Set(selectedReportColumns),
    [selectedReportColumns]
  );

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return dateStr || '';
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return dateStr;
    const [, yyyy, mm, dd] = m;
    return `${dd}-${mm}-${yyyy}`;
  };

  const [hasViewedReport, setHasViewedReport] = useState(false);
  // colId -> array of allowed string values. Missing key means "all values".
  const [columnFilterAllowedValues, setColumnFilterAllowedValues] = useState({});
  // Draft values while dropdown is open. Applied only on OK.
  const [columnFilterDraftValues, setColumnFilterDraftValues] = useState({});
  const [openColumnFilterColId, setOpenColumnFilterColId] = useState(null);
  const [filterPopoverPos, setFilterPopoverPos] = useState(null);
  const filterPopoverRef = useRef(null);

  const selectedColumnsForRender = React.useMemo(
    () => allReportColumns.filter((c) => selectedColumnSet.has(c.id)),
    [allReportColumns, selectedColumnSet]
  );

  const columnFilterAllowedSets = React.useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(columnFilterAllowedValues)) {
      if (!Array.isArray(v)) continue;
      out[k] = new Set(v.map((x) => String(x ?? '')));
    }
    return out;
  }, [columnFilterAllowedValues]);

  const getUniqueFilterValues = (targetColId) => {
    if (!targetColId) return [];
    const rowsForUniques = allReportRows.filter((r) => {
      for (const [colId, allowedSet] of Object.entries(columnFilterAllowedSets)) {
        if (colId === targetColId) continue;
        if (!allowedSet.has(String(r[colId] ?? ''))) return false;
      }
      return true;
    });
    const uniqueSet = new Set();
    rowsForUniques.forEach((r) => uniqueSet.add(String(r[targetColId] ?? '')));
    const arr = Array.from(uniqueSet);
    arr.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return arr;
  };

  const openColumnFilter = (colId, anchorEvent) => {
    const uniqueVals = getUniqueFilterValues(colId);
    const appliedVals = columnFilterAllowedValues[colId];
    const initialDraft = Array.isArray(appliedVals)
      ? uniqueVals.filter((v) => new Set(appliedVals.map((x) => String(x ?? ''))).has(String(v ?? '')))
      : uniqueVals;
    setColumnFilterDraftValues((prev) => ({ ...prev, [colId]: initialDraft }));
    if (anchorEvent?.currentTarget) {
      const r = anchorEvent.currentTarget.getBoundingClientRect();
      const w = 280;
      const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
      const pad = 12;
      const maxDesired = 420;
      const minPreferred = 200;
      const belowTop = r.bottom + 6;
      const spaceBelow = window.innerHeight - belowTop - pad;
      const spaceAbove = r.top - pad;
      let top;
      let maxH;
      if (spaceBelow >= minPreferred || spaceBelow >= spaceAbove) {
        top = belowTop;
        maxH = Math.min(maxDesired, Math.max(160, spaceBelow));
      } else {
        maxH = Math.min(maxDesired, Math.max(160, spaceAbove));
        top = Math.max(pad, r.top - maxH - 6);
      }
      setFilterPopoverPos({ top, left, width: w, maxHeight: maxH });
    } else {
      setFilterPopoverPos(null);
    }
    setOpenColumnFilterColId(colId);
  };

  const cancelColumnFilter = (colId) => {
    if (!colId) return;
    setColumnFilterDraftValues((prev) => {
      const next = { ...prev };
      delete next[colId];
      return next;
    });
    setOpenColumnFilterColId(null);
    setFilterPopoverPos(null);
  };

  const applyColumnFilter = (colId) => {
    if (!colId) return;
    const uniqueVals = getUniqueFilterValues(colId);
    const draftVals = Array.isArray(columnFilterDraftValues[colId]) ? columnFilterDraftValues[colId] : uniqueVals;
    const draftSet = new Set(draftVals.map((x) => String(x ?? '')));
    const normalizedDraft = uniqueVals.filter((v) => draftSet.has(String(v ?? '')));

    setColumnFilterAllowedValues((prev) => {
      if (normalizedDraft.length === uniqueVals.length) {
        const { [colId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [colId]: normalizedDraft };
    });
    cancelColumnFilter(colId);
  };

  // Remove filters for columns that are no longer selected for display.
  useEffect(() => {
    setColumnFilterAllowedValues((prev) => {
      const next = {};
      for (const [k, v] of Object.entries(prev || {})) {
        if (selectedColumnSet.has(k)) next[k] = v;
      }
      return next;
    });
    setColumnFilterDraftValues((prev) => {
      const next = {};
      for (const [k, v] of Object.entries(prev || {})) {
        if (selectedColumnSet.has(k)) next[k] = v;
      }
      return next;
    });
    setOpenColumnFilterColId(null);
    setFilterPopoverPos(null);
  }, [selectedReportColumns]); // eslint-disable-line react-hooks/exhaustive-deps

  const allReportRows = React.useMemo(() => {
    if (!result || !result.data || result.data.length === 0) return [];
    const rows = [];
    result.data.forEach((doc, docIndex) => {
      const items = doc.items || [];
      items.forEach((item, itemIndex) => {
        // Determine status: OUT if itemIn+itemOut are true, else RFD if itemIn+itemRfd and not itemOut, else IN
        const status =
          item.itemIn && item.itemOut
            ? "OUT"
            : item.itemIn && item.itemRfd && !item.itemOut
              ? "RFD"
              : "IN";

        // Format phone number properly
        const phone = doc.customer?.phone || "";
        const formattedPhone = phone && !isNaN(phone) ? String(phone) : phone;

        // Format dates for UI (and for filtering/export)
        const dateInFmt = formatDateDDMMYYYY(doc.dateIn || "");
        const dateRfdFmt = formatDateDDMMYYYY(item.dateRfd || "");
        const dateOutFmt = formatDateDDMMYYYY(item.dateOut || "");

        rows.push({
          rowKey: `${docIndex}-${itemIndex}`,
          slNo: String(item.serialNo || ""),
          passNo: String(doc.passNo || ""),
          projectName: String(doc.projectName || ""),
          customerName: String(doc.customer?.name || ""),
          customerUnitAddress: String(doc.customer?.unitAddress || ""),
          customerLocation: String(doc.customer?.location || ""),
          customerPhone: String(formattedPhone || ""),
          yearOfMfg: (() => {
            const y = item.yearOfMfg ?? doc.yearOfMfg;
            return y !== undefined && y !== null && y !== '' ? String(y) : '';
          })(),
          equipmentType: String(item.equipmentType || ""),
          itemName: String(item.itemName || ""),
          partNumber: String(item.partNumber || ""),
          serialNumber: String(item.serialNumber || ""),
          defectDetails: String(item.defectDetails || ""),
          status: String(status || ""),
          dateIn: String(dateInFmt || ""),
          dateRfd: String(dateRfdFmt || ""),
          dateOut: String(dateOutFmt || ""),
          dispatchThrough: String(item.dispatchThrough || ""),
          rectificationDetails: String(item.itemRectificationDetails || ""),
          remarks2: String(item.itemFeedback2Details || ""),
          remarks1: String(item.itemFeedback1Details || ""),
          createdBy: String(doc.createdBy || ""),
          updatedBy: String(doc.updatedBy || "")
        });
      });
    });
    return rows;
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleRows = React.useMemo(() => {
    let rows = allReportRows;
    for (const [colId, allowedSet] of Object.entries(columnFilterAllowedSets)) {
      if (!selectedColumnSet.has(colId)) continue; // hidden columns should not affect display
      rows = rows.filter((r) => allowedSet.has(String(r[colId] ?? '')));
      // Small optimization: early exit if everything is filtered out
      if (rows.length === 0) return [];
    }
    return rows;
  }, [allReportRows, columnFilterAllowedSets, selectedColumnSet]);

  useEffect(() => {
    if (!openColumnFilterColId) return;
    const onMouseDown = (e) => {
      if (!filterPopoverRef.current) return;
      // BACK when clicking outside the open popover.
      if (!filterPopoverRef.current.contains(e.target)) cancelColumnFilter(openColumnFilterColId);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openColumnFilterColId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!openColumnFilterColId) return;
    const onScroll = (e) => {
      const t = e.target;
      const pop = filterPopoverRef.current;
      if (!(t instanceof Element) || !pop) {
        cancelColumnFilter(openColumnFilterColId);
        return;
      }
      if (t === pop || pop.contains(t)) return;
      cancelColumnFilter(openColumnFilterColId);
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [openColumnFilterColId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleReportColumn = (colId) => {
    setSelectedReportColumns((prev) => {
      const set = new Set(prev);
      if (set.has(colId)) set.delete(colId);
      else set.add(colId);
      // Avoid empty table/header; keep at least one column.
      if (set.size === 0) return prev;
      return Array.from(set);
    });
  };

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
    function handleClickOutsidePartNo(e) {
      if (partNoSuggestionRef.current && !partNoSuggestionRef.current.contains(e.target)) {
        setShowPartNoSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsidePartNo);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsidePartNo);
    };
  }, []);

  useEffect(() => {
    console.log("selectionMode changed:", selectionMode);
    if (selectionMode){
      setSelectionMode(false);
      return;
    }

    if (type === 'DateRange') {
      setSuggestions([]);
      return;
    }

    const digitsOnly = (value || '').toString().replace(/\D/g, '');
    const shouldFetch =
      type === 'PhoneNumber' ? digitsOnly.length >= 3 : (value || '').length >= 2;

    if (shouldFetch) {
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

  useEffect(() => {
    if (type !== 'ProjectName') {
      setProjectPartNo('');
      setPartNoSuggestions([]);
      setShowPartNoSuggestions(false);
      return;
    }

    if ((projectPartNo || '').length < 2) {
      setPartNoSuggestions([]);
      return;
    }

    const fetchPartNoSuggestions = async () => {
      try {
        const params = new URLSearchParams();
        params.set('type', 'ItemPartNo');
        params.set('value', projectPartNo);
        const res = await fetch(`${apiBase()}/search/suggestions?${params.toString()}`, { headers: { ...authHeaders() } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch suggestions');
        setPartNoSuggestions(data.suggestions || []);
      } catch (err) {
        console.error('Error fetching part no suggestions:', err);
        setPartNoSuggestions([]);
      }
    };

    fetchPartNoSuggestions();
  }, [projectPartNo, type]);

  const clearForm = () => {
    setType('passNo');
    setValue('');
    setProjectPartNo('');
    setFrom('');
    setTo('');
    setResult(null);
    setStatus('');
    setFStatus('All');
    setFDispatchThrough('All');
    setHasViewedReport(false);
    setColumnFilterAllowedValues({});
    setColumnFilterDraftValues({});
    setOpenColumnFilterColId(null);
    setFilterPopoverPos(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setPartNoSuggestions([]);
    setShowPartNoSuggestions(false);
    setProjectValue('');
  };

  const clearOnChange = () =>{
    setValue('');
    setProjectPartNo('');
    setFrom('');
    setTo('');
    setFStatus('All');
    setFDispatchThrough('All');
    setProjectValue('');
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
      if (type === 'serialNumber' && value.length < 3) {
        setStatus('Please enter at least 3 characters for Serial Number search');
        return;
      }
      if (type === 'serialNumber') params.set('serialProjectName', projectValue);
      if (type !== 'DateRange' && value) params.set('value', value);
      if (type === 'ProjectName' && projectPartNo.trim()) params.set('partNo', projectPartNo.trim());
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('status',fstatus);
      params.set('dispatchThrough', fDispatchThrough);
      const res = await fetch(`${apiBase()}/search?${params.toString()}`, { headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setResult(data);
      setHasViewedReport(true);
      setColumnFilterAllowedValues({});
      setColumnFilterDraftValues({});
      setOpenColumnFilterColId(null);
      setFilterPopoverPos(null);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const download = async () => {
    if (!hasViewedReport) {
      setStatus('Please view the report first (then download).');
      return;
    }
    try {
      const headerLabels = selectedColumnsForRender.map((c) => c.label);
      const columnIds = selectedColumnsForRender.map((c) => c.id);

      const escapeCsv = (val) => {
        const s = String(val ?? '').replace(/\r\n|\r|\n/g, ' ');
        if (s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
        if (s.includes(',')) return `"${s}"`;
        return s;
      };

      const lines = [];
      lines.push(headerLabels.map(escapeCsv).join(','));
      visibleRows.forEach((row, rowIdx) => {
        lines.push(columnIds.map((cid) => escapeCsv(cid === 'slNo' ? String(rowIdx + 1) : row[cid])).join(','));
      });

      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const kolkataNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const pad2 = (n) => String(n).padStart(2, '0');
      const dd = pad2(kolkataNow.getDate());
      const mm = pad2(kolkataNow.getMonth() + 1);
      const yyyy = kolkataNow.getFullYear();
      const HH = pad2(kolkataNow.getHours());
      const MI = pad2(kolkataNow.getMinutes());
      const SS = pad2(kolkataNow.getSeconds());
      const defaultName = `report_${dd}-${mm}-${yyyy}_${HH}-${MI}-${SS}.csv`;

      a.download = defaultName;
      a.click();
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
    const leftAligned = new Set(['rectificationDetails', 'remarks1', 'remarks2']);

    const uniqueValuesForOpenColumn = (() => {
      if (!openColumnFilterColId) return [];
      return getUniqueFilterValues(openColumnFilterColId);
    })();

    const openColDraftArr = openColumnFilterColId
      ? columnFilterDraftValues[openColumnFilterColId]
      : undefined;

    const openColDraftSet = openColDraftArr
      ? new Set(openColDraftArr.map((x) => String(x ?? '')))
      : new Set(uniqueValuesForOpenColumn.map((x) => String(x ?? '')));

    const isAllSelectedForOpenColumn = openColumnFilterColId
      ? uniqueValuesForOpenColumn.every((v) => openColDraftSet.has(String(v ?? '')))
      : true;

    return (
      <div className={styles.card} style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <h3>SEARCH RESULTS ({result.count} ENTRIES FOUND)</h3>
        </div>
        <div className={styles.tableWrap} style={{ overflowX: 'auto', maxHeight: 450, overflowY: 'auto', minHeight: 220 }}>
          <table
            className={styles.table}
            style={{ minWidth: selectedColumnsForRender.length <= defaultSelectedReportColumns.length ? '1200px' : '1400px' }}
          >
            <thead>
              <tr>
                {selectedColumnsForRender.map((c) => (
                  <th key={c.id} style={{ position: 'sticky', top: 0, zIndex: 4, background: '#fff', boxShadow: '0 1px 0 #e5e7eb' }}>
                    <div className={styles.reportTh}>
                      <span>{c.label}</span>
                      {c.id !== 'slNo' ? (
                        <button
                          type="button"
                          title="Filter column"
                          aria-label={`Filter ${c.label}`}
                          className={styles.columnFilterIconBtn}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openColumnFilterColId === c.id) {
                              cancelColumnFilter(c.id);
                            } else {
                              openColumnFilter(c.id, e);
                            }
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                            <path fill="currentColor" d="M2.5 4.5h7L6 8z" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, rowIdx) => (
                <tr key={row.rowKey}>
                  {selectedColumnsForRender.map((col) => (
                    <td
                      key={col.id}
                      style={leftAligned.has(col.id) ? { textAlign: 'left' } : undefined}
                    >
                      {col.id === 'slNo' ? String(rowIdx + 1) : (row[col.id] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {openColumnFilterColId && filterPopoverPos
          ? createPortal(
              <div
                ref={filterPopoverRef}
                role="dialog"
                aria-modal="true"
                onWheel={(e) => e.stopPropagation()}
                style={{
                  position: 'fixed',
                  top: filterPopoverPos.top,
                  left: filterPopoverPos.left,
                  width: filterPopoverPos.width || 280,
                  maxHeight: filterPopoverPos.maxHeight ?? 420,
                  zIndex: 2147483000,
                  boxSizing: 'border-box',
                }}
                className={styles.columnFilterPopoverPortal}
              >
                <div className={styles.columnFilterPopoverTitle}>
                  Filter {allReportColumns.find((x) => x.id === openColumnFilterColId)?.label || ''}
                </div>
                <div className={styles.columnFilterPopoverScroll}>
                  <div className={styles.columnFilterValueList}>
                    <label className={styles.columnFilterValueItem}>
                      <input
                        type="checkbox"
                        checked={isAllSelectedForOpenColumn}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setColumnFilterDraftValues((prev) => ({
                            ...prev,
                            [openColumnFilterColId]: checked ? [...uniqueValuesForOpenColumn] : [],
                          }));
                        }}
                      />
                      <span>Select All</span>
                    </label>
                    {uniqueValuesForOpenColumn.length === 0 ? (
                      <div className={styles.columnFilterEmpty}>No values</div>
                    ) : (
                      uniqueValuesForOpenColumn.map((val) => {
                        const valueStr = String(val ?? '');
                        const displayVal = valueStr === '' ? '(Blank)' : valueStr;
                        const checked = openColDraftSet.has(valueStr);
                        return (
                          <label key={valueStr} className={styles.columnFilterValueItem}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const nextChecked = e.target.checked;
                                setColumnFilterDraftValues((prev) => {
                                  const baseSet = new Set(
                                    (prev?.[openColumnFilterColId] || uniqueValuesForOpenColumn).map((x) => String(x ?? ''))
                                  );
                                  if (nextChecked) baseSet.add(valueStr);
                                  else baseSet.delete(valueStr);
                                  return { ...prev, [openColumnFilterColId]: Array.from(baseSet) };
                                });
                              }}
                            />
                            <span title={displayVal}>{displayVal}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className={styles.columnFilterPopoverFooter}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => applyColumnFilter(openColumnFilterColId)}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={() => cancelColumnFilter(openColumnFilterColId)}
                  >
                    Cancel
                  </button>
                </div>
              </div>,
              document.body
            )
          : null}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <SectionNav section="complaints" />
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>REPORT</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/user/dashboard'); clearForm()}}>BACK</button>
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
              <option value="PhoneNumber">PHONE NUMBER</option>
              <option value="DateRange">DATE RANGE</option>
              <option value="serialNumber">SERIAL NUMBER</option>
            </select>
          </label>
          {type === 'DateRange' ? null : (

            <label className={styles.label}>
              {type === 'passNo' ? 'PRIVATE PASS NO' : type === 'ItemPartNo' ? 'PART NO' : type === 'PhoneNumber' ? 'PHONE NUMBER' : type === 'serialNumber' ? 'SERIAL NUMBER' : 'PROJECT NAME'}
              {type === 'ProjectName' ?
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select
                    className={styles.control}
                    value={value}
                    onChange={(e) => {setValue(e.target.value)}}
                    onFocus={fetchProjects} required
                  >
                    <option value="">SELECT PROJECT</option>
                    {projectOptions.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
                  </select>
                  <div className={styles.relativeContainer} ref={partNoSuggestionRef}>
                    <input
                      className={styles.control}
                      value={projectPartNo}
                      placeholder="OPTIONAL PART NO"
                      onFocus={() => setShowPartNoSuggestions(true)}
                      onChange={(e) => setProjectPartNo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          runSearch();
                        }
                      }}
                    />
                    {showPartNoSuggestions && partNoSuggestions.length > 0 && (
                      <ul className={styles.suggestionsList}>
                        {partNoSuggestions.map((s, i) => (
                          <li key={i} onClick={() => { setProjectPartNo(s); setShowPartNoSuggestions(false); }}>
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                :
                <div className={styles.relativeContainer} ref={suggestionRef}>
                  <input
                    className={styles.control}
                    value={value}
                    onFocus={() => setShowSuggestions(true)} // expand again when input is focused
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        runSearch();
                      }
                    }}
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
              <option value = "RFD">RFD</option>
            </select>
          </label>
          <label className={styles.label}>DISPATCH THROUGH
            <select
              className={styles.control}
              value={fDispatchThrough}
              onChange={(e) => setFDispatchThrough(e.target.value)}
            >
              <option value="All">ALL</option>
              <option value="Direct Collection">Direct Collection</option>
              <option value="Through Shipping">Through Shipping</option>
            </select>
          </label>
          {type === 'serialNumber' && (
            <label className={styles.label}>PROJECT NAME
              <select
                className={styles.control}
                value={projectValue}
                onChange={(e) => setProjectValue(e.target.value)}
                onFocus={fetchProjects}
                required
              >
                <option value="">SELECT PROJECT</option>
                {projectOptions.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            </label>
          )}
          {type != 'passNo' && type != 'serialNumber' && (
            <div className={styles.formGrid2}>
              <label className={styles.label}>From
                <input
                  className={styles.control}
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      runSearch();
                    }
                  }}
                />
              </label>
              <label className={styles.label}>To
                <input
                  className={styles.control}
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      runSearch();
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>
        <div className={styles.columnSelectWrap}>
          <div className={styles.columnSelectTitle}>Select Columns</div>
          <div className={styles.columnSelectGrid}>
            {allReportColumns.map((c) => (
              <label key={c.id} className={styles.columnSelectItem}>
                <input
                  type="checkbox"
                  checked={selectedColumnSet.has(c.id)}
                  onChange={() => toggleReportColumn(c.id)}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={runSearch}>VIEW ALL RECORDS</button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={download}
            disabled={!hasViewedReport}
            title={!hasViewedReport ? 'View the report first to enable download' : 'Download the currently visible (filtered) data'}
          >
            DOWNLOAD REPORT
          </button>
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
          <span>{hasViewedReport ? 'No records found' : 'No records loaded yet'}</span>
        </div>
      )}
    </div>
  );
}

function EditPage() {
  const MAX_ITEMS_PER_PASS = 20;
  const [passNo, setPassNo] = useState('');
  const [doc, setDoc] = useState({
    passNo: "",
    projectName: "",
    dateIn: "",
    yearOfMfg: "",
    customer: { name: "", phone: "", unitAddress: "", location: "" },
    items: []
  });
  const [prevData, setPrevData] = useState({
    passNo: "",
    projectName: "",
    dateIn: "",
    yearOfMfg: "",
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
      yearOfMfg: '',
      defectDetails: '',
      itemTypeOptions: [],
      itemNameOptions: [],
      partNoOptions: [],
      itemIn: src.itemIn ?? true,
      itemOut: false,
      itemRfd: false,
      dateOut: null,
      dispatchThrough: '',
      dateRfd: null
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
      yearOfMfg: "",
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
        yearOfMfg: "",
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
            updatedItem.dispatchThrough = '';
          }

          // Auto-set dateRfd when itemRfd is checked and no dateRfd exists
          if (key === 'itemRfd' && value === true && (!updatedItem.dateRfd || updatedItem.dateRfd === '')) {
            updatedItem.dateRfd = new Date().toISOString().slice(0, 10);
          }
          // Clear dateRfd when itemRfd is unchecked
          else if (key === 'itemRfd' && value === false) {
            console.log(`Clearing dateRfd for item ${idx} since itemRfd is now false`);
            updatedItem.dateRfd = null;
          }
          
          return updatedItem;
        }
        return it;
      });
      
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    if ((doc?.items?.length || 0) >= MAX_ITEMS_PER_PASS) {
      alert(`Maximum ${MAX_ITEMS_PER_PASS} items are allowed per pass.`);
      return;
    }
    setDoc((prev) => ({ ...prev, items: [...prev.items, { equipmentType: '', itemName: '', partNumber: '', serialNumber: '', yearOfMfg: '', defectDetails: '', itemIn: true, itemOut: false, itemRfd: false, dateOut: null, dispatchThrough: '', dateRfd: null, itemRectificationDetails: '', itemFeedback1Details: '', itemFeedback2Details: ''}] }));
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

    if ((doc?.items?.length || 0) > MAX_ITEMS_PER_PASS) {
      alert(`Maximum ${MAX_ITEMS_PER_PASS} items are allowed per pass.`);
      return;
    }
    
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

    for (let i = 0; i < (doc?.items?.length || 0); i++) {
      const yr = parseYearOfMfgInput(doc.items[i]?.yearOfMfg ?? '');
      if (!yr.ok) {
        alert(`Item ${i + 1}: ${yr.msg}`);
        return;
      }
    }

    const itemsWithoutDetails = doc.items.filter(item => item.itemRfd && (!item.itemRectificationDetails || item.itemRectificationDetails.trim() === ''));
    if (itemsWithoutDetails.length > 0) {
      alert('Please enter rectification details for all items marked as "Item RFD"');
      return;
    }

    const itemsWithoutDispatchThrough = doc.items.filter((item, idx) => {
      const alreadyOutInDb = prevData?.items?.[idx]?.itemOut === true;
      return item.itemOut && !alreadyOutInDb && (!item.dispatchThrough || item.dispatchThrough.trim() === '');
    });
    if (itemsWithoutDispatchThrough.length > 0) {
      alert('Please select Dispatch Through for all items marked as "Item Out"');
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
      const payload = {
        dateIn: doc?.dateIn,
        customer: doc?.customer,
        projectName: doc?.projectName,
        items: doc?.items?.map((row) => {
          const yr = parseYearOfMfgInput(row.yearOfMfg ?? '');
          return {
            ...row,
            yearOfMfg: yr.ok ? yr.value : null,
          };
        }),
      };
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
      <SectionNav section="complaints" />
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>EDIT/VIEW</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/user/dashboard'); clearForm()}}>BACK</button>
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
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); fetchDoc(); }
                }}
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
                    <th>SL NO</th><th>ITEM TYPE</th><th>ITEM NAME</th><th>PART NO</th><th>SERIAL NO</th><th>YEAR OF MFG</th><th>DEFECT</th><th>ITEMOUT</th><th>RFD</th><th>DATE OUT</th><th>DISPATCH THROUGH</th><th>DATE RFD</th><th>RECTIFICATION DETAILS</th><th>Dispatch Details</th><th>REMARKS</th>
                    {isEditing && <th style={{ minWidth: '100px', textAlign: 'center' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {doc?.items?.map((it, idx) => {
                    const alreadyOutInDb = prevData?.items?.[idx]?.itemOut === true;
                    return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
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
                      <td><input className={styles.control} value={(it.serialNumber || '').toUpperCase()} onChange={(e) => updateItem(idx, 'serialNumber', e.target.value)} readOnly={!isEditing} required /></td>
                      <td>
                        <input
                          className={styles.control}
                          type="text"
                          inputMode="numeric"
                          value={it.yearOfMfg !== undefined && it.yearOfMfg !== null ? String(it.yearOfMfg) : ''}
                          onChange={(e) => updateItem(idx, 'yearOfMfg', e.target.value)}
                          readOnly={!isEditing}
                          placeholder="2000–2100"
                        />
                        {String(it.yearOfMfg ?? '').trim() !== '' && !parseYearOfMfgInput(it.yearOfMfg).ok && (
                          <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '2px' }}>
                            {parseYearOfMfgInput(it.yearOfMfg).msg}
                          </div>
                        )}
                      </td>
                      <td><input className={styles.control} value={it.defectDetails || ''} onChange={(e) => updateItem(idx, 'defectDetails', e.target.value)} readOnly={!isEditing} /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!it.itemOut} onChange={(e) => updateItem(idx, 'itemOut', e.target.checked)} disabled={!isEditing} /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!it.itemRfd} onChange={(e) => updateItem(idx, 'itemRfd', e.target.checked)} disabled={!isEditing} /></td>
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
                        <select
                          className={styles.control}
                          value={it.dispatchThrough || ''}
                          onChange={(e) => updateItem(idx, 'dispatchThrough', e.target.value)}
                          disabled={!isEditing || alreadyOutInDb}
                        >
                          <option value="">SELECT</option>
                          <option value="Direct Collection">Direct Collection</option>
                          <option value="Through Shipping">Through Shipping</option>
                        </select>
                        {it.itemOut && !alreadyOutInDb && !it.dispatchThrough && <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '2px' }}>⚠️ DISPATCH THROUGH REQUIRED FOR ITEM OUT</div>}
                      </td>
                      <td>
                        <input 
                          type="date" 
                          className={styles.control} 
                          value={it.dateRfd || ''} 
                          onChange={(e) => updateItem(idx, 'dateRfd', e.target.value)}
                          readOnly={!isEditing}
                        />
                        {!it.dateRfd && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>NO DATE SET</div>}
                        {it.itemRfd && !it.dateRfd && <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '2px' }}>⚠️ DATE REQUIRED FOR ITEM RFD</div>}
                      </td>
                      <td>
                          <textarea
                            className={styles.control}
                            value={it.itemRectificationDetails || ""}
                            onChange={(e) => updateItem(idx, 'itemRectificationDetails', e.target.value)}
                            readOnly={!isEditing}
                            rows={1} // looks like an input initially
                          />
                          {it.itemRfd &&
                            (!it.itemRectificationDetails ||
                              it.itemRectificationDetails.trim() === "") && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#ff6b6b",
                                  marginTop: "2px",
                                }}
                              >
                                ⚠️ Rectification details required for Item RFD
                              </div>
                          )}
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
                      <td>
                        <textarea
                            className={styles.control}
                            value={it.itemFeedback1Details || ""}
                            onChange={(e) => updateItem(idx, 'itemFeedback1Details', e.target.value)}
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
                    );
                  })}
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
      <Routes>
        <Route path="/choice" element={
          <ProtectedRoute requiredRole="user">
            <DashboardChoice />
          </ProtectedRoute>
        } />
        <Route path="/user/spares" element={
          <ProtectedRoute requiredRole="user">
            <SparesManagement />
          </ProtectedRoute>
        } />
        <Route path="/user/obd" element={
          <ProtectedRoute requiredRole="user">
            <OBDManagement />
          </ProtectedRoute>
        } />
        <Route path="/user/config" element={
          <ProtectedRoute requiredRole="user">
            <ConfigurationManagement />
          </ProtectedRoute>
        } />
        <Route path="/login" element={
          <LoginPage onLoggedIn={() => setAuthTick((t) => t + 1)} />
        } />
        <Route path="/admin/add-user" element={
          <ProtectedRoute requiredRole="admin">
            <AdminAddUserPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/list-users" element={
          <ProtectedRoute requiredRole="admin">
            <AdminListUsersPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/reset-password" element={
          <ProtectedRoute requiredRole="admin">
            <AdminResetPasswordPage />
          </ProtectedRoute>
        } />
        <Route path="/change-password" element={
          <ProtectedRoute>
            <UserChangePasswordPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/manage-projects" element={
          <ProtectedRoute requiredRole="admin">
            <ManageProjects />
          </ProtectedRoute>
        } />
        <Route path="/admin/manage-stores" element={
          <ProtectedRoute requiredRole="admin">
            <ManageStores />
          </ProtectedRoute>
        } />
        <Route path="/admin/spares-master-list" element={
          <ProtectedRoute requiredRole="admin">
            <div className={styles.inventoryLayout}>
              <Sidebar />
              <div className={styles.inventoryMain}>
                <Header />
                <SparesMasterListPage adminMode />
                <Footer />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/admin/admin-dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/user/dashboard" element={
          <ProtectedRoute requiredRole="user">
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/item-in" element={
          <ProtectedRoute requiredRole="user">
            <ItemInPage />
          </ProtectedRoute>
        } />
        <Route path="/rfd" element={
          <ProtectedRoute requiredRole="user">
            <RFDPage />
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
        <Route path="/obd/out" element={
          <ProtectedRoute requiredRole="user">
            <OBDOutPage />
          </ProtectedRoute>
        } />
        <Route path="/obd/update" element={
          <ProtectedRoute requiredRole="user">
            <UpdateOBDPage />
          </ProtectedRoute>
        } />
        <Route path="/obd/status" element={
          <ProtectedRoute requiredRole="user">
            <OBDStatusPage />
          </ProtectedRoute>
        } />
        <Route path="/config/edit" element={
          <ProtectedRoute requiredRole="user">
            <ConfigEditPage />
          </ProtectedRoute>
        } />
        <Route path="/config/view" element={
          <ProtectedRoute requiredRole="user">
            <ConfigViewPage />
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
        <Route path="/print-sticker" element={
          <ProtectedRoute requiredRole="user">
            <Sticker />
          </ProtectedRoute>
        } />
        <Route path="/spares/spares-master-list" element={
          <ProtectedRoute requiredRole="admin">
            <Navigate to="/admin/spares-master-list" replace />
          </ProtectedRoute>
        } />
        <Route path="/spares/spares-in" element={
          <ProtectedRoute requiredRole="user">
            <SparesInPage />
          </ProtectedRoute>
        } />
        <Route path="/spares/spares-out" element={
          <ProtectedRoute requiredRole="user">
            <SparesOutPage />
          </ProtectedRoute>
        } />
        <Route path="/spares/spares-out-returnable" element={
          <ProtectedRoute requiredRole="user">
            <SparesOutReturnablePage />
          </ProtectedRoute>
        } />
        <Route path="/spares/spares-in-returned" element={
          <ProtectedRoute requiredRole="user">
            <SparesInReturnedPage />
          </ProtectedRoute>
        } />
        <Route path="/spares/view-item" element={
          <ProtectedRoute requiredRole="user">
            <ViewItemPage />
          </ProtectedRoute>
        } />
        <Route path="/spares/stock-check" element={
          <ProtectedRoute requiredRole="user">
            <StockCheckPage />
          </ProtectedRoute>
        } />
      </Routes>
  );
}

export default App;
