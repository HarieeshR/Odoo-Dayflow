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

/* =========================================================
   EMPLOYEE SALARY DATA
   ========================================================= */

const salaryEmployees = [

    {
        id: "EMP001",
        name: "Arun Kumar",
        department: "IT",
        position: "Software Developer",
        wage: 60000
    },

    {
        id: "EMP002",
        name: "Priya S",
        department: "HR",
        position: "HR Executive",
        wage: 50000
    },

    {
        id: "EMP003",
        name: "Karthik R",
        department: "Finance",
        position: "Accountant",
        wage: 45000
    },

    {
        id: "EMP004",
        name: "Divya M",
        department: "Marketing",
        position: "Marketing Executive",
        wage: 55000
    },

    {
        id: "EMP005",
        name: "Rahul S",
        department: "Operations",
        position: "Operations Executive",
        wage: 48000
    }

];


/* =========================================================
   CURRENT SELECTED EMPLOYEE
   ========================================================= */

let selectedSalaryEmployee = null;


/* =========================================================
   SEARCH EMPLOYEE SALARY
   ========================================================= */

function searchSalaryEmployee() {

    const searchInput =
        document.getElementById(
            "salaryEmployeeSearch"
        );

    const message =
        document.getElementById(
            "salarySearchMessage"
        );

    const results =
        document.getElementById(
            "salarySearchResults"
        );

    const salaryDetails =
        document.getElementById(
            "salaryDetails"
        );

    const emptyState =
        document.getElementById(
            "salaryEmptyState"
        );


    const searchValue =
        searchInput.value
            .trim()
            .toLowerCase();


    /* Nothing entered */

    if (searchValue === "") {

        message.textContent =
            "Please enter an employee name or employee ID.";

        message.className =
            "salary-search-message error";

        results.style.display = "none";

        salaryDetails.style.display = "none";

        emptyState.style.display = "block";

        return;
    }


    /* Search by ID OR Name */

    const employee =
        salaryEmployees.find(function (emp) {

            return (
                emp.id.toLowerCase()
                    .includes(searchValue)
                ||
                emp.name.toLowerCase()
                    .includes(searchValue)
            );

        });


    /* Employee NOT found */

    if (!employee) {

        selectedSalaryEmployee = null;

        message.textContent =
            "No employee found with that name or ID.";

        message.className =
            "salary-search-message error";

        results.style.display = "none";

        salaryDetails.style.display = "none";

        emptyState.style.display = "block";

        return;
    }


    /* Employee found */

    selectedSalaryEmployee = employee;


    message.textContent =
        "Employee found.";

    message.className =
        "salary-search-message success";


    /* Show employee result */

    results.style.display = "block";


    document.getElementById(
        "salaryEmployeeResult"
    ).innerHTML = `

        <div
            class="salary-result-item"
            onclick="selectSalaryEmployee('${employee.id}')">

            <div>

                <strong>
                    ${employee.name}
                </strong>

                <span>
                    ${employee.id}
                </span>

            </div>

            <div>

                <span>
                    ${employee.department}
                </span>

                <span>
                    ${employee.position}
                </span>

            </div>

        </div>

    `;


    /* Automatically display details */

    displaySalaryDetails(employee);

}


/* =========================================================
   DISPLAY SALARY DETAILS
   ========================================================= */

function displaySalaryDetails(employee) {

    const salaryDetails =
        document.getElementById(
            "salaryDetails"
        );

    const emptyState =
        document.getElementById(
            "salaryEmptyState"
        );


    /* Employee information */

    document.getElementById(
        "salaryEmployeeName"
    ).textContent =
        employee.name;


    document.getElementById(
        "salaryEmployeeId"
    ).textContent =
        employee.id;


    document.getElementById(
        "salaryEmployeeDepartment"
    ).textContent =
        employee.department;


    document.getElementById(
        "salaryEmployeeAvatar"
    ).textContent =
        employee.name
            .charAt(0)
            .toUpperCase();


    /* Wage */

    document.getElementById(
        "salaryWage"
    ).value =
        employee.wage;


    /* Show salary */

    salaryDetails.style.display =
        "block";

    emptyState.style.display =
        "none";


    /* Calculate */

    calculateEmployeeSalary();

}


/* =========================================================
   SELECT EMPLOYEE FROM SEARCH RESULT
   ========================================================= */

function selectSalaryEmployee(employeeId) {

    const employee =
        salaryEmployees.find(function (emp) {

            return emp.id === employeeId;

        });


    if (!employee) {
        return;
    }


    selectedSalaryEmployee =
        employee;


    displaySalaryDetails(employee);

}


/* =========================================================
   CALCULATE EMPLOYEE SALARY
   ========================================================= */

function calculateEmployeeSalary() {

    if (!selectedSalaryEmployee) {
        return;
    }


    const wage =
        Number(
            document.getElementById(
                "salaryWage"
            ).value
        );


    if (isNaN(wage) || wage < 0) {
        return;
    }


    /* Salary components */

    const basic =
        wage * 0.50;


    const hra =
        basic * 0.50;


    const standardAllowance =
        wage * 0.08334;


    const performanceBonus =
        wage * 0.04166;


    const lta =
        wage * 0.04166;


    /* Display */

    document.getElementById(
        "employeeBasicSalary"
    ).textContent =
        formatEmployeeCurrency(basic);


    document.getElementById(
        "employeeHRA"
    ).textContent =
        formatEmployeeCurrency(hra);


    document.getElementById(
        "employeeStandardAllowance"
    ).textContent =
        formatEmployeeCurrency(
            standardAllowance
        );


    document.getElementById(
        "employeeBonus"
    ).textContent =
        formatEmployeeCurrency(
            performanceBonus
        );


    document.getElementById(
        "employeeLTA"
    ).textContent =
        formatEmployeeCurrency(lta);


    document.getElementById(
        "employeeTotalSalary"
    ).textContent =
        formatEmployeeCurrency(wage);

}


/* =========================================================
   CURRENCY FORMAT
   ========================================================= */

function formatEmployeeCurrency(value) {

    return "₹" +
        Math.round(value)
            .toLocaleString("en-IN");

}


/* =========================================================
   SEARCH WHEN PRESSING ENTER
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const searchInput =
            document.getElementById(
                "salaryEmployeeSearch"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "keypress",
                function (event) {

                    if (
                        event.key === "Enter"
                    ) {

                        searchSalaryEmployee();

                    }

                }
            );

        }

    }
);