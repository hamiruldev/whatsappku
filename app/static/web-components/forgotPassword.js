// Forgot Password Web Component
class ForgotPassword extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="flex min-h-[80vh] items-center justify-center">
        <div class="glass rounded-2xl p-8 w-full max-w-md">
          <h2 class="text-3xl font-bold text-white mb-8 text-center">Forgot Password</h2>
          <form id="forgotPasswordForm" class="space-y-6">
            <div class="space-y-2">
              <label for="email" class="block text-sm font-medium text-white">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required
                class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition"
                placeholder="Enter your email address"
              >
            </div>
            <button 
              type="submit"
              class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 text-white font-medium transition duration-200 ease-in-out transform hover:scale-[1.02]"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    `;

    const form = this.querySelector("#forgotPasswordForm");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = form.email.value;

      try {
        const response = await fetch("/api/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        if (response.ok) {
          this.showNotification("Password reset email sent!", "success");
        } else {
          this.showNotification(
            data.message || "Error sending reset email!",
            "error"
          );
        }
      } catch (error) {
        console.error("Error requesting password reset:", error);
        this.showNotification(
          "An error occurred while sending reset email.",
          "error"
        );
      }
    });
  }

  showNotification(message, type) {
    showNotification(message, type);
  }
}
customElements.define("forgot-password", ForgotPassword);
