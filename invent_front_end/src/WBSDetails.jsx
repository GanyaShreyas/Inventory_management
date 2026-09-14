import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './components/styles.module.css';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import SectionNav from './components/SectionNav';
import { apiBase, authHeaders } from './apiConfig';

const blank = {
  project_name: '', supply_order_no: '', date_of_so: '', customer_details: '',
  contract_number: '', sale_order: '', project_details: '', wbs_number: '',
  type: '', duration: '', date_of_start: '', date_of_end: '', status_of_wbs: 'Open',
  amount_sanctioned_inr: '', remaining_amount_inr: '', remarks: '',
};

const formatInr = (value) => {
  const digits = String(value || '').replace(/[^\d]/g, '');
  return digits ? Number(digits).toLocaleString('en-IN') : '';
};

const cleanInr = (value) => String(value || '').replace(/,/g, '');

function Shell({ children }) {
  return <div className={styles.inventoryLayout}><Sidebar /><div className={styles.inventoryMain}><Header />{children}<Footer /></div></div>;
}

export default function WBSDetails() {
  const navigate = useNavigate();
  return <Shell><div className={styles.page}><SectionNav section="wbs" /><div className={styles.pageHeader}><div className={styles.pageTitle}>WBS DETAILS</div><button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/choice')}>BACK</button></div><div className={styles.cardGrid}><div className={styles.card}><div className={styles.cardTitle}>EDIT</div><div className={styles.cardDesc}>Create or update WBS details by project and supply order.</div><Link className={`${styles.btn} ${styles.btnPrimary}`} to="/wbs/edit">OPEN</Link></div><div className={styles.card}><div className={styles.cardTitle}>VIEW</div><div className={styles.cardDesc}>View WBS records and filter by project or supply order.</div><Link className={`${styles.btn} ${styles.btnPrimary}`} to="/wbs/view">OPEN</Link></div></div></div></Shell>;
}

export function WBSEditPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [orders, setOrders] = useState([]);
  const [mode, setMode] = useState('');
  const [form, setForm] = useState(blank);
  const [status, setStatus] = useState('');
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const resetForm = () => { setForm(blank); setMode(''); setOrders([]); setStatus(''); };

  useEffect(() => { fetch(`${apiBase()}/admin/projects/list`, { headers: authHeaders() }).then(r => r.json()).then(d => setProjects(d.projects || [])); }, []);
  useEffect(() => {
    if (!form.project_name) { setOrders([]); return; }
    fetch(`${apiBase()}/wbs/supply-orders?project_name=${encodeURIComponent(form.project_name)}`, { headers: authHeaders() }).then(r => r.json()).then(d => setOrders(d.supply_orders || []));
  }, [form.project_name]);

  const loadOrder = async (order) => {
    setMode(order === '__new__' ? 'new' : 'existing');
    if (order === '__new__') { setForm(prev => ({ ...blank, project_name: prev.project_name })); return; }
    set('supply_order_no', order);
    const params = new URLSearchParams({ project_name: form.project_name, supply_order_no: order });
    const res = await fetch(`${apiBase()}/wbs/get?${params}`, { headers: authHeaders() });
    const data = await res.json();
    setForm({ ...blank, ...(data.record || {}), project_name: form.project_name, supply_order_no: order });
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus('');
    const payload = {
      ...form,
      amount_sanctioned_inr: cleanInr(form.amount_sanctioned_inr),
      remaining_amount_inr: cleanInr(form.remaining_amount_inr),
    };
    const res = await fetch(`${apiBase()}/wbs/save`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { setStatus(data.error || 'Failed'); return; }
    alert(data.message || 'Saved');
    resetForm();
  };

  return (
    <Shell>
      <div className={styles.page}>
        <SectionNav section="wbs" />
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>WBS DETAILS - EDIT</div>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/wbs')}>BACK</button>
        </div>
        <div className={styles.card}>
          <form className={styles.form} onSubmit={submit}>
            <div className={styles.formGrid2}>
              <label className={styles.label}>PROJECT NAME<select className={styles.control} value={form.project_name} onChange={e => { setForm({ ...blank, project_name: e.target.value }); setMode(''); }} required><option value="">SELECT PROJECT</option>{projects.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
              {form.project_name && <label className={styles.label}>SUPPLY ORDER NO<select className={styles.control} value={mode === 'new' ? '__new__' : form.supply_order_no} onChange={e => loadOrder(e.target.value)} required><option value="">SELECT SUPPLY ORDER</option>{orders.map(o => <option key={o} value={o}>{o}</option>)}<option value="__new__">CREATE NEW SUPPLY ORDER NO.</option></select></label>}
              {mode === 'new' && <label className={styles.label}>NEW SUPPLY ORDER NO<input className={styles.control} value={form.supply_order_no} onChange={e => set('supply_order_no', e.target.value)} required /></label>}
            </div>
            {(mode || form.supply_order_no) && <div className={styles.formGrid2}>
              {[
                ['date_of_so','DATE OF SO','date'],['customer_details','CUSTOMER DETAILS'],['contract_number','CONTRACT NUMBER','number'],['sale_order','SALE ORDER','number'],['project_details','PROJECT DETAILS'],['wbs_number','WBS NUMBER'],['duration','DURATION (MONTHS)','number'],['date_of_start','DATE OF START','date'],['date_of_end','DATE OF END','date'],['remarks','REMARKS']
              ].map(([k,l,t]) => <label key={k} className={styles.label}>{l}<input className={styles.control} type={t || 'text'} min={t === 'number' ? '1' : undefined} value={form[k] || ''} onChange={e => set(k, e.target.value)} /></label>)}
              <label className={styles.label}>AMOUNT SANCTIONED (INR)<input className={styles.control} inputMode="numeric" value={formatInr(form.amount_sanctioned_inr)} onChange={e => set('amount_sanctioned_inr', cleanInr(e.target.value))} /></label>
              <label className={styles.label}>REMAINING AMOUNT (INR)<input className={styles.control} inputMode="numeric" value={formatInr(form.remaining_amount_inr)} onChange={e => set('remaining_amount_inr', cleanInr(e.target.value))} /></label>
              <label className={styles.label}>TYPE<select className={styles.control} value={form.type} onChange={e => set('type', e.target.value)}><option value="">SELECT TYPE</option><option>Warranty</option><option>CAMC</option><option>FRRC</option></select></label>
              <label className={styles.label}>STATUS OF WBS<select className={styles.control} value={form.status_of_wbs || 'Open'} onChange={e => set('status_of_wbs', e.target.value)}><option>Open</option><option>Close</option></select></label>
            </div>}
            <div className={styles.pageActions}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">SAVE</button>
              <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={resetForm}>RESET</button>
            </div>
            {status && <div>{status}</div>}
          </form>
        </div>
      </div>
    </Shell>
  );
}

export function WBSViewPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [supplyOrders, setSupplyOrders] = useState([]);
  const [project, setProject] = useState('');
  const [order, setOrder] = useState('');
  const [searched, setSearched] = useState(false);
  const [status, setStatus] = useState('');
  const orders = project ? supplyOrders : [...new Set(records.map(r => r.supply_order_no).filter(Boolean))].sort();
  const filtered = records.filter(r => (!project || r.project_name === project) && (!order || r.supply_order_no === order));
  const load = async () => {
    setStatus('');
    const params = new URLSearchParams();
    if (project) params.set('project_name', project);
    if (order) params.set('supply_order_no', order);
    const res = await fetch(`${apiBase()}/wbs/list?${params.toString()}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) { setStatus(data.error || 'Failed'); return; }
    setRecords(data.records || []);
    setSearched(true);
  };
  const reset = () => { setProject(''); setOrder(''); setSupplyOrders([]); setRecords([]); setSearched(false); setStatus(''); };
  const download = () => {
    if (!searched || filtered.length === 0) { alert('No data to download'); return; }
    const headers = ['SL', 'Project Name', 'Supply Order No.', 'Date of SO', 'Customer Details', 'Contract Number', 'Sale Order', 'Project Details', 'WBS Number', 'Type', 'Duration', 'Date of Start', 'Date of End', 'Status of WBS', 'Amount Sanctioned (INR)', 'Remaining Amount (INR)', 'Remarks', 'Created By', 'Updated By'];
    const escape = (v) => `"${String(v ?? '').replace(/\r\n|\r|\n/g, ' ').replace(/"/g, '""')}"`;
    const rows = [headers.join(',')];
    filtered.forEach((r, idx) => rows.push([idx + 1, r.project_name, r.supply_order_no, r.date_of_so, r.customer_details, r.contract_number, r.sale_order, r.project_details, r.wbs_number, r.type, r.duration, r.date_of_start, r.date_of_end, r.status_of_wbs, formatInr(r.amount_sanctioned_inr), formatInr(r.remaining_amount_inr), r.remarks, r.created_by, r.updated_by].map(escape).join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wbs_details_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  useEffect(() => { fetch(`${apiBase()}/admin/projects/list`, { headers: authHeaders() }).then(r => r.json()).then(d => setProjects(d.projects || [])); }, []);
  useEffect(() => {
    if (!project) { setSupplyOrders([]); return; }
    fetch(`${apiBase()}/wbs/supply-orders?project_name=${encodeURIComponent(project)}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setSupplyOrders(d.supply_orders || []))
      .catch(() => setSupplyOrders([]));
  }, [project]);
  return <Shell><div className={styles.page}><SectionNav section="wbs" /><div className={styles.pageHeader}><div className={styles.pageTitle}>WBS DETAILS - VIEW</div><button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/wbs')}>BACK</button></div><div className={styles.card}><div className={styles.formGrid2}><label className={styles.label}>PROJECT NAME<select className={styles.control} value={project} onChange={e => { setProject(e.target.value); setOrder(''); }}><option value="">ALL PROJECTS</option>{projects.map(p => <option key={p} value={p}>{p}</option>)}</select></label><label className={styles.label}>SUPPLY ORDER NO<select className={styles.control} value={order} onChange={e => setOrder(e.target.value)}><option value="">ALL SUPPLY ORDERS</option>{orders.map(o => <option key={o} value={o}>{o}</option>)}</select></label></div><div className={styles.pageActions} style={{ marginTop: 12 }}><button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={load}>SEARCH</button><button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={reset}>RESET</button>{searched && filtered.length > 0 && <button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={download}>DOWNLOAD</button>}</div>{status && <div style={{ marginTop: 12 }}>{status}</div>}</div>{searched && <div className={styles.card} style={{ marginTop: 16 }}><div className={styles.pageTitle} style={{ marginBottom: 12 }}>RESULTS ({filtered.length})</div><div className={styles.tableWrap}><table className={styles.table}><thead><tr>{['Project Name','Supply Order No.','Date of SO','Customer Details','Contract Number','Sale Order','Project Details','WBS Number','Type','Duration','Date of Start','Date of End','Status of WBS','Amount Sanctioned (INR)','Remaining Amount (INR)','Remarks','Created By','Updated By'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{filtered.length ? filtered.map(r => <tr key={r._id}><td>{r.project_name}</td><td>{r.supply_order_no}</td><td>{r.date_of_so}</td><td>{r.customer_details}</td><td>{r.contract_number}</td><td>{r.sale_order}</td><td>{r.project_details}</td><td>{r.wbs_number}</td><td>{r.type}</td><td>{r.duration}</td><td>{r.date_of_start}</td><td>{r.date_of_end}</td><td>{r.status_of_wbs}</td><td>{formatInr(r.amount_sanctioned_inr)}</td><td>{formatInr(r.remaining_amount_inr)}</td><td>{r.remarks}</td><td>{r.created_by}</td><td>{r.updated_by}</td></tr>) : <tr><td colSpan="11">No WBS records found.</td></tr>}</tbody></table></div></div>}</div></Shell>;
}
