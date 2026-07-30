import { AuthContext } from "../../context/AuthContext";
import { ThemeProvider } from "../../context/ThemeContext";

const defaultAuthValue = {
  user: null,
  authorityState: { authorityVersion: 1, permissions: [] },
  authorityVersion: 1,
  permissions: [],
  authorityLoading: false,
  login: () => {},
  logout: () => {},
  hasPermission: () => true,
  refreshAuthority: () => Promise.resolve(),
};

export function MockAuthProvider({ children, value = {} }) {
  return (
    <AuthContext.Provider value={{ ...defaultAuthValue, ...value }}>
      {children}
    </AuthContext.Provider>
  );
}

export function renderWithProviders(ui, { authValue, ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return (
      <ThemeProvider>
        <MockAuthProvider value={authValue}>{children}</MockAuthProvider>
      </ThemeProvider>
    );
  }

  const { render } = require("@testing-library/react");
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
