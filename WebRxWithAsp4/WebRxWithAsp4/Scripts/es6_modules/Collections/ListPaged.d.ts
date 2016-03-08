/// <reference path="../Interfaces.d.ts" />
/**
* PagedObservableListProjection implements a virtual paging projection over
* an existing observable list. The class solely relies on index translation
* and change notifications from its upstream source. It does not maintain data.
* @class
*/
export declare class PagedObservableListProjection<T> implements wx.IPagedObservableReadOnlyList<T>, wx.IUnknown {
    constructor(source: wx.IObservableReadOnlyList<T>, pageSize: number, currentPage?: number, scheduler?: Rx.IScheduler);
    queryInterface(iid: string): boolean;
    source: wx.IObservableReadOnlyList<T>;
    pageSize: wx.IObservableProperty<number>;
    currentPage: wx.IObservableProperty<number>;
    pageCount: wx.IObservableProperty<number>;
    length: wx.IObservableProperty<number>;
    get(index: number): T;
    isReadOnly: boolean;
    isEmpty: wx.IObservableProperty<boolean>;
    indexOf(item: T): number;
    contains(item: T): boolean;
    toArray(): Array<T>;
    forEach(callbackfn: (value: T, from: number, array: T[]) => void, thisArg?: any): void;
    map<U>(callbackfn: (value: T, from: number, array: T[]) => U, thisArg?: any): U[];
    filter(callbackfn: (value: T, from: number, array: T[]) => boolean, thisArg?: any): T[];
    some(callbackfn: (value: T, from: number, array: T[]) => boolean, thisArg?: any): boolean;
    every(callbackfn: (value: T, from: number, array: T[]) => boolean, thisArg?: any): boolean;
    listChanging: Rx.Observable<boolean>;
    listChanged: Rx.Observable<boolean>;
    isEmptyChanged: Rx.Observable<boolean>;
    shouldReset: Rx.Observable<any>;
    suppressChangeNotifications(): Rx.IDisposable;
    dispose(): void;
    private disp;
    private changeNotificationsSuppressed;
    private resetSubject;
    private beforeResetSubject;
    private scheduler;
    private updateLengthTrigger;
    private beforeItemsAddedSubject;
    private itemsAddedSubject;
    private beforeItemsRemovedSubject;
    private itemsRemovedSubject;
    private beforeItemReplacedSubject;
    private itemReplacedSubject;
    private itemChangingSubject;
    private itemChangedSubject;
    private beforeItemsMovedSubject;
    private itemsMovedSubject;
    private _itemsAdded;
    private _beforeItemsAdded;
    private _itemsRemoved;
    private _beforeItemsRemoved;
    private _beforeItemsMoved;
    private _itemReplaced;
    private _beforeItemReplaced;
    private _itemsMoved;
    private _lengthChanging;
    private _lengthChanged;
    private _itemChanging;
    private _itemChanged;
    itemsAdded: Rx.Observable<wx.IListChangeInfo<T>>;
    beforeItemsAdded: Rx.Observable<wx.IListChangeInfo<T>>;
    itemsRemoved: Rx.Observable<wx.IListChangeInfo<T>>;
    beforeItemsRemoved: Rx.Observable<wx.IListChangeInfo<T>>;
    itemReplaced: Rx.Observable<wx.IListChangeInfo<T>>;
    beforeItemReplaced: Rx.Observable<wx.IListChangeInfo<T>>;
    beforeItemsMoved: Rx.Observable<wx.IListChangeInfo<T>>;
    itemsMoved: Rx.Observable<wx.IListChangeInfo<T>>;
    lengthChanging: Rx.Observable<number>;
    lengthChanged: Rx.Observable<number>;
    private wireUpChangeNotifications();
    private getPageRange();
    private publishResetNotification();
    private publishBeforeResetNotification();
    private onItemsAdded(e);
    private onItemsRemoved(e);
    private onItemsMoved(e);
    private onItemsReplaced(e);
}
