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

      const data = await response.json();
      const updatedData = updateTimeToDate(data);

      this.messages = updatedData;
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
        const hour = date.getHours();
        const minute = date.getMinutes();

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

      showNotification(
        `Message ${enabled ? "scheduled" : "unscheduled"} successfully`,
        "success"
      );
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
        change: (args) => {
          console.log(args);
        },
      });

      switchObj.appendTo(inputElement);
    }

    var phoneElem, phoneObj;

    var grid = new ej.grids.Grid({
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
        allowDragging: false,
        mode: "Dialog",
      },

      columns: [
        {
          field: "id",
          headerText: "ID",
          //   isPrimaryKey: true,
          textAlign: "Left",
          width: 100,
          visible: true, // Hide ID in edit/create modes
        },
        {
          field: "enabled",
          headerText: "Enabled",
          textAlign: "Center",
          width: 150,
          template: "#enabledTemplate",
          visible: true,
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
          defaultValue: getFormattedNow(),
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
                filterType: "contains",
              });
              phoneObj.appendTo(phoneElem);
            },
          },
          visible: true,
        },
        {
          field: "message",
          headerText: "Message",
          textAlign: "Left",
          width: 300,
          editType: "textarea",
          visible: true,
          rows: 3,
        },
      ],

      toolbar: ["Add", "Edit", "Delete"],

      actionBegin(args) {
        if (args.requestType === "beginEdit" || args.requestType === "add") {
          for (var i = 0; i < grid.columns.length; i++) {
            if (
              grid.columns[i].field == "enabled" ||
              grid.columns[i].field == "id"
            ) {
              grid.columns[i].visible = false;
            }
          }
        }
      },

      actionComplete(args) {
        if (args.requestType === "beginEdit" || args.requestType === "add") {
          var dialog = args.dialog;
          dialog.allowDragging = false;
          dialog.header =
            args.requestType === "beginEdit"
              ? "Edit Message of " + args.rowData["id"]
              : "New Message";
        }
        if (args.requestType === "save" || args.requestType === "cancel") {
          for (var i = 0; i < grid.columns.length; i++) {
            grid.columns[i].visible = true;
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
            },
          });

          switchObj.appendTo(inputElement);
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

  render() {
    this.innerHTML = `
      <div class="glass rounded-2xl  text-white  p-6 shadow-lg">
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
