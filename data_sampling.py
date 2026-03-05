import pandas as pd
import os

print(" Randomizing 100,000 rows")
df = pd.read_csv('cleaned_recipes.csv')

sampled_df = df.sample(n=100000, random_state=42)

os.makedirs('cleaned_recipes_random', exist_ok=True)

print(" Splitting into 2 parts for safe upload to Supabase...")
part1 = sampled_df.iloc[:50000]
part1.to_csv('cleaned_recipes_random/recipes_upload_part1.csv', index=False)
print(" File part 1 ready (for upload)")

part2 = sampled_df.iloc[50000:]
part2.to_csv('cleaned_recipes_random/recipes_upload_part2.csv', index=False)
print(" File part 2 ready (for upload)")

print(" Complete task")