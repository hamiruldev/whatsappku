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

            <div class="space-y-2">
              <label for="fullName" class="block text-sm font-medium text-white">Full Name</label>
              <input 
                type="text" 
                id="fullName" 
                name="fullName" 
                required
                class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition"
                placeholder="Enter your full name"
              >
            </div>

            <div class="space-y-2">
              <label for="phone" class="block text-sm font-medium text-white">Phone Number</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                required
                class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition"
                placeholder="Enter your phone number"
              >
            </div>

            <div class="space-y-2">
              <label for="noIc" class="block text-sm font-medium text-white">IC Number</label>
              <input 
                type="text" 
                id="noIc" 
                name="noIc" 
                required
                class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition"
                placeholder="Enter your IC number"
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
      
      const formData = {
        username: form.username.value,
        email: form.email.value,
        password: form.password.value,
        passwordConfirm: form.confirmPassword.value,
        emailVisibility: true,
        full_name: form.fullName.value,
        no_ic: form.noIc.value,
        phone: form.phone.value,
        bio: JSON.stringify({}),
        bank_details: JSON.stringify({}),
        kodku: this.generateKodku(form.username.value)
      };

      try {
        // Create user directly with PocketBase
        const record = await pb.collection('usersku').create(formData);
        
        // Request email verification
        await pb.collection('usersku').requestVerification(formData.email);
        
        this.showNotification(
          "Registration successful! Please check your email for verification.",
          "success"
        );
        
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);

      } catch (error) {
        console.error("Registration error:", error);
        this.showNotification(
          error.message || "Registration failed",
          "error"
        );
      }
    });
  }

  generateKodku(username) {
    const timestamp = new Date().getTime().toString(36);
    return `${username}_${timestamp}`;
  }

  showNotification(message, type) {
    showNotification(message, type);
  }
}

customElements.define("register-form", RegisterForm);
