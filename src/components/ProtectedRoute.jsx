import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && currentUser.role !== role) {
    if (currentUser.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/events" replace />;
  }

  return children;
}

export default ProtectedRoute;
