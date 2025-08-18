import React, { useState } from 'react';
import styles from './styles.module.css';
import userImg from '../assets/person.png';

function Header() {
  const[profileOpen,setProfileOpen] = useState(false);
  const username = typeof window !== 'undefined' ? 
    (sessionStorage.getItem('role') === 'admin' ? 'Admin' : 
     (sessionStorage.getItem('name') || sessionStorage.getItem('username') || 'User')) : 'User';
  
  const onLogout = async () => {
    try {
      // Call logout endpoint to invalidate session on server
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:8000/api/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all authentication data
      try {
        sessionStorage.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('name');
        localStorage.removeItem('loginTime');
      } catch (error) {
        console.error('Error clearing auth data:', error);
      }
      window.location.href = '/login';
    }
  };
  return(
    <div className={styles.profileComp}>
      <div className={styles.headerBanner}>
        <div className={styles.bannerTitle}>Customer Support-MILCOM</div>
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
