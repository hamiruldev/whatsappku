class QrCodeImage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Set up the component's inner HTML
    this.sessionName = this.getAttribute("sessionName");

    if (!this.sessionName) {
      console.error("No sessionName attribute provided for <qr-code-image>.");
      this.innerHTML = `<p style="color: red;">No session name provided.</p>`;
      return;
    }

    this.innerHTML = `
      <style>
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          width: 100%;
          max-width: 100%;
        }
        #refresh-button {
          margin-left: auto;
          padding: 6px 12px;
          background-color: white;
          color: black;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        #refresh-button:hover {
          background-color: whitesmoke;
          color: black;
        }
        #error-message {
          color: red;
          margin-top: 10px;
        }
        .skeleton-container {
          border-radius: 10px;
          margin: 10px 0;
          width: 100%;
          height: 70dvh;
          background-color: #e0e0e0;
          position: relative;
          overflow: hidden;
        }
        .skeleton-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.8) 25%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.8) 75%);
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          100% {
            left: 100%;
          }
        }
        #qrcode {
          display: none;
          width: 100%;
          height: auto;
        }
      </style>
      <div class="container">
        <button id="refresh-button" class="e-tbar-btn e-tbtn-txt e-control e-btn e-lib" type="button" style="width: auto;">
          <span class="e-btn-icon e-refresh e-icons e-icon-left"></span>
          <span class="e-tbar-btn-text">Refresh</span>
        </button>
        <div id="loading-placeholder" class="skeleton-container">
          <div class="skeleton-shimmer"></div>
        </div>
        <img id="qrcode" alt="QR Code" />
        <p id="error-message" style="display: none;"></p>
      </div>
    `;

    // Load the QR Code
    this.loadQrCode();

    // Add event listener for the refresh button
    this.querySelector("#refresh-button").addEventListener("click", () =>
      this.loadQrCode()
    );
  }

  async loadQrCode() {
    const imgElement = this.querySelector("#qrcode");
    const loadingPlaceholder = this.querySelector("#loading-placeholder");
    const errorMessage = this.querySelector("#error-message");

    // Reset UI
    errorMessage.style.display = "none";
    imgElement.style.display = "none";
    loadingPlaceholder.style.display = "block";

    try {
      // Validate the session
      const sessionValid = await this.validateSession(this.sessionName);
      if (!sessionValid) {
        throw new Error("Session is invalid or expired.");
      }

      // Fetch the QR Code
      const qrCodeSrc = await this.fetchQrCode(this.sessionName);

      // Update UI with QR Code
      imgElement.src = qrCodeSrc;
      imgElement.style.display = "block";
      loadingPlaceholder.style.display = "none";
    } catch (error) {
      console.error("Failed to load QR code:", error);
      errorMessage.textContent =
        error.message || "An error occurred while loading the QR code.";
      errorMessage.style.display = "block";
      loadingPlaceholder.style.display = "none";
    }
  }

  async validateSession(sessionName) {
    try {
      const response = await fetch(`/api/session/${sessionName}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error validating session:", error);
      throw error;
    }
  }

  async fetchQrCode(sessionName) {
    try {
      const response = await fetch(`/api/session/screenshot/${sessionName}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch QR code.");
      }

      const result = await response.json();
      if (!result.data) {
        throw new Error("No QR code data found.");
      }

      return `data:image/png;base64,${result.data}`;
    } catch (error) {
      console.error("Error fetching QR code:", error);
      throw error;
    }
  }
}

// Define the custom element
customElements.define("qr-code-image", QrCodeImage);
