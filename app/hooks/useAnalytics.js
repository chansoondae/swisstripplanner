// hooks/useAnalytics.js
import { useCallback } from 'react';
import { event } from '../../lib/gtag';

export function useAnalytics() {
  const trackEvent = useCallback((action, category, label, value = null) => {
    event({
      action,
      category,
      label,
      value
    });
  }, []);

  // Common event tracking functions
  const trackPageView = useCallback((pageName) => {
    trackEvent('page_view', 'navigation', pageName);
  }, [trackEvent]);

  const trackButtonClick = useCallback((buttonName, location) => {
    trackEvent('button_click', 'engagement', `${buttonName} - ${location}`);
  }, [trackEvent]);

  const trackSearch = useCallback((searchTerm) => {
    trackEvent('search', 'engagement', searchTerm);
  }, [trackEvent]);

  const trackPlanCreation = useCallback((planDetails) => {
    trackEvent('plan_created', 'conversion', JSON.stringify(planDetails));
  }, [trackEvent]);

  const trackLogin = useCallback((method) => {
    trackEvent('login', 'authentication', method);
  }, [trackEvent]);

  const trackError = useCallback((errorType, errorMessage) => {
    trackEvent('error', 'system', `${errorType}: ${errorMessage}`);
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackButtonClick,
    trackSearch,
    trackPlanCreation,
    trackLogin,
    trackError
  };
}