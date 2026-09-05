"""
Email / SMS Spam Detector — Flask Web App
------------------------------------------
Serves the trained TF-IDF + Multinomial Naive Bayes model
(model.pkl / vectorizer.pkl) that was produced in
`emailspamdetection.ipynb`. The ML model itself is NOT modified —
this file only wires it up to a Flask backend + modern UI.
"""

import os
import string
import pickle

import nltk
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer

from flask import Flask, render_template, request, jsonify

# ----------------------------------------------------------------------
# NLTK setup (safe to call every boot — no-ops if already downloaded)
# ----------------------------------------------------------------------
for pkg in ["punkt", "punkt_tab", "stopwords"]:
    try:
        nltk.data.find(
            f"tokenizers/{pkg}" if "punkt" in pkg else f"corpora/{pkg}"
        )
    except LookupError:
        nltk.download(pkg, quiet=True)

ps = PorterStemmer()
STOP_WORDS = set(stopwords.words("english"))
PUNCTUATION = set(string.punctuation)

# ----------------------------------------------------------------------
# Load the exact model + vectorizer trained in the notebook
# ----------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "model", "vectorizer.pkl")

with open(VECTORIZER_PATH, "rb") as f:
    tfidf = pickle.load(f)

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)


def transform_text(text: str) -> str:
    """
    Identical preprocessing pipeline used during training:
    lowercase -> tokenize -> keep alnum -> drop stopwords/punctuation -> stem
    """
    text = text.lower()
    text = nltk.word_tokenize(text)

    tokens = [t for t in text if t.isalnum()]
    tokens = [t for t in tokens if t not in STOP_WORDS and t not in PUNCTUATION]
    tokens = [ps.stem(t) for t in tokens]

    return " ".join(tokens)


# ----------------------------------------------------------------------
# Flask app
# ----------------------------------------------------------------------
app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({"error": "Please enter a message to analyze."}), 400

    transformed = transform_text(message)

    # Guard against an empty string after cleaning (e.g. message was only stopwords)
    if not transformed:
        return jsonify(
            {
                "prediction": "ham",
                "label": 0,
                "confidence": 50.0,
                "message": message,
            }
        )

    vector_input = tfidf.transform([transformed])
    result = model.predict(vector_input)[0]

    confidence = 50.0
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(vector_input)[0]
        confidence = round(float(max(proba)) * 100, 2)

    prediction = "spam" if result == 1 else "ham"

    return jsonify(
        {
            "prediction": prediction,
            "label": int(result),
            "confidence": confidence,
            "message": message,
        }
    )


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)
