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
    vipPrice: "",
    capacity: "",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const events = JSON.parse(localStorage.getItem("events")) || [];
    const standardPrice = Number(form.price);
    const ticketTypes = [
      { id: "standard", name: "Standard", price: standardPrice },
    ];

    if (form.vipPrice !== "") {
      ticketTypes.push({
        id: "vip",
        name: "VIP",
        price: Number(form.vipPrice),
      });
    }

    const eventDetails = { ...form };
    delete eventDetails.vipPrice;

    const newEvent = {
      ...eventDetails,
      id: Date.now(),
      price: standardPrice,
      capacity: Number(form.capacity),
      registered: 0,
      ticketTypes,
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
                <option>Technology</option>
                <option>Business</option>
                <option>Entertainment</option>
                <option>Education</option>
                <option>Sports</option>
                <option>Workshop</option>
                <option>Wedding</option>
                <option>Engagement</option>
                <option>Birthday</option>
                <option>Anniversary</option>
                <option>Family Function</option>
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
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Event location"
                required
              />
            </div>

            <div className="form-group">
              <label>Standard Ticket Price</label>
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
              <label>VIP Ticket Price (optional)</label>
              <input
                type="number"
                name="vipPrice"
                value={form.vipPrice}
                onChange={handleChange}
                placeholder="Leave blank if not offered"
                min="0"
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

            <button type="submit" className="primary-btn">
              Create Event
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AddEvent;
