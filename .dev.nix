{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "whatsapp-crm-dev-env"

  buildInputs = [
    pkgs.python311
    pkgs.python311Packages.virtualenv
    pkgs.docker
    pkgs.git
    pkgs.google-cloud-sdk
  ];

  shellHook = ''
    # Create and activate a virtual environment
    if [ ! -d "venv" ]; then
      virtualenv venv
    fi
    source venv/bin/activate

    # Install Python dependencies
    pip install --upgrade pip
    pip install -r requirements.txt

    echo "Development environment is ready. Virtual environment activated."
  '';
} 