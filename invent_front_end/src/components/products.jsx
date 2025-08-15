import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import ProductsTable from './productsTable';

function Products({ onAddNew }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  useEffect(() => {
    fetch('http://localhost:8000/api/items/')
      .then(response => response.json())
      .then(data => setResults(data))
      .catch(error => console.error('Error:', error));
  }, [query]);
  return (
    <div className={styles.productsContent}>
      <div className={styles.productsHeader}>
        <div className={styles.headerLeft}>
          <label htmlFor="dropdown">Choose the filter: </label>
          <select id="dropdown" className={styles.filterSelect}>
            <option value="Duration">Date</option>
            <option value="ID">ID</option>
          </select>
          <input type='search' className={styles.searchInput} placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className={styles.headerRight}>
          <label>From: </label>
          <input type='date' className={styles.dateInput} />
          <label>To: </label>
          <input type='date' className={styles.dateInput} />
          <button className={styles.newButton} onClick={onAddNew}>New</button>
        </div>
      </div>
      <ProductsTable items = {results} />
    </div>
  );
}

export default Products;