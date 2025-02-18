class ScheduleManager extends HTMLElement {
  constructor() {
    super();
    this.scheduleObj = null;
    this.sessionId = this.getAttribute("sessionId");
  }

  static get observedAttributes() {
    return ["sessionId"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "sessionId" && oldValue !== newValue) {
      this.sessionId = newValue;
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
      const sessionId =
        this.sessionId ||
        document.querySelector("#managementDialog").ej2_instances[0]
          .selectedSessionId;
      debugger;
      const url = sessionId
        ? `/api/scheduled-messages/session/${sessionId}`
        : "/api/scheduled-messages";

      const response = await fetch(url);
      const data = await response.json();

      // Convert the data to schedule format
      this.events = this.convertToScheduleEvents(
        this.sessionId ? data.data : data
      );

      if (this.scheduleObj) {
        this.scheduleObj.eventSettings.dataSource = this.events;
        this.scheduleObj.refresh();
      }

      console.log("Loaded schedules:", this.events);
    } catch (error) {
      console.error("Error loading schedules:", error);
      this.events = [];
    }
  }

  convertToScheduleEvents(messages) {
    console.log("messages--->", messages);

    return messages.map((msg) => {
      // Parse the date and time explicitly from "dd/MM/yyyy HH:mm"
      const [day, month, yearAndTime] = msg.time.split("/");
      const [year, time] = yearAndTime.split(" ");
      const [hours, minutes] = time.split(":");

      const startDate = new Date(
        parseInt(year, 10), // Year
        parseInt(month, 10) - 1, // Month (0-based index)
        parseInt(day, 10), // Day
        parseInt(hours, 10), // Hours
        parseInt(minutes, 10) // Minutes
      );

      return {
        Id: msg.id,
        Subject: `Message to ${msg.phone || "unknown"}`,
        StartTime: startDate,
        EndTime: new Date(startDate.getTime() + 30 * 60000), // 30 min duration
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
      };
    });
  }

  render() {
    const title = this.sessionId
      ? `Schedule for Session ${this.sessionId}`
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
      showQuickInfo: false,
      popupOpen: (args) => this.handlePopupOpen(args),
      actionBegin: (args) => this.handleActionBegin(args),
      actionComplete: (args) => this.handleActionComplete(args),
      eventRendered: (args) => this.handleEventRendered(args)
    });

    this.scheduleObj.appendTo(this.querySelector("#schedule"));
  }

  handleActionComplete(args) {
    //console.log("args handleActionComplete--->", args);
  }

  async handlePopupOpen(args) {
    console.log("args handlePopupOpen--->", args);
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
      width: isMobile() ? "100%" : "500px",
      height: isMobile() ? "100%" : "600px",
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
                <label>Platform</label>
                <input type="text" id="platform" class="e-input">
            </div>

            <div class="input-group mb-4">
                <label>Target</label>
                <input type="text" id="target" class="e-input">
            </div>
            
            <div class="input-group mb-4 phone-number">
                <label>Phone Number</label>
                <input type="text" id="phone" class="e-input" value="60184644305">
            </div>

            <div class="input-group mb-4">
                <label>Message</label>
                <textarea id="message" class="e-input" rows="3"></textarea>
            </div>

            <div class="input-group mb-4">
                <label>Type</label>
                <input type="text" id="type" class="e-input">
            </div>

            <div id="imageEditorContainer" style="display: none;">
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
    // Platform dropdown
    new ej.dropdowns.DropDownList({
      dataSource: [
        {
          value: "Whatsapp",
          text: "Whatsapp",
          enabled: true
        },
        {
          value: "Tiktok",
          text: "Tiktok (Coming Soon)",
          enabled: false
        },
        {
          value: "Instagram",
          text: "Instagram (Coming Soon)",
          enabled: false
        },
        {
          value: "Telegram",
          text: "Telegram (Coming Soon)",
          enabled: false
        }
      ],
      value: data.platform || "Whatsapp",
      fields: { text: "text", value: "value", enabled: "enabled" },
      select: (args) => {
        if (args.value !== "Whatsapp") {
          args.cancel = true;
        }
      },
      value: data.platform || "Whatsapp",
      placeholder: "Select platform"
    }).appendTo("#platform");

    // Target dropdown
    new ej.dropdowns.DropDownList({
      dataSource: ["Status", "Chat"],
      value: data.target || "Chat",
      placeholder: "Select Target",
      change: (args) => {
        console.log("args--->", args);
        if (args.value === "Status") {
          document.querySelector(".phone-number").style.display = "none";
        } else {
          document.querySelector(".phone-number").style.display = "block";
        }
      }
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
      placeholder: "Select type",
      change: (args) => {
        if (args.value === "image") {
          this.showImageEditorDialog();
        } else {
          console.log("remove image editor container");
          // Remove edit button if exists
          const editBtn = document.querySelector("#imageEditorContainer");
          if (editBtn) editBtn.remove();
        }
      }
    }).appendTo("#type");

    const checkDateTime = getValidStartTime(data.StartTime);

    // DateTime picker
    new ej.calendars.DateTimePicker({
      value: checkDateTime || new Date(),
      format: "dd/MM/yyyy HH:mm",
      min: new Date()
    }).appendTo("#scheduleTime");

    // Recurrence editor
    new ej.schedule.RecurrenceEditor({
      value: data.RecurrenceRule || ""
    }).appendTo("#recurrenceEditor");
  }

  async handleDialogSave(dialog, originalData) {
    try {
      // Extract form data
      var formData = this.getFormData();

      debugger;

      console.log("originalData--->", originalData);

      // Send request to create scheduled message
      const result1 = await this.createScheduledMessage(formData);

      // Save data to backend
      const result2 = await this.createCronJob(originalData, formData);

      formData.schedule_id = result1.id;
      formData.job_id = result2.id;

      if (result2.status === "success") {
        await schedulerAPI.updateScheduledMessage(
          formData.schedule_id,
          formData
        );
        this.saveSchedule(formData.schedule_id, formData);

        showNotification("Schedule saved successfully", "success");
        dialog.hide();

        // Refresh schedules after a short delay
        setTimeout(() => this.loadSchedules(), 500);
      } else {
        throw new Error(result2.message || "Failed to save schedule");
      }
    } catch (error) {
      showNotification(`Error saving schedule: ${error.message}`, "error");
    }
  }

  /**
   * Extracts form data from the UI
   */
  getFormData() {
    const getValue = (selector) =>
      document.querySelector(selector)?.ej2_instances?.[0]?.value;
    const selectedTime = getValue("#scheduleTime");
    const recurrenceRule = getValue("#recurrenceEditor") || "none";
    const dateObj = new Date(selectedTime);
    const sessionId =
      document.querySelector("#managementDialog").ej2_instances[0]
        .selectedSessionId;

    return {
      job_id: "none",
      platform: getValue("#platform"),
      target: getValue("#target"),
      phone: document.querySelector("#phone").value,
      message: document.querySelector("#message").value,
      type: getValue("#type"),
      time: selectedTime,
      hour: dateObj.getHours(),
      minute: dateObj.getMinutes(),
      start_date: dateObj.toISOString(),
      recurrence: recurrenceRule,
      session_id: sessionId,
      status: "pending"
    };
  }

  /**
   * Sends a request to create a scheduled message in the scheduler API
   */
  async createScheduledMessage(formData) {
    try {
      return await schedulerAPI.createScheduledMessage(formData);
    } catch (error) {
      console.error("Scheduler API Error:", error);
    }
  }

  /**
   * Saves the scheduled message to the backend
   */
  async createCronJob(originalData, formData) {
    const sessionId =
      document.querySelector("#managementDialog").ej2_instances[0]
        .selectedSessionId;

    const response = await fetch("/api/scheduled-messages", {
      method: originalData.Id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: originalData.Id,
        session_id: sessionId,
        ...formData
      })
    });

    return response.json();
  }

  /**
   * Updates or adds the event to the scheduler
   */
  saveSchedule(eventId, formData) {
    const dateObj = new Date(formData.time);

    const newEventData = {
      Id: eventId,
      Subject: `Message to ${formData.phone}`,
      StartTime: dateObj,
      EndTime: new Date(dateObj.getTime() + 30 * 60000),
      IsAllDay: false,
      Status: "Active",
      Priority: "High",
      Description: formData.message,
      RecurrenceRule: "",
      phone: formData.phone,
      target: formData.target,
      type: formData.type,
      messageText: formData.message,
      job_id: formData.job_id,
      schedule_id: formData.schedule_id
    };

    console.log("newEventData--->", newEventData);

    // if (eventId) {
    //   this.scheduleObj.saveEvent(newEventData);
    // } else {
    //   this.scheduleObj.addEvent(newEventData);
    // }
    this.scheduleObj.addEvent(newEventData);
  }

  handleEventRendered(args) {
    // Add custom styling based on status
    if (args.data.Status === "Inactive") {
      args.element.style.opacity = "0.5";
    }
  }

  handleActionBegin(args) {
    console.log("args--->", args);

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

  showImageEditorDialog() {
    const dialog = document.querySelector("#SharedDialog").ej2_instances[0];

    dialog.header = "Image Template Editor";
    dialog.content = "<image-editor></image-editor>";
    dialog.showCloseIcon = true;
    dialog.isModal = true;
    dialog.visible = true;
    dialog.position = { X: "center", Y: "center" };
    dialog.cssClass = "full-screen-dialog";
    dialog.width = "100%";
    dialog.height = "100%";

    if (isMobile()) {
      dialog.show();
    } else {
      dialog.show(1);
    }
  }
}

customElements.define("schedule-manager", ScheduleManager);
