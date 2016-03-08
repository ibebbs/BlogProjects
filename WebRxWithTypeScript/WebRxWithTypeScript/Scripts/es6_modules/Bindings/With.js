/// <reference path="../Interfaces.ts" />
import { throwError, unwrapProperty } from "../Core/Utils";
"use strict";
export default class WithBinding {
    constructor(domManager, app) {
        this.priority = 50;
        this.controlsDescendants = true;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("with-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let self = this;
        let exp = this.domManager.compileBindingOptions(options, module);
        let obs = this.domManager.expressionToObservable(exp, ctx);
        // subscribe
        state.cleanup.add(obs.subscribe(x => {
            try {
                self.applyValue(el, unwrapProperty(x), state);
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
            el = null;
            self = null;
            // nullify locals
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    applyValue(el, value, state) {
        state.model = value;
        let ctx = this.domManager.getDataContext(el);
        this.domManager.cleanDescendants(el);
        this.domManager.applyBindingsToDescendants(ctx, el);
    }
}
//# sourceMappingURL=With.js.map