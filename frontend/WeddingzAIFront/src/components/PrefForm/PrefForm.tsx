import React from "react";
import styles from "./PrefForm.module.css";

export default function PrefForm() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.formContainer}>
        <h2>Let's Plan Your Wedding 🎉</h2>
        <p>Please answer the following questions to help us create your personalized wedding to-do list.</p>

        <form>
          <div className={styles.formGroup}>
            <label>1. What's the vibe of your perfect wedding?</label>
            <select>
              <option>Intimate & cozy</option>
              <option>Classic & elegant</option>
              <option>Fun & colorful</option>
              <option>Glamorous & luxe</option>
              <option>Rustic & outdoorsy</option>
              <option>I’m not sure yet</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>2. How big do you want your celebration to be?</label>
            <select>
              <option>Just the two of us (elopement)</option>
              <option>Under 50 guests</option>
              <option>50–100 guests</option>
              <option>100–200 guests</option>
              <option>200+ guests</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>3. What's your ideal wedding location?</label>
            <select>
              <option>Local venue in our hometown</option>
              <option>Destination wedding</option>
              <option>Beach or outdoor setting</option>
              <option>City/urban vibes</option>
              <option>Private home or backyard</option>
              <option>Still exploring</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>4. What's your overall wedding budget range?</label>
            <select>
              <option>Under $5,000</option>
              <option>$5,000 – $15,000</option>
              <option>$15,000 – $30,000</option>
              <option>$30,000 – $50,000</option>
              <option>Sky’s the limit</option>
              <option>Not sure yet</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>5. Which part of the wedding is most important to you?</label>
            <select>
              <option>The ceremony</option>
              <option>The party/reception</option>
              <option>Food and drinks</option>
              <option>The dress/outfits</option>
              <option>Photos and memories</option>
              <option>All of it!</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>6. What type of ceremony are you envisioning?</label>
            <select>
              <option>Religious/traditional</option>
              <option>Civil/legal</option>
              <option>Spiritual but not religious</option>
              <option>Cultural/family-oriented</option>
              <option>Not sure yet</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>7. What kind of experience do you want your guests to have?</label>
            <select>
              <option>Relaxed and casual</option>
              <option>Elegant and formal</option>
              <option>Fun and energetic</option>
              <option>Intimate and emotional</option>
              <option>A mix of everything</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>8. How much time do you want to spend planning your wedding?</label>
            <select>
              <option>A few weeks</option>
              <option>A few months</option>
              <option>A full year</option>
              <option>As long as it takes</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>9. What's your food & drink style?</label>
            <select>
              <option>Casual buffet or food trucks</option>
              <option>Plated gourmet meals</option>
              <option>Family-style</option>
              <option>Cocktail-style with apps</option>
              <option>We haven’t thought about it yet</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>10. Which of these is a must-have at your wedding?</label>
            <select>
              <option>Live band or DJ</option>
              <option>Professional photographer</option>
              <option>Personalized decor</option>
              <option>Open bar</option>
              <option>Unique entertainment</option>
              <option>Nothing in particular yet</option>
            </select>
          </div>
        </form>
      </div>
    </div>
  );
}
