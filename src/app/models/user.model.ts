export interface User {
  uid: string;
  userPhoto: string;
  userPhotoStoragePath: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  birthdate?: Date;
  country?: string;
  aboutMe?: string;
  hiringAvailability: boolean;
  socialLinks?: {
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    tumblr?: string;
  };
  notificationsByEmail: boolean;
  newsletterSubscription: boolean;
}

export interface GeneralData {
  userName: string;
  userPhoto: string;
  email: string;
  country: string;
  aboutMe: string;
  hiringAvailability: boolean;
  socialLinks: {
    facebook: string;
    instagram: string;
    tumblr: string;
    twitter: string;
    website: string;
  };
  photosNum: number;
  likesNum: number;
  viewsNum: number;
  followersNum: number;
  signoutTime: Date;
}

// export interface User {
//   id: string;
//   profilePhoto: string;
//   name: string;
//   photosNum: number;
//   views: number;
//   likes: number;
//   photos?: Photo[];
//   gallery?: Collection[];
//   notifications?: Notification[];
//   followers?: FollowersFriends[];
//   friends?: FollowersFriends[];
//   jobs?: Job[];
//   accountSettings: Settings;
//   email: string;
//   birthdate: Date;
// }

