/**
 * Convenience re-export so existing imports (`useAuth`) continue to work.
 * The null-check and error message live in AuthContext to keep the logic
 * in one place — calling this hook outside <AuthProvider> throws immediately.
 */
export { useAuthContext as default } from '../context/AuthContext';
