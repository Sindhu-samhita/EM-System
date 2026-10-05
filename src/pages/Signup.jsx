import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const existingUser = users.find((u) => u.email === form.email);

    if (existingUser) {
      setError("Email already registered");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    };

    users.push(newUser);

    localStorage.setItem("users", JSON.stringify(users));

    setMessage("Account created successfully!");

    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p>Join EventHub today</p>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        <form onSubmit={handleSignup}>
          <label>Full Name</label>
          <input
            name="name"
            placeholder="Enter your name"
            value={form.name}
            onChange={handleChange}
            required
          />

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
            placeholder="Create password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <label>Account Type</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <button className="primary-btn" type="submit">
            Create Account
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
