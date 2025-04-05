import React from 'react';
import styles from './NavBar.module.css';
import logo from '../../assets/ wai-logo.svg';
import userIcon from "../../assets/images/user-icon.svg";


export const NavBar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <img src={logo} alt="Logo" style={{ height: '200px' }} />
      </div>

      <div className={styles.title}>My Weddings</div>

      <div className={styles.authWrapper}>
        <img src={userIcon} alt="User Icon" />
        <div>
          <div className={styles.authName}><strong>Anonymous</strong></div>
          <div className={styles.auth}>
            <a href="#">Login</a> | <a href="#">Register</a>
          </div>
        </div>
      </div>
    </nav>
  );
};