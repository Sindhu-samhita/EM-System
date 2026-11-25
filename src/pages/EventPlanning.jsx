import { useState } from "react";

const readStoredArray = (key) => {
  const value = JSON.parse(localStorage.getItem(key) || "[]");
  return Array.isArray(value) ? value : [];
};

const persistEventRecord = (
  records,
  setRecords,
  storageKey,
  eventId,
  defaults,
  update
) => {
  const existing = records.find(
    (record) => String(record.eventId) === String(eventId)
  );
  const updatedRecord = update(existing || { ...defaults, eventId });
  const updatedRecords = existing
    ? records.map((record) =>
        String(record.eventId) === String(eventId) ? updatedRecord : record
      )
    : [...records, updatedRecord];

  setRecords(updatedRecords);
  localStorage.setItem(storageKey, JSON.stringify(updatedRecords));
};

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function EventPlanning() {
  const [events] = useState(() => readStoredArray("events"));
  const [registrations] = useState(() =>
    readStoredArray("registrations")
  );
  const [selectedEventId, setSelectedEventId] = useState(() =>
    String(readStoredArray("events")[0]?.id ?? "")
  );
  const [activeTab, setActiveTab] = useState("seating");
  const [seatingPlans, setSeatingPlans] = useState(() =>
    readStoredArray("eventSeatingPlans")
  );
  const [organizerPlans, setOrganizerPlans] = useState(() =>
    readStoredArray("eventOrganizerPlans")
  );
  const [schedules, setSchedules] = useState(() =>
    readStoredArray("eventSchedules")
  );
  const [tableName, setTableName] = useState("");
  const [tableCapacity, setTableCapacity] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [vendorForm, setVendorForm] = useState({
    name: "",
    service: "",
    contact: "",
    cost: "",
    paid: false,
  });
  const [agendaForm, setAgendaForm] = useState({
    time: "",
    title: "",
    owner: "",
    notes: "",
  });
  const [planningError, setPlanningError] = useState("");

  const selectedEvent = events.find(
    (event) => String(event.id) === selectedEventId
  );
  const seatingPlan = seatingPlans.find(
    (plan) => String(plan.eventId) === selectedEventId
  ) || { tables: [], assignments: [] };
  const organizerPlan = organizerPlans.find(
    (plan) => String(plan.eventId) === selectedEventId
  ) || { budgetLimit: "", tasks: [], vendors: [] };
  const schedule = schedules.find(
    (item) => String(item.eventId) === selectedEventId
  ) || { items: [] };
  const eventRegistrations = registrations.filter(
    (registration) => String(registration.eventId) === selectedEventId
  );

  const saveSeatingPlan = (update) => {
    persistEventRecord(
      seatingPlans,
      setSeatingPlans,
      "eventSeatingPlans",
      selectedEventId,
      { tables: [], assignments: [] },
      update
    );
    setPlanningError("");
  };

  const saveOrganizerPlan = (update) => {
    persistEventRecord(
      organizerPlans,
      setOrganizerPlans,
      "eventOrganizerPlans",
      selectedEventId,
      { budgetLimit: "", tasks: [], vendors: [] },
      update
    );
    setPlanningError("");
  };

  const saveSchedule = (update) => {
    persistEventRecord(
      schedules,
      setSchedules,
      "eventSchedules",
      selectedEventId,
      { items: [] },
      update
    );
    setPlanningError("");
  };

  const addTable = (event) => {
    event.preventDefault();
    const capacity = Number(tableCapacity);
    const name = tableName.trim();

    if (!name || !Number.isInteger(capacity) || capacity < 1) {
      setPlanningError("Enter a table name and a whole-number capacity above zero.");
      return;
    }

    saveSeatingPlan((plan) => ({
      ...plan,
      tables: [...plan.tables, { id: makeId(), name, capacity }],
    }));
    setTableName("");
    setTableCapacity("");
  };

  const removeTable = (tableId) => {
    if (seatingPlan.assignments.some((item) => item.tableId === tableId)) {
      setPlanningError("Unassign the bookings at this table before removing it.");
      return;
    }

    saveSeatingPlan((plan) => ({
      ...plan,
      tables: plan.tables.filter((table) => table.id !== tableId),
    }));
  };

  const assignBooking = (registration, tableId) => {
    const partySize = Math.max(1, Number(registration.ticketQuantity) || 1);
    const remainingAssignments = seatingPlan.assignments.filter(
      (assignment) =>
        String(assignment.registrationId) !== String(registration.id)
    );

    if (tableId) {
      const table = seatingPlan.tables.find(
        (item) => String(item.id) === String(tableId)
      );
      const occupiedSeats = remainingAssignments
        .filter((assignment) => String(assignment.tableId) === String(tableId))
        .reduce((total, assignment) => total + Number(assignment.seats || 0), 0);

      if (!table || occupiedSeats + partySize > Number(table.capacity)) {
        setPlanningError("That table does not have enough seats for this booking party.");
        return;
      }

      remainingAssignments.push({
        registrationId: registration.id,
        tableId: table.id,
        seats: partySize,
      });
    }

    saveSeatingPlan((plan) => ({
      ...plan,
      assignments: remainingAssignments,
    }));
  };

  const addTask = (event) => {
    event.preventDefault();
    const title = taskTitle.trim();

    if (!title) {
      return;
    }

    saveOrganizerPlan((plan) => ({
      ...plan,
      tasks: [
        ...plan.tasks,
        { id: makeId(), title, dueDate: taskDueDate, completed: false },
      ],
    }));
    setTaskTitle("");
    setTaskDueDate("");
  };

  const updateTask = (taskId, update) => {
    saveOrganizerPlan((plan) => ({
      ...plan,
      tasks: plan.tasks.map((task) =>
        String(task.id) === String(taskId) ? { ...task, ...update } : task
      ),
    }));
  };

  const addVendor = (event) => {
    event.preventDefault();
    const cost = Number(vendorForm.cost);

    if (!vendorForm.name.trim() || !Number.isFinite(cost) || cost < 0) {
      setPlanningError("Enter a vendor name and a non-negative estimated cost.");
      return;
    }

    saveOrganizerPlan((plan) => ({
      ...plan,
      vendors: [
        ...plan.vendors,
        {
          ...vendorForm,
          id: makeId(),
          name: vendorForm.name.trim(),
          service: vendorForm.service.trim(),
          contact: vendorForm.contact.trim(),
          cost,
        },
      ],
    }));
    setVendorForm({
      name: "",
      service: "",
      contact: "",
      cost: "",
      paid: false,
    });
  };

  const addAgendaItem = (event) => {
    event.preventDefault();
    if (!agendaForm.time || !agendaForm.title.trim()) {
      setPlanningError("Add a time and title for the schedule item.");
      return;
    }

    saveSchedule((plan) => ({
      ...plan,
      items: [...plan.items, { ...agendaForm, id: makeId(), title: agendaForm.title.trim() }]
        .sort((first, second) => first.time.localeCompare(second.time)),
    }));
    setAgendaForm({ time: "", title: "", owner: "", notes: "" });
  };

  const plannedCosts = organizerPlan.vendors.reduce(
    (total, vendor) => total + (Number(vendor.cost) || 0),
    0
  );
  const paidCosts = organizerPlan.vendors.reduce(
    (total, vendor) =>
      total + (vendor.paid ? Number(vendor.cost) || 0 : 0),
    0
  );

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <span className="badge">ADMIN MODULE</span>
          <h1>Event Planning Tools</h1>
          <p>Coordinate seating, event tasks, budgets, and the day-of schedule.</p>
        </div>
      </div>

      {events.length > 0 ? (
        <label className="planning-event-select">
          Select event
          <select
            value={selectedEventId}
            onChange={(event) => {
              setSelectedEventId(event.target.value);
              setPlanningError("");
            }}
          >
            {events.map((event) => (
              <option key={event.id} value={String(event.id)}>
                {event.title} — {event.date}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="empty-state">
          <h2>Create an event to start planning</h2>
        </div>
      )}

      {selectedEvent && (
        <>
          <div className="planning-tabs" role="tablist" aria-label="Planning tools">
            {[
              ["seating", "Seating Planner"],
              ["organizer", "Checklist & Budget"],
              ["schedule", "Event-day Schedule"],
            ].map(([tab, label]) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={activeTab === tab ? "planning-tab active" : "planning-tab"}
                key={tab}
                onClick={() => setActiveTab(tab)}
              >
                {label}
              </button>
            ))}
          </div>

          {planningError && (
            <p className="error event-message" role="alert">
              {planningError}
            </p>
          )}

          {activeTab === "seating" && (
            <section className="dashboard-panel planning-panel">
              <div className="panel-header">
                <div>
                  <h2>Seating for {selectedEvent.title}</h2>
                  <p className="muted">
                    Assign each booking party to one table; a party stays together.
                  </p>
                </div>
              </div>
              <form className="planning-inline-form" onSubmit={addTable}>
                <label>
                  Table name
                  <input value={tableName} onChange={(event) => setTableName(event.target.value)} required />
                </label>
                <label>
                  Seats
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={tableCapacity}
                    onChange={(event) => setTableCapacity(event.target.value)}
                    required
                  />
                </label>
                <button className="primary-btn" type="submit">Add table</button>
              </form>

              {seatingPlan.tables.length > 0 ? (
                <div className="planning-table-grid">
                  {seatingPlan.tables.map((table) => {
                    const occupied = seatingPlan.assignments
                      .filter((assignment) => String(assignment.tableId) === String(table.id))
                      .reduce((total, assignment) => total + Number(assignment.seats || 0), 0);

                    return (
                      <article className="planning-table-card" key={table.id}>
                        <strong>{table.name}</strong>
                        <span>{occupied} / {table.capacity} seats assigned</span>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => removeTable(table.id)}
                        >
                          Remove table
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="muted">Add tables to start assigning booking parties.</p>
              )}

              {eventRegistrations.length > 0 ? (
                <div className="analytics-table-wrapper">
                  <table className="analytics-table">
                    <thead>
                      <tr><th>Booking party</th><th>People</th><th>Table</th></tr>
                    </thead>
                    <tbody>
                      {eventRegistrations.map((registration) => {
                        const assignment = seatingPlan.assignments.find(
                          (item) => String(item.registrationId) === String(registration.id)
                        );

                        return (
                          <tr key={registration.id}>
                            <td>{registration.userName}</td>
                            <td>{Math.max(1, Number(registration.ticketQuantity) || 1)}</td>
                            <td>
                              <select
                                aria-label={`Table for ${registration.userName}`}
                                value={assignment?.tableId || ""}
                                onChange={(event) => assignBooking(registration, event.target.value)}
                              >
                                <option value="">Unassigned</option>
                                {seatingPlan.tables.map((table) => {
                                  const occupiedByOthers = seatingPlan.assignments
                                    .filter((item) =>
                                      String(item.tableId) === String(table.id) &&
                                      String(item.registrationId) !== String(registration.id)
                                    )
                                    .reduce((total, item) => total + Number(item.seats || 0), 0);
                                  const partySize = Math.max(1, Number(registration.ticketQuantity) || 1);
                                  const disabled =
                                    occupiedByOthers + partySize > Number(table.capacity);

                                  return (
                                    <option key={table.id} value={table.id} disabled={disabled}>
                                      {table.name} ({Math.max(0, Number(table.capacity) - occupiedByOthers)} available)
                                    </option>
                                  );
                                })}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">No confirmed bookings for this event yet.</p>
              )}
            </section>
          )}

          {activeTab === "organizer" && (
            <section className="dashboard-panel planning-panel">
              <div className="panel-header">
                <div>
                  <h2>Checklist & budget for {selectedEvent.title}</h2>
                  <p className="muted">Track planning progress and vendor costs locally.</p>
                </div>
              </div>
              <div className="planning-budget-summary">
                <label>
                  Budget limit (₹)
                  <input
                    type="number"
                    min="0"
                    value={organizerPlan.budgetLimit ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (
                        value !== "" &&
                        (!Number.isFinite(Number(value)) || Number(value) < 0)
                      ) {
                        setPlanningError(
                          "Budget limit must be a non-negative amount."
                        );
                        return;
                      }
                      saveOrganizerPlan((plan) => ({
                        ...plan,
                        budgetLimit: value === "" ? "" : Number(value),
                      }));
                    }}
                  />
                </label>
                <div><span>Estimated vendor costs</span><strong>₹{plannedCosts.toLocaleString("en-IN")}</strong></div>
                <div><span>Marked paid</span><strong>₹{paidCosts.toLocaleString("en-IN")}</strong></div>
                <div>
                  <span>Budget remaining</span>
                  <strong>
                    {organizerPlan.budgetLimit === "" || organizerPlan.budgetLimit === undefined
                      ? "Set a limit"
                      : `₹${(Number(organizerPlan.budgetLimit) - plannedCosts).toLocaleString("en-IN")}`}
                  </strong>
                </div>
              </div>

              <div className="planning-two-column">
                <div>
                  <h3>Organizer checklist</h3>
                  <form className="planning-inline-form" onSubmit={addTask}>
                    <label>
                      Task
                      <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} required />
                    </label>
                    <label>
                      Due date
                      <input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} />
                    </label>
                    <button className="primary-btn" type="submit">Add task</button>
                  </form>
                  {organizerPlan.tasks.length ? (
                    <ul className="planning-task-list">
                      {organizerPlan.tasks.map((task) => (
                        <li key={task.id}>
                          <label>
                            <input
                              type="checkbox"
                              checked={Boolean(task.completed)}
                              onChange={(event) => updateTask(task.id, { completed: event.target.checked })}
                            />
                            <span className={task.completed ? "task-complete" : ""}>{task.title}</span>
                          </label>
                          <span>{task.dueDate || "No due date"}</span>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => saveOrganizerPlan((plan) => ({
                              ...plan,
                              tasks: plan.tasks.filter((item) => String(item.id) !== String(task.id)),
                            }))}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="muted">No planning tasks added yet.</p>}
                </div>

                <div>
                  <h3>Vendors & costs</h3>
                  <form className="planning-vendor-form" onSubmit={addVendor}>
                    <label>Vendor<input value={vendorForm.name} onChange={(event) => setVendorForm({ ...vendorForm, name: event.target.value })} required /></label>
                    <label>Service<input value={vendorForm.service} onChange={(event) => setVendorForm({ ...vendorForm, service: event.target.value })} /></label>
                    <label>Contact<input value={vendorForm.contact} onChange={(event) => setVendorForm({ ...vendorForm, contact: event.target.value })} /></label>
                    <label>Estimated cost (₹)<input type="number" min="0" step="0.01" value={vendorForm.cost} onChange={(event) => setVendorForm({ ...vendorForm, cost: event.target.value })} required /></label>
                    <label className="planning-checkbox"><input type="checkbox" checked={vendorForm.paid} onChange={(event) => setVendorForm({ ...vendorForm, paid: event.target.checked })} /> Mark as paid</label>
                    <button className="primary-btn" type="submit">Add vendor</button>
                  </form>
                  {organizerPlan.vendors.length ? (
                    <div className="planning-vendor-list">
                      {organizerPlan.vendors.map((vendor) => (
                        <article key={vendor.id}>
                          <div>
                            <strong>{vendor.name}</strong>
                            <span>{vendor.service || "Service not specified"}{vendor.contact ? ` · ${vendor.contact}` : ""}</span>
                          </div>
                          <strong>₹{Number(vendor.cost || 0).toLocaleString("en-IN")}</strong>
                          <label className="planning-checkbox">
                            <input
                              type="checkbox"
                              checked={Boolean(vendor.paid)}
                              aria-label={`Mark ${vendor.name} as paid`}
                              onChange={(event) => saveOrganizerPlan((plan) => ({
                                ...plan,
                                vendors: plan.vendors.map((item) =>
                                  String(item.id) === String(vendor.id)
                                    ? { ...item, paid: event.target.checked }
                                    : item
                                ),
                              }))}
                            />
                            Paid
                          </label>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => saveOrganizerPlan((plan) => ({
                              ...plan,
                              vendors: plan.vendors.filter((item) => String(item.id) !== String(vendor.id)),
                            }))}
                          >
                            Remove
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : <p className="muted">No vendors or costs added yet.</p>}
                </div>
              </div>
            </section>
          )}

          {activeTab === "schedule" && (
            <section className="dashboard-panel planning-panel">
              <div className="panel-header">
                <div>
                  <h2>Event-day schedule for {selectedEvent.title}</h2>
                  <p className="muted">Add agenda items in local time order.</p>
                </div>
              </div>
              <form className="planning-schedule-form" onSubmit={addAgendaItem}>
                <label>Time<input type="time" value={agendaForm.time} onChange={(event) => setAgendaForm({ ...agendaForm, time: event.target.value })} required /></label>
                <label>Agenda item<input value={agendaForm.title} onChange={(event) => setAgendaForm({ ...agendaForm, title: event.target.value })} required /></label>
                <label>Owner<input value={agendaForm.owner} onChange={(event) => setAgendaForm({ ...agendaForm, owner: event.target.value })} /></label>
                <label>Notes<input value={agendaForm.notes} onChange={(event) => setAgendaForm({ ...agendaForm, notes: event.target.value })} /></label>
                <button className="primary-btn" type="submit">Add schedule item</button>
              </form>
              {schedule.items.length ? (
                <ol className="planning-agenda-list">
                  {[...schedule.items]
                    .sort((first, second) => first.time.localeCompare(second.time))
                    .map((item) => (
                      <li key={item.id}>
                        <time>{item.time}</time>
                        <div>
                          <strong>{item.title}</strong>
                          {item.owner && <span>Owner: {item.owner}</span>}
                          {item.notes && <p>{item.notes}</p>}
                        </div>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => saveSchedule((plan) => ({
                            ...plan,
                            items: plan.items.filter((entry) => String(entry.id) !== String(item.id)),
                          }))}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                </ol>
              ) : <p className="muted">No schedule items added yet.</p>}
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default EventPlanning;
