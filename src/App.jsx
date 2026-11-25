import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Events from "./pages/Events";
import MyRegistrations from "./pages/MyRegistrations";

import AdminDashboard from "./pages/AdminDashboard";
import ManageEvents from "./pages/ManageEvents";
import AddEvent from "./pages/AddEvent";
import Attendees from "./pages/Attendees";
import EventPlanning from "./pages/EventPlanning";
import { getTicketTypes } from "./utils/eventUtils";

const demoEvents = [
  {
    id: 1,
    title: "Tech Conference 2026",
    description:
      "A conference featuring the latest trends in technology and software development.",
    date: "2026-11-15",
    time: "10:00 AM",
    location: "Hyderabad Convention Center",
    category: "Technology",
    price: 499,
    capacity: 200,
    registered: 35,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  },
  {
    id: 2,
    title: "Business Workshop",
    description:
      "Learn business strategy, leadership and entrepreneurship from industry experts.",
    date: "2026-12-05",
    time: "11:00 AM",
    location: "Vijayawada Business Hub",
    category: "Business",
    price: 299,
    capacity: 100,
    registered: 20,
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
  },
  {
    id: 3,
    title: "Music Festival",
    description:
      "An exciting live music event featuring multiple artists and performances.",
    date: "2026-12-20",
    time: "6:00 PM",
    location: "Bengaluru Arena",
    category: "Entertainment",
    price: 799,
    capacity: 500,
    registered: 125,
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
  },
  {
    id: 4,
    title: "Wedding Celebration & Reception",
    description:
      "Celebrate the wedding with a reception, dinner, music, and family gatherings.",
    date: "2027-01-09",
    time: "5:30 PM",
    location: "Grand Palace, Hyderabad",
    category: "Wedding",
    price: 0,
    capacity: 250,
    registered: 0,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552",
  },
  {
    id: 5,
    title: "Engagement Ceremony",
    description:
      "An evening celebration for family and friends marking a special engagement.",
    date: "2026-12-18",
    time: "6:00 PM",
    location: "Garden Convention Hall, Bengaluru",
    category: "Engagement",
    price: 299,
    capacity: 120,
    registered: 0,
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622",
  },
  {
    id: 6,
    title: "Birthday Celebration",
    description:
      "A lively birthday gathering with music, food, and activities for guests.",
    date: "2026-12-27",
    time: "4:00 PM",
    location: "Riverside Party Hall, Chennai",
    category: "Birthday",
    price: 199,
    capacity: 80,
    registered: 0,
    image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3",
  },
  {
    id: 7,
    title: "Wedding Anniversary Dinner",
    description:
      "A formal anniversary dinner featuring a meal, music, and time with loved ones.",
    date: "2027-02-14",
    time: "7:00 PM",
    location: "Lakeside Banquet, Vijayawada",
    category: "Anniversary",
    price: 399,
    capacity: 100,
    registered: 0,
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622",
  },
  {
    id: 8,
    title: "Family Reunion Celebration",
    description:
      "A relaxed family function with shared food, games, and activities for all ages.",
    date: "2027-03-20",
    time: "12:00 PM",
    location: "Community Gardens, Hyderabad",
    category: "Family Function",
    price: 149,
    capacity: 150,
    registered: 0,
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18",
  },
  {
    id: 9,
    title: "Sangeet & Wedding Reception",
    description:
      "An evening of music, dinner, and celebration with family and friends.",
    date: "2026-09-12",
    time: "6:00 PM",
    location: "Pearl Convention Hall, Hyderabad",
    category: "Wedding",
    price: 0,
    capacity: 180,
    registered: 0,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552",
  },
  {
    id: 10,
    title: "Autumn Family Reunion",
    description:
      "A family gathering with a shared meal, activities, and time together.",
    date: "2026-10-11",
    time: "12:00 PM",
    location: "Lakeside Gardens, Vijayawada",
    category: "Family Function",
    price: 149,
    capacity: 100,
    registered: 0,
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18",
  },
  {
    id: 11,
    title: "Autumn Music Night",
    description:
      "A live music evening featuring local performers and food stalls.",
    date: "2026-11-08",
    time: "7:00 PM",
    location: "Bengaluru Arena",
    category: "Entertainment",
    price: 399,
    capacity: 240,
    registered: 0,
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
  },
];

const demoAttendeeNames = [
  "Aarav Sharma",
  "Diya Patel",
  "Rohan Mehta",
  "Ananya Reddy",
  "Kabir Nair",
  "Meera Iyer",
  "Arjun Rao",
  "Ishita Gupta",
  "Vivaan Shah",
  "Saanvi Kulkarni",
  "Aditya Menon",
  "Kavya Joshi",
  "Reyansh Kapoor",
  "Aisha Khan",
  "Dev Malhotra",
  "Myra Desai",
  "Krish Verma",
  "Tara Nambiar",
  "Neil Chatterjee",
  "Riya Sinha",
  "Samar Bhat",
  "Nisha Pillai",
  "Yash Anand",
  "Leela Bose",
  "Advik Shetty",
  "Pooja Naidu",
  "Vihaan Das",
  "Mira Krishnan",
  "Kian Fernandes",
  "Tara Mukherjee",
  "Raghav Malhotra",
  "Aanya Menon",
  "Ishaan Varma",
  "Zara Hussain",
  "Arnav Bansal",
  "Veda Rao",
  "Nikhil Pillai",
  "Sana Kapoor",
  "Aarohi Desai",
  "Kabir Kulkarni",
  "Devika Shah",
  "Rohan Nair",
  "Mehul Joshi",
  "Anika Reddy",
  "Sahil Menon",
  "Isha Bhat",
  "Kunal Sinha",
  "Naina Iyer",
  "Rudra Gupta",
  "Maya Nambiar",
  "Varun Malhotra",
  "Simran Kaur",
  "Pranav Rao",
  "Aditi Desai",
  "Harsh Venkatesh",
  "Tanvi Kapoor",
  "Ishan Shetty",
  "Nandini Shah",
  "Farhan Ali",
  "Anika Srinivasan",
  "Karthik Rao",
  "Ira Choudhary",
  "Rizwan Ahmed",
  "Siddharth Bose",
  "Avni Shah",
  "Manav Bhatia",
  "Priya Menon",
  "Eshan Kulkarni",
  "Lakshmi Nair",
  "Dhruv Sethi",
  "Nikita Iyer",
];

const demoRegistrationPlan = [
  [1, "2026-09-10", 1, 1],
  [1, "2026-09-18", 2, 2],
  [1, "2026-09-27", 3, 2],
  [1, "2026-10-04", 2, 2],
  [1, "2026-10-13", 4, 4],
  [1, "2026-10-19", 1, 0],
  [1, "2026-10-25", 2, 2],
  [1, "2026-11-01", 5, 5],
  [1, "2026-11-05", 3, 3],
  [1, "2026-11-08", 4, 4],
  [1, "2026-11-10", 3, 0],
  [1, "2026-11-12", 5, 5],
  [2, "2026-09-20", 1, 0],
  [2, "2026-09-30", 1, 0],
  [2, "2026-10-05", 1, 0],
  [2, "2026-10-11", 2, 0],
  [2, "2026-10-18", 1, 0],
  [2, "2026-10-23", 2, 0],
  [2, "2026-10-29", 2, 0],
  [2, "2026-11-03", 1, 0],
  [2, "2026-11-08", 2, 0],
  [2, "2026-11-13", 2, 0],
  [2, "2026-11-18", 2, 0],
  [2, "2026-11-22", 3, 0],
  [3, "2026-09-12", 5, 0],
  [3, "2026-09-22", 8, 0],
  [3, "2026-10-02", 7, 0],
  [3, "2026-10-08", 10, 0],
  [3, "2026-10-15", 12, 0],
  [3, "2026-10-21", 9, 0],
  [3, "2026-10-27", 15, 0],
  [3, "2026-11-02", 8, 0],
  [3, "2026-11-07", 11, 0],
  [3, "2026-11-13", 14, 0],
  [3, "2026-11-19", 13, 0],
  [3, "2026-11-24", 13, 0],
  [4, "2026-10-24", 4, 0],
  [4, "2026-10-30", 5, 0],
  [4, "2026-11-05", 3, 0],
  [4, "2026-11-12", 6, 0],
  [4, "2026-11-17", 4, 0],
  [4, "2026-11-22", 5, 0],
  [5, "2026-10-29", 3, 0],
  [5, "2026-11-08", 4, 0],
  [5, "2026-11-15", 2, 0],
  [5, "2026-11-23", 3, 0],
  [6, "2026-11-02", 2, 0],
  [6, "2026-11-09", 3, 0],
  [6, "2026-11-17", 1, 0],
  [6, "2026-11-21", 4, 0],
  [6, "2026-11-24", 2, 0],
  [7, "2026-11-01", 2, 0],
  [7, "2026-11-07", 3, 0],
  [7, "2026-11-14", 4, 0],
  [7, "2026-11-20", 1, 0],
  [8, "2026-11-03", 3, 0],
  [8, "2026-11-11", 5, 0],
  [8, "2026-11-16", 2, 0],
  [8, "2026-11-24", 4, 0],
  [9, "2026-08-20", 3, 3],
  [9, "2026-08-27", 4, 4],
  [9, "2026-09-01", 2, 2],
  [9, "2026-09-07", 3, 3],
  [10, "2026-09-15", 2, 2],
  [10, "2026-09-28", 3, 3],
  [10, "2026-10-02", 4, 4],
  [10, "2026-10-08", 3, 2],
  [11, "2026-10-12", 3, 3],
  [11, "2026-10-19", 5, 5],
  [11, "2026-10-26", 4, 4],
  [11, "2026-11-02", 2, 2],
];

const demoFeedbackPlan = [
  [0, 5, "Excellent speakers and a smooth check-in.", "2026-11-17"],
  [7, 4, "Helpful talks and a well-organized venue.", "2026-11-18"],
  [10, 5, "Great sessions and useful networking.", "2026-11-20"],
  [59, 5, "Beautiful decorations and a warm welcome.", "2026-09-14"],
  [60, 4, "Lovely music and a memorable family celebration.", "2026-09-15"],
  [61, 5, "The dinner and event arrangements were excellent.", "2026-09-16"],
  [63, 5, "A relaxed gathering with plenty of activities for everyone.", "2026-10-13"],
  [64, 4, "Good food and a lovely setting for the family.", "2026-10-14"],
  [65, 5, "Well organized and enjoyable for all age groups.", "2026-10-15"],
  [67, 5, "Fantastic performances and a lively atmosphere.", "2026-11-10"],
  [68, 4, "Great music; the entry line could have moved faster.", "2026-11-11"],
  [69, 5, "A fun evening with talented local artists.", "2026-11-12"],
];

const createDemoRegistrations = (events) => {
  const eventsById = new Map(
    events.map((event) => [Number(event.id), event])
  );

  return demoRegistrationPlan.flatMap(
    ([eventId, date, ticketQuantity, checkedInCount], index) => {
      const event = eventsById.get(eventId);
      const expectedEvent = demoEvents.find((item) => item.id === eventId);

      if (!event || event.title !== expectedEvent?.title) {
        return [];
      }

      const attendeeNumber = String(index + 1).padStart(2, "0");
      const registeredAt = new Date(`${date}T10:00:00`);
      const attendeeName = demoAttendeeNames[index] || `Attendee ${attendeeNumber}`;
      const emailName = attendeeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "");
      const attendeeEmail = `${emailName}${attendeeNumber}@example.com`;

      return {
        id: 10000 + index,
        eventId: event.id,
        eventTitle: event.title,
        date: event.date,
        price: Number(event.price),
        ticketTypeId: "standard",
        ticketTypeName: "Standard",
        userName: attendeeName,
        userEmail: attendeeEmail,
        accountEmail: attendeeEmail,
        phone: `000-000-${attendeeNumber.padStart(4, "0")}`,
        ticketQuantity,
        checkedInCount,
        notes: index % 9 === 0 ? "Seats together requested" : "",
        registeredAt: registeredAt.toLocaleDateString(),
        registeredAtIso: registeredAt.toISOString(),
      };
    }
  );
};

const createDemoFeedback = (generatedRegistrations) => {
  const registrationsById = new Map(
    generatedRegistrations.map((registration) => [
      registration.id,
      registration,
    ])
  );

  return demoFeedbackPlan.flatMap(
    ([registrationIndex, rating, comment, submittedAtDate]) => {
      const registration = registrationsById.get(10000 + registrationIndex);

      if (!registration || submittedAtDate <= registration.date) {
        return [];
      }

      return {
        id: `demo-feedback-${registration.id}`,
        registrationId: registration.id,
        eventId: registration.eventId,
        eventTitle: registration.eventTitle,
        accountEmail: registration.accountEmail,
        userName: registration.userName,
        rating,
        comment,
        submittedAt: new Date(`${submittedAtDate}T12:00:00`).toISOString(),
      };
    }
  );
};

function App() {
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.length === 0) {
      const demoUsers = [
        {
          id: 1,
          name: "Admin",
          email: "admin@gmail.com",
          password: "admin123",
          role: "admin",
        },
        {
          id: 2,
          name: "Demo User",
          email: "user@gmail.com",
          password: "user123",
          role: "user",
        },
      ];

      localStorage.setItem("users", JSON.stringify(demoUsers));
    }

    let events = JSON.parse(localStorage.getItem("events"));

    if (!Array.isArray(events)) {
      events = demoEvents;
      localStorage.setItem("events", JSON.stringify(events));
    }

    const hasCoreDemoEvents = demoEvents.slice(0, 3).every((demoEvent) =>
      events.some(
        (event) =>
          Number(event.id) === demoEvent.id &&
          event.title === demoEvent.title
      )
    );

    if (hasCoreDemoEvents) {
      const newDemoEvents = demoEvents.slice(3).filter((demoEvent) => {
        const sameId = events.some(
          (event) => Number(event.id) === demoEvent.id
        );
        const sameTitle = events.some(
          (event) => event.title === demoEvent.title
        );
        return !sameId && !sameTitle;
      });

      if (newDemoEvents.length > 0) {
        events = [...events, ...newDemoEvents];
        localStorage.setItem("events", JSON.stringify(events));
      }
    }

    let ticketTypesUpdated = false;
    events = events.map((event) => {
      const ticketTypes = getTicketTypes(event);

      if (JSON.stringify(event.ticketTypes || []) !== JSON.stringify(ticketTypes)) {
        ticketTypesUpdated = true;
        return { ...event, ticketTypes };
      }

      return event;
    });

    if (ticketTypesUpdated) {
      localStorage.setItem("events", JSON.stringify(events));
    }

    const storedRegistrations = JSON.parse(
      localStorage.getItem("registrations")
    );
    const registrationRows = Array.isArray(storedRegistrations)
      ? storedRegistrations
      : [];
    const hasCoreDemoEventsForRegistrations = demoEvents
      .slice(0, 3)
      .every((demoEvent) =>
        events.some(
          (event) =>
            Number(event.id) === demoEvent.id &&
            event.title === demoEvent.title
        )
      );
    const generatedRegistrations = hasCoreDemoEventsForRegistrations
      ? createDemoRegistrations(events)
      : [];
    const isGeneratedRegistration = (registration) => {
      const id = Number(registration.id);

      return (
        id >= 10000 &&
        id < 10000 + demoRegistrationPlan.length &&
        (registration.userEmail?.startsWith("sample.attendee") ||
          registration.userEmail?.endsWith("@example.com"))
      );
    };
    const existingGeneratedIds = new Set(
      registrationRows
        .filter(isGeneratedRegistration)
        .map((registration) => Number(registration.id))
    );
    const generatedById = new Map(
      generatedRegistrations.map((registration) => [
        registration.id,
        registration,
      ])
    );
    let namesUpdated = false;
    const updatedRegistrationRows = registrationRows.map((registration) => {
      if (!isGeneratedRegistration(registration)) {
        return registration;
      }

      const generated = generatedById.get(Number(registration.id));

      if (!generated || registration.userName === generated.userName) {
        return registration;
      }

      namesUpdated = true;
      return {
        ...registration,
        userName: generated.userName,
        userEmail: generated.userEmail,
        accountEmail: generated.accountEmail,
        phone: generated.phone,
        notes: generated.notes,
      };
    });
    const newGeneratedRegistrations = generatedRegistrations.filter(
      (registration) => !existingGeneratedIds.has(registration.id)
    );
    const newPeopleByEvent = newGeneratedRegistrations.reduce(
      (totals, registration) => {
        const eventId = Number(registration.eventId);
        totals[eventId] =
          (totals[eventId] || 0) + registration.ticketQuantity;
        return totals;
      },
      {}
    );
    const isInitialRegistrationSeed =
      registrationRows.length === 0 && existingGeneratedIds.size === 0;
    const canAddGeneratedRegistrations = events.every((event) => {
      const peopleToAdd = newPeopleByEvent[Number(event.id)] || 0;

      if (peopleToAdd === 0) {
        return true;
      }

      const currentRegistered = Number(event.registered) || 0;
      const requiredCapacity = isInitialRegistrationSeed
        ? Math.max(currentRegistered, peopleToAdd)
        : currentRegistered + peopleToAdd;

      return Number(event.capacity) >= requiredCapacity;
    });

    if (
      hasCoreDemoEventsForRegistrations &&
      newGeneratedRegistrations.length > 0 &&
      canAddGeneratedRegistrations
    ) {
      const updatedEvents = events.map((event) => {
        const peopleToAdd = newPeopleByEvent[Number(event.id)] || 0;

        if (peopleToAdd === 0) {
          return event;
        }

        const currentRegistered = Number(event.registered) || 0;
        return {
          ...event,
          registered: isInitialRegistrationSeed
            ? Math.max(currentRegistered, peopleToAdd)
            : currentRegistered + peopleToAdd,
        };
      });

      localStorage.setItem("events", JSON.stringify(updatedEvents));
      localStorage.setItem(
        "registrations",
        JSON.stringify([
          ...updatedRegistrationRows,
          ...newGeneratedRegistrations,
        ])
      );
      newGeneratedRegistrations.forEach((registration) =>
        existingGeneratedIds.add(registration.id)
      );
    } else if (namesUpdated) {
      localStorage.setItem(
        "registrations",
        JSON.stringify(updatedRegistrationRows)
      );
    } else if (!Array.isArray(storedRegistrations)) {
      localStorage.setItem("registrations", JSON.stringify([]));
    }

    const storedFeedback = JSON.parse(localStorage.getItem("eventFeedback"));
    const feedbackRows = Array.isArray(storedFeedback) ? storedFeedback : [];
    const existingFeedbackKeys = new Set(
      feedbackRows.map(
        (review) => `${review.registrationId}:${review.accountEmail}`
      )
    );
    const newDemoFeedback = createDemoFeedback(generatedRegistrations).filter(
      (review) =>
        existingGeneratedIds.has(Number(review.registrationId)) &&
        !existingFeedbackKeys.has(
          `${review.registrationId}:${review.accountEmail}`
        )
    );

    if (newDemoFeedback.length > 0) {
      localStorage.setItem(
        "eventFeedback",
        JSON.stringify([...feedbackRows, ...newDemoFeedback])
      );
    }
  }, []);

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/events"
          element={
            <ProtectedRoute role="user">
              <Events />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-registrations"
          element={
            <ProtectedRoute role="user">
              <MyRegistrations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard analyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/events"
          element={
            <ProtectedRoute role="admin">
              <ManageEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/add-event"
          element={
            <ProtectedRoute role="admin">
              <AddEvent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendees"
          element={
            <ProtectedRoute role="admin">
              <Attendees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/planning"
          element={
            <ProtectedRoute role="admin">
              <EventPlanning />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
