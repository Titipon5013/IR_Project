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