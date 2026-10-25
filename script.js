/* EduAttend Attendance Management System
   JavaScript-only update: keeps the existing HTML and CSS interface unchanged.
   Concepts demonstrated: functions, objects, arrays, DOM events, validation,
   localStorage, date handling, filtering, calculations, and CSV export. */
"use strict";

const STORAGE_KEY = "ams_data_v4";
const DEFAULT_DATA = {
  students: [
    { roll: "2510992893", name: "Bharat", course: "CSE Ai & Ml", email: "bharat@example.com" },
    { roll: "2510993153", name: "Harshit Thakur", course: "CSE Ai & Ml", email: "harshit@example.com" },
    { roll: "2510993154", name: "Mokshika", course: "CSE Ai & Ml", email: "mokshika@example.com" },
    { roll: "2510993155", name: "Antra Thakur", course: "CSE Ai & Ml", email: "antra@example.com" },
    { roll: "2510993157", name: "Dhanesh", course: "CSE Ai & Ml", email: "dhanesh@example.com" },
    { roll: "2510993244", name: "Prikshit Rana", course: "CSE Ai & Ml", email: "prikshit@example.com" }
  ],
  subjects: [
    { code: "java123", name: "Java Programming" },
    { code: "web123", name: "Web Development" },
    { code: "dbms123", name: "Database Management" }
  ],
  attendance: {}
};

const $ = (id) => document.getElementById(id);
const role = sessionStorage.getItem("edu_role") || "teacher";
const studentRoll = sessionStorage.getItem("edu_student") || "";
let selectedAttendanceDate = localDate();
let data = loadData();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return clone(DEFAULT_DATA);
    const parsed = JSON.parse(stored);
    if (!parsed || !Array.isArray(parsed.students) ||
        !Array.isArray(parsed.subjects) || !parsed.attendance ||
        typeof parsed.attendance !== "object") {
      return clone(DEFAULT_DATA);
    }
    return parsed;
  } catch (error) {
    console.warn("Could not load saved EduAttend data.", error);
    return clone(DEFAULT_DATA);
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Could not save data.", error);
    toast("Unable to save data in this browser.", "error");
    return false;
  }
}

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateText(value = localDate()) {
  return formatAttendanceDate(value);
}

function formatAttendanceDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "2-digit", year: "numeric"
  });
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function toast(message, type = "success") {
  const container = $("toast");
  if (!container || $("notifyToggle")?.checked === false) return;
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  container.appendChild(item);
  window.setTimeout(() => item.remove(), 2600);
}

function attendanceDate() {
  return $("attendanceDate")?.value || selectedAttendanceDate || localDate();
}

function attendanceKey(subjectCode, roll, date = attendanceDate()) {
  return `${date}_${subjectCode}_${roll}`;
}

function getSubject() {
  const index = Number($("subjectSelect")?.value || 0);
  return data.subjects[index] || null;
}

function calculateAttendance(roll, subjectCode = "") {
  let present = 0;
  let absent = 0;

  Object.entries(data.attendance).forEach(([recordKey, status]) => {
    const parts = recordKey.split("_");
    const recordRoll = parts.pop();
    const recordSubject = parts.slice(1).join("_");
    if (recordRoll !== String(roll)) return;
    if (subjectCode && recordSubject !== subjectCode) return;
    if (status === "present") present++;
    if (status === "absent") absent++;
  });

  const total = present + absent;
  return {
    present,
    absent,
    total,
    pct: total ? Math.round((present / total) * 100) : 0
  };
}

function stats(items) {
  return items.map((item) => `
    <div class="stat-card">
      <div class="stat-icon ${item[3]}">${item[0]}</div>
      <div><span>${esc(item[1])}</span><strong>${esc(item[2])}</strong></div>
    </div>`).join("");
}

function statusHTML(status) {
  if (!status) return '<span class="status-dot"></span>Not marked';
  const isPresent = status === "present";
  return `<span class="status-dot ${isPresent ? "present-dot" : "absent-dot"}"></span>${isPresent ? "Present" : "Absent"}`;
}

function show(pageId) {
  const page = $(pageId);
  if (!page) return;
  document.querySelectorAll(".page").forEach((item) => item.classList.remove("active"));
  page.classList.add("active");
  document.querySelectorAll(".side-link").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });
  $("sidebar")?.classList.remove("open");

  const pageRenderers = {
    dashboard: renderDashboard,
    attendance: renderAttendance,
    students: renderStudents,
    subjects: renderSubjects,
    reports: renderReports,
    studentView: renderStudentView,
    profile: renderProfile
  };
  if (pageRenderers[pageId]) pageRenderers[pageId]();
}

function setupNavigation() {
  document.querySelectorAll(".side-link").forEach((button) => {
    button.addEventListener("click", () => show(button.dataset.page));
  });
  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => show(button.dataset.go));
  });
  $("menuBtn")?.addEventListener("click", () => $("sidebar")?.classList.toggle("open"));
  $("logoutBtn")?.addEventListener("click", () => {
    sessionStorage.removeItem("edu_role");
    sessionStorage.removeItem("edu_student");
    window.location.href = "login.html";
  });
  $("quickSettings")?.addEventListener("click", () => show("settings"));
}

function setupRole() {
  if (role === "student") {
    document.querySelectorAll(".teacher-only").forEach((element) => element.remove());
    document.querySelectorAll(".student-only").forEach((element) => element.classList.remove("hidden"));
    const student = data.students.find((item) => item.roll === studentRoll);
    if (!student) {
      toast("Student account not found. Please sign in again.", "error");
      window.setTimeout(() => { window.location.href = "login.html"; }, 500);
      return;
    }
    $("userName").textContent = student.name;
    $("welcomeTitle").textContent = "Student Dashboard";
    $("dashboardSubtitle").textContent = "Your attendance overview and alerts";
  } else {
    document.querySelectorAll(".student-only").forEach((element) => element.remove());
    if ($("userName")) $("userName").textContent = "Teacher";
  }
}

function renderDashboard() {
  if (!$("dashboardStats")) return;

  if (role === "student") {
    const student = data.students.find((item) => item.roll === studentRoll);
    const result = student ? calculateAttendance(student.roll) : { present: 0, absent: 0, total: 0, pct: 0 };
    $("dashboardStats").innerHTML = stats([
      ["✓", "Present", result.present, "green"],
      ["✕", "Absent", result.absent, "red"],
      ["▣", "Total Classes", result.total, "blue"],
      ["⚠", "Attendance", `${result.pct}%`, "orange"]
    ]);
    $("todayPercentage").textContent = `${result.pct}%`;
    $("todayProgress").style.width = `${result.pct}%`;
    $("alertList").innerHTML = result.total && result.pct < 75
      ? `<div class="alert-row"><div><b>⚠ Short Attendance Warning</b><small>Your attendance is below 75%.</small></div><span class="alert-pct">${result.pct}%</span></div>`
      : '<div class="alert-row"><div><b>✓ Attendance overview</b><small>Keep attending classes regularly.</small></div></div>';
    return;
  }

  const subject = getSubject();
  let present = 0;
  let absent = 0;
  let unmarked = 0;
  data.students.forEach((student) => {
    const status = subject ? data.attendance[attendanceKey(subject.code, student.roll)] : "";
    if (status === "present") present++;
    else if (status === "absent") absent++;
    else unmarked++;
  });
  const marked = present + absent;
  const percentage = marked ? Math.round((present / marked) * 100) : 0;
  const shortage = data.students.filter((student) => {
    const result = calculateAttendance(student.roll);
    return result.total > 0 && result.pct < 75;
  }).length;

  $("dashboardStats").innerHTML = stats([
    ["👥", "Total Students", data.students.length, "blue"],
    ["✓", "Present Today", present, "green"],
    ["✕", "Absent Today", absent, "red"],
    ["⚠", "Below 75%", shortage, "orange"]
  ]);
  $("todayPercentage").textContent = `${percentage}%`;
  $("todayProgress").style.width = `${percentage}%`;
  $("alertList").innerHTML = `
    <div class="alert-row"><div><b>${esc(subject?.name || "No subject selected")}</b>
    <small>${esc(dateText(attendanceDate()))}: ${marked} marked, ${unmarked} not marked</small></div>
    <span class="alert-pct">${percentage}%</span></div>
    ${shortage ? `<div class="alert-row"><div><b>⚠ ${shortage} student(s) below 75%</b><small>Open reports to review attendance.</small></div></div>` : ""}`;
}

function renderSubjects() {
  if (!$("subjectSelect")) return;
  const previousSubject = $("subjectSelect").value;
  $("subjectSelect").innerHTML = data.subjects.map((subject, index) =>
    `<option value="${index}">${esc(subject.name)} — ${esc(subject.code)}</option>`
  ).join("");
  if (data.subjects[Number(previousSubject)]) $("subjectSelect").value = previousSubject;

  const previousReport = $("reportSubject").value;
  $("reportSubject").innerHTML = '<option value="">All subjects</option>' +
    data.subjects.map((subject) =>
      `<option value="${esc(subject.code)}">${esc(subject.name)} — ${esc(subject.code)}</option>`
    ).join("");
  if (data.subjects.some((subject) => subject.code === previousReport)) {
    $("reportSubject").value = previousReport;
  }

  $("subjectsTable").innerHTML = data.subjects.length
    ? data.subjects.map((subject, index) => `
      <tr><td>${index + 1}</td><td>${esc(subject.code)}</td><td>${esc(subject.name)}</td>
      <td><button class="absent-all" type="button" data-delete-subject="${index}">Delete</button></td></tr>`
    ).join("")
    : '<tr><td colspan="4">No subjects added yet.</td></tr>';

  document.querySelectorAll("[data-delete-subject]").forEach((button) => {
    button.addEventListener("click", () => deleteSubject(Number(button.dataset.deleteSubject)));
  });
}

function renderAttendance() {
  if (!$("attendanceTable")) return;
  renderSubjects();
  if ($("attendanceDate") && !$("attendanceDate").value) $("attendanceDate").value = selectedAttendanceDate;
  selectedAttendanceDate = attendanceDate();
  if ($("attendanceDateText")) $("attendanceDateText").textContent = dateText(selectedAttendanceDate);

  const subject = getSubject();
  if (!subject) {
    $("attendanceTable").innerHTML = '<tr><td colspan="7">Add a subject before marking attendance.</td></tr>';
    return;
  }

  $("attendanceTable").innerHTML = data.students.length
    ? data.students.map((student, index) => {
      const status = data.attendance[attendanceKey(subject.code, student.roll)] || "";
      return `<tr>
        <td>${index + 1}</td><td>${esc(student.roll)}</td><td>${esc(student.name)}</td><td>${esc(student.course)}</td>
        <td><input class="att-radio" type="radio" name="attendance-${index}" value="present"
          aria-label="Mark ${esc(student.name)} present" data-roll="${esc(student.roll)}" ${status === "present" ? "checked" : ""}></td>
        <td><input class="att-radio abs" type="radio" name="attendance-${index}" value="absent"
          aria-label="Mark ${esc(student.name)} absent" data-roll="${esc(student.roll)}" ${status === "absent" ? "checked" : ""}></td>
        <td class="status-cell">${statusHTML(status)}</td></tr>`;
    }).join("")
    : '<tr><td colspan="7">No students added yet.</td></tr>';

  document.querySelectorAll("#attendanceTable input[type=radio]").forEach((input) => {
    input.addEventListener("change", () => setAttendance(input.dataset.roll, input.value));
  });
  renderDashboard();
}

function setAttendance(roll, status) {
  const subject = getSubject();
  if (!subject) return;
  data.attendance[attendanceKey(subject.code, roll)] = status;
  save();
  renderAttendance();
  renderReports();
}

function bulk(status) {
  const subject = getSubject();
  if (!subject) return toast("Please add a subject first.", "error");
  data.students.forEach((student) => {
    data.attendance[attendanceKey(subject.code, student.roll)] = status;
  });
  save();
  renderAttendance();
  renderDashboard();
  renderReports();
  toast(status === "present" ? "All students marked Present" : "All students marked Absent");
}

function renderStudents() {
  if (!$("studentsTable")) return;
  $("studentsTable").innerHTML = data.students.length
    ? data.students.map((student, index) => `
      <tr><td>${index + 1}</td><td>${esc(student.roll)}</td><td>${esc(student.name)}</td>
      <td>${esc(student.course)}</td><td>${esc(student.email)}</td>
      <td><button class="absent-all" type="button" data-delete-student="${index}">Delete</button></td></tr>`
    ).join("")
    : '<tr><td colspan="6">No students added yet.</td></tr>';

  document.querySelectorAll("[data-delete-student]").forEach((button) => {
    button.addEventListener("click", () => deleteStudent(Number(button.dataset.deleteStudent)));
  });
}

function deleteStudent(index) {
  const student = data.students[index];
  if (!student || !window.confirm(`Delete ${student.name} and their attendance records?`)) return;
  data.students.splice(index, 1);
  Object.keys(data.attendance).forEach((key) => {
    if (key.endsWith(`_${student.roll}`)) delete data.attendance[key];
  });
  save();
  renderStudents();
  renderAttendance();
  renderDashboard();
  renderReports();
  toast("Student deleted.");
}

function deleteSubject(index) {
  const subject = data.subjects[index];
  if (!subject || !window.confirm(`Delete subject "${subject.name}" and its attendance records?`)) return;
  data.subjects.splice(index, 1);
  Object.keys(data.attendance).forEach((key) => {
    if (key.split("_")[1] === subject.code) delete data.attendance[key];
  });
  save();
  renderSubjects();
  renderAttendance();
  renderDashboard();
  renderReports();
  toast("Subject deleted.");
}

function renderReports() {
  if (!$("reportTable")) return;
  const query = ($("reportSearch")?.value || "").trim().toLowerCase();
  const selectedCode = $("reportSubject")?.value || "";
  const students = data.students.filter((student) =>
    `${student.name} ${student.roll} ${student.course}`.toLowerCase().includes(query)
  );

  $("reportTable").innerHTML = students.length
    ? students.map((student) => {
      const result = calculateAttendance(student.roll, selectedCode);
      const label = result.total === 0 ? "No data" : result.pct < 75 ? "Short Attendance" : "Good";
      const dotClass = result.total && result.pct < 75 ? "absent-dot" : "present-dot";
      return `<tr><td>${esc(student.roll)}</td><td>${esc(student.name)}</td><td>${esc(student.course)}</td>
        <td>${result.present}</td><td>${result.absent}</td><td><b>${result.pct}%</b></td>
        <td><span class="status-dot ${dotClass}"></span>${label}</td></tr>`;
    }).join("")
    : '<tr><td colspan="7">No students match your search.</td></tr>';
}

function renderStudentView() {
  const student = data.students.find((item) => item.roll === studentRoll);
  if ($("studentResult")) {
    $("studentResult").innerHTML = student
      ? studentCard(student)
      : '<div class="panel">Student record not found. Please sign in again.</div>';
  }
}

function studentCard(student) {
  const result = calculateAttendance(student.roll);
  const warning = result.total > 0 && result.pct < 75;
  return `<div class="panel student-result-card">
    <div class="student-profile"><div><h3>${esc(student.name)}</h3><p>${esc(student.roll)} • ${esc(student.course)}</p></div>
    <div class="attendance-circle">${result.pct}%</div></div>
    <div class="${warning ? "warning-box" : "good-box"}">${warning
      ? "⚠ Warning: Your attendance is below 75%. Please attend classes regularly."
      : "✓ Good attendance. Keep attending classes regularly."}</div>
    ${stats([
      ["✓", "Present", result.present, "green"],
      ["✕", "Absent", result.absent, "red"],
      ["▣", "Total Classes", result.total, "blue"],
      ["%", "Attendance", `${result.pct}%`, "orange"]
    ])}
  </div>`;
}

function renderProfile() {
  const student = role === "student" ? data.students.find((item) => item.roll === studentRoll) : null;
  if (!$("profileContent")) return;
  $("profileContent").innerHTML = student
    ? `<div class="profile-line"><span>Name</span><b>${esc(student.name)}</b></div>
       <div class="profile-line"><span>Roll No.</span><b>${esc(student.roll)}</b></div>
       <div class="profile-line"><span>Course</span><b>${esc(student.course)}</b></div>
       <div class="profile-line"><span>Email</span><b>${esc(student.email)}</b></div>`
    : '<div class="profile-line"><span>Role</span><b>Teacher</b></div><div class="profile-line"><span>Teacher ID</span><b>T001</b></div><div class="profile-line"><span>Access</span><b>Attendance Management</b></div>';
}

function addStudent() {
  const roll = $("studentRoll").value.trim();
  const name = $("studentName").value.trim();
  const course = $("studentCourse").value.trim();
  const email = $("studentEmail").value.trim().toLowerCase();

  if (!roll || !name || !course || !email) return toast("Fill all student fields", "error");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast("Enter a valid email address", "error");
  if (data.students.some((student) => student.roll.toLowerCase() === roll.toLowerCase())) {
    return toast("Roll number already exists", "error");
  }

  data.students.push({ roll, name, course, email });
  save();
  $("studentForm").classList.add("hidden");
  ["studentRoll", "studentName", "studentCourse", "studentEmail"].forEach((id) => { $(id).value = ""; });
  renderStudents();
  renderAttendance();
  renderDashboard();
  renderReports();
  toast("Student added");
}

function addSubject() {
  const code = $("subjectCode").value.trim();
  const name = $("subjectName").value.trim();
  if (!code || !name) return toast("Fill subject fields", "error");
  if (data.subjects.some((subject) => subject.code.toLowerCase() === code.toLowerCase())) {
    return toast("Subject code already exists", "error");
  }
  data.subjects.push({ code, name });
  save();
  $("subjectCode").value = "";
  $("subjectName").value = "";
  renderSubjects();
  renderAttendance();
  renderReports();
  renderDashboard();
  toast("Subject added");
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportReport() {
  const subjectCode = $("reportSubject")?.value || "";
  const rows = [["Roll No", "Name", "Course", "Present", "Absent", "Attendance", "Status"]];
  data.students.forEach((student) => {
    const result = calculateAttendance(student.roll, subjectCode);
    const status = result.total === 0 ? "No data" : result.pct < 75 ? "Short Attendance" : "Good";
    rows.push([student.roll, student.name, student.course, result.present, result.absent, `${result.pct}%`, status]);
  });
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance_report_${localDate()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("Attendance report exported");
}

function setupEvents() {
  $("subjectSelect")?.addEventListener("change", () => {
    renderAttendance();
    renderDashboard();
  });
  $("attendanceDate")?.addEventListener("change", () => {
    selectedAttendanceDate = attendanceDate();
    if ($("saveMessage")) $("saveMessage").textContent = "";
    renderAttendance();
    renderDashboard();
  });
  $("allPresent")?.addEventListener("click", () => bulk("present"));
  $("allAbsent")?.addEventListener("click", () => bulk("absent"));
  $("saveAttendance")?.addEventListener("click", () => {
    save();
    $("saveMessage").textContent = `✓ Attendance saved for ${dateText(attendanceDate())}`;
    toast(`Attendance saved for ${dateText(attendanceDate())}`);
    window.setTimeout(() => { if ($("saveMessage")) $("saveMessage").textContent = ""; }, 2500);
  });
  $("addStudentBtn")?.addEventListener("click", () => $("studentForm")?.classList.toggle("hidden"));
  $("saveStudent")?.addEventListener("click", addStudent);
  $("addSubject")?.addEventListener("click", addSubject);
  $("reportSearch")?.addEventListener("input", renderReports);
  $("reportSubject")?.addEventListener("change", renderReports);
  $("exportBtn")?.addEventListener("click", exportReport);
  $("resetData")?.addEventListener("click", () => {
    if (!window.confirm("Reset all demo data?")) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });
  $("compactToggle")?.addEventListener("change", (event) => {
    document.body.classList.toggle("compact", event.target.checked);
  });
  $("notifyToggle")?.addEventListener("change", () => {
    if ($("notifyToggle").checked) toast("Notifications enabled");
  });
}

function updateClock() {
  if ($("clock")) $("clock").textContent = new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function init() {
  $("headerDate").textContent = dateText();
  if ($("attendanceDate")) $("attendanceDate").value = selectedAttendanceDate;
  if ($("attendanceDateText")) $("attendanceDateText").textContent = dateText(selectedAttendanceDate);

  setupNavigation();
  setupRole();
  setupEvents();
  renderSubjects();
  renderStudents();
  renderAttendance();
  renderDashboard();
  renderReports();
  renderProfile();
  updateClock();
  window.setInterval(updateClock, 1000);

  if (role === "student") {
    show("dashboard");
    renderStudentView();
  } else {
    show("attendance");
  }
}

document.addEventListener("DOMContentLoaded", init);
