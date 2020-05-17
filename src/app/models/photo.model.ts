import { Camera } from './camera.model';
import { Software } from './software.model';

export interface Photo {
  id: string;
  title: string;
  photo: { storagePath: string, downloadUrl: string, photoExt: string };
  thumbnails: { [key: string]: { storagePath: string, downloadUrl: string } };
  views: number;
  likes: number;
  owner: { id: string, userName: string, profilePhoto: string };
  description?: string;
  keywords?: string[];
  collections: string[];
  location?: string;
  locationDetails?: string;
  publishedDate: Date;
  isNodity: boolean;
  camera?: Camera;
  tools?: string[];
  software?: Software[] | string[];
  roles: { [key: string]: string };  // for security roles in db
}
