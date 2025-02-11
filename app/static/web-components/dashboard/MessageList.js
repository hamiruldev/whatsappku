class MessageList extends HTMLElement {
  constructor() {
    super();
    this.messages = [];
    this.sessionName = this.getAttribute("sessionName");
  }

  static get observedAttributes() {
    return ["sessionName"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "sessionName" && oldValue !== newValue) {
      this.sessionName = newValue;
      if (this.isConnected) {
        this.loadMessages();
      }
    }
  }

  async connectedCallback() {
    await this.loadMessages();
    this.render();
    this.setupGrid();
  }

  async loadMessages() {
    try {
      let url = "/api/scheduled-messages";

      // If sessionName is provided, use the session-specific endpoint
      if (this.sessionName) {
        url = `/api/scheduled-messages/session/${this.sessionName}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      // Handle both response formats
      let messages;
      if (this.sessionName) {
        // Session-specific endpoint returns { status, data }
        messages = data.status === "success" ? data.data : [];
      } else {
        // General endpoint returns array directly
        messages = data;
      }

      const updatedData = updateTimeToDate(messages);
      this.messages = updatedData;

      // If grid exists, update its data source
      if (this.grid) {
        this.grid.dataSource = this.messages;
        this.grid.refresh();
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      this.messages = [];
    }
  }

  async toggleMessage(data, enabled) {
    try {
      if (enabled) {
        const date = new Date(data.time);
        const hour = date.getHours();
        const minute = date.getMinutes();

        const response = await fetch("/api/scheduled-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            session: this.sessionName, // Include session name if available
            hour,
            minute,
            phone: data.phone,
            message: data.message,
            message_type: data.type
          })
        });

        const result = await response.json();
        return result;
      } else {
        const response = await fetch(`/api/scheduled-messages`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: data.id })
        });

        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.error("Error toggling message:", error);
      showNotification("Error updating message schedule", "error");
    }
  }

  setupGrid() {
    function renderCell(args) {
      var inputElement = args.cell.querySelector("input#enable-button");

      var switchObj = new ej.buttons.Switch({
        cssClass: "e-togglebutton",
        defaultValue: true,
        change: (args) => {
          console.log(args);
        }
      });

      switchObj.appendTo(inputElement);
    }

    var phoneElem, phoneObj;
    var targetElem, targetObj;
    var typeElem, typeObj;

    var grid = new ej.grids.Grid({
      dataSource: this.messages,
      allowPaging: true,
      pageSettings: { pageSize: 10 },
      filterSettings: { type: "Menu" },
      enableAdaptiveUI: false,
      allowResizing: true,
      allowSorting: true,
      allowFiltering: true,
      allowDragging: false,
      queryCellInfo: renderCell,
      toolbar: ["Add", "Delete", "Update", "Cancel"],
      editSettings: {
        allowEditing: false,
        allowAdding: true,
        allowDeleting: true,
        allowDragging: false,
        mode: "Dialog"
      },

      columns: [
        {
          field: "id",
          headerText: "ID",
          //   isPrimaryKey: true,
          textAlign: "Left",
          width: 100,
          visible: true, // Hide ID in edit/create modes
          allowFiltering: false,
          allowSorting: false
        },
        {
          field: "enabled",
          headerText: "Enabled",
          textAlign: "Center",
          width: 150,
          template: "#enabledTemplate",
          visible: true,
          allowFiltering: false,
          allowSorting: false
        },
        {
          field: "time",
          headerText: "Time",
          textAlign: "Left",
          width: 180,
          type: "datetime",
          editType: "datetimepickeredit",
          format: "dd/MM/yyyy hh:mm",
          visible: true,
          defaultValue: getFormattedNow()
        },

        {
          field: "target",
          headerText: "Target",
          textAlign: "Left",
          width: 150,
          allowFiltering: false,
          allowSorting: true,
          edit: {
            create: function () {
              targetElem = document.createElement("input");
              targetElem.type = "text";
              targetElem.tabIndex = "1";
              return targetElem;
            },
            read: function () {
              return targetObj.value;
            },
            destroy: function () {
              targetObj.destroy();
            },
            write: function (args) {
              function handleTarget(condition) {
                // Find the input element
                const phoneInput = document.querySelector("input#gridphone");

                if (phoneInput) {
                  // Find the closest <tr> element containing the input
                  const rowElement = phoneInput.closest("tr");

                  if (rowElement) {
                    // Hide or show the row based on the condition
                    if (condition) {
                      rowElement.style.display = "none"; // Hide the row
                    } else {
                      rowElement.style.display = ""; // Show the row
                    }
                  }
                }
              }

              targetObj = new ej.dropdowns.DropDownList({
                dataSource: ["story", "chat"], // Use window.allContacts as the data source
                placeholder: "Select a target",
                floatLabelType: "Always",
                value: args.rowData.target ?? "chat",
                created: function () {
                  if (args.rowData.target === "story") {
                    handleTarget(true);
                  } else {
                    handleTarget(false);
                  }
                },
                change: (args) => {
                  if (args.value === "story") {
                    handleTarget(true);
                  } else {
                    handleTarget(false);
                  }
                }
              });
              targetObj.appendTo(targetElem);
            }
          },
          visible: true
        },
        {
          field: "phone",
          headerText: "Phone Number",
          textAlign: "Left",
          allowFiltering: true,
          allowSorting: true,
          width: 150,
          edit: {
            create: function () {
              phoneElem = document.createElement("input");
              return phoneElem;
            },
            read: function () {
              return phoneObj.value;
            },
            destroy: function () {
              phoneObj.destroy();
            },
            write: function (args) {
              phoneObj = new ej.dropdowns.AutoComplete({
                dataSource: window.allContacts, // Use window.allContacts as the data source
                fields: { text: "number", value: "number" }, // Map text and value fields
                value: args.rowData.phone ?? "60184644305", // Set the initial value if editing
                placeholder: "Select a contact",
                floatLabelType: "Never",
                allowFiltering: true,
                filterType: "contains"
              });
              phoneObj.appendTo(phoneElem);
            }
          },
          visible: true
        },
        {
          field: "message",
          headerText: "Message",
          textAlign: "Left",
          width: 300,
          editType: "textarea",
          visible: true,
          rows: 3,
          allowFiltering: false,
          allowSorting: false
        },
        {
          field: "type",
          headerText: "Type",
          textAlign: "Left",
          width: 150,
          allowFiltering: false,
          allowSorting: true,
          edit: {
            create: function () {
              typeElem = document.createElement("input");
              typeElem.type = "text";
              typeElem.tabIndex = "1";
              return typeElem;
            },
            read: function () {
              return typeObj.value;
            },
            destroy: function () {
              typeObj.destroy();
            },
            write: function (args) {
              function handleType(condition) {
                // Find the input element
                const phoneInput = document.querySelector("input#gridphone");

                if (phoneInput) {
                  // Find the closest <tr> element containing the input
                  const rowElement = phoneInput.closest("tr");

                  if (rowElement) {
                    // Hide or show the row based on the condition
                    if (condition) {
                      rowElement.style.display = "none"; // Hide the row
                    } else {
                      rowElement.style.display = ""; // Show the row
                    }
                  }
                }
              }

              typeObj = new ej.dropdowns.DropDownList({
                dataSource: ["image", "audio", "video", "pdf"], // Use window.allContacts as the data source
                placeholder: "Select a media type",
                floatLabelType: "Always",
                value: args.rowData.type ?? "image",
                created: function () {
                  // if (args.rowData.type === "story") {
                  // handleType(true);
                  // } else {
                  //  handleType(false);
                  //}
                },
                change: (args) => {
                  //if (args.value === "story") {
                  //    handleType(true);
                  // } else {
                  //   handleType(false);
                  // }
                }
              });
              typeObj.appendTo(typeElem);
            }
          },
          visible: true
        }
      ],

      toolbar: ["Add", "Edit", "Delete"],

      actionBegin: async (args) => {
        if (args.requestType === "add" || args.requestType === "beginEdit") {
          // Hide enabled and id columns in edit mode
          for (let column of grid.columns) {
            if (column.field === "enabled" || column.field === "id") {
              column.visible = false;
            }
          }
        }

        if (args.requestType === "delete") {
          const result = await this.toggleMessage(args.data[0], false);
          if (result.status === "success") {
            showNotification(`Message unscheduled successfully`, "success");
          } else {
            showNotification(`Message unscheduling failed`, "error");
          }
        }
      },

      actionComplete: async (args) => {
        if (args.requestType === "add") {
          // args.dialog.header = "Add Session";
          args.dialog.allowDragging = false;
        }

        if (args.requestType === "beginEdit") {
          // args.dialog.header = "Edit Session";
          args.dialog.allowDragging = false;
        }

        if (args.requestType === "save" || args.requestType === "cancel") {
          // Handle save action
          if (args.action === "add") {
            const data = args.data;
            if (!args.previousData?.id) {
              // This is a new record
              const result = await this.toggleMessage(data, true);

              if (result.status === "success") {
                args.data.enabled = true;
                args.data.id = result.id;
                args.rowData = data;

                showNotification(`Message scheduled successfully`, "success");
              } else {
                showNotification(`Message scheduling failed`, "error");
              }
            }
          }

          // Show all columns after save/cancel
          for (let column of grid.columns) {
            column.visible = true;
          }
          grid.refresh();
        }
      },

      queryCellInfo: (args) => {
        if (args.column.field === "enabled") {
          const inputElement = args.cell.querySelector("input#enable-button");

          // Initialize the Switch component
          const switchObj = new ej.buttons.Switch({
            cssClass: "e-togglebutton",
            checked: args.data.enabled,
            change: async (switchArgs) => {
              const newEnabled = switchArgs.checked;

              args.data.phone = `${args.data.phone}`;

              await this.toggleMessage(args.data, newEnabled);
              args.data.enabled = newEnabled;
              grid.refresh();
            }
          });

          switchObj.appendTo(inputElement);
        }
      }
    });

    grid.appendTo(this.querySelector("#grid"));
    this.grid = grid; // Store grid reference

    // Add event listeners for toggle buttons
    this.querySelector("#grid").addEventListener("click", async (e) => {
      const toggleButton = e.target.closest(".toggle-button button");
      if (toggleButton) {
        const row = grid.getRowObjectFromUID(
          toggleButton.closest("tr").getAttribute("data-uid")
        );
        const data = row.data;
        const newEnabled = !data.enabled;

        await this.toggleMessage(data, newEnabled);
        data.enabled = newEnabled;
        grid.refresh();
      }
    });
  }

  render() {
    const title = this.sessionName
      ? `Scheduled Messages for ${this.sessionName}`
      : "All Scheduled Messages";

    this.innerHTML = `
      <div class="glass rounded-2xl text-white p-6 shadow-lg">
        <h2 class="text-2xl font-bold mb-4">${title}</h2>
        
        <script type="text/x-template" id="enabledTemplate">
          <input id="enable-button" type="checkbox" />
        </script>
        
        <div id="grid"></div>
      </div>
    `;
  }
}

customElements.define("message-list", MessageList);
