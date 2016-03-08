/**
* .Net's Lazy<T>
* @class
*/
export default class Lazy<T> {
    constructor(createValue: () => T);
    value: T;
    isValueCreated: boolean;
    private createValue;
    private createdValue;
}
