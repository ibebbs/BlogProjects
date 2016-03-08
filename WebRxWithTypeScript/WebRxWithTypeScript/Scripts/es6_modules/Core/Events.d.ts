/// <reference path="../Interfaces.d.ts" />
export declare class PropertyChangedEventArgs implements wx.IPropertyChangedEventArgs {
    constructor(sender: any, propertyName: string);
    sender: any;
    propertyName: string;
}
