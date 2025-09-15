import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

function UserItemSection() {
  // State for dropdowns
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [itemTypes, setItemTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [itemNames, setItemNames] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [partNos, setPartNos] = useState([]);
  const [selectedPartNo, setSelectedPartNo] = useState('');
  const [rows, setRows] = useState([
    { project: '', type: '', name: '', partNo: '' }
  ]);

  // Fetch all projects on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/admin/projects/list', {
      headers: { ...authHeaders() }
    })
      .then(res => res.json())
      .then(data => setProjects(data.projects || []));
  }, []);

  // Fetch item types when project changes
  useEffect(() => {
    if (!selectedProject) return;
    fetch(`http://localhost:8000/api/admin/projects/items?projectName=${encodeURIComponent(selectedProject)}`, {
      headers: { ...authHeaders() }
    })
      .then(res => res.json())
      .then(data => {
        const types = Array.from(new Set((data.items || []).map(it => it.itemType)));
        setItemTypes(types);
        setItemNames([]);
        setPartNos([]);
        setSelectedType('');
        setSelectedName('');
        setSelectedPartNo('');
      });
  }, [selectedProject]);

  // Fetch item names when type changes
  useEffect(() => {
    if (!selectedProject || !selectedType) return;
    fetch(`http://localhost:8000/api/admin/projects/items?projectName=${encodeURIComponent(selectedProject)}`, {
      headers: { ...authHeaders() }
    })
      .then(res => res.json())
      .then(data => {
        const names = Array.from(new Set((data.items || []).filter(it => it.itemType === selectedType).map(it => it.itemName)));
        setItemNames(names);
        setPartNos([]);
        setSelectedName('');
        setSelectedPartNo('');
      });
  }, [selectedType, selectedProject]);

  // Fetch part numbers when name changes
  useEffect(() => {
    if (!selectedProject || !selectedType || !selectedName) return;
    fetch(`http://localhost:8000/api/admin/projects/items?projectName=${encodeURIComponent(selectedProject)}`, {
      headers: { ...authHeaders() }
    })
      .then(res => res.json())
      .then(data => {
        const partNumbers = Array.from(new Set((data.items || []).filter(it => it.itemType === selectedType && it.itemName === selectedName).map(it => it.partNo)));
        setPartNos(partNumbers);
        setSelectedPartNo('');
      });
  }, [selectedName, selectedType, selectedProject]);

  // Duplicate row handler
  const duplicateRow = (idx) => {
    setRows([...rows, { ...rows[idx] }]);
  };

  // Row change handler
  const handleRowChange = (idx, key, value) => {
    setRows(rows.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  };

  return (
    <div className={styles.card}>
      <h3>Item In Section (User)</h3>
      <table className={styles.table} style={{ minWidth: 600 }}>
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Item Type</th>
            <th>Item Name</th>
            <th>Part No</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>
                <select className={styles.control} value={row.project} onChange={e => handleRowChange(idx, 'project', e.target.value)}>
                  <option value="">Select</option>
                  {projects.map((p, i) => <option key={i} value={p}>{p}</option>)}
                </select>
              </td>
              <td>
                <select className={styles.control} value={row.type} onChange={e => handleRowChange(idx, 'type', e.target.value)}>
                  <option value="">Select</option>
                  {itemTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              </td>
              <td>
                <select className={styles.control} value={row.name} onChange={e => handleRowChange(idx, 'name', e.target.value)}>
                  <option value="">Select</option>
                  {itemNames.map((n, i) => <option key={i} value={n}>{n}</option>)}
                </select>
              </td>
              <td>
                <select className={styles.control} value={row.partNo} onChange={e => handleRowChange(idx, 'partNo', e.target.value)}>
                  <option value="">Select</option>
                  {partNos.map((p, i) => <option key={i} value={p}>{p}</option>)}
                </select>
              </td>
              <td>
                <button className={styles.btnGhost} onClick={() => duplicateRow(idx)}>Duplicate Item</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserItemSection;
