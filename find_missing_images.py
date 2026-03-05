import pandas as pd

def find_and_group_missing_images():
    print("Loading recipes.csv...")
    try:
        df = pd.read_csv('data_resource/recipes.csv')
    except FileNotFoundError:
        print(" recipes.csv not found please ensure your path")
        return

    missing_images_df = df[df['Images'].astype(str).str.contains(r'character\(0\)', na=False)].copy()

    missing_images_df['Name'] = missing_images_df['Name'].fillna('Unknown Recipe')

    unique_missing_names = missing_images_df[['Name', 'RecipeCategory']].drop_duplicates(subset=['Name'])

    print(f"Find the missing images: {len(missing_images_df):,} menus")
    print(f"Reduced by cut the same name of menu: {len(unique_missing_names):,} total unique menu names")

    output_filename = 'unique_missing_images.csv'
    unique_missing_names.to_csv(output_filename, index=False)
    print(f"Saved {output_filename} successfully")

if __name__ == '__main__':
    find_and_group_missing_images()