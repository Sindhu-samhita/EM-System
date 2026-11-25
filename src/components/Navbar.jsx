import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("currentUser");
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Event<span>Hub</span>
      </Link>

      <button
        type="button"
        className="nav-toggle"
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
        {!currentUser && (
          <>
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}

        {currentUser?.role === "user" && (
          <>
            <span className="role-label role-user">USER</span>
            <Link to="/events">Events</Link>
            <Link to="/my-registrations">My Registrations</Link>
            <button onClick={logout}>Logout</button>
          </>
        )}

        {currentUser?.role === "admin" && (
          <>
            <span className="role-label role-admin">ADMIN</span>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/analytics">Analytics</Link>
            <Link to="/admin/events">Manage Events</Link>
            <Link to="/admin/attendees">Attendees</Link>
            <Link to="/admin/planning">Planning Tools</Link>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
