import { Settings, settings } from './jikan-settings.js';

export class Request {

  /**
   * sends a request with the given list of URL parts and the optional list of query parameter
   * @param {*[]} args           URL Parts
   * @param {{}} [parameter]     Query Parameter
   * @param {boolean} [mal=false]      Request to official MAL API?
   * @returns {Promise<*>} returns the request response or an error
   */
  async send(args, parameter, mal = false) {
    const response = await jikanFetch(
      this.urlBuilder(args, parameter, mal),
      mal ? { headers: { 'X-MAL-CLIENT-ID': '6114d00ca681b7701d1e15fe11a4987e' } } : {}
    );
    const data = await response.json();

    if (response.status !== 200) return Promise.reject(new Error(data.error));

    if (typeof data === 'string') {
      return Promise.resolve(JSON.parse(data));
    }

    return Promise.resolve(data);
  }

  /**
   *
   * @param {*[]} args            URL Parts
   * @param {{}} [parameter]      Query Parameter
   * @param {boolean} [mal]       Request to official MAL API?
   * @returns {string}            URL
   */
  urlBuilder(args, parameter, mal) {
    const url = new URL(mal ? 'https://api.myanimelist.net/v2' : settings.getBaseURL());
    url.protocol = settings.protocol;

    const prefix = url.pathname.endsWith('/') ? '' : '/';
    url.pathname += prefix + args.filter(x => x).join('/');
    if(parameter){
      for(const [key, value] of Object.entries(parameter)){
        if(value !== 0 && !value) continue;
        url.searchParams.append(key, value);
      }
    }

    return url.href;
  }
}

/**
 *
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<Response>}
 */
async function jikanFetch(url, options = {}) {
  const parsedURL = new URL(url);

  return fetch(parsedURL, options);
}