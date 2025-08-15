import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import userImg from '../assets/person.png';

function Header() {
  const[profileOpen,setProfileOpen] = useState(false);
  return(
    <div className={styles.profileComp}>
      <div className={styles.headerBanner}>
        <div className={styles.bannerTitle}>Inventory Management System</div>
        <div className={styles.bannerSubtitle}>Efficient. Reliable. Secure.</div>
      </div>
      <div className={styles.profileContainer}>  
          <img onClick={ () => setProfileOpen((prev) => !prev ) }
                         className={styles.userImg} src = {userImg} />
          <div style={{ display: profileOpen ? 'block' : 'none' }}>
            <div className={styles.profileChild}>
              UserID: userID
              <button>
                Logout
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}

export default Header;
