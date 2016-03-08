/// <reference path="../Interfaces.ts" />
import { isInUnitTest, args2Array, throwError, using, isRxObservable, observeObject } from "../Core/Utils";
import { getOid } from "../Core/Oid";
import IID from "./../IID";
import Lazy from "./../Core/Lazy";
import { createScheduledSubject } from "./../Core/ScheduledSubject";
import { PropertyChangedEventArgs } from "../Core/Events";
import RefCountDisposeWrapper from "./../Core/RefCountDisposeWrapper";
import * as log from "./../Core/Log";
import { injector } from "../Core/Injector";
import * as res from "../Core/Resources";
import { PagedObservableListProjection } from "./ListPaged";
"use strict";
/**
* ReactiveUI's awesome ReactiveList ported to Typescript
* @class
*/
export class ObservableList {
    constructor(initialContents, resetChangeThreshold = 0.3, scheduler = null) {
        //////////////////////////
        // Some array convenience members
        this.push = this.add;
        this.changeNotificationsSuppressed = 0;
        this.propertyChangeWatchers = null;
        this.resetChangeThreshold = 0;
        this.resetSubCount = 0;
        this.hasWhinedAboutNoResetSub = false;
        this.readonlyExceptionMessage = "Derived collections cannot be modified.";
        this.disposables = new Rx.CompositeDisposable();
        this.app = injector.get(res.app);
        this.setupRx(initialContents, resetChangeThreshold, scheduler);
    }
    //////////////////////////////////
    // IUnknown implementation
    queryInterface(iid) {
        return iid === IID.IObservableList || iid === IID.IDisposable;
    }
    //////////////////////////////////
    // IDisposable implementation
    dispose() {
        this.clearAllPropertyChangeWatchers();
        this.disposables.dispose();
    }
    ////////////////////
    /// IObservableList<T>
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
            this._lengthChanging = this.listChanging.select(_ => this.inner.length).distinctUntilChanged();
        return this._lengthChanging;
    }
    get lengthChanged() {
        if (!this._lengthChanged)
            this._lengthChanged = this.listChanged.select(_ => this.inner.length).distinctUntilChanged();
        return this._lengthChanged;
    }
    get itemChanging() {
        if (!this._itemChanging)
            this._itemChanging = this.itemChangingSubject.value.asObservable();
        return this._itemChanging;
    }
    get itemChanged() {
        if (!this._itemChanged)
            this._itemChanged = this.itemChangedSubject.value.asObservable();
        return this._itemChanged;
    }
    get shouldReset() {
        return this.refcountSubscribers(this.listChanged.selectMany(x => !x ? Rx.Observable.empty() :
            Rx.Observable.return(null)), x => this.resetSubCount += x);
    }
    get changeTrackingEnabled() {
        return this.propertyChangeWatchers != null;
    }
    set changeTrackingEnabled(newValue) {
        if (this.propertyChangeWatchers != null && newValue)
            return;
        if (this.propertyChangeWatchers == null && !newValue)
            return;
        if (newValue) {
            this.propertyChangeWatchers = {};
            this.inner.forEach(x => this.addItemToPropertyTracking(x));
        }
        else {
            this.clearAllPropertyChangeWatchers();
            this.propertyChangeWatchers = null;
        }
    }
    get isReadOnly() {
        return false;
    }
    addRange(items) {
        if (items == null) {
            throwError("items");
        }
        let disp = this.isLengthAboveResetThreshold(items.length) ? this.suppressChangeNotifications() : Rx.Disposable.empty;
        using(disp, () => {
            // reset notification
            if (!this.areChangeNotificationsEnabled()) {
                // this._inner.splice(this._inner.length, 0, items)
                Array.prototype.push.apply(this.inner, items);
                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.addItemToPropertyTracking(x);
                    });
                }
            }
            else {
                var from = this.inner.length; // need to capture this before "inner" gets modified
                if (this.beforeItemsAddedSubject.isValueCreated) {
                    this.beforeItemsAddedSubject.value.onNext({ items: items, from: from });
                }
                Array.prototype.push.apply(this.inner, items);
                if (this.itemsAddedSubject.isValueCreated) {
                    this.itemsAddedSubject.value.onNext({ items: items, from: from });
                }
                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.addItemToPropertyTracking(x);
                    });
                }
            }
        });
    }
    insertRange(index, items) {
        if (items == null) {
            throwError("collection");
        }
        if (index > this.inner.length) {
            throwError("index");
        }
        let disp = this.isLengthAboveResetThreshold(items.length) ? this.suppressChangeNotifications() : Rx.Disposable.empty;
        using(disp, () => {
            // reset notification
            if (!this.areChangeNotificationsEnabled()) {
                // this._inner.splice(index, 0, items)
                Array.prototype.splice.apply(this.inner, [index, 0].concat(items));
                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.addItemToPropertyTracking(x);
                    });
                }
            }
            else {
                if (this.beforeItemsAddedSubject.isValueCreated) {
                    this.beforeItemsAddedSubject.value.onNext({ items: items, from: index });
                }
                Array.prototype.splice.apply(this.inner, [index, 0].concat(items));
                if (this.itemsAddedSubject.isValueCreated) {
                    this.itemsAddedSubject.value.onNext({ items: items, from: index });
                }
                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.addItemToPropertyTracking(x);
                    });
                }
            }
        });
    }
    removeAll(itemsOrSelector) {
        if (itemsOrSelector == null) {
            throwError("items");
        }
        const items = Array.isArray(itemsOrSelector) ? itemsOrSelector : this.inner.filter(itemsOrSelector);
        let disp = this.isLengthAboveResetThreshold(items.length) ?
            this.suppressChangeNotifications() : Rx.Disposable.empty;
        using(disp, () => {
            // NB: If we don't do this, we'll break Collection<T>'s
            // accounting of the length
            items.forEach(x => this.remove(x));
        });
        return items;
    }
    removeRange(index, count) {
        let disp = this.isLengthAboveResetThreshold(count) ? this.suppressChangeNotifications() : Rx.Disposable.empty;
        using(disp, () => {
            // construct items
            let items = this.inner.slice(index, index + count);
            // reset notification
            if (!this.areChangeNotificationsEnabled()) {
                this.inner.splice(index, count);
                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.removeItemFromPropertyTracking(x);
                    });
                }
            }
            else {
                if (this.beforeItemsRemovedSubject.isValueCreated) {
                    this.beforeItemsRemovedSubject.value.onNext({ items: items, from: index });
                }
                this.inner.splice(index, count);
                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.removeItemFromPropertyTracking(x);
                    });
                }
                if (this.itemsRemovedSubject.isValueCreated) {
                    this.itemsRemovedSubject.value.onNext({ items: items, from: index });
                }
            }
        });
    }
    toArray() {
        return this.inner;
    }
    reset(contents) {
        using(this.suppressChangeNotifications(), (suppress) => {
            this.clear();
            if (contents)
                this.addRange(contents);
        });
    }
    add(item) {
        this.insertItem(this.inner.length, item);
    }
    clear() {
        this.clearItems();
    }
    contains(item) {
        return this.inner.indexOf(item) !== -1;
    }
    remove(item) {
        let index = this.inner.indexOf(item);
        if (index === -1)
            return false;
        this.removeItem(index);
        return true;
    }
    indexOf(item) {
        return this.inner.indexOf(item);
    }
    insert(index, item) {
        this.insertItem(index, item);
    }
    removeAt(index) {
        this.removeItem(index);
    }
    move(oldIndex, newIndex) {
        this.moveItem(oldIndex, newIndex);
    }
    project() {
        let args = args2Array(arguments);
        let filter = args.shift();
        if (filter != null && isRxObservable(filter)) {
            return new ObservableListProjection(this, undefined, undefined, undefined, filter, args.shift());
        }
        let orderer = args.shift();
        if (orderer != null && isRxObservable(orderer)) {
            return new ObservableListProjection(this, filter, undefined, undefined, orderer, args.shift());
        }
        let selector = args.shift();
        if (selector != null && isRxObservable(selector)) {
            return new ObservableListProjection(this, filter, orderer, undefined, selector, args.shift());
        }
        return new ObservableListProjection(this, filter, orderer, selector, args.shift(), args.shift());
    }
    page(pageSize, currentPage, scheduler) {
        return new PagedObservableListProjection(this, pageSize, currentPage, scheduler);
    }
    suppressChangeNotifications() {
        this.changeNotificationsSuppressed++;
        if (!this.hasWhinedAboutNoResetSub && this.resetSubCount === 0 && !isInUnitTest()) {
            log.hint("suppressChangeNotifications was called (perhaps via addRange), yet you do not have a subscription to shouldReset. This probably isn't what you want, as itemsAdded and friends will appear to 'miss' items");
            this.hasWhinedAboutNoResetSub = true;
        }
        return Rx.Disposable.create(() => {
            this.changeNotificationsSuppressed--;
            if (this.changeNotificationsSuppressed === 0) {
                this.publishBeforeResetNotification();
                this.publishResetNotification();
            }
        });
    }
    get(index) {
        return this.inner[index];
    }
    set(index, item) {
        if (!this.areChangeNotificationsEnabled()) {
            if (this.changeTrackingEnabled) {
                this.removeItemFromPropertyTracking(this.inner[index]);
                this.addItemToPropertyTracking(item);
            }
            this.inner[index] = item;
            return;
        }
        if (this.beforeItemReplacedSubject.isValueCreated)
            this.beforeItemReplacedSubject.value.onNext({ from: index, items: [item] });
        if (this.changeTrackingEnabled) {
            this.removeItemFromPropertyTracking(this.inner[index]);
            this.addItemToPropertyTracking(item);
        }
        this.inner[index] = item;
        if (this.itemReplacedSubject.isValueCreated)
            this.itemReplacedSubject.value.onNext({ from: index, items: [item] });
    }
    sort(comparison) {
        this.publishBeforeResetNotification();
        this.inner.sort(comparison);
        this.publishResetNotification();
    }
    forEach(callbackfn, thisArg) {
        this.inner.forEach(callbackfn, thisArg);
    }
    map(callbackfn, thisArg) {
        return this.inner.map(callbackfn, thisArg);
    }
    filter(callbackfn, thisArg) {
        return this.inner.filter(callbackfn, thisArg);
    }
    some(callbackfn, thisArg) {
        return this.inner.some(callbackfn, thisArg);
    }
    every(callbackfn, thisArg) {
        return this.inner.every(callbackfn, thisArg);
    }
    setupRx(initialContents, resetChangeThreshold = 0.3, scheduler = null) {
        scheduler = scheduler || injector.get(res.app).mainThreadScheduler;
        this.resetChangeThreshold = resetChangeThreshold;
        if (this.inner === undefined)
            this.inner = new Array();
        this.beforeItemsAddedSubject = new Lazy(() => new Rx.Subject());
        this.itemsAddedSubject = new Lazy(() => new Rx.Subject());
        this.beforeItemsRemovedSubject = new Lazy(() => new Rx.Subject());
        this.itemsRemovedSubject = new Lazy(() => new Rx.Subject());
        this.beforeItemReplacedSubject = new Lazy(() => new Rx.Subject());
        this.itemReplacedSubject = new Lazy(() => new Rx.Subject());
        this.resetSubject = new Rx.Subject();
        this.beforeResetSubject = new Rx.Subject();
        this.itemChangingSubject = new Lazy(() => createScheduledSubject(scheduler));
        this.itemChangedSubject = new Lazy(() => createScheduledSubject(scheduler));
        this.beforeItemsMovedSubject = new Lazy(() => new Rx.Subject());
        this.itemsMovedSubject = new Lazy(() => new Rx.Subject());
        this.listChanged = Rx.Observable.merge(this.itemsAdded.select(x => false), this.itemsRemoved.select(x => false), this.itemReplaced.select(x => false), this.itemsMoved.select(x => false), this.resetSubject.select(x => true))
            .publish()
            .refCount();
        this.listChanging = Rx.Observable.merge(this.beforeItemsAdded.select(x => false), this.beforeItemsRemoved.select(x => false), this.beforeItemReplaced.select(x => false), this.beforeItemsMoved.select(x => false), this.beforeResetSubject.select(x => true))
            .publish()
            .refCount();
        if (initialContents) {
            Array.prototype.splice.apply(this.inner, [0, 0].concat(initialContents));
        }
        this.length = this.lengthChanged.toProperty(this.inner.length);
        this.disposables.add(this.length);
        this.isEmpty = this.lengthChanged
            .select(x => (x === 0))
            .toProperty(this.inner.length === 0);
        this.disposables.add(this.isEmpty);
    }
    areChangeNotificationsEnabled() {
        return this.changeNotificationsSuppressed === 0;
    }
    insertItem(index, item) {
        if (!this.areChangeNotificationsEnabled()) {
            this.inner.splice(index, 0, item);
            if (this.changeTrackingEnabled)
                this.addItemToPropertyTracking(item);
            return;
        }
        if (this.beforeItemsAddedSubject.isValueCreated)
            this.beforeItemsAddedSubject.value.onNext({ items: [item], from: index });
        this.inner.splice(index, 0, item);
        if (this.itemsAddedSubject.isValueCreated)
            this.itemsAddedSubject.value.onNext({ items: [item], from: index });
        if (this.changeTrackingEnabled)
            this.addItemToPropertyTracking(item);
    }
    removeItem(index) {
        let item = this.inner[index];
        if (!this.areChangeNotificationsEnabled()) {
            this.inner.splice(index, 1);
            if (this.changeTrackingEnabled)
                this.removeItemFromPropertyTracking(item);
            return;
        }
        if (this.beforeItemsRemovedSubject.isValueCreated)
            this.beforeItemsRemovedSubject.value.onNext({ items: [item], from: index });
        this.inner.splice(index, 1);
        if (this.itemsRemovedSubject.isValueCreated)
            this.itemsRemovedSubject.value.onNext({ items: [item], from: index });
        if (this.changeTrackingEnabled)
            this.removeItemFromPropertyTracking(item);
    }
    moveItem(oldIndex, newIndex) {
        let item = this.inner[oldIndex];
        if (!this.areChangeNotificationsEnabled()) {
            this.inner.splice(oldIndex, 1);
            this.inner.splice(newIndex, 0, item);
            return;
        }
        let mi = { items: [item], from: oldIndex, to: newIndex };
        if (this.beforeItemsMovedSubject.isValueCreated)
            this.beforeItemsMovedSubject.value.onNext(mi);
        this.inner.splice(oldIndex, 1);
        this.inner.splice(newIndex, 0, item);
        if (this.itemsMovedSubject.isValueCreated)
            this.itemsMovedSubject.value.onNext(mi);
    }
    clearItems() {
        if (!this.areChangeNotificationsEnabled()) {
            this.inner.length = 0; // see http://stackoverflow.com/a/1232046/88513
            if (this.changeTrackingEnabled)
                this.clearAllPropertyChangeWatchers();
            return;
        }
        this.publishBeforeResetNotification();
        this.inner.length = 0; // see http://stackoverflow.com/a/1232046/88513
        this.publishResetNotification();
        if (this.changeTrackingEnabled)
            this.clearAllPropertyChangeWatchers();
    }
    addItemToPropertyTracking(toTrack) {
        let rcd = this.propertyChangeWatchers[getOid(toTrack)];
        let self = this;
        if (rcd) {
            rcd.addRef();
            return;
        }
        let changing = observeObject(toTrack, this.app.defaultExceptionHandler, true)
            .select(i => new PropertyChangedEventArgs(toTrack, i.propertyName));
        let changed = observeObject(toTrack, this.app.defaultExceptionHandler, false)
            .select(i => new PropertyChangedEventArgs(toTrack, i.propertyName));
        let disp = new Rx.CompositeDisposable(changing.where(_ => self.areChangeNotificationsEnabled()).subscribe(x => self.itemChangingSubject.value.onNext(x)), changed.where(_ => self.areChangeNotificationsEnabled()).subscribe(x => self.itemChangedSubject.value.onNext(x)));
        this.propertyChangeWatchers[getOid(toTrack)] = new RefCountDisposeWrapper(Rx.Disposable.create(() => {
            disp.dispose();
            delete self.propertyChangeWatchers[getOid(toTrack)];
        }));
    }
    removeItemFromPropertyTracking(toUntrack) {
        let rcd = this.propertyChangeWatchers[getOid(toUntrack)];
        if (rcd) {
            rcd.release();
        }
    }
    clearAllPropertyChangeWatchers() {
        if (this.propertyChangeWatchers != null) {
            Object.keys(this.propertyChangeWatchers).forEach(x => {
                this.propertyChangeWatchers[x].release();
            });
            this.propertyChangeWatchers = null;
        }
    }
    refcountSubscribers(input, block) {
        return Rx.Observable.create(subj => {
            block(1);
            return new Rx.CompositeDisposable(input.subscribe(subj), Rx.Disposable.create(() => block(-1)));
        });
    }
    publishResetNotification() {
        this.resetSubject.onNext(true);
    }
    publishBeforeResetNotification() {
        this.beforeResetSubject.onNext(true);
    }
    isLengthAboveResetThreshold(toChangeLength) {
        return toChangeLength / this.inner.length > this.resetChangeThreshold && toChangeLength > 10;
    }
}
/**
* Creates a new observable list with optional default contents
* @param {Array<T>} initialContents The initial contents of the list
* @param {number = 0.3} resetChangeThreshold
*/
export function list(initialContents, resetChangeThreshold = 0.3, scheduler = null) {
    return new ObservableList(initialContents, resetChangeThreshold, scheduler);
}
class ObservableListProjection extends ObservableList {
    constructor(source, filter, orderer, selector, refreshTrigger, scheduler) {
        super();
        // This list maps indices in this collection to their corresponding indices in the source collection.
        this.indexToSourceIndexMap = [];
        this.sourceCopy = [];
        this.disp = new Rx.CompositeDisposable();
        this.source = source;
        this.selector = selector || ((x) => x);
        this._filter = filter;
        this.orderer = orderer;
        this.refreshTrigger = refreshTrigger;
        this.scheduler = scheduler || Rx.Scheduler.immediate;
        this.addAllItemsFromSourceCollection();
        this.wireUpChangeNotifications();
    }
    //////////////////////////////////
    // ObservableList overrides to enforce readonly contract
    get isReadOnly() {
        return true;
    }
    set(index, item) {
        throwError(this.readonlyExceptionMessage);
    }
    addRange(items) {
        throwError(this.readonlyExceptionMessage);
    }
    insertRange(index, items) {
        throwError(this.readonlyExceptionMessage);
    }
    removeAll(itemsOrSelector) {
        throwError(this.readonlyExceptionMessage);
        return undefined;
    }
    removeRange(index, count) {
        throwError(this.readonlyExceptionMessage);
    }
    add(item) {
        throwError(this.readonlyExceptionMessage);
    }
    clear() {
        throwError(this.readonlyExceptionMessage);
    }
    remove(item) {
        throwError(this.readonlyExceptionMessage);
        return undefined;
    }
    insert(index, item) {
        throwError(this.readonlyExceptionMessage);
    }
    removeAt(index) {
        throwError(this.readonlyExceptionMessage);
    }
    move(oldIndex, newIndex) {
        throwError(this.readonlyExceptionMessage);
    }
    sort(comparison) {
        throwError(this.readonlyExceptionMessage);
    }
    reset() {
        using(super.suppressChangeNotifications(), () => {
            super.clear();
            this.indexToSourceIndexMap = [];
            this.sourceCopy = [];
            this.addAllItemsFromSourceCollection();
        });
    }
    //////////////////////////////////
    // IDisposable implementation
    dispose() {
        this.disp.dispose();
        super.dispose();
    }
    referenceEquals(a, b) {
        return getOid(a) === getOid(b);
    }
    refresh() {
        let length = this.sourceCopy.length;
        const sourceCopyIds = this.sourceCopy.map(x => getOid(x));
        for (let i = 0; i < length; i++) {
            this.onItemChanged(this.sourceCopy[i], sourceCopyIds);
        }
    }
    wireUpChangeNotifications() {
        this.disp.add(this.source.itemsAdded.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsAdded(e);
        }));
        this.disp.add(this.source.itemsRemoved.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsRemoved(e);
        }));
        this.disp.add(this.source.itemsMoved.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsMoved(e);
        }));
        this.disp.add(this.source.itemReplaced.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsReplaced(e);
        }));
        this.disp.add(this.source.shouldReset.observeOn(this.scheduler).subscribe((e) => {
            this.reset();
        }));
        this.disp.add(this.source.itemChanged.select(x => x.sender)
            .observeOn(this.scheduler)
            .subscribe(x => this.onItemChanged(x)));
        if (this.refreshTrigger != null) {
            this.disp.add(this.refreshTrigger.observeOn(this.scheduler).subscribe(_ => this.refresh()));
        }
    }
    onItemsAdded(e) {
        this.shiftIndicesAtOrOverThreshold(e.from, e.items.length);
        for (let i = 0; i < e.items.length; i++) {
            let sourceItem = e.items[i];
            this.sourceCopy.splice(e.from + i, 0, sourceItem);
            if (this._filter && !this._filter(sourceItem)) {
                continue;
            }
            let destinationItem = this.selector(sourceItem);
            this.insertAndMap(e.from + i, destinationItem);
        }
    }
    onItemsRemoved(e) {
        this.sourceCopy.splice(e.from, e.items.length);
        for (let i = 0; i < e.items.length; i++) {
            let destinationIndex = this.getIndexFromSourceIndex(e.from + i);
            if (destinationIndex !== -1) {
                this.removeAtInternal(destinationIndex);
            }
        }
        let removedCount = e.items.length;
        this.shiftIndicesAtOrOverThreshold(e.from + removedCount, -removedCount);
    }
    onItemsMoved(e) {
        if (e.items.length > 1) {
            throwError("Derived collections doesn't support multi-item moves");
        }
        if (e.from === e.to) {
            return;
        }
        let oldSourceIndex = e.from;
        let newSourceIndex = e.to;
        this.sourceCopy.splice(oldSourceIndex, 1);
        this.sourceCopy.splice(newSourceIndex, 0, e.items[0]);
        let currentDestinationIndex = this.getIndexFromSourceIndex(oldSourceIndex);
        this.moveSourceIndexInMap(oldSourceIndex, newSourceIndex);
        if (currentDestinationIndex === -1) {
            return;
        }
        if (this.orderer == null) {
            // We mirror the order of the source collection so we'll perform the same move operation
            // as the source. As is the case with when we have an orderer we don't test whether or not
            // the item should be included or not here. If it has been included at some point it'll
            // stay included until onItemChanged picks up a change which filters it.
            let newDestinationIndex = ObservableListProjection.newPositionForExistingItem2(this.indexToSourceIndexMap, newSourceIndex, currentDestinationIndex);
            if (newDestinationIndex !== currentDestinationIndex) {
                this.indexToSourceIndexMap.splice(currentDestinationIndex, 1);
                this.indexToSourceIndexMap.splice(newDestinationIndex, 0, newSourceIndex);
                super.move(currentDestinationIndex, newDestinationIndex);
            }
            else {
                this.indexToSourceIndexMap[currentDestinationIndex] = newSourceIndex;
            }
        }
        else {
            // TODO: Conceptually I feel like we shouldn't concern ourselves with ordering when we
            // receive a Move notification. If it affects ordering it should be picked up by the
            // onItemChange and resorted there instead.
            this.indexToSourceIndexMap[currentDestinationIndex] = newSourceIndex;
        }
    }
    onItemsReplaced(e) {
        const sourceOids = this.isLengthAboveResetThreshold(e.items.length) ?
            this.sourceCopy.map(x => getOid(x)) :
            null;
        for (let i = 0; i < e.items.length; i++) {
            let sourceItem = e.items[i];
            this.sourceCopy[e.from + i] = sourceItem;
            if (sourceOids)
                sourceOids[e.from + i] = getOid(sourceItem);
            this.onItemChanged(sourceItem, sourceOids);
        }
    }
    onItemChanged(changedItem, sourceOids) {
        let sourceIndices = this.indexOfAll(this.sourceCopy, changedItem, sourceOids);
        let shouldBeIncluded = !this._filter || this._filter(changedItem);
        const sourceIndicesLength = sourceIndices.length;
        for (let i = 0; i < sourceIndicesLength; i++) {
            const sourceIndex = sourceIndices[i];
            let currentDestinationIndex = this.getIndexFromSourceIndex(sourceIndex);
            let isIncluded = currentDestinationIndex >= 0;
            if (isIncluded && !shouldBeIncluded) {
                this.removeAtInternal(currentDestinationIndex);
            }
            else if (!isIncluded && shouldBeIncluded) {
                this.insertAndMap(sourceIndex, this.selector(changedItem));
            }
            else if (isIncluded && shouldBeIncluded) {
                // The item is already included and it should stay there but it's possible that the change that
                // caused this event affects the ordering. This gets a little tricky so let's be verbose.
                let newItem = this.selector(changedItem);
                if (this.orderer == null) {
                    // We don't have an orderer so we're currently using the source collection index for sorting
                    // meaning that no item change will affect ordering. Look at our current item and see if it's
                    // the exact (reference-wise) same object. If it is then we're done, if it's not (for example
                    // if it's an integer) we'll issue a replace event so that subscribers get the new value.
                    if (!this.referenceEquals(newItem, this.get(currentDestinationIndex))) {
                        super.set(currentDestinationIndex, newItem);
                    }
                }
                else {
                    // Don't be tempted to just use the orderer to compare the new item with the previous since
                    // they'll almost certainly be equal (for reference types). We need to test whether or not the
                    // new item can stay in the same position that the current item is in without comparing them.
                    if (this.canItemStayAtPosition(newItem, currentDestinationIndex)) {
                        // The new item should be in the same position as the current but there's no need to signal
                        // that in case they are the same object.
                        if (!this.referenceEquals(newItem, this.get(currentDestinationIndex))) {
                            super.set(currentDestinationIndex, newItem);
                        }
                    }
                    else {
                        // The change is forcing us to reorder. We'll use a move operation if the item hasn't
                        // changed (ie it's the same object) and we'll implement it as a remove and add if the
                        // object has changed (ie the selector is not an identity function).
                        if (this.referenceEquals(newItem, this.get(currentDestinationIndex))) {
                            let newDestinationIndex = this.newPositionForExistingItem(sourceIndex, currentDestinationIndex, newItem);
                            // Debug.Assert(newDestinationIndex != currentDestinationIndex, "This can't be, canItemStayAtPosition said it this couldn't happen");
                            this.indexToSourceIndexMap.splice(currentDestinationIndex, 1);
                            this.indexToSourceIndexMap.splice(newDestinationIndex, 0, sourceIndex);
                            super.move(currentDestinationIndex, newDestinationIndex);
                        }
                        else {
                            this.removeAtInternal(currentDestinationIndex);
                            this.insertAndMap(sourceIndex, newItem);
                        }
                    }
                }
            }
        }
    }
    /// <summary>
    /// Gets a value indicating whether or not the item fits (sort-wise) at the provided index. The determination
    /// is made by checking whether or not it's considered larger than or equal to the preceeding item and if
    /// it's less than or equal to the succeeding item.
    /// </summary>
    canItemStayAtPosition(item, currentIndex) {
        let hasPrecedingItem = currentIndex > 0;
        if (hasPrecedingItem) {
            let isGreaterThanOrEqualToPrecedingItem = this.orderer(item, this.get(currentIndex - 1)) >= 0;
            if (!isGreaterThanOrEqualToPrecedingItem) {
                return false;
            }
        }
        let hasSucceedingItem = currentIndex < this.length() - 1;
        if (hasSucceedingItem) {
            let isLessThanOrEqualToSucceedingItem = this.orderer(item, this.get(currentIndex + 1)) <= 0;
            if (!isLessThanOrEqualToSucceedingItem) {
                return false;
            }
        }
        return true;
    }
    /// <summary>
    /// Gets the index of the dervived item super. on it's originating element index in the source collection.
    /// </summary>
    getIndexFromSourceIndex(sourceIndex) {
        return this.indexToSourceIndexMap.indexOf(sourceIndex);
    }
    /// <summary>
    /// Returns one or more positions in the source collection where the given item is found in source collection
    /// </summary>
    indexOfAll(source, item, sourceOids) {
        let indices = [];
        let sourceIndex = 0;
        const sourceLength = source.length;
        if (sourceOids) {
            const itemOid = getOid(item);
            for (let i = 0; i < sourceLength; i++) {
                const oid = sourceOids[i];
                if (itemOid === oid) {
                    indices.push(sourceIndex);
                }
                sourceIndex++;
            }
        }
        else {
            for (let i = 0; i < sourceLength; i++) {
                const x = source[i];
                if (this.referenceEquals(x, item)) {
                    indices.push(sourceIndex);
                }
                sourceIndex++;
            }
        }
        return indices;
    }
    /// <summary>
    /// Increases (or decreases depending on move direction) all source indices between the source and destination
    /// move indices.
    /// </summary>
    moveSourceIndexInMap(oldSourceIndex, newSourceIndex) {
        if (newSourceIndex > oldSourceIndex) {
            // Item is moving towards the end of the list, everything between its current position and its
            // new position needs to be shifted down one index
            this.shiftSourceIndicesInRange(oldSourceIndex + 1, newSourceIndex + 1, -1);
        }
        else {
            // Item is moving towards the front of the list, everything between its current position and its
            // new position needs to be shifted up one index
            this.shiftSourceIndicesInRange(newSourceIndex, oldSourceIndex, 1);
        }
    }
    /// <summary>
    /// Increases (or decreases) all source indices equal to or higher than the threshold. Represents an
    /// insert or remove of one or more items in the source list thus causing all subsequent items to shift
    /// up or down.
    /// </summary>
    shiftIndicesAtOrOverThreshold(threshold, value) {
        for (let i = 0; i < this.indexToSourceIndexMap.length; i++) {
            if (this.indexToSourceIndexMap[i] >= threshold) {
                this.indexToSourceIndexMap[i] += value;
            }
        }
    }
    /// <summary>
    /// Increases (or decreases) all source indices within the range (lower inclusive, upper exclusive).
    /// </summary>
    shiftSourceIndicesInRange(rangeStart, rangeStop, value) {
        for (let i = 0; i < this.indexToSourceIndexMap.length; i++) {
            let sourceIndex = this.indexToSourceIndexMap[i];
            if (sourceIndex >= rangeStart && sourceIndex < rangeStop) {
                this.indexToSourceIndexMap[i] += value;
            }
        }
    }
    addAllItemsFromSourceCollection() {
        // Debug.Assert(sourceCopy.length == 0, "Expected source copy to be empty");
        let sourceIndex = 0;
        const length = this.source.length();
        for (let i = 0; i < length; i++) {
            const sourceItem = this.source.get(i);
            this.sourceCopy.push(sourceItem);
            if (!this._filter || this._filter(sourceItem)) {
                let destinationItem = this.selector(sourceItem);
                this.insertAndMap(sourceIndex, destinationItem);
            }
            sourceIndex++;
        }
    }
    insertAndMap(sourceIndex, value) {
        let destinationIndex = this.positionForNewItem(sourceIndex, value);
        this.indexToSourceIndexMap.splice(destinationIndex, 0, sourceIndex);
        super.insert(destinationIndex, value);
    }
    removeAtInternal(destinationIndex) {
        this.indexToSourceIndexMap.splice(destinationIndex, 1);
        super.removeAt(destinationIndex);
    }
    positionForNewItem(sourceIndex, value) {
        // If we haven't got an orderer we'll simply match our items to that of the source collection.
        return this.orderer == null
            ? ObservableListProjection.positionForNewItemArray(this.indexToSourceIndexMap, sourceIndex, ObservableListProjection.defaultOrderer)
            : ObservableListProjection.positionForNewItemArray2(this.inner, 0, this.inner.length, value, this.orderer);
    }
    static positionForNewItemArray(array, item, orderer) {
        return ObservableListProjection.positionForNewItemArray2(array, 0, array.length, item, orderer);
    }
    static positionForNewItemArray2(array, index, count, item, orderer) {
        // Debug.Assert(index >= 0);
        // Debug.Assert(count >= 0);
        // Debug.Assert((list.length - index) >= count);
        if (count === 0) {
            return index;
        }
        if (count === 1) {
            return orderer(array[index], item) >= 0 ? index : index + 1;
        }
        if (orderer(array[index], item) >= 1)
            return index;
        let low = index, hi = index + count - 1;
        let cmp;
        while (low <= hi) {
            let mid = Math.floor(low + (hi - low) / 2);
            cmp = orderer(array[mid], item);
            if (cmp === 0) {
                return mid;
            }
            if (cmp < 0) {
                low = mid + 1;
            }
            else {
                hi = mid - 1;
            }
        }
        return low;
    }
    /// <summary>
    /// Calculates a new destination for an updated item that's already in the list.
    /// </summary>
    newPositionForExistingItem(sourceIndex, currentIndex, item) {
        // If we haven't got an orderer we'll simply match our items to that of the source collection.
        return this.orderer == null
            ? ObservableListProjection.newPositionForExistingItem2(this.indexToSourceIndexMap, sourceIndex, currentIndex)
            : ObservableListProjection.newPositionForExistingItem2(this.inner, item, currentIndex, this.orderer);
    }
    /// <summary>
    /// Calculates a new destination for an updated item that's already in the list.
    /// </summary>
    static newPositionForExistingItem2(array, item, currentIndex, orderer) {
        // Since the item changed is most likely a value type we must refrain from ever comparing it to itself.
        // We do this by figuring out how the updated item compares to its neighbors. By knowing if it's
        // less than or greater than either one of its neighbors we can limit the search range to a range exlusive
        // of the current index.
        // Debug.Assert(list.length > 0);
        if (array.length === 1) {
            return 0;
        }
        let precedingIndex = currentIndex - 1;
        let succeedingIndex = currentIndex + 1;
        // The item on the preceding or succeeding index relative to currentIndex.
        let comparand = array[precedingIndex >= 0 ? precedingIndex : succeedingIndex];
        if (orderer == null) {
            orderer = ObservableListProjection.defaultOrderer;
        }
        // Compare that to the (potentially) new value.
        let cmp = orderer(item, comparand);
        let min = 0;
        let max = array.length;
        if (cmp === 0) {
            // The new value is equal to the preceding or succeeding item, it may stay at the current position
            return currentIndex;
        }
        else if (cmp > 0) {
            // The new value is greater than the preceding or succeeding item, limit the search to indices after
            // the succeeding item.
            min = succeedingIndex;
        }
        else {
            // The new value is less than the preceding or succeeding item, limit the search to indices before
            // the preceding item.
            max = precedingIndex;
        }
        // Bail if the search range is invalid.
        if (min === array.length || max < 0) {
            return currentIndex;
        }
        let ix = ObservableListProjection.positionForNewItemArray2(array, min, max - min, item, orderer);
        // If the item moves 'forward' in the collection we have to account for the index where
        // the item currently resides getting removed first.
        return ix >= currentIndex ? ix - 1 : ix;
    }
}
ObservableListProjection.defaultOrderer = (a, b) => {
    let result;
    if (a == null && b == null)
        result = 0;
    else if (a == null)
        result = -1;
    else if (b == null)
        result = 1;
    else
        result = a - b;
    return result;
};
//# sourceMappingURL=List.js.map