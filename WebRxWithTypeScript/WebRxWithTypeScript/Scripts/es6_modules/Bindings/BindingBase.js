/// <reference path="../Interfaces.ts" />
import { throwError, unwrapProperty } from "../Core/Utils";
"use strict";
/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export class SingleOneWayBindingBase {
    constructor(domManager, app) {
        this.priority = 0;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBinding
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let self = this;
        let exp = this.domManager.compileBindingOptions(options, module);
        let obs = this.domManager.expressionToObservable(exp, ctx);
        // subscribe
        state.cleanup.add(obs.subscribe(x => {
            try {
                self.applyValue(el, unwrapProperty(x));
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
            el = null;
            obs = null;
            self = null;
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    applyValue(el, value) {
        throwError("you need to override this method!");
    }
}
/**
* Base class for one-way bindings that take multiple expressions defined as object literal and apply the result to one or more target elements
* @class
*/
export class MultiOneWayBindingBase {
    constructor(domManager, app, supportsDynamicValues = false) {
        this.priority = 0;
        this.supportsDynamicValues = false;
        this.domManager = domManager;
        this.app = app;
        this.supportsDynamicValues = supportsDynamicValues;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("binding only operates on elements!");
        let compiled = this.domManager.compileBindingOptions(options, module);
        if (compiled == null || (typeof compiled !== "object" && !this.supportsDynamicValues))
            throwError("invalid binding-options!");
        let el = node;
        let observables = new Array();
        let obs;
        let exp;
        let keys = Object.keys(compiled);
        let key;
        if (typeof compiled === "function") {
            exp = compiled;
            obs = this.domManager.expressionToObservable(exp, ctx);
            observables.push(["", obs]);
        }
        else {
            for (let i = 0; i < keys.length; i++) {
                key = keys[i];
                let value = compiled[key];
                exp = value;
                obs = this.domManager.expressionToObservable(exp, ctx);
                observables.push([key, obs]);
            }
        }
        // subscribe
        for (let i = 0; i < observables.length; i++) {
            key = observables[i][0];
            obs = observables[i][1];
            this.subscribe(el, obs, key, state);
        }
        // release closure references to GC
        state.cleanup.add(Rx.Disposable.create(() => {
            // nullify args
            node = null;
            options = null;
            ctx = null;
            state = null;
            // nullify common locals
            el = null;
            keys = null;
            // nullify locals
            observables = null;
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    subscribe(el, obs, key, state) {
        state.cleanup.add(obs.subscribe(x => {
            try {
                this.applyValue(el, unwrapProperty(x), key);
            }
            catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
            }
        }));
    }
    applyValue(el, key, value) {
        throwError("you need to override this method!");
    }
}
//# sourceMappingURL=BindingBase.js.map