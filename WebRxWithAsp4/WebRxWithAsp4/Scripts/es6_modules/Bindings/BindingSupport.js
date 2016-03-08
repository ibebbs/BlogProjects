/// <reference path="../Interfaces.ts" />
import * as log from "../Core/Log";
"use strict";
export function emitPropRefHint(bindingName, bindingString) {
    let msg = `${bindingName}-Binding: You have passed a property instead of a propRef to a Two-Way binding. This is most likely not what you want because the binding won't be able to update your model when your view changes - Solution: Prefix your property with an @-symbol - Binding-Expression ["${bindingString}"]`;
    log.hint(msg);
}
//# sourceMappingURL=BindingSupport.js.map