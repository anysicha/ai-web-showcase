import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './config';
import { Project, Review, UserSession } from '../types';
import { findClassByCode } from './classApi';

export const ADMIN_EMAIL = 'anysicha123@gmail.com';

/**
 * Join class by verifying code with server API and signing in anonymously
 */
export async function joinClassWithCode(code: string, nickname: string): Promise<UserSession> {
  let currentUser: User | null = auth.currentUser;

  // 1. Ensure authenticated session (Anonymous Auth)
  if (!currentUser) {
    try {
      const userCred = await signInAnonymously(auth);
      currentUser = userCred.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('admin-restricted-operation') || msg.includes('operation-not-allowed')) {
        throw new Error(
          'Firebase Console에서 [익명 인증(Anonymous Authentication)]이 아직 활성화되지 않았습니다. Firebase 콘솔 > Build > Authentication > Sign-in method에서 익명 로그인을 켜주세요.'
        );
      }
      throw new Error(`익명 인증 실패: ${msg}`);
    }
  }

  // 2. Verify join code against Firestore class list
  const matched = await findClassByCode(code);
  if (!matched) {
    throw new Error('유효하지 않은 참여 코드입니다. 강사에게 전달받은 코드를 다시 확인해주세요.');
  }
  if (matched.status === 'closed') {
    throw new Error('해당 수업은 이미 종료되었거나 등록이 마감되었습니다.');
  }
  const classId = matched.classId;
  const className = matched.name;

  // 3. Register membership in Firestore
  const memberRef = doc(db, 'classes', classId, 'members', currentUser.uid);
  try {
    await setDoc(
      memberRef,
      {
        uid: currentUser.uid,
        nickname: nickname.trim(),
        role: 'student',
        joinedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `classes/${classId}/members/${currentUser.uid}`);
  }

  // 4. Save local session cache
  const session: UserSession = {
    uid: currentUser.uid,
    nickname: nickname.trim(),
    role: 'student',
    classId,
    className,
    isAnonymous: true,
  };
  localStorage.setItem('vibe_showcase_session', JSON.stringify(session));

  return session;
}

/**
 * Sign in as Instructor with Google
 */
export async function signInAsInstructor(): Promise<UserSession> {
  const provider = new GoogleAuthProvider();
  let userCred;
  try {
    userCred = await signInWithPopup(auth, provider);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Google 로그인 오류: ${msg}`);
  }

  const user = userCred.user;
  const email = user.email || '';
  const isInstructor = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Create admin entry in Firestore if authorized
  if (isInstructor) {
    const adminRef = doc(db, 'admins', user.uid);
    try {
      await setDoc(adminRef, {
        email,
        role: 'admin',
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } catch {
      // Ignored if rules prevent or already created
    }
  }

  const session: UserSession = {
    uid: user.uid,
    nickname: user.displayName || email.split('@')[0] || '강사',
    role: isInstructor ? 'instructor' : 'student',
    classId: 'c_vibe_starter',
    className: 'AI 바이브 코딩 쇼케이스',
    email,
    isAnonymous: false,
  };

  localStorage.setItem('vibe_showcase_session', JSON.stringify(session));
  return session;
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
  localStorage.removeItem('vibe_showcase_session');
}

/**
 * Listen to projects in class.
 * Rating stats are computed from each project's reviews subcollection, since
 * reviewers are not allowed (by Firestore rules) to write to others' project docs.
 */
export function subscribeProjects(
  classId: string,
  onUpdate: (projects: Project[]) => void,
  onError?: (err: unknown) => void
) {
  const collRef = collection(db, 'classes', classId, 'projects');
  const q = query(collRef, orderBy('createdAt', 'desc'));

  let baseProjects: Project[] = [];
  const stats = new Map<string, { count: number; sum: number }>();
  const reviewUnsubs = new Map<string, () => void>();

  const emit = () => {
    onUpdate(
      baseProjects.map((p) => {
        const st = stats.get(p.id);
        if (!st) return p;
        return {
          ...p,
          reviewCount: st.count,
          ratingSum: st.sum,
          averageRating: st.count > 0 ? Number((st.sum / st.count).toFixed(1)) : 0,
        };
      })
    );
  };

  const unsubProjects = onSnapshot(
    q,
    (snapshot) => {
      baseProjects = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          classId,
          title: data.title || '',
          description: data.description || '',
          appUrl: data.appUrl || '',
          authorUid: data.authorUid || '',
          authorNickname: data.authorNickname || '',
          aiTools: data.aiTools || [],
          promptTip: data.promptTip || '',
          reviewCount: data.reviewCount || 0,
          ratingSum: data.ratingSum || 0,
          averageRating: data.averageRating || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      });

      const ids = new Set(baseProjects.map((p) => p.id));
      for (const [id, unsub] of reviewUnsubs) {
        if (!ids.has(id)) {
          unsub();
          reviewUnsubs.delete(id);
          stats.delete(id);
        }
      }
      for (const id of ids) {
        if (reviewUnsubs.has(id)) continue;
        const reviewsRef = collection(db, 'classes', classId, 'projects', id, 'reviews');
        reviewUnsubs.set(
          id,
          onSnapshot(
            reviewsRef,
            (rs) => {
              let sum = 0;
              rs.docs.forEach((r) => (sum += Number(r.data().rating) || 0));
              stats.set(id, { count: rs.size, sum });
              emit();
            },
            (err) => console.error(err)
          )
        );
      }
      emit();
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `classes/${classId}/projects`);
    }
  );

  return () => {
    unsubProjects();
    reviewUnsubs.forEach((unsub) => unsub());
    reviewUnsubs.clear();
  };
}

/**
 * Save or update student project (Enforces 1 project per student: ID is p_{uid})
 */
export async function saveStudentProject(
  classId: string,
  data: {
    title: string;
    description: string;
    appUrl: string;
    aiTools: string[];
    promptTip: string;
  },
  session: UserSession
): Promise<string> {
  const projectId = `p_${session.uid}`;
  const docRef = doc(db, 'classes', classId, 'projects', projectId);

  // Validate URL format
  if (!/^https?:\/\/.+/i.test(data.appUrl.trim())) {
    throw new Error('유효한 웹앱 URL을 입력해주세요 (http:// 또는 https://로 시작해야 합니다).');
  }

  let existingSnap;
  try {
    existingSnap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `classes/${classId}/projects/${projectId}`);
  }

  const now = new Date().toISOString();

  if (existingSnap.exists()) {
    const prev = existingSnap.data();
    try {
      await setDoc(
        docRef,
        {
          title: data.title.trim().slice(0, 60),
          description: data.description.trim().slice(0, 200),
          appUrl: data.appUrl.trim(),
          authorUid: session.uid,
          authorNickname: session.nickname,
          aiTools: data.aiTools.slice(0, 6),
          promptTip: data.promptTip.trim().slice(0, 500),
          reviewCount: prev.reviewCount ?? 0,
          ratingSum: prev.ratingSum ?? 0,
          averageRating: prev.averageRating ?? 0,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classes/${classId}/projects/${projectId}`);
    }
  } else {
    try {
      await setDoc(docRef, {
        title: data.title.trim().slice(0, 60),
        description: data.description.trim().slice(0, 200),
        appUrl: data.appUrl.trim(),
        authorUid: session.uid,
        authorNickname: session.nickname,
        aiTools: data.aiTools.slice(0, 6),
        promptTip: data.promptTip.trim().slice(0, 500),
        reviewCount: 0,
        ratingSum: 0,
        averageRating: 0,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `classes/${classId}/projects/${projectId}`);
    }
  }

  return projectId;
}

/**
 * Delete project
 */
export async function deleteStudentProject(classId: string, projectId: string): Promise<void> {
  const docRef = doc(db, 'classes', classId, 'projects', projectId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `classes/${classId}/projects/${projectId}`);
  }
}

/**
 * Subscribe to project reviews
 */
export function subscribeReviews(
  classId: string,
  projectId: string,
  onUpdate: (reviews: Review[]) => void,
  onError?: (err: unknown) => void
) {
  const collRef = collection(db, 'classes', classId, 'projects', projectId, 'reviews');
  const q = query(collRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const reviews: Review[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          projectId,
          reviewerUid: data.reviewerUid || '',
          reviewerNickname: data.reviewerNickname || '',
          rating: Number(data.rating) || 5,
          comment: data.comment || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      });
      onUpdate(reviews);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `classes/${classId}/projects/${projectId}/reviews`);
    }
  );
}

/**
 * Submit or update a peer review with atomic rating calculation
 */
export async function submitPeerReview(
  classId: string,
  projectId: string,
  rating: number,
  comment: string,
  session: UserSession
): Promise<void> {
  const projectRef = doc(db, 'classes', classId, 'projects', projectId);
  const reviewRef = doc(db, 'classes', classId, 'projects', projectId, 'reviews', session.uid);

  // Validate rating: 1 to 5 integer
  const roundedRating = Math.round(Number(rating));
  if (isNaN(roundedRating) || roundedRating < 1 || roundedRating > 5) {
    throw new Error('별점은 1점부터 5점까지의 정수여야 합니다.');
  }

  if (!comment || comment.trim().length < 2) {
    throw new Error('2자 이상의 리뷰 의견을 남겨주세요.');
  }

  const now = new Date().toISOString();

  try {
    await runTransaction(db, async (tx) => {
      const projSnap = await tx.get(projectRef);
      if (!projSnap.exists()) {
        throw new Error('존재하지 않는 작품입니다.');
      }
      const projData = projSnap.data();

      // Rule: Cannot review own project
      if (projData.authorUid === session.uid) {
        throw new Error('자신의 작품에는 리뷰를 등록할 수 없습니다.');
      }

      const existingReviewSnap = await tx.get(reviewRef);
      const isUpdate = existingReviewSnap.exists();

      // Write review document
      tx.set(
        reviewRef,
        {
          projectId,
          reviewerUid: session.uid,
          reviewerNickname: session.nickname,
          rating: roundedRating,
          comment: comment.trim().slice(0, 300),
          createdAt: isUpdate ? existingReviewSnap.data()?.createdAt || now : now,
          updatedAt: now,
        },
        { merge: true }
      );
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `classes/${classId}/projects/${projectId}/reviews/${session.uid}`);
  }
}

/**
 * Delete a review with atomic calculation adjustment
 */
export async function deletePeerReview(
  classId: string,
  projectId: string,
  reviewId: string
): Promise<void> {
  const reviewRef = doc(db, 'classes', classId, 'projects', projectId, 'reviews', reviewId);

  try {
    await deleteDoc(reviewRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `classes/${classId}/projects/${projectId}/reviews/${reviewId}`);
  }
}
