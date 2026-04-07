import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Lodge from "./pages/Lodge";
import Board from "./pages/Board";
import Photos from "./pages/Photos";
import Travel from "./pages/Travel";
import Tournament from "./pages/Tournament";
import Golf from "./pages/Golf";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><AppLayout><Courses /></AppLayout></ProtectedRoute>} />
          <Route path="/lodge" element={<ProtectedRoute><AppLayout><Lodge /></AppLayout></ProtectedRoute>} />
          <Route path="/board" element={<ProtectedRoute><AppLayout><Board /></AppLayout></ProtectedRoute>} />
          <Route path="/photos" element={<ProtectedRoute><AppLayout><Photos /></AppLayout></ProtectedRoute>} />
          <Route path="/travel" element={<ProtectedRoute><AppLayout><Travel /></AppLayout></ProtectedRoute>} />
          <Route path="/tournament" element={<ProtectedRoute><AppLayout><Tournament /></AppLayout></ProtectedRoute>} />
          <Route path="/golf" element={<ProtectedRoute><AppLayout><Golf /></AppLayout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
