class AppSettings extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="glass rounded-2xl p-6">
                <h2 class="text-2xl font-bold text-white mb-6">Application Settings</h2>
                
                <div class="space-y-6">
                    <!-- Theme Settings -->
                    <div>
                        <h3 class="text-lg font-semibold text-white mb-4">Theme</h3>
                        <div class="flex items-center space-x-4">
                            <button class="w-10 h-10 rounded-full bg-blue-600 ring-2 ring-white ring-offset-2 ring-offset-gray-900"></button>
                            <button class="w-10 h-10 rounded-full bg-purple-600"></button>
                            <button class="w-10 h-10 rounded-full bg-green-600"></button>
                            <button class="w-10 h-10 rounded-full bg-red-600"></button>
                        </div>
                    </div>

                    <!-- Notification Settings -->
                    <div>
                        <h3 class="text-lg font-semibold text-white mb-4">Notifications</h3>
                        <div class="space-y-3">
                            <label class="flex items-center">
                                <input type="checkbox" class="form-checkbox rounded bg-white/10 border-white/20 text-blue-500">
                                <span class="ml-3 text-white">Email Notifications</span>
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" class="form-checkbox rounded bg-white/10 border-white/20 text-blue-500">
                                <span class="ml-3 text-white">WhatsApp Notifications</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-settings', AppSettings); 