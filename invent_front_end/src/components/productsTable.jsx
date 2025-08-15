import React from 'react';
import styles from './styles.module.css';

function ProductsTable({ items }) {
  // Generate 20 sample rows with extra fields
  const rows = items.map((item, i) => ({
    id: item.id || 1001 + i,
    name: item.name || `Unnamed ${i + 1}`,
    in: item.in ?? 0,
    out: item.out ?? 0,
    field1: item.field1 || "-",
    field2: item.field2 || "-",
    field3: item.field3 || "-",
    field4: item.field4 || "-",
    field5: item.field5 || "-",
    field6: item.field6 || "-",
    field7: item.field7 || "-",
    field8: item.field8 || "-",
  }));

  return (
    <div className={styles.productsTableWrapper}>
      <div className={styles.scrollContainer}>
        <table className={styles.productsTable}>
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>IN</th>
              <th>Out</th>
              <th>Field 1</th>
              <th>Field 2</th>
              <th>Field 3</th>
              <th>Field 4</th>
              <th>Field 5</th>
              <th>Field 6</th>
              <th>Field 7</th>
              <th>Field 8</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.in}</td>
                  <td>{row.out}</td>
                  <td>{row.field1}</td>
                  <td>{row.field2}</td>
                  <td>{row.field3}</td>
                  <td>{row.field4}</td>
                  <td>{row.field5}</td>
                  <td>{row.field6}</td>
                  <td>{row.field7}</td>
                  <td>{row.field8}</td>
                  <td>
                    <button className={styles.actionBtn}>Edit</button>
                    <button className={styles.actionBtn}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={13} style={{ textAlign: "center" }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductsTable; 