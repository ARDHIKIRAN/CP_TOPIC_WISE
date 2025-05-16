// Paste your updated script.js content here or move the file
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ...other config
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get admin mode from URL (?admin=1 for admin, ?admin=0 or missing for user)
function getIsAdmin() {
  const params = new URLSearchParams(window.location.search);
  return params.get("admin") === "1";
}
const isAdmin = getIsAdmin();

let groups = {};

async function fetchGroups() {
  const res = await fetch('http://localhost:3000/api/groups');
  groups = await res.json();
  updateGroupDropdown();
  renderGroups();
}

async function saveGroupToServer(groupName) {
  await fetch(`http://localhost:3000/api/groups/${encodeURIComponent(groupName)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: groups[groupName] })
  });
}

function updateGroupDropdown() {
  const select = document.getElementById("groupSelect");
  select.innerHTML = `<option value="">-- Select Group --</option>`;
  Object.keys(groups).forEach(group => {
    const option = document.createElement("option");
    option.value = group;
    option.text = group;
    select.appendChild(option);
  });
}

async function addGroup() {
  if (!isAdmin) return;
  const groupName = document.getElementById("newGroupName").value.trim();
  if (!groupName) return alert("Please enter a group name.");
  if (groups[groupName]) return alert("Group already exists!");

  groups[groupName] = [];
  await saveGroupToServer(groupName);
  await fetchGroups();
  document.getElementById("newGroupName").value = "";
}

async function addNote() {
  if (!isAdmin) return;
  const group = document.getElementById("groupSelect").value;
  const title = document.getElementById("title").value.trim();
  const code = document.getElementById("code").value.trim();
  const explanation = document.getElementById("explanation").value.trim();
  const editIndex = document.getElementById("editIndex").value;

  if (!group) return alert("Please select a group.");

  const note = { title, code, explanation };

  if (editIndex !== "") {
    groups[group][editIndex] = note;
    document.getElementById("editIndex").value = "";
  } else {
    groups[group].push(note);
  }

  await saveGroupToServer(group);
  await fetchGroups();

  document.getElementById("title").value = "";
  document.getElementById("code").value = "";
  document.getElementById("explanation").value = "";
}

async function deleteNote(group, index) {
  if (!isAdmin) return;
  if (confirm("Are you sure you want to delete this note?")) {
    groups[group].splice(index, 1);
    await saveGroupToServer(group);
    await fetchGroups();
    if (
      document.getElementById("editIndex").value == index &&
      document.getElementById("groupSelect").value == group
    ) {
      document.getElementById("title").value = "";
      document.getElementById("code").value = "";
      document.getElementById("explanation").value = "";
      document.getElementById("editIndex").value = "";
    }
  }
}

async function deleteGroup(group) {
  if (!isAdmin) return;
  if (confirm(`Delete group "${group}" and all its notes?`)) {
    await fetch(`http://localhost:3000/api/groups/${encodeURIComponent(group)}`, { method: 'DELETE' });
    await fetchGroups();
  }
}

window.editGroupNamePrompt = async function(oldName) {
  const newName = prompt('Enter new group name:', oldName);
  if (!newName || newName.trim() === '' || newName === oldName) return;
  if (groups[newName]) {
    alert('A group with this name already exists!');
    return;
  }
  await fetch(`http://localhost:3000/api/groups/${encodeURIComponent(oldName)}/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newName })
  });
  await fetchGroups();
};

function renderGroups() {
  const container = document.getElementById("notesContainer");
  container.innerHTML = "";

  for (let group in groups) {
    const groupDiv = document.createElement("div");
    groupDiv.id = 'group-section-' + group.replace(/[^a-zA-Z0-9]/g, '');
    groupDiv.innerHTML = `
      <div class="group-title" style="display: flex; align-items: center; justify-content: space-between;">
        <span>📂 ${group}</span>
        <span>
          <button class="toggle-group-btn" style="margin-right: 8px; border: none; background: none; font-size: 18px; cursor: pointer;" onclick="toggleGroupSection('${groupDiv.id}', this)">🙈</button>
          ${
            isAdmin
              ? `<button class=\"edit-group-btn\" onclick=\"editGroupNamePrompt('${group}')\" style=\"margin-left:10px;\">✏️ Edit Name</button>
                 <button class=\"delete-group-btn\" onclick=\"deleteGroup('${group}')\" style=\"margin-left:10px;\">🗑️ Delete Group</button>`
              : ""
          }
        </span>
      </div>
    `;
    // Add spacing before notes for visual separation
    const notesWrapper = document.createElement('div');
    notesWrapper.style.marginTop = '18px';
    notesWrapper.className = 'notes-wrapper';
    notesWrapper.style.display = 'none'; // Hide by default
    groups[group].forEach((note, index) => {
      const noteDiv = document.createElement("div");
      noteDiv.className = "note";
      const detailsId = `note-details-${group.replace(/[^a-zA-Z0-9]/g, '')}-${index}`;
      noteDiv.innerHTML = `
        <div class="note-title-toggle" style="display: flex; align-items: center; cursor: pointer;" onclick="toggleNoteDetails('${detailsId}')">
          <span class="dropdown-arrow" id="arrow-${detailsId}" style="font-size: 18px; margin-right: 8px;">▶</span>
          <h3 style="margin: 0;">${note.title || "Untitled Note"}</h3>
        </div>
        <div id="${detailsId}" class="note-details" style="display: none;">
          ${note.code ? `<pre><code>${note.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>` : ""}
          ${note.explanation ? `<pre class=\"explanation\">${note.explanation}</pre>` : ""}
          ${
            isAdmin
              ? `<button onclick=\"editNote('${group}', ${index})\">✏️ Edit</button>\n                 <button onclick=\"deleteNote('${group}', ${index})\">🗑️ Delete</button>`
              : ""
          }
        </div>
      `;
      notesWrapper.appendChild(noteDiv);
    });
    groupDiv.appendChild(notesWrapper);
    container.appendChild(groupDiv);
  }
}

// Add toggleNoteDetails to window so it can be called from HTML
window.toggleNoteDetails = function(detailsId) {
  const details = document.getElementById(detailsId);
  const arrow = document.getElementById('arrow-' + detailsId);
  if (details.style.display === 'none') {
    details.style.display = '';
    if (arrow) arrow.textContent = '▼';
  } else {
    details.style.display = 'none';
    if (arrow) arrow.textContent = '▶';
  }
};

// Add this function to window for toggling group visibility
window.toggleGroupSection = function(groupDivId, btn) {
  const groupDiv = document.getElementById(groupDivId);
  if (!groupDiv) return;
  const notesWrapper = groupDiv.querySelector('.notes-wrapper');
  if (!notesWrapper) return;
  if (notesWrapper.style.display === 'none') {
    notesWrapper.style.display = '';
    btn.textContent = '👁️';
  } else {
    notesWrapper.style.display = 'none';
    btn.textContent = '🙈';
  }
};

function setTheme(theme) {
  const btn = document.getElementById("themeToggleBtn");
  const icon = document.getElementById("themeToggleIcon");
  if (theme === "dark") {
    document.body.classList.add("user-mode");
    if (icon) icon.textContent = "🌙"; // Moon for dark mode
    if (btn) btn.title = "Switch to Light Theme";
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("user-mode");
    if (icon) icon.textContent = "☀️"; // Sun for light mode
    if (btn) btn.title = "Switch to Dark Theme";
    localStorage.setItem("theme", "light");
  }
}

function filterGroups() {
  const search = document.getElementById("groupSearch").value.trim().toLowerCase();
  const groupSections = document.querySelectorAll(".group-title");
  let firstMatch = null;
  groupSections.forEach(section => {
    const groupName = section.textContent.replace("📂", "").trim().toLowerCase();
    if (groupName.includes(search) || search === "") {
      section.parentElement.style.display = "";
      if (!firstMatch) firstMatch = section;
    } else {
      section.parentElement.style.display = "none";
    }
  });
  // Scroll to first match if searching
  if (search && firstMatch) {
    firstMatch.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

window.onload = function () {
  if (!isAdmin) {
    document.querySelector('.note-form').style.display = 'none';
    document.querySelector('.group-form').style.display = 'none';
  }
  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);
  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.onclick = function () {
      const isDark = document.body.classList.contains("user-mode");
      setTheme(isDark ? "light" : "dark");
    };
  }
  fetchGroups();
};

function editNote(group, index) {
  if (!isAdmin) return;
  const note = groups[group][index];
  document.getElementById("groupSelect").value = group;
  document.getElementById("title").value = note.title;
  document.getElementById("code").value = note.code;
  document.getElementById("explanation").value = note.explanation;
  document.getElementById("editIndex").value = index;
}