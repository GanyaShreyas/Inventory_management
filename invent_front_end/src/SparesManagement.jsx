import Header from './components/header';
import Sidebar from './components/sidebar';
import Footer from './components/footer';
import styles from './components/styles.module.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import React from 'react';

function apiBase() {
  return 'http://localhost:8000/api';
}

function authHeaders() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
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
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => {navigate('/choice');}}>CLOSE</button>
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
              <div className={styles.cardTitle}>VIEW ITEM LOG</div>
              <div className={styles.cardDesc}>Complete history of an item.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/spares/view-item">OPEN</Link>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>COMPLETE STOCK CHECK</div>
              <div className={styles.cardDesc}>View and Download item details.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/spares/stock-check">OPEN</Link>
            </div>
             <div className={styles.card}>
              <div className={styles.cardTitle}>MANAGE MASTER LIST - SPARES</div>
              <div className={styles.cardDesc}>Item details with location item placed.</div>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/spares/spares-master-list">OPEN</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

function SparesMasterListPage() {
  const [partNo, setPartNo] = useState("");
  const [itemName, setItemName] = useState("");
  const [noOfBins, setNoOfBins] = useState("");
  const [binNos, setBinNos] = useState([]);
  const [rackNo, setRackNo] = useState("");
  const [itemLoc, setItemLoc] = useState("");
  const [status, setStatus] = useState("");

  const navigate = useNavigate();

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
    setNoOfBins("");
    setBinNos([]);
    setRackNo("");
    setItemLoc("");
    setStatus("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    const confirmSubmit = window.confirm(
      `Add new item?\n\nPart No: ${partNo}\nName: ${itemName}`
    );
    if (!confirmSubmit) return;

    try {
      const res = await fetch(`${apiBase()}/spares/master/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          part_no: partNo,
          item_name: itemName,
          no_of_bins: noOfBins,
          bin_nos: binNos,
          rack_no: rackNo,
          item_loc: itemLoc,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      alert("Item added to master list!");
      setStatus("Item added");
      clearForm();
    } catch (err) {
      alert(err.message);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>SPARES — MASTER LIST</div>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => navigate("/user/spares")}
            >
              CLOSE
            </button>
          </div>

          <div className={styles.card}>
            <form onSubmit={onSubmit} className={styles.form}>
              <div className={styles.formGrid2}>
                <label className={styles.label}>
                  ITEM PART NO
                  <input
                    className={styles.control}
                    value={partNo}
                    onChange={(e) => setPartNo(e.target.value)}
                    required
                  />
                </label>

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
                  NO OF BINS
                  <input
                    className={styles.control}
                    type="number"
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
                <label className={styles.label}>
                  RACK NO
                  <input
                    className={styles.control}
                    type="number"
                    value={rackNo}
                    onChange={(e) => setRackNo(e.target.value)}
                    required 
                  />
                </label>
                <label className={styles.label}>
                  ITEM LOC
                  <input
                    className={styles.control}
                    value={itemLoc}
                    onChange={(e) => setItemLoc(e.target.value)}
                    required
                  />
                </label>
              </div>

              {status && <div>{status}</div>}

              <div className={styles.pageActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`}>
                  ADD ITEM
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
  const [currentQty, setCurrentQty] = useState(0);
  const [qtyIn, setQtyIn] = useState("");
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
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
  
  useEffect(() => {
  if (!partSearch) {
    setFilteredItems([]);
    return;
  }

  const filtered = items.filter((i) =>
    i.part_no.toLowerCase().startsWith(partSearch.toLowerCase())
  ).sort((a, b) => a.part_no.localeCompare(b.part_no));

  setFilteredItems(filtered);
  }, [partSearch, items]);

  const clearForm = () => {
    setItemName('');
    setCurrentQty('');
    setQtyIn('');
    setSelectedPart('');
    setStatus('');
    setRemarks('');
    setPartSearch('');
    setFilteredItems([]);
    setShowDropdown(false);
    setNoOfBins("");
    setBinNos([]);
    setRackNo("");
    setItemLoc("");
    setRecievedFrom("");
  };

  const handleSelectPart = (partNo) => {
    setSelectedPart(partNo);
    const item = items.find((i) => i.part_no === partNo);

    if (item) {
      setItemName(item.item_name);
      setCurrentQty(item.qty || 0);
      setNoOfBins(item.no_of_bins || 0);
      setBinNos(item.bin_nos || []);
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
              CLOSE
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
                    />

                    {showDropdown && filteredItems.length > 0 && (
                    <div className={styles.dropdown}>
                      {filteredItems.map((i) => (
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
                  ITEM LOC
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
  const [qtyAvailable, setQtyAvailable] = useState(0);
  const [qtyOut, setQtyOut] = useState("");
  const [handingTo, setHandingTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
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

  useEffect(() => {
  if (!partSearch) {
    setFilteredItems([]);
    return;
  }

  const filtered = items.filter((i) =>
    i.part_no.toLowerCase().startsWith(partSearch.toLowerCase())
  ).sort((a, b) => a.part_no.localeCompare(b.part_no));

  setFilteredItems(filtered);
  }, [partSearch, items]);

  const clearForm = () => {
    
    setItemName('');
    setHandingTo('');
    setRemarks('');
    setQtyAvailable('');
    setQtyOut('');
    setSelectedPart('');
    setStatus('');
    setPartSearch('');
    setFilteredItems([]);
    setShowDropdown(false);
    setNoOfBins("");
    setBinNos([]);
    setRackNo("");
    setItemLoc("");
  };

  // Auto-fill name + qty
  const handleSelectPart = async (partNo) => {
    setSelectedPart(partNo);
    const item = items.find((i) => i.part_no === partNo);

    if (item) {
      setItemName(item.item_name);
      setQtyAvailable(item.qty || 0);
      setNoOfBins(item.no_of_bins || 0);
      setBinNos(item.bin_nos || "");
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
              CLOSE
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
                    />

                    {showDropdown && filteredItems.length > 0 && (
                    <div className={styles.dropdown}>
                      {filteredItems.map((i) => (
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
                  ITEM LOC
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


function ViewItemPage() {
  const [items, setItems] = useState([]);
  const [selectedPart, setSelectedPart] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemLoc, setItemLoc] = useState("");
  const [rackNo, setRackNo] = useState("");
  const [noOfBins, setNoOfBins] = useState(0);
  const [binNos, setBinNos] = useState([]);
  const [qtyAvailable, setQtyAvailable] = useState(0);
  const [auditList, setAuditList] = useState([]);
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
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

  useEffect(() => {
  if (!partSearch) {
    setFilteredItems([]);
    return;
  }

  const filtered = items.filter((i) =>
    i.part_no.toLowerCase().startsWith(partSearch.toLowerCase())
  ).sort((a, b) => a.part_no.localeCompare(b.part_no));

  setFilteredItems(filtered);
  }, [partSearch, items]);

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
      setItemLoc(detail.item_loc || "");
      setRackNo(detail.rack_no || "");
      setNoOfBins(detail.no_of_bins || 0);
      setBinNos(detail.bin_nos || []);
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
              CLOSE
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
                    />

                    {showDropdown && filteredItems.length > 0 && (
                    <div className={styles.dropdown}>
                      {filteredItems.map((i) => (
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
                  ITEM LOC
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
                        <td colSpan="5" style={{ textAlign: "center", padding: "15px" }}>
                          No records found
                        </td>
                      </tr>
                    ) : (
                      auditList.map((row, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{row.user?.username}</td>
                          <td>{formatDateTime(row.date)}</td>
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
              CLOSE
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
                    <th>Item Loc</th>
                    <th>Rack No</th>
                    <th>No of Bins</th>
                    <th>Bin No</th>
                    <th>Qty</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center" }}>No items</td>
                    </tr>
                  ) : (
                    sortedItems.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.part_no}</td>
                        <td>{item.item_name}</td>
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

export { SparesMasterListPage, SparesInPage, SparesOutPage, ViewItemPage, StockCheckPage };

