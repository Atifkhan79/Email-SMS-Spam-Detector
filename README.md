# 🛡️ SpamShield — Email/SMS Spam Detector

A machine learning web app that classifies any email or SMS message as **spam** or **ham (safe)** in real time, served through a Flask backend with a modern, animated dark-themed UI.

The ML model (TF-IDF + Multinomial Naive Bayes) was trained separately in `emailspamdetection.ipynb` and is loaded as-is — this repo just wraps it in a production-style web app.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.x-black)
![scikit--learn](https://img.shields.io/badge/scikit--learn-1.8-orange)

## ✨ Features

- **Live scanner UI** — paste a message, get an instant verdict with an animated confidence gauge
- **Modern, animated dark UI** — radar-style ambient background, scanning-line effect, animated stats, scroll reveals
- **Flask REST route** (`/predict`) that runs the exact preprocessing pipeline from the notebook (lowercase → tokenize → strip stopwords/punctuation → stem → TF-IDF → Naive Bayes)
- **No changes to the trained model** — `model.pkl` and `vectorizer.pkl` are used exactly as exported from the notebook
- Fully responsive, keyboard accessible, and respects `prefers-reduced-motion`

## 🗂️ Project structure

```
spam-detector/
├── app.py                       # Flask app + prediction route
├── requirements.txt
├── model/
│   ├── model.pkl                 # trained MultinomialNB (unchanged)
│   └── vectorizer.pkl            # trained TfidfVectorizer (unchanged)
├── templates/
│   └── index.html                # UI markup
├── static/
│   ├── css/style.css              # theme + animations
│   └── js/script.js               # scan logic, gauge animation
├── spam.csv                      # original training dataset
├── emailspamdetection.ipynb      # original notebook (model training / EDA)
└── README.md
```

## 🚀 Getting started

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/spamshield.git
cd spamshield

# 2. Create & activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

> On first run, the app will automatically download the required NLTK data (`punkt`, `punkt_tab`, `stopwords`) if it isn't already present.

## 🧠 How it works

1. **Clean & tokenize** — the message is lowercased, tokenized, stripped of stopwords/punctuation, and stemmed with a Porter stemmer.
2. **Vectorize** — the cleaned tokens are transformed into a TF-IDF vector using the saved `vectorizer.pkl`.
3. **Classify** — the vector is scored by the saved `model.pkl` (Multinomial Naive Bayes), returning a `spam`/`ham` label and a confidence percentage.

## 🔌 API

`POST /predict`

```json
// Request
{ "message": "Congratulations! You've won a free prize, click here!" }

// Response
{
  "prediction": "spam",
  "label": 1,
  "confidence": 98.42,
  "message": "Congratulations! You've won a free prize, click here!"
}
```

## 🛠️ Tech stack

- **Backend:** Flask
- **ML:** scikit-learn (TF-IDF, Multinomial Naive Bayes), NLTK
- **Frontend:** vanilla HTML/CSS/JS (no framework), Google Fonts (Space Grotesk, JetBrains Mono, Inter)

## 📄 License

MIT — feel free to use this for learning or as a portfolio project.
