/**
 * Development Logger for V-CURE End-to-End QA
 * Safely logs UI actions, validation results, API endpoints, HTTP status codes,
 * response errors, and navigation results without exposing tokens or sensitive secrets.
 */

export interface DevLogEvent {
  action: string;
  validationResult?: 'SUCCESS' | 'FAILED' | 'SKIPPED' | { valid: boolean; errors?: any };
  endpoint?: string;
  httpStatus?: number | string;
  responseError?: string | null;
  navigationResult?: string;
  details?: Record<string, any>;
}

export const devLogger = {
  log: (event: DevLogEvent) => {
    if (process.env.NODE_ENV === 'production') return;

    // Sanitize any details object to prevent token/secret leakage
    const sanitizedDetails = event.details ? { ...event.details } : undefined;
    if (sanitizedDetails) {
      delete sanitizedDetails.token;
      delete sanitizedDetails.accessToken;
      delete sanitizedDetails.refreshToken;
      delete sanitizedDetails.idToken;
      delete sanitizedDetails.password;
    }

    console.group(`[V-CURE QA LOG] ${event.action}`);
    console.log(`⏱️ Action:`, event.action);
    if (event.validationResult !== undefined) {
      console.log(`✅ Validation:`, event.validationResult);
    }
    if (event.endpoint) {
      console.log(`🌐 Endpoint:`, event.endpoint);
    }
    if (event.httpStatus !== undefined) {
      console.log(`📊 Status Code:`, event.httpStatus);
    }
    if (event.responseError) {
      console.error(`❌ Response Error:`, event.responseError);
    }
    if (event.navigationResult) {
      console.log(`🧭 Navigation:`, event.navigationResult);
    }
    if (sanitizedDetails) {
      console.log(`📝 Details:`, sanitizedDetails);
    }
    console.groupEnd();
  }
};
