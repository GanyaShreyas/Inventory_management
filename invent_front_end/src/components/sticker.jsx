import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';
import { useNavigate } from 'react-router-dom';

function apiBase() {
    return 'http://localhost:8000/api';
}

function authHeaders() {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function Sticker() {
    const [type, setType] = useState('sticker');
    const [offset, setOffset] = useState('1');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [value, setValue] = useState('');
    const [status, setStatus] = useState("");
    const [record, setRecord] = useState(null);
    const [allItemMarked, setAllItemMarked] = useState(false);
    const [itemMarked, setItemMarked] = useState([]); // array of booleans

    const navigate = useNavigate();
    const suggestionRef = useRef(null);
    
    useEffect(() => {
        if (record?.items) {
            setItemMarked(record.items.map(() => false));
            setAllItemMarked(false);
        }
    }, [record]);

    useEffect(() => {
        console.log("selectionMode changed:", selectionMode);
        if (selectionMode) {
            setSelectionMode(false);
            return;
        }
        if (value.length >= 2) {
            const fetchSuggestions = async () => {
                try {
                    const params = new URLSearchParams();
                    params.set('type', 'passNo');
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
        else {
            setSuggestions([]);
        }
    }, [value, type, selectionMode]);

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

    const handleSelectAll = (checked) => {
        setAllItemMarked(checked);
        setItemMarked(record.items.map(() => checked)); // update all items
    };
    const updateItemMarked = (idx, checked) => {
        setItemMarked(prev => {
        const newArr = [...prev];
        newArr[idx] = checked;

        // Update allItemMarked dynamically
        if (newArr.every(Boolean)) {
            setAllItemMarked(true);
        } else {
            setAllItemMarked(false);
        }

        return newArr;
        });
    };
    const handleSelectSuggestion = (s) => {
        setValue(s);
        setShowSuggestions(false);
        setSelectionMode(true);
    };
    const clearForm = () => {
        setOffset('1');
        setValue('');
        setSuggestions([]);
        setShowSuggestions(false);
        setRecord(null);
    }
    const clearOnChange = () => {
        setValue('');
        setOffset('1');
        setRecord(null);
    }
    const download_sticker = async () => {
        try {
            const params = new URLSearchParams();
            params.set('type', 'passNo');
            if (!(offset > 0 && offset < 9)) {
                alert('Enter offset between 1 and 8');
                return;
            }
            params.set('offset', offset);
            if (value == '') {
                alert('Enter the Private Pass No');
                return;
            }
            params.set('value', value);
            const res = await fetch(`${apiBase()}/search/download_sticker?${params.toString()}`, { headers: { ...authHeaders() } });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const defaultName = `${new Date().toISOString().split('T')[0]}_item_details.xlsx`;
            a.download = defaultName;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };
    const viewItems = async () => {
        setStatus('');
        try {
            console.log('=== FETCHING RECORD DEBUG ===');
            console.log('Pass Number:', value);
            console.log('Auth headers:', authHeaders());
            if (value == ""){
                alert("Enter valid Private Pass number");
                return
            }
            const res = await fetch(`${apiBase()}/items/${encodeURIComponent(value)}`, { headers: { ...authHeaders() } });
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
    const getCheckedPartNumbers = () => {
        if (!record?.items) return [];
        return record.items
            .filter((item, idx) => itemMarked[idx])
            .map(item => item.partNumber);
    };
    const download_form = async () => {
        const partNumbers = getCheckedPartNumbers()
        try {
            const params = new URLSearchParams();
            if (value == '') {
                alert('Enter the Private Pass No');
                return;
            }
            if (partNumbers.length < 1){
                alert('Select Atleast one Item');
                return;
            }
            params.set('type', 'passNo');
            params.set('value', value);
            params.set('PartNumbers', partNumbers);
            const res = await fetch(`${apiBase()}/search/download_form?${params.toString()}`, { headers: { ...authHeaders() } });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const defaultName = `${new Date().toISOString().split('T')[0]}_item_details.xlsx`;
            a.download = defaultName;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>PRINT STICKERS/HANDING OVER FORM</div>
                <div className={styles.pageActions}>
                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => { navigate('/user/dashboard'); clearForm() }}>CLOSE</button>
                </div>
            </div>
            <div className={styles.card}>
                <div className={styles.formGrid3}>
                    <label className={styles.label}>TYPE
                        <select
                            className={styles.control}
                            value={type}
                            onChange={(e) => { setType(e.target.value); clearOnChange(); }}
                        >
                            <option value="sticker">PRINT STICKER</option>
                            <option value="handoverform">HANDOVER FORM</option>
                        </select>
                    </label>
                    <label className={styles.label}>PRIVATE PASS NO:
                        <div className={styles.relativeContainer} ref={suggestionRef}>
                            <input
                                className={styles.control}
                                value={value}
                                onFocus={() => setShowSuggestions(true)}
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
                    </label>
                    {type == 'sticker' ? (
                        <label className={styles.label}>
                            Enter the Offset value:
                            <input
                                className={styles.control}
                                type="number"
                                min='1'
                                value={offset}
                                onFocus={() => setShowSuggestions(true)}
                                onChange={(e) => setOffset(e.target.value)}
                            />
                        </label>
                    ) : null}
                </div>
                <div className={styles.pageActions}>
                    {type == "sticker" ? (
                        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={download_sticker}>DOWNLOAD STICKERS</button>
                    ) : (<>
                        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={viewItems}>VIEW ITEMS</button>
                        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={download_form}>DOWNLOAD FORM</button>
                    </>
                    )}
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary} ${styles.resetBtn}`}
                        onClick={clearForm}
                    >
                        RESET
                    </button>
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
                                    <th>SL NO</th><th>TYPE</th><th>NAME</th><th>PART NO</th><th>SERIAL NO</th><th>DEFECT</th><th>SELECT ITEMS <input type = "checkbox" checked={allItemMarked} onChange={(e) => handleSelectAll(e.target.checked)}/> ALL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {record.items?.map((it, idx) => (
                                    <tr key={idx}>
                                        <td>{idx+1}</td>
                                        <td>{it.equipmentType}</td>
                                        <td>{it.itemName}</td>
                                        <td>{it.partNumber}</td>
                                        <td>{it.serialNumber}</td>
                                        <td>{it.defectDetails}</td>
                                        <td><input type="checkbox" checked={itemMarked[idx] || false} onChange={(e) => updateItemMarked(idx, e.target.checked)} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
            {status ? <div className={styles.card} style={{ marginTop: 12, padding: 12 }}>{status}</div> : null}
        </div>
    );
}

export default Sticker