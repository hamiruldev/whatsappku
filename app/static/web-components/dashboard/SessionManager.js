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

    // Add event listener for dialog-click
    this.addEventListener("dialog-click", this.handleGridClick.bind(this));
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
        body: JSON.stringify({ name: sessionName }),
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
        body: JSON.stringify({ name: sessionName, start: true }),
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
          method: "GET",
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
        body: JSON.stringify({ name: session.name }),
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
        body: JSON.stringify({ name: sessionName }),
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
            .session-manage-dialog {
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .schedules-container .glass{
              box-shadow: none;
            }

            .qr-container, .screenshot-container, .test-message-container, .schedules-container {
                padding: 20px 0px;
                height: 100%;
                overflow: auto;
            }
            .qr-image, .screenshot-image {
                max-width: 100%;
                margin-bottom: 20px;
            }
            .input-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            #testMessage {
                min-height: 100px;
            }
            .manage-btn {
                padding: 5px 10px;
                cursor: pointer;
            }
        </style>
            <div class="glass rounded-2xl p-6 shadow-lg">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-white">Sessions</h2>
                <button id="newButtonSession" class="e-tbar-btn e-tbtn-txt e-control e-btn e-lib" type="button">
                    <span class="e-btn-icon e-plus e-icons e-icon-left"></span>
                    <span class="e-tbar-btn-text">New</span>
                </button>
                </div>
                <div id="sessionsGrid" class="mt-4"></div>
            </div>
        <div id="managementDialog"></div>
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
      allowSorting: true,
      pageSettings: { pageSize: 10 },
      height: "100%",
      enableAdaptiveUI: isMobile() ? true : false,
      rowRenderingMode: isMobile() ? "Vertical" : "Horizontal",
      toolbar: ["Search", "Add", "Edit", "Delete", "Update", "Cancel"],
      editSettings: {
        allowAdding: true,
        allowEditing: false,
        allowDeleting: true,
        mode: "Dialog",
      },
      width: "100%",
      columns: this.getGridColumns(),
      actionBegin: this.handleActionBegin.bind(this),
      actionComplete: this.handleActionComplete.bind(this),
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
          allowEditing: false,
        allowSorting: true,
        },
        {
          field: "me.id",
          headerText: "Phone (ex: 60184644305)",
        width: 170,
          allowEditing: true,
        allowSorting: true,
        },
        {
          field: "status",
          headerText: "Status",
        width: 150,
          allowEditing: false,
        visible: true,
        allowSorting: true,
        allowFiltering: true,
        },
        {
          field: "server",
          headerText: "Server",
          width: 120,
          allowEditing: false,
        visible: false,
        },
        {
          field: "actions",
          headerText: "Actions",
        width: 120,
        template:
          "<dialog-button session-name='${name}' session-status='${status}'></dialog-button>",
      },
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
    const columns = ["name", "status", "actions"];
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
    // Handle dialog-click event from DialogButton component
    if (event.type === "dialog-click") {
      await this.showManageDialog(event.detail.sessionName);
      return;
    }

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
        newStatus == "SCAN_QR_CODE" &&
        !document.querySelector("#sessionsGrid_dialogEdit_wrapper") &&
        !document.querySelector("#managementDialog")
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

  async showManageDialog(sessionName) {
    const dialogHtml = `
      <div class="session-manage-dialog">
        <div class="e-tab-header">
          <div class="e-tab-text">Screenshot</div>
          <div class="e-tab-text">Schedules</div>
          <div class="e-tab-text">Test Message</div>
        </div>
        <div class="e-content">
          <div class="e-item">
            <div class="qr-container">
              <qr-code-image sessionName="${sessionName}"></qr-code-image>
            </div>
          </div>

          <div class="e-item">
            <div class="schedules-container">
              <message-list sessionName="${sessionName}"></message-list>
            </div>
          </div>

          <div class="e-item">
            <div class="test-message-container">
              <div class="input-group">
                <input type="text" id="testPhone" class="e-input" placeholder="Phone Number" />
                <textarea id="testMessage" class="e-input" placeholder="Test Message"></textarea>
                <button class="e-btn e-primary send-test">Send Test Message</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    // Create dialog
    const dialog = new ej.popups.Dialog({
      header: `Manage Session: ${sessionName}`,
      content: dialogHtml,
      showCloseIcon: true,
      isModal: true,
      width: isMobile() ? "100%" : "90%",
      height: isMobile() ? "100%" : "90%",
      visible: false,
      close: () => {
        dialog.destroy();
      },
    });

    // Create tab
    const tab = new ej.navigations.Tab({
      items: [
        { header: { text: "Screenshot" }, content: ".qr-container" },
        { header: { text: "Schedules" }, content: ".schedules-container" },
        {
          header: { text: "Test Message" },
          content: ".test-message-container",
        },
      ],
      selected: (args) => this.handleTabChange(args, sessionName),
    });

    dialog.appendTo("#managementDialog");

    if (isMobile()) {
      dialog.show();
    } else {
      dialog.show(1);
    }

    // Initialize tab after dialog is shown
    tab.appendTo(".session-manage-dialog");

    // Add event listeners
    dialog && this.setupManageDialogEvents(dialog, sessionName);
  }

  handleTabChange(args, sessionName) {
    const selectedTab = args.selectedIndex;
    switch (selectedTab) {
      case 0:
        // this.loadScreenshot(sessionName);
        break;
      case 1:
        this.handleGrid(sessionName);
        break;
      // case 2:
      //   this.handleGrid(sessionName);
      //   break;
    }
  }

  async loadQRCode(sessionName) {
    debugger;
    try {
      const response = await fetch(`/api/session/auth/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sessionName }),
      });
      const data = await response.json();
      if (data.qrCode) {
        document.getElementById(
          "qrImage"
        ).src = `data:image/png;base64,${data.qrCode}`;
      }
    } catch (error) {
      console.error("Error loading QR code:", error);
    }
  }

  async loadScreenshot(sessionName) {
    try {
      const response = await fetch(`/api/session/screenshot/${sessionName}`);
      const data = await response.json();
      if (data.screenshot) {
        document.getElementById(
          "screenshotImage"
        ).src = `data:image/png;base64,${data.screenshot}`;
      }
    } catch (error) {
      console.error("Error loading screenshot:", error);
    }
  }

  setupManageDialogEvents(dialog, sessionName) {
    // QR Code refresh
    // document.querySelector(".refresh-qr").addEventListener("click", () => {
    //   this.loadQRCode(sessionName);
    // });

    // Screenshot refresh
    // document
    //   .querySelector(".refresh-screenshot")
    //   .addEventListener("click", () => {
    //     this.loadScreenshot(sessionName);
    //   });

    // Send test message
    document.querySelector(".send-test").addEventListener("click", async () => {
      const phone = dialog.element.querySelector("#testPhone").value;
      const message = dialog.element.querySelector("#testMessage").value;
      await this.sendTestMessage(sessionName, phone, message);
    });
  }

  async sendTestMessage(sessionName, phone, message) {
    try {
      const response = await fetch("/api/message/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: sessionName,
          phone,
          message,
        }),
      });
      const result = await response.json();
      console.log("result", result);
      debugger;

      if (result.success) {
        debugger;
        showNotification("Test message sent successfully", "success");
      } else {
        showNotification("Failed to send test message", "error");
      }
    } catch (error) {
      showNotification("Error sending test message", "error");
    }
  }

  handleGrid(sessionName) {
    const sessionDetails = this.sessions.find((s) => s.name === sessionName);

    if (sessionDetails.status != "WORKING") {
      document.querySelector(
        "#grid"
      ).ej2_instances[0].editSettings.allowEditing = false;

      document.querySelector(
        "#grid"
      ).ej2_instances[0].editSettings.allowAdding = false;
    }
  }

  async loadSchedules(sessionName, grid) {
    try {
      const response = await fetch(
        `/api/scheduled-messages/session/${sessionName}`
      );
      const result = await response.json();
      if (result.status === "success") {
        grid.dataSource = result.data;
        grid.refresh();
      }
    } catch (error) {
      console.error("Error loading schedules:", error);
    }
  }
}

customElements.define("session-manager", SessionManager);

class DialogButton extends HTMLElement {
  constructor() {
    super();
    this.sessionName = this.getAttribute("session-name");
    this.sessionStatus = this.getAttribute("session-status");
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    // <p class="text-sm text-gray-500">${this.sessionStatus}</p>
    this.innerHTML = `
    <div class="flex flex-row items-center justify-between">
      <button class="manage-btn e-control e-btn e-lib e-primary" data-session="${this.sessionName}">
        <span>Manage</span>
      </button>
    </div>
    `;
  }

  setupEventListeners() {
    this.querySelector("button").addEventListener("click", () => {
      // Dispatch custom event that SessionManager will listen for
      this.dispatchEvent(
        new CustomEvent("dialog-click", {
          bubbles: true,
          detail: { sessionName: this.sessionName },
        })
      );
    });
  }

  static get observedAttributes() {
    return ["session-name"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "session-name") {
      this.sessionName = newValue;
      if (this.isConnected) {
        this.render();
      }
    }
  }
}

customElements.define("dialog-button", DialogButton);
