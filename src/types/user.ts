
export interface User {
  id: string;
  email: string;
  isPremium: boolean;
  subscriptionEnds?: string;
  lastLogin?: string;
}
