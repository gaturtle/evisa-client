// Module-level registry so Axios interceptors can trigger logout
// without a direct dependency on React context.
export const authCallbacks = {
  logout: null as (() => void) | null,
}
