import pandas as pd
import json
import re
import ast

print(" Starting Data Cleaning & Feature Engineering...")

df = pd.read_csv('data_resource/recipes.csv')


def clean_array_column(text):
    if pd.isna(text) or 'character(0)' in str(text):
        return json.dumps([])

    text = str(text)
    if text.startswith('c('):
        text = '[' + text[2:-1] + ']'

    try:
        parsed = ast.literal_eval(text)
        if isinstance(parsed, list):
            return json.dumps(parsed)
    except:
        pass

    return json.dumps([])


print(" Cleaning column Images, Ingredients and Instructions...")
df['Images'] = df['Images'].apply(clean_array_column)
df['RecipeIngredientParts'] = df['RecipeIngredientParts'].apply(clean_array_column)
df['RecipeInstructions'] = df['RecipeInstructions'].apply(clean_array_column)

print(" Processing Feature Engineering create column search_text...")
df['Name'] = df['Name'].fillna('')
df['search_text'] = (df['Name'] + " " +
                     df['RecipeIngredientParts'].astype(str) + " " +
                     df['RecipeInstructions'].astype(str)).str.lower()

df['search_text'] = df['search_text'].apply(lambda x: re.sub(r'[^\w\s]', '', x))

print(" Split 2 part following Database Schema...")
recipes_cols = ['RecipeId', 'Name', 'Description', 'Images', 'RecipeCategory',
                'RecipeIngredientParts', 'RecipeInstructions', 'PrepTime', 'CookTime', 'TotalTime', 'search_text']
recipes_df = df[recipes_cols].copy()
recipes_df.columns = ['recipe_id', 'name', 'description', 'images', 'recipe_category',
                      'ingredients', 'instructions', 'prep_time', 'cook_time', 'total_time', 'search_text']
recipes_df.to_csv('cleaned_recipes.csv', index=False)

nutritions_cols = ['RecipeId', 'Calories', 'FatContent', 'SugarContent', 'ProteinContent', 'CarbohydrateContent',
                   'FiberContent']
nutritions_df = df[nutritions_cols].copy()
nutritions_df.columns = ['recipe_id', 'calories', 'fat_content', 'sugar_content', 'protein_content',
                         'carbohydrate_content', 'fiber_content']
nutritions_df.to_csv('cleaned_nutritions.csv', index=False)

print(" Complete cleaned_recipes.csv and cleaned_nutritions.csv are generated.")