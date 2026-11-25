import { useState } from "react";
import {
  createWaitlistId,
  getCurrentTimestamp,
  getTicketTypes,
  isUpcomingEvent as isEventUpcoming,
} from "../utils/eventUtils";

function Events() {
  const [events, setEvents] = useState(
    () => JSON.parse(localStorage.getItem("events")) || []
  );
  const [registrations, setRegistrations] = useState(
    () => JSON.parse(localStorage.getItem("registrations")) || []
  );
  const [waitlist, setWaitlist] = useState(() => {
    const storedWaitlist = JSON.parse(localStorage.getItem("waitlist"));
    return Array.isArray(storedWaitlist) ? storedWaitlist : [];
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [registrationEventId, setRegistrationEventId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    ticketQuantity: "1",
    ticketTypeId: "standard",
    notes: "",
    dietaryPreference: "",
    dietaryNotes: "",
    accessibilityNeeds: "",
  });

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const hasRegistration = (event) =>
    registrations.some(
      (registration) =>
        String(registration.eventId) === String(event.id) &&
        (registration.accountEmail === currentUser.email ||
          (!registration.accountEmail &&
            registration.userEmail === currentUser.email))
    );

  const hasWaitingEntry = (event) =>
    waitlist.some(
      (entry) =>
        String(entry.eventId) === String(event.id) &&
        (entry.accountEmail === currentUser.email ||
          (!entry.accountEmail && entry.userEmail === currentUser.email)) &&
        (entry.status || "waiting") === "waiting"
    );

  const openRegistrationForm = (event) => {
    if (!isEventUpcoming(event)) {
      setRegistrationError("Registration is closed for completed events.");
      return;
    }

    if (hasRegistration(event)) {
      setRegistrationError("You are already registered for this event.");
      return;
    }

    if (hasWaitingEntry(event)) {
      setRegistrationError("You already have a booking in this event's waitlist.");
      return;
    }

    const ticketTypes = getTicketTypes(event);
    setMessage("");
    setRegistrationError("");
    setRegistrationEventId(event.id);
    setForm({
      name: currentUser.name || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      ticketQuantity: "1",
      ticketTypeId: ticketTypes[0].id,
      notes: "",
      dietaryPreference: "",
      dietaryNotes: "",
      accessibilityNeeds: "",
    });
  };

  const handleRegistration = (submittedEvent, event) => {
    event.preventDefault();

    if (!isEventUpcoming(submittedEvent)) {
      setRegistrationError("Registration is closed for completed events.");
      setRegistrationEventId(null);
      return;
    }

    const quantity = Number(form.ticketQuantity);
    const capacity = Math.max(0, Number(submittedEvent.capacity) || 0);
    const registered = Math.max(0, Number(submittedEvent.registered) || 0);
    const seatsLeft = Math.max(0, capacity - registered);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > capacity) {
      setRegistrationError(
        `Enter a ticket quantity between 1 and ${capacity}.`
      );
      return;
    }

    if (hasRegistration(submittedEvent)) {
      setRegistrationError("You are already registered for this event.");
      return;
    }

    if (hasWaitingEntry(submittedEvent)) {
      setRegistrationError("You already have a booking in this event's waitlist.");
      return;
    }

    const ticketType = getTicketTypes(submittedEvent).find(
      (item) => item.id === form.ticketTypeId
    );

    if (!ticketType) {
      setRegistrationError("Please select a valid ticket type.");
      return;
    }

    const registeredAt = new Date(getCurrentTimestamp());
    const bookingDetails = {
      eventId: submittedEvent.id,
      eventTitle: submittedEvent.title,
      date: submittedEvent.date,
      price: Number(ticketType.price),
      ticketTypeId: ticketType.id,
      ticketTypeName: ticketType.name,
      userName: form.name.trim(),
      userEmail: form.email.trim(),
      accountEmail: currentUser.email,
      phone: form.phone.trim(),
      ticketQuantity: quantity,
      checkedInCount: 0,
      checkedInTicketIds: [],
      notes: form.notes.trim(),
      dietaryPreference: form.dietaryPreference,
      dietaryNotes: form.dietaryNotes.trim(),
      accessibilityNeeds: form.accessibilityNeeds.trim(),
      registeredAt: registeredAt.toLocaleDateString(),
      registeredAtIso: registeredAt.toISOString(),
    };

    if (quantity > seatsLeft) {
      const waitlistEntry = {
        ...bookingDetails,
        id: createWaitlistId(registeredAt.toISOString()),
        status: "waiting",
        queuedAt: registeredAt.toISOString(),
      };
      const updatedWaitlist = [...waitlist, waitlistEntry];

      setWaitlist(updatedWaitlist);
      localStorage.setItem("waitlist", JSON.stringify(updatedWaitlist));
      setRegistrationEventId(null);
      setRegistrationError("");
      setMessage(
        `Added to the waitlist for ${submittedEvent.title}. We'll promote your booking if enough seats become available.`
      );
      return;
    }

    const registration = {
      ...bookingDetails,
      id: registeredAt.getTime(),
    };

    const updatedRegistrations = [...registrations, registration];
    setRegistrations(updatedRegistrations);
    localStorage.setItem("registrations", JSON.stringify(updatedRegistrations));

    const updatedEvents = events.map((item) =>
      String(item.id) === String(submittedEvent.id)
        ? { ...item, registered: Number(item.registered || 0) + quantity }
        : item
    );

    setEvents(updatedEvents);
    localStorage.setItem("events", JSON.stringify(updatedEvents));
    setRegistrationEventId(null);
    setRegistrationError("");
    setMessage(
      `Registration confirmed for ${submittedEvent.title} (${quantity} ${
        quantity === 1 ? "person" : "people"
      }).`
    );
  };

  const upcomingEvents = events.filter((event) => isEventUpcoming(event));
  const categories = [
    "All",
    ...new Set(upcomingEvents.map((event) => event.category)),
  ];

  const visibleEvents = upcomingEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      category === "All" || event.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <span className="badge">DISCOVER EVENTS</span>
          <h1>Upcoming Events</h1>
          <p>Find an event and reserve your seat.</p>
        </div>

        <input
          className="search-input"
          type="search"
          placeholder="Search events or locations"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="event-filters" aria-label="Event categories">
        {categories.map((item) => (
          <button
            type="button"
            key={item}
            className={category === item ? "filter-btn active" : "filter-btn"}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {message && <div className="success event-message">{message}</div>}
      {registrationError && (
        <div className="error event-message">{registrationError}</div>
      )}

      {visibleEvents.length === 0 ? (
        <div className="empty-state">
          <h2>No Upcoming Events Found</h2>
          <p>Try a different search or category.</p>
        </div>
      ) : (
        <div className="event-grid">
          {visibleEvents.map((event) => {
            const capacity = Math.max(0, Number(event.capacity) || 0);
            const registered = Math.max(0, Number(event.registered) || 0);
            const seatsLeft = Math.max(0, capacity - registered);
            const fillPercentage = capacity
              ? Math.min((registered / capacity) * 100, 100)
              : 0;
            const ticketTypes = getTicketTypes(event);
            const selectedTicket =
              ticketTypes.find(
                (ticketType) => ticketType.id === form.ticketTypeId
              ) || ticketTypes[0];
            const isRegistered = hasRegistration(event);
            const isWaitlisted = hasWaitingEntry(event);
            const isRegistrationOpen =
              String(registrationEventId) === String(event.id);

            return (
              <article
                className="event-card"
                data-category={event.category}
                key={event.id}
              >
                <img src={event.image} alt={event.title} />
                <div className="event-content">
                  <span className="category" data-category={event.category}>
                    {event.category}
                  </span>
                  <h2>{event.title}</h2>
                  <p>{event.description}</p>

                  <div className="event-details">
                    <span>📅 {event.date} at {event.time}</span>
                    <span>📍 {event.location}</span>
                  </div>

                  <div className="event-bottom">
                    <div>
                      <strong>
                        From ₹
                        {Math.min(
                          ...ticketTypes.map((ticketType) =>
                            Number(ticketType.price)
                          )
                        ).toLocaleString("en-IN")}
                      </strong>
                      <span>{seatsLeft} seats left</span>
                    </div>
                    <button
                      type="button"
                      className="primary-btn"
                      disabled={isRegistered || isWaitlisted}
                      onClick={() => openRegistrationForm(event)}
                    >
                      {isRegistered
                        ? "Registered"
                        : isWaitlisted
                          ? "Waitlisted"
                          : seatsLeft <= 0
                            ? "Join waitlist"
                            : isRegistrationOpen
                              ? "Form Open"
                              : "Register"}
                    </button>
                  </div>

                  {capacity > 0 && fillPercentage >= 80 && (
                    <p className="capacity-alert" role="status">
                      {seatsLeft === 0
                        ? "Sold out. Join the waitlist to be considered if a booking is cancelled."
                        : `Filling fast: ${Math.round(fillPercentage)}% booked, ${seatsLeft} seats remaining.`}
                    </p>
                  )}

                  {isRegistrationOpen && (
                    <form
                      className="event-registration-form"
                      onSubmit={(submitEvent) =>
                        handleRegistration(event, submitEvent)
                      }
                    >
                      <h3>Register for this event</h3>
                      <div className="registration-form-grid">
                        <label>
                          Full name
                          <input
                            name="name"
                            value={form.name}
                            onChange={(event) =>
                              setForm({ ...form, name: event.target.value })
                            }
                            required
                          />
                        </label>
                        <label>
                          Email
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={(event) =>
                              setForm({ ...form, email: event.target.value })
                            }
                            required
                          />
                        </label>
                        <label>
                          Phone
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={(event) =>
                              setForm({ ...form, phone: event.target.value })
                            }
                            required
                          />
                        </label>
                        <label>
                          Ticket type
                          <select
                            name="ticketTypeId"
                            value={form.ticketTypeId}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                ticketTypeId: event.target.value,
                              })
                            }
                          >
                            {ticketTypes.map((ticketType) => (
                              <option key={ticketType.id} value={ticketType.id}>
                                {ticketType.name} — ₹
                                {Number(ticketType.price).toLocaleString("en-IN")}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Number of people
                          <input
                            type="number"
                            name="ticketQuantity"
                            value={form.ticketQuantity}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                ticketQuantity: event.target.value,
                              })
                            }
                            min="1"
                            max={capacity}
                            required
                          />
                        </label>
                        <label className="registration-notes">
                          Additional notes
                          <textarea
                            name="notes"
                            value={form.notes}
                            onChange={(event) =>
                              setForm({ ...form, notes: event.target.value })
                            }
                            rows="3"
                            placeholder="Optional"
                          />
                        </label>
                        <label>
                          Dietary preference
                          <select
                            name="dietaryPreference"
                            value={form.dietaryPreference}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                dietaryPreference: event.target.value,
                              })
                            }
                          >
                            <option value="">No preference specified</option>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Vegan">Vegan</option>
                            <option value="Gluten-free">Gluten-free</option>
                            <option value="Other">Other</option>
                          </select>
                        </label>
                        <label>
                          Dietary details
                          <input
                            name="dietaryNotes"
                            value={form.dietaryNotes}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                dietaryNotes: event.target.value,
                              })
                            }
                            placeholder="Optional"
                          />
                        </label>
                        <label className="registration-notes">
                          Accessibility requirements
                          <textarea
                            name="accessibilityNeeds"
                            value={form.accessibilityNeeds}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                accessibilityNeeds: event.target.value,
                              })
                            }
                            rows="2"
                            placeholder="Optional; share only what the organizer needs to know"
                          />
                        </label>
                      </div>
                      <p className="registration-total">
                        Total: ₹
                        {(
                          Number(selectedTicket.price) *
                          (Number(form.ticketQuantity) || 0)
                        ).toLocaleString("en-IN")}
                        {Number(form.ticketQuantity) > seatsLeft && (
                          <span className="waitlist-note">
                            This party size will be added to the waitlist.
                          </span>
                        )}
                      </p>
                      <div className="registration-form-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => {
                            setRegistrationEventId(null);
                            setRegistrationError("");
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="primary-btn">
                          {Number(form.ticketQuantity) > seatsLeft
                            ? "Join Waitlist"
                            : "Confirm Registration"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Events;
