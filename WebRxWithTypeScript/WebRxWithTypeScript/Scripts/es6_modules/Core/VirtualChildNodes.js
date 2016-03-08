"use strict";
/**
* VirtualChildNodes implements consisent and predictable manipulation
* of a DOM Node's childNodes collection regardless its the true contents
* @class
**/
export default class VirtualChildNodes {
    constructor(targetNode, initialSyncToTarget, insertCB, removeCB) {
        this.childNodes = [];
        this.targetNode = targetNode;
        this.insertCB = insertCB;
        this.removeCB = removeCB;
        if (initialSyncToTarget) {
            for (let i = 0; i < targetNode.childNodes.length; i++) {
                this.childNodes.push(targetNode.childNodes[i]);
            }
        }
    }
    appendChilds(nodes, callbackData) {
        let length = nodes.length;
        // append to proxy array
        if (nodes.length > 1)
            Array.prototype.push.apply(this.childNodes, nodes);
        else
            this.childNodes.push(nodes[0]);
        // append to DOM
        for (let i = 0; i < length; i++) {
            this.targetNode.appendChild(nodes[i]);
        }
        // callback
        if (this.insertCB) {
            for (let i = 0; i < length; i++) {
                this.insertCB(nodes[i], callbackData);
            }
        }
    }
    insertChilds(index, nodes, callbackData) {
        if (index === this.childNodes.length) {
            this.appendChilds(nodes, callbackData);
        }
        else {
            let refNode = this.childNodes[index];
            let length = nodes.length;
            // insert into proxy array
            Array.prototype.splice.apply(this.childNodes, [index, 0].concat(nodes));
            // insert into DOM
            for (let i = 0; i < length; i++) {
                this.targetNode.insertBefore(nodes[i], refNode);
            }
            // callback
            if (this.insertCB) {
                for (let i = 0; i < length; i++) {
                    this.insertCB(nodes[i], callbackData);
                }
            }
        }
    }
    removeChilds(index, count, keepDom) {
        let node;
        if (count === 0)
            return [];
        // extract removed nodes
        let nodes = this.childNodes.slice(index, index + count);
        // remove from proxy array
        this.childNodes.splice(index, count);
        if (!keepDom) {
            // remove from DOM
            let length = nodes.length;
            for (let i = 0; i < length; i++) {
                node = nodes[i];
                if (this.removeCB)
                    this.removeCB(node);
                this.targetNode.removeChild(node);
            }
        }
        return nodes;
    }
    clear() {
        // remove from DOM
        let length = this.childNodes.length;
        let node;
        for (let i = 0; i < length; i++) {
            node = this.childNodes[i];
            if (this.removeCB)
                this.removeCB(node);
            this.targetNode.removeChild(node);
        }
        // reset proxy array
        this.childNodes = [];
    }
}
//# sourceMappingURL=VirtualChildNodes.js.map