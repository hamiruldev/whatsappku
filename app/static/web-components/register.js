class RegisterForm extends HTMLElement {
  connectedCallback() {
    if (window.pb.authStore.isValid) {
      window.location.href = "/dashboard";
      return;
    }

    this.innerHTML = `
      <div class="flex min-h-[80vh] items-center justify-center">
        <div class="glass rounded-2xl p-8 w-full max-w-md">
          <h2 class="text-3xl font-bold text-white mb-8 text-center">Create an Account</h2>
          <form id="registerForm" class="space-y-6">
            
            ${this.renderInput(
              "username",
              "text",
              "Username",
              "Enter your username"
            )}
            ${this.renderInput("email", "email", "Email", "Enter your email")}
            
            ${this.renderPasswordInput(
              "password",
              "Password",
              "Enter your password"
            )}
            ${this.renderPasswordInput(
              "confirmPassword",
              "Confirm Password",
              "Confirm your password"
            )}
            
            ${this.renderInput(
              "fullName",
              "text",
              "Full Name",
              "Enter your full name"
            )}
            ${this.renderInput(
              "phone",
              "tel",
              "Phone Number",
              "Enter your phone number"
            )}
            ${this.renderInput(
              "noIc",
              "text",
              "IC Number",
              "Enter your IC number"
            )}

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

    this.addEventListeners();
  }

  renderInput(id, type, label, placeholder) {
    return `
      <div class="space-y-2">
        <label for="${id}" class="block text-sm font-medium text-white">${label}</label>
        <input 
          type="${type}" 
          id="${id}" 
          name="${id}" 
          required
          class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition"
          placeholder="${placeholder}"
        >
      </div>
    `;
  }

  renderPasswordInput(id, label, placeholder) {
    return `
      <div class="space-y-2 relative">
        <label for="${id}" class="block text-sm font-medium text-white">${label}</label>
        <div class="relative">
          <input 
            type="password" 
            id="${id}" 
            name="${id}" 
            required
            class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition pr-12"
            placeholder="${placeholder}"
          >
          <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white focus:outline-none" data-toggle="${id}">
            👁
          </button>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const form = this.querySelector("#registerForm");

    // Toggle password visibility
    this.querySelectorAll("[data-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = this.querySelector(`#${button.dataset.toggle}`);
        input.type = input.type === "password" ? "text" : "password";
      });
    });

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
        const record = await pb.collection("usersku").create(formData);
        await pb.collection("usersku").requestVerification(formData.email);

        this.showNotification(
          "Registration successful! Please check your email for verification.",
          "success"
        );

        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } catch (error) {
        console.error("Registration error:", error);
        this.showNotification(error.message || "Registration failed", "error");
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
