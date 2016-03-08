/// <reference path="../Interfaces.ts" />
import { throwError, unwrapProperty, isProperty } from "../Core/Utils";
import { getNodeValue } from "./Value";
import { isList } from "../Collections/ListSupport";
import { emitPropRefHint } from "./BindingSupport";
"use strict";
let impls = new Array();
class RadioSingleSelectionImpl {
    constructor(domManager) {
        this.domManager = domManager;
    }
    supports(el, model) {
        return (el.tagName.toLowerCase() === 'input' &&
            el.getAttribute("type") === 'radio') &&
            !isList(model);
    }
    observeElement(el) {
        return Rx.Observable.merge(Rx.Observable.fromEvent(el, 'click'), Rx.Observable.fromEvent(el, 'change'));
    }
    observeModel(model) {
        if (isProperty(model)) {
            let prop = model;
            return prop.changed;
        }
        return Rx.Observable.never();
    }
    updateElement(el, model) {
        let input = el;
        input.checked = getNodeValue(input, this.domManager) == unwrapProperty(model);
    }
    updateModel(el, model, e) {
        let input = el;
        if (input.checked) {
            model(getNodeValue(input, this.domManager));
        }
    }
}
class OptionSingleSelectionImpl {
    constructor(domManager) {
        this.domManager = domManager;
    }
    supports(el, model) {
        return el.tagName.toLowerCase() === 'select' &&
            !isList(model);
    }
    observeElement(el) {
        return Rx.Observable.fromEvent(el, 'change');
    }
    observeModel(model) {
        if (isProperty(model)) {
            let prop = model;
            return prop.changed;
        }
        return Rx.Observable.never();
    }
    updateElement(el, model) {
        let select = el;
        let value = unwrapProperty(model);
        let length = select.options.length;
        if (value == null) {
            select.selectedIndex = -1;
        }
        else {
            for (let i = 0; i < length; i++) {
                let option = select.options[i];
                if (getNodeValue(option, this.domManager) == value) {
                    select.selectedIndex = i;
                    break;
                }
            }
        }
    }
    updateModel(el, model, e) {
        let select = el;
        // selected-value comes from the option at selectedIndex
        let value = select.selectedIndex !== -1 ?
            getNodeValue(select.options[select.selectedIndex], this.domManager) :
            undefined;
        model(value);
    }
}
export default class SelectedValueBinding {
    constructor(domManager, app) {
        this.priority = 0;
        this.domManager = domManager;
        this.app = app;
        impls.push(new RadioSingleSelectionImpl(domManager));
        impls.push(new OptionSingleSelectionImpl(domManager));
    }
    ////////////////////
    // IBindingHandler
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("selectedValue-binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let impl;
        let implCleanup;
        let exp = this.domManager.compileBindingOptions(options, module);
        function cleanupImpl() {
            if (implCleanup) {
                implCleanup.dispose();
                implCleanup = null;
            }
        }
        // options is supposed to be a field-access path
        state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
            try {
                cleanupImpl();
                // lookup implementation
                impl = undefined;
                for (let i = 0; i < impls.length; i++) {
                    if (impls[i].supports(el, model)) {
                        impl = impls[i];
                        break;
                    }
                }
                if (!impl)
                    throwError("selectedValue-binding does not support this combination of bound element and model!");
                implCleanup = new Rx.CompositeDisposable();
                // initial update
                impl.updateElement(el, model);
                // update on model change
                implCleanup.add(impl.observeModel(model).subscribe(x => {
                    try {
                        impl.updateElement(el, model);
                    }
                    catch (e) {
                        this.app.defaultExceptionHandler.onNext(e);
                    }
                }));
                // wire change-events
                if (isProperty(model)) {
                    implCleanup.add(impl.observeElement(el).subscribe(e => {
                        try {
                            impl.updateModel(el, model, e);
                        }
                        catch (e) {
                            this.app.defaultExceptionHandler.onNext(e);
                        }
                    }));
                }
                else {
                    emitPropRefHint("SelectedValue", options);
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
            cleanupImpl();
        }));
    }
    configure(options) {
        // intentionally left blank
    }
}
//# sourceMappingURL=SelectedValue.js.map