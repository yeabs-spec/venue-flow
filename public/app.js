function readStoredToken() {
  try {
    return window.localStorage?.getItem("venueflow_token") || "";
  } catch (_error) {
    return "";
  }
}

function writeStoredToken(token) {
  try {
    if (!window.localStorage) {
      return;
    }

    if (token) {
      window.localStorage.setItem("venueflow_token", token);
    } else {
      window.localStorage.removeItem("venueflow_token");
    }
  } catch (_error) {
    // Some runtimes disable persistent storage. The app should still work for the current session.
  }
}

const state = {
  token: readStoredToken(),
  user: null,
  rooms: [],
  myBookings: [],
  allBookings: [],
  summary: null,
  currentView: "home",
  authMode: "login",
  selectedRoomId: null,
  prefillRoomId: null
};

const elements = {
  routeButtons: Array.from(document.querySelectorAll("[data-route]")),
  topnavLinks: Array.from(document.querySelectorAll(".topnav-link")),
  dashboardNavButton: document.getElementById("dashboardNavButton"),
  adminNavButton: document.getElementById("adminNavButton"),
  topbarRoleBadge: document.getElementById("topbarRoleBadge"),
  topbarLogoutButton: document.getElementById("topbarLogoutButton"),
  heroDashboardButton: document.getElementById("heroDashboardButton"),
  accountPrimaryButton: document.getElementById("accountPrimaryButton"),
  accountPanelTitle: document.getElementById("accountPanelTitle"),
  accountPanelText: document.getElementById("accountPanelText"),
  guestAccessPanel: document.getElementById("guestAccessPanel"),
  accountAccessPanel: document.getElementById("accountAccessPanel"),
  showLoginButton: document.getElementById("showLoginButton"),
  showRegisterButton: document.getElementById("showRegisterButton"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  homeView: document.getElementById("homeView"),
  roomsView: document.getElementById("roomsView"),
  roomDetailView: document.getElementById("roomDetailView"),
  memberDashboardView: document.getElementById("memberDashboardView"),
  adminDashboardView: document.getElementById("adminDashboardView"),
  overviewRoomCount: document.getElementById("overviewRoomCount"),
  overviewAvailableCount: document.getElementById("overviewAvailableCount"),
  roomsCatalog: document.getElementById("roomsCatalog"),
  roomDetailContent: document.getElementById("roomDetailContent"),
  roomDetailBackButton: document.getElementById("roomDetailBackButton"),
  memberDashboardTitle: document.getElementById("memberDashboardTitle"),
  memberStatsGrid: document.getElementById("memberStatsGrid"),
  bookingForm: document.getElementById("bookingForm"),
  roomSelect: document.getElementById("roomSelect"),
  myBookingsTable: document.getElementById("myBookingsTable"),
  adminStatsGrid: document.getElementById("adminStatsGrid"),
  roomForm: document.getElementById("roomForm"),
  resetRoomFormButton: document.getElementById("resetRoomFormButton"),
  adminRoomList: document.getElementById("adminRoomList"),
  adminBookingsTable: document.getElementById("adminBookingsTable"),
  toast: document.getElementById("toast")
};

function isAuthenticated() {
  return Boolean(state.user);
}

function isAdmin() {
  return state.user?.role === "admin";
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.style.background = isError ? "#8f2d22" : "#102131";
  elements.toast.classList.remove("hidden");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 3200);
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationError = data.errors?.[0]?.msg;
    throw new Error(validationError || data.message || "Request failed.");
  }

  return data;
}

function setToken(token) {
  state.token = token;
  writeStoredToken(token);
}

function setAuthMode(mode) {
  state.authMode = mode;
  const showLogin = mode === "login";
  elements.loginForm.classList.toggle("hidden", !showLogin);
  elements.registerForm.classList.toggle("hidden", showLogin);
  elements.showLoginButton.classList.toggle("is-active", showLogin);
  elements.showRegisterButton.classList.toggle("is-active", !showLogin);
}

function statusClass(status) {
  return `status-pill status-${status}`;
}

function routeHash(view, roomId) {
  if (view === "room" && roomId) {
    return `#room/${roomId}`;
  }

  if (view === "dashboard") {
    return "#dashboard";
  }

  if (view === "admin") {
    return "#admin";
  }

  if (view === "rooms") {
    return "#rooms";
  }

  return "#home";
}

function resolveView(view) {
  if (view === "room") {
    return "room";
  }

  if (view === "dashboard") {
    if (!isAuthenticated()) {
      return "home";
    }

    return isAdmin() ? "admin" : "dashboard";
  }

  if (view === "admin") {
    return isAdmin() ? "admin" : isAuthenticated() ? "dashboard" : "home";
  }

  if (view === "rooms") {
    return "rooms";
  }

  return "home";
}

function updateHash() {
  const hash = routeHash(state.currentView, state.selectedRoomId);
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}

function parseHash() {
  const hash = window.location.hash.replace(/^#/, "");

  if (!hash || hash === "home") {
    return { view: "home" };
  }

  if (hash === "rooms") {
    return { view: "rooms" };
  }

  if (hash === "dashboard") {
    return { view: "dashboard" };
  }

  if (hash === "admin") {
    return { view: "admin" };
  }

  if (hash.startsWith("room/")) {
    const roomId = Number(hash.split("/")[1]);
    if (Number.isFinite(roomId)) {
      return { view: "room", roomId };
    }
  }

  return { view: "home" };
}

function applyRoute(view, options = {}, shouldUpdateHash = true) {
  const resolved = resolveView(view);
  state.currentView = resolved;

  if (resolved === "room" && options.roomId) {
    state.selectedRoomId = Number(options.roomId);
  }

  if (resolved !== "room") {
    state.selectedRoomId = null;
  }

  if (options.prefillRoomId) {
    state.prefillRoomId = Number(options.prefillRoomId);
  }

  renderLayout();

  if (shouldUpdateHash) {
    updateHash();
  }
}

function goTo(view, options = {}) {
  applyRoute(view, options, true);
}

function getRoomById(roomId) {
  return state.rooms.find((room) => room.id === Number(roomId));
}

function renderOverview() {
  const availableCount = state.rooms.filter((room) => room.status === "available").length;
  elements.overviewRoomCount.textContent = String(state.rooms.length);
  elements.overviewAvailableCount.textContent = String(availableCount);
}

function renderTopbar() {
  const current = state.currentView;
  elements.dashboardNavButton.classList.toggle("hidden", !isAuthenticated() || isAdmin());
  elements.adminNavButton.classList.toggle("hidden", !isAdmin());
  elements.topbarRoleBadge.classList.toggle("hidden", !isAuthenticated());
  elements.topbarLogoutButton.classList.toggle("hidden", !isAuthenticated());

  if (isAuthenticated()) {
    elements.topbarRoleBadge.textContent = isAdmin() ? "admin" : "member";
  }

  elements.topnavLinks.forEach((button) => {
    const route = button.dataset.route;
    const active = route === current || (route === "dashboard" && current === "dashboard") || (route === "admin" && current === "admin");
    button.classList.toggle("is-active", active);
  });
}

function renderHomePanel() {
  const authenticated = isAuthenticated();
  elements.guestAccessPanel.classList.toggle("hidden", authenticated);
  elements.accountAccessPanel.classList.toggle("hidden", !authenticated);

  if (!authenticated) {
    return;
  }

  elements.accountPanelTitle.textContent = `Welcome, ${state.user.fullName}`;
  elements.accountPanelText.textContent = isAdmin()
    ? "Open the operations dashboard to manage rooms and booking approvals."
    : "Jump back into your booking dashboard or keep exploring rooms.";
}

function renderStats(target, summary) {
  if (!summary) {
    target.innerHTML = "";
    return;
  }

  const entries = Object.entries(summary).map(([key, value]) => {
    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (character) => character.toUpperCase());

    return `
      <article class="stat-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `;
  });

  target.innerHTML = entries.join("");
}

function renderRoomsCatalog() {
  if (state.rooms.length === 0) {
    elements.roomsCatalog.innerHTML = "<p>No meeting rooms available yet.</p>";
    return;
  }

  elements.roomsCatalog.innerHTML = state.rooms
    .map((room) => {
      const memberAction =
        isAuthenticated() && !isAdmin() && room.status === "available"
          ? `<button type="button" class="primary-button" onclick="bookRoom(${room.id})">Book room</button>`
          : "";

      const adminAction =
        isAdmin()
          ? `<button type="button" class="ghost-button" onclick="openAdminEdit(${room.id})">Manage</button>`
          : "";

      return `
        <article class="room-card">
          <div class="room-card-cover">
            <img src="${room.image_url}" alt="${room.name}" />
          </div>
          <div class="room-card-body">
            <div class="room-card-title-row">
              <div>
                <h3>${room.name}</h3>
                <p>${room.location}</p>
              </div>
              <span class="chip status-${room.status}">${room.status}</span>
            </div>
            <div class="room-meta">
              <span class="chip">Capacity ${room.capacity}</span>
              <span class="chip">${room.amenities.split(",").slice(0, 2).join(" · ")}</span>
            </div>
            <p class="room-card-copy">${room.description}</p>
            <div class="room-card-actions">
              <button type="button" class="ghost-button" onclick="viewRoom(${room.id})">View details</button>
              ${memberAction}
              ${adminAction}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderRoomDetail() {
  const room = getRoomById(state.selectedRoomId);

  if (!room) {
    elements.roomDetailContent.innerHTML = `
      <section class="panel">
        <h2>Room not found</h2>
        <p>The selected room could not be loaded.</p>
      </section>
    `;
    return;
  }

  const memberAction =
    isAuthenticated() && !isAdmin() && room.status === "available"
      ? `<button type="button" class="primary-button" onclick="bookRoom(${room.id})">Book this room</button>`
      : "";

  const adminAction = isAdmin()
    ? `<button type="button" class="ghost-button" onclick="openAdminEdit(${room.id})">Edit room</button>`
    : "";

  elements.roomDetailContent.innerHTML = `
    <article class="room-detail-layout">
      <div class="room-detail-cover">
        <img src="${room.image_url}" alt="${room.name}" />
      </div>
    </article>
    <section class="room-detail-summary">
      <div class="room-detail-content">
        <p class="eyebrow">Room details</p>
        <h2>${room.name}</h2>
        <div class="detail-meta">
          <span class="chip">${room.location}</span>
          <span class="chip">Capacity ${room.capacity}</span>
          <span class="chip status-${room.status}">${room.status}</span>
        </div>
        <p class="detail-description">${room.description}</p>
        <p class="room-amenities"><strong>Amenities:</strong> ${room.amenities}</p>
        <div class="detail-actions">
          ${memberAction}
          ${adminAction}
        </div>
      </div>
      <aside class="room-detail-side">
        <h3>Best for</h3>
        <div class="detail-info-list">
          <div class="detail-info-row">
            <strong>Location</strong>
            <span>${room.location}</span>
          </div>
          <div class="detail-info-row">
            <strong>Capacity</strong>
            <span>${room.capacity} people</span>
          </div>
          <div class="detail-info-row">
            <strong>Status</strong>
            <span>${room.status}</span>
          </div>
          <div class="detail-info-row">
            <strong>Available setup</strong>
            <span>${room.amenities}</span>
          </div>
        </div>
      </aside>
    </section>
  `;
}

function renderMemberDashboard() {
  if (!isAuthenticated() || isAdmin()) {
    return;
  }

  elements.memberDashboardTitle.textContent = `${state.user.fullName}'s dashboard`;
  renderStats(elements.memberStatsGrid, state.summary);

  const availableRooms = state.rooms.filter((room) => room.status === "available");
  elements.roomSelect.innerHTML = availableRooms.length
    ? availableRooms.map((room) => `<option value="${room.id}">${room.name} - ${room.location}</option>`).join("")
    : '<option value="">No rooms available</option>';

  if (state.prefillRoomId && availableRooms.some((room) => room.id === state.prefillRoomId)) {
    elements.roomSelect.value = String(state.prefillRoomId);
    state.prefillRoomId = null;
  }

  if (state.myBookings.length === 0) {
    elements.myBookingsTable.innerHTML = "<p>No booking requests yet.</p>";
    return;
  }

  elements.myBookingsTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Meeting</th>
          <th>Room</th>
          <th>Schedule</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${state.myBookings
          .map(
            (booking) => `
              <tr>
                <td>
                  <strong>${booking.title}</strong><br />
                  <small>${booking.purpose}</small>
                </td>
                <td>${booking.room_name}<br /><small>${booking.room_location}</small></td>
                <td>${booking.booking_date}<br /><small>${booking.start_time} - ${booking.end_time}</small></td>
                <td><span class="${statusClass(booking.status)}">${booking.status}</span></td>
                <td>
                  ${
                    booking.status === "cancelled" || booking.status === "rejected"
                      ? "-"
                      : `<button type="button" class="ghost-button" onclick="cancelBooking(${booking.id})">Cancel</button>`
                  }
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderAdminRoomList() {
  if (!isAdmin()) {
    elements.adminRoomList.innerHTML = "";
    return;
  }

  elements.adminRoomList.innerHTML = state.rooms
    .map(
      (room) => `
        <article class="admin-room-card">
          <img src="${room.image_url}" alt="${room.name}" />
          <div>
            <div class="room-card-title-row">
              <div>
                <h4>${room.name}</h4>
                <p>${room.location}</p>
              </div>
              <span class="chip status-${room.status}">${room.status}</span>
            </div>
            <p class="room-card-copy">${room.description}</p>
            <div class="room-card-actions">
              <button type="button" class="ghost-button" onclick="openAdminEdit(${room.id})">Edit</button>
              <button type="button" class="ghost-button" onclick="deleteRoom(${room.id})">Delete</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderAdminBookings() {
  if (!isAdmin()) {
    elements.adminBookingsTable.innerHTML = "";
    return;
  }

  if (state.allBookings.length === 0) {
    elements.adminBookingsTable.innerHTML = "<p>No booking requests found.</p>";
    return;
  }

  elements.adminBookingsTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Requester</th>
          <th>Meeting</th>
          <th>Room</th>
          <th>Schedule</th>
          <th>Status</th>
          <th>Moderation</th>
        </tr>
      </thead>
      <tbody>
        ${state.allBookings
          .map(
            (booking) => `
              <tr>
                <td>${booking.requester_name}<br /><small>${booking.requester_email}</small></td>
                <td>${booking.title}</td>
                <td>${booking.room_name}</td>
                <td>${booking.booking_date}<br /><small>${booking.start_time} - ${booking.end_time}</small></td>
                <td><span class="${statusClass(booking.status)}">${booking.status}</span></td>
                <td>
                  ${
                    booking.status === "pending"
                      ? `<div class="panel-actions">
                           <button type="button" class="primary-button" onclick="moderateBooking(${booking.id}, 'approved')">Approve</button>
                           <button type="button" class="ghost-button" onclick="moderateBooking(${booking.id}, 'rejected')">Reject</button>
                         </div>`
                      : booking.admin_note || "-"
                  }
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderAdminDashboard() {
  if (!isAdmin()) {
    return;
  }

  renderStats(elements.adminStatsGrid, state.summary);
  renderAdminRoomList();
  renderAdminBookings();
}

function renderLayout() {
  renderTopbar();
  renderHomePanel();
  renderOverview();
  renderRoomsCatalog();
  renderMemberDashboard();
  renderAdminDashboard();

  elements.homeView.classList.toggle("hidden", state.currentView !== "home");
  elements.roomsView.classList.toggle("hidden", state.currentView !== "rooms");
  elements.roomDetailView.classList.toggle("hidden", state.currentView !== "room");
  elements.memberDashboardView.classList.toggle("hidden", state.currentView !== "dashboard");
  elements.adminDashboardView.classList.toggle("hidden", state.currentView !== "admin");

  if (state.currentView === "room") {
    renderRoomDetail();
  }
}

async function refreshRooms() {
  const data = await apiFetch("/api/rooms");
  state.rooms = data.rooms;
  renderLayout();
}

async function refreshProtectedData() {
  if (!state.token) {
    return;
  }

  const meData = await apiFetch("/api/auth/me");
  state.user = meData.user;

  const roomRequest = apiFetch("/api/rooms");

  if (isAdmin()) {
    const [roomsData, summaryData, allBookingsData] = await Promise.all([
      roomRequest,
      apiFetch("/api/bookings/summary"),
      apiFetch("/api/bookings")
    ]);

    state.rooms = roomsData.rooms;
    state.summary = summaryData.summary;
    state.allBookings = allBookingsData.bookings;
    state.myBookings = [];
  } else {
    const [roomsData, summaryData, myBookingsData] = await Promise.all([
      roomRequest,
      apiFetch("/api/bookings/summary"),
      apiFetch("/api/bookings/my")
    ]);

    state.rooms = roomsData.rooms;
    state.summary = summaryData.summary;
    state.myBookings = myBookingsData.bookings;
    state.allBookings = [];
  }

  renderLayout();
}

async function handleAuthSuccess(data) {
  setToken(data.token);
  state.user = data.user;
  showToast(data.message);
  await refreshProtectedData();
  goTo(isAdmin() ? "admin" : "dashboard");
}

function resetUserState() {
  state.user = null;
  state.summary = null;
  state.myBookings = [];
  state.allBookings = [];
}

function handleLogout() {
  setToken("");
  resetUserState();
  setAuthMode("login");
  renderLayout();
  goTo("home");
  showToast("Signed out successfully.");
}

elements.routeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    goTo(button.dataset.route);
  });
});

elements.showLoginButton.addEventListener("click", () => {
  setAuthMode("login");
});

elements.showRegisterButton.addEventListener("click", () => {
  setAuthMode("register");
});

elements.heroDashboardButton.addEventListener("click", () => {
  goTo(isAdmin() ? "admin" : isAuthenticated() ? "dashboard" : "home");
});

elements.accountPrimaryButton.addEventListener("click", () => {
  goTo(isAdmin() ? "admin" : "dashboard");
});

elements.topbarLogoutButton.addEventListener("click", handleLogout);
elements.roomDetailBackButton.addEventListener("click", () => goTo("rooms"));

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    form.reset();
    await handleAuthSuccess(data);
  } catch (error) {
    showToast(error.message, true);
  }
});

elements.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    form.reset();
    await handleAuthSuccess(data);
  } catch (error) {
    showToast(error.message, true);
  }
});

elements.bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.roomId = Number(payload.roomId);
    payload.attendees = Number(payload.attendees);

    const data = await apiFetch("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    form.reset();
    showToast(data.message);
    await refreshProtectedData();
  } catch (error) {
    showToast(error.message, true);
  }
});

elements.roomForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const roomId = payload.roomId;
    delete payload.roomId;
    payload.capacity = Number(payload.capacity);

    const method = roomId ? "PUT" : "POST";
    const path = roomId ? `/api/rooms/${roomId}` : "/api/rooms";

    const data = await apiFetch(path, {
      method,
      body: JSON.stringify(payload)
    });

    form.reset();
    showToast(data.message);
    await refreshProtectedData();
  } catch (error) {
    showToast(error.message, true);
  }
});

elements.resetRoomFormButton.addEventListener("click", () => {
  elements.roomForm.reset();
  elements.roomForm.roomId.value = "";
});

window.viewRoom = function viewRoom(roomId) {
  goTo("room", { roomId });
};

window.bookRoom = function bookRoom(roomId) {
  if (!isAuthenticated()) {
    goTo("home");
    showToast("Sign in first to book a room.", true);
    return;
  }

  if (isAdmin()) {
    goTo("admin");
    return;
  }

  goTo("dashboard", { prefillRoomId: roomId });
};

window.openAdminEdit = function openAdminEdit(roomId) {
  const room = getRoomById(roomId);

  if (!room) {
    return;
  }

  elements.roomForm.roomId.value = room.id;
  elements.roomForm.name.value = room.name;
  elements.roomForm.location.value = room.location;
  elements.roomForm.capacity.value = room.capacity;
  elements.roomForm.imageUrl.value = room.image_url;
  elements.roomForm.description.value = room.description;
  elements.roomForm.amenities.value = room.amenities;
  elements.roomForm.status.value = room.status;
  goTo("admin");
  showToast(`Editing ${room.name}`);
};

window.deleteRoom = async function deleteRoom(roomId) {
  try {
    const data = await apiFetch(`/api/rooms/${roomId}`, {
      method: "DELETE"
    });
    showToast(data.message);
    await refreshProtectedData();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.cancelBooking = async function cancelBooking(bookingId) {
  try {
    const data = await apiFetch(`/api/bookings/${bookingId}/cancel`, {
      method: "PATCH"
    });
    showToast(data.message);
    await refreshProtectedData();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.moderateBooking = async function moderateBooking(bookingId, status) {
  try {
    const data = await apiFetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        adminNote: status === "approved" ? "Approved by administrator" : "Rejected by administrator"
      })
    });
    showToast(data.message);
    await refreshProtectedData();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.addEventListener("hashchange", () => {
  const parsed = parseHash();
  applyRoute(parsed.view, { roomId: parsed.roomId }, false);
});

(async function init() {
  setAuthMode("login");

  try {
    await refreshRooms();

    if (state.token) {
      await refreshProtectedData();
    }
  } catch (error) {
    setToken("");
    resetUserState();

    if (!/invalid or expired|missing/i.test(error.message)) {
      showToast(error.message, true);
    }
  }

  const parsed = parseHash();
  applyRoute(parsed.view, { roomId: parsed.roomId }, false);
})();
