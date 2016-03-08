/// <reference path="../../Interfaces.ts" />
import { args2Array, throwError, unwrapProperty, toggleCssClass } from "../../Core/Utils";
"use strict";
export default class StateActiveBinding {
    constructor(domManager, router, app) {
        this.priority = 5;
        this.domManager = domManager;
        this.router = router;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("stateActive-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let compiled = this.domManager.compileBindingOptions(options, module);
        let exp;
        let observables = [];
        let opt = compiled;
        let paramsKeys = [];
        let stateName;
        let stateParams;
        let cssClass = "active";
        observables.push(this.router.current.changed.startWith(this.router.current()));
        if (typeof compiled === "function") {
            exp = compiled;
            observables.push(this.domManager.expressionToObservable(exp, ctx));
        }
        else {
            // collect state-name observable
            observables.push(this.domManager.expressionToObservable(opt.name, ctx));
            // collect params observables
            if (opt.params) {
                Object.keys(opt.params).forEach(x => {
                    paramsKeys.push(x);
                    observables.push(this.domManager.expressionToObservable(opt.params[x], ctx));
                });
            }
            if (opt.cssClass) {
                cssClass = this.domManager.evaluateExpression(opt.cssClass, ctx);
            }
        }
        // subscribe to any input changes
        state.cleanup.add(Rx.Observable.combineLatest(observables, function (_) { return args2Array(arguments); }).subscribe(latest => {
            try {
                // first element is the current state
                let currentState = latest.shift();
                // second element is the state-name
                stateName = unwrapProperty(latest.shift());
                // subsequent entries are latest param values
                stateParams = {};
                for (let i = 0; i < paramsKeys.length; i++) {
                    stateParams[paramsKeys[i]] = unwrapProperty(latest[i]);
                }
                let active = this.router.includes(stateName, stateParams);
                let classes = cssClass.split(/\s+/).map(x => x.trim()).filter(x => x);
                if (classes.length) {
                    toggleCssClass.apply(null, [el, active].concat(classes));
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
            // nullify locals
            observables = null;
            compiled = null;
            stateName = null;
            stateParams = null;
            opt = null;
            paramsKeys = null;
        }));
    }
    configure(options) {
        // intentionally left blank
    }
}
//# sourceMappingURL=StateActive.js.map