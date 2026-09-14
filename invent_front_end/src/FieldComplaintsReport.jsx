import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './components/styles.module.css';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import { apiBase, authHeaders } from './apiConfig';
import { ColumnFilterPopover, FilterIconBtn, useColumnFilters } from './ConfigurationManagement';
import SectionNav from './components/SectionNav';

const upper = (value) => String(value ?? '').toUpperCase();

function Shell({ children }) {
  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  );
}

function FieldReportsHome() {
  const navigate = useNavigate();
  return (
    <Shell>
      <div className={styles.page}>
        <SectionNav section="fieldReports" />
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>FIELD COMPLAINTS REPORT</div>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/choice')}>BACK</button>
        </div>
        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>BULK UPLOAD</div>
            <div className={styles.cardDesc}>Upload Field Complaints Report files using the master template.</div>
            <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/field-complaints-report/upload">OPEN</Link>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>VIEW REPORT</div>
            <div className={styles.cardDesc}>View, filter, and download uploaded Field Complaints Report records.</div>
            <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/field-complaints-report/view">OPEN</Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function BulkUploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState([]);

  const upload = async (e) => {
    e.preventDefault();
    setStatus('');
    setErrors([]);
    if (!file) { setStatus('Select a .xlsx or .csv file.'); return; }
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${apiBase()}/field-reports/bulk-upload`, { method: 'POST', headers: authHeaders(), body: form });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Upload failed');
      setErrors(data.details || [...(data.missing || []).map(h => `Missing header: ${h}`), ...(data.unexpected || []).map(h => `Unexpected header: ${h}`)]);
      return;
    }
    setStatus(`${data.message || 'Uploaded'} (${data.inserted || 0} records)`);
    setFile(null);
    e.target.reset();
  };

  return (
    <Shell>
      <div className={styles.page}>
        <SectionNav section="fieldReports" />
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>FIELD COMPLAINTS REPORT - BULK UPLOAD</div>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/field-complaints-report')}>BACK</button>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>BULK UPLOAD FIELD REPORTS</div>
          <form className={styles.form} onSubmit={upload}>
            <label className={styles.label}>UPLOAD FILE
              <input className={styles.control} type="file" accept=".xlsx,.csv" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
            <div className={styles.pageActions}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">UPLOAD</button>
            </div>
            {status && <div style={{ color: errors.length ? '#b91c1c' : 'green' }}>{status}</div>}
            {errors.length > 0 && <div className={styles.tableWrap} style={{ marginTop: 12 }}><table className={styles.table}><tbody>{errors.map((err, idx) => <tr key={idx}><td>{err}</td></tr>)}</tbody></table></div>}
          </form>
        </div>
      </div>
    </Shell>
  );
}

function ViewReportPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [records, setRecords] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (project = projectFilter) => {
    try {
      const params = new URLSearchParams();
      if (project) params.set('project', project);
      const res = await fetch(`${apiBase()}/field-reports/list?${params.toString()}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setHeaders(data.headers || []);
      setRecords(data.records || []);
      setSearched(true);
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/admin/projects/list`, { headers: authHeaders() });
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const handleReset = () => {
    setProjectFilter('');
    setRecords([]);
    setHeaders([]);
    setSearched(false);
  };

  const handleDownload = () => {
    if (visibleRows.length === 0) { alert('No data to download'); return; }
    const escape = (v) => {
      const s = String(v ?? '').replace(/\r\n|\r|\n/g, ' ');
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csvRows = [['SL NO.', ...headers].map(escape).join(',')];
    visibleRows.forEach((row, idx) => {
      csvRows.push([idx + 1, ...headers.map(h => row.data?.[h] ?? '')].map(escape).join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field_complaints_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const viewColumns = useMemo(() => headers.map(h => ({ id: h, label: h.replace(/\*/g, ''), accessor: r => r.data?.[h] ?? '' })), [headers]);
  const colFilter = useColumnFilters(records, viewColumns);
  const visibleRows = colFilter.visibleRows;

  return (
    <Shell>
      <div className={styles.page}>
        <SectionNav section="fieldReports" />
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>FIELD COMPLAINTS REPORT - VIEW</div>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/field-complaints-report')}>BACK</button>
        </div>
        <div className={styles.card}>
          <div className={styles.form}>
            <div className={styles.formGrid2}>
              <label className={styles.label}>PROJECT NAME
                <select className={styles.control} value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
                  <option value="">- All Projects -</option>
                  {projects.map(p => <option key={p} value={p}>{upper(p)}</option>)}
                </select>
              </label>
            </div>
            <div className={styles.pageActions} style={{ marginTop: 12 }}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleSearch()}>SEARCH</button>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={handleReset}>RESET</button>
              {searched && visibleRows.length > 0 && <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleDownload}>DOWNLOAD</button>}
            </div>
          </div>
        </div>
        {searched && (
          <div className={styles.card} style={{ marginTop: 16 }}>
            <div className={styles.pageTitle} style={{ marginBottom: 12 }}>RESULTS ({visibleRows.length})</div>
            <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', top: 0, zIndex: 4, background: '#fff' }}>SL</th>
                    {viewColumns.map(c => (
                      <th key={c.id} style={{ position: 'sticky', top: 0, zIndex: 4, background: '#fff' }}>
                        <div className={styles.reportTh}>
                          <span>{c.label}</span>
                          <FilterIconBtn colId={c.id} hook={colFilter} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 ? (
                    <tr><td colSpan={viewColumns.length + 1} style={{ textAlign: 'center', padding: 16 }}>No records found</td></tr>
                  ) : visibleRows.map((row, idx) => (
                    <tr key={row._id || idx}>
                      <td>{idx + 1}</td>
                      {viewColumns.map(c => <td key={c.id}>{upper(c.accessor(row)) || '-'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              <ColumnFilterPopover hook={colFilter} columns={viewColumns} />
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

export default function FieldComplaintsReport() {
  const location = useLocation();
  if (location.pathname.endsWith('/upload')) return <BulkUploadPage />;
  if (location.pathname.endsWith('/view')) return <ViewReportPage />;
  return <FieldReportsHome />;
}
