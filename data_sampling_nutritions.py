import pandas as pd

print(" Listing (recipe_id) from Recipes")
part1_recipes = pd.read_csv('cleaned_recipes_random/recipes_upload_part1.csv')
part2_recipes = pd.read_csv('cleaned_recipes_random/recipes_upload_part2.csv')

valid_recipe_ids = pd.concat([part1_recipes['recipe_id'], part2_recipes['recipe_id']])

print(" Filtering nutritions.csv to only include rows with recipe_id in the sampled recipes...")
nutritions_df = pd.read_csv('cleaned_nutritions.csv')

filtered_nutritions = nutritions_df[nutritions_df['recipe_id'].isin(valid_recipe_ids)]

filtered_nutritions.to_csv('cleaned_recipes_random/nutritions_upload_full.csv', index=False)

print(" Complete task: nutritions_upload_full.csv ready for upload to Supabase")