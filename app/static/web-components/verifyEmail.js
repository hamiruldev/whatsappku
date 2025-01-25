// Verify Email Web Component
class VerifyEmailForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="flex min-h-[80vh] items-center justify-center">
        <div class="glass rounded-2xl p-8 w-full max-w-md">
          <h2 class="text-3xl font-bold text-white mb-8 text-center">Verify Email</h2>
          <form id="verifyEmailForm" class="space-y-6">
            <div class="space-y-2">
              <label for="verificationCode" class="block text-sm font-medium text-white">Verification Code</label>
              <input 
                type="text" 
                id="verificationCode" 
                name="verificationCode" 
                required
                class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition"
                placeholder="Enter your verification code"
              >
            </div>
            <button 
              type="submit"
              class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 text-white font-medium transition duration-200 ease-in-out transform hover:scale-[1.02]"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    `;

    const form = this.querySelector("#verifyEmailForm");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const verificationCode = form.verificationCode.value;

      try {
        const response = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verificationCode })
        });

        const data = await response.json();
        if (response.ok) {
          this.showNotification("Email verified successfully!", "success");
        } else {
          this.showNotification(
            data.message || "Verification failed!",
            "error"
          );
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        this.showNotification(
          "An error occurred while verifying email.",
          "error"
        );
      }
    });
  }

  showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 p-4 rounded-lg glass text-white ${
      type === "success" ? "bg-green-500/20" : "bg-red-500/20"
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

customElements.define("verify-email-form", VerifyEmailForm);
