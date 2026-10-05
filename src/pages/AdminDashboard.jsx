import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    setEvents(JSON.parse(localStorage.getItem("events")) || []);
    setRegistrations(
      JSON.parse(localStorage.getItem("registrations")) || []
    );
  }, []);

  const totalEvents = events.length;

  const totalRegistrations = events.reduce(
    (total, event) => total + event.registered,
    0
  );

  const totalCapacity = events.reduce(
    (total, event) => total + event.capacity,
    0
  );

  const totalRevenue = registrations.reduce(
    (total, registration) => total + Number(registration.price),
    0
  );

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <span className="badge">ADMIN MODULE</span>
          <h1>Admin Dashboard</h1>
          <p>Monitor your complete event management system.</p>
        </div>

        <Link to="/admin/add-event" className="primary-btn">
          + Create Event
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">📅</div>
          <div>
            <span>Total Events</span>
            <strong>{totalEvents}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div>
            <span>Registrations</span>
            <strong>{totalRegistrations}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">🎟️</div>
          <div>
            <span>Available Seats</span>
            <strong>{totalCapacity - totalRegistrations}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">₹</div>
          <div>
            <span>Revenue</span>
            <strong>₹{totalRevenue}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Event Overview</h2>
            <Link to="/admin/events">View All</Link>
          </div>

          {events.map((event) => (
            <div className="overview-row" key={event.id}>
              <div>
                <strong>{event.title}</strong>
                <span>{event.category}</span>
              </div>

              <div className="progress-container">
                <div className="progress">
                  <div
                    style={{
                      width: `${
                        (event.registered / event.capacity) * 100
                      }%`,
                    }}
                  />
                </div>

                <small>
                  {event.registered}/{event.capacity}
                </small>
              </div>
            </div>
          ))}
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Recent Registrations</h2>
            <Link to="/admin/attendees">View All</Link>
          </div>

          {registrations.slice(-5).reverse().map((registration) => (
            <div className="attendee-row" key={registration.id}>
              <div className="avatar">
                {registration.userName.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{registration.userName}</strong>
                <span>{registration.eventTitle}</span>
              </div>

              <span className="status">Confirmed</span>
            </div>
          ))}

          {registrations.length === 0 && (
            <p className="muted">No registrations yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;
