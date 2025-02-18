class LoginForm extends HTMLElement {
  connectedCallback() {
    if (window.pb.authStore.isValid) {
      window.location.href = "/dashboard";
      return;
    }

    this.innerHTML = `
        <div class="flex min-h-[80vh] items-center justify-center">
            <div class="glass rounded-2xl p-8 w-full max-w-md">
                <h2 class="text-3xl font-bold text-white mb-8 text-center">Welcome Back</h2>
                <form id="loginForm" class="space-y-6">
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
                    
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center">
                            <input type="checkbox" id="remember" class="rounded border-white/20 text-blue-500 focus:ring-blue-400 bg-white/10">
                            <label for="remember" class="ml-2 text-white">Remember me</label>
                        </div>
                        <a href="/forgot-password" class="text-blue-300 hover:text-blue-200 transition">Forgot password?</a>
                    </div>
                    
                    <button 
                        type="submit"
                        id="loginButton"
                        class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 text-white font-medium transition duration-200 ease-in-out transform hover:scale-[1.02] flex items-center justify-center"
                    >
                        <span id="buttonText">Sign in</span>
                        <span id="loadingSpinner" class="ml-2 hidden">
                            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                        </span>
                    </button>
                </form>
                
                <div class="mt-6 text-center">
                    <p class="text-white">
                        Don't have an account? 
                        <a href="/register" class="text-blue-300 hover:text-blue-200 transition">Sign up</a>
                    </p>
                </div>
            </div>
        </div>
    `;

    const form = this.querySelector("#loginForm");
    const loginButton = this.querySelector("#loginButton");
    const buttonText = this.querySelector("#buttonText");
    const loadingSpinner = this.querySelector("#loadingSpinner");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = form.username.value;
      const password = form.password.value;

      // Show loading spinner and disable button
      loginButton.disabled = true;
      buttonText.classList.add("hidden");
      loadingSpinner.classList.remove("hidden");

      try {
        // Authenticate directly with PocketBase
        const authData = await pb
          .collection("usersku")
          .authWithPassword(username, password);

        if (authData?.record) {
          // Get user role from tenant_roles
          const { role } = await authAPI.checkUserRole(authData.record.id);

          // Store auth data
          localStorage.setItem("loggedUser", JSON.stringify(authData.record));
          localStorage.setItem("userRole", role);
          localStorage.setItem("isAdmin", role === "admin");

          this.showNotification("Login successful! Redirecting...", "success");

          // Redirect based on role
          setTimeout(() => {
            window.location.href =
              role === "admin" ? "/dashboard" : "/dashboard";
          }, 1500);
        }
      } catch (error) {
        console.error("Login error:", error);
        this.showNotification(
          error.message || "Invalid username or password",
          "error"
        );
      } finally {
        // Hide spinner and enable button
        loginButton.disabled = false;
        buttonText.classList.remove("hidden");
        loadingSpinner.classList.add("hidden");
      }
    });
  }

  showNotification(message, type) {
    showNotification(message, type);
  }
}

customElements.define("login-form", LoginForm);
