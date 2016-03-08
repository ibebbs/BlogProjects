"use strict";
let oid = 1;
const oidPropertyName = "__wx_oid__" + (new Date).getTime();
/**
* Returns the objects unique id or assigns it if unassigned
* @param {any} o
*/
export function getOid(o) {
    if (o == null)
        return undefined;
    let t = typeof o;
    if (t === "boolean" || t === "number" || t === "string")
        return (t + ":" + o);
    // already set?
    let result = o[oidPropertyName];
    if (result !== undefined)
        return result;
    // assign new one
    result = (oid++).toString();
    // store as non-enumerable property to avoid confusing other libraries
    Object.defineProperty(o, oidPropertyName, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: result
    });
    return result;
}
//# sourceMappingURL=Oid.js.map