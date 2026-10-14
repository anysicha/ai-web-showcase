import React from 'react';
import { Search, SlidersHorizontal, Star, Clock, MessageSquare, Check } from 'lucide-react';

export type SortOption = 'latest' | 'rating' | 'reviews';

interface GalleryFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedTag: string;
  onTagChange: (tag: string) => void;
  showOnlyMine: boolean;
  onToggleOnlyMine: (val: boolean) => void;
  isLoggedIn: boolean;
  totalCount: number;
}

const POPULAR_TAGS = ['전체', 'Gemini', 'Cursor', 'v0', 'Claude', 'Bolt', 'Lovable', 'ChatGPT'];

export const GalleryFilter: React.FC<GalleryFilterProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedTag,
  onTagChange,
  showOnlyMine,
  onToggleOnlyMine,
  isLoggedIn,
  totalCount,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-8 space-y-4">
      {/* Top row: Search and Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="작품명, 한 줄 설명, 작성자 닉네임 검색..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 transition"
          />
        </div>

        {/* Sort and Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium text-slate-600">
            <button
              onClick={() => onSortChange('latest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                sortBy === 'latest'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>최신순</span>
            </button>
            <button
              onClick={() => onSortChange('rating')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                sortBy === 'rating'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>평점순</span>
            </button>
            <button
              onClick={() => onSortChange('reviews')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                sortBy === 'reviews'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>리뷰순</span>
            </button>
          </div>

          {/* Show only my project toggle */}
          {isLoggedIn && (
            <button
              onClick={() => onToggleOnlyMine(!showOnlyMine)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                showOnlyMine
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  showOnlyMine ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                }`}
              >
                {showOnlyMine && <Check className="w-2.5 h-2.5" />}
              </div>
              <span>내 작품만</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Tool Tags Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
        <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>도구:</span>
        </span>
        {POPULAR_TAGS.map((tag) => {
          const isSelected = (tag === '전체' && !selectedTag) || selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => onTagChange(tag === '전체' ? '' : tag)}
              className={`px-2.5 py-1 rounded-md transition ${
                isSelected
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tag}
            </button>
          );
        })}
        <div className="ml-auto text-slate-400 text-xs">
          총 <span className="font-semibold text-slate-700">{totalCount}</span>개 전시 중
        </div>
      </div>
    </div>
  );
};
