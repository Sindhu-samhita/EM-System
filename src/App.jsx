import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Events from "./pages/Events";
import MyRegistrations from "./pages/MyRegistrations";

import AdminDashboard from "./pages/AdminDashboard";
import ManageEvents from "./pages/ManageEvents";
import AddEvent from "./pages/AddEvent";
import Attendees from "./pages/Attendees";

function App() {
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.length === 0) {
      const demoUsers = [
        {
          id: 1,
          name: "Admin",
          email: "admin@gmail.com",
          password: "admin123",
          role: "admin",
        },
        {
          id: 2,
          name: "Demo User",
          email: "user@gmail.com",
          password: "user123",
          role: "user",
        },
      ];

      localStorage.setItem("users", JSON.stringify(demoUsers));
    }

    const events = JSON.parse(localStorage.getItem("events"));

    if (!events) {
      const demoEvents = [
        {
          id: 1,
          title: "Tech Conference 2026",
          description:
            "A conference featuring the latest trends in technology and software development.",
          date: "2026-11-15",
          time: "10:00 AM",
          location: "Hyderabad Convention Center",
          category: "Technology",
          price: 499,
          capacity: 200,
          registered: 35,
          image:
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        },
        {
          id: 2,
          title: "Business Workshop",
          description:
            "Learn business strategy, leadership and entrepreneurship from industry experts.",
          date: "2026-12-05",
          time: "11:00 AM",
          location: "Vijayawada Business Hub",
          category: "Business",
          price: 299,
          capacity: 100,
          registered: 20,
          image:
            "https://images.unsplash.com/photo-1556761175-b413da4baf72",
        },
        {
          id: 3,
          title: "Music Festival",
          description:
            "An exciting live music event featuring multiple artists and performances.",
          date: "2026-12-20",
          time: "6:00 PM",
          location: "Bengaluru Arena",
          category: "Entertainment",
          price: 799,
          capacity: 500,
          registered: 125,
          image:
            "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
        },
      ];

      localStorage.setItem("events", JSON.stringify(demoEvents));
    }

    const registrations = localStorage.getItem("registrations");

    if (!registrations) {
      localStorage.setItem("registrations", JSON.stringify([]));
    }
  }, []);

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/events"
          element={
            <ProtectedRoute role="user">
              <Events />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-registrations"
          element={
            <ProtectedRoute role="user">
              <MyRegistrations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/events"
          element={
            <ProtectedRoute role="admin">
              <ManageEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/add-event"
          element={
            <ProtectedRoute role="admin">
              <AddEvent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendees"
          element={
            <ProtectedRoute role="admin">
              <Attendees />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
