/// <reference path="../Interfaces.d.ts" />
export declare class RouteMatcher implements wx.IRoute {
    constructor(route: any, rules?: any);
    private stripTrailingSlash(route);
    parse: (url) => Object;
    stringify: (params?: Object) => string;
    isAbsolute: boolean;
    params: Array<string>;
    concat(route: wx.IRoute): wx.IRoute;
    private route;
    private rules;
    private validateRule(rule, value);
}
export declare function route(route: any, rules?: any): wx.IRoute;
