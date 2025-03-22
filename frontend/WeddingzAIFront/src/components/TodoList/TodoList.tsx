import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TodoList.module.css";

// Define interfaces for better TypeScript typing
interface TodoItem {
  task: string;
  dueDate: string;
  priority: string;
}

interface TodoSection {
  sectionName: string;
  todos: TodoItem[];
}

interface TodoListData {
  weddingTodoListName: string;
  bride: string;
  groom: string;
  weddingDate: string;
  estimatedBudget: string;
  sections: TodoSection[];
}

export default function TodoList() {
  const [todoList, setTodoList] = useState<TodoListData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedList = localStorage.getItem("todoList");
    if (storedList) {
      setTodoList(JSON.parse(storedList));
    } else {
      navigate("/"); // Redirect to home if no to-do list is found
    }
  }, [navigate]);

  return (
    <div className={styles.wrapper}>
      {todoList ? (
        <div className={styles.todoListContainer}>
          <h2 className={styles.todoTitle}>{todoList.weddingTodoListName}</h2>
          <p className={styles.coupleNames}>👰 {todoList.bride} & 🤵 {todoList.groom}</p>
          <p className={styles.weddingDate}>📅 Wedding Date: <strong>{todoList.weddingDate}</strong></p>

          {todoList.sections.length > 0 ? (
            todoList.sections.map((section, index) => (
              <div key={index} className={styles.todoSection}>
                <h3 className={styles.sectionTitle}>{section.sectionName}</h3>
                <ul className={styles.todoList}>
                  {section.todos.map((todo, i) => (
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
      ) : (
        <p className={styles.loading}>Loading to-do list...</p>
      )}
    </div>
  );
}
