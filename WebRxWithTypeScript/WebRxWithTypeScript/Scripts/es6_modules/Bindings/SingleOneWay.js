/// <reference path="../Interfaces.ts" />
import { toggleCssClass, elementCanBeDisabled } from "../Core/Utils";
import { SingleOneWayBindingBase } from "./BindingBase";
"use strict";
////////////////////
// Bindings
export class TextBinding extends SingleOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app);
    }
    applyValue(el, value) {
        if ((value === null) || (value === undefined))
            value = "";
        el.textContent = value;
    }
}
export class VisibleBinding extends SingleOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app);
        this.inverse = false;
        this.inverse = false;
        this.priority = 10;
    }
    configure(_options) {
        let options = _options;
        VisibleBinding.useCssClass = options.useCssClass;
        VisibleBinding.hiddenClass = options.hiddenClass;
    }
    ////////////////////
    // implementation
    applyValue(el, value) {
        value = this.inverse ? !value : value;
        if (!VisibleBinding.useCssClass) {
            if (!value) {
                el.style.display = "none";
            }
            else {
                el.style.display = "";
            }
        }
        else {
            toggleCssClass(el, !value, VisibleBinding.hiddenClass);
        }
    }
}
export class HiddenBinding extends VisibleBinding {
    constructor(domManager, app) {
        super(domManager, app);
        this.inverse = true;
    }
}
export class HtmlBinding extends SingleOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app);
    }
    applyValue(el, value) {
        if ((value === null) || (value === undefined))
            value = "";
        el.innerHTML = value;
    }
}
export class DisableBinding extends SingleOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app);
        this.inverse = false;
        this.inverse = false;
    }
    ////////////////////
    // implementation
    applyValue(el, value) {
        value = this.inverse ? !value : value;
        if (elementCanBeDisabled(el)) {
            el.disabled = value;
        }
    }
}
export class EnableBinding extends DisableBinding {
    constructor(domManager, app) {
        super(domManager, app);
        this.inverse = true;
    }
}
//# sourceMappingURL=SingleOneWay.js.map