import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Receipt from "./Receipt";
import Activity from "./Activity";
import Edit from "./Edit";
import { listReceipts } from "./api";

const BLUE = "#1C2C88";

/** Paints the status-bar area: blue on Activity (header runs to the top of the screen), black elsewhere. */
function StatusFill() {
  const onActivity = useLocation().pathname.startsWith("/activity");
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", onActivity ? BLUE : "#ffffff");
  }, [onActivity]);
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50"
      style={{ height: "env(safe-area-inset-top, 0px)", background: onActivity ? BLUE : "#000" }}
    />
  );
}

/** "/" opens the newest receipt (or Activity if there are none) */
function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    listReceipts()
      .then((l) => [...l].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0])
      .then((r) => navigate(r ? `/receipt/${r.id}` : "/activity", { replace: true }))
      .catch(() => navigate("/activity", { replace: true }));
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <>
    <StatusFill />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/receipt/:id" element={<Receipt />} />
      <Route path="/activity" element={<Activity />} />
      <Route path="/edit/:id" element={<Edit />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
