export interface ProfileRow {
  id: string;
  email: string;
  created_at: string;
}

export interface ProfileInsert {
  id: string;
  email: string;
  created_at?: string;
}

export interface ProfileUpdate {
  email?: string;
}

export interface FolderRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface FolderInsert {
  id?: string;
  user_id: string;
  name: string;
  created_at?: string;
}

export interface FolderUpdate {
  name?: string;
}

export interface BookmarkRow {
  id: string;
  user_id: string;
  folder_id: string;
  recipe_id: number;
  rating: number;
  created_at: string;
}

export interface BookmarkInsert {
  id?: string;
  user_id: string;
  folder_id: string;
  recipe_id: number;
  rating: number;
  created_at?: string;
}

export interface BookmarkUpdate {
  folder_id?: string;
  rating?: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      folders: {
        Row: FolderRow;
        Insert: FolderInsert;
        Update: FolderUpdate;
      };
      bookmarks: {
        Row: BookmarkRow;
        Insert: BookmarkInsert;
        Update: BookmarkUpdate;
      };
    };
  };
}
