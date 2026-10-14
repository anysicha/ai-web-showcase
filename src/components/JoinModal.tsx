import React, { useState } from 'react';
import {
  KeyRound,
  User,
  AlertCircle,
  HelpCircle,
  Loader2,
  Lock,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { joinClassWithCode } from '../firebase/service';
import { UserSession } from '../types';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: UserSession) => void;
  onSwitchToAdmin: () => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToAdmin,
}) => {
  const [code, setCode] = useState('VIBE2026');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfigTip, setShowConfigTip] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage('수업 참여 코드를 입력해주세요.');
      return;
    }
    if (!nickname.trim()) {
      setErrorMessage('전시관에서 사용할 닉네임을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const session = await joinClassWithCode(code.trim(), nickname.trim());
      onSuccess(session);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      if (msg.includes('Firebase Console') || msg.includes('익명 인증')) {
        setShowConfigTip(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Lock className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
              Class Admission
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">수업 참여 코드 입력</h2>
          <p className="text-xs text-slate-300 mt-1">
            별도의 회원가입 없이 강사가 발급한 참여 코드와 닉네임으로 즉시 입장합니다.
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {showConfigTip && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                Firebase 콘솔 설정 안내
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Firebase Console &gt; Authentication &gt; Sign-in method 탭에서 <strong>익명(Anonymous)</strong> 공급자가 '사용 설정됨'인지 확인해주세요.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>수업 참여 코드</span>
              <span className="text-[11px] font-normal text-slate-500">기본 코드: VIBE2026</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="예: VIBE2026"
                maxLength={20}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              전시관 닉네임
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: AI바이브러, 홍길동"
                maxLength={30}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              작품 등록 및 동료 평가 작성 시 표시될 이름입니다.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>인증 및 수업 입장 중...</span>
                </>
              ) : (
                <>
                  <span>수업 입장하기</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium transition"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>강사이신가요? 관리자 로그인</span>
            </button>
            <span className="text-[11px] text-slate-400">보안 코드 검증 적용</span>
          </div>
        </form>
      </div>
    </div>
  );
};
