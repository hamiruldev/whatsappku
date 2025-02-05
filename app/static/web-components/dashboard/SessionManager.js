class SessionManager extends HTMLElement {
  constructor() {
    super();
    this.sessions = [];
    this.grid = null;
    this.restartAttempts = {}; // Track restart attempts per session
    this.nextSessionNumber = 1; // Track the next session number
  }

  async connectedCallback() {
    await this.loadSessions();
    this.calculateNextSessionNumber(); // Calculate the next session number based on existing sessions
    this.render();
    this.setupGrid();
    this.startSessionMonitor(); // Start checking session status every 10 min
  }

  async loadSessions() {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();

      const refactoredData = replaceCusInMeId(data);
      this.sessions = refactoredData.details;
    } catch (error) {
      console.error("Error loading sessions:", error);
      this.sessions = [];
    }
  }

  calculateNextSessionNumber() {
    // Calculate the next session number based on existing sessions
    const sessionNumbers = this.sessions.map((session) => {
      const match = session.name.match(/session_(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    this.nextSessionNumber = Math.max(...sessionNumbers, 0) + 1;
  }

  generateNextSessionName() {
    const sessionName = `session_${this.nextSessionNumber}`;
    this.nextSessionNumber += 1; // Increment for the next session
    return sessionName;
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

  async startSession(sessionName) {
    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: sessionName }),
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

  async stopSession(sessionName) {
    try {
      const response = await fetch("/api/session/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: sessionName }),
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

        <script type="text/x-template" id="phoneTemplate" >
          <div id="dropElement" ></div>
        </script>

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
    var grid = new ej.grids.Grid({
      dataSource: this.sessions,
      allowPaging: true,
      allowResizing: true,
      pageSettings: { pageSize: 10 },
      toolbar: ["Search", "Add", "Edit", "Delete", "Update", "Cancel"],
      editSettings: {
        allowAdding: true,
        allowEditing: false,
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
          editType: "stringedit",
          validationRules: { required: true },
          allowEditing: false,
          allowAdding: false,
        },
        {
          field: "me.id",
          headerText: "Phone (ex: 60184644305)",
          width: 200,
          textAlign: "Left",
          validationRules: { required: true },
          allowEditing: true,
          allowAdding: true,
          cssClass: "outline",
        },
        {
          field: "status",
          headerText: "Status",
          allowEditing: false,
          allowAdding: false,
          width: 150,
        },
        {
          field: "server",
          headerText: "Server",
          width: 120,
          allowFiltering: false,
          allowAdding: false,
          allowEditing: false,
        },
        {
          field: "actions",
          headerText: "Actions",
          width: 200,
          allowAdding: false,
          allowEditing: false,
        },
      ],

      actionBegin: async (args) => {
        if (args.requestType === "add" || args.requestType === "beginEdit") {
          grid.getColumnByField("name").visible = false;
          grid.getColumnByField("status").visible = false;
          grid.getColumnByField("server").visible = false;
          grid.getColumnByField("actions").visible = false;
        }

        if (args.requestType === "delete") {
          fetch(`/api/session/delete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: args.data[0].name }),
          })
            .then(async (response) => {
              if (response.ok) {
                showNotification(
                  `Session ${args.data[0].name} deleted successfully`,
                  "success"
                );
                return this.refreshSessions(); // Return the next promise
              } else {
                const result_2 = await response.json();
                throw new Error(result_2.error || "Failed to delete session");
              }
            })
            .then(() => {
              console.log("Sessions refreshed successfully");
            })
            .catch((error) => {
              showNotification(
                `Error deleting session: ${error.message || "Unknown error"}`,
                "error"
              );
              args.cancel = true;
            });
        }

        if (args.requestType === "save" && args.action === "add") {
          const sessionName = this.generateNextSessionName();

          const newSession = {
            name: sessionName,
            start: true,
          };

          fetch("/api/session/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newSession),
          })
            .then(async (response) => {
              const result_1 = await response.json();
              if (response.ok) {
                return { success: true, sessionName };
              } else {
                throw new Error(result_1.error || "Failed to create session");
              }
            })
            .then(({ success, sessionName }) => {
              if (success) {
                showNotification("Session created successfully", "success");
                this.refreshSessions();
              }
            })
            .catch((error) => {
              showNotification(
                `Error creating session: ${error.message || "Unknown error"}`,
                "error"
              );
              args.cancel = true;
            });
        }
      },
      actionComplete: (args) => {
        if (args.requestType === "add") {
          args.dialog.header = "Add Session";
          args.dialog.allowDragging = false;
        }

        if (args.requestType === "beginEdit") {
          args.dialog.header = "Edit Session";
          args.dialog.allowDragging = false;
        }

        if (args.requestType === "cancel" || args.requestType === "save") {
          grid.getColumnByField("name").visible = true;
          grid.getColumnByField("status").visible = true;
          grid.getColumnByField("server").visible = true;
          grid.getColumnByField("actions").visible = true;
          grid.refresh();
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
        await this.startSession(row.name);
      } else if (button.classList.contains("restart-btn")) {
        await this.restartSession(row.name);
      } else if (button.classList.contains("stop-btn")) {
        await this.stopSession(row.name);
      }
    });
  }
}

customElements.define("session-manager", SessionManager);
