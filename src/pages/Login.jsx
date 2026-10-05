import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

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
      (u) => u.email === form.email && u.password === form.password
    );

    if (!user) {
      setError("Invalid email or password");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));

    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/events");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p>Login to EventHub</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleLogin}>
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
          <p>Admin: admin@gmail.com / admin123</p>
          <p>User: user@gmail.com / user123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
