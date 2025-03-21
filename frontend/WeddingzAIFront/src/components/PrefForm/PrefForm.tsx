import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PrefForm.module.css";
import formService from "../../services/form-service";

interface FormData {
  bride: string;
  groom: string;
  weddingDate: string;
  vibe: string;
  guestCount: string;
  location: string;
  estimatedBudget: string;
  importantPart: string;
  ceremonyType: string;
  guestExperience: string;
  planningTime: string;
  foodStyle: string;
  mustHave: string;
}

export default function PrefForm() {
  const [formData, setFormData] = useState<FormData>({
    bride: "",
    groom: "",
    weddingDate: "",
    vibe: "",
    guestCount: "",
    location: "",
    estimatedBudget: "",
    importantPart: "",
    ceremonyType: "",
    guestExperience: "",
    planningTime: "",
    foodStyle: "",
    mustHave: "",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      localStorage.setItem("todoList", JSON.stringify(response.data.todoList));
      navigate("/todolist");
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { error?: string } } };
        setSubmitError(err.response?.data?.error || "Upload failed.");
      } else {
        setSubmitError("Upload failed.");
      }
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

          <div className={styles.formGroup}>
            <label>Wedding Date</label>
            <input
              type="date"
              value={formData.weddingDate}
              onChange={(e) => handleChange("weddingDate", e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Estimated Budget (ILS)</label>
            <input
              type="number"
              min="0"
              value={formData.estimatedBudget}
              onChange={(e) => handleChange("estimatedBudget", e.target.value)}
              placeholder="Enter estimated budget"
            />
          </div>

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

          <div className={styles.formGroup}>
            <label>2. How big do you want your celebration to be?</label>
            <select value={formData.guestCount} onChange={(e) => handleChange("guestCount", e.target.value)}>
              <option value="">Select</option>
              <option>Just the two of us (elopement)</option>
              <option>Under 50 guests</option>
              <option>50–100 guests</option>
              <option>100–200 guests</option>
              <option>200+ guests</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>3. What's your ideal wedding location?</label>
            <select value={formData.location} onChange={(e) => handleChange("location", e.target.value)}>
              <option value="">Select</option>
              <option>Local venue in our hometown</option>
              <option>Destination wedding</option>
              <option>Beach or outdoor setting</option>
              <option>City/urban vibes</option>
              <option>Private home or backyard</option>
              <option>Still exploring</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>4. Which part of the wedding is most important to you?</label>
            <select value={formData.importantPart} onChange={(e) => handleChange("importantPart", e.target.value)}>
              <option value="">Select</option>
              <option>The ceremony</option>
              <option>The party/reception</option>
              <option>Food and drinks</option>
              <option>The dress/outfits</option>
              <option>Photos and memories</option>
              <option>All of it!</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>5. What type of ceremony are you envisioning?</label>
            <select value={formData.ceremonyType} onChange={(e) => handleChange("ceremonyType", e.target.value)}>
              <option value="">Select</option>
              <option>Religious/traditional</option>
              <option>Civil/legal</option>
              <option>Spiritual but not religious</option>
              <option>Cultural/family-oriented</option>
              <option>Not sure yet</option>
            </select>
          </div>

          <button type="submit" className={styles.uploadButton}>Submit</button>

          {loading && <p className={styles.loading}>Generating your to-do list...</p>}
          {submitError && <p className={styles.errorMessage}>{submitError}</p>}
        </form>
      </div>
    </div>
  );
}
