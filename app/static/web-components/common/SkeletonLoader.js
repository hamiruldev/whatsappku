class SkeletonLoader extends HTMLElement {
  constructor() {
    super();
    this.rows = parseInt(this.getAttribute('rows') || '3');
    this.columns = parseInt(this.getAttribute('columns') || '4');
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <style>
        .skeleton-loader {
          width: 100%;
          padding: 1rem;
        }
        
        .skeleton-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          animation: pulse 1.5s infinite;
        }
        
        .skeleton-cell {
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          flex: 1;
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      </style>
      
      <div class="skeleton-loader">
        ${Array(this.rows).fill().map(() => `
          <div class="skeleton-row">
            ${Array(this.columns).fill().map(() => `
              <div class="skeleton-cell"></div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }
}

customElements.define('skeleton-loader', SkeletonLoader); 