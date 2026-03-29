# Food Assemble

A comprehensive food bookmarking, search, and recommendation web application built for the SE481 Introduction to Information Retrieval course. This project leverages modern web technologies and advanced Information Retrieval (IR) techniques to provide users with a seamless recipe discovery experience.

**Dataset Used:** The application utilizes the extensive recipe and review data available at [Food.com Recipes and Reviews Dataset on Kaggle](https://www.kaggle.com/datasets/irkaal/foodcom-recipes-and-reviews/data).

---

## Tech Stack & Architecture
- **Frontend:** Next.js (React), Tailwind CSS, Supabase Client.
- **Backend:** Python, Flask, Elasticsearch (v9.x).
- **Machine Learning & IR:** Scikit-Learn, SciPy, TF-IDF, Truncated SVD, BM25.
- **Testing:** Pytest (Backend Unit), Jest (Frontend Unit), Playwright (E2E).
- **Authentication & Database:** Supabase (PostgreSQL, Auth).

---

## Features & Rubric Implementation Details

### 1. User Authentication (UC-001)
**Implementation:** Secure user authentication is managed via **Supabase Auth**. Users can register, log in, and log out securely. The frontend uses `@supabase/supabase-js` to handle session states and protect personalized routes (e.g., Folders, Bookmarks) using Next.js middleware and Auth Guards.

### 2. Recipe Search Functionality (UC-002)
**Implementation:** The core search engine is powered by **Elasticsearch** using the **BM25 algorithm**. 
- **Multi-field Search:** When a user searches, the query is executed across multiple fields simultaneously using a `multi_match` query of type `best_fields`. Fields are weighted to prioritize relevance: Recipe Name (`Name^3`), Ingredients (`RecipeIngredientParts^2`), and Instructions (`RecipeInstructions`).
- **Highlighting:** Search results include highlighted snippets (using HTML `<b>` tags) to show exactly where the search term matched within the ingredients or instructions.

### 3. Spell Correction & Search Suggestions
**Implementation:** To handle typographical errors and guide users, the application features an automatic suggestion system.
- **Fuzzy Matching:** The Elasticsearch query utilizes `fuzziness: "AUTO"` to gracefully handle minor typos, returning relevant results even if the user misspells a dish name or ingredient.
- **Prefix Suggestions (`/api/suggest`):** As the user types, a combination of `match_phrase_prefix` and fuzzy matching is used to provide real-time autocomplete suggestions, intelligently detecting if the input is a typo or an incomplete word.

### 4. Detailed Dish Information
**Implementation:** Clicking on a recipe from the search results opens a comprehensive React Modal. This displays full recipe details including the high-resolution image, ingredients list, cooking instructions, and category, fetched directly from the Elasticsearch index.

### 5. Folder Management & Bookmarking
**Implementation:** Users can build a personalized food archive using Supabase PostgreSQL.
- **Folder Management:** Full CRUD functionality allowing users to create, edit, and delete custom folders.
- **Bookmarking with Ratings:** Within the recipe detail view, users can rate a dish (1 to 5 stars) and assign it to a specific custom folder seamlessly.

### 6. Bookmark Viewing
**Implementation:** A dedicated "Bookmarks" page allows users to view all their saved recipes across **all folders** on a single, unified page. The recipes are aggregated and dynamically displayed by joining the user's folders, saved recipes, and personal ratings.

### 7. Suggestions on Landing Page
**Implementation:** The home page instantly provides value by displaying trending or popular recipes. This is implemented by pre-computing top recipe IDs (`trending_recipe_ids.pkl`) and rapidly fetching their metadata via an Elasticsearch `terms` query (`/api/trending`).

### 8. Advanced Suggestions (Machine Learning)
**Implementation:** The application enhances discovery through personalized Machine Learning recommendations, strictly avoiding basic KNN.
- **Collaborative Filtering (SVD):** For authenticated users with interaction history, the system uses **Singular Value Decomposition (SVD)**. User and item latent factor matrices (`user_factors`, `item_factors` in `svd_recommender.pkl`) are used to calculate dot products and predict recipes the user will rate highly.
- **Content-Based Filtering (More Like This):** If the user is new but has recently bookmarked items, the system falls back to an Elasticsearch `more_like_this` query, analyzing the TF-IDF vectors of recipe names, ingredients, and categories to surface similar dishes.

### 9. Exciting IR Features (2 Additional Features)

Implementation: To provide a cutting-edge user experience, the application introduces two additional advanced Information Retrieval features beyond the core requirements:

Feature 1: AI-Powered Recipe Classification:

An advanced Machine Learning pipeline automatically categorizes recipes based on raw text.

The system extracts features using a concatenated sparse matrix consisting of TF-IDF on Titles (Word level), TF-IDF on Ingredients (Word level), and TF-IDF on Titles (Character n-gram level).

These combined features are fed into a pre-trained classification model (recipe_classifier.pkl) deployed on the Flask backend (/api/classify) to dynamically predict the culinary category of arbitrary text inputs.

Feature 2: Advanced Contextual Fallback Engine:

To solve the "Cold Start" problem in the recommendation system, the pipeline features an intelligent fallback mechanism.

If an authenticated user lacks interaction history (SVD cannot be applied), the system dynamically reads the contents of the user's currently viewed folder. It then extracts the document IDs and executes an Elasticsearch more_like_this query.

This effectively merges Collaborative Filtering with Content-Based Contextual Filtering, ensuring the user always receives highly relevant, context-aware suggestions seamlessly.

### 10. Automated Testing
**Implementation:** A robust, multi-layered testing strategy ensures application stability.
- **Backend Unit Testing:** Implemented using **Pytest** (`test_app.py`) to verify the logic and response structures of the Flask API endpoints (e.g., search parameters, ML predictions).
- **Frontend Unit Testing:** Implemented using **Jest** and React Testing Library to test isolated UI components.
- **End-to-End (E2E) Testing:** Implemented using **Playwright**. Comprehensive test suites (`user-journey.spec.ts`, `search-flow.spec.ts`) simulate real user behaviors, including logging in, searching, resolving strict-mode DOM elements, rating, and verifying bookmarks across folders.

### 11. Configuration Management
**Implementation:** The project utilizes standard Git version control with structured commits (e.g., distinguishing test additions, feature updates) and appropriate file exclusions (`.gitignore`) to ensure a clean, professional development workflow.
