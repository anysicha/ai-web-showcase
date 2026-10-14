import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  Download,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Users,
  FolderGit2,
  Star,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Project, UserSession } from '../types';
import { deleteStudentProject } from '../firebase/service';
import { ClassItem, listClasses, createClass, regenerateCode, toggleStatus } from '../firebase/classApi';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  projects: Project[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  session,
  projects,
}) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [activeTab, setActiveTab] = useState<'classes' | 'projects' | 'guide'>('classes');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  // New Class Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Fetch admin classes
  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      setClasses(await listClasses());
    } catch (err) {
      console.error(err);
      alert(`요청 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(code);
    setTimeout(() => setIsCopied(null), 2000);
  };

  // Create new class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setCreateLoading(true);
    try {
      await createClass(newClassName, customCode.trim() || undefined, session.email || 'anysicha123@gmail.com');
      setNewClassName('');
      setCustomCode('');
      setShowCreateModal(false);
      setActionMessage('새로운 수업이 개설되었습니다.');
      fetchClasses();
    } catch (err) {
      console.error(err);
      alert(`요청 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCreateLoading(false);
    }
  };

  // Regenerate Code
  const handleRegenerateCode = async (classId: string) => {
    if (!confirm('참여 코드를 새로 재발급하시겠습니까? 기존 코드는 더 이상 사용할 수 없습니다.')) return;
    try {
      await regenerateCode(classId);
      setActionMessage('참여 코드가 재발급되었습니다.');
      fetchClasses();
    } catch (err) {
      console.error(err);
      alert(`요청 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Toggle Class Status
  const handleToggleStatus = async (classId: string) => {
    try {
      const current = classes.find((c) => c.classId === classId)?.status || 'active';
      await toggleStatus(classId, current);
      fetchClasses();
    } catch (err) {
      console.error(err);
      alert(`요청 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Delete project
  const handleDeleteProject = async (p: Project) => {
    if (!confirm(`[관리자 권한] '${p.title}' 작품을 정말 삭제하시겠습니까?`)) return;
    try {
      await deleteStudentProject(p.classId, p.id);
      setActionMessage('작품이 삭제되었습니다.');
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    if (projects.length === 0) {
      alert('내보낼 작품 데이터가 없습니다.');
      return;
    }

    const headers = [
      '작품명',
      '한줄설명',
      '작성자닉네임',
      '웹앱URL',
      '평균평점',
      '리뷰수',
      '활용AI도구',
      '바이브코딩팁',
      '등록일자',
    ];

    const rows = projects.map((p) => [
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.description.replace(/"/g, '""')}"`,
      `"${p.authorNickname.replace(/"/g, '""')}"`,
      `"${p.appUrl.replace(/"/g, '""')}"`,
      p.averageRating > 0 ? p.averageRating.toFixed(1) : '0.0',
      p.reviewCount,
      `"${(p.aiTools || []).join(', ')}"`,
      `"${(p.promptTip || '').replace(/"/g, '""')}"`,
      p.createdAt ? p.createdAt.split('T')[0] : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AI_바이브코딩_작품평가결과_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalReviews = projects.reduce((acc, cur) => acc + (cur.reviewCount || 0), 0);
  const totalRatingSum = projects.reduce((acc, cur) => acc + (cur.ratingSum || 0), 0);
  const avgClassScore = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">강사용 관리자 대시보드</h2>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold">
                  {session.email}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                수업 참여 코드 관리, 작품/리뷰 모니터링 및 종합 평가 CSV 내보내기
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback banner */}
        {actionMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="text-emerald-600 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Overview Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <div className="text-slate-500 flex items-center gap-1.5 font-medium mb-1">
              <FolderGit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>등록된 웹앱 작품</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{projects.length}개</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <div className="text-slate-500 flex items-center gap-1.5 font-medium mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>누적 동료 피어 리뷰</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{totalReviews}개</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <div className="text-slate-500 flex items-center gap-1.5 font-medium mb-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>전체 평균 평점</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{avgClassScore} / 5.0</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[11px] font-medium mb-1">종합 평가 결과</div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition text-xs shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV 다운로드</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-200 bg-white">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('classes')}
              className={`pb-3 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'classes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>수업 &amp; 참여 코드 관리</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-3 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'projects'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>제출 작품 모니터링 ({projects.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-3 text-xs font-semibold transition border-b-2 flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Firebase 콘솔 가이드</span>
            </button>
          </div>

          {activeTab === 'classes' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 mb-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 수업 개설</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Classes & Join Code */}
          {activeTab === 'classes' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <p className="text-xs text-slate-500 mt-2">수업 목록 불러오는 중...</p>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">개설된 수업이 없습니다.</p>
                </div>
              ) : (
                classes.map((cls) => {
                  const isClosed = cls.status === 'closed';
                  return (
                    <div
                      key={cls.classId}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{cls.name}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isClosed
                                ? 'bg-slate-100 text-slate-600 border border-slate-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isClosed ? '마감됨' : '진행 중'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          ID: {cls.classId}
                        </p>
                      </div>

                      {/* Join Code Highlight Display */}
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            수업 참여 코드
                          </div>
                          <div className="font-mono font-black text-lg text-blue-700 tracking-wider">
                            {cls.joinCode}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyCode(cls.joinCode)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition"
                        >
                          {isCopied === cls.joinCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 text-[11px]">복사됨</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">코드 복사</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRegenerateCode(cls.classId)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition"
                          title="새로운 참여 코드 무작위 재발급"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>코드 재발급</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(cls.classId)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                            isClosed
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isClosed ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>수업 재개</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>수업 마감</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Submissions Monitoring Table */}
          {activeTab === 'projects' && (
            <div>
              {projects.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  아직 등록된 학생 작품이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-3">작품명</th>
                        <th className="p-3">작성자</th>
                        <th className="p-3">평균 평점</th>
                        <th className="p-3">리뷰 수</th>
                        <th className="p-3">URL</th>
                        <th className="p-3 text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projects.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 font-semibold text-slate-900">
                            <div>{p.title}</div>
                            <div className="text-[11px] text-slate-400 font-normal line-clamp-1">
                              {p.description}
                            </div>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {p.authorNickname}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              {p.averageRating > 0 ? p.averageRating.toFixed(1) : '-'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{p.reviewCount}개</td>
                          <td className="p-3">
                            <a
                              href={p.appUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                            >
                              <span className="truncate max-w-[150px]">{p.appUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteProject(p)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                              title="부적절 콘텐츠 강제 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Firebase Console Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700 max-w-2xl">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  <span>필수 Firebase 콘솔 설정 안내</span>
                </h4>
                <p className="text-blue-800 leading-relaxed">
                  본 애플리케이션은 실제 Firebase Firestore 및 Authentication을 사용합니다. 수강생이 원활하게 입장하려면 아래 두 가지 설정을 확인해주세요:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-blue-900">
                  <li>
                    <strong>익명 인증 (Anonymous Auth) 활성화:</strong><br />
                    Firebase Console &gt; Build &gt; Authentication &gt; Sign-in method &gt; <strong>'익명(Anonymous)'</strong> 공급자를 클릭하고 '사용 설정' 후 저장합니다.
                  </li>
                  <li>
                    <strong>Google 로그인 활성화:</strong><br />
                    Sign-in method에서 <strong>'Google'</strong> 제공업체를 사용 설정하고 프로젝트 지원 이메일을 지정합니다.
                  </li>
                  <li>
                    <strong>Firestore 보안 규칙 배포:</strong><br />
                    본 시스템에 내장된 ABAC Fortress 규칙이 이미 적용되어 있으며, 악성 페이로드 및 신원 위조를 원천 차단합니다.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Create Class Modal Overlay */}
        {showCreateModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden p-6 animate-in fade-in zoom-in-95">
              <h3 className="font-bold text-slate-900 text-base mb-1">새로운 수업 개설</h3>
              <p className="text-xs text-slate-500 mb-4">
                수업 이름을 입력하면 고유한 참여 코드가 발급됩니다.
              </p>

              <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">수업 이름 *</label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="예: AI 바이브 코딩 2기 A반"
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    사용자 지정 참여 코드 (선택 - 비워둘 경우 6자리 무작위 생성)
                  </label>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    placeholder="예: VIBE2026"
                    className="w-full px-3 py-2 text-sm font-mono uppercase tracking-wider rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                  >
                    {createLoading ? '개설 중...' : '수업 개설하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
