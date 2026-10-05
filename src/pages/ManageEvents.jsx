import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ManageEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setEvents(JSON.parse(localStorage.getItem("events")) || []);
  }, []);

  const deleteEvent = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmDelete) return;

    const updatedEvents = events.filter((event) => event.id !== id);

    setEvents(updatedEvents);

    localStorage.setItem("events", JSON.stringify(updatedEvents));
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <span className="badge">ADMIN MODULE</span>
          <h1>Manage Events</h1>
          <p>Create and manage your events.</p>
        </div>

        <Link to="/admin/add-event" className="primary-btn">
          + Add Event
        </Link>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Category</th>
              <th>Price</th>
              <th>Registrations</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>
                  <strong>{event.title}</strong>
                </td>

                <td>{event.date}</td>

                <td>
                  <span className="category">{event.category}</span>
                </td>

                <td>₹{event.price}</td>

                <td>
                  {event.registered}/{event.capacity}
                </td>

                <td>
                  <button
                    className="delete-btn"
                    onClick={() => deleteEvent(event.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default ManageEvents;
