class DashboardContainer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="min-h-screen text-gray-900">
        <div class="p-3 black-white">
          <h1 class="text-2xl text-white font-bold">Welcome Hamirul</h1>
        </div>
        <div class="p-3 flex flex-col space-y-6">
          <total-contacts></total-contacts>
          <scheduler-settings></scheduler-settings>
          <message-list></message-list>
          <application-settings></application-settings>
          <user-profile></user-profile>
        </div>
      </div>
    `;
  }
}
class TotalContacts extends HTMLElement {
  async fetchTotalContacts(contactId) {
    try {
      // Get the value from localStorage
      const storedTotalContacts = localStorage.getItem("totalContacts");

      // Check if the value is valid (not null, undefined, or an invalid string)
      if (
        storedTotalContacts &&
        storedTotalContacts !== "0" &&
        storedTotalContacts !== "undefined" &&
        storedTotalContacts !== "null" &&
        window.allContacts &&
        window.allContacts.length > 0
      ) {
        this.querySelector(".contact-count").textContent = storedTotalContacts;
        return;
      }

      // Fetch data if not available in localStorage
      const response = await fetch(
        `/api/contacts?contactId=${encodeURIComponent(contactId)}`
      );
      const data = await response.json();
      console.log("Specific Contact:", data.error);

      if (data.error) {
        this.querySelector(".contact-count").textContent = "Error";
        return;
      }
      // Update the UI and save in localStorage
      const contactCount = data.length;

      window.allContacts = data;

      this.querySelector(".contact-count").textContent = contactCount;
      localStorage.setItem("totalContacts", contactCount);
    } catch (error) {
      console.error("Failed to fetch total contacts:", error);
    }
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="p-4 bg-white rounded-lg shadow">
        <h2 class="text-lg font-bold">Total Contacts</h2>
        <p class="mt-2 text-2xl font-semibold text-blue-600 contact-count">...</p>
      </div>
    `;
    this.fetchTotalContacts("all");
  }
}
class RunningAutomations extends HTMLElement {
  async fetchAutomations() {
    try {
      const response = await fetch("/api/automations");
      const data = await response.json();
      const list = this.querySelector(".automation-list");
      list.innerHTML = data.automations
        .map(
          (automation) => `
        <li class="py-2 border-b">${automation.name}</li>
      `
        )
        .join("");
    } catch (error) {
      console.error("Failed to fetch automations:", error);
    }
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="p-4 bg-white rounded-lg shadow">
        <h2 class="text-lg font-bold">Running Automations</h2>
        <ul class="mt-2 automation-list"></ul>
      </div>
    `;
    // this.fetchAutomations();
  }
}
class ApplicationSettings extends HTMLElement {
  updateThemeColor(color) {
    document.documentElement.style.setProperty("--theme-color", color);
    // Save the preference (e.g., API or localStorage)
    localStorage.setItem("themeColor", color);
  }

  connectedCallback() {
    const currentColor = localStorage.getItem("themeColor") || "#3b82f6";
    this.innerHTML = `
      <div class="p-4 bg-white rounded-lg shadow">
        <h2 class="text-lg font-bold">Application Settings</h2>
        <div class="mt-2">
          <label for="themeColor" class="block text-sm">Theme Color</label>
          <input 
            type="color" 
            id="themeColor" 
            value="${currentColor}"
            class="w-full mt-2 border p-2 rounded"
          >
        </div>
      </div>
    `;

    this.querySelector("#themeColor").addEventListener("input", (e) => {
      this.updateThemeColor(e.target.value);
    });
  }
}
class UserProfile extends HTMLElement {
  async fetchUserProfile() {
    try {
      const userId = localStorage.getItem("userId"); // Assuming userId is stored in localStorage
      const response = await fetch(`/api/user/${userId}`);
      const data = await response.json();

      this.querySelector(".user-name").textContent = data.name || "N/A";
      this.querySelector(".user-email").textContent = data.email || "N/A";
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="p-4 bg-white rounded-lg shadow">
        <h2 class="text-lg font-bold">User Profile</h2>
        <p class="mt-2"><strong>Name:</strong> <span class="user-name">...</span></p>
        <p class="mt-1"><strong>Email:</strong> <span class="user-email">...</span></p>
      </div>
    `;
    this.fetchUserProfile();
  }
}

// class MessageList extends HTMLElement {
//   connectedCallback() {
//     this.innerHTML = `
//       <div class="glass rounded-2xl p-6 shadow-lg bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400">
//         <h2 class="text-2xl font-bold text-white mb-4">Auto Messages</h2>
//         <div id="grid"></div>

//         <script type="text/x-template" id="enabledTemplate" >
//            <input id="enable-button" type="checkbox" />
//         </script>

//       </div>
//     `;

//     this.renderGrid();
//   }

//   renderGrid() {
//     const messages = JSON.parse(localStorage.getItem("autoMessages")) || [];

//     function renderCell(args) {
//       var inputElement = args.cell.querySelector("input#enable-button");

//       var switchObj = new ej.buttons.Switch({
//         cssClass: "e-togglebutton",
//         change: (args) => {
//           console.log(args);
//         },
//       });

//       switchObj.appendTo(inputElement);
//     }

//     const grid = new ej.grids.Grid({
//       dataSource: messages,
//       enableAdaptiveUI: false,
//       allowResizing: true,
//       queryCellInfo: renderCell,
//       toolbar: ["Add", "Edit", "Delete", "Update", "Cancel"],
//       editSettings: {
//         allowEditing: true,
//         allowAdding: true,
//         allowDeleting: true,
//         mode: "Dialog",
//       },
//       columns: [
//         {
//           field: "id",
//           headerText: "ID",
//           isPrimaryKey: true,
//           textAlign: "Left",
//           width: 100,
//           visible: false, // Hide ID in edit/create modes
//         },
//         {
//           field: "time",
//           headerText: "Time",
//           textAlign: "Left",
//           width: 150,
//           type: "datetime",
//           editType: "datetimepickeredit",
//           format: "dd/MM/yyyy hh:mm",
//         },
//         {
//           field: "phone",
//           headerText: "Phone Number",
//           textAlign: "Left",
//           width: 150,
//         },
//         {
//           field: "message",
//           headerText: "Message",
//           textAlign: "Left",
//           width: 300,
//         },
//         {
//           field: "enabled",
//           headerText: "Enabled",
//           textAlign: "Center",
//           width: 150,
//           template: "#enabledTemplate",
//         },
//       ],
//       actionComplete: (args) => {
//         if (args.requestType === "save" || args.requestType === "delete") {
//           const updatedMessages = grid.dataSource;
//           localStorage.setItem("autoMessages", JSON.stringify(updatedMessages));
//         }
//       },
//       dataBound: () => {
//         // Initialize the Syncfusion Toggle Button for each row
//         messages.forEach((data) => {
//           const toggleButton = new ej.buttons.Button({
//             isPrimary: true,
//             content: data.enabled ? "Enabled" : "Disabled",
//             cssClass: data.enabled ? "e-success" : "e-danger",
//             onClick: (event) => {
//               data.enabled = !data.enabled; // Toggle enabled state
//               localStorage.setItem("autoMessages", JSON.stringify(messages));
//               toggleButton.content = data.enabled ? "Enabled" : "Disabled";
//               toggleButton.cssClass = data.enabled ? "e-success" : "e-danger";
//             },
//           });
//           toggleButton.appendTo(`#toggleButton${data?.id}`);
//         });
//       },
//     });

//     grid.appendTo("#grid");
//   }
// }

customElements.define("dashboard-container", DashboardContainer);
customElements.define("total-contacts", TotalContacts);
customElements.define("running-automations", RunningAutomations);
customElements.define("application-settings", ApplicationSettings);
customElements.define("user-profile", UserProfile);
// customElements.define("message-list", MessageList);
