class SchedulerSettings extends HTMLElement {
  constructor() {
    super();
    this.enabled = false;
    this.hour = 0;
    this.minute = 0;
    this.phone = "";
    this.message = "";
  }

  async connectedCallback() {
    await this.fetchSchedulerStatus();
    this.render();
    this.setupEventListeners(); // Attach listeners after rendering
  }

  async fetchSchedulerStatus() {
    try {
      const response = await fetch("/api/scheduler/morning-message");
      const data = await response.json();
      this.enabled = data.enabled;
      this.hour = data.hour;
      this.minute = data.minute;
      this.phone = data.phone || "";
      this.message = data.message || "";
    } catch (error) {
      console.error("Error fetching scheduler status:", error);
    }
  }

  async toggleScheduler() {
    try {
      const timeInput = this.querySelector("#scheduleTime");
      const phoneInput = this.querySelector("#phoneInput");
      const messageInput = this.querySelector("#messageInput");
      const [hours, minutes] = timeInput.value.split(":");

      const response = await fetch("/api/scheduler/morning-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !this.enabled,
          hour: parseInt(hours),
          minute: parseInt(minutes),
          phone: phoneInput.value,
          message: messageInput.value,
        }),
      });
      const data = await response.json();
      this.enabled = data.enabled;
      this.hour = data.hour;
      this.minute = data.minute;
      this.phone = data.phone;
      this.message = data.message;
      this.render();
      this.setupEventListeners(); // Reattach event listeners
      this.showNotification(
        `Daily morning message ${
          this.enabled ? "enabled" : "disabled"
        } at ${this.formatTime(this.hour, this.minute)} for ${this.phone}`,
        "success"
      );
    } catch (error) {
      console.error("Error toggling scheduler:", error);
      this.showNotification("Error updating scheduler settings", "error");
    }
  }

  formatTime(hour, minute) {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  }

  setupEventListeners() {
    const toggle = this.querySelector("#schedulerToggle");
    const timeInput = this.querySelector("#scheduleTime");
    const phoneInput = this.querySelector("#phoneInput");
    const messageInput = this.querySelector("#messageInput");

    if (toggle) {
      // Remove old listeners
      toggle.removeEventListener("click", this.toggleScheduler);
      // Add new listener
      toggle.onclick = () => this.toggleScheduler();
    }

    if (timeInput) {
      timeInput.onchange = () => {
        if (this.enabled) {
          this.toggleScheduler();
        }
      };
    }

    if (phoneInput) {
      phoneInput.onchange = () => {
        if (this.enabled) {
          this.toggleScheduler();
        }
      };
    }

    if (messageInput) {
      messageInput.onchange = () => {
        if (this.enabled) {
          this.toggleScheduler();
        }
      };
    }
  }
  
  render() {
    this.innerHTML = `
        <div class="glass rounded-2xl p-6 shadow-lg bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">Scheduler Settings</h2>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="schedulerToggle" 
                class="sr-only peer" 
                ${this.enabled ? "checked" : ""}
              >
              <div class="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div class="space-y-4">
            <div class="flex flex-col space-y-4">
              <div>
                <h3 class="text-lg font-semibold text-white">Daily Morning Message</h3>
                <p class="text-sm text-white/60">Send a morning message every day</p>
                <div class="mt-2">
                  <input 
                    type="time" 
                    id="scheduleTime" 
                    value="${
                      this.enabled
                        ? this.formatTime(this.hour, this.minute)
                        : new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                    }"
                    class="bg-white/10 text-white border border-white/20 rounded px-3 py-2 w-full"
                    />

                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Phone Number</h3>
                <p class="text-sm text-white/60">Provide a phone number for the message</p>
                <div class="mt-2">
                  <input 
                    type="tel" 
                    id="phoneInput" 
                    value="${this.phone}" 
                    placeholder="e.g., +1234567890"
                    class="bg-white/10 text-white border border-white/20 rounded px-3 py-2 w-full"
                  >
                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Message</h3>
                <p class="text-sm text-white/60">Enter the message to be sent</p>
                <div class="mt-2">
                  <textarea 
                    id="messageInput" 
                    placeholder="Your message here..."
                    class="bg-white/10 text-white border border-white/20 rounded px-3 py-2 w-full h-20"
                  >${this.message}</textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
  }
}

// customElements.define("scheduler-settings", SchedulerSettings);
