/// <reference path="../Interfaces.ts" />
import { injector } from "./Injector";
import { extend, observableRequire, args2Array, isFunction, throwError, isRxObservable, isPromise } from "../Core/Utils";
import * as res from "./Resources";
"use strict";
export class Module {
    constructor(name) {
        //////////////////////////////////
        // Implementation
        this.bindings = {};
        this.components = {};
        this.expressionFilters = {};
        this.animations = {};
        this.name = name;
    }
    //////////////////////////////////
    // IModule
    merge(other) {
        let _other = other;
        extend(_other.components, this.components);
        extend(_other.bindings, this.bindings);
        extend(_other.expressionFilters, this.expressionFilters);
        extend(_other.animations, this.animations);
        return this;
    }
    component(name, component) {
        this.components[name] = component;
        return this;
    }
    hasComponent(name) {
        return this.components[name] != null;
    }
    loadComponent(name, params) {
        return this.initializeComponent(this.instantiateComponent(name), params);
    }
    binding() {
        let args = args2Array(arguments);
        let name = args.shift();
        let handler;
        // lookup?
        if (args.length === 0) {
            // if the handler has been registered as resource, resolve it now and update registry
            handler = this.bindings[name];
            if (typeof handler === "string") {
                handler = injector.get(handler);
                this.bindings[name] = handler;
            }
            return handler;
        }
        // registration
        handler = args.shift();
        if (Array.isArray(name)) {
            name.forEach(x => this.registerBinding(x, handler));
        }
        else {
            this.registerBinding(name, handler, args.shift());
        }
        return this;
    }
    registerBinding(name, handler, controlsDescendants) {
        if (typeof handler === 'string' || isFunction(handler["applyBinding"]))
            this.bindings[name] = handler;
        else {
            // Simple-binding handler
            let sbHandler = injector.get(res.simpleBindingHandler);
            sbHandler.inner = handler;
            sbHandler.controlsDescendants = !!controlsDescendants;
            this.bindings[name] = sbHandler;
        }
    }
    filter() {
        let args = args2Array(arguments);
        let name = args.shift();
        let filter;
        // lookup?
        if (args.length === 0) {
            // if the filter has been registered as resource, resolve it now and update registry
            filter = this.expressionFilters[name];
            if (typeof filter === "string") {
                filter = injector.get(filter);
                this.bindings[name] = filter;
            }
            return filter;
        }
        // registration
        filter = args.shift();
        this.expressionFilters[name] = filter;
        return this;
    }
    filters() {
        return this.expressionFilters;
    }
    animation() {
        let args = args2Array(arguments);
        let name = args.shift();
        let animation;
        // lookup?
        if (args.length === 0) {
            // if the animation has been registered as resource, resolve it now and update registry
            animation = this.animations[name];
            if (typeof animation === "string") {
                animation = injector.get(animation);
                this.bindings[name] = animation;
            }
            return animation;
        }
        // registration
        animation = args.shift();
        this.animations[name] = animation;
        return this;
    }
    get app() {
        return injector.get(res.app);
    }
    instantiateComponent(name) {
        let _cd = this.components[name];
        let result = undefined;
        if (_cd != null) {
            if (isRxObservable(_cd))
                result = _cd;
            else if (isPromise(_cd))
                return Rx.Observable.fromPromise(_cd);
            else {
                // if the component has been registered as resource, resolve it now and update registry
                let cd = _cd;
                if (cd.instance) {
                    result = Rx.Observable.return(cd.instance);
                }
                else if (cd.resolve) {
                    let resolved = injector.get(cd.resolve);
                    result = Rx.Observable.return(resolved);
                }
                else if (cd.require) {
                    result = observableRequire(cd.require);
                }
                else {
                    result = Rx.Observable.return(cd);
                }
            }
        }
        else {
            result = Rx.Observable.return(undefined);
        }
        return result.do(x => this.components[name] = { instance: x }); // cache descriptor
    }
    initializeComponent(obs, params) {
        return obs.take(1).selectMany(component => {
            if (component == null) {
                return Rx.Observable.return(undefined);
            }
            return Rx.Observable.combineLatest(component.template ? this.loadComponentTemplate(component.template, params) : Rx.Observable.return(undefined), component.viewModel ? this.loadComponentViewModel(component.viewModel, params) : Rx.Observable.return(undefined), (t, vm) => {
                // if view-model factory yields a function, use it as constructor
                if (isFunction(vm)) {
                    vm = new vm(params);
                }
                return {
                    template: t,
                    viewModel: vm,
                    preBindingInit: component.preBindingInit,
                    postBindingInit: component.postBindingInit
                };
            });
        })
            .take(1);
    }
    loadComponentTemplate(template, params) {
        let syncResult;
        let el;
        if (isFunction(template)) {
            syncResult = template(params);
            if (isRxObservable(template))
                return template;
            if (typeof syncResult === "string") {
                syncResult = this.app.templateEngine.parse(template(params));
            }
            return Rx.Observable.return(syncResult);
        }
        else if (typeof template === "string") {
            syncResult = this.app.templateEngine.parse(template);
            return Rx.Observable.return(syncResult);
        }
        else if (Array.isArray(template)) {
            return Rx.Observable.return(template);
        }
        else if (typeof template === "object") {
            let options = template;
            if (options.resolve) {
                syncResult = injector.get(options.resolve);
                return Rx.Observable.return(syncResult);
            }
            else if (options.promise) {
                let promise = options.promise;
                return Rx.Observable.fromPromise(promise);
            }
            else if (options.observable) {
                return options.observable;
            }
            else if (options.require) {
                return observableRequire(options.require).select(x => this.app.templateEngine.parse(x));
            }
            else if (options.select) {
                // try both getElementById & querySelector
                el = document != null ? (document.getElementById(options.select) ||
                    document.querySelector(options.select)) : null;
                if (el != null) {
                    // only the nodes inside the specified element will be cloned for use as the component’s template
                    syncResult = this.app.templateEngine.parse(el.innerHTML);
                }
                else {
                    syncResult = [];
                }
                return Rx.Observable.return(syncResult);
            }
        }
        return throwError("invalid template descriptor");
    }
    loadComponentViewModel(vm, componentParams) {
        let syncResult;
        if (isFunction(vm)) {
            return Rx.Observable.return(vm);
        }
        else if (Array.isArray(vm)) {
            // assumed to be inline-annotated-array
            syncResult = injector.resolve(vm, componentParams);
            return Rx.Observable.return(syncResult);
        }
        else if (typeof vm === "object") {
            let options = vm;
            if (options.resolve) {
                syncResult = injector.get(options.resolve, componentParams);
                return Rx.Observable.return(syncResult);
            }
            else if (options.observable) {
                return options.observable;
            }
            else if (options.promise) {
                let promise = options.promise;
                return Rx.Observable.fromPromise(promise);
            }
            else if (options.require) {
                return observableRequire(options.require);
            }
            else if (options.instance) {
                return Rx.Observable.return(options.instance);
            }
        }
        return throwError("invalid view-model descriptor");
    }
}
export var modules = {};
/**
* Defines a module.
* @param {string} name The module name
* @return {wx.IModule} The module handle
*/
export function module(name, descriptor) {
    modules[name] = descriptor;
    return this;
}
/**
* Instantiate a new module instance and configure it using the user supplied configuration
* @param {string} name The module name
* @return {wx.IModule} The module handle
*/
export function loadModule(name) {
    let md = modules[name];
    let result = undefined;
    let module;
    if (md != null) {
        if (Array.isArray(md)) {
            // assumed to be inline-annotated-array
            // resolve the configuration function via DI and invoke it with the module instance as argument
            module = new Module(name);
            injector.resolve(md, module);
            result = Rx.Observable.return(module);
        }
        else if (isFunction(md)) {
            // configuration function
            module = new Module(name);
            md(module);
            result = Rx.Observable.return(module);
        }
        else {
            let mdd = md;
            if (mdd.instance) {
                result = Rx.Observable.return(mdd.instance);
            }
            else {
                module = new Module(name);
                if (mdd.resolve) {
                    // resolve the configuration function via DI and invoke it with the module instance as argument
                    injector.get(mdd.resolve, module);
                    result = Rx.Observable.return(module);
                }
                else if (mdd.require) {
                    // load the configuration function from external module and invoke it with the module instance as argument
                    result = observableRequire(mdd.require)
                        .do(x => x(module)) // configure the module
                        .select(x => module);
                }
            }
        }
    }
    else {
        result = Rx.Observable.return(undefined);
    }
    return result.take(1).do(x => modules[name] = { instance: x }); // cache instantiated module
}
//# sourceMappingURL=Module.js.map