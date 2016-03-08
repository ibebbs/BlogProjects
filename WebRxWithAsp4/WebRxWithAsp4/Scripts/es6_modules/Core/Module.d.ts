/// <reference path="../Interfaces.d.ts" />
export declare class Module implements wx.IModule {
    constructor(name: string);
    merge(other: wx.IModule): wx.IModule;
    component(name: string, component: wx.IComponentDescriptor): wx.IComponentRegistry;
    hasComponent(name: string): boolean;
    loadComponent(name: string, params?: Object): Rx.Observable<wx.IComponent>;
    binding(name: string, handler: wx.IBindingHandler): wx.IBindingRegistry;
    binding(name: string, handler: string): wx.IBindingRegistry;
    binding(names: string[], handler: wx.IBindingHandler): wx.IBindingRegistry;
    binding(names: string[], handler: string): wx.IBindingRegistry;
    binding(name: string): wx.IBindingHandler;
    private registerBinding(name, handler, controlsDescendants?);
    filter(name: string, filter: wx.IExpressionFilter): wx.IExpressionFilterRegistry;
    filter(name: string): wx.IExpressionFilter;
    filters(): {
        [index: string]: wx.IExpressionFilter;
    };
    animation(name: string, animation: wx.IAnimation): wx.IAnimationRegistry;
    animation(name: string): wx.IAnimation;
    name: string;
    private app;
    private bindings;
    private components;
    private expressionFilters;
    private animations;
    private instantiateComponent(name);
    private initializeComponent(obs, params?);
    protected loadComponentTemplate(template: any, params: Object): Rx.Observable<Node[]>;
    protected loadComponentViewModel(vm: any, componentParams: Object): Rx.Observable<any>;
}
export declare var modules: {
    [name: string]: Array<any> | wx.IModuleDescriptor;
};
/**
* Defines a module.
* @param {string} name The module name
* @return {wx.IModule} The module handle
*/
export declare function module(name: string, descriptor: Array<any> | wx.IModuleDescriptor): any;
/**
* Instantiate a new module instance and configure it using the user supplied configuration
* @param {string} name The module name
* @return {wx.IModule} The module handle
*/
export declare function loadModule(name: string): Rx.Observable<wx.IModule>;
