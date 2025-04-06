import { Routes, Route, BrowserRouter } from "react-router-dom";
import PrefFormPage from "./pages/PrefFormPage";
import TodoListPage from "./pages/TodoListPage";
import HomePage from "./components/HomePage/HomePage";
import BudgetPage from "./pages/BudgetPage";
import WeddingDashboardPage from "./pages/WeddingDashoardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/" element={<PrefFormPage />} />
        <Route path="/todolist" element={<TodoListPage />} />
        <Route path="/budget" element={<BudgetPage/>} />
        <Route path="/weddash" element={<WeddingDashboardPage/>} />
      </Routes>
    </BrowserRouter>
  );
}
