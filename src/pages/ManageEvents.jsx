import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTicketTypes } from "../utils/eventUtils";

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
    [
      "eventSeatingPlans",
      "eventOrganizerPlans",
      "eventSchedules",
    ].forEach((storageKey) => {
      const plans = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(plans)) {
        localStorage.setItem(
          storageKey,
          JSON.stringify(
            plans.filter((plan) => String(plan.eventId) !== String(id))
          )
        );
      }
    });
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
              <th>Ticket Types</th>
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
                  <span className="category" data-category={event.category}>
                    {event.category}
                  </span>
                </td>

                <td>
                  {getTicketTypes(event).map((ticketType) => (
                    <span className="ticket-type-price" key={ticketType.id}>
                      {ticketType.name}: ₹{ticketType.price}
                    </span>
                  ))}
                </td>

                <td>
                  {event.registered}/{event.capacity}
                  {Number(event.capacity) > 0 &&
                    (Number(event.registered) || 0) / Number(event.capacity) >=
                      0.8 && (
                      <span className="capacity-alert-label">
                        {(Number(event.registered) || 0) >=
                        Number(event.capacity)
                          ? "Sold out"
                          : "80%+ capacity"}
                      </span>
                    )}
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
