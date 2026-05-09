import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './components/styles.module.css';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import { apiBase, authHeaders } from './apiConfig';

export default function OBDManagement() {
  const navigate = useNavigate();

  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>OBD MANAGEMENT</div>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/choice')}>BACK</button>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>OBD OUT</div>
              <div className={styles.cardDesc}>Create and store outbound dispatch details.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/obd/out">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>UPDATE OBD</div>
              <div className={styles.cardDesc}>Search OBD by number and update all details.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/obd/update">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>STATUS</div>
              <div className={styles.cardDesc}>Track date-wise records and docket availability.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/obd/status">OPEN</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export function OBDOutPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [obdNo, setObdNo] = useState('');
  const [date, setDate] = useState(today);
  const [sentToLocation, setSentToLocation] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectOptions, setProjectOptions] = useState([]);
  const [itemDetails, setItemDetails] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const fetchProjects = async () => {
    const res = await fetch(`${apiBase()}/admin/projects/list`, { headers: { ...authHeaders() } });
    const data = await res.json();
    setProjectOptions(data.projects || []);
  };

  const clearForm = () => {
    setObdNo('');
    setDate(today);
    setSentToLocation('');
    setAuthorizedBy('');
    setProjectName('');
    setItemDetails('');
    setStatus('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    if (obdNo === '' || Number.isNaN(Number(obdNo))) {
      alert('OBD Number must be an integer');
      return;
    }
    if (!projectName) {
      alert('Project is required');
      return;
    }
    if (!date) {
      alert('Date is required');
      return;
    }
    if (!sentToLocation || !sentToLocation.trim()) {
      alert('Sent To Location is required');
      return;
    }
    if (!authorizedBy || !authorizedBy.trim()) {
      alert('Authorised By is required');
      return;
    }
    if (!itemDetails || !itemDetails.trim()) {
      alert('Item Details is required');
      return;
    }

    try {
      const res = await fetch(`${apiBase()}/obd/out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          obdNo: Number(obdNo),
          date,
          sentToLocation,
          authorizedBy,
          projectName,
          itemDetails,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert('OBD Out recorded successfully!');
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
        <div className={styles.pageTitle}>OBD OUT</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => { navigate('/user/obd'); clearForm(); }}>BACK</button>
        </div>
      </div>
      <div className={styles.card}>
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGrid2}>
            <label className={styles.label}>OBD NUMBER (INTEGER)
              <input className={styles.control} type="number" value={obdNo} onChange={(e) => setObdNo(e.target.value)} required />
            </label>
            <label className={styles.label}>DATE
              <input className={styles.control} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className={styles.label}>SENT TO LOCATION
              <input className={styles.control} value={sentToLocation} onChange={(e) => setSentToLocation(e.target.value)} required />
            </label>
            <label className={styles.label}>AUTHORISED BY
              <input className={styles.control} value={authorizedBy} onChange={(e) => setAuthorizedBy(e.target.value)} required />
            </label>
            <label className={styles.label}>PROJECT
              <select className={styles.control} value={projectName} onChange={(e) => setProjectName(e.target.value)} onFocus={fetchProjects} required>
                <option value="">SELECT PROJECT</option>
                {projectOptions.map((p, i) => <option key={i} value={p}>{p}</option>)}
              </select>
            </label>
            <label className={styles.label}>ITEM DETAILS
              <textarea className={styles.control} value={itemDetails} onChange={(e) => setItemDetails(e.target.value)} rows={2} required />
            </label>
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

export function UpdateOBDPage() {
  const [searchObdNo, setSearchObdNo] = useState('');
  const [obdSuggestions, setObdSuggestions] = useState([]);
  const [showObdSuggestions, setShowObdSuggestions] = useState(false);
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState('');
  const suggestionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowObdSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchValue = (searchObdNo || '').trim();
    if (searchValue.length < 3) {
      setObdSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const params = new URLSearchParams();
        params.set('value', searchValue);
        const res = await fetch(`${apiBase()}/obd/suggestions?${params.toString()}`, { headers: { ...authHeaders() } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch suggestions');
        setObdSuggestions(data.suggestions || []);
      } catch (err) {
        console.error('Error fetching OBD suggestions:', err);
        setObdSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [searchObdNo]);

  const fetchRecord = async () => {
    setStatus('');
    if (searchObdNo === '' || Number.isNaN(Number(searchObdNo))) {
      alert('Enter a valid OBD Number');
      return;
    }
    try {
      const res = await fetch(`${apiBase()}/obd/${encodeURIComponent(Number(searchObdNo))}`, { headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Not found');
      setDoc(data);
      setShowObdSuggestions(false);
    } catch (err) {
      setDoc(null);
      setStatus(`Error: ${err.message}`);
    }
  };

  const updateField = (key, value) => {
    setDoc((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    if (!doc) return;
    if (!doc.projectName) {
      alert('Project is required');
      return;
    }
    if (!doc.docketStatus) {
      alert('Delivery Status is required');
      return;
    }
    if (doc.docketStatus === 'Delivered' && !doc.deliveredDate) {
      alert('Delivered Date is required when Delivery Status is Delivered');
      return;
    }
    setStatus('');
    try {
      const res = await fetch(`${apiBase()}/obd/${encodeURIComponent(Number(searchObdNo))}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          obdNo: Number(doc.obdNo),
          date: doc.date || '',
          projectName: doc.projectName || '',
          itemDetails: doc.itemDetails || '',
          sentToLocation: doc.sentToLocation || '',
          authorizedBy: doc.authorizedBy || '',
          courierName: doc.courierName || '',
          docketNumber: doc.docketNumber || '',
          docketStatus: doc.docketStatus || 'In Transit',
          deliveredDate: doc.deliveredDate || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert('OBD record updated successfully!');
      setStatus('Updated');
      setSearchObdNo(String(doc.obdNo || ''));
      setObdSuggestions([]);
      setShowObdSuggestions(false);
    } catch (err) {
      alert(`Error: ${err.message}`);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page} style={{ height: 'calc(100vh - 10px)', overflow: 'auto' }}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>UPDATE OBD</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => { navigate('/user/obd'); setDoc(null); setStatus(''); }}>BACK</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formRow}>
          <label className={styles.label}>OBD NUMBER
            <div className={styles.relativeContainer} ref={suggestionRef}>
              <input
                className={styles.control}
                value={searchObdNo}
                onChange={(e) => setSearchObdNo(e.target.value)}
                onFocus={() => setShowObdSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchRecord();
                  }
                }}
              />
              {showObdSuggestions && obdSuggestions.length > 0 && (
                <ul className={styles.suggestionsList}>
                  {obdSuggestions.map((s, i) => (
                    <li key={i} onClick={() => { setSearchObdNo(String(s)); setShowObdSuggestions(false); }}>
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

      {doc ? (
        <div className={`${styles.card} ${styles.mt12}`}>
          <div className={styles.formGrid2}>
            <label className={styles.label}>OBD NUMBER
              <input className={styles.control} type="number" value={doc.obdNo || ''} onChange={(e) => updateField('obdNo', e.target.value)} />
            </label>
            <label className={styles.label}>DATE
              <input className={styles.control} type="date" value={doc.date || ''} onChange={(e) => updateField('date', e.target.value)} />
            </label>
            <label className={styles.label}>PROJECT
              <input className={styles.control} value={doc.projectName || ''} readOnly />
            </label>
            <label className={styles.label}>ITEM DETAILS
              <textarea className={styles.control} value={doc.itemDetails || ''} onChange={(e) => updateField('itemDetails', e.target.value)} rows={2} />
            </label>
            <label className={styles.label}>SENT TO LOCATION
              <input className={styles.control} value={doc.sentToLocation || ''} onChange={(e) => updateField('sentToLocation', e.target.value)} />
            </label>
            <label className={styles.label}>AUTHORISED BY
              <input className={styles.control} value={doc.authorizedBy || ''} onChange={(e) => updateField('authorizedBy', e.target.value)} />
            </label>
            <label className={styles.label}>COURIER NAME
              <input className={styles.control} value={doc.courierName || ''} onChange={(e) => updateField('courierName', e.target.value)} />
            </label>
            <label className={styles.label}>DOCKET NUMBER
              <input className={styles.control} value={doc.docketNumber || ''} onChange={(e) => updateField('docketNumber', e.target.value)} />
            </label>
            <label className={styles.label}>DELIVERY STATUS
              <select className={styles.control} value={doc.docketStatus || 'In Transit'} onChange={(e) => updateField('docketStatus', e.target.value)}>
                <option value="Delivered">Delivered</option>
                <option value="In Transit">In Transit</option>
              </select>
            </label>
            <label className={styles.label}>DELIVERED DATE
              <input
                className={styles.control}
                type="date"
                value={doc.deliveredDate || ''}
                onChange={(e) => updateField('deliveredDate', e.target.value)}
                disabled={(doc.docketStatus || 'In Transit') !== 'Delivered'}
              />
            </label>
          </div>
          <div className={styles.pageActions} style={{ marginTop: 16 }}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSubmit}>SAVE CHANGES</button>
          </div>
        </div>
      ) : null}
      {status ? <div className={`${styles.card} ${styles.statusCard}`}>{status}</div> : null}
    </div>
  );
}

export function OBDStatusPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [docketStatus, setDocketStatus] = useState('All');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const runSearch = async () => {
    setStatus('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('docketStatus', docketStatus);
      const res = await fetch(`${apiBase()}/obd/status?${params.toString()}`, { headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setResult(data);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
      setResult(null);
    }
  };

  const downloadStatusExcel = async () => {
    setStatus('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('docketStatus', docketStatus);

      const res = await fetch(`${apiBase()}/obd/status/download?${params.toString()}`, { headers: { ...authHeaders() } });
      if (!res.ok) {
        let message = 'Failed to download OBD status';
        try {
          const errData = await res.json();
          message = errData?.error || message;
        } catch (_) {
          // Keep default message
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const header = res.headers.get('Content-Disposition') || '';
      const match = header.match(/filename="?([^\"]+)"?/i);
      const fallback = `OBD_${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}.xlsx`;
      const filename = match && match[1] ? match[1] : fallback;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page} style={{ height: 'calc(100vh - 10px)', overflow: 'auto' }}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>OBD STATUS</div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/user/obd')}>BACK</button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.formGrid3}>
          <label className={styles.label}>FROM DATE
            <input className={styles.control} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className={styles.label}>TO DATE
            <input className={styles.control} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className={styles.label}>DOCKET STATUS
            <select className={styles.control} value={docketStatus} onChange={(e) => setDocketStatus(e.target.value)}>
              <option value="All">ALL</option>
              <option value="Present">PRESENT</option>
              <option value="Absent">ABSENT</option>
            </select>
          </label>
        </div>
        <div className={styles.pageActions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={runSearch}>VIEW STATUS</button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={downloadStatusExcel}>DOWNLOAD EXCEL</button>
        </div>
        {status ? <div style={{ marginTop: 12 }}>{status}</div> : null}
      </div>

      {result && Array.isArray(result.data) ? (
        <div className={styles.card} style={{ marginTop: 12 }}>
          <h3>STATUS RESULTS ({result.count} RECORDS)</h3>
          <div className={styles.tableWrap} style={{ maxHeight: 450, overflowY: 'auto', overflowX: 'auto' }}>
            <table className={styles.table} style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>SL NO</th>
                  <th>OBD NO</th>
                  <th>DATE</th>
                  <th>SENT TO LOCATION</th>
                  <th>AUTHORISED BY</th>
                  <th>PROJECT</th>
                  <th>ITEM DETAILS</th>
                  <th>COURIER NAME</th>
                  <th>DOCKET NUMBER</th>
                  <th>DOCKET STATUS</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((row, idx) => (
                  <tr key={row.obdNo}>
                    <td>{idx + 1}</td>
                    <td>{row.obdNo}</td>
                    <td>{row.date || ''}</td>
                    <td>{row.sentToLocation || ''}</td>
                    <td>{row.authorizedBy || ''}</td>
                    <td>{row.projectName || ''}</td>
                    <td>{row.itemDetails || ''}</td>
                    <td>{row.courierName || ''}</td>
                    <td>{row.docketNumber || ''}</td>
                    <td>{row.docketNumber ? 'Present' : 'Absent'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
