/// <reference path="../Interfaces.d.ts" />
export declare class Router implements wx.IRouter {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    state(config: wx.IRouterStateConfig): wx.IRouter;
    updateCurrentStateParams(withParamsAction: (params: any) => void): void;
    go(to: string, params?: {}, options?: wx.IStateChangeOptions): void;
    get(state: string): wx.IRouterStateConfig;
    is(state: string, params?: any, options?: any): boolean;
    includes(state: string, params?: any, options?: any): boolean;
    url(state: string, params?: {}): string;
    reset(enterRootState?: boolean): void;
    sync(url?: string): void;
    reload(): void;
    getViewComponent(viewName: string): wx.IViewConfig;
    current: wx.IObservableProperty<wx.IRouterState>;
    viewTransitions: Rx.Observable<wx.IViewTransition>;
    private states;
    private root;
    private domManager;
    private app;
    private pathSeparator;
    private parentPathDirective;
    private rootStateName;
    private validPathRegExp;
    viewTransitionsSubject: Rx.Subject<wx.IViewTransition>;
    private registerStateInternal(state);
    private pushHistoryState(state, title?);
    private replaceHistoryState(state, title?);
    private mapPath(path);
    private getStateHierarchy(name);
    private getAbsoluteRouteForState(name, hierarchy?);
    private activateState(to, params?, options?);
    private getViewParameterNamesFromStateConfig(view, component);
}
