import { useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import { format, addMonths, subMonths, parseISO } from 'date-fns';

export const useSwipeMonth = (
  currentMonth: string,
  setCurrentMonth: (month: string) => void,
) => {
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const setCurrentMonthRef = useRef(setCurrentMonth);
  const currentMonthRef = useRef(currentMonth);
  setCurrentMonthRef.current = setCurrentMonth;
  currentMonthRef.current = currentMonth;

  const handlePrevMonth = () => {
    setSlideDirection('right');
    setCurrentMonthRef.current(
      format(subMonths(parseISO(`${currentMonthRef.current}-01`), 1), 'yyyy-MM'),
    );
    setTimeout(() => setSlideDirection(null), 300);
  };

  const handleNextMonth = () => {
    setSlideDirection('left');
    setCurrentMonthRef.current(
      format(addMonths(parseISO(`${currentMonthRef.current}-01`), 1), 'yyyy-MM'),
    );
    setTimeout(() => setSlideDirection(null), 300);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10,
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dx < -50) {
          handleNextMonth();
        } else if (gestureState.dx > 50) {
          handlePrevMonth();
        }
      },
    }),
  ).current;

  return {
    panHandlers: panResponder.panHandlers,
    slideDirection,
    handlePrevMonth,
    handleNextMonth,
  };
};
