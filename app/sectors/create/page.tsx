'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSector } from '@/lib/api';
import { SectorCreate } from '@/types/stock';

export default function CreateSectorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<SectorCreate>({
    code: '',
    name: '',
    market: '',
    category: '',
    level: 1,
    parent_id: null,
  });

  const handleInputChange = (field: keyof SectorCreate, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // 유효성 검사
    if (!formData.code.trim()) {
      setError('섹터 코드를 입력해주세요.');
      return;
    }

    if (!formData.name.trim()) {
      setError('섹터명을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      // 빈 문자열을 undefined로 변환
      const cleanedData: SectorCreate = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        market: formData.market?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        level: formData.level,
        parent_id: formData.parent_id,
      };

      await createSector(cleanedData);
      setSuccess(true);

      // 성공 메시지 표시 후 목록으로 이동
      setTimeout(() => {
        router.push('/sectors');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '섹터 생성에 실패했습니다.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={handleCancel}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-transform"
          >
            <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            섹터 등록
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 폼 영역 */}
      <div className="px-4 py-6">
        {/* 성공 메시지 */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-green-600 dark:text-green-400 font-semibold mb-1">섹터가 생성되었습니다!</p>
                <p className="text-green-600 dark:text-green-400 text-sm">섹터 목록 페이지로 이동합니다...</p>
              </div>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 필수 입력 안내 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="text-red-500 font-bold">*</span> 표시는 필수 입력 항목입니다.
            </p>
          </div>

          {/* 섹터 코드 (필수) */}
          <div>
            <label htmlFor="code" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              섹터 코드 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="예: SEC001"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || success}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              고유한 섹터 코드를 입력하세요
            </p>
          </div>

          {/* 섹터명 (필수) */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              섹터명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="예: 반도체"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || success}
            />
          </div>

          {/* 시장구분 (선택) */}
          <div>
            <label htmlFor="market" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              시장구분
            </label>
            <select
              id="market"
              value={formData.market || ''}
              onChange={(e) => handleInputChange('market', e.target.value || undefined)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || success}
            >
              <option value="">선택 안함</option>
              <option value="KOSPI">KOSPI</option>
              <option value="KOSDAQ">KOSDAQ</option>
              <option value="KRX">KRX</option>
            </select>
          </div>

          {/* 카테고리 (선택) */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              카테고리
            </label>
            <input
              type="text"
              id="category"
              value={formData.category || ''}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="예: IT, 제조, 금융 등"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || success}
            />
          </div>

          {/* 분류 레벨 (선택) */}
          <div>
            <label htmlFor="level" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              분류 레벨
            </label>
            <input
              type="number"
              id="level"
              value={formData.level || 1}
              onChange={(e) => handleInputChange('level', parseInt(e.target.value) || 1)}
              min="1"
              max="10"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || success}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              1부터 10 사이의 값 (기본값: 1)
            </p>
          </div>

          {/* 상위 섹터 ID (선택) */}
          <div>
            <label htmlFor="parent_id" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              상위 섹터 ID
            </label>
            <input
              type="number"
              id="parent_id"
              value={formData.parent_id || ''}
              onChange={(e) => handleInputChange('parent_id', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="상위 섹터가 있는 경우"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || success}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              하위 섹터인 경우 상위 섹터의 ID를 입력하세요
            </p>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || success}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  생성 중...
                </>
              ) : (
                '섹터 생성'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
