class DashboardContainer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="min-h-screen bg-gray-100 text-gray-900">
        <div class="p-6 bg-blue-600 text-white">
          <h1 class="text-2xl font-bold">Business Owner Dashboard</h1>
        </div>
        <div class="p-6 space-y-6">
          <total-contacts></total-contacts>
          <running-automations></running-automations>
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
      const response = await fetch(
        `/api/contacts?contactId=${encodeURIComponent(contactId)}`
      );
      const data = await response.json();
      console.log("Specific Contact:", data);
      this.querySelector(".contact-count").textContent = data.length || 0;
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
    this.fetchTotalContacts('all');
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
    this.fetchAutomations();
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
