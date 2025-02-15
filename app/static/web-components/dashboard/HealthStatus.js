class HealthStatus extends HTMLElement {
  constructor() {
    super();
    this.health = {
      healthy: false,
      lastCheck: null,
      details: null
    };
  }

  async connectedCallback() {
    await this.checkHealth();
    this.render();
    this.startHealthCheck();
  }

  disconnectedCallback() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async checkHealth() {
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      this.health = {
        healthy: data.healthy,
        lastCheck: new Date(data.timestamp),
        details: data.details
      };
      this.render();
    } catch (error) {
      console.log(error);
      console.error("Error checking health:", error);
      this.health.healthy = false;
      this.render();
    }
  }

  startHealthCheck() {
    // Check every 5 minutes
    this.interval = setInterval(() => this.checkHealth(), 5 * 60 * 1000);
  }

  render() {
    const statusClass = this.health.healthy ? "bg-green-500" : "bg-red-500";
    const statusText = this.health.healthy ? "Healthy" : "Unhealthy";

    this.innerHTML = `
            <div class="glass rounded-2xl p-6 shadow-lg">
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold text-white">WHATSAPP API Status</h2>
                    <span class="px-3 py-1 rounded-full ${statusClass} text-white text-sm">
                        ${statusText}
                    </span>
                </div>
                ${
                  this.health.lastCheck
                    ? `
                    <p class="text-sm text-white/60 mt-2">
                        Last checked: ${this.health.lastCheck.toLocaleString()}
                    </p>
                `
                    : ""
                }
                ${
                  this.health.details && !this.health.details.error
                    ? `
                    <p class="text-sm text-red-400 mt-2">
                        Error: ${this.health.details.error}
                    </p>
                `
                    : ""
                }
            </div>
        `;
  }
}

customElements.define("health-status", HealthStatus);
