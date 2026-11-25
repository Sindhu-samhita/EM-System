import { useCallback, useEffect, useState } from "react";
import {
  getCheckedInTicketIds,
  getTicketId,
  updateCheckedInTicketIds,
} from "../utils/eventUtils";

function TicketScanner({ onScan, onError }) {
  useEffect(() => {
    let scanner;
    let isUnmounted = false;

    import("html5-qrcode")
      .then(({ Html5QrcodeScanner }) => {
        if (isUnmounted) {
          return;
        }

        scanner = new Html5QrcodeScanner(
          "ticket-qr-reader",
          { fps: 10, qrbox: { width: 240, height: 240 } },
          false
        );
        scanner.render(onScan, () => {});
      })
      .catch((error) => {
        if (!isUnmounted) {
          onError(`Could not load the QR scanner: ${error.message}`);
        }
      });

    return () => {
      isUnmounted = true;
      if (scanner) {
        scanner.clear().catch((error) => {
          console.error("Could not stop the QR scanner cleanly.", error);
        });
      }
    };
  }, [onScan, onError]);

  return <div id="ticket-qr-reader" />;
}

function Attendees() {
  const [registrations, setRegistrations] = useState(
    () => JSON.parse(localStorage.getItem("registrations")) || []
  );
  const [waitlist] = useState(() => {
    const storedWaitlist = JSON.parse(localStorage.getItem("waitlist"));
    return Array.isArray(storedWaitlist)
      ? storedWaitlist
          .filter((entry) => (entry.status || "waiting") === "waiting")
          .sort((first, second) =>
            String(first.queuedAt || "").localeCompare(
              String(second.queuedAt || "")
            )
          )
      : [];
  });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [scanError, setScanError] = useState("");
  const [manualTicketCode, setManualTicketCode] = useState("");

  const registeredPeople = registrations.reduce(
    (total, registration) =>
      total + Math.max(1, Number(registration.ticketQuantity) || 1),
    0
  );
  const checkedInPeople = registrations.reduce(
    (total, registration) =>
      total +
      getCheckedInTicketIds(registration).length,
    0
  );
  const queuePositionById = new Map();
  const eventQueueCounts = new Map();
  waitlist.forEach((entry) => {
    const eventId = String(entry.eventId);
    const position = (eventQueueCounts.get(eventId) || 0) + 1;
    eventQueueCounts.set(eventId, position);
    queuePositionById.set(String(entry.id), position);
  });

  const updateCheckInCount = (registrationId, change) => {
    const updatedRegistrations = registrations.map((registration) => {
      if (registration.id !== registrationId) {
        return registration;
      }

      return {
        ...registration,
        ...updateCheckedInTicketIds(registration, change),
      };
    });

    setRegistrations(updatedRegistrations);
    localStorage.setItem("registrations", JSON.stringify(updatedRegistrations));
  };

  const handleTicketScan = useCallback((decodedText) => {
    let ticket;

    try {
      ticket = JSON.parse(decodedText);
    } catch {
      setScanError("This QR code is not a valid EventHub ticket.");
      setScanMessage("");
      return;
    }

    if (
      !ticket ||
      ticket.version !== 1 ||
      ticket.registrationId === undefined ||
      ticket.eventId === undefined ||
      !Number.isInteger(ticket.ticketNumber)
    ) {
      setScanError("This QR code is not a valid EventHub ticket.");
      setScanMessage("");
      return;
    }

    const storedRegistrations = JSON.parse(
      localStorage.getItem("registrations") || "[]"
    );
    const registration = storedRegistrations.find(
      (item) =>
        String(item.id) === String(ticket.registrationId) &&
        String(item.eventId) === String(ticket.eventId)
    );

    if (!registration) {
      setScanError("No matching booking was found on this device.");
      setScanMessage("");
      return;
    }

    const quantity = Math.max(1, Number(registration.ticketQuantity) || 1);
    if (ticket.ticketNumber < 1 || ticket.ticketNumber > quantity) {
      setScanError("This ticket number is not part of the booking.");
      setScanMessage("");
      return;
    }

    const checkedInTicketIds = getCheckedInTicketIds(registration);
    const ticketId = getTicketId(registration, ticket.ticketNumber);

    if (checkedInTicketIds.includes(ticketId)) {
      setScanError(`Ticket ${ticket.ticketNumber} is already checked in.`);
      setScanMessage("");
      return;
    }

    const updatedRegistration = {
      ...registration,
      checkedInTicketIds: [...checkedInTicketIds, ticketId],
      checkedInCount: checkedInTicketIds.length + 1,
    };
    const updatedRegistrations = storedRegistrations.map((item) =>
      String(item.id) === String(registration.id)
        ? updatedRegistration
        : item
    );

    localStorage.setItem("registrations", JSON.stringify(updatedRegistrations));
    setRegistrations(updatedRegistrations);
    setScanMessage(
      `Checked in ticket ${ticket.ticketNumber} for ${registration.userName}.`
    );
    setScanError("");
    setScannerOpen(false);
  }, []);
  const handleScannerError = useCallback((message) => {
    setScanError(message);
    setScanMessage("");
  }, []);

  const handleManualTicketSubmit = (event) => {
    event.preventDefault();
    handleTicketScan(manualTicketCode);
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <span className="badge">ADMIN MODULE</span>
          <h1>Attendee Management</h1>
          <p>Review bookings and record event check-ins.</p>
        </div>
      </div>

      <div className="attendee-summary-grid">
        <div className="stat-card">
          <div className="stat-icon blue">🧾</div>
          <div>
            <span>Bookings</span>
            <strong>{registrations.length}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon saffron">🧍</div>
          <div>
            <span>Registered People</span>
            <strong>{registeredPeople}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div>
            <span>Checked In</span>
            <strong>{checkedInPeople}</strong>
          </div>
        </div>
      </div>

      <section className="dashboard-panel qr-checkin-panel">
        <div className="panel-header">
          <div>
            <h2>QR ticket check-in</h2>
            <p className="muted">
              Scan a ticket or paste its QR data. Camera access requires permission.
            </p>
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              setScannerOpen((open) => !open);
              setScanError("");
            }}
          >
            {scannerOpen ? "Close scanner" : "Open camera scanner"}
          </button>
        </div>
        {scannerOpen && (
          <TicketScanner
            onScan={handleTicketScan}
            onError={handleScannerError}
          />
        )}
        <form className="manual-ticket-form" onSubmit={handleManualTicketSubmit}>
          <label>
            Ticket QR data
            <input
              value={manualTicketCode}
              onChange={(event) => setManualTicketCode(event.target.value)}
              placeholder='{"version":1,"eventId":1,"registrationId":123,"ticketNumber":1}'
            />
          </label>
          <button type="submit" className="primary-btn">Check in ticket</button>
        </form>
        {scanMessage && <p className="success" role="status">{scanMessage}</p>}
        {scanError && <p className="error" role="alert">{scanError}</p>}
      </section>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Attendee</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Event</th>
              <th>Ticket Type</th>
              <th>People</th>
              <th>Check-in</th>
              <th>Total Price</th>
              <th>Registration Date</th>
              <th>Notes</th>
              <th>Dietary needs</th>
              <th>Accessibility needs</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {registrations.map((registration) => {
              const quantity = Math.max(
                1,
                Number(registration.ticketQuantity) || 1
              );
              const checkedInCount = getCheckedInTicketIds(registration).length;

              return (
                <tr key={registration.id}>
                  <td>
                    <strong>{registration.userName}</strong>
                  </td>
                  <td>{registration.userEmail}</td>
                  <td>{registration.phone || "—"}</td>
                  <td>{registration.eventTitle}</td>
                  <td>{registration.ticketTypeName || "Standard"}</td>
                  <td>{quantity}</td>
                  <td>
                    <div className="check-in-controls">
                      <button
                        type="button"
                        className="check-in-adjust"
                        aria-label={`Undo one check-in for ${registration.userName}`}
                        onClick={() =>
                          updateCheckInCount(registration.id, -1)
                        }
                        disabled={checkedInCount === 0}
                      >
                        −
                      </button>
                      <strong>
                        {checkedInCount}/{quantity}
                      </strong>
                      <button
                        type="button"
                        className="check-in-adjust"
                        aria-label={`Check in one person for ${registration.userName}`}
                        onClick={() =>
                          updateCheckInCount(registration.id, 1)
                        }
                        disabled={checkedInCount === quantity}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    ₹
                    {(
                      (Number(registration.price) || 0) * quantity
                    ).toLocaleString("en-IN")}
                  </td>
                  <td>{registration.registeredAt}</td>
                  <td>{registration.notes || "—"}</td>
                  <td>
                    {[registration.dietaryPreference, registration.dietaryNotes]
                      .filter(Boolean)
                      .join(" — ") || "—"}
                  </td>
                  <td>{registration.accessibilityNeeds || "—"}</td>
                  <td>
                    <span className="status">Confirmed</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {registrations.length === 0 && (
          <div className="empty-state">
            <h2>No Attendees</h2>
            <p>There are currently no event registrations.</p>
          </div>
        )}
      </div>

      <section className="dashboard-panel waitlist-admin-panel">
        <div className="panel-header">
          <div>
            <h2>Waitlist Queue</h2>
            <p className="muted">
              Pending bookings are ordered by when they joined.
            </p>
          </div>
        </div>
        {waitlist.length > 0 ? (
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Queue Position</th>
                  <th>Attendee</th>
                  <th>Event</th>
                  <th>Ticket Type</th>
                  <th>People Requested</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((entry) => (
                  <tr key={entry.id}>
                    <td>{queuePositionById.get(String(entry.id))}</td>
                    <td>
                      <strong>{entry.userName}</strong>
                      <span>{entry.userEmail}</span>
                    </td>
                    <td>{entry.eventTitle}</td>
                    <td>{entry.ticketTypeName || "Standard"}</td>
                    <td>{entry.ticketQuantity}</td>
                    <td>
                      {entry.queuedAt
                        ? new Date(entry.queuedAt).toLocaleString()
                        : entry.registeredAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">There are no pending waitlist requests.</p>
        )}
      </section>
    </main>
  );
}

export default Attendees;
