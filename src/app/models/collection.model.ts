export interface Collection {
  id: string;
  title: string;
  owner: { id: string };
  keywords?: string[];
  description?: string;
  cover: {
    id: string;
    thumUrl: string;
    originalUrl: string;
  };
  photos: string[];
  publishedDate: Date;
  privacy?: string;
  roles: { [key: string]: string };
}
