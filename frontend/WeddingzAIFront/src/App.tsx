import { Routes, Route, BrowserRouter } from "react-router-dom";
import PrefFormPage from "./pages/PrefFormPage";
import TodoListPage from "./pages/TodoListPage";
import HomePage from "./components/HomePage/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/" element={<PrefFormPage />} />
        <Route path="/todolist" element={<TodoListPage />} />
      </Routes>
    </BrowserRouter>
  );
}
