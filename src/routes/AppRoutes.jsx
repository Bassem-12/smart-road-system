import { Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Home from "../pages/Home";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Welcome from "../pages/Welcome";
import MainDashboard from "../pages/MainDashboard";
import LiveMapView from "../pages/LiveMapView";
import AlertsLog from "../pages/AlertsLog";
import UserManagement from "../pages/UserManagement";
import WeeklyReport from "../pages/WeeklyReport";
import MediaUploadPage from "../pages/MediaUploadPage";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  const location = useLocation();
  const { token } = useAuth();

  const hideNavbar =
    location.pathname === "/signin" ||
    location.pathname === "/signup" ||
    location.pathname === "/" ||
    location.pathname === "/welcome";

  return (
    <>
      {!hideNavbar && token && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/main-dashboard"
          element={
            <ProtectedRoute>
              <MainDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user-management"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/live-map-view"
          element={
            <ProtectedRoute>
              <LiveMapView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts-log"
          element={
            <ProtectedRoute>
              <AlertsLog />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={<MediaUploadPage />}
        />

        <Route
          path="/weekly-report"
          element={
            <ProtectedRoute roles={["Admin", "Officer"]}>
              <WeeklyReport />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

