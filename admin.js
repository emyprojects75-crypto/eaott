// Storage key shared with app.js / channels.js so the main app can read added items.
const STORAGE_KEY = "tv_admin_items";

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Builds the final playable URL/reference depending on which source type was chosen.
// NOTE: This is a prototype helper — your real backend should validate/proxy these
// (especially Xtream and Stalker Portal credentials) rather than storing raw in the browser.
function buildSourceUrl(sourceType) {
  switch (sourceType) {
    case "m3u8": {
      const url = document.getElementById("m3uUrl").value.trim();
      return { type: "m3u8", url };
    }
    case "xtream": {
      const server = document.getElementById("xtreamServer").value.trim().replace(/\/$/, "");
      const user = document.getElementById("xtreamUser").value.trim();
      const pass = document.getElementById("xtreamPass").value.trim();
      const streamId = document.getElementById("xtreamStreamId").value.trim();
      // Standard Xtream Codes live stream URL pattern
      const url = `${server}/live/${user}/${pass}/${streamId}.m3u8`;
      return { type: "xtream", url, meta: { server, user, streamId } };
    }
    case "stalker": {
      const portal = document.getElementById("stalkerPortal").value.trim().replace(/\/$/, "");
      const mac = document.getElementById("stalkerMac").value.trim();
      const channelId = document.getElementById("stalkerChannelId").value.trim();
      // Stalker Portal streams are normally resolved via a handshake + token request
      // (portal.php?type=itv&action=create_link&cmd=...). Storing the reference here;
      // your backend/player should perform the actual MAC handshake.
      const url = `${portal} (MAC: ${mac}, channel: ${channelId})`;
      return { type: "stalker", url, meta: { portal, mac, channelId } };
    }
    case "direct": {
      const url = document.getElementById("directUrl").value.trim();
      return { type: "direct", url };
    }
    default:
      return { type: "unknown", url: "" };
  }
}

function toggleSourceFields() {
  const selected = document.getElementById("sourceType").value;
  document.querySelectorAll(".source-fields").forEach(el => {
    el.style.display = el.dataset.source === selected ? "flex" : "none";
  });
}

function renderItemList() {
  const items = loadItems();
  const list = document.getElementById("itemList");
  list.innerHTML = "";

  if (items.length === 0) {
    list.innerHTML = `<div class="empty-msg">No channels or movies added yet.</div>`;
    return;
  }

  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `
      <img src="${item.logo || 'https://placehold.co/36x36/333/fff?text=%20'}" alt="${item.name}">
      <div class="item-info">
        <div class="item-name">${item.name} <span style="color:#666;font-size:11px;">(${item.contentType})</span></div>
        <div class="item-meta">${item.language} · ${item.source.type.toUpperCase()}</div>
      </div>
      <button class="item-delete" data-index="${index}">Delete</button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll(".item-delete").forEach(btn => {
    btn.onclick = () => {
      const items = loadItems();
      items.splice(Number(btn.dataset.index), 1);
      saveItems(items);
      renderItemList();
    };
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sourceType").addEventListener("change", toggleSourceFields);
  toggleSourceFields();
  renderItemList();

  document.getElementById("addForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const contentType = document.querySelector('input[name="contentType"]:checked').value;
    const name = document.getElementById("name").value.trim();
    const logo = document.getElementById("logo").value.trim();
    const language = document.getElementById("language").value;
    const sourceType = document.getElementById("sourceType").value;
    const source = buildSourceUrl(sourceType);

    if (!name || !source.url) {
      alert("Please fill in the name and the required source fields.");
      return;
    }

    const items = loadItems();
    items.push({
      id: "custom_" + Date.now(),
      contentType,
      name,
      logo,
      language,
      source
    });
    saveItems(items);

    document.getElementById("addForm").reset();
    toggleSourceFields();
    renderItemList();
  });
});
