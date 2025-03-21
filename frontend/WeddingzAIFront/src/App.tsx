import React from "react";
import { Routes, Route, Router, BrowserRouter } from "react-router-dom";
// import JsonUploadPage from "./pages/JsonUploaderPage";
import PrefFormPage from "./pages/PrefFormPage";
import TodoListPage from "./pages/TodoListPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PrefFormPage />} />
        <Route path="/todolist" element={<TodoListPage />} />
      </Routes>
    </BrowserRouter>
  );
}
