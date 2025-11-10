import axios from 'axios';

export function makeHttpNotifier() {
  return {
    async postJson(url, body, headers = {}) {
      const res = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json', ...headers },
        validateStatus: () => true
      });
      return { status: res.status, data: res.data };
    }
  };
}
