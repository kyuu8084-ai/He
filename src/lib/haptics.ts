export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
  if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
    return;
  }
  
  try {
    switch (type) {
      case 'light':
        window.navigator.vibrate(10);
        break;
      case 'medium':
        window.navigator.vibrate(20);
        break;
      case 'heavy':
        window.navigator.vibrate(40);
        break;
      case 'success':
        window.navigator.vibrate([15, 50, 20]);
        break;
      case 'error':
        window.navigator.vibrate([30, 40, 30, 40, 50]);
        break;
      default:
        window.navigator.vibrate(10);
    }
  } catch (e) {
    // Ignore errors
  }
};
