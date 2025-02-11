class ScheduleManager extends HTMLElement {
  constructor() {
    super();
    this.scheduleObj = null;
    this.sessionName = this.getAttribute("sessionName");
  }

  static get observedAttributes() {
    return ["sessionName"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "sessionName" && oldValue !== newValue) {
      this.sessionName = newValue;
      if (this.isConnected) {
        this.loadSchedules();
      }
    }
  }

  async connectedCallback() {
    await this.loadSchedules();
    this.render();
    this.setupSchedule();
  }

  async loadSchedules() {
    try {
      const url = this.sessionName
        ? `/api/scheduled-messages/session/${this.sessionName}`
        : "/api/scheduled-messages";

      const response = await fetch(url);
      const data = await response.json();

      // Convert the data to schedule format
      this.events = this.convertToScheduleEvents(
        this.sessionName ? data.data : data
      );
    } catch (error) {
      console.error("Error loading schedules:", error);
      this.events = [];
    }
  }

  convertToScheduleEvents(messages) {
    return messages.map((msg) => ({
      Id: msg.id,
      Subject: `Message to ${msg.phone}`,
      StartTime: new Date(msg.time),
      EndTime: new Date(new Date(msg.time).getTime() + 30 * 60000), // 30 min duration
      IsAllDay: false,
      Status: msg.enabled ? "Active" : "Inactive",
      Priority: "High",
      Description: msg.message,
      RecurrenceRule: msg.recurrence || "",
      // Custom fields
      phone: msg.phone,
      target: msg.target || "chat",
      type: msg.type || "text",
      messageText: msg.message
    }));
  }

  render() {
    const title = this.sessionName
      ? `Schedule for ${this.sessionName}`
      : "All Schedules";

    this.innerHTML = `
            <div class="glass rounded-2xl p-6 shadow-lg">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-white">${title}</h2>
                </div>
                <div id="schedule"></div>
            </div>

            <div id="messageDialog"></div>
        `;
  }

  setupSchedule() {
    const self = this;

    // Initialize schedule
    this.scheduleObj = new ej.schedule.Schedule({
      width: "100%",
      height: isMobile() ? "100%" : "70dvh",
      selectedDate: new Date(),
      eventSettings: {
        dataSource: this.events,
        fields: {
          id: "Id",
          subject: { name: "Subject" },
          startTime: { name: "StartTime" },
          endTime: { name: "EndTime" },
          description: { name: "Description" },
          recurrenceRule: { name: "RecurrenceRule" }
        }
      },
      views: ["Day", "Week", "Month"],
      currentView: "Month",
      enableAdaptiveUI: true,
      showQuickInfo: true,
      popupOpen: (args) => this.handlePopupOpen(args),
      actionBegin: (args) => this.handleActionBegin(args),
      //actionComplete: (args) => this.handleActionComplete(args),
      eventRendered: (args) => this.handleEventRendered(args)
    });

    this.scheduleObj.appendTo(this.querySelector("#schedule"));
  }

  async handlePopupOpen(args) {
    if (args.type === "Editor") {
      // Prevent default editor
      args.cancel = true;

      // Show custom message dialog
      await this.showMessageDialog(args.data);
    }
  }

  async showMessageDialog(eventData) {
    const dialog = new ej.popups.Dialog({
      header: eventData.Id ? "Edit Schedule" : "New Schedule",
      content: this.getMessageDialogContent(eventData),
      showCloseIcon: true,
      width: "500px",
      height: "600px",
      isModal: true,
      visible: false,
      buttons: [
        {
          click: () => this.handleDialogSave(dialog, eventData),
          buttonModel: { content: "Save", isPrimary: true }
        },
        {
          click: () => dialog.hide(),
          buttonModel: { content: "Cancel" }
        }
      ],
      close: () => dialog.destroy()
    });

    dialog.appendTo(this.querySelector("#messageDialog"));
    dialog.show();

    // Initialize form components after dialog is shown
    this.initializeFormComponents(eventData);
  }

  getMessageDialogContent(data) {
    return `
            <div class="schedule-dialog-content">
                <div class="input-group mb-4">
                    <label>Target</label>
                    <input type="text" id="target" class="e-input">
                </div>
                
                <div class="input-group mb-4">
                    <label>Phone Number</label>
                    <input type="text" id="phone" class="e-input">
                </div>

                <div class="input-group mb-4">
                    <label>Message</label>
                    <textarea id="message" class="e-input" rows="3"></textarea>
                </div>

                <div class="input-group mb-4">
                    <label>Type</label>
                    <input type="text" id="type" class="e-input">
                </div>

                <div class="input-group mb-4">
                    <label>Schedule Time</label>
                    <input type="text" id="scheduleTime">
                </div>

                <div class="input-group mb-4">
                    <label>Recurrence</label>
                    <div id="recurrenceEditor"></div>
                </div>
            </div>
        `;
  }

  initializeFormComponents(data) {
    // Target dropdown
    new ej.dropdowns.DropDownList({
      dataSource: ["story", "chat"],
      value: data.target || "chat",
      placeholder: "Select target"
    }).appendTo("#target");

    // Phone autocomplete
    new ej.dropdowns.AutoComplete({
      dataSource: window.allContacts,
      fields: { text: "number", value: "number" },
      value: data.phone,
      placeholder: "Select contact"
    }).appendTo("#phone");

    // Type dropdown
    new ej.dropdowns.DropDownList({
      dataSource: ["text", "image", "audio", "video", "pdf"],
      value: data.type || "text",
      placeholder: "Select type"
    }).appendTo("#type");

    // DateTime picker
    new ej.calendars.DateTimePicker({
      value: data.StartTime || new Date(),
      format: "dd/MM/yyyy HH:mm"
    }).appendTo("#scheduleTime");

    // Recurrence editor
    new ej.schedule.RecurrenceEditor({
      value: data.RecurrenceRule || ""
    }).appendTo("#recurrenceEditor");
  }

  async handleDialogSave(dialog, originalData) {
    // Get the datetime value
    const selectedTime =
      document.querySelector("#scheduleTime").ej2_instances[0].value;
    const dateObj = new Date(selectedTime);

    const formData = {
      target: document.querySelector("#target").ej2_instances[0].value,
      phone: document.querySelector("#phone").ej2_instances[0].value,
      message: document.querySelector("#message").value,
      type: document.querySelector("#type").ej2_instances[0].value,
      time: selectedTime, // Keep the full datetime for display
      // Extract hour and minute for the API
      hour: dateObj.getHours(),
      minute: dateObj.getMinutes(),
      recurrence:
        document.querySelector("#recurrenceEditor").ej2_instances[0].value
    };

    try {
      const response = await fetch("/api/scheduled-messages", {
        method: originalData.Id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: originalData.Id,
          session: this.sessionName,
          ...formData
        })
      });

      const result = await response.json();

      if (result.status === "success") {
        showNotification("Schedule saved successfully", "success");
        await this.loadSchedules();
        this.scheduleObj.eventSettings.dataSource = this.events;
        dialog.hide();
      } else {
        throw new Error(result.message || "Failed to save schedule");
      }
    } catch (error) {
      showNotification(`Error saving schedule: ${error.message}`, "error");
    }
  }

  handleEventRendered(args) {
    // Add custom styling based on status
    if (args.data.Status === "Inactive") {
      args.element.style.opacity = "0.5";
    }
  }

  handleActionBegin(args) {
    if (args.requestType === "eventRemove") {
      args.cancel = true;
      this.deleteSchedule(args.data[0].Id);
    }
  }

  async deleteSchedule(id) {
    try {
      const response = await fetch("/api/scheduled-messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      const result = await response.json();

      if (result.status === "success") {
        showNotification("Schedule deleted successfully", "success");
        await this.loadSchedules();
        this.scheduleObj.eventSettings.dataSource = this.events;
      } else {
        throw new Error(result.message || "Failed to delete schedule");
      }
    } catch (error) {
      showNotification(`Error deleting schedule: ${error.message}`, "error");
    }
  }
}

customElements.define("schedule-manager", ScheduleManager);
