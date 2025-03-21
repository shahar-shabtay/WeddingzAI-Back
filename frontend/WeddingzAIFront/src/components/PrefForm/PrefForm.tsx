import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate(); // 👈 Hook for redirection

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const jsonBlob = new Blob([JSON.stringify(formData, null, 2)], {
        type: "application/json",
      });
      const jsonFile = new File([jsonBlob], "preferences.json", {
        type: "application/json",
      });

      const response = await formService.uploadFormJson(jsonFile);
      localStorage.setItem("todoList", JSON.stringify(response.data.todoList)); // 👈 Store to-do list in localStorage
      navigate("/todolist"); // 👈 Redirect to to-do list page
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || "Upload failed.");
    } finally {
      setLoading(false);
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
            <input type="text" value={formData.bride} onChange={(e) => handleChange("bride", e.target.value)} placeholder="Enter bride's name" />
          </div>

          <div className={styles.formGroup}>
            <label>Groom's Name</label>
            <input type="text" value={formData.groom} onChange={(e) => handleChange("groom", e.target.value)} placeholder="Enter groom's name" />
          </div>

          <button type="submit" className={styles.uploadButton}>Submit</button>

          {loading && <p className={styles.loading}>Generating your to-do list...</p>}
          {submitError && <p className={styles.errorMessage}>{submitError}</p>}
        </form>
      </div>
    </div>
  );
}
