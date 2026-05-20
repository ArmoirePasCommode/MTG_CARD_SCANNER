import { useContext } from 'react';

import AuthContext from '../context/AuthContext';
import type { AuthContextValue } from '../context/AuthContext';

const useAuth = (): AuthContextValue => {
  return useContext(AuthContext) as AuthContextValue;
};

export default useAuth;
