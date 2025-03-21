import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import JsonUploadPage from "./pages/JsonUploaderPage";
import PrefFormPage from "./pages/PrefFormPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/upload-json" element={<JsonUploadPage />} />
        <Route path="/pref-form" element={<PrefFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
