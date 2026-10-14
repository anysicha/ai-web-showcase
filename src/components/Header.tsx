import React from 'react';
import {
  Sparkles,
  User,
  Shield,
  PlusCircle,
  LogOut,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  session: UserSession | null;
  onOpenJoin: () => void;
  onOpenAdminLogin: () => void;
  onOpenSubmitModal: () => void;
  onOpenAdminDashboard: () => void;
  onLogout: () => void;
  hasMyProject: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onOpenJoin,
  onOpenAdminLogin,
  onOpenSubmitModal,
  onOpenAdminDashboard,
  onLogout,
  hasMyProject,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                  AI 웹앱 전시관
                </h1>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Vibe Showcase
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                AI 바이브 코딩 수강생 웹앱 포트폴리오 & 동료 피어 리뷰
              </p>
            </div>
          </div>

          {/* Right Navigation / Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <>
                {/* Class & User Badge */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{session.className}</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{session.nickname}</span>
                    {session.role === 'instructor' && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                        강사
                      </span>
                    )}
                  </div>
                </div>

                {/* Instructor Dashboard Button */}
                {session.role === 'instructor' && (
                  <button
                    onClick={onOpenAdminDashboard}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-sm"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>강사 대시보드</span>
                  </button>
                )}

                {/* Student: My Project Registration / Edit */}
                {session.role === 'student' && (
                  <button
                    onClick={onOpenSubmitModal}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{hasMyProject ? '내 작품 수정' : '내 작품 등록'}</span>
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title="수업 퇴장"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onOpenAdminLogin}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>강사 로그인</span>
                </button>
                <button
                  onClick={onOpenJoin}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>수업 참여하기</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
