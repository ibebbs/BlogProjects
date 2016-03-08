/// <reference path="../Interfaces.ts" />
import { args2Array, isFunction, throwError } from "../Core/Utils";
"use strict";
/**
* Base class for simple-bindings. Responsible for taking care of the heavy-lifting.
* @class
*/
export default class SimpleBinding {
    constructor(domManager, app) {
        this.priority = 0;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let compiled = this.domManager.compileBindingOptions(options, module);
        let exp;
        let cleanup;
        let bindingDeps = new Array();
        let bindingState = {};
        let isInit = true;
        const keys = Object.keys(compiled);
        if (typeof compiled === "function") {
            let obs = this.domManager.expressionToObservable(compiled, ctx);
            bindingDeps.push(obs);
        }
        else {
            // transform all properties into observables
            for (let i = 0; i < keys.length; i++) {
                bindingDeps.push(this.domManager.expressionToObservable(compiled[keys[i]], ctx));
            }
        }
        // subscribe to any input changes
        state.cleanup.add(Rx.Observable.combineLatest(bindingDeps, function () { return args2Array(arguments); })
            .subscribe(allValues => {
            try {
                cleanup = new Rx.CompositeDisposable();
                // construct current value
                let value;
                if (typeof compiled === "function") {
                    value = allValues[0];
                }
                else {
                    // collect current values into an object who's signature matches the source options
                    value = {};
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        value[key] = allValues[i];
                    }
                }
                if (isInit && isFunction(this.inner.init)) {
                    this.inner.init(el, value, ctx, this.domManager, bindingState, state.cleanup, module);
                    isInit = false;
                }
                this.inner.update(el, value, ctx, this.domManager, bindingState, state.cleanup, module);
            }
            catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
            }
        }));
        // release closure references to GC
        state.cleanup.add(Rx.Disposable.create(() => {
            if (isFunction(this.inner.cleanup)) {
                this.inner.cleanup(el, this.domManager, bindingState, state.cleanup, module);
            }
            // nullify args
            node = null;
            options = null;
            ctx = null;
            state = null;
            bindingState = null;
            // nullify common locals
            compiled = null;
        }));
    }
    configure(options) {
        // intentionally left blank
    }
}
//# sourceMappingURL=Simple.js.map