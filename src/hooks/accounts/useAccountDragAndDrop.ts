import { useState, useCallback, useRef, useEffect } from 'react';
import { accountService } from '../../services/storage';
import type { Account } from '../../types';

export const useAccountDragAndDrop = (
  accounts: Account[],
  refreshData: () => void
) => {
  const [draggedAccountId, setDraggedAccountId] = useState<string | null>(null);
  const [dragOverAccountId, setDragOverAccountId] = useState<string | null>(null);

  const draggedIdRef = useRef<string | null>(null);
  const dragOverIdRef = useRef<string | null>(null);
  const isDraggingTouchRef = useRef(false);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const lastTouchPosRef = useRef({ x: 0, y: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const accountsRef = useRef(accounts);

  useEffect(() => { accountsRef.current = accounts; }, [accounts]);

  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (isDraggingTouchRef.current) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
    };
  }, []);

  const handleDragStart = useCallback((accountId: string) => {
    setDraggedAccountId(accountId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, accountId: string) => {
    e.preventDefault();
    if (draggedAccountId && draggedAccountId !== accountId) {
      setDragOverAccountId(accountId);
    }
  }, [draggedAccountId]);

  const handleDrop = useCallback((e: React.DragEvent, targetAccountId: string) => {
    e.preventDefault();
    if (!draggedAccountId || draggedAccountId === targetAccountId) {
      setDraggedAccountId(null);
      setDragOverAccountId(null);
      return;
    }

    const allAccounts = [...accounts];
    const draggedIndex = allAccounts.findIndex((a) => a.id === draggedAccountId);
    const targetIndex = allAccounts.findIndex((a) => a.id === targetAccountId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedAccountId(null);
      setDragOverAccountId(null);
      return;
    }

    const [removed] = allAccounts.splice(draggedIndex, 1);
    allAccounts.splice(targetIndex, 0, removed);

    const orders = allAccounts.map((account, index) => ({ id: account.id, order: index }));
    accountService.updateOrders(orders);
    refreshData();

    setDraggedAccountId(null);
    setDragOverAccountId(null);
  }, [draggedAccountId, accounts, refreshData]);

  const handleDragEnd = useCallback(() => {
    setDraggedAccountId(null);
    setDragOverAccountId(null);
  }, []);

  const updateDragTarget = useCallback((x: number, y: number) => {
    const element = document.elementFromPoint(x, y);
    const accountCard = element?.closest('[data-account-id]');
    if (accountCard) {
      const targetId = accountCard.getAttribute('data-account-id');
      if (targetId && targetId !== draggedIdRef.current) {
        if (dragOverIdRef.current !== targetId) {
          dragOverIdRef.current = targetId;
          setDragOverAccountId(targetId);
        }
      }
    } else if (dragOverIdRef.current) {
      dragOverIdRef.current = null;
      setDragOverAccountId(null);
    }
  }, []);

  const autoScrollFnRef = useRef<() => void>(() => {});
  const autoScroll = useCallback(() => {
    if (!isDraggingTouchRef.current) return;

    const y = lastTouchPosRef.current.y;
    const threshold = 80;
    const maxSpeed = 12;

    if (y < threshold && y > 0) {
      const intensity = 1 - y / threshold;
      window.scrollBy(0, -maxSpeed * intensity);
    } else if (y > window.innerHeight - threshold) {
      const intensity = 1 - (window.innerHeight - y) / threshold;
      window.scrollBy(0, maxSpeed * intensity);
    }

    updateDragTarget(lastTouchPosRef.current.x, lastTouchPosRef.current.y);

    autoScrollRafRef.current = requestAnimationFrame(autoScrollFnRef.current);
  }, [updateDragTarget]);

  useEffect(() => { autoScrollFnRef.current = autoScroll; }, [autoScroll]);

  const resetTouchDrag = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
    isDraggingTouchRef.current = false;
    draggedIdRef.current = null;
    dragOverIdRef.current = null;
    setDraggedAccountId(null);
    setDragOverAccountId(null);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, accountId: string) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      draggedIdRef.current = accountId;
      isDraggingTouchRef.current = true;
      setDraggedAccountId(accountId);

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      autoScrollRafRef.current = requestAnimationFrame(autoScroll);
    }, 150);
  }, [autoScroll]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };

    if (!isDraggingTouchRef.current && longPressTimerRef.current) {
      const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
      if (dx > 8 || dy > 8) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        return;
      }
    }

    if (!isDraggingTouchRef.current) return;

    updateDragTarget(touch.clientX, touch.clientY);
  }, [updateDragTarget]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }

    const draggedId = draggedIdRef.current;
    const overId = dragOverIdRef.current;

    if (isDraggingTouchRef.current && draggedId && overId && draggedId !== overId) {
      const allAccounts = [...accountsRef.current];
      const draggedIndex = allAccounts.findIndex((a) => a.id === draggedId);
      const targetIndex = allAccounts.findIndex((a) => a.id === overId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = allAccounts.splice(draggedIndex, 1);
        allAccounts.splice(targetIndex, 0, removed);

        const orders = allAccounts.map((account, index) => ({ id: account.id, order: index }));
        accountService.updateOrders(orders);
        refreshData();
      }
    }

    resetTouchDrag();
  }, [refreshData, resetTouchDrag]);

  const handleTouchCancel = useCallback(() => {
    resetTouchDrag();
  }, [resetTouchDrag]);

  return {
    draggedAccountId,
    dragOverAccountId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  };
};
