/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Sparkles,
  PlusCircle,
  KeyRound,
  Inbox,
  Shield,
  Layers,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { auth } from './firebase/config';
import {
  subscribeProjects,
  signInAsInstructor,
  logoutUser,
  deleteStudentProject,
} from './firebase/service';
import { Project, UserSession } from './types';
import { Header } from './components/Header';
import { GalleryFilter, SortOption } from './components/GalleryFilter';
import { ProjectCard } from './components/ProjectCard';
import { JoinModal } from './components/JoinModal';
import { ProjectFormModal } from './components/ProjectFormModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [selectedTag, setSelectedTag] = useState('');
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // Modals
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load session from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vibe_showcase_session');
      if (saved) {
        setSession(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Keep session if user refreshed anonymous auth, or reset if intentionally signed out
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription to class projects
  const activeClassId = session?.classId || 'c_vibe_starter';

  useEffect(() => {
    setIsLoadingProjects(true);
    const unsubscribe = subscribeProjects(
      activeClassId,
      (fetched) => {
        setProjects(fetched);
        setIsLoadingProjects(false);
      },
      (err) => {
        console.warn('Projects subscription notice:', err);
        setIsLoadingProjects(false);
      }
    );
    return () => unsubscribe();
  }, [activeClassId]);

  // Handle Instructor Google Login
  const handleInstructorLogin = async () => {
    try {
      setAuthError(null);
      const instructorSession = await signInAsInstructor();
      setSession(instructorSession);
      setIsAdminOpen(true);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setSession(null);
  };

  // Find my project if exists
  const myProject = useMemo(() => {
    if (!session) return null;
    return projects.find((p) => p.authorUid === session.uid) || null;
  }, [session, projects]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchAuthor = p.authorNickname.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchAuthor) return false;
        }
        // Tag filter
        if (selectedTag) {
          if (!p.aiTools || !p.aiTools.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()))) {
            return false;
          }
        }
        // Only mine filter
        if (showOnlyMine && session) {
          if (p.authorUid !== session.uid) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.averageRating || 0) - (a.averageRating || 0);
        }
        if (sortBy === 'reviews') {
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }
        // Latest (default)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [projects, searchQuery, selectedTag, showOnlyMine, sortBy, session]);

  // Project Actions
  const handleEditProject = (proj: Project) => {
    setEditingProject(proj);
    setIsSubmitOpen(true);
  };

  const handleDeleteProject = async (proj: Project) => {
    if (!confirm(`'${proj.title}' 작품을 정말 삭제하시겠습니까?`)) return;
    try {
      await deleteStudentProject(proj.classId, proj.id);
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Global Header */}
      <Header
        session={session}
        onOpenJoin={() => setIsJoinOpen(true)}
        onOpenAdminLogin={handleInstructorLogin}
        onOpenSubmitModal={() => {
          setEditingProject(myProject);
          setIsSubmitOpen(true);
        }}
        onOpenAdminDashboard={() => setIsAdminOpen(true)}
        onLogout={handleLogout}
        hasMyProject={!!myProject}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Auth Error Banner if present */}
        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              onClick={() => setAuthError(null)}
              className="font-bold text-amber-700 hover:text-amber-900"
            >
              닫기
            </button>
          </div>
        )}

        {/* Hero Banner Section (Clean Educational Portfolio Exhibition) */}
        <section className="mb-10 bg-gradient-to-b from-white to-slate-50/80 rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 바이브 코딩 실전 프로젝트 쇼케이스</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
              우리가 AI로 완성한 웹앱을 직접 실행하고 평가해보세요
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              아이디어부터 완성된 서비스까지, 수강생들이 바이브 코딩으로 배포한 웹앱을 실시간으로 감상하고 별점과 건설적인 피어 피드백을 나눕니다.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {session ? (
                session.role === 'student' && (
                  <button
                    onClick={() => {
                      setEditingProject(myProject);
                      setIsSubmitOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{myProject ? '내 작품 수정하기' : '내 웹앱 작품 등록하기'}</span>
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={() => setIsJoinOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>수업 참여 코드 입력</span>
                  </button>
                  <button
                    onClick={handleInstructorLogin}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>강사 전용 대시보드</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Gallery Search & Filter Bar */}
        <GalleryFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          showOnlyMine={showOnlyMine}
          onToggleOnlyMine={setShowOnlyMine}
          isLoggedIn={!!session}
          totalCount={filteredProjects.length}
        />

        {/* Projects Grid */}
        {isLoadingProjects ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">작품 갤러리를 불러오는 중입니다...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">전시 중인 작품이 없습니다</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
              {searchQuery || selectedTag || showOnlyMine
                ? '검색 조건에 맞는 작품이 없습니다. 검색어를 변경하거나 필터를 초기화해보세요.'
                : '아직 등록된 웹앱이 없습니다. 첫 번째로 작품을 등록하고 동료들의 피드백을 받아보세요!'}
            </p>
            {session?.role === 'student' && !myProject && (
              <button
                onClick={() => {
                  setEditingProject(null);
                  setIsSubmitOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>첫 번째 작품 등록하기</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                session={session}
                onOpenDetail={(p) => setSelectedProject(p)}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">AI 웹앱 전시관</span>
            <span>•</span>
            <span>AI Vibe Coding Peer Review System</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Firebase Firestore &amp; Auth 연동</span>
            <span>•</span>
            <span>엄격한 보안 규칙(ABAC) 적용</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Join Code Modal */}
      <JoinModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onSuccess={(newSession) => setSession(newSession)}
        onSwitchToAdmin={() => {
          setIsJoinOpen(false);
          handleInstructorLogin();
        }}
      />

      {/* MODAL 2: Project Submit/Edit Modal */}
      {session && (
        <ProjectFormModal
          isOpen={isSubmitOpen}
          onClose={() => setIsSubmitOpen(false)}
          session={session}
          existingProject={editingProject}
          onSuccess={() => {
            // refresh
          }}
        />
      )}

      {/* MODAL 3: Project Detail & Runner Modal */}
      {selectedProject && (
        <ProjectDetailModal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={projects.find((p) => p.id === selectedProject.id) ?? selectedProject}
          session={session}
          onOpenJoin={() => setIsJoinOpen(true)}
        />
      )}

      {/* MODAL 4: Instructor Admin Dashboard */}
      {session && session.role === 'instructor' && (
        <AdminDashboard
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          session={session}
          projects={projects}
        />
      )}
    </div>
  );
}
