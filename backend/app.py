from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import time
import re
from scipy.sparse import hstack
from elasticsearch import Elasticsearch
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
CORS(app)

es = Elasticsearch(
    "https://localhost:9200",
    basic_auth=("elastic", "6zoRJw9FqjrVa2hO=PP_"),
    ca_certs="http_ca.crt"
)
INDEX_NAME = "se481_recipes"

with open('models/recipe_classifier.pkl', 'rb') as f:
    classifier_data = pickle.load(f)
    clf = classifier_data['classifier']
    tfidf_title = classifier_data['tfidf_title']
    tfidf_body = classifier_data['tfidf_body']
    tfidf_char = classifier_data['tfidf_char']


def serialize_es_recipe(hit):
    source = hit["_source"]
    return {
        "RecipeId": source.get("RecipeId"),
        "Name": source.get("Name", ""),
        "Ingredients": source.get("RecipeIngredientParts", ""),
        "Instructions": source.get("RecipeInstructions", ""),
        "Category": source.get("RecipeCategory", "Unknown"),
        "Image": source.get("Image_URL", ""),
        "Score": hit.get("_score", 0)
    }


@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "ok", "message": "Elasticsearch Recipe API is running!"})


@app.route('/api/search', methods=['GET'])
def search_recipes():
    start_time = time.time()
    query = request.args.get('q', '')
    limit = int(request.args.get('limit', 10))

    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    clean_query = re.sub(r'[^\w\s]', '', query.lower())

    response = es.search(
        index=INDEX_NAME,
        body={
            "query": {
                "multi_match": {
                    "query": clean_query,
                    "fields": ["Name^3", "RecipeIngredientParts^2", "RecipeInstructions"],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            },
            "highlight": {
                "fields": {
                    "Name": {},
                    "RecipeIngredientParts": {},
                    "RecipeInstructions": {}
                },
                "pre_tags": ["<b className='text-sky-400'>"],
                "post_tags": ["</b>"]
            },
            "size": limit
        }
    )

    results = []
    for hit in response["hits"]["hits"]:
        recipe = serialize_es_recipe(hit)

        highlights = hit.get("highlight", {})
        recipe["HighlightedName"] = highlights.get("Name", [recipe["Name"]])[0]

        snippet_parts = highlights.get("RecipeIngredientParts", []) + highlights.get("RecipeInstructions", [])
        recipe["Snippet"] = " ... ".join(snippet_parts) if snippet_parts else recipe["Instructions"][:100] + "..."

        results.append(recipe)

    return jsonify({
        "query": query,
        "total_results": len(results),
        "elapsed_time_ms": round((time.time() - start_time) * 1000, 2),
        "results": results
    })


@app.route('/api/classify', methods=['POST'])
def classify_recipe():
    data = request.json
    name = data.get('name', '')
    ingredients = data.get('ingredients', '')

    if not name:
        return jsonify({"error": "Recipe 'name' is required"}), 400

    x_combined = hstack([
        tfidf_title.transform([name]),
        tfidf_body.transform([ingredients]),
        tfidf_char.transform([name])
    ])
    predicted_cat = clf.predict(x_combined)[0]

    return jsonify({"recipe_name": name, "predicted_category": predicted_cat})


@app.route('/api/suggest', methods=['GET'])
def suggest():
    query = request.args.get('q', '').lower().strip()

    if not query:
        return jsonify({"suggestions": [], "is_typo": False})

    response = es.search(
        index=INDEX_NAME,
        body={
            "query": {
                "bool": {
                    "should": [
                        {
                            "match_phrase_prefix": {
                                "Name": {
                                    "query": query,
                                    "max_expansions": 10  # หาคำที่ขึ้นต้นด้วยตัวอักษรนี้
                                }
                            }
                        },
                        {
                            "match": {
                                "Name": {
                                    "query": query,
                                    "fuzziness": "AUTO"  # เผื่อพิมพ์ผิด
                                }
                            }
                        }
                    ]
                }
            },
            "_source": ["Name"],
            "size": 5
        }
    )

    suggestions = []
    for hit in response["hits"]["hits"]:
        name = hit["_source"]["Name"]
        if name not in suggestions:
            suggestions.append(name)

    is_typo = False
    if suggestions:
        is_sub_string = any(query in s.lower() for s in suggestions)
        is_typo = not is_sub_string

    return jsonify({"suggestions": suggestions, "is_typo": is_typo})


@app.route('/api/recipes', methods=['POST'])
def get_recipes_by_ids():
    recipe_ids = request.json.get('recipe_ids', [])
    if not recipe_ids:
        return jsonify({"results": []})

    response = es.search(
        index=INDEX_NAME,
        body={
            "query": {
                "terms": {
                    "RecipeId": recipe_ids
                }
            },
            "size": len(recipe_ids)
        }
    )

    results = [serialize_es_recipe(hit) for hit in response["hits"]["hits"]]
    return jsonify({"results": results})


@app.route('/api/recipes/random', methods=['GET'])
def get_random_recipes():
    limit = int(request.args.get('limit', 20))

    response = es.search(
        index=INDEX_NAME,
        body={
            "query": {
                "function_score": {
                    "random_score": {}
                }
            },
            "size": limit
        }
    )

    results = [serialize_es_recipe(hit) for hit in response["hits"]["hits"]]
    return jsonify({"results": results, "total": len(results)})


@app.route('/api/recipes/category/<path:category>', methods=['GET'])
def get_recipes_by_category(category):
    limit = int(request.args.get('limit', 20))

    response = es.search(
        index=INDEX_NAME,
        body={
            "query": {
                "match_phrase": {
                    "RecipeCategory": category
                }
            },
            "size": limit
        }
    )

    results = [serialize_es_recipe(hit) for hit in response["hits"]["hits"]]
    return jsonify({"results": results, "category": category, "total": len(results)})

@app.route('/api/recipes/all', methods=['GET'])
def get_all_recipes():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    sort = request.args.get('sort', 'asc').lower()

    if page < 1: page = 1
    if limit < 1: limit = 20
    start = (page - 1) * limit

    response = es.search(
        index=INDEX_NAME,
        body={
            "query": {"match_all": {}},
            "sort": [{"RecipeId": {"order": sort}}],
            "from": start,
            "size": limit
        }
    )

    total = response["hits"]["total"]["value"]
    total_pages = (total + limit - 1) // limit
    results = [serialize_es_recipe(hit) for hit in response["hits"]["hits"]]

    return jsonify({
        "results": results,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages
    })


@app.route('/api/categories', methods=['GET'])
def get_categories():
    response = es.search(
        index=INDEX_NAME,
        body={
            "size": 0,
            "aggs": {
                "unique_categories": {
                    "terms": {
                        "field": "RecipeCategory",
                        "size": 100
                    }
                }
            }
        }
    )

    buckets = response["aggregations"]["unique_categories"]["buckets"]
    categories = [{"name": str(b["key"]), "count": int(b["doc_count"])} for b in buckets]
    return jsonify({"categories": categories})


@app.route('/api/recommend', methods=['POST'])
def recommend_recipes():
    recipe_ids = request.json.get('recipe_ids', [])
    limit = int(request.args.get('limit', 10))

    if not recipe_ids:
        return jsonify({"results": []})

    id_response = es.search(
        index=INDEX_NAME,
        body={
            "query": {"terms": {"RecipeId": recipe_ids}},
            "_source": False,
            "size": len(recipe_ids)
        }
    )

    es_ids = [{"_index": INDEX_NAME, "_id": hit["_id"]} for hit in id_response["hits"]["hits"]]

    if not es_ids:
        return jsonify({"results": []})

    mlt_response = es.search(
        index=INDEX_NAME,
        body={
            "query": {
                "more_like_this": {
                    "fields": ["Name", "RecipeIngredientParts", "RecipeCategory"],
                    "like": es_ids,
                    "min_term_freq": 1,
                    "max_query_terms": 25
                }
            },
            "size": limit
        }
    )

    results = [serialize_es_recipe(hit) for hit in mlt_response["hits"]["hits"]]
    return jsonify({"results": results})


if __name__ == '__main__':
    app.run(debug=True, port=5000)