/// <reference path="../Interfaces.ts" />
import { toggleCssClass } from "../Core/Utils";
import { MultiOneWayBindingBase } from "./BindingBase";
"use strict";
export class CssBinding extends MultiOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app, true);
    }
    applyValue(el, value, key) {
        let classes;
        if (key !== "") {
            classes = key.split(/\s+/).map(x => x.trim()).filter(x => x);
            if (classes.length) {
                toggleCssClass.apply(null, [el, !!value].concat(classes));
            }
        }
        else {
            let state = this.domManager.getNodeState(el);
            // if we have previously added classes, remove them
            if (state.cssBindingPreviousDynamicClasses != null) {
                toggleCssClass.apply(null, [el, false].concat(state.cssBindingPreviousDynamicClasses));
                state.cssBindingPreviousDynamicClasses = null;
            }
            if (value) {
                classes = value.split(/\s+/).map(x => x.trim()).filter(x => x);
                if (classes.length) {
                    toggleCssClass.apply(null, [el, true].concat(classes));
                    state.cssBindingPreviousDynamicClasses = classes;
                }
            }
        }
    }
}
export class AttrBinding extends MultiOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app);
        this.priority = 5;
    }
    applyValue(el, value, key) {
        // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
        // when someProp is a "no value"-like value (strictly null, false, or undefined)
        // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
        let toRemove = (value === false) || (value === null) || (value === undefined);
        if (toRemove)
            el.removeAttribute(key);
        else {
            el.setAttribute(key, value.toString());
        }
    }
}
export class StyleBinding extends MultiOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app);
    }
    applyValue(el, value, key) {
        if (value === null || value === undefined || value === false) {
            // Empty string removes the value, whereas null/undefined have no effect
            value = "";
        }
        el.style[key] = value;
    }
}
//# sourceMappingURL=MultiOneWay.js.map