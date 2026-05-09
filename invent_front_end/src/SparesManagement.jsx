import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import styles from './components/styles.module.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import React from 'react';
import { apiBase, authHeaders } from './apiConfig';

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

  const storeOptions = useMemo(() => {
    const s = new Set(stores);
    if (itemLoc && !s.has(itemLoc)) {
      return [...stores, itemLoc].sort((a, b) => String(a).localeCompare(String(b)));
    }
    return stores;
  }, [stores, itemLoc]);

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
    } catch (err) {
      alert(err.message);
      setStatus(`Error: ${err.message}`);
    }
  };

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
              PROJECT NAME
              <input
                className={styles.control}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Optional"
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
                          partMatches.find((m) => String(m.part_no).toLowerCase() === q.toLowerCase()) ||
                          items.find((i) => String(i.part_no).toLowerCase() === q.toLowerCase());
                        if (exact) {
                          const p = exact.part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                          return;
                        }
                        if (partMatches.length === 1) {
                          const p = partMatches[0].part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                        }
                      }}
                    />

                    {showDropdown && partMatches.length > 0 && (
                    <div className={styles.dropdown}>
                      {partMatches.map((i) => (
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
                          partMatches.find((m) => String(m.part_no).toLowerCase() === q.toLowerCase()) ||
                          items.find((i) => String(i.part_no).toLowerCase() === q.toLowerCase());
                        if (exact) {
                          const p = exact.part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                          return;
                        }
                        if (partMatches.length === 1) {
                          const p = partMatches[0].part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                        }
                      }}
                    />

                    {showDropdown && partMatches.length > 0 && (
                    <div className={styles.dropdown}>
                      {partMatches.map((i) => (
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
                      partMatches.find((m) => String(m.part_no).toLowerCase() === q.toLowerCase()) ||
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
                {showDropdown && partMatches.length > 0 && (
                  <div className={styles.dropdown}>
                    {partMatches.map((i) => (
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

            <label className={styles.label}>REMARKS
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
                          partMatches.find((m) => String(m.part_no).toLowerCase() === q.toLowerCase()) ||
                          items.find((i) => String(i.part_no).toLowerCase() === q.toLowerCase());
                        if (exact) {
                          const p = exact.part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                          return;
                        }
                        if (partMatches.length === 1) {
                          const p = partMatches[0].part_no;
                          setPartSearch(p);
                          setShowDropdown(false);
                          handleSelectPart(p);
                        }
                      }}
                    />

                    {showDropdown && partMatches.length > 0 && (
                    <div className={styles.dropdown}>
                      {partMatches.map((i) => (
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

  const sortedItems = [...items].sort((a, b) => {
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

    if (A.prefix !== B.prefix) {
    return A.prefix.localeCompare(B.prefix);
    }
    return A.number - B.number;
  });

  return (
    <div className={styles.page}>
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
            <div className={styles.card} style={{ marginTop: "20px" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sl No</th>
                    <th>Part No</th>
                    <th>Item Name</th>
                    <th>Project Name</th>
                    <th>Store Name</th>
                    <th>Rack No</th>
                    <th>No of Bins</th>
                    <th>Bin No</th>
                    <th>Qty</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>No items</td>
                    </tr>
                  ) : (
                    sortedItems.map((item, index) => (
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
            </div>
          )}
    </div>
  );
}

export { SparesMasterListPage, SparesInPage, SparesOutPage, SparesOutReturnablePage, SparesInReturnedPage, ViewItemPage, StockCheckPage };

