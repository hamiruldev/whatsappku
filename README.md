# WhatsApp CRM

WhatsApp CRM is a web application designed to manage customer relationships through WhatsApp. It provides features like automated messaging, scheduling, and integration with various APIs.

## Features

- Automated daily messages
- Customizable scheduling
- Integration with WhatsApp API
- Deployment-ready for Google Cloud Run

## Prerequisites

- Python 3.11
- Docker
- Google Cloud SDK (for deployment)

## Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/hamiruldev/whatsappku.git
   cd whatsappku
   ```

2. **Create a virtual environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   .\venv\Scripts\activate   # On Windows
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**

   Copy the example environment file and update it with your configuration.

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your preferred text editor and update the values.

5. **Run the application:**

   ```bash
   python run.py
   ```

## Docker Deployment

1. **Build the Docker image:**

   ```bash
   docker build -t whatsapp-crm .
   ```

2. **Run the Docker container:**

   ```bash
   docker run -p 8080:8080 whatsapp-crm
   ```

## Google Cloud Run Deployment

1. **Authenticate with Google Cloud:**

   ```bash
   gcloud auth login
   ```

2. **Set your project ID:**

   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Deploy using Cloud Build:**

   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any inquiries, please contact [your-email@example.com](mailto:your-email@example.com). 