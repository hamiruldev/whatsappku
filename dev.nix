{ pkgs }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.python311
    pkgs.python311Packages.virtualenv
    pkgs.docker
    pkgs.git
    pkgs.google-cloud-sdk
  ];

  # Sets environment variables in the workspace
  env = {
    FLASK_APP = "run.py";
    FLASK_ENV = "development";
    SECRET_KEY = "your-secret-key-here";
    WAHA_API_URL = "https://my-app-352501285879.asia-southeast1.run.app";
    WAHA_SESSION = "session";
    PROJECT_ID = "my-app-352501285879";
    REGION = "asia-southeast1";
    POCKETBASE_URL = "https://hamirulhafizal.pockethost.io";
    PUBLIC_GOLD_URL = "https://publicgold.com.my/";
  };

  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # Add any VS Code extensions you need here
    ];
    workspace = {
      # Runs when a workspace is first created with this `dev.nix` file
      onCreate = {
        # Create and activate a virtual environment
        setup = ''
          if [ ! -d "venv" ]; then
            virtualenv venv
          fi
          source venv/bin/activate

          # Install Python dependencies
          pip install --upgrade pip
          pip install -r requirements.txt

          echo "Development environment is ready. Virtual environment activated."
        '';
        # Open editors for the following files by default, if they exist:
        default.openFiles = [ "README.md" "app/controllers/whatsapp.py" ];
      };
      # To run something each time the workspace is (re)started, use the `onStart` hook
      onStart = {
        # Example: start the Flask server
        start-flask = "flask run";
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "flask" "run" "--port" "$PORT" "--host" "0.0.0.0" ];
          manager = "web";
        };
      };
    };
  };
} 