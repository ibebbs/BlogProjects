/// <reference path="../Interfaces.ts" />
import { throwError, isProperty, isReadOnlyProperty } from "../Core/Utils";
import { emitPropRefHint } from "./BindingSupport";
"use strict";
export default class CheckedBinding {
    constructor(domManager, app) {
        this.priority = 0;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("checked-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let tag = el.tagName.toLowerCase();
        let isCheckBox = el.type === 'checkbox';
        let isRadioButton = el.type === 'radio';
        if (tag !== 'input' || (!isCheckBox && !isRadioButton))
            throwError("checked-binding only operates on checkboxes and radio-buttons");
        let exp = this.domManager.compileBindingOptions(options, module);
        let prop;
        let cleanup;
        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }
        function updateElement(value) {
            el.checked = value;
        }
        state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
            try {
                if (!isProperty(model)) {
                    emitPropRefHint("Checked", options);
                    // initial and final update
                    updateElement(model);
                }
                else {
                    doCleanup();
                    cleanup = new Rx.CompositeDisposable();
                    // update on property change
                    prop = model;
                    cleanup.add(prop.changed.subscribe(x => {
                        updateElement(x);
                    }));
                    // initial update
                    updateElement(prop());
                    // don't attempt to updated computed properties
                    if (!isReadOnlyProperty(prop)) {
                        // wire change-events depending on browser and version
                        let events = this.getCheckedEventObservables(el);
                        cleanup.add(Rx.Observable.merge(events).subscribe(e => {
                            try {
                                prop(el.checked);
                            }
                            catch (e) {
                                this.app.defaultExceptionHandler.onNext(e);
                            }
                        }));
                    }
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
            el = null;
            // nullify locals
            doCleanup();
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    getCheckedEventObservables(el) {
        let result = [];
        result.push(Rx.Observable.fromEvent(el, 'click'));
        result.push(Rx.Observable.fromEvent(el, 'change'));
        return result;
    }
}
//# sourceMappingURL=Checked.js.map