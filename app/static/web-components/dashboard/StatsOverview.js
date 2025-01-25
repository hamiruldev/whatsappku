class StatsOverview extends HTMLElement {
    constructor() {
        super();
        this.stats = {
            contacts: 0,
            automations: 0,
            messages: 0
        };
    }

    async connectedCallback() {
        await this.fetchStats();
        this.render();
    }

    async fetchStats() {
        try {
            // Fetch WhatsApp contacts from WAHA API
            const response = await fetch(`${wahaApiUrl}/contacts`, {
                headers: {
                    'Session': sessionId
                }
            });
            const data = await response.json();
            this.stats.contacts = data.length;
            
            // You can add more stats fetching here
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    render() {
        this.innerHTML = `
            <div class="grid md:grid-cols-3 gap-8">
                <div class="glass rounded-2xl p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-500/20 text-blue-400">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-xl font-semibold text-white">Contacts</h3>
                            <p class="text-3xl font-bold text-white">${this.stats.contacts}</p>
                        </div>
                    </div>
                </div>
                <!-- Add more stat cards -->
            </div>
        `;
    }
}

customElements.define('stats-overview', StatsOverview); 