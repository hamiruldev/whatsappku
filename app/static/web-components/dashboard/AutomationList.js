class AutomationList extends HTMLElement {
    constructor() {
        super();
        this.automations = [
            {
                id: 'birthday',
                name: 'Birthday Wishes',
                status: 'active',
                lastRun: '2024-03-20T10:00:00',
                nextRun: '2024-03-21T10:00:00'
            },
            {
                id: 'story',
                name: 'Daily Story Updates',
                status: 'active',
                lastRun: '2024-03-20T09:00:00',
                nextRun: '2024-03-21T09:00:00'
            },
            {
                id: 'followup',
                name: 'Customer Follow-up',
                status: 'paused',
                lastRun: '2024-03-19T15:00:00',
                nextRun: null
            }
        ];
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <div class="glass rounded-2xl p-6">
                <h2 class="text-2xl font-bold text-white mb-6">Active Automations</h2>
                <div class="space-y-4">
                    ${this.automations.map(automation => `
                        <div class="flex items-center justify-between p-4 rounded-xl bg-white/5">
                            <div>
                                <h3 class="text-lg font-semibold text-white">${automation.name}</h3>
                                <p class="text-sm text-white/60">
                                    Next run: ${automation.nextRun ? new Date(automation.nextRun).toLocaleString() : 'Not scheduled'}
                                </p>
                            </div>
                            <div class="flex items-center space-x-4">
                                <span class="px-3 py-1 rounded-full text-sm ${
                                    automation.status === 'active' 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : 'bg-yellow-500/20 text-yellow-400'
                                }">
                                    ${automation.status}
                                </span>
                                <button class="p-2 rounded-lg hover:bg-white/10 transition">
                                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

customElements.define('automation-list', AutomationList); 