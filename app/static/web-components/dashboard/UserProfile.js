class UserProfile extends HTMLElement {
    constructor() {
        super();
        this.user = null;
    }

    async connectedCallback() {
        await this.fetchUserProfile();
        this.render();
    }

    async fetchUserProfile() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            const response = await fetch(`${pocketBaseUrl}/api/collections/usersku/records/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            this.user = await response.json();
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }

    render() {
        this.innerHTML = `
            <div class="glass rounded-2xl p-6">
                <h2 class="text-2xl font-bold text-white mb-6">Profile</h2>
                
                ${this.user ? `
                    <div class="flex items-center mb-6">
                        <img src="${this.user.avatar_url || '/static/images/default-avatar.png'}" 
                             alt="Profile" 
                             class="w-20 h-20 rounded-full">
                        <div class="ml-4">
                            <h3 class="text-xl font-semibold text-white">${this.user.name}</h3>
                            <p class="text-white/60">${this.user.email}</p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-white/60">Username</label>
                            <p class="text-white">${this.user.username}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-white/60">Phone</label>
                            <p class="text-white">${this.user.phone || 'Not set'}</p>
                        </div>
                    </div>

                    <div class="mt-6">
                        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Edit Profile
                        </button>
                    </div>
                ` : `
                    <p class="text-white/60">Loading profile...</p>
                `}
            </div>
        `;
    }
}

customElements.define('user-profile', UserProfile); 