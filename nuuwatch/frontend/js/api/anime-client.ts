export class AnimeClient {
  public async get(url: string) {
    const response = await fetch(url, {
      method: 'get'
    });

    const data = await response.json();
    if (response.status !== 200) {
      return Promise.reject(new Error(data?.error ?? ''));
    }

    if (typeof data === 'string') {
      return Promise.resolve(JSON.parse(data));
    }

    return data;
  }
}