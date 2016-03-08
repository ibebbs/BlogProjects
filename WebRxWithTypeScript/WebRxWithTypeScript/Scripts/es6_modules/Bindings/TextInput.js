/// <reference path="../Interfaces.ts" />
import { throwError, isProperty, isReadOnlyProperty } from "../Core/Utils";
import * as env from "../Core/Environment";
import { emitPropRefHint } from "./BindingSupport";
"use strict";
export default class TextInputBinding {
    constructor(domManager, app) {
        this.priority = 0;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("textInput-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let tag = el.tagName.toLowerCase();
        let isTextArea = tag === "textarea";
        if (tag !== 'input' && tag !== 'textarea')
            throwError("textInput-binding can only be applied to input or textarea elements");
        let exp = this.domManager.compileBindingOptions(options, module);
        let prop;
        let propertySubscription;
        let eventSubscription;
        let previousElementValue;
        function updateElement(value) {
            if (value === null || value === undefined) {
                value = "";
            }
            // Update the element only if the element and model are different. On some browsers, updating the value
            // will move the cursor to the end of the input, which would be bad while the user is typing.
            if (el.value !== value) {
                previousElementValue = value; // Make sure we ignore events (propertychange) that result from updating the value
                el.value = value;
            }
        }
        function doCleanup() {
            if (propertySubscription) {
                propertySubscription.dispose();
                propertySubscription = null;
            }
            if (eventSubscription) {
                eventSubscription.dispose();
                eventSubscription = null;
            }
        }
        state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(src => {
            try {
                if (!isProperty(src)) {
                    emitPropRefHint("TextInput", options);
                    // initial and final update
                    updateElement(src);
                }
                else {
                    doCleanup();
                    // update on property change
                    prop = src;
                    propertySubscription = prop.changed.subscribe(x => {
                        updateElement(x);
                    });
                    // initial update
                    updateElement(prop());
                    // don't attempt to updated computed properties
                    if (!isReadOnlyProperty(prop)) {
                        // wire change-events depending on browser and version
                        let events = this.getTextInputEventObservables(el, isTextArea);
                        eventSubscription = Rx.Observable.merge(events).subscribe(e => {
                            try {
                                prop(el.value);
                            }
                            catch (e) {
                                this.app.defaultExceptionHandler.onNext(e);
                            }
                        });
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
    getTextInputEventObservables(el, isTextArea) {
        let result = [];
        if (env.ie && env.ie.version < 10) {
            if (env.ie.version <= 9) {
                // Internet Explorer 9 doesn't fire the 'input' event when deleting text, including using
                // the backspace, delete, or ctrl-x keys, clicking the 'x' to clear the input, dragging text
                // out of the field, and cutting or deleting text using the context menu. 'selectionchange'
                // can detect all of those except dragging text out of the field, for which we use 'dragend'.
                result.push(env.ie.getSelectionChangeObservable(el).where(doc => doc.activeElement === el));
                result.push(Rx.Observable.fromEvent(el, 'dragend'));
                // IE 9 does support 'input', but since it doesn't fire it when
                // using autocomplete, we'll use 'propertychange' for it also.
                result.push(Rx.Observable.fromEvent(el, 'input'));
                result.push(Rx.Observable.fromEvent(el, 'propertychange').where(e => e.propertyName === 'value'));
            }
        }
        else {
            // All other supported browsers support the 'input' event, which fires whenever the content of the element is changed
            // through the user interface.
            result.push(Rx.Observable.fromEvent(el, 'input'));
            if (env.safari && env.safari.version < 5 && isTextArea) {
                // Safari <5 doesn't fire the 'input' event for <textarea> elements (it does fire 'textInput'
                // but only when typing). So we'll just catch as much as we can with keydown, cut, and paste.
                result.push(Rx.Observable.fromEvent(el, 'keydown'));
                result.push(Rx.Observable.fromEvent(el, 'paste'));
                result.push(Rx.Observable.fromEvent(el, 'cut'));
            }
            else if (env.opera && env.opera.version < 11) {
                // Opera 10 doesn't always fire the 'input' event for cut, paste, undo & drop operations.
                // We can try to catch some of those using 'keydown'.
                result.push(Rx.Observable.fromEvent(el, 'keydown'));
            }
            else if (env.firefox && env.firefox.version < 4.0) {
                // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete
                result.push(Rx.Observable.fromEvent(el, 'DOMAutoComplete'));
                // Firefox <=3.5 doesn't fire the 'input' event when text is dropped into the input.
                result.push(Rx.Observable.fromEvent(el, 'dragdrop')); // <3.5
                result.push(Rx.Observable.fromEvent(el, 'drop')); // 3.5
            }
        }
        // Bind to the change event so that we can catch programmatic updates of the value that fire this event.
        result.push(Rx.Observable.fromEvent(el, 'change'));
        return result;
    }
}
//# sourceMappingURL=TextInput.js.map