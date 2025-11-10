export function makeCryptoPassthrough() {
  return {
    maybeEncrypt(body /* any */, _entity) {
      return { body, headers: {} }; // sin cifrar por ahora
    }
  };
}
