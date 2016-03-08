/// <reference path="../Interfaces.ts" />
import { args2Array, throwError, unwrapProperty } from "../Core/Utils";
import { Module, loadModule } from "../Core/Module";
"use strict";
export default class ModuleBinding {
    constructor(domManager, app) {
        this.priority = 100;
        this.controlsDescendants = true;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("module-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let self = this;
        let exp = this.domManager.compileBindingOptions(options, module);
        let obs = this.domManager.expressionToObservable(exp, ctx);
        let initialApply = true;
        let cleanup;
        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }
        // backup inner HTML
        let template = new Array();
        // subscribe
        state.cleanup.add(obs.subscribe(x => {
            try {
                doCleanup();
                cleanup = new Rx.CompositeDisposable();
                let value = unwrapProperty(x);
                let moduleNames;
                let disp = undefined;
                // split names
                if (value) {
                    value = value.trim();
                    moduleNames = value.split(" ").filter(x => x);
                }
                if (moduleNames.length > 0) {
                    let observables = moduleNames.map(x => loadModule(x));
                    disp = Rx.Observable.combineLatest(observables, function (_) { return args2Array(arguments); }).subscribe(modules => {
                        try {
                            // create intermediate module
                            let moduleName = (module || this.app).name + "+" + moduleNames.join("+");
                            let merged = new Module(moduleName);
                            // merge modules into intermediate
                            merged.merge(module || this.app);
                            modules.forEach(x => merged.merge(x));
                            // done
                            self.applyValue(el, merged, template, ctx, state, initialApply);
                            initialApply = false;
                        }
                        catch (e) {
                            this.app.defaultExceptionHandler.onNext(e);
                        }
                    });
                    if (disp != null)
                        cleanup.add(disp);
                }
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
            obs = null;
            self = null;
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    applyValue(el, module, template, ctx, state, initialApply) {
        if (initialApply) {
            // clone to template
            for (let i = 0; i < el.childNodes.length; i++) {
                template.push(el.childNodes[i].cloneNode(true));
            }
        }
        state.module = module;
        // clean first
        this.domManager.cleanDescendants(el);
        // clear
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        // clone nodes and inject
        for (let i = 0; i < template.length; i++) {
            let node = template[i].cloneNode(true);
            el.appendChild(node);
        }
        this.domManager.applyBindingsToDescendants(ctx, el);
    }
}
//# sourceMappingURL=Module.js.map