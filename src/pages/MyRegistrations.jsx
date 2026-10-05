import { useEffect, useState } from "react";

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    const allRegistrations =
      JSON.parse(localStorage.getItem("registrations")) || [];

    const userRegistrations = allRegistrations.filter(
      (registration) =>
        registration.userEmail === currentUser.email
    );

    setRegistrations(userRegistrations);
  }, [currentUser.email]);

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <span className="badge">MY ACCOUNT</span>
          <h1>My Registrations</h1>
          <p>Events you have registered for.</p>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="empty-state">
          <h2>No Registrations Yet</h2>
          <p>Register for an event to see it here.</p>
        </div>
      ) : (
        <div className="registration-grid">
          {registrations.map((registration) => (
            <div className="registration-card" key={registration.id}>
              <div className="registration-icon">🎟️</div>

              <div>
                <h2>{registration.eventTitle}</h2>

                <p>
                  <strong>Date:</strong> {registration.date}
                </p>

                <p>
                  <strong>Ticket Price:</strong> ₹{registration.price}
                </p>

                <p>
                  <strong>Registered:</strong>{" "}
                  {registration.registeredAt}
                </p>
              </div>

              <span className="status">Confirmed</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyRegistrations;
