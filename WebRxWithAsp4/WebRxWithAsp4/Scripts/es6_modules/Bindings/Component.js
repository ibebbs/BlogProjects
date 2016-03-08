/// <reference path="../Interfaces.ts" />
import { isFunction, throwError, isDisposable } from "../Core/Utils";
"use strict";
export default class ComponentBinding {
    constructor(domManager, app) {
        this.priority = 30;
        this.controlsDescendants = true;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("component-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let compiled = this.domManager.compileBindingOptions(options, module);
        let opt = compiled;
        let exp;
        let componentNameObservable;
        let componentParams = {};
        let cleanup;
        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }
        if (typeof compiled === "function") {
            exp = compiled;
            componentNameObservable = this.domManager.expressionToObservable(exp, ctx);
        }
        else {
            // collect component-name observable
            componentNameObservable = this.domManager.expressionToObservable(opt.name, ctx);
            // collect params observables
            if (opt.params) {
                if (isFunction(opt.params)) {
                    // opt params is object passed by value (probably $componentParams from view-binding)
                    componentParams = this.domManager.evaluateExpression(opt.params, ctx);
                }
                else if (typeof opt.params === "object") {
                    Object.keys(opt.params).forEach(x => {
                        componentParams[x] = this.domManager.evaluateExpression(opt.params[x], ctx);
                    });
                }
                else {
                    throwError("invalid component-params");
                }
            }
        }
        // subscribe to any input changes
        state.cleanup.add(componentNameObservable.subscribe(componentName => {
            try {
                doCleanup();
                cleanup = new Rx.CompositeDisposable();
                // lookup component
                let obs = module.loadComponent(componentName, componentParams);
                let disp = undefined;
                if (obs == null)
                    throwError("component '{0}' is not registered with current module-context", componentName);
                disp = obs.subscribe(component => {
                    // loader cleanup
                    if (disp != null) {
                        disp.dispose();
                        disp = undefined;
                    }
                    // auto-dispose view-model
                    if (component.viewModel) {
                        if (isDisposable(component.viewModel)) {
                            cleanup.add(component.viewModel);
                        }
                    }
                    // done
                    this.applyTemplate(component, el, ctx, state, component.template, component.viewModel);
                });
                if (disp != null)
                    cleanup.add(disp);
            }
            catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
            }
        }));
        // release closure references to GC
        state.cleanup.add(Rx.Disposable.create(() => {
            // nullify args
            node = null;
            options = null;
            ctx = null;
            state = null;
            // nullify common locals
            compiled = null;
            doCleanup();
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    applyTemplate(component, el, ctx, state, template, vm) {
        if (template) {
            // clear
            while (el.firstChild) {
                this.domManager.cleanNode(el.firstChild);
                el.removeChild(el.firstChild);
            }
            // clone template and inject
            for (let i = 0; i < template.length; i++) {
                let node = template[i].cloneNode(true);
                el.appendChild(node);
            }
        }
        if (vm) {
            state.model = vm;
            // refresh context
            ctx = this.domManager.getDataContext(el);
        }
        // invoke preBindingInit
        if (vm && component.preBindingInit && vm.hasOwnProperty(component.preBindingInit)) {
            vm[component.preBindingInit].call(vm, el);
        }
        // done
        this.domManager.applyBindingsToDescendants(ctx, el);
        // invoke postBindingInit
        if (vm && component.postBindingInit && vm.hasOwnProperty(component.postBindingInit)) {
            vm[component.postBindingInit].call(vm, el);
        }
    }
}
//# sourceMappingURL=Component.js.map