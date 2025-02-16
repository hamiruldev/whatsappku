class AuthMiddleware extends HTMLElement {
  constructor() {
    super();
    this.checkAuth();
  }

  async checkAuth() {
    const publicPaths = ['/login', '/register', '/forgot-password', '/verify-email'];
    
    if (publicPaths.includes(window.location.pathname)) {
      // Check if user is already authenticated
      if (await authAPI.isValidSession()) {
        const user = await authAPI.getCurrentUser();
        window.location.href = user.isAdmin ? '/dashboard' : '/';
      }
      return;
    }

    // Check authentication for protected routes
    if (!await authAPI.isValidSession()) {
      window.location.href = '/login';
      return;
    }

    // Check authorization based on user role
    const user = await authAPI.getCurrentUser();
    
    // Admin-only routes
    const adminRoutes = ['/dashboard/users', '/dashboard/settings'];
    if (adminRoutes.includes(window.location.pathname) && !user.isAdmin) {
      window.location.href = '/';
    }
  }
}

customElements.define('auth-middleware', AuthMiddleware); 