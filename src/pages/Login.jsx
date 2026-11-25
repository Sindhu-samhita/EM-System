import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "user",
  });

  const [error, setError] = useState("");

  const fillDemoAccount = (role) => {
    if (role === "admin") {
      setForm({
        email: "admin@gmail.com",
        password: "admin123",
        role: "admin",
      });
    } else {
      setForm({
        email: "user@gmail.com",
        password: "user123",
        role: "user",
      });
    }
    setError("");
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(
      (u) =>
        u.email === form.email &&
        u.password === form.password &&
        u.role === form.role
    );

    if (!user) {
      setError("Invalid credentials for the selected role");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));

    const requestedPath = location.state?.from?.pathname;

    if (user.role === "admin") {
      navigate(
        requestedPath?.startsWith("/admin") ? requestedPath : "/admin"
      );
    } else {
      navigate(
        requestedPath === "/my-registrations" ? requestedPath : "/events"
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p>Login to EventHub</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleLogin}>
          <label htmlFor="login-role">Login as</label>
          <select
            id="login-role"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="user">Attendee</option>
            <option value="admin">Admin</option>
          </select>

          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button className="primary-btn" type="submit">
            Login
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create Account</Link>
        </p>

        <div className="demo-login">
          <strong>Demo Accounts</strong>
          <p>Choose an account type before logging in:</p>
          <div className="demo-account-buttons">
            <button
              type="button"
              className="demo-account-btn demo-user"
              onClick={() => fillDemoAccount("user")}
            >
              Use User Account
            </button>
            <button
              type="button"
              className="demo-account-btn demo-admin"
              onClick={() => fillDemoAccount("admin")}
            >
              Use Admin Account
            </button>
          </div>
          <p className="demo-credentials">
            Admin: admin@gmail.com / admin123
            <br />
            User: user@gmail.com / user123
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
