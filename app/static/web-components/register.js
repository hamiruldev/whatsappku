class RegisterForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="flex min-h-[80vh] items-center justify-center">
        <div class="glass rounded-2xl p-8 w-full max-w-md">
          <h2 class="text-3xl font-bold text-white mb-8 text-center">Create an Account</h2>
          <form id="registerForm" class="space-y-6">
            <div class="space-y-2">
              <label for="username" class="block text-sm font-medium text-white">Username</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                required
                class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition"
                placeholder="Enter your username"
              >
            </div>

            <div class="space-y-2">
              <label for="email" class="block text-sm font-medium text-white">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required
                class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition"
                placeholder="Enter your email"
              >
            </div>

            <div class="space-y-2">
              <label for="password" class="block text-sm font-medium text-white">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required
                class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition"
                placeholder="Enter your password"
              >
            </div>

            <div class="space-y-2">
              <label for="confirmPassword" class="block text-sm font-medium text-white">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword" 
                required
                class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition"
                placeholder="Confirm your password"
              >
            </div>

            <button 
              type="submit"
              class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 text-white font-medium transition duration-200 ease-in-out transform hover:scale-[1.02]"
            >
              Sign up
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-white">
              Already have an account? 
              <a href="/login" class="text-blue-300 hover:text-blue-200 transition">Log in</a>
            </p>
          </div>
        </div>
      </div>
    `;

    const form = this.querySelector("#registerForm");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = form.username.value;
      const email = form.email.value;
      const password = form.password.value;
      const confirmPassword = form.confirmPassword.value;

      // Validate passwords match
      if (password !== confirmPassword) {
        this.showNotification("Passwords do not match!", "error");
        return;
      }

      // Call API to create a new user
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
          this.showNotification(
            "Registration successful! Redirecting...",
            "success"
          );
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        } else {
          this.showNotification(
            data.message || "Registration failed!",
            "error"
          );
        }
      } catch (error) {
        console.error("Error registering user:", error);
        this.showNotification(
          "An error occurred during registration.",
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
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

customElements.define("register-form", RegisterForm);
