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
  const [todoList, setTodoList] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitSuccess(null);
    setSubmitError(null);
    setTodoList(null);

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
      setTodoList(response.data.todoList);
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || "Upload failed.");
      setSubmitSuccess(null);
      setTodoList(null);
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

          <button type="submit" className={styles.uploadButton}>Submit</button>

          {loading && <p className={styles.loading}>Generating your to-do list...</p>}
          {submitSuccess && <p className={styles.successMessage}>{submitSuccess}</p>}
          {submitError && <p className={styles.errorMessage}>{submitError}</p>}
        </form>

        {todoList && (
          <div className={styles.todoListContainer}>
            <h2 className={styles.todoTitle}>{todoList.weddingTodoListName}</h2>
            <p className={styles.coupleNames}>👰 {todoList.bride} & 🤵 {todoList.groom}</p>

            {Array.isArray(todoList.sections) && todoList.sections.length > 0 ? (
              todoList.sections.map((section: any, index: number) => (
                <div key={index} className={styles.todoSection}>
                  <h3 className={styles.sectionTitle}>{section.sectionName}</h3>
                  <ul className={styles.todoList}>
                    {section.todos.map((todo: any, i: number) => (
                      <li key={i} className={styles.todoItem}>
                        <div className={styles.taskRow}>
                          <input type="checkbox" className={styles.checkbox} />
                          <div className={styles.taskInfo}>
                            <strong className={styles.taskTitle}>{todo.task}</strong>
                            <span className={`${styles.priority} ${styles[`priority${todo.priority}`]}`}>
                              {todo.priority}
                            </span>
                          </div>
                          <span className={styles.dueDate}>📅 {todo.dueDate}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className={styles.noTasks}>No tasks found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
