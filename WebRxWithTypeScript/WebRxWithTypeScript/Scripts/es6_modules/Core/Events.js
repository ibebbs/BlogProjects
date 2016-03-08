/// <reference path="../Interfaces.ts" />
"use strict";
export class PropertyChangedEventArgs {
    /// <summary>
    /// Initializes a new instance of the <see cref="ObservablePropertyChangedEventArgs{TSender}"/> class.
    /// </summary>
    /// <param name="sender">The sender.</param>
    /// <param name="propertyName">Name of the property.</param>
    constructor(sender, propertyName) {
        this.propertyName = propertyName;
        this.sender = sender;
    }
}
//# sourceMappingURL=Events.js.map