import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import formService from "../../services/form-service";
import styles from "./PrefForm.module.css";

const formSchema = z.object({
  hasDateAndVenue: z.string(),
  weddingDate: z.string(),
  venue: z.string(),
  guestCount: z.string(),
  weddingStyle: z.string(),
  venueType: z.string(),
  dateRange: z.string(),
  importantPart: z.string(),
  planningPriority: z.string(),
  mustHave: z.string(),
  ceremonyTime: z.string(),
  additionalNotes: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function PrefForm() {
  const [formData, setFormData] = useState<FormData>({
    hasDateAndVenue: "",
    weddingDate: "",
    venue: "",
    guestCount: "",
    weddingStyle: "",
    venueType: "", // Initialized venueType
    dateRange: "", // Initialized dateRange
    importantPart: "", // Initialized importantPart
    planningPriority: "", // Initialized planningPriority
    mustHave: "", // Initialized mustHave
    ceremonyTime: "", // Initialized ceremonyTime
    additionalNotes: "", // Initialized additionalNotes
  });
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);

  const handleChangeDateAndVenue = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      hasDateAndVenue: value,
      weddingDate:
        value === "Yes, we already have both 🎉" ? "" : prev.weddingDate,
      venue: value === "Yes, we already have both 🎉" ? "" : prev.venue,
    }));
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    const validation = formSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setFormErrors(fieldErrors);
      setLoading(false);
      return;
    }

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
        <p>
          Please answer the following questions to help us create your
          personalized wedding to-do list.
        </p>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <>
              <div className={styles.formGroup}>
                <label>Do you already have a wedding date and venue?</label>
                <div>
                  <select
                    value={formData.hasDateAndVenue}
                    onChange={(e) => handleChangeDateAndVenue(e.target.value)}
                  >
                    <option value="">Select an option</option>
                    <option value="Yes, we already have both 🎉">
                      Yes, we already have both 🎉
                    </option>
                    <option value="We have a date but still looking for a venue">
                      We have a date but still looking for a venue
                    </option>
                    <option value="Not yet">Not yet</option>
                  </select>
                </div>
              </div>

              {formData.hasDateAndVenue === "Yes, we already have both 🎉" && (
                <>
                  <div className={styles.formGroup}>
                    <label>Wedding Date</label>
                    <input
                      type="date"
                      value={formData.weddingDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          weddingDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Venue</label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          venue: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}

              {formData.hasDateAndVenue ===
                "We have a date but still looking for a venue" && (
                <div className={styles.formGroup}>
                  <label>Wedding Date</label>
                  <input
                    type="date"
                    value={formData.weddingDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        weddingDate: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className={styles.buttonRow}>
                {currentStep > 1 && (
                  <button
                    type="button"
                    className={styles.navButton}
                    onClick={handlePreviousStep}
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={handleNextStep}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className={styles.formGroup}>
                <label>How many guests are you expecting? 👥</label>
                <select
                  value={formData.guestCount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guestCount: e.target.value,
                    }))
                  }
                >
                  <option value="">Select an option</option>
                  <option value="Under 100">Under 100</option>
                  <option value="100-200">100-200</option>
                  <option value="200-400">200-400</option>
                  <option value="400+">400+</option>
                </select>
              </div>

              {(formData.hasDateAndVenue === "Not yet" ||
                formData.hasDateAndVenue ===
                  "We have a date but still looking for a venue") && (
                <div className={styles.formGroup}>
                  <label>Venue Type</label>
                  <select
                    value={formData.venueType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        venueType: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select an option</option>
                    <option value="Garden / Outdoor 🌳">
                      Garden / Outdoor 🌳
                    </option>
                    <option value="Event hall 💃">Event hall 💃</option>
                    <option value="Hotel 🏨">Hotel 🏨</option>
                    <option value="Beach 🏖️">Beach 🏖️</option>
                    <option value="At home 🏡">At home 🏡</option>
                    <option value="Not sure yet 🤔">Not sure yet 🤔</option>
                  </select>
                </div>
              )}

              {formData.weddingDate === "" && (
                <div className={styles.formGroup}>
                  <label>Date Range 📅</label>
                  <select
                    value={formData.dateRange}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dateRange: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select an option</option>
                    <option value="January–March ❄️">January–March ❄️</option>
                    <option value="April–June 🌸">April–June 🌸</option>
                    <option value="July–September ☀️">July–September ☀️</option>
                    <option value="October–December 🍂">
                      October–December 🍂
                    </option>
                    <option value="Not sure yet 🤷‍♀️">Not sure yet 🤷‍♀️</option>
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>
                  What's the most important part of your wedding? 🎯
                </label>
                <select
                  value={formData.importantPart}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      importantPart: e.target.value,
                    }))
                  }
                >
                  <option value="">Select an option</option>
                  <option value="Ceremony 💍">Ceremony 💍</option>
                  <option value="Reception 🕺">Reception 🕺</option>
                  <option value="Food 🍽️">Food 🍽️</option>
                  <option value="Entertainment 🎉">Entertainment 🎉</option>
                  <option value="Decorations 🌸">Decorations 🌸</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>What's your biggest priority when planning? 🔑</label>
                <select
                  value={formData.planningPriority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      planningPriority: e.target.value,
                    }))
                  }
                >
                  <option value="">Select an option</option>
                  <option value="Budget 💸">Budget 💸</option>
                  <option value="Guest Experience 👥">
                    Guest Experience 👥
                  </option>
                  <option value="Venue 🏰">Venue 🏰</option>
                  <option value="Vendors 📋">Vendors 📋</option>
                  <option value="Timeline ⏰">Timeline ⏰</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Any must-haves on your wedding day? 💫</label>
                <select
                  value={formData.mustHave}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mustHave: e.target.value,
                    }))
                  }
                >
                  <option value="">Select an option</option>
                  <option value="Photo Booth 📸">Photo Booth 📸</option>
                  <option value="Live Band 🎶">Live Band 🎶</option>
                  <option value="Fireworks 🎆">Fireworks 🎆</option>
                  <option value="Special Dance 💃">Special Dance 💃</option>
                  <option value="Unique Cake 🍰">Unique Cake 🍰</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>What's your ideal ceremony time?</label>
                <select
                  value={formData.ceremonyTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ceremonyTime: e.target.value,
                    }))
                  }
                >
                  <option value="">Select an option</option>
                  <option value="Morning 🌞">Morning 🌞</option>
                  <option value="Afternoon ☀️">Afternoon ☀️</option>
                  <option value="Evening 🌙">Evening 🌙</option>
                  <option value="No preference">No preference</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Anything else you’d like us to know?</label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      additionalNotes: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.buttonRow}>
                {currentStep > 1 && (
                  <button
                    type="button"
                    className={styles.navButton}
                    onClick={handlePreviousStep}
                  >
                    Back
                  </button>
                )}
                <button type="submit" className={styles.navButton}>
                  submit
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
