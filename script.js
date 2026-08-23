const KEY = "ams_data_v4";

const defaults = {
    students: [
        {
            roll: "2510992893",
            name: "Bharat",
            course: "CSE Ai & Ml",
            email: "bharat@example.com"
        },
        {
            roll: "2510993153",
            name: "Harshit Thakur",
            course: "CSE Ai & Ml",
            email: "harshit@example.com"
        },
        {
            roll: "2510993154",
            name: "Mokshika",
            course: "CSE Ai & Ml",
            email: "mokshika@example.com"
        },
        {
            roll: "2510993155",
            name: "Antra Thakur",
            course: "CSE Ai & Ml",
            email: "antra@example.com"
        },
        {
            roll: "2510993157",
            name: "Dhanesh",
            course: "CSE Ai & Ml",
            email: "dhanesh@example.com"
        },
        {
            roll: "2510993244",
            name: "Prikshit Rana",
            course: "CSE Ai & Ml",
            email: "prikshit@example.com"
        }
    ],

    subjects: [
        {
            code: "java123",
            name: "Java Programming"
        },
        {
            code: "web123",
            name: "Web Development"
        },
        {
            code: "dbms123",
            name: "Database Management"
        }
    ],

    attendance: {}
};

let data =
    JSON.parse(localStorage.getItem(KEY) || "null") ||
    structuredClone(defaults);

localStorage.setItem(KEY, JSON.stringify(data));

const $ = id => document.getElementById(id);

const studentRoll = sessionStorage.getItem("edu_student");

const role =
    sessionStorage.getItem("edu_role") ||
    (studentRoll ? "student" : "teacher");

function save() {
    localStorage.setItem(KEY, JSON.stringify(data));
}

function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[m]));
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

function dateText() {
    return new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric"
    });
}

function formatAttendanceDate(v) {
    if (!v) return dateText();

    const d = new Date(v + "T00:00:00");

    return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric"
    });
}

let selectedAttendanceDate = today();

function attendanceDate() {
    return $("attendanceDate")?.value ||
        selectedAttendanceDate ||
        today();
}

function key(sub, roll) {
    return `${attendanceDate()}_${sub}_${roll}`;
}

function toast(msg, type = "success") {
    const x = document.createElement("div");

    x.className = "toast " + type;
    x.textContent = msg;

    if ($("toast")) {
        $("toast").appendChild(x);
        setTimeout(() => x.remove(), 2500);
    }
}

function calc(roll) {
    let p = 0;
    let a = 0;

    Object.keys(data.attendance).forEach(k => {
        if (k.endsWith("_" + roll)) {
            if (data.attendance[k] === "present") {
                p++;
            } else if (data.attendance[k] === "absent") {
                a++;
            }
        }
    });

    const t = p + a;

    return {
        present: p,
        absent: a,
        total: t,
        pct: t ? Math.round((p / t) * 100) : 0
    };
}

function subject() {
    return data.subjects[Number($("subjectSelect")?.value) || 0];
}

function statusHTML(s) {
    return `
        <span class="status-dot ${
            s === "present" ? "present-dot" : "absent-dot"
        }"></span>
        ${s === "present" ? "Present" : "Absent"}
    `;
}

function nav() {

    document.querySelectorAll(".side-link").forEach(b => {
        b.onclick = () => show(b.dataset.page);
    });

    document.querySelectorAll("[data-go]").forEach(b => {
        b.onclick = () => show(b.dataset.go);
    });

    if ($("menuBtn")) {
        $("menuBtn").onclick = () => {
            $("sidebar")?.classList.toggle("open");
        };
    }

    if ($("logoutBtn")) {
        $("logoutBtn").onclick = () => {
            sessionStorage.clear();
            location.href = "login.html";
        };
    }

    if ($("quickSettings")) {
        $("quickSettings").onclick = () => show("settings");
    }
}
const studentReportBtn = $("studentViewReportBtn");

if (studentReportBtn) {
    studentReportBtn.onclick = () => {
        show("studentView");
    };
}
function show(id) {

    if (
        role === "student" &&
        ["attendance", "students", "subjects", "reports"].includes(id)
    ) {
        id = "dashboard";
    }

    document.querySelectorAll(".page").forEach(x => {
        x.classList.remove("active");
    });
    document.querySelectorAll(".page").forEach(x => {
        x.classList.remove("active");
    });

    if ($(id)) {
        $(id).classList.add("active");
    }

    document.querySelectorAll(".side-link").forEach(x => {
        x.classList.toggle(
            "active",
            x.dataset.page === id
        );
    });

    if (id === "attendance") renderAttendance();
    if (id === "students") renderStudents();
    if (id === "subjects") renderSubjects();
    if (id === "reports") renderReports();
    if (id === "dashboard") renderDashboard();
    if (id === "studentView") renderStudentView();
    if (id === "profile") renderProfile();
}

function setupRole() {

    if (role === "student") {

        // Remove everything meant only for teachers
        document.querySelectorAll(".teacher-only").forEach(x => {
            x.remove();
        });

        // Show student-only items
        document.querySelectorAll(".student-only").forEach(x => {
            x.classList.remove("hidden");
        });

        // Extra protection: remove Reports page
        const reportsLink =
            document.querySelector('[data-page="reports"]');

        if (reportsLink) {
            reportsLink.remove();
        }

        // Find ONLY logged-in student
        const s = data.students.find(
            x => x.roll === studentRoll
        );

        if ($("userName")) {
            $("userName").textContent =
                s?.name || "Student";
        }

        if ($("welcomeTitle")) {
            $("welcomeTitle").textContent =
                "Student Dashboard";
        }

        if ($("dashboardSubtitle")) {
            $("dashboardSubtitle").textContent =
                "Your attendance overview and alerts";
        }

    } else {

        // Teacher
        document.querySelectorAll(".student-only").forEach(x => {
            x.remove();
        });

        if ($("userName")) {
            $("userName").textContent = "Teacher";
        }
    }
}
function renderDashboard() {

    if (role === "student") {

        const s = data.students.find(
            x => x.roll === studentRoll
        );

        const x = s
            ? calc(s.roll)
            : {
                present: 0,
                absent: 0,
                total: 0,
                pct: 0
            };

        if ($("dashboardStats")) {
            $("dashboardStats").innerHTML = stats([
                ["✓", "Present", x.present, "green"],
                ["✕", "Absent", x.absent, "red"],
                ["▣", "Total Classes", x.total, "blue"],
                ["⚠", "Attendance", x.pct + "%", "orange"]
            ]);
        }

        if ($("todayPercentage")) {
            $("todayPercentage").textContent = x.pct + "%";
        }

        if ($("todayProgress")) {
            $("todayProgress").style.width = x.pct + "%";
        }

        if ($("alertList")) {
            $("alertList").innerHTML =
                x.pct < 75
                    ? `
                    <div class="alert-row">
                        <div>
                            <b>⚠ Short Attendance Warning</b>
                            <small>Your attendance is below 75%.</small>
                        </div>
                        <span class="alert-pct">${x.pct}%</span>
                    </div>
                    `
                    : `
                    <div class="alert-row">
                        <div>
                            <b>✓ Attendance is good</b>
                            <small>Keep attending classes regularly.</small>
                        </div>
                    </div>
                    `;
        }

        return;
    }

    const sub = data.subjects[0];

    let p = 0;
    let a = 0;

    if (sub) {
        data.students.forEach(s => {

            const status =
                data.attendance[
                    key(sub.code, s.roll)
                ];

            if (status === "absent") {
                a++;
            } else {
                p++;
            }
        });
    }

    const pct = data.students.length
        ? Math.round((p / data.students.length) * 100)
        : 0;

    if ($("dashboardStats")) {
        $("dashboardStats").innerHTML = stats([
            ["👥", "Total Students", data.students.length, "blue"],
            ["✓", "Present Today", p, "green"],
            ["✕", "Absent Today", a, "red"],
            [
                "⚠",
                "Below 75%",
                data.students.filter(s => {
                    const x = calc(s.roll);
                    return x.total && x.pct < 75;
                }).length,
                "orange"
            ]
        ]);
    }

    if ($("todayPercentage")) {
        $("todayPercentage").textContent = pct + "%";
    }

    if ($("todayProgress")) {
        $("todayProgress").style.width = pct + "%";
    }

    const alerts = data.students
        .map(s => ({
            s,
            x: calc(s.roll)
        }))
        .filter(z => z.x.total && z.x.pct < 75);

    if ($("alertList")) {
        $("alertList").innerHTML = alerts.length
            ? alerts.map(z => `
                <div class="alert-row">
                    <div>
                        <b>${esc(z.s.name)}</b>
                        <small>${esc(z.s.roll)}</small>
                    </div>
                    <span class="alert-pct">${z.x.pct}%</span>
                </div>
            `).join("")
            : `
                <div class="alert-row">
                    <div>
                        <b>✓ No shortage students</b>
                        <small>Everyone is maintaining attendance.</small>
                    </div>
                </div>
            `;
    }
}

function stats(arr) {

    return arr.map(x => `
        <div class="stat-card">
            <div class="stat-icon ${x[3]}">${x[0]}</div>
            <div>
                <span>${x[1]}</span>
                <strong>${x[2]}</strong>
            </div>
        </div>
    `).join("");
}

function renderSubjects() {

    if ($("subjectSelect")) {
        $("subjectSelect").innerHTML =
            data.subjects.map((s, i) => `
                <option value="${i}">
                    ${esc(s.name)} — ${esc(s.code)}
                </option>
            `).join("");
    }

    if ($("reportSubject")) {
        $("reportSubject").innerHTML =
            data.subjects.map((s, i) => `
                <option value="${i}">
                    ${esc(s.name)}
                </option>
            `).join("");
    }

    if ($("subjectsTable")) {
        $("subjectsTable").innerHTML =
            data.subjects.map((s, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${esc(s.code)}</td>
                    <td>${esc(s.name)}</td>
                    <td>
                        <button
                            class="absent-all"
                            onclick="delSub(${i})">
                            Delete
                        </button>
                    </td>
                </tr>
            `).join("");
    }
}

function renderAttendance() {

    renderSubjects();

    if ($("attendanceDate") &&
        !$("attendanceDate").value) {

        $("attendanceDate").value =
            selectedAttendanceDate;
    }

    if ($("attendanceDate")) {
        selectedAttendanceDate =
            $("attendanceDate").value || today();
    }

    if ($("attendanceDateText")) {
        $("attendanceDateText").textContent =
            formatAttendanceDate(selectedAttendanceDate);
    }

    const s = subject();

    if (!s || !$("attendanceTable")) return;

    $("attendanceTable").innerHTML =
        data.students.map((x, i) => {

            const st =
                data.attendance[
                    key(s.code, x.roll)
                ] || "present";

            return `
                <tr>
                    <td>${i + 1}</td>
                    <td>${esc(x.roll)}</td>
                    <td>${esc(x.name)}</td>
                    <td>${esc(x.course)}</td>

                    <td>
                        <input
                            class="att-radio"
                            type="radio"
                            name="r${i}"
                            ${st === "present" ? "checked" : ""}
                            onclick="setAtt('${x.roll}', 'present')">
                    </td>

                    <td>
                        <input
                            class="att-radio abs"
                            type="radio"
                            name="r${i}"
                            ${st === "absent" ? "checked" : ""}
                            onclick="setAtt('${x.roll}', 'absent')">
                    </td>

                    <td class="status-cell">
                        ${statusHTML(st)}
                    </td>
                </tr>
            `;
        }).join("");
}

if ($("subjectSelect")) {
    $("subjectSelect").onchange = renderAttendance;
}

if ($("attendanceDate")) {

    $("attendanceDate").addEventListener(
        "change",
        () => {

            selectedAttendanceDate =
                $("attendanceDate").value || today();

            renderAttendance();

            if ($("saveMessage")) {
                $("saveMessage").textContent = "";
            }
        }
    );
}

if ($("allPresent")) {
    $("allPresent").onclick = () => bulk("present");
}

if ($("allAbsent")) {
    $("allAbsent").onclick = () => bulk("absent");
}

if ($("saveAttendance")) {

    $("saveAttendance").onclick = () => {

        save();

        const msg =
            `✓ Attendance saved for ${
                formatAttendanceDate(attendanceDate())
            }`;

        if ($("saveMessage")) {
            $("saveMessage").textContent = msg;
        }

        toast(
            `Attendance saved for ${
                formatAttendanceDate(attendanceDate())
            }`
        );

        setTimeout(() => {

            if ($("saveMessage")) {
                $("saveMessage").textContent = "";
            }

        }, 2500);
    };
}

function setAtt(r, s) {

    const sub = subject();

    if (!sub) return;

    data.attendance[
        key(sub.code, r)
    ] = s;

    save();

    renderAttendance();
    renderDashboard();
}

function bulk(s) {

    const sub = subject();

    if (!sub) return;

    data.students.forEach(x => {
        data.attendance[
            key(sub.code, x.roll)
        ] = s;
    });

    save();
    renderAttendance();

    toast(
        s === "present"
            ? "All students marked Present"
            : "All students marked Absent"
    );
}

function renderStudents() {

    if (!$("studentsTable")) return;

    $("studentsTable").innerHTML =
        data.students.map((s, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${esc(s.roll)}</td>
                <td>${esc(s.name)}</td>
                <td>${esc(s.course)}</td>
                <td>${esc(s.email)}</td>
                <td>
                    <button
                        class="absent-all"
                        onclick="delStudent(${i})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");
}

function renderReports() {

    // Students are NOT allowed to access reports
    if (role === "student") {

        if ($("reportTable")) {
            $("reportTable").innerHTML = "";
        }

        return;
    }

    if (!$("reportTable")) return;

    const q =
        ($("reportSearch")?.value || "").toLowerCase();

    $("reportTable").innerHTML =
        data.students
            .filter(s =>
                (s.name + s.roll)
                    .toLowerCase()
                    .includes(q)
            )
            .map(s => {

                const x = calc(s.roll);

                return `
                    <tr>
                        <td>${esc(s.roll)}</td>
                        <td>${esc(s.name)}</td>
                        <td>${esc(s.course)}</td>
                        <td>${x.present}</td>
                        <td>${x.absent}</td>
                        <td><b>${x.pct}%</b></td>
                        <td>
                            <span class="status-dot ${
                                x.pct < 75
                                    ? "absent-dot"
                                    : "present-dot"
                            }"></span>

                            ${
                                x.pct < 75
                                    ? "Short Attendance"
                                    : "Good"
                            }
                        </td>
                    </tr>
                `;

            }).join("");
}

function renderStudentView() {

    const s = data.students.find(
        x => x.roll === studentRoll
    );

    if (!s || !$("studentResult")) return;

    $("studentResult").innerHTML =
        studentCard(s);
}

function getSubjectAttendance(subjectCode, roll) {

    let present = 0;
    let absent = 0;

    Object.keys(data.attendance).forEach(k => {

        // Attendance key format:
        // date_subjectCode_roll

        const parts = k.split("_");

        if (
            parts.length >= 3 &&
            parts[1] === subjectCode &&
            parts.slice(2).join("_") === roll
        ) {

            if (data.attendance[k] === "present") {
                present++;
            }

            if (data.attendance[k] === "absent") {
                absent++;
            }
        }
    });

    const total = present + absent;

    return {
        present: present,
        absent: absent,
        total: total,
        pct: total
            ? Math.round((present / total) * 100)
            : 0
    };
}


function studentCard(s) {

    const overall = calc(s.roll);

    let subjectRows = "";

    data.subjects.forEach((sub, index) => {

        const a = getSubjectAttendance(
            sub.code,
            s.roll
        );

        let status;

        if (a.total === 0) {
            status = "No Attendance";
        }
        else if (a.pct < 75) {
            status = "Short Attendance";
        }
        else {
            status = "Good";
        }

        subjectRows += `
            <tr>

                <td>${index + 1}</td>

                <td>
                    ${esc(sub.code)}
                </td>

                <td>
                    ${esc(sub.name)}
                </td>

                <td>
                    ${a.present}
                </td>

                <td>
                    ${a.absent}
                </td>

                <td>
                    <b>${a.pct}%</b>
                </td>

                <td>
                    ${status}
                </td>

            </tr>
        `;
    });


    return `

        <div class="panel student-result-card">

            <div class="student-profile">

                <div>

                    <h3>
                        ${esc(s.name)}
                    </h3>

                    <p>
                        ${esc(s.roll)} •
                        ${esc(s.course)}
                    </p>

                </div>

                <div class="attendance-circle">
                    ${overall.pct}%
                </div>

            </div>


            <div class="${
                overall.pct < 75
                    ? "warning-box"
                    : "good-box"
            }">

                ${
                    overall.pct < 75
                        ? "⚠ Warning: Your attendance is below 75%."
                        : "✓ Good attendance. Keep it up!"
                }

            </div>


            ${stats([

                ["✓", "Present",
                    overall.present, "green"],

                ["✕", "Absent",
                    overall.absent, "red"],

                ["▣", "Total Classes",
                    overall.total, "blue"],

                ["%", "Overall Attendance",
                    overall.pct + "%", "orange"]

            ])}


            <div class="subject-report">

                <h3>
                    Subject-wise Attendance
                </h3>

                <p>
                    Attendance details for every subject
                </p>


                <div class="table-wrap">

                    <table>

                        <thead>

                            <tr>

                                <th>#</th>

                                <th>SUBJECT CODE</th>

                                <th>SUBJECT</th>

                                <th>PRESENT</th>

                                <th>ABSENT</th>

                                <th>ATTENDANCE</th>

                                <th>STATUS</th>

                            </tr>

                        </thead>


                        <tbody>

                            ${subjectRows}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    `;
}

function renderProfile() {

    if (!$("profileContent")) return;

    const s =
        role === "student"
            ? data.students.find(
                x => x.roll === studentRoll
            )
            : null;

    $("profileContent").innerHTML =
        role === "student" && s
            ? `
                <div class="profile-line">
                    <span>Name</span>
                    <b>${esc(s.name)}</b>
                </div>

                <div class="profile-line">
                    <span>Roll No.</span>
                    <b>${esc(s.roll)}</b>
                </div>

                <div class="profile-line">
                    <span>Course</span>
                    <b>${esc(s.course)}</b>
                </div>

                <div class="profile-line">
                    <span>Email</span>
                    <b>${esc(s.email)}</b>
                </div>
            `
            : `
                <div class="profile-line">
                    <span>Role</span>
                    <b>Teacher</b>
                </div>

                <div class="profile-line">
                    <span>Teacher ID</span>
                    <b>T001</b>
                </div>

                <div class="profile-line">
                    <span>Access</span>
                    <b>Attendance Management</b>
                </div>
            `;
}

function delStudent(i) {

    if (confirm("Delete this student?")) {

        data.students.splice(i, 1);

        save();
        renderStudents();
        renderDashboard();

        toast("Student deleted");
    }
}

function delSub(i) {

    if (confirm("Delete this subject?")) {

        data.subjects.splice(i, 1);

        save();
        renderSubjects();
        renderAttendance();

        toast("Subject deleted");
    }
}

if ($("addStudentBtn")) {

    $("addStudentBtn").onclick = () => {
        $("studentForm")?.classList.toggle("hidden");
    };
}

if ($("saveStudent")) {

    $("saveStudent").onclick = () => {

        const r = $("studentRoll").value.trim();
        const n = $("studentName").value.trim();
        const c = $("studentCourse").value.trim();
        const e = $("studentEmail").value.trim();

        if (!r || !n || !c || !e) {
            return toast(
                "Fill all student fields",
                "error"
            );
        }

        if (data.students.some(x => x.roll === r)) {
            return toast(
                "Roll number already exists",
                "error"
            );
        }

        data.students.push({
            roll: r,
            name: n,
            course: c,
            email: e
        });

        save();

        $("studentForm")?.classList.add("hidden");

        [
            "studentRoll",
            "studentName",
            "studentCourse",
            "studentEmail"
        ].forEach(i => {
            if ($(i)) $(i).value = "";
        });

        renderStudents();
        renderDashboard();

        toast("Student added");
    };
}

if ($("addSubject")) {

    $("addSubject").onclick = () => {

        const c = $("subjectCode").value.trim();
        const n = $("subjectName").value.trim();

        if (!c || !n) {
            return toast(
                "Fill subject fields",
                "error"
            );
        }

        data.subjects.push({
            code: c,
            name: n
        });

        save();

        $("subjectCode").value = "";
        $("subjectName").value = "";

        renderSubjects();

        toast("Subject added");
    };
}

if ($("exportBtn")) {

    $("exportBtn").onclick = () => {

        let csv =
            "Roll No,Name,Course,Present,Absent,Attendance,Status\n";

        data.students.forEach(s => {

            const x = calc(s.roll);

            csv +=
                `"${s.roll}","${s.name}","${s.course}",` +
                `${x.present},${x.absent},${x.pct}%,"` +
                `${x.pct < 75
                    ? "Short Attendance"
                    : "Good"}"\n`;
        });

        const a = document.createElement("a");

        a.href = URL.createObjectURL(
            new Blob([csv], {
                type: "text/csv"
            })
        );

        a.download = "attendance_report.csv";
        a.click();

        URL.revokeObjectURL(a.href);
    };
}

if ($("resetData")) {

    $("resetData").onclick = () => {

        if (confirm("Reset all demo data?")) {
            localStorage.removeItem(KEY);
            location.reload();
        }
    };
}

if ($("compactToggle")) {

    $("compactToggle").onchange = e => {
        document.body.classList.toggle(
            "compact",
            e.target.checked
        );
    };
}

if ($("headerDate")) {
    $("headerDate").textContent = dateText();
}

selectedAttendanceDate = today();

if ($("attendanceDate")) {
    $("attendanceDate").value =
        selectedAttendanceDate;
}

if ($("attendanceDateText")) {
    $("attendanceDateText").textContent =
        dateText();
}

if ($("clock")) {

    setInterval(() => {

        $("clock").textContent =
            new Date().toLocaleTimeString(
                "en-GB",
                { hour12: false }
            );

    }, 1000);

    $("clock").textContent =
        new Date().toLocaleTimeString(
            "en-GB",
            { hour12: false }
        );
}

nav();
setupRole();
renderDashboard();
renderSubjects();

if (role === "teacher") {
    show("attendance");
    renderAttendance();
} else {
    show("dashboard");
    renderStudentView();
}

renderReports();
renderProfile();

// ================= DARK MODE =================

const darkModeBtn = document.getElementById("darkModeBtn");

if (darkModeBtn) {
    // Load saved theme
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        darkModeBtn.textContent = "☀️";
    }

    darkModeBtn.onclick = () => {
        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("theme", "dark");
            darkModeBtn.textContent = "☀️";
        } else {
            localStorage.setItem("theme", "light");
            darkModeBtn.textContent = "🌙";
        }
    };
}

