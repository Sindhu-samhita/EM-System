import { useState } from "react";
import {
  getCurrentTimestamp,
  getDateKey,
  getTicketId,
  getTodayDateKey,
  getWaitlistPromotions,
} from "../utils/eventUtils";
import { QRCodeSVG } from "qrcode.react";

function MyRegistrations() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [todayDateKey] = useState(getTodayDateKey);
  const [allEvents, setAllEvents] = useState(
    () => JSON.parse(localStorage.getItem("events")) || []
  );
  const [allRegistrations, setAllRegistrations] = useState(
    () => JSON.parse(localStorage.getItem("registrations")) || []
  );
  const [waitlist, setWaitlist] = useState(() => {
    const storedWaitlist = JSON.parse(localStorage.getItem("waitlist"));
    return Array.isArray(storedWaitlist) ? storedWaitlist : [];
  });
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [openTicketId, setOpenTicketId] = useState("");
  const [feedback, setFeedback] = useState(() => {
    const storedFeedback = JSON.parse(localStorage.getItem("eventFeedback"));
    return Array.isArray(storedFeedback) ? storedFeedback : [];
  });
  const [feedbackError, setFeedbackError] = useState("");
  const registrations = allRegistrations.filter(
    (registration) =>
      registration.accountEmail === currentUser.email ||
      (!registration.accountEmail &&
        registration.userEmail === currentUser.email)
  );
  const myWaitlist = waitlist.filter(
    (entry) =>
      (entry.accountEmail === currentUser.email ||
        (!entry.accountEmail && entry.userEmail === currentUser.email)) &&
      (entry.status || "waiting") === "waiting"
  );

  const hasEventEnded = (date) => {
    const dateKey = getDateKey(date);
    return Boolean(dateKey) && dateKey < todayDateKey;
  };

  const handleCancellation = (registration) => {
    const dateKey = getDateKey(registration.date);

    if (!dateKey || dateKey <= todayDateKey) {
      setActionError("Bookings can only be cancelled before the event day.");
      setActionMessage("");
      return;
    }

    if (Number(registration.checkedInCount) > 0) {
      setActionError("A booking with checked-in attendees cannot be cancelled.");
      setActionMessage("");
      return;
    }

    if (
      !window.confirm(
        "Cancel this booking? Its seats will be offered to the waitlist. No refund is processed."
      )
    ) {
      return;
    }

    const updatedRegistrations = allRegistrations.filter(
      (item) => String(item.id) !== String(registration.id)
    );
    const cancelledQuantity = Math.max(
      1,
      Number(registration.ticketQuantity) || 1
    );
    const updatedEvents = allEvents.map((event) =>
      String(event.id) === String(registration.eventId)
        ? {
            ...event,
            registered: Math.max(
              0,
              (Number(event.registered) || 0) - cancelledQuantity
            ),
          }
        : event
    );
    const releasedEvent = updatedEvents.find(
      (event) => String(event.id) === String(registration.eventId)
    );
    let updatedWaitlist = waitlist;
    let promotedRegistrations = [];

    if (releasedEvent) {
      const promotionResult = getWaitlistPromotions(
        releasedEvent,
        waitlist,
        getCurrentTimestamp()
      );
      updatedWaitlist = promotionResult.updatedWaitlist;
      promotedRegistrations = promotionResult.promotedRegistrations;

      const promotedEvent = {
        ...releasedEvent,
        registered: promotionResult.registered,
      };
      const eventIndex = updatedEvents.findIndex(
        (event) => String(event.id) === String(registration.eventId)
      );
      updatedEvents[eventIndex] = promotedEvent;
    }

    const finalRegistrations = [
      ...updatedRegistrations,
      ...promotedRegistrations,
    ];

    localStorage.setItem("registrations", JSON.stringify(finalRegistrations));
    localStorage.setItem("events", JSON.stringify(updatedEvents));
    localStorage.setItem("waitlist", JSON.stringify(updatedWaitlist));
    setAllRegistrations(finalRegistrations);
    setAllEvents(updatedEvents);
    setWaitlist(updatedWaitlist);
    setActionError("");
    setActionMessage(
      promotedRegistrations.length
        ? `Booking cancelled. ${promotedRegistrations.length} waitlist booking(s) were promoted.`
        : "Booking cancelled. No refund is processed."
    );
  };

  const handleWaitlistRemoval = (entry) => {
    const updatedWaitlist = waitlist.filter(
      (item) => String(item.id) !== String(entry.id)
    );
    setWaitlist(updatedWaitlist);
    localStorage.setItem("waitlist", JSON.stringify(updatedWaitlist));
    setActionError("");
    setActionMessage("Your waitlist request has been removed.");
  };

  const handleFeedbackSubmit = (registration, event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rating = Number(formData.get("rating"));

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setFeedbackError("Please choose a rating from 1 to 5.");
      return;
    }

    const review = {
      registrationId: registration.id,
      eventId: registration.eventId,
      eventTitle: registration.eventTitle,
      accountEmail: currentUser.email,
      userName: currentUser.name || registration.userName,
      rating,
      comment: String(formData.get("comment") || "").trim(),
      submittedAt: getCurrentTimestamp(),
    };
    const updatedFeedback = [...feedback, review];

    localStorage.setItem("eventFeedback", JSON.stringify(updatedFeedback));
    setFeedback(updatedFeedback);
    setFeedbackError("");
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <span className="badge">MY ACCOUNT</span>
          <h1>My Registrations</h1>
          <p>Events you have registered for.</p>
        </div>
      </div>

      {actionMessage && (
        <div className="success event-message">{actionMessage}</div>
      )}
      {actionError && <div className="error event-message">{actionError}</div>}

      {registrations.length === 0 && myWaitlist.length === 0 ? (
        <div className="empty-state">
          <h2>No Registrations Yet</h2>
          <p>Register for an event to see it here.</p>
        </div>
      ) : (
        <>
          {registrations.length > 0 && (
            <div className="registration-grid">
              {registrations.map((registration) => {
                const quantity = Math.max(
                  1,
                  Number(registration.ticketQuantity) || 1
                );
                const checkedInCount = Math.max(
                  0,
                  Number(registration.checkedInCount) || 0
                );
                const existingReview = feedback.find(
                  (review) =>
                    String(review.registrationId) ===
                      String(registration.id) &&
                    review.accountEmail === currentUser.email
                );

                return (
                  <div className="registration-card" key={registration.id}>
                    <div className="registration-icon">🎟️</div>

                    <div>
                      <h2>{registration.eventTitle}</h2>

                      <p>
                        <strong>Date:</strong> {registration.date}
                      </p>

                      <p>
                        <strong>People:</strong> {quantity}
                      </p>

                      <p>
                        <strong>Ticket:</strong>{" "}
                        {registration.ticketTypeName || "Standard"}
                      </p>

                      <p>
                        <strong>Checked in:</strong>{" "}
                        {Math.min(quantity, checkedInCount)} of {quantity}
                      </p>

                      <p>
                        <strong>Phone:</strong>{" "}
                        {registration.phone || "Not provided"}
                      </p>

                      <p>
                        <strong>Total Price:</strong> ₹
                        {(
                          (Number(registration.price) || 0) * quantity
                        ).toLocaleString("en-IN")}
                      </p>

                      <p>
                        <strong>Registered:</strong> {registration.registeredAt}
                      </p>

                      {registration.notes && (
                        <p>
                          <strong>Notes:</strong> {registration.notes}
                        </p>
                      )}

                      {(registration.dietaryPreference ||
                        registration.dietaryNotes) && (
                        <p>
                          <strong>Dietary needs:</strong>{" "}
                          {[registration.dietaryPreference, registration.dietaryNotes]
                            .filter(Boolean)
                            .join(" — ")}
                        </p>
                      )}

                      {registration.accessibilityNeeds && (
                        <p>
                          <strong>Accessibility:</strong>{" "}
                          {registration.accessibilityNeeds}
                        </p>
                      )}

                      <button
                        type="button"
                        className="secondary-btn digital-ticket-toggle"
                        aria-expanded={openTicketId === String(registration.id)}
                        onClick={() =>
                          setOpenTicketId((current) =>
                            current === String(registration.id)
                              ? ""
                              : String(registration.id)
                          )
                        }
                      >
                        {openTicketId === String(registration.id)
                          ? "Hide digital tickets"
                          : "View digital tickets"}
                      </button>

                      {openTicketId === String(registration.id) && (
                        <div className="digital-ticket-panel">
                          <p>
                            Show one QR ticket per person at event check-in.
                            Each code can be checked in once.
                          </p>
                          <div className="digital-ticket-grid">
                            {Array.from({ length: quantity }, (_, index) => {
                              const ticketNumber = index + 1;
                              const ticketPayload = {
                                version: 1,
                                eventId: registration.eventId,
                                registrationId: registration.id,
                                ticketNumber,
                              };

                              return (
                                <div
                                  className="digital-ticket"
                                  key={getTicketId(registration, ticketNumber)}
                                >
                                  <QRCodeSVG
                                    value={JSON.stringify(ticketPayload)}
                                    size={144}
                                    title={`Ticket ${ticketNumber} for ${registration.eventTitle}`}
                                  />
                                  <strong>Ticket {ticketNumber}</strong>
                                  <span>{registration.ticketTypeName || "Standard"}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {hasEventEnded(registration.date) &&
                        (existingReview ? (
                          <p className="feedback-confirmation">
                            Thank you for your {existingReview.rating}/5 rating.
                          </p>
                        ) : (
                          <form
                            className="feedback-form"
                            onSubmit={(event) =>
                              handleFeedbackSubmit(registration, event)
                            }
                          >
                            <label>
                              Rate this event
                              <select name="rating" defaultValue="" required>
                                <option value="" disabled>
                                  Choose a rating
                                </option>
                                {[5, 4, 3, 2, 1].map((rating) => (
                                  <option key={rating} value={rating}>
                                    {rating} / 5
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Comment (optional)
                              <textarea
                                name="comment"
                                rows="2"
                                maxLength="500"
                                placeholder="Share what you liked or what could improve."
                              />
                            </label>
                            {feedbackError && (
                              <p className="error">{feedbackError}</p>
                            )}
                            <button className="primary-btn" type="submit">
                              Submit feedback
                            </button>
                          </form>
                        ))}

                      {getDateKey(registration.date) > todayDateKey &&
                        checkedInCount === 0 && (
                          <button
                            type="button"
                            className="secondary-btn cancellation-btn"
                            onClick={() => handleCancellation(registration)}
                          >
                            Cancel booking
                          </button>
                        )}
                    </div>

                    <span className="status">
                      {registration.promotedFromWaitlist
                        ? "Promoted from waitlist"
                        : "Confirmed"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {myWaitlist.length > 0 && (
            <section className="waitlist-section">
              <h2>Waitlist requests</h2>
              <div className="registration-grid">
                {myWaitlist.map((entry) => (
                  <div className="registration-card" key={entry.id}>
                    <div className="registration-icon">⏳</div>
                    <div>
                      <h2>{entry.eventTitle}</h2>
                      <p>
                        <strong>Date:</strong> {entry.date}
                      </p>
                      <p>
                        <strong>Ticket:</strong>{" "}
                        {entry.ticketTypeName || "Standard"}
                      </p>
                      <p>
                        <strong>People:</strong> {entry.ticketQuantity}
                      </p>
                      <p>
                        <strong>Position:</strong> Joined{" "}
                        {entry.queuedAt
                          ? new Date(entry.queuedAt).toLocaleString()
                          : entry.registeredAt}
                      </p>
                      <button
                        type="button"
                        className="secondary-btn cancellation-btn"
                        onClick={() => handleWaitlistRemoval(entry)}
                      >
                        Remove from waitlist
                      </button>
                    </div>
                    <span className="status waitlist-status">Waitlisted</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default MyRegistrations;
