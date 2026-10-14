// Client-side replacement for the former Express /api routes, so the app can
// be hosted as a static site (GitHub Pages). Class info lives in
// Firestore `classes/{classId}` (readable by signed-in users, writable by admin).
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

export interface ClassItem {
  classId: string;
  name: string;
  joinCode: string;
  status: 'active' | 'closed';
  createdAt: string;
  instructorEmail: string;
}

const DEFAULT_CLASS: ClassItem = {
  classId: 'c_vibe_starter',
  name: 'AI 바이브 코딩 1기 쇼케이스',
  joinCode: 'VIBE2026',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  instructorEmail: 'anysicha123@gmail.com',
};

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function listClasses(): Promise<ClassItem[]> {
  const snap = await getDocs(collection(db, 'classes'));
  const list = snap.docs
    .map((d) => ({ ...(d.data() as Omit<ClassItem, 'classId'>), classId: d.id }))
    .filter((c) => typeof c.joinCode === 'string');
  // The starter class works even before it is saved to Firestore
  if (!list.some((c) => c.classId === DEFAULT_CLASS.classId)) {
    list.push(DEFAULT_CLASS);
  }
  return list;
}

export async function findClassByCode(code: string): Promise<ClassItem | null> {
  const normalized = code.trim().toUpperCase();
  const classes = await listClasses();
  return classes.find((c) => c.joinCode.toUpperCase() === normalized) || null;
}

export async function createClass(name: string, customCode: string | undefined, email: string) {
  const classId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await setDoc(doc(db, 'classes', classId), {
    name: name.trim().slice(0, 80),
    joinCode: customCode ? customCode.trim().toUpperCase() : randomCode(),
    status: 'active',
    createdAt: new Date().toISOString(),
    instructorEmail: email,
  });
}

// Materializes the built-in starter class in Firestore before modifying it
async function ensureClassDoc(classId: string) {
  const ref = doc(db, 'classes', classId);
  const snap = await getDoc(ref);
  if (!snap.exists() && classId === DEFAULT_CLASS.classId) {
    const { classId: _id, ...rest } = DEFAULT_CLASS;
    await setDoc(ref, rest);
  }
  return ref;
}

export async function regenerateCode(classId: string) {
  const ref = await ensureClassDoc(classId);
  await updateDoc(ref, { joinCode: randomCode() });
}

export async function toggleStatus(classId: string, current: 'active' | 'closed') {
  const ref = await ensureClassDoc(classId);
  await updateDoc(ref, { status: current === 'active' ? 'closed' : 'active' });
}
