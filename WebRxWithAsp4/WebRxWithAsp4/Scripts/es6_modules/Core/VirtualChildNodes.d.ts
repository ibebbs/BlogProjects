/**
* VirtualChildNodes implements consisent and predictable manipulation
* of a DOM Node's childNodes collection regardless its the true contents
* @class
**/
export default class VirtualChildNodes {
    constructor(targetNode: Node, initialSyncToTarget: boolean, insertCB?: (node: Node, callbackData: any) => void, removeCB?: (node: Node) => void);
    appendChilds(nodes: Node[], callbackData?: any): void;
    insertChilds(index: number, nodes: Node[], callbackData?: any): void;
    removeChilds(index: number, count: number, keepDom: boolean): Node[];
    clear(): void;
    targetNode: Node;
    childNodes: Array<Node>;
    private insertCB;
    private removeCB;
}
