import { Navigate, Route, Routes } from "react-router-dom";
import Receipt from "./Receipt";
import Activity from "./Activity";
import Edit from "./Edit";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/receipt/demo" replace />} />
      <Route path="/receipt/:id" element={<Receipt />} />
      <Route path="/activity" element={<Activity />} />
      <Route path="/edit/:id" element={<Edit />} />
      <Route path="*" element={<Navigate to="/receipt/demo" replace />} />
    </Routes>
  );
}
