/**
 * Simple http client inspired by https://github.com/radiosilence/xr
 */
export default class HttpClient implements wx.IHttpClient {
    private static Methods;
    private static Events;
    static defaults: wx.IHttpClientOptions;
    private res(xhr);
    private assign(l, ...rs);
    private config;
    private promise<T>(args, fn);
    configure(opts: wx.IHttpClientOptions): void;
    request<T>(options: wx.IHttpClientOptions): Promise<T>;
    get<T>(url: string, params?: Object, options?: wx.IHttpClientOptions): Promise<T>;
    put<T>(url: string, data: T, options?: wx.IHttpClientOptions): Promise<any>;
    post<T>(url: string, data: T, options?: wx.IHttpClientOptions): Promise<any>;
    patch<T>(url: string, data: T, options?: wx.IHttpClientOptions): Promise<any>;
    delete(url: string, options?: wx.IHttpClientOptions): Promise<any>;
    options(url: string, options?: wx.IHttpClientOptions): Promise<any>;
}
/**
* Provides editable configuration defaults for all newly created HttpClient instances.
**/
export declare function getHttpClientDefaultConfig(): wx.IHttpClientOptions;
