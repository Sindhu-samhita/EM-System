import { Link } from "react-router-dom";

function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="badge">EVENT MANAGEMENT SYSTEM</span>

          <h1>
            Create. Manage.
            <br />
            <span>Celebrate.</span>
          </h1>

          <p>
            EventHub helps organizers create events, manage attendees,
            monitor registrations and track ticket sales from one place.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="primary-btn">
              Get Started
            </Link>

            <Link to="/login" className="secondary-btn">
              Login
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="event-preview">
            <div className="preview-top">
              <span>Upcoming Event</span>
              <span>LIVE</span>
            </div>

            <h2>Tech Conference 2026</h2>

            <p>Technology • Hyderabad</p>

            <div className="preview-info">
              <div>
                <strong>15</strong>
                <small>NOV</small>
              </div>

              <div>
                <strong>200</strong>
                <small>Seats</small>
              </div>

              <div>
                <strong>₹499</strong>
                <small>Ticket</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Everything You Need</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Event Planning</h3>
            <p>Create and manage events with dates, locations and schedules.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Attendee Management</h3>
            <p>Track registrations and maintain attendee information.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎟️</div>
            <h3>Ticket Tracking</h3>
            <p>Monitor ticket prices, capacity and sales.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Understand event performance through dashboard statistics.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
