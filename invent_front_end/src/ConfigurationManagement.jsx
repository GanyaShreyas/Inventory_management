import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import styles from './components/styles.module.css';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import { apiBase, authHeaders } from './apiConfig';
import SectionNav from './components/SectionNav';

/* ═══════════════ Dashboard ═══════════════ */
export default function ConfigurationManagement() {
  const navigate = useNavigate();

  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>CONFIGURATION MANAGEMENT</div>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/choice')}>BACK</button>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>EDIT</div>
              <div className={styles.cardDesc}>Add configuration details for project items.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/config/edit">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>VIEW</div>
              <div className={styles.cardDesc}>Search and view configuration records.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/config/view">OPEN</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

/* ═══════════════ Edit Page ═══════════════ */
export function ConfigEditPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);

  const [projectName, setProjectName] = useState('');
  const [itemType, setItemType] = useState('');
  const [itemName, setItemName] = useState('');
  const [partNo, setPartNo] = useState('');
  const [configDetails, setConfigDetails] = useState('');
  const [status, setStatus] = useState('');

  // Load projects on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/admin/projects/list`, { headers: authHeaders() });
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // Load items when project changes
  useEffect(() => {
    if (!projectName) { setItems([]); return; }
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/admin/projects/items?projectName=${encodeURIComponent(projectName)}`, { headers: authHeaders() });
        const data = await res.json();
        setItems(data.items || []);
      } catch (e) { setItems([]); }
    })();
  }, [projectName]);

  // Cascading options
  const uniqueItemTypes = useMemo(() => [...new Set(items.map(i => i.itemType).filter(Boolean))].sort(), [items]);
  const filteredByType = useMemo(() => itemType ? items.filter(i => i.itemType === itemType) : items, [items, itemType]);
  const uniqueItemNames = useMemo(() => [...new Set(filteredByType.map(i => i.itemName).filter(Boolean))].sort(), [filteredByType]);
  const filteredByName = useMemo(() => itemName ? filteredByType.filter(i => i.itemName === itemName) : filteredByType, [filteredByType, itemName]);
  const uniquePartNos = useMemo(() => [...new Set(filteredByName.map(i => i.partNo).filter(Boolean))].sort(), [filteredByName]);

  // Auto-select single options
  useEffect(() => {
    if (uniqueItemTypes.length === 1) setItemType(uniqueItemTypes[0]);
  }, [uniqueItemTypes]);
  useEffect(() => {
    if (uniqueItemNames.length === 1) setItemName(uniqueItemNames[0]);
  }, [uniqueItemNames]);
  useEffect(() => {
    if (uniquePartNos.length === 1) setPartNo(uniquePartNos[0]);
  }, [uniquePartNos]);

  // Whether all required fields are filled (enables config details)
  const allFieldsFilled = !!(projectName && itemType && itemName && partNo);
  const [isExisting, setIsExisting] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch existing config when all fields are filled
  useEffect(() => {
    if (!allFieldsFilled) { setConfigDetails(''); setIsExisting(false); return; }
    let cancelled = false;
    (async () => {
      setFetching(true);
      try {
        const params = new URLSearchParams({ project_name: projectName, item_type: itemType, item_name: itemName, part_no: partNo });
        const res = await fetch(`${apiBase()}/config/get?${params}`, { headers: authHeaders() });
        const data = await res.json();
        if (cancelled) return;
        if (data.found) {
          setConfigDetails(data.record.config_details || '');
          setIsExisting(true);
        } else {
          setConfigDetails('');
          setIsExisting(false);
        }
      } catch (e) { if (!cancelled) { setConfigDetails(''); setIsExisting(false); } }
      if (!cancelled) setFetching(false);
    })();
    return () => { cancelled = true; };
  }, [projectName, itemType, itemName, partNo, allFieldsFilled]);

  const clearForm = () => {
    setProjectName('');
    setItemType('');
    setItemName('');
    setPartNo('');
    setConfigDetails('');
    setStatus('');
    setIsExisting(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    if (!projectName || !itemType || !itemName || !partNo || !configDetails.trim()) {
      setStatus('All fields are required.');
      return;
    }
    const action = isExisting ? 'Update' : 'Save';
    const confirmSubmit = window.confirm(`${action} configuration?\n\nProject: ${projectName}\nItem Type: ${itemType}\nItem Name: ${itemName}\nPart No: ${partNo}`);
    if (!confirmSubmit) return;

    try {
      const res = await fetch(`${apiBase()}/config/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          project_name: projectName,
          item_type: itemType,
          item_name: itemName,
          part_no: partNo,
          config_details: configDetails.toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert(data.message || `Configuration ${isExisting ? 'updated' : 'saved'}!`);
      clearForm();
    } catch (err) {
      alert(err.message);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page}>
      <SectionNav section="config" />
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>CONFIGURATION — EDIT</div>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/user/config')}>BACK</button>
      </div>

      <div className={styles.card}>
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGrid2}>
            <label className={styles.label}>
              PROJECT NAME
              <select className={styles.control} value={projectName} onChange={(e) => { setProjectName(e.target.value); setItemType(''); setItemName(''); setPartNo(''); }} required>
                <option value="">— Select Project —</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

            <label className={styles.label}>
              ITEM TYPE
              <select className={styles.control} value={itemType} onChange={(e) => { setItemType(e.target.value); setItemName(''); setPartNo(''); }}>
                <option value="">— Select Item Type —</option>
                {uniqueItemTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className={styles.label}>
              ITEM NAME
              <select className={styles.control} value={itemName} onChange={(e) => { setItemName(e.target.value); setPartNo(''); }}>
                <option value="">— Select Item Name —</option>
                {uniqueItemNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>

            <label className={styles.label}>
              PART NO
              <select className={styles.control} value={partNo} onChange={(e) => setPartNo(e.target.value)} required>
                <option value="">— Select Part No —</option>
                {uniquePartNos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

            <label className={styles.label} style={{ gridColumn: '1 / -1' }}>
              CONFIGURATION DETAILS
              <textarea
                className={styles.control}
                value={configDetails}
                onChange={(e) => setConfigDetails(e.target.value)}
                rows={4}
                required
                disabled={!allFieldsFilled || fetching}
                placeholder={!allFieldsFilled ? "Select all fields above to enable..." : fetching ? "Loading..." : "Enter configuration details..."}
              />
            </label>
          </div>

          {status && <div style={{ marginTop: 8, color: status.startsWith('Error') ? 'red' : 'green' }}>{status}</div>}
          {isExisting && <div style={{ marginTop: 8, color: '#b8860b', fontWeight: 'bold' }}>Existing record found — saving will update it.</div>}

          <div className={styles.pageActions}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!allFieldsFilled || fetching}>{isExisting ? 'UPDATE CONFIGURATION' : 'SAVE CONFIGURATION'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════ Reusable column filter hook ═══════════════ */
function useColumnFilters(allRows, columnDefs) {
  const [columnFilterAllowedValues, setColumnFilterAllowedValues] = useState({});
  const [columnFilterDraftValues, setColumnFilterDraftValues] = useState({});
  const [openColumnFilterColId, setOpenColumnFilterColId] = useState(null);
  const [filterPopoverPos, setFilterPopoverPos] = useState(null);
  const filterPopoverRef = useRef(null);

  const columnFilterAllowedSets = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(columnFilterAllowedValues)) {
      if (!Array.isArray(v)) continue;
      out[k] = new Set(v.map(x => String(x ?? '')));
    }
    return out;
  }, [columnFilterAllowedValues]);

  const getUniqueFilterValues = (targetColId) => {
    if (!targetColId) return [];
    const col = columnDefs.find(c => c.id === targetColId);
    if (!col) return [];
    const rowsForUniques = allRows.filter(r => {
      for (const [colId, allowedSet] of Object.entries(columnFilterAllowedSets)) {
        if (colId === targetColId) continue;
        const c = columnDefs.find(cd => cd.id === colId);
        if (!c) continue;
        if (!allowedSet.has(String(c.accessor(r) ?? ''))) return false;
      }
      return true;
    });
    const uniqueSet = new Set();
    rowsForUniques.forEach(r => uniqueSet.add(String(col.accessor(r) ?? '')));
    return Array.from(uniqueSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  };

  const visibleRows = useMemo(() => {
    let rows = allRows;
    for (const [colId, allowedSet] of Object.entries(columnFilterAllowedSets)) {
      const col = columnDefs.find(c => c.id === colId);
      if (!col) continue;
      rows = rows.filter(r => allowedSet.has(String(col.accessor(r) ?? '')));
      if (rows.length === 0) return [];
    }
    return rows;
  }, [allRows, columnFilterAllowedSets, columnDefs]);

  const openColumnFilter = (colId, anchorEvent) => {
    const uniqueVals = getUniqueFilterValues(colId);
    const appliedVals = columnFilterAllowedValues[colId];
    const initialDraft = Array.isArray(appliedVals)
      ? uniqueVals.filter(v => new Set(appliedVals.map(x => String(x ?? ''))).has(String(v ?? '')))
      : uniqueVals;
    setColumnFilterDraftValues(prev => ({ ...prev, [colId]: initialDraft }));
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
      let top, maxH;
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
    setColumnFilterDraftValues(prev => { const next = { ...prev }; delete next[colId]; return next; });
    setOpenColumnFilterColId(null);
    setFilterPopoverPos(null);
  };

  const applyColumnFilter = (colId) => {
    if (!colId) return;
    const uniqueVals = getUniqueFilterValues(colId);
    const draftVals = Array.isArray(columnFilterDraftValues[colId]) ? columnFilterDraftValues[colId] : uniqueVals;
    const draftSet = new Set(draftVals.map(x => String(x ?? '')));
    const normalizedDraft = uniqueVals.filter(v => draftSet.has(String(v ?? '')));
    setColumnFilterAllowedValues(prev => {
      if (normalizedDraft.length === uniqueVals.length) { const { [colId]: _, ...rest } = prev; return rest; }
      return { ...prev, [colId]: normalizedDraft };
    });
    cancelColumnFilter(colId);
  };

  useEffect(() => {
    if (!openColumnFilterColId) return;
    const onMouseDown = e => { if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) cancelColumnFilter(openColumnFilterColId); };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openColumnFilterColId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!openColumnFilterColId) return;
    const onScroll = e => {
      const t = e.target; const pop = filterPopoverRef.current;
      if (!(t instanceof Element) || !pop) { cancelColumnFilter(openColumnFilterColId); return; }
      if (t === pop || pop.contains(t)) return;
      cancelColumnFilter(openColumnFilterColId);
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [openColumnFilterColId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { visibleRows, openColumnFilterColId, filterPopoverPos, filterPopoverRef, openColumnFilter, cancelColumnFilter, applyColumnFilter, getUniqueFilterValues, columnFilterDraftValues, setColumnFilterDraftValues, columnFilterAllowedValues };
}

function ColumnFilterPopover({ hook, columns }) {
  const { openColumnFilterColId, filterPopoverPos, filterPopoverRef, cancelColumnFilter, applyColumnFilter, getUniqueFilterValues, columnFilterDraftValues, setColumnFilterDraftValues } = hook;
  if (!openColumnFilterColId || !filterPopoverPos) return null;
  const colDef = columns.find(c => c.id === openColumnFilterColId);
  const colLabel = colDef ? colDef.label : '';
  const uniqueValues = getUniqueFilterValues(openColumnFilterColId);
  const draftArr = columnFilterDraftValues[openColumnFilterColId];
  const draftSet = draftArr ? new Set(draftArr.map(x => String(x ?? ''))) : new Set(uniqueValues.map(x => String(x ?? '')));
  const isAllSelected = uniqueValues.every(v => draftSet.has(String(v ?? '')));

  return createPortal(
    <div ref={filterPopoverRef} role="dialog" aria-modal="true" onWheel={e => e.stopPropagation()}
      style={{ position: 'fixed', top: filterPopoverPos.top, left: filterPopoverPos.left, width: filterPopoverPos.width || 280, maxHeight: filterPopoverPos.maxHeight ?? 420, zIndex: 2147483000, boxSizing: 'border-box' }}
      className={styles.columnFilterPopoverPortal}>
      <div className={styles.columnFilterPopoverTitle}>Filter {colLabel}</div>
      <div className={styles.columnFilterPopoverScroll}>
        <div className={styles.columnFilterValueList}>
          <label className={styles.columnFilterValueItem}>
            <input type="checkbox" checked={isAllSelected}
              onChange={e => setColumnFilterDraftValues(prev => ({ ...prev, [openColumnFilterColId]: e.target.checked ? [...uniqueValues] : [] }))} />
            <span>Select All</span>
          </label>
          {uniqueValues.map(val => {
            const valueStr = String(val ?? '');
            const displayVal = valueStr === '' ? '(Blank)' : valueStr;
            return (
              <label key={valueStr} className={styles.columnFilterValueItem}>
                <input type="checkbox" checked={draftSet.has(valueStr)}
                  onChange={e => {
                    setColumnFilterDraftValues(prev => {
                      const baseSet = new Set((prev?.[openColumnFilterColId] || uniqueValues).map(x => String(x ?? '')));
                      if (e.target.checked) baseSet.add(valueStr); else baseSet.delete(valueStr);
                      return { ...prev, [openColumnFilterColId]: Array.from(baseSet) };
                    });
                  }} />
                <span title={displayVal}>{displayVal}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div className={styles.columnFilterPopoverFooter}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => applyColumnFilter(openColumnFilterColId)}>OK</button>
        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => cancelColumnFilter(openColumnFilterColId)}>Cancel</button>
      </div>
    </div>,
    document.body
  );
}

function FilterIconBtn({ colId, hook }) {
  const { openColumnFilterColId, openColumnFilter, cancelColumnFilter, columnFilterAllowedValues } = hook;
  const hasFilter = Array.isArray(columnFilterAllowedValues?.[colId]);
  return (
    <button type="button" title="Filter column" aria-label={`Filter ${colId}`}
      className={styles.columnFilterIconBtn}
      style={hasFilter ? { color: '#2563eb' } : undefined}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); if (openColumnFilterColId === colId) cancelColumnFilter(colId); else openColumnFilter(colId, e); }}>
      <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M2.5 4.5h7L6 8z" />
      </svg>
    </button>
  );
}

/* ═══════════════ View Page ═══════════════ */
export function ConfigViewPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [partNoFilter, setPartNoFilter] = useState('');
  const [records, setRecords] = useState([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/admin/projects/list`, { headers: authHeaders() });
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (projectFilter) params.set('project_name', projectFilter);
      if (partNoFilter.trim()) params.set('part_no', partNoFilter.trim());
      const res = await fetch(`${apiBase()}/config/list?${params.toString()}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setRecords(data.records || []);
      setSearched(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReset = () => {
    setProjectFilter('');
    setPartNoFilter('');
    setRecords([]);
    setSearched(false);
  };

  const handleDownload = () => {
    if (visibleRows.length === 0) { alert('No data to download'); return; }
    const headers = ['SL', 'Project Name', 'Item Type', 'Item Name', 'Part No', 'Configuration Details', 'Created By'];
    const csvRows = [headers.join(',')];
    visibleRows.forEach((row, idx) => {
      const escape = (v) => { const s = String(v ?? '').replace(/\r\n|\r|\n/g, ' '); return `"${s.replace(/"/g, '""')}"`; };
      csvRows.push([idx + 1, escape(row.project_name), escape(row.item_type), escape(row.item_name), escape(row.part_no), escape(row.config_details), escape(row.created_by)].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuration_details_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Column definitions for excel-like filter
  const viewColumns = useMemo(() => [
    { id: 'project_name', label: 'Project Name', accessor: r => r.project_name ?? '' },
    { id: 'item_type', label: 'Item Type', accessor: r => r.item_type ?? '' },
    { id: 'item_name', label: 'Item Name', accessor: r => r.item_name ?? '' },
    { id: 'part_no', label: 'Part No', accessor: r => r.part_no ?? '' },
    { id: 'config_details', label: 'Configuration Details', accessor: r => r.config_details ?? '' },
    { id: 'created_by', label: 'Created By', accessor: r => r.created_by ?? '' },
  ], []);

  const colFilter = useColumnFilters(records, viewColumns);
  const visibleRows = colFilter.visibleRows;

  return (
    <div className={styles.page}>
      <SectionNav section="config" />
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>CONFIGURATION — VIEW</div>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/user/config')}>BACK</button>
      </div>

      {/* Search Filters */}
      <div className={styles.card}>
        <div className={styles.form}>
          <div className={styles.formGrid2}>
            <label className={styles.label}>
              PROJECT NAME
              <select className={styles.control} value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
                <option value="">— All Projects —</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className={styles.label}>
              ITEM PART NO
              <input className={styles.control} value={partNoFilter} onChange={e => setPartNoFilter(e.target.value)} placeholder="Enter part number..." />
            </label>
          </div>
          <div className={styles.pageActions} style={{ marginTop: 12 }}>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSearch}>SEARCH</button>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={handleReset}>RESET</button>
            {searched && visibleRows.length > 0 && (
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleDownload}>DOWNLOAD</button>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
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
                ) : (
                  visibleRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      {viewColumns.map(c => (
                        <td key={c.id} style={c.id === 'config_details' ? { whiteSpace: 'pre-wrap', maxWidth: 300, textAlign: 'justify' } : undefined}>
                          {c.accessor(row) || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <ColumnFilterPopover hook={colFilter} columns={viewColumns} />
          </div>
        </div>
      )}
    </div>
  );
}
