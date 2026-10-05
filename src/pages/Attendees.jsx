import { useEffect, useState } from "react";

function Attendees() {
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    const data =
      JSON.parse(localStorage.getItem("registrations")) || [];

    setRegistrations(data);
  }, []);

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <span className="badge">ADMIN MODULE</span>
          <h1>Attendee Management</h1>
          <p>View all registered attendees.</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Attendee</th>
              <th>Email</th>
              <th>Event</th>
              <th>Ticket Price</th>
              <th>Registration Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.id}>
                <td>
                  <strong>{registration.userName}</strong>
                </td>

                <td>{registration.userEmail}</td>

                <td>{registration.eventTitle}</td>

                <td>₹{registration.price}</td>

                <td>{registration.registeredAt}</td>

                <td>
                  <span className="status">Confirmed</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {registrations.length === 0 && (
          <div className="empty-state">
            <h2>No Attendees</h2>
            <p>There are currently no event registrations.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Attendees;
