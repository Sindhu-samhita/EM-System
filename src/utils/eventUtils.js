export const getTicketTypes = (event) => {
  const ticketTypes = Array.isArray(event?.ticketTypes)
    ? event.ticketTypes.filter(
        (ticketType) =>
          ticketType &&
          ticketType.id &&
          ticketType.name &&
          Number.isFinite(Number(ticketType.price)) &&
          Number(ticketType.price) >= 0
      )
    : [];

  return ticketTypes.length
    ? ticketTypes
    : [
        {
          id: "standard",
          name: "Standard",
          price: Math.max(0, Number(event?.price) || 0),
        },
      ];
};

export const getDateKey = (value) => {
  const text = String(value || "");

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const getTodayDateKey = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
};

export const getCurrentTimestamp = () => new Date().toISOString();

export const getTicketId = (registration, ticketNumber) =>
  `${registration.id}-${ticketNumber}`;

export const getCheckedInTicketIds = (registration) => {
  const quantity = Math.max(1, Number(registration.ticketQuantity) || 1);
  const allowedTicketIds = new Set(
    Array.from({ length: quantity }, (_, index) =>
      getTicketId(registration, index + 1)
    )
  );
  const checkedInTicketIds = new Set(
    Array.isArray(registration.checkedInTicketIds)
      ? registration.checkedInTicketIds.filter((ticketId) =>
          allowedTicketIds.has(ticketId)
        )
      : []
  );
  const legacyCheckInCount = Math.min(
    quantity,
    Math.max(0, Number(registration.checkedInCount) || 0)
  );

  for (
    let ticketNumber = 1;
    checkedInTicketIds.size < legacyCheckInCount;
    ticketNumber += 1
  ) {
    checkedInTicketIds.add(getTicketId(registration, ticketNumber));
  }

  return Array.from(checkedInTicketIds).sort(
    (first, second) =>
      Number(first.slice(String(registration.id).length + 1)) -
      Number(second.slice(String(registration.id).length + 1))
  );
};

export const updateCheckedInTicketIds = (registration, change) => {
  const quantity = Math.max(1, Number(registration.ticketQuantity) || 1);
  const checkedInTicketIds = getCheckedInTicketIds(registration);

  if (change > 0) {
    for (let ticketNumber = 1; ticketNumber <= quantity; ticketNumber += 1) {
      const ticketId = getTicketId(registration, ticketNumber);

      if (!checkedInTicketIds.includes(ticketId)) {
        checkedInTicketIds.push(ticketId);
        break;
      }
    }
  } else if (change < 0) {
    checkedInTicketIds.pop();
  }

  return {
    checkedInTicketIds,
    checkedInCount: checkedInTicketIds.length,
  };
};

export const createWaitlistId = (timestamp) =>
  `${new Date(timestamp).getTime()}-${Math.random().toString(36).slice(2, 8)}`;

export const isUpcomingEvent = (event, todayDateKey = getTodayDateKey()) => {
  const dateKey = getDateKey(event?.date);
  return Boolean(dateKey) && dateKey >= todayDateKey;
};

export const getWaitlistPromotions = (event, waitlist, timestamp) => {
  const now = new Date(timestamp);
  const updatedWaitlist = waitlist.map((entry) => ({ ...entry }));
  const pendingEntries = updatedWaitlist
    .filter(
      (entry) =>
        String(entry.eventId) === String(event.id) &&
        (entry.status || "waiting") === "waiting"
    )
    .sort((first, second) =>
      String(first.queuedAt || "").localeCompare(
        String(second.queuedAt || "")
      )
    );
  const promotedRegistrations = [];
  let registered = Math.max(0, Number(event.registered) || 0);
  const capacity = Math.max(0, Number(event.capacity) || 0);
  let availableSeats = Math.max(0, capacity - registered);

  while (availableSeats > 0) {
    const entry = pendingEntries.find(
      (item) =>
        Number.isInteger(Number(item.ticketQuantity)) &&
        Number(item.ticketQuantity) > 0 &&
        Number(item.ticketQuantity) <= availableSeats
    );

    if (!entry) {
      break;
    }

    const quantity = Number(entry.ticketQuantity);
    const registrationId = `waitlist-${entry.id}`;

    promotedRegistrations.push({
      id: registrationId,
      eventId: event.id,
      eventTitle: event.title,
      date: event.date,
      price: Number(entry.price) || 0,
      ticketTypeId: entry.ticketTypeId || "standard",
      ticketTypeName: entry.ticketTypeName || "Standard",
      userName: entry.userName,
      userEmail: entry.userEmail,
      accountEmail: entry.accountEmail,
      phone: entry.phone || "",
      ticketQuantity: quantity,
      checkedInCount: 0,
      checkedInTicketIds: [],
      notes: entry.notes || "",
      dietaryPreference: entry.dietaryPreference || "",
      dietaryNotes: entry.dietaryNotes || "",
      accessibilityNeeds: entry.accessibilityNeeds || "",
      registeredAt: now.toLocaleDateString(),
      registeredAtIso: now.toISOString(),
      promotedFromWaitlist: true,
    });

    const waitlistIndex = updatedWaitlist.findIndex(
      (item) => String(item.id) === String(entry.id)
    );

    if (waitlistIndex !== -1) {
      updatedWaitlist[waitlistIndex] = {
        ...updatedWaitlist[waitlistIndex],
        status: "promoted",
        promotedAt: now.toISOString(),
        registrationId,
      };
    }

    pendingEntries.splice(
      pendingEntries.findIndex((item) => String(item.id) === String(entry.id)),
      1
    );
    registered += quantity;
    availableSeats -= quantity;
  }

  return {
    updatedWaitlist,
    promotedRegistrations,
    registered,
  };
};
