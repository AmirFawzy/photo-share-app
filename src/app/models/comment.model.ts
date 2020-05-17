export interface Comment {
  id: string;
  owner: { id: string, userPhoto?: string, userName?: string };
  comment: string;
  publishedDate: Date;
  parentCommentId?: string;
  replays?: Comment[];
}
