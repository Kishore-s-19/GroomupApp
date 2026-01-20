const SCROLL_KEY = 'groomup_scroll_position';

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

export const saveScrollPosition = () => {
  sessionStorage.setItem(SCROLL_KEY, window.scrollY.toString());
};

export const getScrollPosition = () => {
  const saved = sessionStorage.getItem(SCROLL_KEY);
  return saved ? parseInt(saved, 10) : null;
};

export const clearScrollPosition = () => {
  sessionStorage.removeItem(SCROLL_KEY);
};

export const restoreScrollPosition = () => {
  const position = getScrollPosition();
  if (position !== null && position > 0) {
    // Scroll immediately
    window.scrollTo(0, position);
    
    // Also use requestAnimationFrame as a fallback/reinforcement for some browsers
    requestAnimationFrame(() => {
      window.scrollTo(0, position);
      clearScrollPosition();
    });
    return true;
  }
  return false;
};

export const hasScrollPosition = () => {
  return sessionStorage.getItem(SCROLL_KEY) !== null;
};
