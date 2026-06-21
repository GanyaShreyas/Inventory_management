import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import styles from './components/styles.module.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
// eslint-disable-next-line no-unused-vars
import axios from 'axios';
import React from 'react';
import { apiBase, authHeaders } from './apiConfig';
import SectionNav from './components/SectionNav';

/** Master/API may return bin_nos as array, comma-separated string, or missing — always a string[] for .map / .join */
function normalizeBinNos(value) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) {
    return value.map((b) => (b == null ? '' : String(b)));
  }
  if (typeof value === 'string') {
    return value.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return [String(value)];
  }
  return [];
}

/** Debounced regex search on part_no for dropdowns (uses /spares/master/search). */
function usePartSuggestList(partSearch) {
  const [matches, setMatches] = useState([]);
  useEffect(() => {
    const q = (partSearch || "").trim();
    if (!q) {
      setMatches([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `${apiBase()}/spares/master/search?pattern=${encodeURIComponent(q)}`,
          { headers: authHeaders() }
        );
        const data = await res.json();
        setMatches(data.matches || []);
      } catch {
        setMatches([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [partSearch]);
  return matches;
}

/* ───────── Reusable multi-select column-filter hook (excel-like) ───────── */
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
    setColumnFilterDraftValues(prev => {
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
    const draftSet = new Set(draftVals.map(x => String(x ?? '')));
    const normalizedDraft = uniqueVals.filter(v => draftSet.has(String(v ?? '')));
    setColumnFilterAllowedValues(prev => {
      if (normalizedDraft.length === uniqueVals.length) {
        const { [colId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [colId]: normalizedDraft };
    });
    cancelColumnFilter(colId);
  };

  useEffect(() => {
    if (!openColumnFilterColId) return;
    const onMouseDown = e => {
      if (!filterPopoverRef.current) return;
      if (!filterPopoverRef.current.contains(e.target)) cancelColumnFilter(openColumnFilterColId);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openColumnFilterColId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!openColumnFilterColId) return;
    const onScroll = e => {
      const t = e.target;
      const pop = filterPopoverRef.current;
      if (!(t instanceof Element) || !pop) { cancelColumnFilter(openColumnFilterColId); return; }
      if (t === pop || pop.contains(t)) return;
      cancelColumnFilter(openColumnFilterColId);
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [openColumnFilterColId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    visibleRows,
    openColumnFilterColId,
    filterPopoverPos,
    filterPopoverRef,
    openColumnFilter,
    cancelColumnFilter,
    applyColumnFilter,
    getUniqueFilterValues,
    columnFilterDraftValues,
    setColumnFilterDraftValues,
  };
}

/* ───────── Column filter popover (portal) ───────── */
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
          {uniqueValues.length === 0 ? (
            <div style={{ color: '#999', fontStyle: 'italic', padding: '4px 0' }}>No values</div>
          ) : (
            uniqueValues.map(val => {
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
            })
          )}
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

/* ───────── Filter icon button for table headers ───────── */
function FilterIconBtn({ colId, hook }) {
  const { openColumnFilterColId, openColumnFilter, cancelColumnFilter, columnFilterAllowedValues } = hook;
  const hasFilter = Array.isArray(columnFilterAllowedValues?.[colId]);
  return (
    <button type="button" title="Filter column" aria-label={`Filter ${colId}`}
      className={styles.columnFilterIconBtn}
      style={hasFilter ? { color: '#2563eb' } : undefined}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation();
        if (openColumnFilterColId === colId) cancelColumnFilter(colId);
        else openColumnFilter(colId, e);
      }}>
      <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M2.5 4.5h7L6 8z" />
      </svg>
    </button>
  );
}

export default function SparesManagement() {
  const navigate = useNavigate();

  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>SPARES MANAGEMENT</div>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/choice');}}>BACK</button>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>SPARES IN</div>
              <div className={styles.cardDesc}>Item-in details.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/spares/spares-in">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>SPARES OUT</div>
              <div className={styles.cardDesc}>Item-out details.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/spares/spares-out">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>SPARES OUT - RETURNABLE</div>
              <div className={styles.cardDesc}>Issue returnable items with service request tracking.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/spares/spares-out-returnable">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>SPARES IN - RETURNED</div>
              <div className={styles.cardDesc}>Receive returned quantities against service requests.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/spares/spares-in-returned">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>VIEW ITEM LOG</div>
              <div className={styles.cardDesc}>Complete history of an item.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/spares/view-item">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>COMPLETE STOCK CHECK</div>
              <div className={styles.cardDesc}>View and Download item details.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/spares/stock-check">OPEN</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

function SparesMasterListPage({ adminMode = false, closePath } = {}) {
  const navigate = useNavigate();
  const resolvedClose = closePath || (adminMode ? "/admin/admin-dashboard" : "/user/spares");

  const [partNo, setPartNo] = useState("");
  const [itemName, setItemName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [stores, setStores] = useState([]);
  const [itemLoc, setItemLoc] = useState("");
  const [noOfBins, setNoOfBins] = useState("");
  const [binNos, setBinNos] = useState([]);
  const [rackNo, setRackNo] = useState("");
  const [status, setStatus] = useState("");
  const [partSuggestions, setPartSuggestions] = useState([]);
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [editingExisting, setEditingExisting] = useState(false);

  // List
  const [allItems, setAllItems] = useState([]);

  const storeOptions = useMemo(() => {
    const s = new Set(stores);
    if (itemLoc && !s.has(itemLoc)) {
      return [...stores, itemLoc].sort((a, b) => String(a).localeCompare(String(b)));
    }
    return stores;
  }, [stores, itemLoc]);

  const loadAllItems = async () => {
    try {
      const res = await fetch(`${apiBase()}/spares/master`, { headers: authHeaders() });
      const data = await res.json();
      setAllItems(data.items || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const loadStores = async () => {
      try {
        const res = await fetch(`${apiBase()}/spares/stores`, { headers: authHeaders() });
        const data = await res.json();
        setStores(data.stores || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadStores();
    loadAllItems();
  }, []);

  useEffect(() => {
    const q = (partNo || "").trim();
    if (!q) {
      setPartSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `${apiBase()}/spares/master/search?pattern=${encodeURIComponent(q)}`,
          { headers: authHeaders() }
        );
        const data = await res.json();
        setPartSuggestions(data.matches || []);
      } catch {
        setPartSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [partNo]);

  const applyMasterDetail = (detail) => {
    setItemName(detail.item_name || "");
    setProjectName(detail.project_name || "");
    setItemLoc(detail.item_loc || "");
    setRackNo(detail.rack_no != null ? String(detail.rack_no) : "");
    setNoOfBins(detail.no_of_bins ?? "");
    setBinNos(normalizeBinNos(detail.bin_nos));
    setEditingExisting(true);
  };

  const handlePickPart = async (pn) => {
    const trimmed = (pn || "").trim();
    if (!trimmed) return;
    setPartNo(trimmed);
    setShowPartDropdown(false);
    try {
      const res = await fetch(
        `${apiBase()}/spares/master?part_no=${encodeURIComponent(trimmed)}`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const detail = await res.json();
        applyMasterDetail(detail);
      } else {
        setEditingExisting(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNoOfBinsChange = (e) => {
    const count = Number(e.target.value);
    setNoOfBins(count);
    setBinNos(Array(count).fill(""));
  };

  const handleBinNoChange = (index, value) => {
    const updated = [...binNos];
    updated[index] = value;
    setBinNos(updated);
  };

  const clearForm = () => {
    setPartNo("");
    setItemName("");
    setProjectName("");
    setItemLoc("");
    setNoOfBins("");
    setBinNos([]);
    setRackNo("");
    setStatus("");
    setEditingExisting(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!itemLoc) {
      setStatus("Please select a store.");
      return;
    }
    if (!projectName.trim()) {
      setStatus("Project name is required.");
      return;
    }

    const confirmSubmit = window.confirm(
      editingExisting
        ? `Update master item?\n\nPart No: ${partNo}\nName: ${itemName}`
        : `Add new item?\n\nPart No: ${partNo}\nName: ${itemName}`
    );
    if (!confirmSubmit) return;

    try {
      const payload = {
        part_no: partNo.trim(),
        item_name: itemName,
        project_name: projectName,
        no_of_bins: noOfBins,
        bin_nos: binNos,
        rack_no: rackNo,
        item_loc: itemLoc,
      };

      const url = editingExisting
        ? `${apiBase()}/spares/master/update`
        : `${apiBase()}/spares/master/add`;
      const method = editingExisting ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      alert(editingExisting ? "Item updated in master list!" : "Item added to master list!");
      setStatus(editingExisting ? "Item updated" : "Item added");
      clearForm();
      loadAllItems();
    } catch (err) {
      alert(err.message);
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (part_no) => {
    if (!window.confirm(`Delete "${part_no}" and all related spares data?\nThis cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiBase()}/spares/master/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ part_no }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      alert(data.message);
      loadAllItems();
    } catch (err) {
      alert(err.message);
    }
  };

  // Column definitions for multi-select filter
  const masterColumns = useMemo(() => [
    { id: 'part_no', label: 'PART NO', accessor: r => r.part_no ?? '' },
    { id: 'item_name', label: 'ITEM NAME', accessor: r => r.item_name ?? '' },
    { id: 'project_name', label: 'PROJECT NAME', accessor: r => (r.project_name || '').trim() || '' },
    { id: 'item_loc', label: 'STORE', accessor: r => r.item_loc ?? '' },
  ], []);

  const masterColFilter = useColumnFilters(allItems, masterColumns);
  const filteredItems = masterColFilter.visibleRows;

  // Sort: items with empty project at bottom, then alphabetical by project
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const pA = (a.project_name || '').trim();
      const pB = (b.project_name || '').trim();
      if (!pA && pB) return 1;
      if (pA && !pB) return -1;
      if (pA !== pB) return pA.localeCompare(pB);
      return (a.part_no || '').localeCompare(b.part_no || '');
    });
  }, [filteredItems]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          SPARES — MASTER LIST{adminMode ? " (ADMIN)" : ""}
        </div>
        <button
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={() => navigate(resolvedClose)}
        >
          BACK
        </button>
      </div>

      <div className={styles.card}>
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGrid2}>
            <div className={styles.autocompleteWrapper}>
              <label className={styles.label}>
                ITEM PART NO
                <input
                  className={styles.control}
                  value={partNo}
                  placeholder="Type or search part number…"
                  onChange={(e) => {
                    setPartNo(e.target.value);
                    setEditingExisting(false);
                    setShowPartDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowPartDropdown(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const q = (partNo || "").trim();
                    if (!q) return;
                    const exact = partSuggestions.find(
                      (m) => String(m.part_no).toLowerCase() === q.toLowerCase()
                    );
                    if (exact) {
                      handlePickPart(exact.part_no);
                      return;
                    }
                    if (partSuggestions.length === 1) {
                      handlePickPart(partSuggestions[0].part_no);
                    }
                  }}
                  required
                />
                {showPartDropdown && partSuggestions.length > 0 && (
                  <div className={styles.dropdown}>
                    {partSuggestions.map((m) => (
                      <div
                        key={m.part_no}
                        className={styles.dropdownItem}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handlePickPart(m.part_no)}
                      >
                        {m.part_no}
                        {m.item_name ? ` — ${m.item_name}` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </label>
            </div>

            <label className={styles.label}>
              ITEM NAME
              <input
                className={styles.control}
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              PROJECT NAME *
              <input
                className={styles.control}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              STORE NAME
              <select
                className={styles.control}
                value={itemLoc}
                onChange={(e) => setItemLoc(e.target.value)}
                required
              >
                <option value="">— Select store —</option>
                {storeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              RACK NO
              <input
                className={styles.control}
                type="text"
                value={rackNo}
                onChange={(e) => setRackNo(e.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              NO OF BINS
              <input
                className={styles.control}
                type="number"
                min="1"
                value={noOfBins}
                onChange={handleNoOfBinsChange}
                required
              />
            </label>

            {binNos.map((bin, index) => (
              <label className={styles.label} key={index}>
                BIN NO {index + 1}
                <input
                  className={styles.control}
                  value={bin}
                  onChange={(e) => handleBinNoChange(index, e.target.value)}
                  required
                />
              </label>
            ))}
          </div>

          {status && <div>{status}</div>}

          <div className={styles.pageActions}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
              {editingExisting ? "UPDATE ITEM" : "ADD ITEM"}
            </button>
          </div>
        </form>
      </div>

      {/* Items Table with Filters */}
      <div className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.pageTitle} style={{ marginBottom: 12 }}>ALL ITEMS ({filteredItems.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SL</th>
                <th>
                  <div className={styles.reportTh}>
                    <span>PROJECT NAME</span>
                    <FilterIconBtn colId="project_name" hook={masterColFilter} />
                  </div>
                </th>
                <th>
                  <div className={styles.reportTh}>
                    <span>ITEM NAME</span>
                    <FilterIconBtn colId="item_name" hook={masterColFilter} />
                  </div>
                </th>
                <th>
                  <div className={styles.reportTh}>
                    <span>PART NO</span>
                    <FilterIconBtn colId="part_no" hook={masterColFilter} />
                  </div>
                </th>
                <th>
                  <div className={styles.reportTh}>
                    <span>STORE</span>
                    <FilterIconBtn colId="item_loc" hook={masterColFilter} />
                  </div>
                </th>
                <th>QTY</th>
                {adminMode && <th>ACTION</th>}
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr><td colSpan={adminMode ? 7 : 6} style={{ textAlign: 'center', padding: 12 }}>No items found</td></tr>
              ) : (
                sortedItems.map((item, idx) => (
                  <tr key={item.part_no || idx} style={!(item.project_name || '').trim() ? { background: '#fff3cd' } : {}}>
                    <td>{idx + 1}</td>
                    <td>{(item.project_name || '').trim() || <span style={{ color: '#999', fontStyle: 'italic' }}>No Project</span>}</td>
                    <td>{item.item_name || '-'}</td>
                    <td>{item.part_no}</td>
                    <td>{item.item_loc || '-'}</td>
                    <td>{item.qty ?? 0}</td>
                    {adminMode && (
                      <td>
                        <button
                          className={`${styles.btn} ${styles.btnDanger}`}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => handleDelete(item.part_no)}
                        >
                          DELETE
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <ColumnFilterPopover hook={masterColFilter} columns={masterColumns} />
        </div>
      </div>
    </div>
  );
}

function SparesInPage() {
  const [items, setItems] = useState([]);
  const [selectedPart, setSelectedPart] = useState("");
  const [itemName, setItemName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [currentQty, setCurrentQty] = useState(0);
  const [qtyIn, setQtyIn] = useState("");
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const partMatches = usePartSuggestList(partSearch);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noOfBins, setNoOfBins] = useState("");
  const [binNos, setBinNos] = useState([]);
  const [itemLoc, setItemLoc] = useState("");
  const [rackNo, setRackNo] = useState("");
  const [recievedFrom, setRecievedFrom] = useState("");

  // Cascading filters
  const [projectFilter, setProjectFilter] = useState("");
  const [itemNameFilter, setItemNameFilter] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadMasterList();
  }, []);

  const loadMasterList = async () => {
    try {
      const res = await fetch(`${apiBase()}/spares/master`, {
        headers: authHeaders(),
      });

      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Cascading dropdown options
  const uniqueProjects = useMemo(() => [...new Set(items.map(i => i.project_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [items]);
  const filteredItemNames = useMemo(() => {
    const filtered = projectFilter ? items.filter(i => i.project_name === projectFilter) : items;
    return [...new Set(filtered.map(i => i.item_name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [items, projectFilter]);
  const filteredPartNos = useMemo(() => {
    let filtered = items;
    if (projectFilter) filtered = filtered.filter(i => i.project_name === projectFilter);
    if (itemNameFilter) filtered = filtered.filter(i => i.item_name === itemNameFilter);
    return filtered.map(i => i.part_no);
  }, [items, projectFilter, itemNameFilter]);

  // Merge partMatches with cascading filter — auto-suggest from master when filters active
  const displayedPartMatches = useMemo(() => {
    if (projectFilter || itemNameFilter) {
      let filtered = items;
      if (projectFilter) filtered = filtered.filter(i => i.project_name === projectFilter);
      if (itemNameFilter) filtered = filtered.filter(i => i.item_name === itemNameFilter);
      if (partSearch.trim()) {
        const q = partSearch.trim().toLowerCase();
        filtered = filtered.filter(i => String(i.part_no).toLowerCase().includes(q));
      }
      return filtered.map(i => ({ part_no: i.part_no, item_name: i.item_name }));
    }
    if (!partSearch.trim()) return [];
    return partMatches;
  }, [items, partMatches, projectFilter, itemNameFilter, partSearch]);

  // Auto-show dropdown when cascading filters produce matches
  useEffect(() => {
    if ((projectFilter || itemNameFilter) && displayedPartMatches.length > 0) setShowDropdown(true);
  }, [displayedPartMatches, projectFilter, itemNameFilter]);

  // Auto-select when exactly one part matches both filters
  useEffect(() => {
    if (projectFilter && itemNameFilter && filteredPartNos.length === 1) {
      const pn = filteredPartNos[0];
      setPartSearch(pn);
      setShowDropdown(false);
      handleSelectPart(pn);
    }
  }, [filteredPartNos.length, projectFilter, itemNameFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearForm = () => {
    setItemName("");
    setProjectName("");
    setCurrentQty("");
    setQtyIn("");
    setSelectedPart("");
    setStatus("");
    setRemarks("");
    setPartSearch("");
    setShowDropdown(false);
    setNoOfBins("");
    setBinNos([]);
    setRackNo("");
    setItemLoc("");
    setRecievedFrom("");
    setProjectFilter("");
    setItemNameFilter("");
  };

  const handleSelectPart = async (partNo) => {
    setSelectedPart(partNo);
    let item = items.find((i) => i.part_no === partNo);
    if (!item) {
      try {
        const res = await fetch(
          `${apiBase()}/spares/master?part_no=${encodeURIComponent(partNo)}`,
          { headers: authHeaders() }
        );
        if (res.ok) item = await res.json();
      } catch (e) {
        console.error(e);
      }
    }

    if (item) {
      setItemName(item.item_name);
      setProjectName(item.project_name || "");
      setCurrentQty(item.qty || 0);
      setNoOfBins(item.no_of_bins || 0);
      setBinNos(normalizeBinNos(item.bin_nos));
      setRackNo(item.rack_no || "");
      setItemLoc(item.item_loc || "");
      if (item.project_name) setProjectFilter(item.project_name);
      if (item.item_name) setItemNameFilter(item.item_name);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    const confirmSubmit = window.confirm(
      `Add quantity?\n\nPart No: ${selectedPart}\nQty In: ${qtyIn}`
    );
    if (!confirmSubmit) return;

    try {
      const res = await fetch(`${apiBase()}/spares/in`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          part_no: selectedPart,
          qty_in: Number(qtyIn),
          remarks: remarks,
          no_of_bins: noOfBins,
          bin_nos: binNos,
          rack_no: rackNo,
          item_loc: itemLoc,
          recieved_from: recievedFrom,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      alert("Quantity added!");
      setStatus("Quantity updated");
      setQtyIn("");
      setRecievedFrom("");
      clearForm();
      loadMasterList();
    } catch (err) {
      alert(err.message);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page}>
          <SectionNav section="spares" />
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>SPARES — ITEM IN</div>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => navigate("/user/spares")}
            >
              BACK
            </button>
          </div>

          <div className={styles.card}>
            <form onSubmit={onSubmit} className={styles.form}>
              <div className={styles.formGrid2}>
                <label className={styles.label}>
                  PROJECT NAME
                  <select className={styles.control} value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setItemNameFilter(""); setPartSearch(""); setSelectedPart(""); }}>
                    <option value="">— All Projects —</option>
                    {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>

                <label className={styles.label}>
                  ITEM NAME
                  <select className={styles.control} value={itemNameFilter} onChange={(e) => { setItemNameFilter(e.target.value); setPartSearch(""); setSelectedPart(""); }}>
                    <option value="">— All Items —</option>
                    {filteredItemNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>

                <div className={styles.autocompleteWrapper}>
                  <label className={styles.label}>
                    ITEM PART NO
                    <input
                      className={styles.control}
                      value={partSearch}
                      placeholder="Type part number..."
                      onChange={(e) => {
                      setPartSearch(e.target.value);
                      setShowDropdown(true);
                      }}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        const q = (partSearch || '').trim();
                        if (!q) return;
                        const exact =
                          displayedPartMatches.find((m) => String(m.part_no).toLowerCase() === q.toLowerCase()) ||
                          items.find((i) => String(i.part_no).toLowerCase() === q.toLowerCase());
                        if (exact) {
                          const p = exact.part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                          return;
                        }
                        if (displayedPartMatches.length === 1) {
                          const p = displayedPartMatches[0].part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                        }
                      }}
                    />

                    {showDropdown && displayedPartMatches.length > 0 && (
                    <div className={styles.dropdown}>
                      {displayedPartMatches.map((i) => (
                      <div
                        key={i.part_no}
                        className={styles.dropdownItem}
                        onClick={() => {
                        setPartSearch(i.part_no);
                        setShowDropdown(false);
                        handleSelectPart(i.part_no);
                      }}
                      >
                      {i.part_no}
                      </div>
                      ))}
                    </div>
                    )}
                  </label>
                </div>

                <label className={styles.label}>
                  ITEM NAME
                  <input
                    className={styles.control}
                    value={itemName}
                    readOnly
                  />
                </label>

                <label className={styles.label}>
                  PROJECT NAME
                  <input className={styles.control} value={projectName} readOnly />
                </label>

                <label className={styles.label}>
                  AVAILABLE QTY
                  <input className={styles.control} value={currentQty} readOnly />
                </label>
              </div>

              <div className={styles.formGrid2}>
                <label className={styles.label}>
                  NO OF BINS
                  <input
                    className={styles.control}
                    value={noOfBins}
                    readOnly
                  />
                </label>
                {binNos.map((bin, index) => (
                  <label className={styles.label} key={index}>
                    BIN NO {index + 1}
                    <input
                      className={styles.control}
                      value={bin}
                      readOnly
                    />
                  </label>
                ))}
                <label className={styles.label}>
                  RACK NO
                  <input className={styles.control} value={rackNo} readOnly />
                </label>
                <label className={styles.label}>
                  STORE NAME
                  <input
                    className={styles.control}
                    value={itemLoc}
                    readOnly
                  />
                </label>
              </div>
              <div className={styles.formGrid2}>
                <label className={styles.label}>
                  QUANTITY IN
                  <input
                    className={styles.control}
                    type="number"
                    value={qtyIn}
                    onChange={(e) => setQtyIn(e.target.value)}
                    required
                    min="1"
                  />
                </label>
                
                <label className={styles.label}>
                  RECIEVED FROM
                  <input
                    className={styles.control}
                    type="text"
                    value={recievedFrom}
                    onChange={(e) => setRecievedFrom(e.target.value)}
                    required
                  />
                </label>

                <label className={styles.label}>
                  REMARKS
                  <input
                    className={styles.control}
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </label>
              </div>
              {status && <div>{status}</div>}

              <div className={styles.pageActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`}>
                  ADD QUANTITY
                </button>
              </div>
            </form>
          </div>
    </div>
  );
}

function SparesOutPage() {
  const [items, setItems] = useState([]);
  const [selectedPart, setSelectedPart] = useState("");
  const [itemName, setItemName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [qtyAvailable, setQtyAvailable] = useState(0);
  const [qtyOut, setQtyOut] = useState("");
  const [handingTo, setHandingTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const partMatches = usePartSuggestList(partSearch);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noOfBins, setNoOfBins] = useState("");
  const [binNos, setBinNos] = useState([]);
  const [rackNo, setRackNo] = useState("");
  const [itemLoc, setItemLoc] = useState("");

  // Cascading filters
  const [projectFilter, setProjectFilter] = useState("");
  const [itemNameFilter, setItemNameFilter] = useState("");

  const navigate = useNavigate();

  // Load part numbers
  useEffect(() => {
    loadMasterList();
  }, []);

  const loadMasterList = async () => {
    try {
      const res = await fetch(`${apiBase()}/spares/master`, {
        headers: authHeaders(),
      });

      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Cascading dropdown options
  const uniqueProjects = useMemo(() => [...new Set(items.map(i => i.project_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [items]);
  const filteredItemNames = useMemo(() => {
    const filtered = projectFilter ? items.filter(i => i.project_name === projectFilter) : items;
    return [...new Set(filtered.map(i => i.item_name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [items, projectFilter]);
  const filteredPartNos = useMemo(() => {
    let filtered = items;
    if (projectFilter) filtered = filtered.filter(i => i.project_name === projectFilter);
    if (itemNameFilter) filtered = filtered.filter(i => i.item_name === itemNameFilter);
    return filtered.map(i => i.part_no);
  }, [items, projectFilter, itemNameFilter]);
  const displayedPartMatches = useMemo(() => {
    if (projectFilter || itemNameFilter) {
      let filtered = items;
      if (projectFilter) filtered = filtered.filter(i => i.project_name === projectFilter);
      if (itemNameFilter) filtered = filtered.filter(i => i.item_name === itemNameFilter);
      if (partSearch.trim()) {
        const q = partSearch.trim().toLowerCase();
        filtered = filtered.filter(i => String(i.part_no).toLowerCase().includes(q));
      }
      return filtered.map(i => ({ part_no: i.part_no, item_name: i.item_name }));
    }
    if (!partSearch.trim()) return [];
    return partMatches;
  }, [items, partMatches, projectFilter, itemNameFilter, partSearch]);

  useEffect(() => {
    if ((projectFilter || itemNameFilter) && displayedPartMatches.length > 0) setShowDropdown(true);
  }, [displayedPartMatches, projectFilter, itemNameFilter]);

  useEffect(() => {
    if (projectFilter && itemNameFilter && filteredPartNos.length === 1) {
      const pn = filteredPartNos[0];
      setPartSearch(pn);
      setShowDropdown(false);
      handleSelectPart(pn);
    }
  }, [filteredPartNos.length, projectFilter, itemNameFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearForm = () => {
    setItemName("");
    setProjectName("");
    setHandingTo("");
    setRemarks("");
    setQtyAvailable("");
    setQtyOut("");
    setSelectedPart("");
    setStatus("");
    setPartSearch("");
    setShowDropdown(false);
    setNoOfBins("");
    setBinNos([]);
    setRackNo("");
    setItemLoc("");
    setProjectFilter("");
    setItemNameFilter("");
  };

  // Auto-fill name + qty
  const handleSelectPart = async (partNo) => {
    setSelectedPart(partNo);
    let item = items.find((i) => i.part_no === partNo);
    if (!item) {
      try {
        const res = await fetch(
          `${apiBase()}/spares/master?part_no=${encodeURIComponent(partNo)}`,
          { headers: authHeaders() }
        );
        if (res.ok) item = await res.json();
      } catch (e) {
        console.error(e);
      }
    }

    if (item) {
      setItemName(item.item_name);
      setProjectName(item.project_name || "");
      setQtyAvailable(item.qty || 0);
      setNoOfBins(item.no_of_bins || 0);
      setBinNos(normalizeBinNos(item.bin_nos));
      setRackNo(item.rack_no || "");
      setItemLoc(item.item_loc || "");
      if (item.project_name) setProjectFilter(item.project_name);
      if (item.item_name) setItemNameFilter(item.item_name);
    }
  };

  // Submit OUT entry
  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    const confirmSubmit = window.confirm(
      `Issue quantity?\n\nPart No: ${selectedPart}\nQty Out: ${qtyOut}`
    );
    if (!confirmSubmit) return;

    try {
      const res = await fetch(`${apiBase()}/spares/out`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          part_no: selectedPart,
          qty_out: Number(qtyOut),
          handing_over_to: handingTo,
          remarks: remarks,
          no_of_bins: noOfBins,
          bin_nos: binNos,
          rack_no: rackNo,
          item_loc: itemLoc,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      alert("Item issued successfully!");

      setQtyOut("");
      setHandingTo("");
      setStatus("Item issued successfully");
      clearForm();
      loadMasterList(); // refresh qty
    } catch (err) {
      alert(err.message);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page}>
          <SectionNav section="spares" />
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>SPARES — ITEM OUT</div>

            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => navigate("/user/spares")}
            >
              BACK
            </button>
          </div>

          <div className={styles.card}>
            <form onSubmit={onSubmit} className={styles.form}>
              <div className={styles.formGrid2}>

                {/* Cascading Project + Item Name */}
                <label className={styles.label}>
                  PROJECT NAME
                  <select className={styles.control} value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setItemNameFilter(""); setPartSearch(""); setSelectedPart(""); }}>
                    <option value="">— All Projects —</option>
                    {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>

                <label className={styles.label}>
                  ITEM NAME
                  <select className={styles.control} value={itemNameFilter} onChange={(e) => { setItemNameFilter(e.target.value); setPartSearch(""); setSelectedPart(""); }}>
                    <option value="">— All Items —</option>
                    {filteredItemNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>

                {/* Part No */}
                <div className={styles.autocompleteWrapper}>
                  <label className={styles.label}>
                    ITEM PART NO
                    <input
                      className={styles.control}
                      value={partSearch}
                      placeholder="Type part number..."
                      onChange={(e) => {
                      setPartSearch(e.target.value);
                      setShowDropdown(true);
                      }}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        const q = (partSearch || '').trim();
                        if (!q) return;
                        const exact =
                          displayedPartMatches.find((m) => String(m.part_no).toLowerCase() === q.toLowerCase()) ||
                          items.find((i) => String(i.part_no).toLowerCase() === q.toLowerCase());
                        if (exact) {
                          const p = exact.part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                          return;
                        }
                        if (displayedPartMatches.length === 1) {
                          const p = displayedPartMatches[0].part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                        }
                      }}
                    />

                    {showDropdown && displayedPartMatches.length > 0 && (
                    <div className={styles.dropdown}>
                      {displayedPartMatches.map((i) => (
                      <div
                        key={i.part_no}
                        className={styles.dropdownItem}
                        onClick={() => {
                        setPartSearch(i.part_no);
                        setShowDropdown(false);
                        handleSelectPart(i.part_no);
                      }}
                      >
                      {i.part_no}
                      </div>
                      ))}
                    </div>
                    )}
                  </label>
                </div>

                {/* Item Name */}
                <label className={styles.label}>
                  ITEM NAME
                  <input className={styles.control} value={itemName} readOnly />
                </label>

                <label className={styles.label}>
                  PROJECT NAME
                  <input className={styles.control} value={projectName} readOnly />
                </label>

                {/* Qty Available */}
                <label className={styles.label}>
                  QTY AVAILABLE
                  <input
                    className={styles.control}
                    value={qtyAvailable}
                    readOnly
                  />
                </label>
              </div>

              <div className={styles.formGrid2}>
                <label className={styles.label}>
                  NO OF BINS
                  <input
                    className={styles.control}
                    value={noOfBins}
                    readOnly
                  />
                </label>
                {binNos.map((bin, index) => (
                  <label className={styles.label} key={index}>
                    BIN NO {index + 1}
                    <input
                      className={styles.control}
                      value={bin}
                      readOnly
                    />
                  </label>
                ))}
                <label className={styles.label}>
                  RACK NO
                  <input className={styles.control} value={rackNo} readOnly />
                </label>
                <label className={styles.label}>
                  STORE NAME
                  <input className={styles.control} value={itemLoc} readOnly />
                </label>
              </div>

              <div className={styles.formGrid2}>
                {/* Qty Out */}
                <label className={styles.label}>
                  QUANTITY OUT
                  <input
                    className={styles.control}
                    type="number"
                    value={qtyOut}
                    onChange={(e) => setQtyOut(e.target.value)}
                    required
                    min="1"
                  />
                </label>

                {/* Handing Over To */}
                <label className={styles.label}>
                  HANDING OVER TO
                  <input
                    className={styles.control}
                    type="text"
                    value={handingTo}
                    onChange={(e) => setHandingTo(e.target.value)}
                    required
                  />
                </label>

                <label className={styles.label}>
                  REMARKS
                  <input
                    className={styles.control}
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </label>
              </div>
              {status && <div>{status}</div>}

              <div className={styles.pageActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`}>
                  ISSUE ITEM
                </button>
              </div>
            </form>
          </div>
    </div>
  );
}


function SparesOutReturnablePage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [items, setItems] = useState([]);
  const [selectedPart, setSelectedPart] = useState("");
  const [itemName, setItemName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [qtyAvailable, setQtyAvailable] = useState(0);
  const [qtyOut, setQtyOut] = useState("");
  const [date, setDate] = useState(today);
  const [handedOverByCs, setHandedOverByCs] = useState("");
  const [receivedByTs, setReceivedByTs] = useState("");
  const [remarks, setRemarks] = useState("");
  const [serviceRequestNo, setServiceRequestNo] = useState("");
  const [createdServiceRequestNo, setCreatedServiceRequestNo] = useState("");
  const [status, setStatus] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const partMatches = usePartSuggestList(partSearch);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noOfBins, setNoOfBins] = useState("");
  const [binNos, setBinNos] = useState([]);
  const [rackNo, setRackNo] = useState("");
  const [itemLoc, setItemLoc] = useState("");

  // Cascading filters
  const [projectFilter, setProjectFilter] = useState("");
  const [itemNameFilter, setItemNameFilter] = useState("");

  const navigate = useNavigate();

  const loadMasterList = async () => {
    try {
      const res = await fetch(`${apiBase()}/spares/master`, { headers: authHeaders() });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadNextServiceRequestNo = async () => {
    try {
      const res = await fetch(`${apiBase()}/spares/returnable/next-service-request`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setServiceRequestNo(String(data.nextServiceRequestNo || ""));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMasterList();
    loadNextServiceRequestNo();
  }, []);

  // Cascading dropdown options
  const uniqueProjects = useMemo(() => [...new Set(items.map(i => i.project_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [items]);
  const filteredItemNames = useMemo(() => {
    const filtered = projectFilter ? items.filter(i => i.project_name === projectFilter) : items;
    return [...new Set(filtered.map(i => i.item_name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [items, projectFilter]);
  const filteredPartNos = useMemo(() => {
    let filtered = items;
    if (projectFilter) filtered = filtered.filter(i => i.project_name === projectFilter);
    if (itemNameFilter) filtered = filtered.filter(i => i.item_name === itemNameFilter);
    return filtered.map(i => i.part_no);
  }, [items, projectFilter, itemNameFilter]);
  const displayedPartMatches = useMemo(() => {
    if (projectFilter || itemNameFilter) {
      let filtered = items;
      if (projectFilter) filtered = filtered.filter(i => i.project_name === projectFilter);
      if (itemNameFilter) filtered = filtered.filter(i => i.item_name === itemNameFilter);
      if (partSearch.trim()) {
        const q = partSearch.trim().toLowerCase();
        filtered = filtered.filter(i => String(i.part_no).toLowerCase().includes(q));
      }
      return filtered.map(i => ({ part_no: i.part_no, item_name: i.item_name }));
    }
    if (!partSearch.trim()) return [];
    return partMatches;
  }, [items, partMatches, projectFilter, itemNameFilter, partSearch]);

  useEffect(() => {
    if ((projectFilter || itemNameFilter) && displayedPartMatches.length > 0) setShowDropdown(true);
  }, [displayedPartMatches, projectFilter, itemNameFilter]);

  useEffect(() => {
    if (projectFilter && itemNameFilter && filteredPartNos.length === 1) {
      const pn = filteredPartNos[0];
      setPartSearch(pn);
      setShowDropdown(false);
      handleSelectPart(pn);
    }
  }, [filteredPartNos.length, projectFilter, itemNameFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearForm = () => {
    setSelectedPart("");
    setPartSearch("");
    setShowDropdown(false);
    setItemName("");
    setProjectName("");
    setQtyAvailable(0);
    setNoOfBins("");
    setBinNos([]);
    setRackNo("");
    setItemLoc("");
    setQtyOut("");
    setDate(today);
    setHandedOverByCs("");
    setReceivedByTs("");
    setRemarks("");
    setStatus("");
    setProjectFilter("");
    setItemNameFilter("");
  };

  const handleSelectPart = async (partNo) => {
    setSelectedPart(partNo);
    let item = items.find((i) => i.part_no === partNo);
    if (!item) {
      try {
        const res = await fetch(
          `${apiBase()}/spares/master?part_no=${encodeURIComponent(partNo)}`,
          { headers: authHeaders() }
        );
        if (res.ok) item = await res.json();
      } catch (e) {
        console.error(e);
      }
    }

    if (item) {
      setItemName(item.item_name || "");
      setProjectName(item.project_name || "");
      setQtyAvailable(item.qty || 0);
      setNoOfBins(item.no_of_bins || 0);
      setBinNos(normalizeBinNos(item.bin_nos));
      setRackNo(item.rack_no || "");
      setItemLoc(item.item_loc || "");
      if (item.project_name) setProjectFilter(item.project_name);
      if (item.item_name) setItemNameFilter(item.item_name);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    const confirmSubmit = window.confirm(
      `Issue returnable quantity?\n\nPart No: ${selectedPart}\nQty Handed Over: ${qtyOut}`
    );
    if (!confirmSubmit) return;

    try {
      const res = await fetch(`${apiBase()}/spares/out-returnable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          part_no: selectedPart,
          qty_out: Number(qtyOut),
          date,
          handed_over_by_cs: handedOverByCs,
          received_by_ts: receivedByTs,
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      setCreatedServiceRequestNo(String(data.serviceRequestNo || ""));
      setQtyAvailable(Number(data.new_qty || 0));
      alert(`Returnable issue created. Service Request No: ${data.serviceRequestNo}`);

      setQtyOut('');
      setHandedOverByCs('');
      setReceivedByTs('');
      setRemarks('');
      setStatus(`Service Request ${data.serviceRequestNo} created`);
      await loadMasterList();
      await loadNextServiceRequestNo();
    } catch (err) {
      alert(err.message);
      setStatus(`Error: ${err.message}`);
    }
  };

  const downloadForm = async () => {
    const srToDownload = createdServiceRequestNo || serviceRequestNo;
    if (!srToDownload) {
      alert("No Service Request available to download");
      return;
    }
    try {
      const res = await fetch(
        `${apiBase()}/spares/out-returnable/download-form?serviceRequestNo=${encodeURIComponent(srToDownload)}`,
        { headers: authHeaders() }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || "Download failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Service_Request_${srToDownload}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page}>
      <SectionNav section="spares" />
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>SPARES — OUT RETURNABLE</div>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate("/user/spares")}>BACK</button>
      </div>

      <div className={styles.card}>
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGrid2}>
            <label className={styles.label}>SERVICE REQUEST
              <input className={styles.control} value={serviceRequestNo} readOnly />
            </label>

            <label className={styles.label}>DATE
              <input className={styles.control} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>

            <label className={styles.label}>PROJECT NAME
              <select className={styles.control} value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setItemNameFilter(""); setPartSearch(""); setSelectedPart(""); }}>
                <option value="">— All Projects —</option>
                {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

            <label className={styles.label}>ITEM NAME (FILTER)
              <select className={styles.control} value={itemNameFilter} onChange={(e) => { setItemNameFilter(e.target.value); setPartSearch(""); setSelectedPart(""); }}>
                <option value="">— All Items —</option>
                {filteredItemNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>

            <div className={styles.autocompleteWrapper}>
              <label className={styles.label}>ITEM PART NO
                <input
                  className={styles.control}
                  value={partSearch}
                  placeholder="Type part number..."
                  onChange={(e) => {
                    setPartSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    const q = (partSearch || '').trim();
                    if (!q) return;
                    const exact =
                      displayedPartMatches.find((m) => String(m.part_no).toLowerCase() === q.toLowerCase()) ||
                      items.find((i) => String(i.part_no).toLowerCase() === q.toLowerCase());
                    if (exact) {
                      const p = exact.part_no;
                      setPartSearch(p);
                      setShowDropdown(false);
                      handleSelectPart(p);
                    }
                  }}
                  required
                />
                {showDropdown && displayedPartMatches.length > 0 && (
                  <div className={styles.dropdown}>
                    {displayedPartMatches.map((i) => (
                      <div
                        key={i.part_no}
                        className={styles.dropdownItem}
                        onClick={() => {
                          setPartSearch(i.part_no);
                          setShowDropdown(false);
                          handleSelectPart(i.part_no);
                        }}
                      >
                        {i.part_no}
                      </div>
                    ))}
                  </div>
                )}
              </label>
            </div>

            <label className={styles.label}>ITEM NAME
              <input className={styles.control} value={itemName} readOnly />
            </label>

            <label className={styles.label}>PROJECT NAME
              <input className={styles.control} value={projectName} readOnly />
            </label>

            <label className={styles.label}>AVAILABLE QTY
              <input className={styles.control} value={qtyAvailable} readOnly />
            </label>
          </div>

          <div className={styles.formGrid2}>
            <label className={styles.label}>NO OF BINS
              <input className={styles.control} value={noOfBins} readOnly />
            </label>

            {binNos.map((bin, index) => (
              <label className={styles.label} key={index}>BIN NO {index + 1}
                <input className={styles.control} value={bin} readOnly />
              </label>
            ))}

            <label className={styles.label}>RACK NO
              <input className={styles.control} value={rackNo} readOnly />
            </label>

            <label className={styles.label}>STORE NAME
              <input className={styles.control} value={itemLoc} readOnly />
            </label>
          </div>

          <div className={styles.formGrid2}>
            <label className={styles.label}>QTY HANDED OVER
              <input className={styles.control} type="number" min="1" value={qtyOut} onChange={(e) => setQtyOut(e.target.value)} required />
            </label>

            <label className={styles.label}>HANDED OVER BY (CS)
              <input className={styles.control} value={handedOverByCs} onChange={(e) => setHandedOverByCs(e.target.value)} required />
            </label>

            <label className={styles.label}>RECEIVED BY (TS)
              <input className={styles.control} value={receivedByTs} onChange={(e) => setReceivedByTs(e.target.value)} required />
            </label>

            <label className={styles.label}>REQUEST DETAILS
              <input className={styles.control} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </label>
          </div>

          {status && <div>{status}</div>}

          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">ISSUE RETURNABLE</button>
            <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={downloadForm}>
              DOWNLOAD FORM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function SparesInReturnedPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [requests, setRequests] = useState([]);
  const [serviceRequestNo, setServiceRequestNo] = useState('');
  const [detail, setDetail] = useState(null);
  const [qtyAvailable, setQtyAvailable] = useState(0);
  const [dateIn, setDateIn] = useState(today);
  const [qtyIn, setQtyIn] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('');

  const navigate = useNavigate();

  const loadRequests = async () => {
    try {
      const res = await fetch(`${apiBase()}/spares/out-returnable/list`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setRequests(data.requests || []);
    } catch (err) {
      setRequests([]);
      console.error(err);
    }
  };

  const loadDetail = async (srNo) => {
    if (!srNo) {
      setDetail(null);
      setQtyAvailable(0);
      return;
    }
    try {
      const res = await fetch(`${apiBase()}/spares/out-returnable/${encodeURIComponent(srNo)}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setDetail(data);

      if (data.part_no) {
        const partRes = await fetch(`${apiBase()}/spares/master?part_no=${encodeURIComponent(data.part_no)}`, { headers: authHeaders() });
        if (partRes.ok) {
          const partData = await partRes.json();
          setQtyAvailable(partData.qty || 0);
        }
      }
    } catch (err) {
      setDetail(null);
      setQtyAvailable(0);
      setStatus(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const onServiceRequestChange = async (value) => {
    setServiceRequestNo(value);
    setStatus('');
    await loadDetail(value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    if (!serviceRequestNo) {
      alert('Select Service Request No');
      return;
    }

    const confirmSubmit = window.confirm(
      `Receive returned qty?\n\nService Request: ${serviceRequestNo}\nQty In: ${qtyIn}`
    );
    if (!confirmSubmit) return;

    try {
      const res = await fetch(`${apiBase()}/spares/in-returned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          serviceRequestNo: Number(serviceRequestNo),
          date_in: dateIn,
          qty_in: Number(qtyIn),
          received_from: receivedFrom,
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');

      setStatus('Returned quantity received successfully');
      setQtyAvailable(Number(data.new_qty || 0));
      setQtyIn('');
      setReceivedFrom('');
      setRemarks('');

      await loadRequests();
      await loadDetail(serviceRequestNo);
    } catch (err) {
      alert(err.message);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page}>
      <SectionNav section="spares" />
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>SPARES — IN RETURNED</div>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => navigate('/user/spares')}>BACK</button>
      </div>

      <div className={styles.card}>
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGrid2}>
            <label className={styles.label}>SERVICE REQUEST NO
              <select className={styles.control} value={serviceRequestNo} onChange={(e) => onServiceRequestChange(e.target.value)} required>
                <option value="">SELECT SERVICE REQUEST</option>
                {requests.map((r) => (
                  <option key={r.serviceRequestNo} value={r.serviceRequestNo}>
                    {r.serviceRequestNo} - {r.part_no} (BAL: {r.outstanding_qty})
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>DATE IN
              <input className={styles.control} type="date" value={dateIn} onChange={(e) => setDateIn(e.target.value)} required />
            </label>

            <label className={styles.label}>QTY IN
              <input className={styles.control} type="number" min="1" value={qtyIn} onChange={(e) => setQtyIn(e.target.value)} required />
            </label>

            <label className={styles.label}>RECEIVED FROM
              <input className={styles.control} value={receivedFrom} onChange={(e) => setReceivedFrom(e.target.value)} required />
            </label>

            <label className={styles.label}>AVAILABLE QTY
              <input className={styles.control} value={qtyAvailable} readOnly />
            </label>

            <label className={styles.label}>REMARKS
              <input className={styles.control} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </label>
          </div>

          {detail ? (
            <div className={styles.card} style={{ marginTop: 12 }}>
              <div><b>Part No:</b> {detail.part_no || '-'}</div>
              <div><b>Item Name:</b> {detail.item_name || '-'}</div>
              <div><b>Project Name:</b> {detail.project_name || '-'}</div>
              <div><b>Qty Handed Over:</b> {detail.qty_handed_over || 0}</div>
              <div><b>Qty Returned:</b> {detail.qty_returned || 0}</div>
              <div><b>Outstanding Qty:</b> {detail.outstanding_qty || 0}</div>
            </div>
          ) : null}

          {status && <div>{status}</div>}

          <div className={styles.pageActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">ADD RETURN</button>
          </div>
        </form>
      </div>
    </div>
  );
}


function ViewItemPage() {
  const [items, setItems] = useState([]);
  const [selectedPart, setSelectedPart] = useState("");
  const [itemName, setItemName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [itemLoc, setItemLoc] = useState("");
  const [rackNo, setRackNo] = useState("");
  const [noOfBins, setNoOfBins] = useState(0);
  const [binNos, setBinNos] = useState([]);
  const [qtyAvailable, setQtyAvailable] = useState(0);
  const [auditList, setAuditList] = useState([]);
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const partMatches = usePartSuggestList(partSearch);
  const [showDropdown, setShowDropdown] = useState(false);

  // Cascading filters
  const [projectFilter, setProjectFilter] = useState("");
  const [itemNameFilter, setItemNameFilter] = useState("");

  const navigate = useNavigate();
  
  const formatDateTime = (isoDate) => {
  const d = new Date(isoDate);
  d.setMinutes(d.getMinutes() + 330);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${mins}`;
  };

  // Load master list
  useEffect(() => {
    loadMasterList();
  }, []);

  const loadMasterList = async () => {
    try {
      const res = await fetch(`${apiBase()}/spares/master`, {
        headers: authHeaders(),
      });

      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Cascading dropdown options
  const uniqueProjects = useMemo(() => [...new Set(items.map(i => i.project_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [items]);
  const filteredItemNames = useMemo(() => {
    const filtered = projectFilter ? items.filter(i => i.project_name === projectFilter) : items;
    return [...new Set(filtered.map(i => i.item_name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [items, projectFilter]);
  const filteredPartNos = useMemo(() => {
    let filtered = items;
    if (projectFilter) filtered = filtered.filter(i => i.project_name === projectFilter);
    if (itemNameFilter) filtered = filtered.filter(i => i.item_name === itemNameFilter);
    return filtered.map(i => i.part_no);
  }, [items, projectFilter, itemNameFilter]);
  const displayedPartMatches = useMemo(() => {
    if (projectFilter || itemNameFilter) {
      let filtered = items;
      if (projectFilter) filtered = filtered.filter(i => i.project_name === projectFilter);
      if (itemNameFilter) filtered = filtered.filter(i => i.item_name === itemNameFilter);
      if (partSearch.trim()) {
        const q = partSearch.trim().toLowerCase();
        filtered = filtered.filter(i => String(i.part_no).toLowerCase().includes(q));
      }
      return filtered.map(i => ({ part_no: i.part_no, item_name: i.item_name }));
    }
    if (!partSearch.trim()) return [];
    return partMatches;
  }, [items, partMatches, projectFilter, itemNameFilter, partSearch]);

  useEffect(() => {
    if ((projectFilter || itemNameFilter) && displayedPartMatches.length > 0) setShowDropdown(true);
  }, [displayedPartMatches, projectFilter, itemNameFilter]);

  useEffect(() => {
    if (projectFilter && itemNameFilter && filteredPartNos.length === 1) {
      const pn = filteredPartNos[0];
      setPartSearch(pn);
      setShowDropdown(false);
      handleSelectPart(pn);
    }
  }, [filteredPartNos.length, projectFilter, itemNameFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterAudit = async () => {
    const res = await fetch(
      `${apiBase()}/spares/audit/filter?part_no=${selectedPart}&start_date=${startDate}&end_date=${endDate}`,
      { headers: authHeaders() }
    );

    const data = await res.json();
    setAuditList(data.audit || []);
  };

  useEffect(() => {
    filterAudit(); // load all items on first render
  }, []);

  // Load item + audit when part selected
  const handleSelectPart = async (partNo) => {
    setSelectedPart(partNo);

    if (!partNo) return;

    try {
      // Item details
      const detailRes = await fetch(
        `${apiBase()}/spares/master?part_no=${partNo}`,
        { headers: authHeaders() }
      );
      const detail = await detailRes.json();

      setItemName(detail.item_name || "");
      setProjectName(detail.project_name || "");
      setItemLoc(detail.item_loc || "");
      setRackNo(detail.rack_no || "");
      setNoOfBins(detail.no_of_bins || 0);
      setBinNos(normalizeBinNos(detail.bin_nos));
      setQtyAvailable(detail.qty || 0);
      if (detail.project_name) setProjectFilter(detail.project_name);
      if (detail.item_name) setItemNameFilter(detail.item_name);

      // Audit list
      const auditRes = await fetch(
        `${apiBase()}/spares/audit?part_no=${partNo}`,
        { headers: authHeaders() }
      );
      const audit = await auditRes.json();
      setAuditList(audit.audit || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.page}>
          <SectionNav section="spares" />
          {/* Page Title */}
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>VIEW ITEM</div>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => navigate("/user/spares")}
            >
              BACK
            </button>
          </div>

          <div className={styles.card}>
            {/* FORM SECTION */}
            <div className={styles.form}>
              <div className={styles.formGrid2}>
                <label className={styles.label}>
                  PROJECT NAME
                  <select className={styles.control} value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setItemNameFilter(""); setPartSearch(""); setSelectedPart(""); }}>
                    <option value="">— All Projects —</option>
                    {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>

                <label className={styles.label}>
                  ITEM NAME (FILTER)
                  <select className={styles.control} value={itemNameFilter} onChange={(e) => { setItemNameFilter(e.target.value); setPartSearch(""); setSelectedPart(""); }}>
                    <option value="">— All Items —</option>
                    {filteredItemNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>

                <div className={styles.autocompleteWrapper}>
                  <label className={styles.label}>
                    ITEM PART NO
                    <input
                      className={styles.control}
                      value={partSearch}
                      placeholder="Type part number..."
                      onChange={(e) => {
                      setPartSearch(e.target.value);
                      setShowDropdown(true);
                      }}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        const q = (partSearch || '').trim();
                        if (!q) return;
                        const exact =
                          displayedPartMatches.find((m) => String(m.part_no).toLowerCase() === q.toLowerCase()) ||
                          items.find((i) => String(i.part_no).toLowerCase() === q.toLowerCase());
                        if (exact) {
                          const p = exact.part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                          return;
                        }
                        if (displayedPartMatches.length === 1) {
                          const p = displayedPartMatches[0].part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                        }
                      }}
                    />

                    {showDropdown && displayedPartMatches.length > 0 && (
                    <div className={styles.dropdown}>
                      {displayedPartMatches.map((i) => (
                      <div
                        key={i.part_no}
                        className={styles.dropdownItem}
                        onClick={() => {
                        setPartSearch(i.part_no);
                        setShowDropdown(false);
                        handleSelectPart(i.part_no);
                      }}
                      >
                      {i.part_no}
                      </div>
                      ))}
                    </div>
                    )}
                  </label>
                </div>

                <label className={styles.label}>
                  ITEM NAME
                  <input
                    className={styles.control}
                    value={itemName}
                    readOnly
                  />
                </label>
                <label className={styles.label}>
                  PROJECT NAME
                  <input className={styles.control} value={projectName} readOnly />
                </label>
                <label className={styles.label}>
                  STORE NAME
                  <input
                    className={styles.control}
                    value={itemLoc}
                    readOnly
                  />
                </label>
                <label className={styles.label}>
                  RACK NO
                  <input
                    className={styles.control}
                    value={rackNo}
                    readOnly
                  />
                </label>
                <label className={styles.label}>
                  NO OF BINS
                  <input
                    className={styles.control}
                    value={noOfBins}
                    readOnly
                  />
                </label>
                <label className={styles.label}>
                  BIN NO(S)
                  <input
                    className={styles.control}
                    value={binNos.join(", ")}
                    readOnly
                  />
                </label>
                <label className={styles.label}>
                  AVAILABLE QTY
                  <input
                    className={styles.control}
                    value={qtyAvailable}
                    readOnly
                  />
                </label>
              </div>
            </div>
          </div>

           {/* Date Range Filter Section */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label className={styles.label}>From:</label>
              <input
                className={styles.control}
                type="date"
                onChange={(e) => setStart(e.target.value)}
              />
            </div>

            <div>
              <label className={styles.label}>To:</label>
                <input
                  className={styles.control}
                  type="date"
                  onChange={(e) => setEnd(e.target.value)}
                />
            </div>

              <button className= {`${styles.btn} ${styles.btnPrimary}`} onClick={filterAudit}>Filter</button>
          </div>

          {/* AUDIT TABLE */}
            <div className={styles.card} style={{ marginTop: "20px" }}>
              <div className={styles.pageTitle}>HISTORY</div>
              <div class="table-scroll">
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Sl No</th>
                      <th>User</th>
                      <th>Date</th>
                      <th>Project</th>
                      <th>In</th>
                      <th>Out</th>
                      <th>Qty As On Date</th>
                      <th>Handed To / Recieved From</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>

                  <tbody>
                    {auditList.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: "center", padding: "15px" }}>
                          No records found
                        </td>
                      </tr>
                    ) : (
                      auditList.map((row, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{row.user?.username}</td>
                          <td>{formatDateTime(row.date)}</td>
                          <td>{row.project_name || "-"}</td>
                          <td>{row.in || "-"}</td>
                          <td>{row.out || "-"}</td>
                          <td>{row.qty_after}</td>
                          <td>{row.out ? row.handing_over_to || "-" :row.in ? row.recieved_from || "-" : "-"}</td>
                          <td>{row.remarks || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
    </div>
  );
}

function StockCheckPage() {
  const [items, setItems] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const navigate = useNavigate();

  // Fetch items
  const loadStock = async () => {
    try {
      const res = await fetch(`${apiBase()}/spares/master`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  // VIEW button clicked
  const handleView = () => {
    loadStock();
    setShowTable(true);
  };

  // DOWNLOAD button clicked
  const handleDownload = () => {
    window.open(`${apiBase()}/spares/stock`, "_blank");
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const parse = (val) => {
        const str = String(val).trim();
        const match = str.match(/^([a-zA-Z\-]*)(\d+)/);
        return {
          prefix: match ? match[1] : str,
          number: match ? parseInt(match[2], 10) : 0,
        };
      };
      const A = parse(a.part_no);
      const B = parse(b.part_no);
      if (A.prefix !== B.prefix) return A.prefix.localeCompare(B.prefix);
      return A.number - B.number;
    });
  }, [items]);

  // Column definitions for the multi-select filter
  const stockColumns = useMemo(() => [
    { id: 'part_no', label: 'Part No', accessor: r => r.part_no ?? '' },
    { id: 'item_name', label: 'Item Name', accessor: r => r.item_name ?? '' },
    { id: 'project_name', label: 'Project Name', accessor: r => (r.project_name || '').trim() || '' },
    { id: 'item_loc', label: 'Store Name', accessor: r => r.item_loc ?? '' },
    { id: 'rack_no', label: 'Rack No', accessor: r => r.rack_no ?? '' },
  ], []);

  const colFilter = useColumnFilters(sortedItems, stockColumns);
  const filteredItems = colFilter.visibleRows;

  return (
    <div className={styles.page}>
          <SectionNav section="spares" />
          {/* Header */}
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>STOCK CHECK</div>
            <button className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => navigate("/user/spares")}
            >
              BACK
            </button>
          </div>

          {/* Buttons */}
          <div className={styles.card}>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleView}>
                VIEW
              </button>

              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleDownload}>
                DOWNLOAD
              </button>
            </div>
          </div>

          {/* TABLE */}
          {showTable && (
            <div className={styles.card} style={{ marginTop: "20px", overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sl No</th>
                    <th>
                      <div className={styles.reportTh}>
                        <span>Part No</span>
                        <FilterIconBtn colId="part_no" hook={colFilter} />
                      </div>
                    </th>
                    <th>
                      <div className={styles.reportTh}>
                        <span>Item Name</span>
                        <FilterIconBtn colId="item_name" hook={colFilter} />
                      </div>
                    </th>
                    <th>
                      <div className={styles.reportTh}>
                        <span>Project Name</span>
                        <FilterIconBtn colId="project_name" hook={colFilter} />
                      </div>
                    </th>
                    <th>
                      <div className={styles.reportTh}>
                        <span>Store Name</span>
                        <FilterIconBtn colId="item_loc" hook={colFilter} />
                      </div>
                    </th>
                    <th>
                      <div className={styles.reportTh}>
                        <span>Rack No</span>
                        <FilterIconBtn colId="rack_no" hook={colFilter} />
                      </div>
                    </th>
                    <th>No of Bins</th>
                    <th>Bin No</th>
                    <th>Qty</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>No items</td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.part_no}</td>
                        <td>{item.item_name}</td>
                        <td>{item.project_name || "-"}</td>
                        <td>{item.item_loc || "-"}</td>
                        <td>{item.rack_no || "-"}</td>
                        <td>{item.no_of_bins ?? 0}</td>
                        <td>{item.bin_nos ? item.bin_nos.join(", ") : "-"}</td>
                        <td>{item.qty ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <ColumnFilterPopover hook={colFilter} columns={stockColumns} />
            </div>
          )}
    </div>
  );
}

export { SparesMasterListPage, SparesInPage, SparesOutPage, SparesOutReturnablePage, SparesInReturnedPage, ViewItemPage, StockCheckPage };

