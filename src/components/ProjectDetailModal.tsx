import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Star,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  User,
  Lightbulb,
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import { Project, Review, UserSession } from '../types';
import {
  subscribeReviews,
  submitPeerReview,
  deletePeerReview,
} from '../firebase/service';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  session: UserSession | null;
  onOpenJoin: () => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  onClose,
  project,
  session,
  onOpenJoin,
}) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditingMyReview, setIsEditingMyReview] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const isAuthor = session?.uid === project.authorUid;
  const isInstructor = session?.role === 'instructor';
  const myReview = session ? reviews.find((r) => r.reviewerUid === session.uid) : null;

  // Subscribe to reviews in real-time
  useEffect(() => {
    if (!isOpen || !project) return;
    const unsubscribe = subscribeReviews(
      project.classId,
      project.id,
      (fetched) => {
        setReviews(fetched);
      },
      (err) => {
        console.error('Failed to load reviews:', err);
      }
    );
    return () => unsubscribe();
  }, [isOpen, project]);

  // Sync existing review state if user already reviewed
  useEffect(() => {
    if (myReview && !isEditingMyReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    } else if (!myReview) {
      setRating(5);
      setComment('');
    }
  }, [myReview, isEditingMyReview]);

  if (!isOpen || !project) return null;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      onOpenJoin();
      return;
    }
    if (isAuthor) {
      setErrorMessage('자신의 작품에는 리뷰를 등록할 수 없습니다.');
      return;
    }
    if (!comment.trim()) {
      setErrorMessage('건설적인 피드백을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await submitPeerReview(project.classId, project.id, rating, comment, session);
      setIsEditingMyReview(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;
    try {
      await deletePeerReview(project.classId, project.id, reviewId);
      if (myReview?.id === reviewId) {
        setIsEditingMyReview(false);
        setComment('');
        setRating(5);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getDeviceWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[390px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Bar: Title, Author, Viewport switch & Actions */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white truncate max-w-xs sm:max-w-md">
                  {project.title}
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {project.authorNickname}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-lg hidden sm:block">
                {project.description}
              </p>
            </div>
          </div>

          {/* Viewport switch & Close */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setDeviceMode('desktop')}
                title="데스크톱 뷰"
                className={`p-1.5 rounded transition ${
                  deviceMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                title="태블릿 뷰"
                className={`p-1.5 rounded transition ${
                  deviceMode === 'tablet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                title="모바일 뷰"
                className={`p-1.5 rounded transition ${
                  deviceMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <a
              href={project.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">새 창에서 열기</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split View (App Live Runner + Reviews Sidebar) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
          {/* Left / Top: Interactive Live App Viewer */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-900/90 overflow-hidden relative">
            <div
              className={`w-full h-full transition-all duration-300 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col ${getDeviceWidth()}`}
            >
              {/* Browser simulated address bar */}
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center gap-2 text-xs text-slate-600 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 bg-white px-2.5 py-1 rounded border border-slate-200 truncate font-mono text-[11px] text-slate-500">
                  {project.appUrl}
                </div>
              </div>

              {/* Iframe View */}
              <div className="flex-1 relative bg-slate-50">
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-slate-50">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                    <p className="text-xs font-medium text-slate-600">
                      웹앱을 불러오는 중입니다...
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      (보안 정책상 iframe 임베드가 차단된 사이트는 상단의 '새 창에서 열기'를 눌러주세요)
                    </p>
                  </div>
                )}
                <iframe
                  src={project.appUrl}
                  title={project.title}
                  onLoad={() => setIframeLoaded(true)}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>

          {/* Right: Project Details & Peer Reviews Panel */}
          <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-1/2 lg:h-full overflow-hidden shrink-0">
            {/* Project Specs Card */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-2.5 shrink-0">
              {/* Tools chips */}
              {project.aiTools && project.aiTools.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.aiTools.map((tool, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                      <span>{tool}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Prompt tip if exists */}
              {project.promptTip && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs">
                  <div className="font-semibold text-amber-900 flex items-center gap-1 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>작성자의 바이브 코딩 팁</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {project.promptTip}
                  </p>
                </div>
              )}

              {/* Average Rating Score Card */}
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-black text-slate-900 leading-none">
                    {project.averageRating > 0 ? project.averageRating.toFixed(1) : '-'}
                  </div>
                  <div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= Math.round(project.averageRating)
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      피어 리뷰 {reviews.length}개
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  5점 만점 기준
                </div>
              </div>
            </div>

            {/* Reviews List & Submission Form */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Form Section */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                {!session ? (
                  <div className="text-center py-3">
                    <p className="text-xs text-slate-600 mb-2">
                      수업에 참여하면 동료 피어 리뷰를 작성할 수 있습니다.
                    </p>
                    <button
                      onClick={onOpenJoin}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      참여 코드 입력하기
                    </button>
                  </div>
                ) : isAuthor ? (
                  <div className="text-xs text-slate-500 text-center py-2">
                    💡 <strong>본인 작품</strong>입니다. 동료 수강생들의 피드백을 확인해보세요.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {myReview && !isEditingMyReview ? '내가 작성한 피어 리뷰' : '피어 리뷰 작성'}
                      </span>
                      {myReview && !isEditingMyReview && (
                        <button
                          type="button"
                          onClick={() => setIsEditingMyReview(true)}
                          className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>수정하기</span>
                        </button>
                      )}
                    </div>

                    {errorMessage && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {(!myReview || isEditingMyReview) && (
                      <>
                        {/* Interactive Star Picker */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((val) => {
                            const active = (hoverRating ?? rating) >= val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onMouseEnter={() => setHoverRating(val)}
                                onMouseLeave={() => setHoverRating(null)}
                                onClick={() => setRating(val)}
                                className="p-1 transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    active
                                      ? 'text-amber-500 fill-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              </button>
                            );
                          })}
                          <span className="text-xs font-bold text-amber-900 ml-1">
                            {rating}점
                          </span>
                        </div>

                        {/* Comment Input */}
                        <div>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="사용자 경험, 디자인, 유용성에 대한 솔직하고 건설적인 피드백을 남겨주세요."
                            rows={3}
                            maxLength={300}
                            required
                            className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 resize-none"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                            <span>솔직하고 따뜻한 리뷰를 권장합니다</span>
                            <span>{comment.length}/300자</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          {isEditingMyReview && (
                            <button
                              type="button"
                              onClick={() => setIsEditingMyReview(false)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium"
                            >
                              취소
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50 shadow-xs"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>{isEditingMyReview ? '수정 완료' : '리뷰 등록'}</span>
                          </button>
                        </div>
                      </>
                    )}

                    {myReview && !isEditingMyReview && (
                      <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= myReview.rating
                                    ? 'text-amber-500 fill-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                            <span className="font-bold text-slate-800 ml-1">
                              {myReview.rating}점
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(myReview.id)}
                            className="text-slate-400 hover:text-red-600 transition"
                            title="리뷰 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{myReview.comment}</p>
                      </div>
                    )}
                  </form>
                )}
              </div>

              {/* Other Peer Reviews */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>전체 피어 리뷰 목록</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {reviews.length}개의 의견
                  </span>
                </div>

                {reviews.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    <MessageSquare className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    <span>아직 등록된 리뷰가 없습니다. 첫 리뷰어가 되어보세요!</span>
                  </div>
                ) : (
                  reviews.map((rev) => {
                    const isMyOwn = session?.uid === rev.reviewerUid;
                    return (
                      <div
                        key={rev.id}
                        className={`p-3 rounded-xl border text-xs transition ${
                          isMyOwn
                            ? 'bg-blue-50/50 border-blue-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{rev.reviewerNickname}</span>
                            {isMyOwn && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                                나
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= rev.rating
                                      ? 'text-amber-500 fill-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-bold text-amber-900 text-[11px]">
                              {rev.rating}점
                            </span>

                            {/* Delete button for author or instructor */}
                            {(isMyOwn || isInstructor) && (
                              <button
                                onClick={() => handleDeleteReview(rev.id)}
                                className="ml-1 text-slate-300 hover:text-red-500 transition"
                                title="삭제"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
