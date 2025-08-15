import './App.css';
import Header from './components/header';
import Sidebar from './components/sidebar';
import Products from './components/products';
import Footer from './components/footer';
import AddProduct from './components/AddProduct';
import styles from './components/styles.module.css';
import React, { useState } from 'react';

function App() {
  const [showAddProduct, setShowAddProduct] = useState(false);

  return (
    <div className={styles.inventoryLayout}>
      <Sidebar />
      <div className={styles.inventoryMain}>
        <Header />
        {showAddProduct ? (
          <AddProduct onBack={() => setShowAddProduct(false)} />
        ) : (
          <Products onAddNew={() => setShowAddProduct(true)} />
        )}
        <Footer />
      </div>
    </div>
  );
}

export default App;
