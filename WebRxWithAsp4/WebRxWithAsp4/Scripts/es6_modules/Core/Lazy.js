"use strict";
/**
* .Net's Lazy<T>
* @class
*/
export default class Lazy {
    constructor(createValue) {
        this.createValue = createValue;
    }
    get value() {
        if (!this.isValueCreated) {
            this.createdValue = this.createValue();
            this.isValueCreated = true;
        }
        return this.createdValue;
    }
}
//# sourceMappingURL=Lazy.js.map