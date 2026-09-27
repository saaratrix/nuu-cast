export class Settings {
  protocol = 'https:';
  private baseURL!: URL;
  private v: number | undefined;

  constructor(baseURL = 'https://api.jikan.moe', version = 4) {
    this.setBaseURL(baseURL, version);
  }

  /**
   * Delivers the full API Base URL
   * @returns {URL}
   */
  getBaseURL() {
    return this.baseURL;
  }

  /**
   * can be used to replace the current API Base URL by a complete new one
   * @param {string} baseURL
   * @param {number} [version]
   */
  setBaseURL(baseURL: string, version?: number) {
    if(version) this.v = version;
    this.baseURL = new URL(`/v${this.v}`, baseURL);
  }

  setBaseURLAbsolute(pathname: string, origin: string = location.origin) {
    this.baseURL = new URL(pathname, origin);

    this.protocol = this.baseURL.protocol;
  }

  /**
   * can be used to change the API version
   * @param {number} version
   */
  set version(version) {
    this.v = version;
    this.baseURL.pathname = `/v${version}`;
  }

  /**
   * delivers the currently used API version
   * @returns {number}
   */
  get version() {
    return this.v;
  }
}

export const settings = new Settings();
