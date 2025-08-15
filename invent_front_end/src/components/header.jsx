import React, { useState } from 'react';
import styles from './styles.module.css';
import userImg from '../assets/person.png';

function Header() {
  const[profileOpen,setProfileOpen] = useState(false);
  const username = typeof window !== 'undefined' ? (localStorage.getItem('role') === 'admin' ? 'Admin' : (localStorage.getItem('name') || localStorage.getItem('user') || 'User')) : 'User';
  const onLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('user');
    } catch {}
    window.location.href = '/login';
  };
  return(
    <div className={styles.profileComp}>
      <div className={styles.headerBanner}>
        <div className={styles.bannerTitle}>Inventory Management System</div>
        <div className={styles.bannerSubtitle}>Efficient. Reliable. Secure.</div>
      </div>
      <div className={styles.profileContainer}>  
          <img onClick={ () => setProfileOpen((prev) => !prev ) }
                         className={styles.userImg} src = {userImg} alt="User" />
          <div style={{ display: profileOpen ? 'block' : 'none' }}>
            <div className={styles.profileChild}>
              <div>User: {username}</div>
              <button onClick={onLogout}>Logout</button>
            </div>
          </div>
      </div>
    </div>
  )
}

export default Header;
