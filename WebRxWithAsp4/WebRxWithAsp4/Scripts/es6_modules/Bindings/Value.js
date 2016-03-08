/// <reference path="../Interfaces.ts" />
import { throwError, isProperty, isReadOnlyProperty } from "../Core/Utils";
import * as res from "../Core/Resources";
"use strict";
export default class ValueBinding {
    constructor(domManager, app) {
        this.priority = 5;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("value-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let tag = el.tagName.toLowerCase();
        if (tag !== 'input' && tag !== 'option' && tag !== 'select' && tag !== 'textarea')
            throwError("value-binding only operates on checkboxes and radio-buttons");
        const storeValueInNodeState = (tag === 'input' && el.type === 'radio') || tag === 'option';
        let prop;
        let cleanup;
        let exp = this.domManager.compileBindingOptions(options, module);
        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }
        function updateElement(domManager, value) {
            if (storeValueInNodeState)
                setNodeValue(el, value, domManager);
            else {
                if ((value === null) || (value === undefined))
                    value = "";
                el.value = value;
            }
        }
        // options is supposed to be a field-access path
        state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
            try {
                if (!isProperty(model)) {
                    // initial and final update
                    updateElement(this.domManager, model);
                }
                else {
                    doCleanup();
                    cleanup = new Rx.CompositeDisposable();
                    // update on property change
                    prop = model;
                    cleanup.add(prop.changed.subscribe(x => {
                        updateElement(this.domManager, x);
                    }));
                    // initial update
                    updateElement(this.domManager, prop());
                    // don't attempt to updated computed properties
                    if (!isReadOnlyProperty(prop)) {
                        cleanup.add(Rx.Observable.fromEvent(el, 'change').subscribe(e => {
                            try {
                                if (storeValueInNodeState)
                                    prop(getNodeValue(el, this.domManager));
                                else
                                    prop(el.value);
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
}
/**
 * For certain elements such as select and input type=radio we store
 * the real element value in NodeState if it is anything other than a
 * string. This method returns that value.
 * @param {Node} node
 * @param {IDomManager} domManager
 */
export function getNodeValue(node, domManager) {
    let state = domManager.getNodeState(node);
    if (state != null && state[res.hasValueBindingValue]) {
        return state[res.valueBindingValue];
    }
    return node.value;
}
/**
 * Associate a value with an element. Either by using its value-attribute
 * or storing it in NodeState
 * @param {Node} node
 * @param {any} value
 * @param {IDomManager} domManager
 */
export function setNodeValue(node, value, domManager) {
    if ((value === null) || (value === undefined))
        value = "";
    let state = domManager.getNodeState(node);
    if (typeof value === "string") {
        // Update the element only if the element and model are different. On some browsers, updating the value
        // will move the cursor to the end of the input, which would be bad while the user is typing.
        if (node.value !== value) {
            node.value = value;
            // clear state since value is stored in attribute
            if (state != null && state[res.hasValueBindingValue]) {
                state[res.hasValueBindingValue] = false;
                state[res.valueBindingValue] = undefined;
            }
        }
    }
    else {
        // get or create state
        if (state == null) {
            state = this.createNodeState();
            this.setNodeState(node, state);
        }
        // store value
        state[res.valueBindingValue] = value;
        state[res.hasValueBindingValue] = true;
    }
}
//# sourceMappingURL=Value.js.map