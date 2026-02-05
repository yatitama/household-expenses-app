import { useRef, useEffect, useState } from 'react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';

export const useSwipeMonth = (
  currentMonth: string,
  setCurrentMonth: (month: string) => void
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentOffset = useRef(0);
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null);
  const isAnimating = useRef(false);

  // 月変更コールバックをrefで保持（useEffectの再アタッチ不要）
  const setCurrentMonthRef = useRef(setCurrentMonth);
  const currentMonthRef = useRef(currentMonth);
  useEffect(() => {
    setCurrentMonthRef.current = setCurrentMonth;
    currentMonthRef.current = currentMonth;
  });

  const handlePrevMonth = () => {
    setSlideDirection('right');
    setCurrentMonthRef.current(
      format(subMonths(parseISO(`${currentMonthRef.current}-01`), 1), 'yyyy-MM')
    );
  };

  const handleNextMonth = () => {
    setSlideDirection('left');
    setCurrentMonthRef.current(
      format(addMonths(parseISO(`${currentMonthRef.current}-01`), 1), 'yyyy-MM')
    );
  };

  const handlePrevRef = useRef(handlePrevMonth);
  const handleNextRef = useRef(handleNextMonth);
  useEffect(() => {
    handlePrevRef.current = handlePrevMonth;
    handleNextRef.current = handleNextMonth;
  });

  // アニメーション終了後にリセット
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => setSlideDirection(null), 300);
      return () => clearTimeout(timer);
    }
  }, [slideDirection, currentMonth]);

  // タッチイベントハンドラ
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isAnimating.current) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      currentOffset.current = 0;
      directionLocked.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating.current) return;

      const diffX = e.touches[0].clientX - touchStartX.current;
      const diffY = e.touches[0].clientY - touchStartY.current;

      // 最初の動きで方向をロック
      if (!directionLocked.current && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
        directionLocked.current =
          Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
      }

      // 横方向ロック時: コンテンツを指に追従させる
      if (directionLocked.current === 'horizontal' && contentRef.current) {
        currentOffset.current = diffX;
        const el = contentRef.current;
        el.style.transform = `translateX(${diffX}px)`;
        el.style.opacity = `${Math.max(0.5, 1 - Math.abs(diffX) / 400)}`;
        el.style.transition = 'none';
      }
    };

    const handleTouchEnd = () => {
      if (isAnimating.current) return;

      const offset = currentOffset.current;
      const el = contentRef.current;
      const minSwipeDistance = 50;

      if (
        directionLocked.current === 'horizontal' &&
        Math.abs(offset) > minSwipeDistance &&
        el
      ) {
        // スワイプ成功: スライドアウト → 月変更
        isAnimating.current = true;
        el.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        el.style.transform = `translateX(${offset < 0 ? '-100%' : '100%'})`;
        el.style.opacity = '0';

        setTimeout(() => {
          if (offset < 0) {
            handleNextRef.current();
          } else {
            handlePrevRef.current();
          }
          // リセット（新コンテンツはアニメーションクラスで表示）
          if (el) {
            el.style.transform = '';
            el.style.opacity = '';
            el.style.transition = '';
          }
          isAnimating.current = false;
        }, 200);
      } else if (el && directionLocked.current === 'horizontal') {
        // スワイプ不足: 元の位置に戻る
        el.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        el.style.transform = 'translateX(0)';
        el.style.opacity = '1';

        setTimeout(() => {
          if (el) {
            el.style.transform = '';
            el.style.opacity = '';
            el.style.transition = '';
          }
        }, 200);
      }

      currentOffset.current = 0;
      directionLocked.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const getAnimationClass = () => {
    if (!slideDirection) return '';
    return slideDirection === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right';
  };

  return {
    containerRef,
    contentRef,
    slideDirection,
    handlePrevMonth,
    handleNextMonth,
    getAnimationClass,
  };
};
