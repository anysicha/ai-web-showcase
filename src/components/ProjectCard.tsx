import React from 'react';
import {
  Star,
  ExternalLink,
  MessageSquare,
  Sparkles,
  User,
  Edit3,
  Trash2,
  Play,
  Globe,
} from 'lucide-react';
import { Project, UserSession } from '../types';

interface ProjectCardProps {
  project: Project;
  session: UserSession | null;
  onOpenDetail: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  session,
  onOpenDetail,
  onEdit,
  onDelete,
}) => {
  const isAuthor = session?.uid === project.authorUid;
  const isInstructor = session?.role === 'instructor';

  // Format domain from URL
  let domain = '';
  try {
    const parsed = new URL(project.appUrl);
    domain = parsed.hostname;
  } catch {
    domain = project.appUrl;
  }

  // Format date
  let formattedDate = '';
  try {
    const d = new Date(project.createdAt);
    formattedDate = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  } catch {
    formattedDate = '최근';
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      {/* Top Banner / Card Head */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isAuthor && (
                <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  내 작품
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-medium">{formattedDate}</span>
            </div>
            <h3
              onClick={() => onOpenDetail(project)}
              className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 cursor-pointer transition line-clamp-1"
            >
              {project.title}
            </h3>
          </div>

          {/* Rating Badge */}
          <div className="shrink-0 flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg text-amber-900">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="font-bold text-xs">
              {project.averageRating > 0 ? project.averageRating.toFixed(1) : '-'}
            </span>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {project.description}
        </p>

        {/* AI Tools Tags */}
        {project.aiTools && project.aiTools.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.aiTools.map((tool, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60"
              >
                <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                <span>{tool}</span>
              </span>
            ))}
          </div>
        )}

        {/* Author & URL Info */}
        <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{project.authorNickname}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>리뷰 {project.reviewCount}개</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
            <Globe className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{domain}</span>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenDetail(project)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>실행 & 피어 리뷰</span>
        </button>

        <a
          href={project.appUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="새 창에서 실행"
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Author or Instructor Controls */}
        {(isAuthor || isInstructor) && (
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
            {isAuthor && (
              <button
                onClick={() => onEdit(project)}
                title="작품 수정"
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(project)}
              title={isInstructor ? '관리자 강제 삭제' : '작품 삭제'}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
