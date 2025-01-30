class SessionStatus extends HTMLElement {
  constructor() {
    super();
    this.session = {
      valid: false,
      lastCheck: null,
      details: null,
    };
  }

  async connectedCallback() {
    await this.checkSession();
    this.render();
    this.startSessionCheck();
  }

  disconnectedCallback() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async checkSession() {
    try {
      const response = await fetch("/api/session");
      const data = await response.json();
      this.session = {
        valid: data.valid,
        lastCheck: new Date(data.timestamp),
        details: data.details,
      };
      this.render();
    } catch (error) {
      console.error("Error checking session:", error);
      this.session.valid = false;
      this.render();
    }
  }

  startSessionCheck() {
    // Check every 5 minutes
    this.interval = setInterval(() => this.checkSession(), 5 * 60 * 1000);
  }

  render() {
    const statusClass = this.session.valid ? "bg-green-500" : "bg-red-500";
    const statusText = this.session.valid ? "Valid" : "Invalid";

    this.innerHTML = `
            <div class="glass rounded-2xl p-6 shadow-lg">
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold text-white">Session Status</h2>
                    <span class="px-3 py-1 rounded-full ${statusClass} text-white text-sm">
                        ${statusText}
                    </span>
                </div>
                ${
                  this.session.lastCheck
                    ? `
                    <p class="text-sm text-white/60 mt-2">
                        Last checked: ${this.session.lastCheck.toLocaleString()}
                    </p>
                `
                    : ""
                }
                ${
                  this.session.details?.error
                    ? `
                    <p class="text-sm text-red-400 mt-2">
                        Error: ${this.session.details.error}
                    </p>
                `
                    : ""
                }
            </div>
        `;
  }
}

customElements.define("session-status", SessionStatus);
