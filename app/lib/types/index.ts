// Types will be exported here as they are created
// export * from './user';
// export * from './mentor';
// export * from './booking';

export interface User {
  user_id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
}