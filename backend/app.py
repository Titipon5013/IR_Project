from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle
import time
import re
from scipy.sparse import hstack

app = Flask(__name__)
CORS(app)

print("Starting Flask Server and loading models into memory...")

df = pd.read_csv('../data_resource/preprocessed_recipes.csv')

df['clean_text'] = df['clean_text'].fillna('')
df['RecipeIngredientParts'] = df['RecipeIngredientParts'].fillna('')
df['RecipeInstructions'] = df['RecipeInstructions'].fillna('')
df['Image_URL'] = df['Image_URL'].fillna('https://images.unsplash.com/photo-1495195134817-a169d25fb25b?w=800&q=80')
df['RecipeCategory'] = df['RecipeCategory'].fillna('Unknown')

with open('models/bm25_model.pkl', 'rb') as f:
    bm25 = pickle.load(f)

with open('models/recipe_classifier.pkl', 'rb') as f:
    classifier_data = pickle.load(f)
    clf = classifier_data['classifier']
    tfidf_title = classifier_data['tfidf_title']
    tfidf_body = classifier_data['tfidf_body']
    tfidf_char = classifier_data['tfidf_char']

print("Building Vocabulary for Auto-Suggest...")
vocab = set()
for text in df['Name'].fillna('').str.lower().str.split():
    for word in text:
        clean_word = re.sub(r'[^\w\s]', '', word)
        if clean_word and len(clean_word) > 2:
            vocab.add(clean_word)
suggest_list = sorted(list(vocab))

print("All models and data loaded successfully! Server is ready.")

def generate_snippet(text, query_terms):
    if not text: return ""
    lower_text = text.lower()

    match_idx = -1
    for term in query_terms:
        idx = lower_text.find(term)
        if idx != -1 and (match_idx == -1 or idx < match_idx):
            match_idx = idx

    if match_idx == -1:
        snippet = text[:100] + "..."
    else:
        start = max(0, match_idx - 50)
        end = min(len(text), match_idx + 100)
        snippet = text[start:end]
        if start > 0: snippet = "..." + snippet
        if end < len(text): snippet = snippet + "..."

    for term in query_terms:
        snippet = re.sub(f'({re.escape(term)})', r'<b>\1</b>', snippet, flags=re.IGNORECASE)

    return snippet

@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "ok", "message": "Recipe Backend API is running!"})

@app.route('/api/search', methods=['GET'])
def search_recipes():
    start_time = time.time()

    query = request.args.get('q', '')
    limit = int(request.args.get('limit', 10))

    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    clean_query = re.sub(r'[^\w\s]', '', query.lower())
    tokenized_query = clean_query.split()

    scores = bm25.get_scores(tokenized_query)
    top_indices = scores.argsort()[::-1][:limit]

    results = []
    for idx in top_indices:
        if scores[idx] > 0:
            recipe = df.iloc[idx]

            source_text = recipe['RecipeIngredientParts'] + " " + recipe['RecipeInstructions']
            snippet = generate_snippet(source_text, tokenized_query)
            highlighted_name = generate_snippet(recipe['Name'], tokenized_query)

            results.append({
                "RecipeId": int(recipe['RecipeId']),
                "Name": recipe['Name'],
                "HighlightedName": highlighted_name if "<b>" in highlighted_name else recipe['Name'],
                "Snippet": snippet,
                "Score": float(scores[idx]),
                "Image": recipe['Image_URL'],
                "Category": recipe['RecipeCategory']
            })

    elapsed_time = (time.time() - start_time) * 1000

    return jsonify({
        "query": query,
        "total_results": len(results),
        "elapsed_time_ms": round(elapsed_time, 2),
        "results": results
    })

@app.route('/api/classify', methods=['POST'])
def classify_recipe():
    data = request.json
    name = data.get('name', '')
    ingredients = data.get('ingredients', '')

    if not name:
        return jsonify({"error": "Recipe 'name' is required"}), 400

    x_title = tfidf_title.transform([name])
    x_body = tfidf_body.transform([ingredients])
    x_char = tfidf_char.transform([name])

    x_combined = hstack([x_title, x_body, x_char])
    predicted_cat = clf.predict(x_combined)[0]

    return jsonify({
        "recipe_name": name,
        "predicted_category": predicted_cat
    })

@app.route('/api/suggest', methods=['GET'])
def suggest():
    query = request.args.get('q', '').lower().strip()
    if not query or len(query) < 2:
        return jsonify({"suggestions": []})

    matches = [word for word in suggest_list if word.startswith(query)][:5]
    return jsonify({"suggestions": matches})

@app.route('/api/recipes', methods=['POST'])
def get_recipes_by_ids():
    data = request.json
    recipe_ids = data.get('recipe_ids', [])

    if not recipe_ids:
        return jsonify({"results": []})

    matched_recipes = df[df['RecipeId'].isin(recipe_ids)]

    results = []
    for _, recipe in matched_recipes.iterrows():
        results.append({
            "RecipeId": int(recipe['RecipeId']),
            "Name": str(recipe['Name']),
            "Ingredients": str(recipe['RecipeIngredientParts']),
            "Instructions": str(recipe['RecipeInstructions']),
            "Category": str(recipe['RecipeCategory']),
            "Image": str(recipe['Image_URL'])
        })

    return jsonify({"results": results})

if __name__ == '__main__':
    app.run(debug=True, port=5000)