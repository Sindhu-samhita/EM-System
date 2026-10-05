import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddEvent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "Technology",
    price: "",
    capacity: "",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const events =
      JSON.parse(localStorage.getItem("events")) || [];

    const newEvent = {
      ...form,
      id: Date.now(),
      price: Number(form.price),
      capacity: Number(form.capacity),
      registered: 0,
    };

    events.push(newEvent);

    localStorage.setItem("events", JSON.stringify(events));

    alert("Event created successfully!");

    navigate("/admin/events");
  };

  return (
    <main className="page-container small-page">
      <div className="page-header">
        <div>
          <span className="badge">ADMIN MODULE</span>
          <h1>Create New Event</h1>
          <p>Add a new event to EventHub.</p>
        </div>
      </div>

      <div className="form-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-group">
              <label>Event Name</label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="Technology">
                  Technology
                </option>

                <option value="Business">
                  Business
                </option>

                <option value="Entertainment">
                  Entertainment
                </option>

                <option value="Education">
                  Education
                </option>

                <option value="Sports">
                  Sports
                </option>

                <option value="Workshop">
                  Workshop
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Time</label>

              <input
                type="text"
                name="time"
                value={form.time}
                onChange={handleChange}
                placeholder="Example: 10:00 AM"
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>

              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Event location"
                required
              />
            </div>

            <div className="form-group">
              <label>Ticket Price</label>

              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="₹"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Maximum Capacity</label>

              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                placeholder="Number of seats"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>

              <input
                type="text"
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="Image URL"
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your event..."
                rows="5"
                required
              />
            </div>

          </div>

          <div className="form-actions">

            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/admin/events")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-btn"
            >
              Create Event
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}

export default AddEvent;
