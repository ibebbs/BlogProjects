/// <reference path="../Interfaces.ts" />
import { whenAny, isRxScheduler } from "../Core/Utils";
import IID from "./../IID";
import Lazy from "./../Core/Lazy";
import { createScheduledSubject } from "./../Core/ScheduledSubject";
import { property } from "../Core/Property";
"use strict";
/**
* PagedObservableListProjection implements a virtual paging projection over
* an existing observable list. The class solely relies on index translation
* and change notifications from its upstream source. It does not maintain data.
* @class
*/
export class PagedObservableListProjection {
    constructor(source, pageSize, currentPage, scheduler) {
        ////////////////////
        // Implementation
        this.disp = new Rx.CompositeDisposable();
        this.changeNotificationsSuppressed = 0;
        this.resetSubject = new Rx.Subject();
        this.beforeResetSubject = new Rx.Subject();
        this.updateLengthTrigger = new Rx.Subject();
        this.source = source;
        this.scheduler = scheduler || (isRxScheduler(currentPage) ? currentPage : Rx.Scheduler.immediate);
        // IPagedObservableReadOnlyList
        this.pageSize = property(pageSize);
        this.currentPage = property(currentPage || 0);
        let updateLengthTrigger = Rx.Observable.merge(this.updateLengthTrigger, source.lengthChanged)
            .startWith(true)
            .observeOn(Rx.Scheduler.immediate);
        this.pageCount = whenAny(this.pageSize, updateLengthTrigger, (ps, _) => Math.ceil(source.length() / ps))
            .distinctUntilChanged()
            .toProperty();
        this.disp.add(this.pageCount);
        // length
        this.length = whenAny(this.currentPage, this.pageSize, updateLengthTrigger, (cp, ps, _) => Math.max(Math.min(source.length() - (ps * cp), ps), 0))
            .distinctUntilChanged()
            .toProperty();
        this.disp.add(this.length);
        this.isEmpty = this.lengthChanged
            .select(x => x === 0)
            .toProperty(this.length() === 0);
        this.disp.add(this.isEmpty);
        // isEmptyChanged
        this.isEmptyChanged = whenAny(this.length, (len) => len == 0)
            .distinctUntilChanged();
        // IObservableReadOnlyList
        this.beforeItemsAddedSubject = new Lazy(() => new Rx.Subject());
        this.itemsAddedSubject = new Lazy(() => new Rx.Subject());
        this.beforeItemsRemovedSubject = new Lazy(() => new Rx.Subject());
        this.itemsRemovedSubject = new Lazy(() => new Rx.Subject());
        this.beforeItemReplacedSubject = new Lazy(() => new Rx.Subject());
        this.itemReplacedSubject = new Lazy(() => new Rx.Subject());
        this.itemChangingSubject = new Lazy(() => createScheduledSubject(scheduler));
        this.itemChangedSubject = new Lazy(() => createScheduledSubject(scheduler));
        this.beforeItemsMovedSubject = new Lazy(() => new Rx.Subject());
        this.itemsMovedSubject = new Lazy(() => new Rx.Subject());
        // shouldReset (short-circuit)
        this.shouldReset = this.resetSubject.asObservable();
        this.listChanged = Rx.Observable.merge(this.itemsAdded.select(x => false), this.itemsRemoved.select(x => false), this.itemReplaced.select(x => false), this.itemsMoved.select(x => false), this.resetSubject.select(x => true))
            .publish()
            .refCount();
        this.listChanging = Rx.Observable.merge(this.beforeItemsAdded.select(x => false), this.beforeItemsRemoved.select(x => false), this.beforeItemReplaced.select(x => false), this.beforeItemsMoved.select(x => false), this.beforeResetSubject.select(x => true))
            .publish()
            .refCount();
        this.wireUpChangeNotifications();
    }
    //////////////////////////////////
    // IUnknown implementation
    queryInterface(iid) {
        return iid === IID.IObservableList || iid === IID.IDisposable;
    }
    get(index) {
        index = this.pageSize() * this.currentPage() + index;
        return this.source.get(index);
    }
    get isReadOnly() {
        return true;
    }
    indexOf(item) {
        return this.toArray().indexOf(item);
    }
    contains(item) {
        return this.indexOf(item) !== -1;
    }
    toArray() {
        let start = this.pageSize() * this.currentPage();
        return this.source.toArray().slice(start, start + this.length());
    }
    forEach(callbackfn, thisArg) {
        this.toArray().forEach(callbackfn, thisArg);
    }
    map(callbackfn, thisArg) {
        return this.toArray().map(callbackfn, thisArg);
    }
    filter(callbackfn, thisArg) {
        return this.toArray().filter(callbackfn, thisArg);
    }
    some(callbackfn, thisArg) {
        return this.toArray().some(callbackfn, thisArg);
    }
    every(callbackfn, thisArg) {
        return this.toArray().every(callbackfn, thisArg);
    }
    suppressChangeNotifications() {
        this.changeNotificationsSuppressed++;
        return Rx.Disposable.create(() => {
            this.changeNotificationsSuppressed--;
            if (this.changeNotificationsSuppressed === 0) {
                this.publishBeforeResetNotification();
                this.publishResetNotification();
            }
        });
    }
    //////////////////////////////////
    // IDisposable implementation
    dispose() {
        this.disp.dispose();
    }
    get itemsAdded() {
        if (!this._itemsAdded)
            this._itemsAdded = this.itemsAddedSubject.value.asObservable();
        return this._itemsAdded;
    }
    get beforeItemsAdded() {
        if (!this._beforeItemsAdded)
            this._beforeItemsAdded = this.beforeItemsAddedSubject.value.asObservable();
        return this._beforeItemsAdded;
    }
    get itemsRemoved() {
        if (!this._itemsRemoved)
            this._itemsRemoved = this.itemsRemovedSubject.value.asObservable();
        return this._itemsRemoved;
    }
    get beforeItemsRemoved() {
        if (!this._beforeItemsRemoved)
            this._beforeItemsRemoved = this.beforeItemsRemovedSubject.value.asObservable();
        return this._beforeItemsRemoved;
    }
    get itemReplaced() {
        if (!this._itemReplaced)
            this._itemReplaced = this.itemReplacedSubject.value.asObservable();
        return this._itemReplaced;
    }
    get beforeItemReplaced() {
        if (!this._beforeItemReplaced)
            this._beforeItemReplaced = this.beforeItemReplacedSubject.value.asObservable();
        return this._beforeItemReplaced;
    }
    get beforeItemsMoved() {
        if (!this._beforeItemsMoved)
            this._beforeItemsMoved = this.beforeItemsMovedSubject.value.asObservable();
        return this._beforeItemsMoved;
    }
    get itemsMoved() {
        if (!this._itemsMoved)
            this._itemsMoved = this.itemsMovedSubject.value.asObservable();
        return this._itemsMoved;
    }
    get lengthChanging() {
        if (!this._lengthChanging)
            this._lengthChanging = this.length.changing.distinctUntilChanged();
        return this._lengthChanging;
    }
    get lengthChanged() {
        if (!this._lengthChanged)
            this._lengthChanged = this.length.changed.distinctUntilChanged();
        return this._lengthChanged;
    }
    wireUpChangeNotifications() {
        this.disp.add(this.source.itemsAdded.observeOn(this.scheduler).subscribe((e) => {
            // force immediate recalculation of length, pageCount etc.
            this.updateLengthTrigger.onNext(true);
            this.onItemsAdded(e);
        }));
        this.disp.add(this.source.itemsRemoved.observeOn(this.scheduler).subscribe((e) => {
            // force immediate recalculation of length, pageCount etc.
            this.updateLengthTrigger.onNext(true);
            this.onItemsRemoved(e);
        }));
        this.disp.add(this.source.itemsMoved.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsMoved(e);
        }));
        this.disp.add(this.source.itemReplaced.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsReplaced(e);
        }));
        this.disp.add(this.source.shouldReset.observeOn(this.scheduler).subscribe((e) => {
            // force immediate recalculation of length, pageCount etc.
            this.updateLengthTrigger.onNext(true);
            this.publishBeforeResetNotification();
            this.publishResetNotification();
        }));
        this.disp.add(whenAny(this.pageSize, this.currentPage, (ps, cp) => true).observeOn(this.scheduler).subscribe((e) => {
            this.publishBeforeResetNotification();
            this.publishResetNotification();
        }));
    }
    getPageRange() {
        const from = this.currentPage() * this.pageSize();
        const result = { from: from, to: from + this.length() };
        return result;
    }
    publishResetNotification() {
        this.resetSubject.onNext(true);
    }
    publishBeforeResetNotification() {
        this.beforeResetSubject.onNext(true);
    }
    onItemsAdded(e) {
        const page = this.getPageRange();
        // items added beneath the window can be ignored
        if (e.from > page.to)
            return;
        // adding items before the window results in a reset
        if (e.from < page.from) {
            this.publishBeforeResetNotification();
            this.publishResetNotification();
        }
        else {
            // compute relative start index
            const from = e.from - page.from;
            const numItems = Math.min(this.length() - from, e.items.length);
            // limit items
            const items = e.items.length !== numItems ? e.items.slice(0, numItems) : e.items;
            // emit translated notifications
            const er = { from: from, items: items };
            if (this.beforeItemsAddedSubject.isValueCreated)
                this.beforeItemsAddedSubject.value.onNext(er);
            if (this.itemsAddedSubject.isValueCreated)
                this.itemsAddedSubject.value.onNext(er);
        }
    }
    onItemsRemoved(e) {
        const page = this.getPageRange();
        // items added beneath the window can be ignored
        if (e.from > page.to)
            return;
        // adding items before the window results in a reset
        if (e.from < page.from) {
            this.publishBeforeResetNotification();
            this.publishResetNotification();
        }
        else {
            // compute relative start index
            const from = e.from - page.from;
            const numItems = Math.min(this.length() - from, e.items.length);
            // limit items
            const items = e.items.length !== numItems ? e.items.slice(0, numItems) : e.items;
            // emit translated notifications
            const er = { from: from, items: items };
            if (this.beforeItemsRemovedSubject.isValueCreated)
                this.beforeItemsRemovedSubject.value.onNext(er);
            if (this.itemsRemovedSubject.isValueCreated)
                this.itemsRemovedSubject.value.onNext(er);
        }
    }
    onItemsMoved(e) {
        const page = this.getPageRange();
        let from = 0, to = 0;
        let er;
        // a move completely above or below the window should be ignored
        if (e.from >= page.to && e.to >= page.to ||
            e.from < page.from && e.to < page.from) {
            return;
        }
        // from-index inside page?
        if (e.from >= page.from && e.from < page.to) {
            // to-index as well?
            if (e.to >= page.from && e.to < page.to) {
                // item was moved inside the page
                from = e.from - page.from;
                to = e.to - page.from;
                er = { from: from, to: to, items: e.items };
                if (this.beforeItemsMovedSubject.isValueCreated)
                    this.beforeItemsMovedSubject.value.onNext(er);
                if (this.itemsMovedSubject.isValueCreated)
                    this.itemsMovedSubject.value.onNext(er);
                return;
            }
            else if (e.to >= page.to) {
                // item was moved out of the page somewhere below window
                const lastValidIndex = this.length() - 1;
                // generate removed notification
                from = e.from - page.from;
                if (from !== lastValidIndex) {
                    er = { from: from, items: e.items };
                    if (this.beforeItemsRemovedSubject.isValueCreated)
                        this.beforeItemsRemovedSubject.value.onNext(er);
                    if (this.itemsRemovedSubject.isValueCreated)
                        this.itemsRemovedSubject.value.onNext(er);
                    // generate fake-add notification for last item in page
                    from = this.length() - 1;
                    er = { from: from, items: [this.get(from)] };
                    if (this.beforeItemsAddedSubject.isValueCreated)
                        this.beforeItemsAddedSubject.value.onNext(er);
                    if (this.itemsAddedSubject.isValueCreated)
                        this.itemsAddedSubject.value.onNext(er);
                }
                else {
                    // generate fake-replace notification for last item in page
                    from = this.length() - 1;
                    er = { from: from, items: [this.get(from)] };
                    if (this.beforeItemReplacedSubject.isValueCreated)
                        this.beforeItemReplacedSubject.value.onNext(er);
                    if (this.itemReplacedSubject.isValueCreated)
                        this.itemReplacedSubject.value.onNext(er);
                }
                return;
            }
        }
        // reset in all other cases
        this.publishBeforeResetNotification();
        this.publishResetNotification();
    }
    onItemsReplaced(e) {
        const page = this.getPageRange();
        // items replaced outside the window can be ignored
        if (e.from > page.to || e.from < page.from)
            return;
        // compute relative start index
        const from = e.from - page.from;
        // emit translated notifications
        const er = { from: from, items: e.items };
        if (this.beforeItemReplacedSubject.isValueCreated)
            this.beforeItemReplacedSubject.value.onNext(er);
        if (this.itemReplacedSubject.isValueCreated)
            this.itemReplacedSubject.value.onNext(er);
    }
}
//# sourceMappingURL=ListPaged.js.map