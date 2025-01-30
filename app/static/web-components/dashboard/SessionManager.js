class SessionManager extends HTMLElement {
  constructor() {
    super();
    this.sessions = [];
    this.grid = null;
    this.restartAttempts = {}; // Track restart attempts per session
  }

  async connectedCallback() {
    await this.loadSessions();
    this.render();
    this.setupGrid();
    this.startSessionMonitor(); // Start checking session status every 10 min
  }

  async loadSessions() {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      this.sessions = data.details;
    } catch (error) {
      console.error("Error loading sessions:", error);
      this.sessions = [];
    }
  }

  startSessionMonitor() {
    // Check session status every 10 minutes (600,000 milliseconds)
    setInterval(async () => {
      console.log("Checking session status...");
      await this.checkSessionStatus();
    }, 300000); // 5 minutes
  }

  async checkSessionStatus() {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();

      this.sessions = data.details;
      console.log(this.sessions);

      for (const session of this.sessions) {
        if (["FAILED", "STOPPED"].includes(session.status)) {
          // Initialize restart count if not set
          if (!this.restartAttempts[session.name]) {
            this.restartAttempts[session.name] = 0;
          }

          // Stop restarting if the session has already failed more than 5 times
          if (this.restartAttempts[session.name] >= 5) {
            console.warn(
              `Session ${session.name} reached max restart attempts. Skipping...`
            );
            continue;
          }

          console.log(
            `Restarting session: ${session.name} (Attempt ${
              this.restartAttempts[session.name] + 1
            })`
          );
          this.restartAttempts[session.name] += 1; // Increment restart count
          await this.restartSession(session.name);
        }
      }

      // Refresh UI
      this.grid.dataSource = this.sessions;
      this.grid.refresh();
    } catch (error) {
      console.error("Error checking session status:", error);
    }
  }

  async restartSession(sessionName) {
    try {
      const response = await fetch("/api/session/restart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: sessionName }),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification(
          `Session ${sessionName} restarted successfully`,
          "success"
        );
        await this.refreshSessions();
        this.restartAttempts[sessionName] = 0; // Reset counter on successful restart
      } else {
        showNotification(
          `Failed to restart session ${sessionName}: ${
            result.error || "Unknown error"
          }`,
          "error"
        );
      }
    } catch (error) {
      showNotification(
        `Error restarting session ${sessionName}: ${error.message}`,
        "error"
      );
    }
  }

  async refreshSessions() {
    await this.loadSessions();
    this.grid.dataSource = this.sessions;
    this.grid.refresh();
  }

  async startSession(session) {
    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
      });

      if (response.ok) {
        showNotification("Session started successfully", "success");
        await this.refreshSessions();
      } else {
        showNotification("Failed to start session", "error");
      }
    } catch (error) {
      showNotification("Error starting session", "error");
    }
  }

  async stopSession(session) {
    try {
      const response = await fetch("/api/session/stop", {
        method: "POST",
      });

      if (response.ok) {
        showNotification("Session stopped successfully", "success");
        await this.refreshSessions();
      } else {
        showNotification("Failed to stop session", "error");
      }
    } catch (error) {
      showNotification("Error stopping session", "error");
    }
  }

  render() {
    this.innerHTML = `
            <div class="glass rounded-2xl p-6 shadow-lg">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-white">Sessions</h2>
                </div>
                <div id="sessionsGrid" class="mt-4"></div>
            </div>
        `;
  }

  setupGrid() {
    var statusEl, statusObj;
    const grid = new ej.grids.Grid({
      dataSource: this.sessions,
      allowPaging: true,
      allowResizing: true,
      pageSettings: { pageSize: 10 },
      toolbar: ["Search", "Add", "Edit", "Delete", "Update", "Cancel"],
      editSettings: {
        allowEditing: true,
        allowAdding: true,
        allowDeleting: true,
        mode: "Dialog",
      },

      width: "100%",
      columns: [
        {
          field: "name",
          headerText: "Name",
          width: 120,
          textAlign: "Left",
        },
        // {
        //   field: "metadata",
        //   headerText: "Metadata",
        //   width: 150,
        // },
        // {
        //   field: "me",
        //   headerText: "Me",
        //   width: 200,
        // },
        {
          field: "status",
          headerText: "Status",
          width: 150,
          edit: {
            create: function () {
              statusEl = document.createElement("input");
              return statusEl;
            },
            read: function () {
              return statusObj.value;
            },
            destroy: function () {
              statusObj.destroy();
            },
            write: function (args) {
              statusObj = new ej.dropdowns.DropDownList({
                dataSource: [
                  "WORKING",
                  "FAILED",
                  "STARTING",
                  "SCAN_QR_CODE",
                  "STOPPED",
                ],
                value: args.rowData.status,
                placeholder: "Select Status",
                floatLabelType: "Never",
              });
              statusObj.appendTo(statusEl);
            },
          },
        },
        {
          field: "server",
          headerText: "Server",
          width: 120,
        },
        {
          field: "actions",
          headerText: "Actions",
          width: 200,
        },
      ],

      queryCellInfo: (args) => {
        // if (args.column.field === "metadata") {
        //   return <span class="px-2 py-1 rounded-full text-white text-sm">${args.data.metadata}</span>;
        // }

        if (args.column.field === "status") {
          const statusClass =
            args.data.status === "STARTING" ? "bg-green-500" : "bg-red-500";
          return `<span class="px-2 py-1 rounded-full ${statusClass} text-white text-sm">
              ${args.data.status}
            </span>
          `;
        }

        if (args.column.field === "actions") {
          return `<div class="flex gap-2">
              <button class="settings-btn p-2 rounded-full bg-purple-500 hover:bg-purple-600">
                <svg
                  class="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  ></path>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
              </button>
              <button class="start-btn p-2 rounded-full bg-green-500 hover:bg-green-600">
                <svg
                  class="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  ></path>
                </svg>
              </button>
              <button class="restart-btn p-2 rounded-full bg-blue-500 hover:bg-blue-600">
                <svg
                  class="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
              </button>
              <button class="stop-btn p-2 rounded-full bg-red-500 hover:bg-red-600">
                <svg
                  class="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>`;
        }
      },
    });

    grid.appendTo(this.querySelector("#sessionsGrid"));
    this.grid = grid;

    // Add click handlers for action buttons
    this.querySelector("#sessionsGrid").addEventListener("click", async (e) => {
      const button = e.target.closest("button");
      if (!button) return;

      const row = this.grid.getRowObjectFromUID(
        button.closest("tr").getAttribute("data-uid")
      )?.data;

      if (!row) return;

      if (button.classList.contains("settings-btn")) {
        // Handle settings
        console.log("Settings clicked for:", row);
      } else if (button.classList.contains("start-btn")) {
        await this.startSession(row);
      } else if (button.classList.contains("restart-btn")) {
        await this.restartSession(row);
      } else if (button.classList.contains("stop-btn")) {
        await this.stopSession(row);
      }
    });
  }
}

customElements.define("session-manager", SessionManager);
