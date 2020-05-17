export interface Notification {
  id: string;
  date: Date;
  notificationText: string;
  owner: { userName: string, profilePhoto: string };
  link?: string;
}
