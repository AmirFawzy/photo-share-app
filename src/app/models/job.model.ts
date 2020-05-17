export interface Job {
  id: string;
  ownerId: string;
  title: string;
  companyName?: string;
  country: string;
  city?: string;
  vacancy: number;
  salary: number;
  description: string;
  contacts: string;
  period: string;
  published: Date;
  roles?: { [userId: string]: string };
}
