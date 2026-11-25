import { useRef, useState } from "react";
import { Link } from "react-router-dom";

const homeFeatures = [
  {
    id: "planning",
    icon: "📅",
    title: "Event Planning",
    description: "Create and manage events with dates, locations and schedules.",
    details:
      "Manage event setup as well as seating, organizer tasks, budgets, and the event-day schedule.",
    points: [
      "Create events with a date, time, location, ticket price, and capacity.",
      "Organize weddings, birthdays, engagements, and other functions.",
      "Assign booking parties to tables and track vendor costs.",
      "Build a timed event-day run sheet and organizer checklist.",
    ],
  },
  {
    id: "attendees",
    icon: "👥",
    title: "Attendee Management",
    description: "Track registrations and maintain attendee information.",
    details:
      "See who registered, how many people are in each booking, and how check-in is progressing.",
    points: [
      "Collect attendee names, email addresses, phone numbers, and notes.",
      "Record optional dietary and accessibility requirements.",
      "Review bookings and registration details in the attendee list.",
      "Show per-person QR tickets and scan them for duplicate-safe check-in.",
    ],
  },
  {
    id: "tickets",
    icon: "🎟️",
    title: "Ticket Tracking",
    description: "Monitor ticket prices, capacity and sales.",
    details:
      "Follow ticket quantities and event capacity so organizers can see how many seats are booked or still available.",
    points: [
      "Count each person in a booking toward event capacity.",
      "See remaining seats for each event.",
      "Track ticket revenue in the admin reports.",
    ],
  },
  {
    id: "analytics",
    icon: "📊",
    title: "Analytics",
    description: "Explore registrations, attendance, revenue and event performance.",
    details:
      "Use the analytics dashboard to understand how events are performing and review trends across registrations, attendance, and revenue.",
    points: [
      "Compare event bookings, capacity, and revenue.",
      "Review registration and check-in trends.",
      "Explore event schedules and attendee feedback ratings.",
    ],
  },
];

const getFeatureAction = (featureId, currentUser) => {
  if (featureId === "planning") {
    return currentUser?.role === "admin"
      ? { to: "/admin/events", label: "Manage events" }
      : currentUser?.role === "user"
        ? { to: "/events", label: "Browse events" }
        : { to: "/signup", label: "Get started" };
  }

  if (featureId === "attendees") {
    return currentUser?.role === "admin"
      ? { to: "/admin/attendees", label: "View attendees" }
      : currentUser?.role === "user"
        ? { to: "/my-registrations", label: "View my registrations" }
        : { to: "/login", label: "Log in to continue" };
  }

  if (featureId === "tickets") {
    return currentUser?.role === "admin"
      ? { to: "/admin/analytics", label: "View ticket analytics" }
      : currentUser?.role === "user"
        ? { to: "/events", label: "Browse events" }
        : { to: "/login", label: "Log in to continue" };
  }

  return currentUser?.role === "admin"
    ? { to: "/admin/analytics", label: "Open analytics dashboard" }
    : { to: "/login", label: "Log in for admin analytics" };
};

function Home() {
  const [activeFeatureId, setActiveFeatureId] = useState("planning");
  const [currentUser] = useState(() =>
    JSON.parse(localStorage.getItem("currentUser"))
  );
  const featureTabRefs = useRef([]);
  const activeFeature =
    homeFeatures.find((feature) => feature.id === activeFeatureId) ||
    homeFeatures[0];
  const activeAction = getFeatureAction(activeFeature.id, currentUser);

  const handleFeatureKeyDown = (event, currentIndex) => {
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % homeFeatures.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + homeFeatures.length) % homeFeatures.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = homeFeatures.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextFeature = homeFeatures[nextIndex];
    setActiveFeatureId(nextFeature.id);
    featureTabRefs.current[nextIndex]?.focus();
  };

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

            <h2>Business Workshop</h2>

            <p>Business • Vijayawada</p>

            <div className="preview-info">
              <div>
                <strong>05</strong>
                <small>DEC</small>
              </div>

              <div>
                <strong>100</strong>
                <small>Seats</small>
              </div>

              <div>
                <strong>₹299</strong>
                <small>Ticket</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Everything You Need</h2>

        <div
          className="feature-grid"
          role="tablist"
          aria-label="EventHub features"
        >
          {homeFeatures.map((feature, index) => (
            <button
              type="button"
              className={`feature-card feature-tab-button ${
                activeFeatureId === feature.id ? "active" : ""
              }`}
              id={`home-feature-tab-${feature.id}`}
              role="tab"
              aria-selected={activeFeatureId === feature.id}
              aria-controls="home-feature-panel"
              tabIndex={activeFeatureId === feature.id ? 0 : -1}
              key={feature.id}
              ref={(element) => {
                featureTabRefs.current[index] = element;
              }}
              onClick={() => setActiveFeatureId(feature.id)}
              onKeyDown={(event) => handleFeatureKeyDown(event, index)}
            >
              <span className="feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <span className="feature-tab-title">{feature.title}</span>
              <span className="feature-tab-description">
                {feature.description}
              </span>
            </button>
          ))}
        </div>

        <section
          className="home-feature-panel"
          id="home-feature-panel"
          role="tabpanel"
          aria-labelledby={`home-feature-tab-${activeFeature.id}`}
          tabIndex={0}
        >
          <div className="home-feature-panel-icon" aria-hidden="true">
            {activeFeature.icon}
          </div>
          <div className="home-feature-panel-content">
            <h3>{activeFeature.title}</h3>
            <p>{activeFeature.details}</p>
            <ul>
              {activeFeature.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link to={activeAction.to} className="primary-btn">
              {activeAction.label}
            </Link>
            {currentUser?.role === "admin" &&
              activeFeature.id === "planning" && (
                <Link to="/admin/planning" className="secondary-btn">
                  Open planning tools
                </Link>
              )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default Home;
