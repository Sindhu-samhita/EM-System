import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const logout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Event<span>Hub</span>
      </Link>

      <div className="nav-links">
        {!currentUser && (
          <>
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}

        {currentUser?.role === "user" && (
          <>
            <Link to="/events">Events</Link>
            <Link to="/my-registrations">My Registrations</Link>
            <button onClick={logout}>Logout</button>
          </>
        )}

        {currentUser?.role === "admin" && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/events">Manage Events</Link>
            <Link to="/admin/attendees">Attendees</Link>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
