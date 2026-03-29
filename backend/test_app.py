import pytest
from app import app


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_home_endpoint(client):
    response = client.get('/')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'


def test_search_recipes(client):
    response = client.get('/api/search?q=chicken&limit=5')
    assert response.status_code == 200

    data = response.json
    assert data['query'] == 'chicken'
    assert 'results' in data
    if len(data['results']) > 0:
        assert 'HighlightedName' in data['results'][0]


def test_suggest_typo(client):
    response = client.get('/api/suggest?q=chiken')
    assert response.status_code == 200

    data = response.json
    assert 'suggestions' in data
    assert 'is_typo' in data

    assert type(data['is_typo']) == bool


def test_random_recipes(client):
    response = client.get('/api/recipes/random?limit=3')
    assert response.status_code == 200

    data = response.json
    assert len(data['results']) <= 3
    if len(data['results']) > 0:
        assert 'RecipeId' in data['results'][0]
        assert 'Name' in data['results'][0]


def test_classify_recipe(client):
    mock_data = {
        "name": "Spicy Thai Tom Yum",
        "ingredients": "shrimp, mushroom, lemongrass, chili, lime"
    }
    response = client.post('/api/classify', json=mock_data)
    assert response.status_code == 200

    data = response.json
    assert data['recipe_name'] == "Spicy Thai Tom Yum"
    assert 'predicted_category' in data


def test_recommend_ml(client):
    mock_data = {
        "user_id": "new_user_999",
        "recent_bookmarks": [38, 45]
    }

    response = client.post('/api/recommend/ml?limit=4', json=mock_data)
    assert response.status_code == 200

    data = response.json
    assert 'results' in data
    assert 'is_personalized' in data

    assert len(data['results']) <= 4

    assert data['is_personalized'] == True

def test_get_recipes_by_ids(client):
    mock_data = {
        "recipe_ids": [38, 45]
    }
    response = client.post('/api/recipes', json=mock_data)
    assert response.status_code == 200

    data = response.json
    assert 'results' in data

    if len(data['results']) > 0:
        assert 'RecipeId' in data['results'][0]

def test_get_recipes_by_category(client):
    response = client.get('/api/recipes/category/Dessert?limit=2')
    assert response.status_code == 200

    data = response.json
    assert 'results' in data
    assert data['category'] == 'Dessert'
    assert 'total' in data
    assert len(data['results']) <= 2

def test_get_all_recipes(client):
    response = client.get('/api/recipes/all?limit=2&page=1')
    assert response.status_code == 200

    data = response.json
    assert 'results' in data
    assert 'total' in data
    assert data['page'] == 1
    assert len(data['results']) <= 2

def test_get_categories(client):
    response = client.get('/api/categories')
    assert response.status_code == 200

    data = response.json
    assert 'categories' in data
    if len(data['categories']) > 0:
        assert 'name' in data['categories'][0]
        assert 'count' in data['categories'][0]

def test_recommend_recipes_base(client):
    mock_data = {
        "recipe_ids": [38]
    }
    response = client.post('/api/recommend?limit=3', json=mock_data)
    assert response.status_code == 200

    data = response.json
    assert 'results' in data
    assert len(data['results']) <= 3

def test_get_trending(client):
    response = client.get('/api/trending?limit=3')
    assert response.status_code == 200

    data = response.json
    assert 'results' in data
    assert len(data['results']) <= 3