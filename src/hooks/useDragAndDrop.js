import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for drag and drop functionality with mobile touch support
 * 
 * @param {Function} onReorder - Callback function to handle reordering (oldIndex, newIndex) => void
 * @returns {Object} - Drag/touch handlers and state
 */
export function useDragAndDrop(onReorder) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isPendingDrag, setIsPendingDrag] = useState(false);
  
  const touchStartPos = useRef(null);
  const touchDelayTimer = useRef(null);
  const touchStartIndex = useRef(null);

  // Desktop drag handlers
  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Perform reordering
    onReorder(draggedIndex, index);
    setDraggedIndex(index);
  }, [draggedIndex, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // Mobile touch handlers
  const handleTouchStart = useCallback((e, index) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchStartIndex.current = index;
    setIsPendingDrag(true);

    // Start 150ms delay timer
    touchDelayTimer.current = setTimeout(() => {
      setDraggedIndex(index);
      setIsPendingDrag(false);
      
      // Haptic feedback (silent fail if unavailable)
      try {
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      } catch {
        // Silent fail
      }
    }, 150);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartPos.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // Cancel drag if movement exceeds 10px threshold (user is scrolling)
    if (deltaX > 10 || deltaY > 10) {
      if (touchDelayTimer.current && draggedIndex === null) {
        clearTimeout(touchDelayTimer.current);
        touchDelayTimer.current = null;
        setIsPendingDrag(false);
        touchStartPos.current = null;
        return;
      }
    }

    // If drag has started, find element under touch
    if (draggedIndex !== null) {
      e.preventDefault(); // Prevent scrolling during drag

      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!element) return;

      // Find closest element with data-drag-index
      let targetElement = element;
      let targetIndex = null;

      while (targetElement && targetElement !== document.body) {
        const index = targetElement.getAttribute('data-drag-index');
        if (index !== null) {
          targetIndex = parseInt(index, 10);
          break;
        }
        targetElement = targetElement.parentElement;
      }

      // Trigger reorder if valid target found and different from current
      if (targetIndex !== null && targetIndex !== draggedIndex) {
        onReorder(draggedIndex, targetIndex);
        setDraggedIndex(targetIndex);
      }
    }
  }, [draggedIndex, onReorder]);

  const handleTouchEnd = useCallback(() => {
    // Clear timer if still pending
    if (touchDelayTimer.current) {
      clearTimeout(touchDelayTimer.current);
      touchDelayTimer.current = null;
    }

    setDraggedIndex(null);
    setIsPendingDrag(false);
    touchStartPos.current = null;
    touchStartIndex.current = null;
  }, []);

  return {
    draggedIndex,
    isPendingDrag,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
