import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Tag,
  Lightbulb,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Project, UserSession } from '../types';
import { saveStudentProject } from '../firebase/service';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  existingProject?: Project | null;
  onSuccess: () => void;
}

const AVAILABLE_TOOLS = [
  'Gemini 2.5',
  'Cursor',
  'v0.dev',
  'Claude 3.7',
  'Bolt.new',
  'Lovable',
  'ChatGPT o3',
  'Windsurf',
  'Replit',
];

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  session,
  existingProject,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customToolInput, setCustomToolInput] = useState('');
  const [promptTip, setPromptTip] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (existingProject) {
      setTitle(existingProject.title);
      setDescription(existingProject.description);
      setAppUrl(existingProject.appUrl);
      setSelectedTools(existingProject.aiTools || []);
      setPromptTip(existingProject.promptTip || '');
    } else {
      setTitle('');
      setDescription('');
      setAppUrl('');
      setSelectedTools(['Gemini 2.5', 'Cursor']);
      setPromptTip('');
    }
    setErrorMessage('');
  }, [existingProject, isOpen]);

  if (!isOpen) return null;

  const toggleTool = (tool: string) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((t) => t !== tool));
    } else {
      if (selectedTools.length >= 6) return;
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const handleAddCustomTool = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customToolInput.trim()) {
      e.preventDefault();
      const val = customToolInput.trim().slice(0, 20);
      if (!selectedTools.includes(val) && selectedTools.length < 6) {
        setSelectedTools([...selectedTools, val]);
        setCustomToolInput('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (title.trim().length < 2) {
      setErrorMessage('웹앱 이름을 2자 이상 입력해주세요.');
      return;
    }
    if (description.trim().length < 5) {
      setErrorMessage('한 줄 설명을 5자 이상 입력해주세요.');
      return;
    }
    if (!/^https?:\/\/.+/i.test(appUrl.trim())) {
      setErrorMessage('유효한 웹앱 URL을 입력해주세요 (http:// 또는 https://로 시작 필수).');
      return;
    }

    setIsLoading(true);
    try {
      await saveStudentProject(
        session.classId,
        {
          title,
          description,
          appUrl: appUrl.trim(),
          aiTools: selectedTools,
          promptTip,
        },
        session
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {existingProject ? '내 웹앱 작품 수정' : '새로운 AI 웹앱 작품 등록'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              수업당 1인 1작품 원칙이며, 동료 수강생들이 직접 실행하고 피어 리뷰를 남깁니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">웹앱 이름 *</label>
              <span className="text-slate-400">{title.length}/60자</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 맞춤형 AI 식단 플래너, 실시간 음성 번역기"
              maxLength={60}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">한 줄 핵심 설명 *</label>
              <span className="text-slate-400">{description.length}/200자</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 문제를 해결하는 앱인지 간결하고 명확하게 소개해 주세요."
              rows={2}
              maxLength={200}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* App URL */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">배포된 웹앱 URL *</label>
              {appUrl && /^https?:\/\/.+/i.test(appUrl) && (
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <span>링크 테스트</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder="https://my-vibe-app.vercel.app 또는 Netlify/Cloud Run 링크"
                maxLength={500}
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 font-mono text-xs"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              보안을 위해 http 또는 https 프로토콜만 허용됩니다.
            </p>
          </div>

          {/* AI Tools selection */}
          <div>
            <label className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>활용한 AI 도구 &amp; 모델 (최대 6개)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {AVAILABLE_TOOLS.map((tool) => {
                const isSelected = selectedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`px-2.5 py-1 rounded-md text-xs transition flex items-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-medium shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3" />}
                    <span>{tool}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={customToolInput}
              onChange={(e) => setCustomToolInput(e.target.value)}
              onKeyDown={handleAddCustomTool}
              placeholder="기타 도구 직접 입력 후 Enter (예: Claude Code, DALL-E)"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Prompt / Vibe coding tip */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>나만의 바이브 코딩 프롬프트 팁 (선택)</span>
              </label>
              <span className="text-slate-400">{promptTip.length}/500자</span>
            </div>
            <textarea
              value={promptTip}
              onChange={(e) => setPromptTip(e.target.value)}
              placeholder="예: '데이터 모델을 먼저 확정한 뒤 UI 컴포넌트를 단계별로 요청했을 때 오류가 크게 줄었습니다.'"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Author info preview */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>작성자: <strong className="text-slate-900">{session.nickname}</strong></span>
            <span>수업: <strong className="text-slate-900">{session.className}</strong></span>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <span>{existingProject ? '수정 완료' : '전시관 등록'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
