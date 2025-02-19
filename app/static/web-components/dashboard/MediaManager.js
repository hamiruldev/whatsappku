class MediaManager extends HTMLElement {
  constructor() {
    super();
    this.mediaList = [];
    this.grid = null;
    this.uploader = null;
    this.uploadedFile = null;
  }

  connectedCallback() {
    this.render();
    this.initializeComponents();
    this.loadMedia();
  }

  render() {
    this.innerHTML = `
      <style>
        .media-manager {
          height: 100%;
          background: var(--surface-card);
          border-radius: 8px;
        }
        
        .media-preview {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 4px;
        }
        
        .media-type-icon {
          font-size: 24px;
          color: var(--primary-color);
        }
        
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .tag {
          background: var(--primary-color);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .upload-area {
          padding: 1.5rem;
          background: var(--surface-ground);
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .grid-container {
          margin-top: 1rem;
          border-radius: 8px;
          overflow: hidden;
        }
      </style>

      <div class="glass rounded-2xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">Media Library</h2>
            <button id="newButtonMedia" class="e-tbar-btn e-tbtn-txt e-control e-btn e-lib" type="button">
                <span class="e-btn-icon e-plus e-icons e-icon-left"></span>
                <span class="e-tbar-btn-text">New</span>
            </button>
        </div>

        <div id="mediaGrid"></div>
      </div>

      
    `;
  }

  initializeComponents() {
    // Initialize grid
    this.grid = new ej.grids.Grid({
      dataSource: this.mediaList,
      allowPaging: true,
      allowResizing: true,
      pageSettings: { pageSize: 10 },
      enableAdaptiveUI: isMobile() ? true : false,
      allowSorting: true,
      allowFiltering: true,
      filterSettings: { type: "Excel" },
      toolbar: ["Add", "Edit", "Delete", "Update", "Cancel"],
      editSettings: {
        allowEditing: false,
        allowAdding: true,
        allowDeleting: true,
        mode: "Dialog"
      },
      columns: [
        {
          field: "preview",
          headerText: "Preview",
          width: 120,
          template: (props) => this.getPreviewTemplate(props)
        },
        {
          field: "name",
          headerText: "Name",
          width: 200
        },
        {
          field: "type",
          headerText: "Type",
          width: 100,
          template: (props) => `
            <div class="flex items-center">
              <i class="e-icons ${this.getTypeIcon(props.type)} mr-2"></i>
              ${props.type}
            </div>
          `
        },
        {
          field: "tags",
          headerText: "Tags",
          width: 200
        },
        {
          field: "createdBy",
          headerText: "Created By",
          width: 150
        },
        {
          headerText: "Actions",
          width: 120,
          template: (props) => `
            <div class="flex gap-2">
              <button class="e-btn e-small e-round e-primary edit-tags" 
                      data-id="${props.id}" title="Edit Tags">
                <i class="e-icons e-edit"></i>
              </button>
              <button class="e-btn e-small e-round e-danger delete-media" 
                      data-id="${props.id}" title="Delete">
                <i class="e-icons e-trash"></i>
              </button>
            </div>
          `
        }
      ],
      rowSelected: (args) => {
        console.log(args);
        this.showMediaDialog(false, args.data);
      }
    });

    this.grid.appendTo("#mediaGrid");

    // Add event listeners for action buttons
    this.addEventListener("click", (e) => {
      if (e.target.closest(".edit-tags")) {
        const mediaId = e.target.closest(".edit-tags").dataset.id;
        this.showTagEditor(mediaId);
      } else if (e.target.closest(".delete-media")) {
        const mediaId = e.target.closest(".delete-media").dataset.id;
        this.confirmDelete(mediaId);
      }
    });

    this.querySelector("#newButtonMedia").addEventListener("click", () => {
      this.showMediaDialog(true);
    });
  }

  getPreviewTemplate(props) {
    const defaultImage = "/static/media/default/default.jpg"; // Set your default image path

    switch (props.type) {
      case "image":
        return `<img loading="lazy" src="${props.url}" class="media-preview" alt="${props.name}" onerror="this.onerror=null;this.src='${defaultImage}';">`;
      case "video":
        return `
              <div class="media-preview flex items-center justify-center bg-gray-800">
                <i class="e-icons e-video media-type-icon"></i>
              </div>`;
      case "audio":
        return `
              <div class="media-preview flex items-center justify-center bg-gray-800">
                <i class="e-icons e-audio media-type-icon"></i>
              </div>`;
      default:
        return `
              <div class="media-preview flex items-center justify-center bg-gray-800">
                <i class="e-icons e-file media-type-icon"></i>
              </div>`;
    }
  }

  getTypeIcon(type) {
    switch (type) {
      case "image":
        return "e-image";
      case "video":
        return "e-video";
      case "audio":
        return "e-audio";
      default:
        return "e-file";
    }
  }

  async uploadMedia(data) {
    const respond = await mediaAPI.uploadMedia(data);

    this.mediaList = respond.items;
    console.log(this.mediaList);
    return respond;
  }

  async loadMedia() {
    try {
      const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
      const respond = await mediaAPI.getMediaByUserId(1, 50, loggedUser.id);

      // const response = await fetch("/api/media");
      // this.mediaList = await response.json();

      this.mediaList = respond.items;
      console.log("this.mediaList", this.mediaList);

      if (this.grid) {
        this.grid.dataSource = this.mediaList;
      }
    } catch (error) {
      console.error("Error loading media:", error);
      showNotification("Error loading media", "error");
    }
  }

  handleUploadSuccess(args) {
    showNotification("Files uploaded successfully", "success");
    this.loadMedia(); // Refresh the grid
  }

  handleUploadFailure(args) {
    showNotification("Error uploading files", "error");
  }

  confirmDelete(mediaId) {
    const dialog = document.querySelector("#SharedDialog").ej2_instances[0];

    dialog.show();
    dialog.header = "Confirm Delete";
    dialog.content = "Are you sure you want to delete this media?";
    dialog.showCloseIcon = true;
    dialog.buttons = [
      {
        click: () => {
          this.deleteMedia(mediaId);
          dialog.hide();
        },
        buttonModel: {
          content: "Delete",
          isPrimary: true,
          cssClass: "e-danger"
        }
      },
      {
        click: () => dialog.hide(),
        buttonModel: { content: "Cancel" }
      }
    ];
  }

  handleRowSelect(args) {
    console.log(args);
    const mediaId = args.data.id;
    this.showTagEditor(mediaId);
  }

  async deleteMedia(mediaId) {
    try {
      await mediaAPI.deleteMedia(mediaId);

      const mediaName = this.grid.dataSource.find((m) => m.id === mediaId).name;
      const response = await fetch(`/api/media/${mediaName}`, {
        method: "DELETE"
      });

      const result = await response.json();
      if (result.success) {
        await this.loadMedia();
        showNotification("Media deleted successfully", "success");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showNotification("Error deleting media", "error");
    }
  }

  showTagEditor(mediaId) {
    const dialog = document.querySelector("#SharedDialog").ej2_instances[0];

    dialog.show();
    dialog.header = "Edit Tags";
    dialog.content = `
      <div class="tag-editor">
          <div class="e-input-group">
            <input type="text" id="tagInput" class="e-input" placeholder="Add tags...">
          </div>
          <div class="current-tags">
            ${this.mediaList
              .find((m) => m.id === mediaId)
              .tags.map(
                (tag) => `
              <div class="tag">
                ${tag}
                <button class="remove-tag" data-tag="${tag}">×</button>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;

    dialog.buttons = [
      {
        click: () => this.updateTags(mediaId, dialog),
        buttonModel: { content: "Save", isPrimary: true }
      },
      {
        click: () => dialog.hide(),
        buttonModel: { content: "Cancel" }
      }
    ];

    dialog.width = "400px";
    dialog.isModal = true;
    dialog.visible = true;
  }

  async updateTags(mediaId, dialog) {
    const tags = Array.from(dialog.element.querySelectorAll(".tag")).map(
      (tag) => tag.textContent.trim()
    );

    try {
      const response = await fetch(`/api/media/${mediaId}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags })
      });

      const result = await response.json();
      if (result.success) {
        await this.loadMedia();
        dialog.hide();
        showNotification("Tags updated successfully", "success");
      }
    } catch (error) {
      console.error("Update tags error:", error);
      showNotification("Error updating tags", "error");
    }
  }

  showMediaDialog(isNew = true, data = null) {
    const dialog = document.querySelector("#SharedDialog").ej2_instances[0];

    dialog.header = isNew ? "Add New Media" : "Edit Media";
    dialog.content = "";
    dialog.content = `
      <div class="p-4">
        <div class="grid gap-4">
          <!-- Preview/Upload Section -->
          <div class="form-group">
            <label class="text-sm font-medium mb-1">Media File</label>
            ${
              data?.url
                ? `<div class="mt-2">
                <img src="${data.url}" class="w-32 h-32 object-cover rounded" />
              </div>`
                : `
                <input type='file' id='mediaFileUpload' name='files'/>`
            }
          </div>

          <!-- Type Dropdown -->
          <div class="form-group">
            <label class="text-sm font-medium mb-1">Type</label>
            <input type="text" id="mediaType" />
          </div>

           <!-- Caption Input -->
          <div class="form-group">
            <label class="text-sm font-medium mb-1">Caption</label>
            <input type="text" id="mediaCaption" />
          </div>

          <!-- Tags Input -->
          <div class="form-group">
            <label class="text-sm font-medium mb-1">Tags</label>
             <input type="text" id="mediaTagsChip" />
          </div>
        </div>
      </div>
    `;

    // Initialize form components after dialog content is set
    dialog.dataBind();
    const isDialogInitialized = this.initializeDialogComponents(isNew, data);

    if (isDialogInitialized) {
      dialog.buttons = [
        {
          click: () => this.handleMediaSave(dialog, isNew, data),
          buttonModel: { content: "Save", isPrimary: true }
        },
        {
          click: () => dialog.hide(),
          buttonModel: { content: "Cancel" }
        }
      ];

      dialog.width = isMobile() ? "100%" : "500px";
      dialog.height = isMobile() ? "100%" : "500px";
      dialog.showCloseIcon = true;
      dialog.isModal = true;
      dialog.visible = true;

      if (isMobile()) {
        dialog.show(1);
        document.querySelector("#SharedDialog").style.top = "0";
      } else {
        dialog.show();
      }
    }
  }

  initializeDialogComponents(isNew, data) {
    if (isNew) {
      // Initialize file upload
      const uploader = new ej.inputs.Uploader({
        autoUpload: false,
        multiple: false,
        maxFileSize: 50000000,
        allowedExtensions: ".png,.jpg,.jpeg,.gif,.mp4,.webm,.mp3,.wav",
        asyncSettings: {
          saveUrl: "/api/media/upload",
          removeUrl: "/api/media/remove"
        },
        success: async (args) => {
          if (args.file?.name) {
            this.uploadedFile = args.file;

            const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
            const getFileType =
              document.querySelector("#mediaType").ej2_instances[0].value;

            const getTag =
              document.querySelector("#mediaTagsChip").ej2_instances[0].value;

            const getCaption =
              document.querySelector("#mediaCaption").ej2_instances[0].value;

            const data = {
              createdBy: loggedUser.id,
              name: args.file?.name,
              type: getFileType,
              url: window.location.origin + "/static/media/" + args.file?.name,
              caption: getCaption,
              tags: getTag
            };

            const respond = await this.uploadMedia(data);
            if (respond.id) {
              await this.loadMedia();
              dialog.hide();
              showNotification(
                `Media ${isNew ? "added" : "updated"} successfully`,
                "success"
              );
            }
          }
        }
      });

      uploader.appendTo("#mediaFileUpload");
    }

    const typeDropdown = new ej.dropdowns.DropDownList({
      dataSource: [
        { text: "Image", value: "image" },
        { text: "Video", value: "video" },
        { text: "Audio", value: "audio" }
      ],
      fields: { text: "text", value: "value" },
      value: data?.type || "image",
      placeholder: "Select type"
    });

    typeDropdown.appendTo("#mediaType");

    const mediaCaption = new ej.inputs.TextBox({
      placeholder: "Enter caption",
      value: data?.caption || ""
    });

    mediaCaption.appendTo("#mediaCaption");

    const tagsChip = new ej.inputs.TextBox({
      placeholder: "Enter Tag for template",
      value: data?.tags || ""
    });

    tagsChip.appendTo("#mediaTagsChip");

    return true;
  }

  async handleMediaSave(dialog, isNew, originalData) {
    const mediaFileUpload =
      document.querySelector("#mediaFileUpload").ej2_instances[0];

    mediaFileUpload.upload(mediaFileUpload.getFilesData());
  }
}

customElements.define("media-manager", MediaManager);
