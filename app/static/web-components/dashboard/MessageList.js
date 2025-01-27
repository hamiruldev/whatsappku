class MessageList extends HTMLElement {
  constructor() {
    super();
    this.messages = [];
  }

  async connectedCallback() {
    await this.loadMessages();
    this.render();
    this.setupGrid();
  }

  async loadMessages() {
    try {
      const response = await fetch("/api/scheduled-messages");
      this.messages = await response.json();
    } catch (error) {
      console.error("Error loading messages:", error);
      this.messages = [];
    }
  }

  async toggleMessage(data, enabled) {
    try {
      if (enabled) {
        console.log(data);
        // Create new scheduled message
        // Extract hour and minute from the ISO date string
        const date = new Date(data.time);
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();

        // Create new scheduled message
        const response = await fetch("/api/scheduled-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hour,
            minute,
            phone: data.phone,
            message: data.message,
          }),
        });

        const result = await response.json();
        data.id = result.id;
      } else {
        // Delete scheduled message
        await fetch(`/api/scheduled-messages/${data.id}`, {
          method: "DELETE",
        });
      }

      this.showNotification(
        `Message ${enabled ? "scheduled" : "unscheduled"} successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error toggling message:", error);
      this.showNotification("Error updating message schedule", "error");
    }
  }

  setupGrid() {
    function renderCell(args) {
      var inputElement = args.cell.querySelector("input#enable-button");

      var switchObj = new ej.buttons.Switch({
        cssClass: "e-togglebutton",
        change: (args) => {
          console.log(args);
        },
      });

      switchObj.appendTo(inputElement);
    }

    var phoneElem, phoneObj;

    const grid = new ej.grids.Grid({
      dataSource: this.messages,
      allowPaging: true,
      pageSettings: { pageSize: 10 },
      editSettings: {
        allowEditing: true,
        allowAdding: true,
        allowDeleting: true,
        mode: "Dialog",
      },
      enableAdaptiveUI: false,
      allowResizing: true,
      allowDragging: false,
      queryCellInfo: renderCell,
      toolbar: ["Add", "Edit", "Delete", "Update", "Cancel"],
      editSettings: {
        allowEditing: true,
        allowAdding: true,
        allowDeleting: true,
        mode: "Dialog",
      },

      columns: [
        {
          field: "enabled",
          headerText: "Enabled",
          textAlign: "Center",
          width: 150,
          template: "#enabledTemplate",
          visible: true,
        },
        {
          field: "id",
          headerText: "ID",
          isPrimaryKey: true,
          textAlign: "Left",
          width: 100,
          visible: true, // Hide ID in edit/create modes
        },
        {
          field: "time",
          headerText: "Time",
          textAlign: "Left",
          width: 150,
          type: "datetime",
          editType: "datetimepickeredit",
          format: "dd/MM/yyyy hh:mm",
        },
        {
          field: "phone",
          headerText: "Phone Number",
          textAlign: "Left",
          width: 150,
          edit: {
            create: function () {
              phoneElem = document.createElement("input");
              return phoneElem;
            },
            read: function () {
              return phoneObj.value; // Return the selected phone value
            },
            destroy: function () {
              phoneObj.destroy(); // Destroy the DropDownList instance
            },
            write: function (args) {
              phoneObj = new ej.dropdowns.DropDownList({
                dataSource: window.allContacts, // Use window.allContacts as the data source
                fields: { text: "number", value: "number" }, // Map text and value fields
                value: args.rowData.phone, // Set the initial value if editing
                placeholder: "Select a contact",
                floatLabelType: "Never",
                allowFiltering: true,
                filterType: "contains",
              });
              phoneObj.appendTo(phoneElem);
            },
          },
        },
        {
          field: "message",
          headerText: "Message",
          textAlign: "Left",
          width: 300,
        },
      ],

      toolbar: ["Add", "Edit", "Delete"],

      queryCellInfo: (args) => {
        if (args.column.field === "enabled") {
          const inputElement = args.cell.querySelector("input#enable-button");

          // Initialize the Switch component
          const switchObj = new ej.buttons.Switch({
            cssClass: "e-togglebutton",
            checked: args.data.enabled,
            change: async (switchArgs) => {
              const newEnabled = switchArgs.checked;

              args.data.phone = `${args.data.phone}@c.us`;

              await this.toggleMessage(args.data, newEnabled);
              args.data.enabled = newEnabled;
              grid.refresh();
            },
          });

          switchObj.appendTo(inputElement);
        }
      },
      actionBegin: function (args) {
        if (args.requestType === "beginEdit" || args.requestType === "add") {
          // Hide the "id" and "enabled" columns in edit/add mode
          const columnsToHide = ["id", "enabled"];
          columnsToHide.forEach((columnField) => {
            const column = grid.getColumnByField(columnField);
            column.visible = false;
          });
        }
      },
      actionComplete: function (args) {
        if (args.requestType === "save" || args.requestType === "cancel") {
          // Restore visibility after saving or canceling
          const columnsToShow = ["id", "enabled"];
          columnsToShow.forEach((columnField) => {
            const column = grid.getColumnByField(columnField);
            column.visible = true;
          });
        }
      },
    });

    grid.appendTo(this.querySelector("#grid"));

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

  showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  render() {
    this.innerHTML = `
      <div class="glass rounded-2xl p-6 shadow-lg bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400">
        <h2 class="text-2xl font-bold text-white mb-4">Scheduled Messages</h2>
        
         <script type="text/x-template" id="enabledTemplate" >
           <input id="enable-button" type="checkbox" />
        </script>
     
        
        <div id="grid"></div>
      </div>
    `;
  }
}

customElements.define("message-list", MessageList);
