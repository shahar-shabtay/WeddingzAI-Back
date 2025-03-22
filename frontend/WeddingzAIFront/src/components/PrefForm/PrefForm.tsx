import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import styles from "./PrefForm.module.css";
import formService from "../../services/form-service";

console.log(styles.fieldError);

// Define the Zod schema
const formSchema = z.object({
  bride: z.string().min(1, "Bride's name is required"),
  groom: z.string().min(1, "Groom's name is required"),
  weddingDate: z.string().min(1, "Wedding date is required"),
  estimatedBudget: z.string().min(1, "Estimated budget is required"),
  vibe: z.string().min(1, "Please select a wedding vibe"),
  guestCount: z.string().min(1, "Please select a guest count"),
  location: z.string().min(1, "Please select a location"),
  importantPart: z.string().min(1, "Please select an important part"),
  ceremonyType: z.string().min(1, "Please select a ceremony type"),
  guestExperience: z.string().optional(),
  planningTime: z.string().optional(),
  foodStyle: z.string().optional(),
  mustHave: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" })); // Clear error when user types
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
        <p>Please answer the following questions to help us create your personalized wedding to-do list.</p>

        <form onSubmit={handleSubmit}>
          {[
            { label: "Bride's Name", field: "bride" },
            { label: "Groom's Name", field: "groom" },
            { label: "Wedding Date", field: "weddingDate", type: "date" },
            { label: "Estimated Budget (ILS)", field: "estimatedBudget", type: "number" },
          ].map(({ label, field, type = "text" }) => (
            <div key={field} className={styles.formGroup}>
              <label>{label}</label>
              <input
                type={type}
                value={formData[field as keyof FormData]}
                onChange={(e) => handleChange(field as keyof FormData, e.target.value)}
              />
              {formErrors[field] && <p className={styles.fieldError}>{formErrors[field]}</p>}
            </div>
          ))}

          {/* Vibe, guestCount, location, etc. */}
          {[
            {
              label: "1. What's the vibe of your perfect wedding?",
              field: "vibe",
              options: ["Intimate & cozy", "Classic & elegant", "Fun & colorful", "Glamorous & luxe", "Rustic & outdoorsy", "I’m not sure yet"],
            },
            {
              label: "2. How big do you want your celebration to be?",
              field: "guestCount",
              options: ["Just the two of us (elopement)", "Under 50 guests", "50–100 guests", "100–200 guests", "200+ guests"],
            },
            {
              label: "3. What's your ideal wedding location?",
              field: "location",
              options: ["Local venue in our hometown", "Destination wedding", "Beach or outdoor setting", "City/urban vibes", "Private home or backyard", "Still exploring"],
            },
            {
              label: "4. Which part of the wedding is most important to you?",
              field: "importantPart",
              options: ["The ceremony", "The party/reception", "Food and drinks", "The dress/outfits", "Photos and memories", "All of it!"],
            },
            {
              label: "5. What type of ceremony are you envisioning?",
              field: "ceremonyType",
              options: ["Religious/traditional", "Civil/legal", "Spiritual but not religious", "Cultural/family-oriented", "Not sure yet"],
            },
          ].map(({ label, field, options }) => (
            <div key={field} className={styles.formGroup}>
              <label>{label}</label>
              <select
                value={formData[field as keyof FormData]}
                onChange={(e) => handleChange(field as keyof FormData, e.target.value)}
              >
                <option value="">Select</option>
                {options.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              {formErrors[field] && <p className={styles.fieldError}>{formErrors[field]}</p>}
            </div>
          ))}

          <button type="submit" className={styles.uploadButton}>Submit</button>
          {loading && <p className={styles.loading}>Generating your to-do list...</p>}
          {submitError && <p className={styles.errorMessage}>{submitError}</p>}
        </form>
      </div>
    </div>
  );
}
