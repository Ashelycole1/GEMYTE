if (!Array.prototype.toSorted) {
    Array.prototype.toSorted = function(compareFn) {
        return this.slice().sort(compareFn);
    };
}
if (!Array.prototype.toReversed) {
    Array.prototype.toReversed = function() {
        return this.slice().reverse();
    };
}
if (!Array.prototype.toSpliced) {
    Array.prototype.toSpliced = function(start, deleteCount, ...items) {
        const arr = this.slice();
        if (arguments.length === 1) {
            arr.splice(start);
        } else if (arguments.length === 2) {
            arr.splice(start, deleteCount);
        } else {
            arr.splice(start, deleteCount, ...items);
        }
        return arr;
    };
}
if (!Array.prototype.with) {
    Array.prototype.with = function(index, value) {
        const arr = this.slice();
        if (index < 0) index += arr.length;
        if (index < 0 || index >= arr.length) throw new RangeError("Invalid index");
        arr[index] = value;
        return arr;
    };
}
