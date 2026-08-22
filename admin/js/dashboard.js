function showSection(sectionId) {

    const sections = document.querySelectorAll(".section");

    sections.forEach(section => {
        section.classList.remove("active-section");
    });

    const selected = document.getElementById(sectionId);

    if (selected) {
        selected.classList.add("active-section");
    }

    const titles = {
        dashboard: "Admin Dashboard",
        employees: "Employee Management",
        attendance: "Attendance",
        timeoff: "Time Off",
        profile: "My Profile",
        salary: "Salary Information"
    };

    document.getElementById("pageTitle").textContent =
        titles[sectionId] || "Admin Dashboard";
}


/* SEARCH EMPLOYEES */

function searchEmployees() {

    const input =
        document.getElementById("employeeSearch")
        .value.toLowerCase();

    const rows =
        document.querySelectorAll("#employeeTable tbody tr");

    rows.forEach(row => {

        const text = row.textContent.toLowerCase();

        row.style.display =
            text.includes(input) ? "" : "none";

    });
}


/* APPROVE LEAVE */

function approveLeave(button) {

    const row = button.closest("tr");

    const status = row.querySelector(".status");

    status.textContent = "Approved";

    status.className = "status active";

    button.parentElement.innerHTML =
        '<span class="status active">Approved</span>';

    updatePendingCount();

}


/* REJECT LEAVE */

function rejectLeave(button) {

    const row = button.closest("tr");

    const status = row.querySelector(".status");

    status.textContent = "Rejected";

    status.className = "status leave";

    button.parentElement.innerHTML =
        '<span class="status leave">Rejected</span>';

    updatePendingCount();

}


/* UPDATE PENDING REQUESTS */

function updatePendingCount() {

    const pending =
        document.querySelectorAll(
            "#leaveTable .status.pending"
        ).length;

    document.getElementById("pendingCount").textContent =
        pending;
}


/* SALARY CALCULATION */

function calculateSalary() {

    const wage =
        Number(document.getElementById("wage").value);

    const basic = wage * 0.50;

    const hra = basic * 0.50;

    const standard = wage * 0.08334;

    const bonus = wage * 0.04166;

    const lta = wage * 0.04166;

    document.getElementById("basicSalary").textContent =
        formatCurrency(basic);

    document.getElementById("hra").textContent =
        formatCurrency(hra);

    document.getElementById("standardAllowance").textContent =
        formatCurrency(standard);

    document.getElementById("bonus").textContent =
        formatCurrency(bonus);

    document.getElementById("lta").textContent =
        formatCurrency(lta);

    document.getElementById("totalSalary").textContent =
        formatCurrency(wage);
}


function formatCurrency(value) {

    return "₹" +
        Math.round(value).toLocaleString("en-IN");

}


/* ADD EMPLOYEE */

function addEmployee() {

    alert(
        "Employee creation form will be implemented next."
    );

}


/* LOGOUT */

function logout() {

    if (confirm("Are you sure you want to logout?")) {

        window.location.href =
            "../hrms-login.html";

    }

}