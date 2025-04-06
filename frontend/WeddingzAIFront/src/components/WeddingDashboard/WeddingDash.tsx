import React from 'react';
import styles from './WeddingDashboard.module.css';

export default function WeddingDashboard () {
  return (
    <div className={styles.main}>
        <div className={styles.grid}>
          <div className={`${styles.card} ${styles.budget}`}>Budget Overview</div>
          <div className={`${styles.card} ${styles.guests}`}>Guest List</div>
          <div className={`${styles.card} ${styles.seating}`}>Seating Chart</div>
          <div className={`${styles.card} ${styles.calendar}`}>Calendar</div>
          <div className={`${styles.card} ${styles.menu}`}>Menu</div>
          <div className={`${styles.card} ${styles.todo}`}>To Do List</div>
          <div className={`${styles.card} ${styles.vendors}`}>Vendors</div>
          <div className={`${styles.card} ${styles.view3d}`}>3D View</div>
          <div className={`${styles.card} ${styles.invitation}`}>Invitation</div>
        </div>
    </div>
  );
};
