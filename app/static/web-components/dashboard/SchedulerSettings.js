class SchedulerSettings extends HTMLElement {
    constructor() {
        super();
        this.enabled = false;
        this.hour = 9;
        this.minute = 0;
    }

    async connectedCallback() {
        await this.fetchSchedulerStatus();
        this.render();
        this.setupEventListeners(); // Attach listeners after rendering
    }

    async fetchSchedulerStatus() {
        try {
            const response = await fetch('/api/scheduler/morning-message');
            const data = await response.json();
            this.enabled = data.enabled;
            this.hour = data.hour;
            this.minute = data.minute;
        } catch (error) {
            console.error('Error fetching scheduler status:', error);
        }
    }

    async toggleScheduler() {
        try {
            const timeInput = this.querySelector('#scheduleTime');
            const [hours, minutes] = timeInput.value.split(':');
            
            const response = await fetch('/api/scheduler/morning-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    enabled: !this.enabled,
                    hour: parseInt(hours),
                    minute: parseInt(minutes)
                })
            });
            const data = await response.json();
            this.enabled = data.enabled;
            this.hour = data.hour;
            this.minute = data.minute;
            this.render();
            this.setupEventListeners(); // Reattach event listeners
            this.showNotification(
                `Daily morning message ${this.enabled ? 'enabled' : 'disabled'} at ${this.formatTime(this.hour, this.minute)}`,
                'success'
            );
        } catch (error) {
            console.error('Error toggling scheduler:', error);
            this.showNotification('Error updating scheduler settings', 'error');
        }
    }

    formatTime(hour, minute) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    setupEventListeners() {
        const toggle = this.querySelector('#schedulerToggle');
        const timeInput = this.querySelector('#scheduleTime');
        
        if (toggle) {
            // Remove old listeners
            toggle.removeEventListener('click', this.toggleScheduler);
            // Add new listener
            toggle.onclick = () => this.toggleScheduler();
        }

        if (timeInput) {
            timeInput.onchange = () => {
                if (this.enabled) {
                    this.toggleScheduler();
                }
            };
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg glass text-white ${
            type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    render() {
        this.innerHTML = `
            <div class="glass rounded-2xl p-6">
                <h2 class="text-2xl font-bold text-white mb-6">Scheduler Settings</h2>
                <div class="space-y-4">
                    <div class="flex items-center justify-between" style="
    background: black;
">
                        <div>
                            <h3 class="text-lg font-semibold text-white">Daily Morning Message</h3>
                            <p class="text-sm text-white/60">Send a morning message every day</p>
                            <div class="mt-2">
                                <input 
                                    type="time" 
                                    id="scheduleTime" 
                                    value="${this.formatTime(this.hour, this.minute)}"
                                    class="bg-white/10 text-white border border-white/20 rounded px-3 py-2"
                                >
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="schedulerToggle" 
                                class="sr-only peer" 
                                ${this.enabled ? 'checked' : ''}
                            >
                            <div class="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('scheduler-settings', SchedulerSettings); 