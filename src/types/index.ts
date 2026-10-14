export interface Project {
  id: string;
  classId: string;
  title: string;
  description: string;
  appUrl: string;
  authorUid: string;
  authorNickname: string;
  aiTools?: string[];
  promptTip?: string;
  reviewCount: number;
  ratingSum: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  projectId: string;
  reviewerUid: string;
  reviewerNickname: string;
  rating: number; // 1 to 5 integer
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSession {
  classId: string;
  name: string;
  status: 'active' | 'closed';
  joinCode?: string;
  instructorEmail?: string;
  createdAt?: string;
}

export interface UserSession {
  uid: string;
  nickname: string;
  role: 'student' | 'instructor';
  classId: string;
  className: string;
  email?: string;
  isAnonymous: boolean;
}
