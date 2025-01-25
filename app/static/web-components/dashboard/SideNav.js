class SideNav extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <aside class="flex flex-col h-full">
                <div class="p-6">
                    <h2 class="text-2xl font-bold text-white">WhatsApp CRM</h2>
                </div>
                
                <nav class="flex-1 px-4 space-y-2">
                    <a href="#" class="flex items-center px-4 py-3 text-white rounded-lg glass hover:bg-white/10 transition">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                        Dashboard
                    </a>
                    <!-- Add more navigation items -->
                </nav>
            </aside>
        `;
    }
}

customElements.define('side-nav', SideNav); 