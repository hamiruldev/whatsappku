class DashboardContainer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="min-h-screen text-gray-900">
        <div class="p-3 black-white">
          <h1 class="text-2xl text-white font-bold">Welcome Hamirul</h1>
        </div>
        <div class="p-3 flex flex-col space-y-6">
          <health-status></health-status>
          <session-manager></session-manager>
          <scheduler-settings></scheduler-settings>
          <message-list></message-list>
          <total-contacts></total-contacts>
        </div>
      </div>`;
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

      if (data.error) {
        this.querySelector(".contact-count").textContent = "-";
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
      <div class="p-4 glass text-white rounded-lg shadow">
        <h2 class="text-lg font-bold">Total Contacts</h2>
        <p class="mt-2 text-2xl text-white font-semibold contact-count">...</p>
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
      <div class="p-4 glass text-white rounded-lg shadow">
        <h2 class="text-lg text-white font-bold">Running Automations</h2>
        <ul class="mt-2 text-white automation-list"></ul>
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

customElements.define("dashboard-container", DashboardContainer);
customElements.define("total-contacts", TotalContacts);
customElements.define("running-automations", RunningAutomations);
customElements.define("application-settings", ApplicationSettings);
customElements.define("user-profile", UserProfile);
