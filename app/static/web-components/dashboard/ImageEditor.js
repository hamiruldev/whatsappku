class ImageEditor extends HTMLElement {
  constructor() {
    super();
    this.imageEditorObj = null;
    this.templateConfig = null;
  }

  connectedCallback() {
    this.render();
    this.setupImageEditor();
  }

  render() {
    // Add styles
    this.innerHTML = `
        <style>
            .image-editor-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                padding: 1rem;
                background: var(--surface-card);
            }
            
            .toolbar-container {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
            }
            
            #imageEditor {
                flex: 1;
                min-height: 0;  /* Important for flex container */
                background: var(--surface-ground);
            }
            
            .template-upload {
                margin-top: 1rem;
            }
            
            .template-upload input[type="file"] {
                display: none;
            }
            
            .template-upload label {
                cursor: pointer;
            }
        </style>
        <div class="image-editor-container">
            <div class="toolbar-container">
                <button id="addTextBox" class="e-btn">Add Text Box</button>
                <button id="saveTemplate" class="e-btn e-primary">Save Template</button>
                <div class="template-upload">
                    <input type="file" id="templateUpload" accept="image/png,image/jpeg" />
                    <label for="templateUpload" class="e-btn">Upload Template</label>
                </div>
            </div>
            <div id="imageEditor"></div>
        </div>
    `;
  }

  setupImageEditor() {
    // Initialize the image editor
    this.imageEditorObj = new ejs.imageeditor.ImageEditor({
      width: "100%",
      height: "500px",
      toolbar: [
        "Rectangle",
        "Text",
        {
          name: "Save Template",
          tooltipText: "Save Template",
          template: '<button class="e-btn">Save Template</button>'
        }
      ],
      created: () => this.handleEditorCreated(),
      toolbarItemClicked: (args) => this.handleToolbarClick(args),
      annotationAdd: (args) => this.handleAnnotationAdd(args)
    });

    this.imageEditorObj.appendTo("#imageEditor");

    // Setup file upload
    const fileUpload = this.querySelector("#templateUpload");
    fileUpload.addEventListener("change", (e) => this.handleTemplateUpload(e));
  }

  handleEditorCreated() {
    // Load existing template config if available
    this.loadTemplateConfig();
  }

  async handleTemplateUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: new FormData().append("file", file)
      });

      const result = await response.json();
      if (result.url) {
        this.imageEditorObj.open(result.url);
        this.templateConfig = {
          templateUrl: result.url,
          textBoxes: []
        };
      }
    } catch (error) {
      console.error("Error uploading template:", error);
    }
  }

  handleToolbarClick(args) {
    if (args.item.tooltipText === "Save Template") {
      this.saveTemplateConfig();
    }
  }

  handleAnnotationAdd(args) {
    if (args.annotationType === "Text") {
      const textBox = {
        id: args.annotation.id,
        x: args.annotation.x,
        y: args.annotation.y,
        width: args.annotation.width,
        height: args.annotation.height,
        text: args.annotation.text || "Dynamic Text"
      };
      this.templateConfig.textBoxes.push(textBox);
    }
  }

  async saveTemplateConfig() {
    try {
      const response = await fetch("/api/media/template-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.templateConfig)
      });

      const result = await response.json();
      if (result.success) {
        showNotification(
          "Template configuration saved successfully",
          "success"
        );
      }
    } catch (error) {
      console.error("Error saving template config:", error);
    }
  }

  async loadTemplateConfig() {
    try {
      const response = await fetch("/api/media/template-config");
      const config = await response.json();
      if (config.templateUrl) {
        this.templateConfig = config;
        this.imageEditorObj.open(config.templateUrl);

        // Add saved text boxes
        config.textBoxes.forEach((box) => {
          this.imageEditorObj.addAnnotation({
            type: "Text",
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            text: box.text
          });
        });
      }
    } catch (error) {
      console.error("Error loading template config:", error);
    }
  }
}

customElements.define("image-editor", ImageEditor);
