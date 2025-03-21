# Quran Tafseer Chatbot

This project is an interactive web application that provides Quranic tafseer (exegesis) through a chatbot interface. Users can search for specific verses, browse through surahs, and get interpretations from various tafseer sources.

## Features

- **Interactive Chatbot**: Ask questions about Quranic verses or concepts
- **Verse Search**: Search for specific verses by reference (e.g., "2:255")
- **Surah Browsing**: Navigate through Quranic surahs and their verses
- **Multiple Tafseer Sources**: Access interpretations from various scholars
- **Mobile-Optimized Interface**: Responsive design for all devices
- **Expanded View**: Full-screen mode for better reading experience
- **Verse Navigation**: Easy navigation between verses within surahs

## Technologies Used

- **Backend**: Python with Flask web framework
- **Natural Language Processing**: TF-IDF for semantic matching
- **Data Processing**: Pandas for dataset manipulation
- **Frontend**: HTML, CSS, and JavaScript
- **Dataset**: Uses the [riotu-lab/Quran-Tafseers](https://huggingface.co/datasets/riotu-lab/Quran-Tafseers) dataset

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/baraakh30/QuranTafseerBot.git
   cd QuranTafseerBot
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python wsgi.py
   ```

4. Open your browser and navigate to `http://127.0.0.1:5000/`

## Docker Deployment

The project includes a Dockerfile for containerized deployment:

```bash
# Pull the pre-built image
docker pull baraakh/quran:latest

# Run the container
docker run -p 5000:5000 baraakh/quran:latest

# Or build your own image
docker build -t quran-tafseer-bot .
docker run -p 5000:5000 quran-tafseer-bot
```

## Project Structure

```
QuranTafseerBot/
├── app/
│   ├── __init__.py         # Flask initialization
│   ├── bot.py              # Core chatbot logic with TF-IDF model
│   ├── routes.py           # API endpoints and routing
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css  # Application styling
│   │   ├── js/
│   │   │   └── index.js    # Client-side interaction logic
│   │   └── images/
│   │       └── icon.png    # App icon
│   ├── data/               # Dataset storage
│   │   └── tafseer/
│   ├── models/             # Serialized model storage
│   └── templates/
│       └── index.html      # Main HTML template
├── wsgi.py                 # WSGI entry point
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container configuration
└── README.md               # Project documentation
```

## Usage

### Chatbot Interface

- Type a verse reference (e.g., "2:255") or ask a question about the Quran
- Select a specific tafseer source from the dropdown menu
- Use the suggestions for quick access to common queries

### Surah Browser

1. Select a surah from the dropdown menu
2. Click "Browse" to view the verses
3. Navigate between pages using the pagination controls
4. Use the ayah navigation bar to jump to specific verses

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Links

- **GitHub Repository**: [https://github.com/baraakh30/QuranTafseerBot](https://github.com/baraakh30/QuranTafseerBot)
- **Docker Hub**: [baraakh/quran:latest](https://hub.docker.com/r/baraakh/quran)

## Acknowledgements

- The project uses the [riotu-lab/Quran-Tafseers](https://huggingface.co/datasets/riotu-lab/Quran-Tafseers) dataset
- Arabic text processing is handled by custom normalization algorithms

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.