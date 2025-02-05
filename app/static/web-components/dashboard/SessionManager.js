class SessionManager extends HTMLElement {
  constructor() {
    super();
    this.newPhoneRegister = null;
    this.newSessionRegister = null;
    this.sessions = [];
    this.grid = null;
    this.restartAttempts = {};
    this.nextSessionNumber = 1;
    this.ws = null;
  }

  async connectedCallback() {
    await this.loadSessions();
    this.calculateNextSessionNumber();
    this.render();
    this.setupGrid();
    this.setupWebSocket();
  }

  async loadSessions() {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      this.sessions = replaceCusInMeId(data).details;
    } catch (error) {
      console.error("Error loading sessions:", error);
      this.sessions = [];
    }
  }

  calculateNextSessionNumber() {
    const sessionNumbers = this.sessions.map((session) => {
      const match = session.name.match(/session_(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    this.nextSessionNumber = Math.max(...sessionNumbers, 0) + 1;
  }

  generateNextSessionName() {
    return `session_${this.nextSessionNumber++}`;
  }

  async deleteSession(sessionName) {
    try {
      const response = await fetch("/api/session/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sessionName })
      });

      const result = await response.json();
      if (response.ok) {
        showNotification(
          `Session ${sessionName} deleted successfully`,
          "success"
        );
        await this.refreshSessions();
      } else {
        throw new Error(result.error || "Failed to delete session");
      }
    } catch (error) {
      showNotification(`Error deleting session: ${error.message}`, "error");
    }
  }

  async createSession() {
    const sessionName = this.generateNextSessionName();
    try {
      const response = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sessionName, start: true })
      });

      const result = await response.json();
      if (response.ok) {
        showNotification("Session created successfully", "success");
        await this.refreshSessions();
        return result;
      } else {
        throw new Error(result.error || "Failed to create session");
      }
    } catch (error) {
      showNotification(`Error creating session: ${error.message}`, "error");
    }
  }

  async getQrCodeSession(sessionName) {
    try {
      // checksessionexist first
      return await this.checkSession(sessionName).then(async (res) => {
        const response = await fetch(`/api/session/screenshot/${sessionName}`, {
          method: "GET"
        });

        const result = await response.json();

        if (response.ok) {
          showNotification("QR Code generate successfully", "success");
          return result;
        } else {
          throw new Error(result.error || "Failed to get QR code");
        }
      });
    } catch (error) {
      showNotification(`Error get QR code: ${error.message}`, "error");
    }
  }

  async checkSession(sessionName) {
    try {
      const response = await fetch(`/api/session/${sessionName}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error checking session status:", error);
    }
  }

  async checkSessionsStatus() {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      this.sessions = data.details;

      await this.handleFailedSessions();
      this.grid.dataSource = this.sessions;
      this.grid.refresh();
    } catch (error) {
      console.error("Error checking session status:", error);
    }
  }

  async handleFailedSessions() {
    for (const session of this.sessions) {
      if (["FAILED", "STOPPED"].includes(session.status)) {
        if (!this.restartAttempts[session.name]) {
          this.restartAttempts[session.name] = 0;
        }

        if (this.restartAttempts[session.name] >= 5) {
          console.warn(`Session ${session.name} reached max restart attempts.`);
          continue;
        }

        await this.restartSession(session);
      }
    }
  }

  async restartSession(session) {
    try {
      const response = await fetch("/api/session/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: session.name })
      });

      const result = await response.json();
      if (response.ok) {
        showNotification(
          `Session ${session.name} restarted successfully`,
          "success"
        );
        await this.refreshSessions();
        this.restartAttempts[session.name] = 0;
      } else {
        showNotification(
          `Failed to restart session ${session.name}: ${result.error}`,
          "error"
        );
      }
    } catch (error) {
      showNotification(
        `Error restarting session ${session.name}: ${error.message}`,
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
    await this.toggleSession("/api/session/start", sessionName, "start");
  }

  async stopSession(sessionName) {
    await this.toggleSession("/api/session/stop", sessionName, "stop");
  }

  async toggleSession(url, sessionName, action) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sessionName })
      });

      const message = response.ok
        ? `Session ${sessionName} ${action}ed successfully`
        : `Failed to ${action} session ${sessionName}`;

      showNotification(message, response.ok ? "success" : "error");
      await this.refreshSessions();
    } catch (error) {
      showNotification(
        `Error ${action}ing session ${sessionName}: ${error.message}`,
        "error"
      );
    }
  }

  opennewDialog() {
    this.grid.addRecord();
  }

  render() {
    this.innerHTML = `

    <style>
    
    qr-code-image{
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
    
    </style>

    
      <div class="glass rounded-2xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-white">Sessions</h2>
          
          <button id="newButtonSession" class="e-tbar-btn e-tbtn-txt e-control e-btn e-lib" type="button" style="width: auto;">
            <span class="e-btn-icon e-plus e-icons e-icon-left"></span>
            <span class="e-tbar-btn-text">New</span>
          </button>

        </div>
        <div id="sessionsGrid" class="mt-4"></div>
      </div>
    `;
  }

  setupGrid() {
    ej.grids.Grid.Inject(
      ej.grids.Page,
      ej.grids.Filter,
      ej.grids.Sort,
      ej.grids.Edit,
      ej.grids.Aggregate,
      ej.grids.Toolbar
    );

    const grid = new ej.grids.Grid({
      dataSource: this.sessions,
      allowPaging: true,
      allowResizing: true,
      pageSettings: { pageSize: 10 },
      height: "100%",
      enableAdaptiveUI: isMobile() ? true : false,
      rowRenderingMode: isMobile() ? "Vertical" : "Horizontal",
      toolbar: ["Search", "Add", "Edit", "Delete", "Update", "Cancel"],
      editSettings: {
        allowAdding: true,
        allowEditing: false,
        allowDeleting: true,
        mode: "Dialog"
      },
      width: "100%",
      columns: this.getGridColumns(),
      actionBegin: this.handleActionBegin.bind(this),
      actionComplete: this.handleActionComplete.bind(this)
    });

    grid.appendTo(this.querySelector("#sessionsGrid"));
    this.grid = grid;

    this.querySelector("#sessionsGrid").addEventListener(
      "click",
      this.handleGridClick.bind(this)
    );

    this.querySelector("#newButtonSession").addEventListener(
      "click",
      this.opennewDialog.bind(this)
    );
  }

  getGridColumns() {
    return [
      {
        field: "name",
        headerText: "Name",
        width: 120,
        textAlign: "Left",
        allowEditing: false
      },
      {
        field: "me.id",
        headerText: "Phone (ex: 60184644305)",
        width: 200,
        allowEditing: true
      },
      {
        field: "status",
        headerText: "Status",
        width: 150,
        allowEditing: false
      },
      {
        field: "server",
        headerText: "Server",
        width: 120,
        allowEditing: false,
        visible: false
      },
      {
        field: "actions",
        headerText: "Actions",
        width: 200,
        allowEditing: false,
        visible: false
      }
    ];
  }

  async handleActionBegin(args) {
    if (args.requestType === "add" || args.requestType === "beginEdit") {
      this.toggleGridColumnVisibility(false);
    }

    if (args.requestType === "delete") {
      await this.deleteSession(args.data[0].name);
    }

    if (args.requestType === "save" && args.action === "add") {
      await this.createSession().then((res) => {
        this.newPhoneRegister = args.data.me.id;
        this.newSessionRegister = res.name;
      });
    }
  }

  toggleGridColumnVisibility(visible) {
    const columns = ["name", "status", "server", "actions"];
    columns.forEach((column) => {
      this.grid.getColumnByField(column).visible = visible;
    });
  }

  handleActionComplete(args) {
    if (["cancel", "save"].includes(args.requestType)) {
      this.toggleGridColumnVisibility(true);
      this.grid.refresh();
    }

    if (args.requestType === "add") {
      // args.dialog.header = "Add Session";
      args.dialog.allowDragging = false;
    }

    if (args.requestType === "beginEdit") {
      // args.dialog.header = "Edit Session";
      args.dialog.allowDragging = false;
    }
  }

  async handleGridClick(event) {
    const button = event.target.closest("button");
    if (!button) return;

    const row = this.grid.getRowObjectFromUID(
      button.closest("tr")?.getAttribute("data-uid")
    )?.data;

    if (!row) return;

    if (button.classList.contains("start-btn")) {
      await this.startSession(row.name);
    } else if (button.classList.contains("restart-btn")) {
      await this.restartSession(row);
    } else if (button.classList.contains("stop-btn")) {
      await this.stopSession(row.name);
    }
  }

  setupWebSocket() {
    const wsUrl =
      "wss://wahamac.tripleonestudio.com/ws?session=*&events=session.status";
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => console.log("WebSocket connection established");
    this.ws.onmessage = this.handleWebSocketMessage.bind(this);
    this.ws.onerror = (error) => console.error("WebSocket error:", error);
    this.ws.onclose = () => {
      console.log("WebSocket connection closed. Reconnecting...");
      setTimeout(() => this.setupWebSocket(), 5000);
    };
  }

  handleWebSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);
      if (data.event === "session.status") {
        this.updateSessionStatus(data.session, data.payload.status);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }

  async openDialogToShowQrCode() {
    const SharedDialog = document.querySelector("#SharedDialog");

    // Ensure the dialog instance is available
    const dialogInstance = SharedDialog?.ej2_instances?.[0];
    if (!dialogInstance) return;

    // Update dialog header and content
    this.setDialogHeader(dialogInstance, "SCAN QR CODE TO LOGIN");
    await this.setDialogContent(dialogInstance);

    // Show the dialog
    dialogInstance.show(1);
  }

  setDialogHeader(dialogInstance, headerText) {
    dialogInstance.header = headerText;
  }

  async setDialogContent(dialogInstance) {
    // Use a template string to define the HTML content
    const contentHTML = `
      <div class="e-dlg-content" id="SharedDialog_dialog-content">
        <p>Scan using register phone number: ${this.newPhoneRegister}</p>
        <br>
        <qr-code-image sessionName="${this.newSessionRegister}"></qr-code-image>
      </div>
    `;

    // Set the content using innerHTML
    dialogInstance.contentEle.innerHTML = contentHTML;

    // // Get the QR code image element
    // const imgElement = document.getElementById("qrcode");

    // // Generate and set the QR code image
    // await this.generateQrCodeImage(imgElement);
  }

  async generateQrCodeImage(imgElement) {
    try {
      return await this.getQrCodeSession(this.newSessionRegister).then(
        (res) => {
          if (!res.data) return;

          // Create image source URL and set it
          const imgSrc = `data:undefined;base64, ${res.data}`;
          imgElement.src = imgSrc;

          // Clear session data after processing
          this.newPhoneRegister = null;
          this.newSessionRegister = null;
        }
      );
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }

  async updateSessionStatus(sessionName, newStatus) {
    const session = this.sessions.find((s) => s.name === sessionName);
    if (session) {
      session.status = newStatus;
      if (!this.grid.isEdit) {
        this.grid.refresh();
      }
      if (
        this.newSessionRegister == sessionName &&
        newStatus == "SCAN_QR_CODE"
      ) {
        this.openDialogToShowQrCode();
      }
    } else {
      console.warn(`Session '${sessionName}' not found for status update`);
    }
  }

  disconnectedCallback() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

customElements.define("session-manager", SessionManager);
