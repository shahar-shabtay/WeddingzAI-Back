import React, { useState } from "react";
import styles from "./PrefForm.module.css";
import formService from "../../services/form-service";

export default function PrefForm() {
  const [formData, setFormData] = useState({
    bride: "",
    groom: "",
    vibe: "",
    guestCount: "",
    location: "",
    budget: "",
    importantPart: "",
    ceremonyType: "",
    guestExperience: "",
    planningTime: "",
    foodStyle: "",
    mustHave: "",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [todoList, setTodoList] = useState<any>(null); // structured object or raw string

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const jsonBlob = new Blob([JSON.stringify(formData, null, 2)], {
        type: "application/json",
      });
      const jsonFile = new File([jsonBlob], "preferences.json", {
        type: "application/json",
      });

      const response = await formService.uploadFormJson(jsonFile);
      setSubmitSuccess(response.data.message);
      setSubmitError(null);
      setTodoList(response.data.todoList); // 👈 Save the to-do list from backend
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || "Upload failed.");
      setSubmitSuccess(null);
      setTodoList(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.formContainer}>
        <h2>Let's Plan Your Wedding 🎉</h2>
        <p>Please answer the following questions to help us create your personalized wedding to-do list.</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Bride's Name</label>
            <input
              type="text"
              value={formData.bride}
              onChange={(e) => handleChange("bride", e.target.value)}
              placeholder="Enter bride's name"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Groom's Name</label>
            <input
              type="text"
              value={formData.groom}
              onChange={(e) => handleChange("groom", e.target.value)}
              placeholder="Enter groom's name"
            />
          </div>

          {/* (Rest of form questions — unchanged) */}
          {/* Question 1 */}
          <div className={styles.formGroup}>
            <label>1. What's the vibe of your perfect wedding?</label>
            <select value={formData.vibe} onChange={(e) => handleChange("vibe", e.target.value)}>
              <option value="">Select</option>
              <option>Intimate & cozy</option>
              <option>Classic & elegant</option>
              <option>Fun & colorful</option>
              <option>Glamorous & luxe</option>
              <option>Rustic & outdoorsy</option>
              <option>I’m not sure yet</option>
            </select>
          </div>

          {/* Repeat for remaining questions (2–10) */}
          {/* ... (no changes to those fields) */}

          {/* Submit */}
          <button type="submit" className={styles.uploadButton}>Submit</button>

          {submitSuccess && <p className={styles.successMessage}>{submitSuccess}</p>}
          {submitError && <p className={styles.errorMessage}>{submitError}</p>}
        </form>

        {/* To-do List Output */}
        {todoList && (
          <div className={styles.todoListContainer}>
            <h3>Your Wedding To-Do List 🎯</h3>
            {typeof todoList === "string" ? (
              <pre className={styles.todoListRaw}>{todoList}</pre>
            ) : (
              <ul>
                {Object.entries(todoList as Record<string, string[]>).map(([section, tasks]) => (
                  <li key={section}>
                    <strong>{section}</strong>
                    <ul>
                      {tasks.map((task, i) => (
                        <li key={i}>{task}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
