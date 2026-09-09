// ============ ADMIN-ADDED ITEMS ============
const ADMIN_STORAGE_KEY = "tv_admin_items";

function getAdminChannels() {
  try {
    const items = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY)) || [];
    // Only surface "channel" type items in the live TV list; adapt as needed for a movie tab.
    return items
      .filter(i => i.contentType === "channel")
      .map(i => ({
        id: i.id,
        name: i.name,
        lang: i.language,
        logo: i.logo || "https://placehold.co/64x64/333/fff?text=%20",
        streamUrl: i.source.url,
        sourceType: i.source.type
      }));
  } catch (e) {
    return [];
  }
}

function getAllChannels() {
  return [...CHANNELS, ...getAdminChannels()];
}

// ============ STATE ============
let currentChannelId = CHANNELS[0].id;
let overlayVisible = false;

// ============ RENDER: HOME TABS ============
function renderTabBar() {
  const tabBar = document.getElementById("tabBar");
  tabBar.innerHTML = "";
  LANGUAGES.forEach((lang, i) => {
    const el = document.createElement("div");
    el.className = "tab" + (i === 0 ? " active" : "");
    el.textContent = lang;
    el.onclick = () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      el.classList.add("active");
      renderChannelList(lang);
    };
    tabBar.appendChild(el);
  });
}

// ============ RENDER: CATEGORY SIDEBAR ============
function renderCategoryList() {
  const categories = ["All", "Entertainment", "Movies", "Music", "News", "Sports", "Kids", "Infotainment", "International", "Devotional"];
  const el = document.getElementById("categoryList");
  el.innerHTML = "";
  categories.forEach((cat, i) => {
    const item = document.createElement("div");
    item.className = "category-item" + (i === 0 ? " active" : "");
    item.textContent = cat;
    item.onclick = () => {
      document.querySelectorAll(".category-item").forEach(c => c.classList.remove("active"));
      item.classList.add("active");
    };
    el.appendChild(item);
  });
}

// ============ RENDER: MAIN CHANNEL LIST (no badges) ============
function renderChannelList(langFilter = "All") {
  const list = document.getElementById("channelList");
  list.innerHTML = "";
  const all = getAllChannels();
  const filtered = langFilter === "All" ? all : all.filter(c => c.lang === langFilter);

  filtered.forEach(channel => {
    const item = document.createElement("div");
    item.className = "channel-item" + (channel.id === currentChannelId ? " selected" : "");
    item.tabIndex = 0; // keyboard/D-pad focusable
    item.innerHTML = `
      <img class="channel-logo" src="${channel.logo}" alt="${channel.name}">
      <span class="channel-name">${channel.name}</span>
    `;
    // NOTE: no premium/crown element is ever appended here.
    item.onclick = () => selectChannelAndOpenPlayer(channel.id);
    item.onkeydown = (e) => { if (e.key === "Enter") selectChannelAndOpenPlayer(channel.id); };
    list.appendChild(item);
  });
}

// ============ RENDER: OVERLAY CHANNEL LIST (forward-scroll behavior) ============
function renderOverlayChannelList() {
  const list = document.getElementById("overlayChannelList");
  list.innerHTML = "";
  getAllChannels().forEach(channel => {
    const item = document.createElement("div");
    item.className = "overlay-channel-item" + (channel.id === currentChannelId ? " selected" : "");
    item.dataset.channelId = channel.id;
    item.tabIndex = 0;
    item.innerHTML = `
      <img class="overlay-channel-logo" src="${channel.logo}" alt="${channel.name}">
      <span class="overlay-channel-name">${channel.name}</span>
    `;
    item.onclick = () => selectChannelInPlayer(channel.id);
    item.onkeydown = (e) => { if (e.key === "Enter") selectChannelInPlayer(channel.id); };
    list.appendChild(item);
  });
}

// Scrolls the overlay list so the selected card moves toward the
// front/visible area, mirroring the reference screenshots.
function scrollOverlayToSelected(channelId) {
  const list = document.getElementById("overlayChannelList");
  const target = list.querySelector(`[data-channel-id="${channelId}"]`);
  if (!target) return;

  const listRect = list.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const offset = 24; // keep a little space above, like scrollToPositionWithOffset in Android

  const scrollDelta = (targetRect.top - listRect.top) - offset;
  list.scrollBy({ top: scrollDelta, behavior: "smooth" });
}

// ============ SELECTION HANDLERS ============
function selectChannelAndOpenPlayer(channelId) {
  currentChannelId = channelId;
  openPlayerScreen();
}

function selectChannelInPlayer(channelId) {
  currentChannelId = channelId;
  updatePlayerChannel();
  renderOverlayChannelList();
  scrollOverlayToSelected(channelId);

  // Close the overlay after a brief moment so the pick is visible,
  // then return focus to the playing channel — this is the "open/play" step.
  setTimeout(() => {
    if (overlayVisible) toggleOverlay();
  }, 350);
}

// ============ SCREEN TRANSITIONS ============
function openPlayerScreen() {
  document.getElementById("homeScreen").classList.remove("active");
  document.getElementById("playerScreen").classList.add("active");
  updatePlayerChannel();
  renderOverlayChannelList();
}

function closePlayerScreen() {
  document.getElementById("playerScreen").classList.remove("active");
  document.getElementById("homeScreen").classList.add("active");
  renderChannelList();
}

function updatePlayerChannel() {
  const channel = getAllChannels().find(c => c.id === currentChannelId);
  document.getElementById("playerTitle").textContent = channel.name;
  document.getElementById("playerImg").src = DEMO_STILL;
}

function toggleOverlay() {
  overlayVisible = !overlayVisible;
  document.getElementById("channelOverlay").classList.toggle("visible", overlayVisible);
  if (overlayVisible) scrollOverlayToSelected(currentChannelId);
}

// ============ BOTTOM NAV ============
function selectNavTab(tab) {
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.nav === tab));

  document.getElementById("homeBodyRow").classList.toggle("active", tab === "home");
  document.getElementById("homeBodyRow").style.display = tab === "home" ? "flex" : "none";

  ["find", "tv", "movie"].forEach(name => {
    document.getElementById(name + "Panel").classList.toggle("active", tab === name);
  });
}

// ============ INIT ============
document.addEventListener("DOMContentLoaded", () => {
  renderTabBar();
  renderCategoryList();
  renderChannelList();

  document.getElementById("miniPlayerImg").src = DEMO_STILL;
  document.getElementById("miniPlayer").onclick = openPlayerScreen;

  document.getElementById("backBtn").onclick = () => {
    if (overlayVisible) { toggleOverlay(); } else { closePlayerScreen(); }
  };
  document.getElementById("moreChannelsBtn").onclick = toggleOverlay;

  document.querySelectorAll(".nav-item").forEach(item => {
    item.onclick = () => selectNavTab(item.dataset.nav);
  });

  let playing = true;
  document.getElementById("playPauseBtn").onclick = (e) => {
    playing = !playing;
    e.target.textContent = playing ? "⏸" : "▶";
  };

  // Keyboard nav simulating TV remote D-pad
  document.addEventListener("keydown", (e) => {
    if (!document.getElementById("playerScreen").classList.contains("active")) return;
    if (e.key === "ArrowDown" && !overlayVisible) toggleOverlay();
    if (e.key === "Escape") {
      if (overlayVisible) toggleOverlay(); else closePlayerScreen();
    }
  });
});
