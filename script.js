// Get admin mode from URL (?admin=1 for admin, ?admin=0 or missing for user)
function getIsAdmin() {
  const params = new URLSearchParams(window.location.search);
  return params.get("admin") === "1";
}
const isAdmin = getIsAdmin();

const groups = JSON.parse(localStorage.getItem("codeGroups")) || {};

function saveToStorage() {
  localStorage.setItem("codeGroups", JSON.stringify(groups));
}

function addGroup() {
  if (!isAdmin) return;
  const groupName = document.getElementById("newGroupName").value.trim();
  if (!groupName) return alert("Please enter a group name.");
  if (groups[groupName]) return alert("Group already exists!");

  groups[groupName] = [];
  updateGroupDropdown();
  renderGroups();
  saveToStorage();
  document.getElementById("newGroupName").value = "";
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

function addNote() {
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

  renderGroups();
  saveToStorage();

  document.getElementById("title").value = "";
  document.getElementById("code").value = "";
  document.getElementById("explanation").value = "";
}

function editNote(group, index) {
  if (!isAdmin) return;
  const note = groups[group][index];
  document.getElementById("groupSelect").value = group;
  document.getElementById("title").value = note.title;
  document.getElementById("code").value = note.code;
  document.getElementById("explanation").value = note.explanation;
  document.getElementById("editIndex").value = index;
}

function deleteNote(group, index) {
  if (!isAdmin) return;
  if (confirm("Are you sure you want to delete this note?")) {
    groups[group].splice(index, 1);
    renderGroups();
    saveToStorage();
    // If editing this note, clear the form
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

function deleteGroup(group) {
  if (!isAdmin) return;
  if (confirm(`Delete group "${group}" and all its notes?`)) {
    delete groups[group];
    updateGroupDropdown();
    renderGroups();
    saveToStorage();
  }
}

function renderGroups() {
  const container = document.getElementById("notesContainer");
  container.innerHTML = "";

  for (let group in groups) {
    const groupDiv = document.createElement("div");
    groupDiv.innerHTML = `
      <div class="group-title">
        📂 ${group}
        ${
          isAdmin
            ? `<button class="delete-group-btn" onclick="deleteGroup('${group}')" style="float:right; margin-left:10px;">🗑️ Delete Group</button>`
            : ""
        }
      </div>
    `;

    groups[group].forEach((note, index) => {
      const noteDiv = document.createElement("div");
      noteDiv.className = "note";
      noteDiv.innerHTML = `
        <h3>${note.title || "Untitled Note"}</h3>
        ${note.code ? `<pre><code>${note.code}</code></pre>` : ""}
        ${note.explanation ? `<p>${note.explanation}</p>` : ""}
        ${
          isAdmin
            ? `<button onclick="editNote('${group}', ${index})">✏️ Edit</button>
               <button onclick="deleteNote('${group}', ${index})">🗑️ Delete</button>`
            : ""
        }
      `;
      groupDiv.appendChild(noteDiv);
    });

    container.appendChild(groupDiv);
  }
}

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
  // Theme toggle setup
  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);

  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.onclick = function () {
      const isDark = document.body.classList.contains("user-mode");
      setTheme(isDark ? "light" : "dark");
    };
  }

  updateGroupDropdown();
  renderGroups();
};