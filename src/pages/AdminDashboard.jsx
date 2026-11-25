import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getTicketTypes } from "../utils/eventUtils";

const getDateKey = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const getRegistrationDate = (registration) =>
  registration.registeredAtIso || registration.registeredAt;

const getRegistrationDateKey = (registration) =>
  getDateKey(getRegistrationDate(registration));

const getTicketQuantity = (registration) =>
  Math.max(1, Number(registration.ticketQuantity) || 1);

const getCheckedInCount = (registration) =>
  Math.min(
    getTicketQuantity(registration),
    Math.max(0, Number(registration.checkedInCount) || 0)
  );

const getRegistrationRevenue = (registration) =>
  (Number(registration.price) || 0) * getTicketQuantity(registration);

const isBackupObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasValidStringFields = (record, fields) =>
  fields.every(
    (field) => record[field] === undefined || typeof record[field] === "string"
  );

const replaceLocalStorageData = (data) => {
  const previousValues = new Map(
    Object.keys(data).map((key) => [key, localStorage.getItem(key)])
  );

  try {
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  } catch (error) {
    const rollbackErrors = [];

    previousValues.forEach((value, key) => {
      try {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    });

    if (rollbackErrors.length) {
      throw new Error(
        "Import failed and the previous local data could not be fully restored."
      );
    }

    throw error;
  }
};

const validateBackup = (backup) => {
  if (
    !isBackupObject(backup) ||
    backup.format !== "eventhub-local-backup" ||
    ![1, 2].includes(backup.version) ||
    !isBackupObject(backup.data)
  ) {
    return "This file is not a supported EventHub backup.";
  }

  const { events, registrations, eventFeedback, waitlist } = backup.data;

  if (
    !Array.isArray(events) ||
    !Array.isArray(registrations) ||
    !Array.isArray(eventFeedback) ||
    !Array.isArray(waitlist)
  ) {
    return "The backup must include events, registrations, feedback, and waitlist arrays.";
  }

  const eventIds = new Set();
  for (const event of events) {
    if (
      !isBackupObject(event) ||
      event.id === undefined ||
      event.id === null ||
      typeof event.title !== "string" ||
      !event.title.trim() ||
      typeof event.location !== "string" ||
      typeof event.date !== "string" ||
      !hasValidStringFields(event, [
        "category",
        "description",
        "image",
        "time",
      ]) ||
      !Number.isFinite(Number(event.price)) ||
      Number(event.price) < 0 ||
      !Number.isFinite(Number(event.capacity)) ||
      Number(event.capacity) < 0 ||
      !Number.isFinite(Number(event.registered)) ||
      Number(event.registered) < 0 ||
      eventIds.has(String(event.id))
    ) {
      return "The backup contains an invalid or duplicate event.";
    }

    if (
      event.ticketTypes !== undefined &&
      (!Array.isArray(event.ticketTypes) ||
        event.ticketTypes.some(
          (ticketType) =>
            !isBackupObject(ticketType) ||
            (typeof ticketType.id !== "string" &&
              typeof ticketType.id !== "number") ||
            !String(ticketType.id) ||
            typeof ticketType.name !== "string" ||
            !ticketType.name.trim() ||
            !Number.isFinite(Number(ticketType.price)) ||
            Number(ticketType.price) < 0
        ) ||
        new Set(event.ticketTypes.map((ticketType) => String(ticketType.id)))
          .size !== event.ticketTypes.length)
    ) {
      return `The ticket types for "${event.title}" are invalid.`;
    }

    eventIds.add(String(event.id));
  }

  const registrationIds = new Set();
  for (const registration of registrations) {
    const ticketQuantity = Number(registration?.ticketQuantity);
    const ticketIdPrefix = `${registration?.id}-`;
    const isValidTicketId = (ticketId) => {
      if (typeof ticketId !== "string" || !ticketId.startsWith(ticketIdPrefix)) {
        return false;
      }
      const ticketNumber = Number(ticketId.slice(ticketIdPrefix.length));
      return (
        Number.isInteger(ticketNumber) &&
        ticketNumber >= 1 &&
        ticketNumber <= ticketQuantity
      );
    };

    if (
      !isBackupObject(registration) ||
      registration.id === undefined ||
      registration.id === null ||
      typeof registration.eventTitle !== "string" ||
      registrationIds.has(String(registration.id)) ||
      !hasValidStringFields(registration, [
        "accessibilityNeeds",
        "accountEmail",
        "dietaryNotes",
        "dietaryPreference",
        "notes",
        "phone",
        "registeredAt",
        "registeredAtIso",
        "ticketTypeName",
        "userEmail",
        "userName",
      ]) ||
      !eventIds.has(String(registration.eventId)) ||
      !Number.isInteger(Number(registration.ticketQuantity)) ||
      Number(registration.ticketQuantity) < 1 ||
      (registration.checkedInCount !== undefined &&
        (!Number.isInteger(Number(registration.checkedInCount)) ||
          Number(registration.checkedInCount) < 0 ||
          Number(registration.checkedInCount) >
            Number(registration.ticketQuantity))) ||
      (registration.checkedInTicketIds !== undefined &&
        (!Array.isArray(registration.checkedInTicketIds) ||
          registration.checkedInTicketIds.some(
            (ticketId) => !isValidTicketId(ticketId)
          ) ||
          new Set(registration.checkedInTicketIds).size !==
            registration.checkedInTicketIds.length ||
          (registration.checkedInCount !== undefined &&
            Number(registration.checkedInCount) !==
              registration.checkedInTicketIds.length))) ||
      !Number.isFinite(Number(registration.price)) ||
      Number(registration.price) < 0
    ) {
      return "The backup contains an invalid registration.";
    }

    registrationIds.add(String(registration.id));
  }

  for (const review of eventFeedback) {
    if (
      !isBackupObject(review) ||
      !registrationIds.has(String(review.registrationId)) ||
      !eventIds.has(String(review.eventId)) ||
      !hasValidStringFields(review, [
        "accountEmail",
        "comment",
        "eventTitle",
        "submittedAt",
        "userName",
      ]) ||
      !Number.isInteger(Number(review.rating)) ||
      Number(review.rating) < 1 ||
      Number(review.rating) > 5
    ) {
      return "The backup contains invalid event feedback.";
    }
  }

  const waitlistIds = new Set();
  for (const entry of waitlist) {
    if (
      !isBackupObject(entry) ||
      entry.id === undefined ||
      entry.id === null ||
      waitlistIds.has(String(entry.id)) ||
      typeof entry.eventTitle !== "string" ||
      !hasValidStringFields(entry, [
        "accountEmail",
        "accessibilityNeeds",
        "date",
        "dietaryNotes",
        "dietaryPreference",
        "notes",
        "phone",
        "queuedAt",
        "registeredAt",
        "ticketTypeName",
        "userEmail",
        "userName",
      ]) ||
      !eventIds.has(String(entry.eventId)) ||
      !Number.isInteger(Number(entry.ticketQuantity)) ||
      Number(entry.ticketQuantity) < 1 ||
      !Number.isFinite(Number(entry.price)) ||
      Number(entry.price) < 0 ||
      !["waiting", "promoted"].includes(entry.status || "waiting")
    ) {
      return "The backup contains an invalid waitlist entry.";
    }

    waitlistIds.add(String(entry.id));
  }

  if (backup.version === 2) {
    const {
      eventSeatingPlans,
      eventOrganizerPlans,
      eventSchedules,
    } = backup.data;

    if (
      !Array.isArray(eventSeatingPlans) ||
      !Array.isArray(eventOrganizerPlans) ||
      !Array.isArray(eventSchedules)
    ) {
      return "The backup is missing event planning data.";
    }

    const uniquePlanEventIds = (plans) => {
      const ids = new Set();
      for (const plan of plans) {
        if (
          !isBackupObject(plan) ||
          !eventIds.has(String(plan.eventId)) ||
          ids.has(String(plan.eventId))
        ) {
          return false;
        }
        ids.add(String(plan.eventId));
      }
      return true;
    };

    if (
      !uniquePlanEventIds(eventSeatingPlans) ||
      !uniquePlanEventIds(eventOrganizerPlans) ||
      !uniquePlanEventIds(eventSchedules)
    ) {
      return "The backup contains planning data for an unknown or duplicate event.";
    }

    for (const plan of eventSeatingPlans) {
      if (!Array.isArray(plan.tables) || !Array.isArray(plan.assignments)) {
        return "The backup contains an invalid seating plan.";
      }
      const tableIds = new Set();
      for (const table of plan.tables) {
        if (
          !isBackupObject(table) ||
          table.id === undefined ||
          tableIds.has(String(table.id)) ||
          typeof table.name !== "string" ||
          !table.name.trim() ||
          !Number.isInteger(Number(table.capacity)) ||
          Number(table.capacity) < 1
        ) {
          return "The backup contains an invalid seating table.";
        }
        tableIds.add(String(table.id));
      }
      const assignedRegistrationIds = new Set();
      const seatsByTableId = new Map();
      for (const assignment of plan.assignments) {
        if (!isBackupObject(assignment)) {
          return "The backup contains an invalid seating assignment.";
        }
        const registration = registrations.find(
          (item) =>
            String(item.id) === String(assignment.registrationId)
        );

        if (
          !registrationIds.has(String(assignment.registrationId)) ||
          assignedRegistrationIds.has(String(assignment.registrationId)) ||
          !tableIds.has(String(assignment.tableId)) ||
          !Number.isInteger(Number(assignment.seats)) ||
          Number(assignment.seats) < 1 ||
          String(registration?.eventId) !== String(plan.eventId) ||
          Number(assignment.seats) !== Number(registration?.ticketQuantity)
        ) {
          return "The backup contains an invalid seating assignment.";
        }
        assignedRegistrationIds.add(String(assignment.registrationId));
        seatsByTableId.set(
          String(assignment.tableId),
          (seatsByTableId.get(String(assignment.tableId)) || 0) +
            Number(assignment.seats)
        );
      }
      for (const table of plan.tables) {
        if (
          (seatsByTableId.get(String(table.id)) || 0) >
          Number(table.capacity)
        ) {
          return "The backup assigns more people than a table can seat.";
        }
      }
    }

    for (const plan of eventOrganizerPlans) {
      if (
        !Array.isArray(plan.tasks) ||
        !Array.isArray(plan.vendors) ||
        (plan.budgetLimit !== "" &&
          (!Number.isFinite(Number(plan.budgetLimit)) ||
            Number(plan.budgetLimit) < 0))
      ) {
        return "The backup contains invalid organizer planning data.";
      }
      for (const task of plan.tasks) {
        if (
          !isBackupObject(task) ||
          task.id === undefined ||
          typeof task.title !== "string" ||
          !task.title.trim() ||
          typeof task.completed !== "boolean" ||
          (task.dueDate !== undefined && typeof task.dueDate !== "string")
        ) {
          return "The backup contains an invalid checklist task.";
        }
      }
      if (
        new Set(plan.tasks.map((task) => String(task.id))).size !==
        plan.tasks.length
      ) {
        return "The backup contains duplicate checklist tasks.";
      }
      for (const vendor of plan.vendors) {
        if (
          !isBackupObject(vendor) ||
          vendor.id === undefined ||
          typeof vendor.name !== "string" ||
          !vendor.name.trim() ||
          !hasValidStringFields(vendor, ["contact", "service"]) ||
          !Number.isFinite(Number(vendor.cost)) ||
          Number(vendor.cost) < 0 ||
          typeof vendor.paid !== "boolean"
        ) {
          return "The backup contains an invalid vendor record.";
        }
      }
      if (
        new Set(plan.vendors.map((vendor) => String(vendor.id))).size !==
        plan.vendors.length
      ) {
        return "The backup contains duplicate vendor records.";
      }
    }

    for (const plan of eventSchedules) {
      if (!Array.isArray(plan.items)) {
        return "The backup contains an invalid event schedule.";
      }
      for (const item of plan.items) {
        if (
          !isBackupObject(item) ||
          item.id === undefined ||
          !/^\d{2}:\d{2}$/.test(item.time) ||
          typeof item.title !== "string" ||
          !item.title.trim() ||
          !hasValidStringFields(item, ["notes", "owner"])
        ) {
          return "The backup contains an invalid schedule item.";
        }
      }
      if (
        new Set(plan.items.map((item) => String(item.id))).size !==
        plan.items.length
      ) {
        return "The backup contains duplicate schedule items.";
      }
    }
  }

  return "";
};

const formatDateLabel = (dateKey, monthly) => {
  const date = new Date(`${dateKey}${monthly ? "-01" : ""}T00:00:00`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    ...(monthly ? { year: "2-digit" } : { day: "numeric" }),
  }).format(date);
};

const formatRegistrationDate = (registration) => {
  const date = new Date(getRegistrationDate(registration));

  if (Number.isNaN(date.getTime())) {
    return getRegistrationDate(registration) || "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
};

const formatEventDate = (value) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
};

const escapeCsvValue = (value) => {
  const text = String(value ?? "");
  const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

function AdminDashboard({ analyticsPage = false }) {
  const [eventData, setEventData] = useState(
    () => JSON.parse(localStorage.getItem("events")) || []
  );
  const [registrations, setRegistrations] = useState(
    () => JSON.parse(localStorage.getItem("registrations")) || []
  );
  const [todayDateKey] = useState(() => getDateKey(new Date()));
  const [feedback, setFeedback] = useState(() => {
    const storedFeedback = JSON.parse(localStorage.getItem("eventFeedback"));
    return Array.isArray(storedFeedback) ? storedFeedback : [];
  });
  const [waitlist, setWaitlist] = useState(() => {
    const storedWaitlist = JSON.parse(localStorage.getItem("waitlist"));
    return Array.isArray(storedWaitlist) ? storedWaitlist : [];
  });
  const [eventSeatingPlans, setEventSeatingPlans] = useState(() => {
    const storedPlans = JSON.parse(localStorage.getItem("eventSeatingPlans"));
    return Array.isArray(storedPlans) ? storedPlans : [];
  });
  const [eventOrganizerPlans, setEventOrganizerPlans] = useState(() => {
    const storedPlans = JSON.parse(localStorage.getItem("eventOrganizerPlans"));
    return Array.isArray(storedPlans) ? storedPlans : [];
  });
  const [eventSchedules, setEventSchedules] = useState(() => {
    const storedSchedules = JSON.parse(localStorage.getItem("eventSchedules"));
    return Array.isArray(storedSchedules) ? storedSchedules : [];
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [analyticsTab, setAnalyticsTab] = useState("overview");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    todayDateKey.slice(0, 7)
  );
  const [calendarCategory, setCalendarCategory] = useState("All");
  const [calendarView, setCalendarView] = useState("list");
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");
  const importFileRef = useRef(null);

  const events = eventData;

  const invalidDateRange = startDate && endDate && startDate > endDate;
  const filteredRegistrations = useMemo(() => {
    if (invalidDateRange) {
      return [];
    }

    return registrations.filter((registration) => {
      const dateKey = getRegistrationDateKey(registration);

      if (!dateKey) {
        return !startDate && !endDate;
      }

      return (
        (!startDate || dateKey >= startDate) &&
        (!endDate || dateKey <= endDate)
      );
    });
  }, [registrations, startDate, endDate, invalidDateRange]);

  const totalEvents = events.length;
  const totalRegistrations = filteredRegistrations.length;
  const totalRegisteredPeople = filteredRegistrations.reduce(
    (total, registration) => total + getTicketQuantity(registration),
    0
  );
  const totalCheckedInPeople = filteredRegistrations.reduce(
    (total, registration) => total + getCheckedInCount(registration),
    0
  );
  const totalCapacity = events.reduce(
    (total, event) => total + Number(event.capacity || 0),
    0
  );
  const totalRegisteredSeats = events.reduce(
    (total, event) => total + Number(event.registered || 0),
    0
  );
  const totalRevenue = filteredRegistrations.reduce(
    (total, registration) => total + getRegistrationRevenue(registration),
    0
  );
  const ticketTypeTotals = useMemo(() => {
    const eventById = new Map(
      events.map((event) => [String(event.id), event])
    );
    const totals = new Map();

    filteredRegistrations.forEach((registration) => {
      const eventId = String(registration.eventId);
      const event = eventById.get(eventId);
      const eventTicketTypes = getTicketTypes(event);
      const ticketType =
        eventTicketTypes.find(
          (item) =>
            String(item.id) === String(registration.ticketTypeId)
        ) || eventTicketTypes[0];
      const ticketTypeId = registration.ticketTypeId || ticketType.id;
      const ticketTypeName =
        registration.ticketTypeName || ticketType.name || "Standard";
      const key = `${eventId}:${ticketTypeId}`;
      const current = totals.get(key) || {
        eventId,
        ticketTypeId,
        eventTitle: registration.eventTitle || event?.title || "Event",
        ticketTypeName,
        bookings: 0,
        tickets: 0,
        revenue: 0,
      };

      current.bookings += 1;
      current.tickets += getTicketQuantity(registration);
      current.revenue += getRegistrationRevenue(registration);
      totals.set(key, current);
    });

    return [...totals.values()].sort(
      (first, second) =>
        first.eventTitle.localeCompare(second.eventTitle) ||
        first.ticketTypeName.localeCompare(second.ticketTypeName)
    );
  }, [events, filteredRegistrations]);

  const timeline = useMemo(() => {
    const monthly =
      !startDate ||
      !endDate ||
      (new Date(`${endDate}T00:00:00`) -
        new Date(`${startDate}T00:00:00`)) /
        86400000 >
        62;
    const totals = new Map();

    filteredRegistrations.forEach((registration) => {
      const dateKey = getRegistrationDateKey(registration);

      if (!dateKey) {
        return;
      }

      const bucketKey = monthly ? dateKey.slice(0, 7) : dateKey;
      const current = totals.get(bucketKey) || {
        registrations: 0,
        attendees: 0,
        checkedIn: 0,
        revenue: 0,
      };
      current.registrations += 1;
      current.attendees += getTicketQuantity(registration);
      current.checkedIn += getCheckedInCount(registration);
      current.revenue += getRegistrationRevenue(registration);
      totals.set(bucketKey, current);
    });

    return [...totals.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([date, values]) => ({
        date,
        label: formatDateLabel(date, monthly),
        ...values,
      }));
  }, [filteredRegistrations, startDate, endDate]);

  const categoryTotals = useMemo(() => {
    const eventCategories = new Map(
      events.map((event) => [String(event.id), event.category || "Uncategorized"])
    );
    const totals = new Map();

    filteredRegistrations.forEach((registration) => {
      const category =
        eventCategories.get(String(registration.eventId)) || "Other";
      totals.set(category, (totals.get(category) || 0) + 1);
    });

    return [...totals.entries()].sort((first, second) =>
      first[0].localeCompare(second[0])
    );
  }, [events, filteredRegistrations]);
  const eventAttendanceTotals = useMemo(() => {
    const totals = new Map();

    filteredRegistrations.forEach((registration) => {
      const eventId = String(registration.eventId);
      const current = totals.get(eventId) || {
        title: registration.eventTitle || "Event",
        attendees: 0,
        checkedIn: 0,
      };
      current.attendees += getTicketQuantity(registration);
      current.checkedIn += getCheckedInCount(registration);
      totals.set(eventId, current);
    });

    return [...totals.entries()]
      .sort((first, second) => first[1].title.localeCompare(second[1].title))
      .map(([id, values]) => ({ id, ...values }));
  }, [filteredRegistrations]);
  const eventPerformanceTotals = useMemo(() => {
    const registrationTotals = new Map();

    filteredRegistrations.forEach((registration) => {
      const eventId = String(registration.eventId);
      const current = registrationTotals.get(eventId) || {
        bookings: 0,
        people: 0,
        revenue: 0,
      };
      current.bookings += 1;
      current.people += getTicketQuantity(registration);
      current.revenue += getRegistrationRevenue(registration);
      registrationTotals.set(eventId, current);
    });

    return events
      .map((event) => {
        const totals = registrationTotals.get(String(event.id)) || {
          bookings: 0,
          people: 0,
          revenue: 0,
        };
        const capacity = Math.max(0, Number(event.capacity) || 0);
        const registered = Math.max(0, Number(event.registered) || 0);

        return {
          ...event,
          ...totals,
          capacity,
          registered,
          remaining: Math.max(0, capacity - registered),
          fillPercentage: capacity
            ? Math.min((registered / capacity) * 100, 100)
            : 0,
        };
      })
      .sort(
        (first, second) =>
          second.fillPercentage - first.fillPercentage ||
          second.revenue - first.revenue ||
          first.title.localeCompare(second.title)
      );
  }, [events, filteredRegistrations]);
  const calendarEvents = useMemo(() => {
    const statusRank = { Today: 0, Upcoming: 1, Completed: 2, Unscheduled: 3 };

    return events
      .map((event) => {
        const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(event.date || "")
          ? event.date
          : getDateKey(event.date);
        const status = !dateKey
          ? "Unscheduled"
          : dateKey < todayDateKey
            ? "Completed"
            : dateKey === todayDateKey
              ? "Today"
              : "Upcoming";

        return { ...event, dateKey, status };
      })
      .sort((first, second) => {
        const rankDifference =
          statusRank[first.status] - statusRank[second.status];

        if (rankDifference !== 0) {
          return rankDifference;
        }

        return first.status === "Completed"
          ? second.dateKey.localeCompare(first.dateKey)
          : first.dateKey.localeCompare(second.dateKey);
      });
  }, [events, todayDateKey]);
  const calendarCategoryOptions = [
    "All",
    ...new Set(events.map((event) => event.category || "Uncategorized")),
  ];
  const filteredCalendarEvents = calendarEvents.filter(
    (event) =>
      calendarCategory === "All" ||
      (event.category || "Uncategorized") === calendarCategory
  );
  const calendarMonthDate = new Date(`${calendarMonth}-01T00:00:00`);
  const calendarMonthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(calendarMonthDate);
  const daysInCalendarMonth = new Date(
    calendarMonthDate.getFullYear(),
    calendarMonthDate.getMonth() + 1,
    0
  ).getDate();
  const calendarFirstWeekday = calendarMonthDate.getDay();
  const calendarCells = Array.from(
    { length: calendarFirstWeekday + daysInCalendarMonth },
    (_, index) => (index < calendarFirstWeekday ? 0 : index - calendarFirstWeekday + 1)
  );
  const feedbackByEvent = useMemo(() => {
    const totals = new Map();

    feedback.forEach((review) => {
      const eventId = String(review.eventId);
      const current = totals.get(eventId) || {
        eventId,
        eventTitle: review.eventTitle || "Event",
        count: 0,
        totalRating: 0,
      };
      current.count += 1;
      current.totalRating += Number(review.rating) || 0;
      totals.set(eventId, current);
    });

    return [...totals.values()]
      .map((item) => ({
        ...item,
        averageRating: item.count ? item.totalRating / item.count : 0,
      }))
      .sort(
        (first, second) =>
          second.averageRating - first.averageRating ||
          second.count - first.count
      );
  }, [feedback]);
  const averageFeedbackRating = feedback.length
    ? feedback.reduce((total, review) => total + (Number(review.rating) || 0), 0) /
      feedback.length
    : 0;
  const recentFeedback = useMemo(
    () =>
      [...feedback]
        .sort(
          (first, second) =>
            Date.parse(second.submittedAt || "") -
            Date.parse(first.submittedAt || "")
        )
        .slice(0, 12),
    [feedback]
  );
  const maxTrendRegistrations = Math.max(
    ...timeline.map((item) => item.registrations),
    1
  );
  const maxTrendRevenue = Math.max(
    ...timeline.map((item) => item.revenue),
    1
  );
  const maxTrendAttendees = Math.max(
    ...timeline.map((item) => item.attendees),
    1
  );
  const maxTrendCheckIns = Math.max(
    ...timeline.map((item) => item.checkedIn),
    1
  );
  const maxCategoryRegistrations = Math.max(
    ...categoryTotals.map(([, count]) => count),
    1
  );
  const maxEventAttendees = Math.max(
    ...eventAttendanceTotals.map((item) => item.attendees),
    1
  );
  const shouldShowChart = (tab) =>
    !analyticsPage || analyticsTab === "overview" || analyticsTab === tab;

  const exportReport = () => {
    const rows = [
      [
        "Attendee",
        "Email",
        "Event",
        "Category",
        "Event date",
        "Registered date",
        "Phone",
        "Ticket type",
        "People",
        "Checked in",
        "Ticket price each",
        "Total ticket price",
        "Notes",
      ],
      ...filteredRegistrations.map((registration) => {
        const event = events.find(
          (item) => String(item.id) === String(registration.eventId)
        );

        return [
          registration.userName,
          registration.userEmail,
          registration.eventTitle,
          event?.category || "Other",
          registration.date,
          formatRegistrationDate(registration),
          registration.phone,
          registration.ticketTypeName || "Standard",
          getTicketQuantity(registration),
          getCheckedInCount(registration),
          registration.price,
          getRegistrationRevenue(registration),
          registration.notes,
        ];
      }),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");

    link.href = url;
    link.download = `event-registrations-${startDate || "all"}-to-${endDate || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const clearDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const shiftCalendarMonth = (amount) => {
    setCalendarMonth((currentMonth) => {
      const [year, month] = currentMonth.split("-").map(Number);
      const nextMonth = new Date(year, month - 1 + amount, 1);
      return `${nextMonth.getFullYear()}-${String(
        nextMonth.getMonth() + 1
      ).padStart(2, "0")}`;
    });
  };

  const exportBackup = () => {
    const backup = {
      format: "eventhub-local-backup",
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        events,
        registrations,
        eventFeedback: feedback,
        waitlist,
        eventSeatingPlans,
        eventOrganizerPlans,
        eventSchedules,
      },
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      })
    );
    const link = document.createElement("a");

    link.href = url;
    link.download = `eventhub-backup-${todayDateKey}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setBackupError("");
    setBackupMessage("Backup downloaded. User accounts are not included.");
  };

  const handleBackupImport = async (event) => {
    const input = event.currentTarget;
    const file = input.files && input.files[0];

    if (!file) {
      return;
    }

    setBackupMessage("");
    setBackupError("");

    try {
      const backup = JSON.parse(await file.text());
      const validationError = validateBackup(backup);

      if (validationError) {
        setBackupError(validationError);
        input.value = "";
        return;
      }

      if (
        !window.confirm(
          "Importing replaces events, bookings, feedback, waitlist, and planning data on this device. User accounts and the current login are kept. Continue?"
        )
      ) {
        input.value = "";
        return;
      }

      const importedEvents = backup.data.events.map((eventData) => ({
        ...eventData,
        ticketTypes: getTicketTypes(eventData),
      }));
      const importedRegistrations = backup.data.registrations;
      const importedFeedback = backup.data.eventFeedback;
      const importedWaitlist = backup.data.waitlist;
      const importedSeatingPlans =
        backup.version === 2 ? backup.data.eventSeatingPlans : [];
      const importedOrganizerPlans =
        backup.version === 2 ? backup.data.eventOrganizerPlans : [];
      const importedSchedules =
        backup.version === 2 ? backup.data.eventSchedules : [];

      replaceLocalStorageData({
        events: importedEvents,
        registrations: importedRegistrations,
        eventFeedback: importedFeedback,
        waitlist: importedWaitlist,
        eventSeatingPlans: importedSeatingPlans,
        eventOrganizerPlans: importedOrganizerPlans,
        eventSchedules: importedSchedules,
      });
      setEventData(importedEvents);
      setRegistrations(importedRegistrations);
      setFeedback(importedFeedback);
      setWaitlist(importedWaitlist);
      setEventSeatingPlans(importedSeatingPlans);
      setEventOrganizerPlans(importedOrganizerPlans);
      setEventSchedules(importedSchedules);
      setBackupMessage(
        "Backup imported. Event and planning data was replaced; user accounts were preserved."
      );
    } catch (error) {
      setBackupError(
        error instanceof Error
          ? `Could not read the backup: ${error.message}`
          : "Could not read the backup file."
      );
    }

    input.value = "";
  };

  return (
    <main
      className={
        analyticsPage
          ? "page-container"
          : "page-container dashboard-overview-page"
      }
    >
      <div className="page-header">
        <div>
          <span className="badge">
            {analyticsPage ? "ANALYTICS" : "ADMIN MODULE"}
          </span>
          <h1>{analyticsPage ? "Event Analytics" : "Admin Dashboard"}</h1>
          <p>
            {analyticsPage
              ? "Explore event performance, schedules, attendee feedback, and sales."
              : "Monitor event performance and registration activity."}
          </p>
        </div>

        {analyticsPage ? (
          <Link to="/admin" className="secondary-btn">
            Dashboard Overview
          </Link>
        ) : (
          <Link to="/admin/add-event" className="primary-btn">
            + Create Event
          </Link>
        )}
      </div>

      <section className="analytics-filters" aria-label="Analytics filters">
        <div>
          <strong>Registration date range</strong>
          <span>Filter registrations, revenue, and charts by registration date.</span>
        </div>
        <label>
          From
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <button
          className="secondary-btn"
          type="button"
          onClick={clearDateRange}
          disabled={!startDate && !endDate}
        >
          Clear dates
        </button>
        <button
          className="primary-btn"
          type="button"
          onClick={exportReport}
          disabled={invalidDateRange}
        >
          Download CSV
        </button>
      </section>

      {analyticsPage && (
        <section className="backup-controls" aria-label="Event data backup">
          <div>
            <strong>Local data backup</strong>
            <span>
              Export or replace events, bookings, feedback, and waitlist data.
              Planning data is included in version 2 backups.
              Account data is excluded and preserved on import.
            </span>
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={exportBackup}
          >
            Download JSON backup
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => importFileRef.current?.click()}
          >
            Import JSON backup
          </button>
          <input
            ref={importFileRef}
            className="backup-file-input"
            type="file"
            accept="application/json,.json"
            aria-label="Choose an EventHub JSON backup"
            onChange={handleBackupImport}
          />
          {backupMessage && (
            <p className="success backup-feedback" role="status">
              {backupMessage}
            </p>
          )}
          {backupError && (
            <p className="error backup-feedback" role="alert">
              {backupError}
            </p>
          )}
        </section>
      )}

      {invalidDateRange && (
        <div className="error analytics-error">
          The start date must be on or before the end date.
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon saffron">📅</div>
          <div>
            <span>Total Events</span>
            <strong>{totalEvents}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div>
            <span>Registrations</span>
            <strong>{totalRegistrations}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon saffron">🧍</div>
          <div>
            <span>Registered People</span>
            <strong>{totalRegisteredPeople}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div>
            <span>Checked In</span>
            <strong>{totalCheckedInPeople}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">🎟️</div>
          <div>
            <span>Available Seats</span>
            <strong>{totalCapacity - totalRegisteredSeats}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">₹</div>
          <div>
            <span>Revenue</span>
            <strong>₹{totalRevenue.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {analyticsPage && (
        <div className="analytics-tabs" role="tablist" aria-label="Analytics views">
          {[
            ["overview", "Overview"],
            ["registrations", "Registrations"],
            ["attendees", "Attendance"],
            ["revenue", "Revenue"],
            ["performance", "Event Performance"],
            ["calendar", "Event Calendar"],
            ["feedback", "Feedback & Ratings"],
          ].map(([tab, label]) => (
            <button
              type="button"
              role="tab"
              id={`analytics-tab-${tab}`}
              aria-selected={analyticsTab === tab}
              aria-controls="analytics-chart-panel"
              className={
                analyticsTab === tab ? "analytics-tab active" : "analytics-tab"
              }
              key={tab}
              onClick={() => setAnalyticsTab(tab)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div
        className="analytics-grid"
        id={analyticsPage ? "analytics-chart-panel" : undefined}
        role={analyticsPage ? "tabpanel" : undefined}
        aria-labelledby={
          analyticsPage ? `analytics-tab-${analyticsTab}` : undefined
        }
      >
        {shouldShowChart("registrations") && (
        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Registration Trend</h2>
          </div>
          {timeline.length ? (
            <div className="analytics-bars">
              {timeline.map((item) => (
                <div className="analytics-bar-row" key={item.date}>
                  <span>{item.label}</span>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar registrations-bar"
                      style={{
                        width: `${(item.registrations / maxTrendRegistrations) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>{item.registrations}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No registrations in this date range.</p>
          )}
        </section>
        )}

        {shouldShowChart("attendees") && (
          <>
            <section className="dashboard-panel">
              <div className="panel-header">
                <h2>Registered People Trend</h2>
              </div>
              {timeline.length ? (
                <div className="analytics-bars">
                  {timeline.map((item) => (
                    <div className="analytics-bar-row" key={item.date}>
                      <span>{item.label}</span>
                      <div className="analytics-bar-track">
                        <div
                          className="analytics-bar attendees-bar"
                          style={{
                            width: `${(item.attendees / maxTrendAttendees) * 100}%`,
                          }}
                        />
                      </div>
                      <strong>{item.attendees}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No attendees in this date range.</p>
              )}
            </section>

            <section className="dashboard-panel">
              <div className="panel-header">
                <h2>Check-ins Trend</h2>
              </div>
              {timeline.length ? (
                <div className="analytics-bars">
                  {timeline.map((item) => (
                    <div className="analytics-bar-row" key={item.date}>
                      <span>{item.label}</span>
                      <div className="analytics-bar-track">
                        <div
                          className="analytics-bar checkins-bar"
                          style={{
                            width: `${(item.checkedIn / maxTrendCheckIns) * 100}%`,
                          }}
                        />
                      </div>
                      <strong>{item.checkedIn}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No check-ins in this date range.</p>
              )}
            </section>
          </>
        )}

        {shouldShowChart("revenue") && (
        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Revenue Trend</h2>
          </div>
          {timeline.length ? (
            <div className="analytics-bars">
              {timeline.map((item) => (
                <div className="analytics-bar-row" key={item.date}>
                  <span>{item.label}</span>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar revenue-bar"
                      style={{
                        width: `${(item.revenue / maxTrendRevenue) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>₹{item.revenue.toLocaleString("en-IN")}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No revenue in this date range.</p>
          )}
        </section>
        )}

        {shouldShowChart("registrations") && (
        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Registrations by Category</h2>
          </div>
          {categoryTotals.length ? (
            <div className="analytics-bars">
              {categoryTotals.map(([category, count]) => (
                <div
                  className="analytics-bar-row"
                  data-category={category}
                  key={category}
                >
                  <span>{category}</span>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar category-bar"
                      style={{
                        width: `${(count / maxCategoryRegistrations) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No category data in this date range.</p>
          )}
        </section>
        )}

        {shouldShowChart("attendees") && (
        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>People by Event</h2>
          </div>
          {eventAttendanceTotals.length ? (
            <div className="analytics-bars">
              {eventAttendanceTotals.map((item) => (
                <div className="analytics-bar-row" key={item.id}>
                  <span title={item.title}>{item.title}</span>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar attendees-bar"
                      style={{
                        width: `${(item.attendees / maxEventAttendees) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>
                    {item.attendees} ({item.checkedIn} in)
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No attendee data in this date range.</p>
          )}
        </section>
        )}

        {!analyticsPage && (
        <section className="dashboard-panel event-overview-panel">
          <div className="panel-header">
            <h2>Event Overview</h2>
            <Link to="/admin/events">View All</Link>
          </div>

          {events.map((event) => {
            const capacity = Number(event.capacity) || 0;
            const registered = Number(event.registered) || 0;
            const fillPercentage = capacity
              ? Math.min((registered / capacity) * 100, 100)
              : 0;

            return (
              <div
                className="overview-row"
                data-category={event.category}
                key={event.id}
              >
                <div>
                  <strong>{event.title}</strong>
                  <span data-category={event.category}>{event.category}</span>
                </div>

                <div className="progress-container">
                  <div className="progress">
                    <div style={{ width: `${fillPercentage}%` }} />
                  </div>
                  <small>
                    {registered}/{capacity}
                  </small>
                </div>
              </div>
            );
          })}
        </section>
        )}
      </div>

      {analyticsPage && analyticsTab === "performance" && (
        <section className="dashboard-panel analytics-feature-panel">
          <div className="panel-header">
            <div>
              <h2>Event Performance</h2>
              <p className="muted">
                Bookings and revenue use the selected date range. Capacity shows
                current total registrations.
              </p>
            </div>
          </div>
          {eventPerformanceTotals.length ? (
            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Bookings</th>
                    <th>People in range</th>
                    <th>Revenue in range</th>
                    <th>Capacity filled</th>
                    <th>Seats left</th>
                  </tr>
                </thead>
                <tbody>
                  {eventPerformanceTotals.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <strong>{event.title}</strong>
                        <span data-category={event.category}>
                          {event.category || "Uncategorized"}
                        </span>
                      </td>
                      <td>{event.bookings}</td>
                      <td>{event.people}</td>
                      <td>₹{event.revenue.toLocaleString("en-IN")}</td>
                      <td>
                        {event.capacity ? (
                          <div className="capacity-cell">
                            <span>
                              {event.registered}/{event.capacity} (
                              {Math.round(event.fillPercentage)}%)
                            </span>
                            <div className="progress">
                              <div
                                style={{
                                  width: `${event.fillPercentage}%`,
                                }}
                              />
                            </div>
                            {event.fillPercentage >= 80 && (
                              <small className="capacity-alert-label">
                                {event.remaining === 0
                                  ? "Sold out"
                                  : "Capacity alert"}
                              </small>
                            )}
                          </div>
                        ) : (
                          "No capacity set"
                        )}
                      </td>
                      <td>{event.remaining}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No events to compare yet.</p>
          )}
        </section>
      )}

      {analyticsPage && analyticsTab === "performance" && (
        <section className="dashboard-panel analytics-feature-panel">
          <div className="panel-header">
            <div>
              <h2>Ticket Type Sales</h2>
              <p className="muted">
                Bookings, ticket quantities, and revenue by event and ticket type.
              </p>
            </div>
          </div>
          {ticketTypeTotals.length ? (
            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Ticket Type</th>
                    <th>Bookings</th>
                    <th>Tickets Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketTypeTotals.map((item) => (
                    <tr key={`${item.eventId}-${item.ticketTypeId}`}>
                      <td>{item.eventTitle}</td>
                      <td>{item.ticketTypeName}</td>
                      <td>{item.bookings}</td>
                      <td>{item.tickets}</td>
                      <td>₹{item.revenue.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Ticket sales will appear after bookings.</p>
          )}
        </section>
      )}

      {analyticsPage && analyticsTab === "calendar" && (
        <div className="analytics-grid analytics-feature-grid">
          <section className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h2>Event Calendar</h2>
                <p className="muted">{calendarMonthLabel}</p>
              </div>
              <div className="calendar-controls">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => shiftCalendarMonth(-1)}
                  aria-label="Previous month"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setCalendarMonth(todayDateKey.slice(0, 7))}
                >
                  This month
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => shiftCalendarMonth(1)}
                  aria-label="Next month"
                >
                  Next
                </button>
              </div>
            </div>
            <div className="calendar-toolbar">
              <label>
                Category
                <select
                  value={calendarCategory}
                  onChange={(event) => setCalendarCategory(event.target.value)}
                >
                  {calendarCategoryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <div className="calendar-view-switch" aria-label="Calendar view">
                <button
                  type="button"
                  className={calendarView === "month" ? "active" : ""}
                  aria-pressed={calendarView === "month"}
                  onClick={() => setCalendarView("month")}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={calendarView === "list" ? "active" : ""}
                  aria-pressed={calendarView === "list"}
                  onClick={() => setCalendarView("list")}
                >
                  List
                </button>
              </div>
            </div>

            {calendarView === "month" ? (
              <div className="monthly-calendar">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (weekday) => (
                    <div className="calendar-weekday" key={weekday}>
                      {weekday}
                    </div>
                  )
                )}
                {calendarCells.map((day, index) => {
                  if (!day) {
                    return (
                      <div
                        className="calendar-day empty"
                        key={`empty-${index}`}
                      />
                    );
                  }

                  const dayKey = `${calendarMonth}-${String(day).padStart(
                    2,
                    "0"
                  )}`;
                  const dayEvents = filteredCalendarEvents.filter(
                    (item) => item.dateKey === dayKey
                  );

                  return (
                    <div className="calendar-day" key={dayKey}>
                      <strong>{day}</strong>
                      {dayEvents.map((event) => (
                        <span
                          className={`calendar-event-chip ${event.status.toLowerCase()}`}
                          data-category={event.category}
                          key={event.id}
                          title={`${event.title} · ${event.status}`}
                        >
                          {event.title}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : filteredCalendarEvents.filter((event) =>
                ["Today", "Upcoming"].includes(event.status)
              ).length ? (
              <div className="calendar-event-list">
                {filteredCalendarEvents
                  .filter((event) =>
                    ["Today", "Upcoming"].includes(event.status)
                  )
                  .map((event) => (
                    <div
                      className="calendar-event-row"
                      data-category={event.category}
                      key={event.id}
                    >
                      <div>
                        <strong>{event.title}</strong>
                        <span>
                          {formatEventDate(event.date)} · {event.location}
                        </span>
                        <small>
                          {Number(event.registered) || 0} /{" "}
                          {Number(event.capacity) || 0} people registered
                        </small>
                      </div>
                      <span
                        className={`event-date-status ${event.status.toLowerCase()}`}
                        data-category={event.category}
                      >
                        {event.status}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="muted">No upcoming events are scheduled.</p>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="panel-header">
              <h2>Completed Events</h2>
            </div>
            {filteredCalendarEvents.filter((event) => event.status === "Completed")
              .length ? (
              <div className="calendar-event-list">
                {filteredCalendarEvents
                  .filter((event) => event.status === "Completed")
                  .map((event) => {
                    const eventFeedback = feedbackByEvent.find(
                      (review) => review.eventId === String(event.id)
                    );

                    return (
                      <div
                        className="calendar-event-row"
                        data-category={event.category}
                        key={event.id}
                      >
                        <div>
                          <strong>{event.title}</strong>
                          <span>
                            {formatEventDate(event.date)} · {event.location}
                          </span>
                          <small>
                            {Number(event.registered) || 0} /{" "}
                            {Number(event.capacity) || 0} people registered
                          </small>
                          <small>
                            {eventFeedback
                              ? `${eventFeedback.averageRating.toFixed(1)} / 5 from ${eventFeedback.count} reviews`
                              : "No reviews yet"}
                          </small>
                        </div>
                        <span className="event-date-status completed">
                          Completed
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="muted">No completed events yet.</p>
            )}
            {filteredCalendarEvents.some((event) => event.status === "Unscheduled") && (
              <p className="muted calendar-unscheduled-note">
                {filteredCalendarEvents.filter((event) => event.status === "Unscheduled")
                  .length}{" "}
                event(s) do not have a valid date.
              </p>
            )}
          </section>
        </div>
      )}

      {analyticsPage && analyticsTab === "feedback" && (
        <>
          <div className="feedback-summary">
            <div className="stat-card">
              <div className="stat-icon blue">💬</div>
              <div>
                <span>Reviews received</span>
                <strong>{feedback.length}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">★</div>
              <div>
                <span>Average rating</span>
                <strong>
                  {feedback.length ? `${averageFeedbackRating.toFixed(1)} / 5` : "—"}
                </strong>
              </div>
            </div>
          </div>
          <div className="analytics-grid analytics-feature-grid">
            <section className="dashboard-panel">
              <div className="panel-header">
                <h2>Ratings by Event</h2>
              </div>
              {feedbackByEvent.length ? (
                <div className="analytics-bars">
                  {feedbackByEvent.map((item) => (
                    <div className="analytics-bar-row" key={item.eventId}>
                      <span title={item.eventTitle}>{item.eventTitle}</span>
                      <div className="analytics-bar-track">
                        <div
                          className="analytics-bar rating-bar"
                          style={{
                            width: `${(item.averageRating / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <strong>
                        {item.averageRating.toFixed(1)} / 5 ({item.count})
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  No feedback yet. Attendees can leave a review after an event.
                </p>
              )}
            </section>

            <section className="dashboard-panel">
              <div className="panel-header">
                <h2>Recent Feedback</h2>
              </div>
              {recentFeedback.length ? (
                <div className="feedback-list">
                  {recentFeedback.map((review) => (
                    <article
                      className="feedback-row"
                      key={`${review.registrationId}-${review.accountEmail}`}
                    >
                      <div>
                        <strong>{review.eventTitle}</strong>
                        <span>
                          {review.userName || "Attendee"} ·{" "}
                          {Number(review.rating) || 0} / 5 ·{" "}
                          {formatEventDate(
                            (review.submittedAt || "").slice(0, 10)
                          )}
                        </span>
                      </div>
                      <p>{review.comment || "No written comment."}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">New reviews will appear here.</p>
              )}
            </section>
          </div>
        </>
      )}

      {!analyticsPage && (
      <section className="dashboard-panel recent-registrations-panel">
        <div className="panel-header">
          <h2>Recent Registrations</h2>
          <Link to="/admin/attendees">View All</Link>
        </div>

        {filteredRegistrations.slice(-5).reverse().map((registration) => (
          <div className="attendee-row" key={registration.id}>
            <div className="avatar">
              {registration.userName?.charAt(0).toUpperCase() || "?"}
            </div>

            <div>
              <strong>{registration.userName}</strong>
              <span>
                {registration.eventTitle} · {getTicketQuantity(registration)}{" "}
                {getTicketQuantity(registration) === 1 ? "person" : "people"} ·{" "}
                {getCheckedInCount(registration)} checked in
              </span>
            </div>

            <span className="status">Confirmed</span>
          </div>
        ))}

        {filteredRegistrations.length === 0 && (
          <p className="muted">No registrations in this date range.</p>
        )}
      </section>
      )}
    </main>
  );
}

export default AdminDashboard;
