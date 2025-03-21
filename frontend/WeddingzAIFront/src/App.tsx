import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import JsonUploadPage from "./pages/JsonUploaderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/upload-json" element={<JsonUploadPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
