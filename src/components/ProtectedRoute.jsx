import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    return <Navigate to="/login" replace />;
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
