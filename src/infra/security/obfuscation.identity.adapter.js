export function makeObfuscationIdentity() {
  return {
    obfuscate(entity /* any */, _opts) {
      return entity; // sin ofuscación por ahora
    }
  };
}
