/// <reference path="Scripts/typings/raphael/raphael.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BasicDataObject = (function () {
    function BasicDataObject() {
    }
    BasicDataObject.prototype.removeFromRow = function () {
        this.right.left = this.left;
        this.left.right = this.right;
    };

    BasicDataObject.prototype.reinsertIntoRow = function () {
        this.right.left = this;
        this.left.right = this;
    };

    BasicDataObject.prototype.removeFromColumn = function () {
        this.up.down = this.down;
        this.down.up = this.up;
    };

    BasicDataObject.prototype.reinsertIntoColumn = function () {
        this.up.down = this;
        this.down.up = this;
    };
    return BasicDataObject;
})();

var DataObject = (function (_super) {
    __extends(DataObject, _super);
    function DataObject() {
        _super.apply(this, arguments);
    }
    return DataObject;
})(BasicDataObject);

var TableHeader = (function (_super) {
    __extends(TableHeader, _super);
    function TableHeader() {
        _super.apply(this, arguments);
    }
    TableHeader.prototype.removeFromRow = function () {
        throw new Error("The Table header should never be removed nor reinseted");
    };

    TableHeader.prototype.reinsertIntoRow = function () {
        throw new Error("The Table header should never be removed nor reinseted");
    };
    return TableHeader;
})(BasicDataObject);

var ColumnHeader = (function (_super) {
    __extends(ColumnHeader, _super);
    function ColumnHeader(name, left) {
        _super.call(this);
        this.name = name;
        this.left = left;
        left.right = this;
        this.size = 0;
        this.up = this;
        this.down = this;
    }
    ColumnHeader.prototype.removeFromColumn = function () {
        throw new Error("A column header should never removed nor reinseted into the column ");
    };

    ColumnHeader.prototype.reinsertIntoColumn = function () {
        throw new Error("A column header should never removed nor reinseted into the column ");
    };

    ColumnHeader.prototype.addElementAtTheBottom = function (element) {
        element.up = this.up;
        this.up.down = element;
        element.down = this;
        this.up = element;
        element.columnHeader = this;
        this.size++;
    };

    ColumnHeader.prototype.coverColumn = function () {
        this.removeFromRow();
        for (var columnElement = this.down; columnElement != this; columnElement = columnElement.down) {
            for (var rowElemet = columnElement.right; rowElemet != columnElement; rowElemet = rowElemet.right) {
                rowElemet.removeFromColumn();
                rowElemet.columnHeader.size--;
            }
        }
    };

    ColumnHeader.prototype.uncoverColumn = function () {
        for (var columnElement = this.up; columnElement != this; columnElement = columnElement.up) {
            for (var rowElemet = columnElement.left; rowElemet != columnElement; rowElemet = rowElemet.left) {
                rowElemet.columnHeader.size++;
                rowElemet.reinsertIntoColumn();
            }
        }
        this.reinsertIntoRow();
    };
    return ColumnHeader;
})(BasicDataObject);

var Search = (function () {
    function Search() {
    }
    Search.prototype.initialize = function () {
        this.tableHeader = new TableHeader();
        var columnNames = ["A", "B", "C", "D", "E", "F", "G"];
        var rows = [
            [2, 4, 5],
            [0, 3, 6],
            [1, 2, 5],
            [0, 3],
            [1, 6],
            [3, 4, 6]
        ];
        this.solution = new Array(rows.length);
        var columns = new Array(columnNames.length);
        var lastCol = this.tableHeader;
        columnNames.forEach(function (name, index) {
            columns[index] = new ColumnHeader(name, lastCol);
            lastCol = columns[index];
        });
        lastCol.right = this.tableHeader;
        this.tableHeader.left = lastCol;

        rows.forEach(function (row, index) {
            var firstRowlElement = new DataObject();
            var lastelement;
            row.forEach(function (colIndex, index2) {
                var newElement;
                if (index2 == 0) {
                    newElement = firstRowlElement;
                } else {
                    newElement = new DataObject();
                    newElement.left = lastelement;
                    lastelement.right = newElement;
                }

                if (index2 == row.length - 1) {
                    newElement.right = firstRowlElement;
                    firstRowlElement.left = newElement;
                }

                columns[colIndex].addElementAtTheBottom(newElement);
                lastelement = newElement;
            });
        });
    };

    Search.prototype.printSolution = function () {
        this.solution.forEach(function (dataObject, index) {
            var line = "";
            line += dataObject.columnHeader.name + " ";
            for (var rowObject = dataObject.right; rowObject != dataObject; rowObject = rowObject.right) {
                line += rowObject.columnHeader.name + " ";
            }
            console.log(line);
        });
    };

    Search.prototype.searchInternal = function (k) {
        if (this.tableHeader.right === this.tableHeader) {
            this.printSolution();
            return;
        }
        var columnHeader = this.selectColumn();
        columnHeader.coverColumn();
        for (var row = columnHeader.down; row != columnHeader; row = row.down) {
            this.solution[k] = row;
            for (var j = row.right; j != row; j = j.right) {
                j.columnHeader.coverColumn();
            }
            this.searchInternal(k + 1);
            row = this.solution[k];
            for (j = row.left; j != row; j = j.left) {
                j.columnHeader.uncoverColumn();
            }
        }
        columnHeader.uncoverColumn();
    };

    Search.prototype.search = function () {
        this.searchInternal(0);
    };

    Search.prototype.selectColumn = function () {
        var s = Infinity;
        var result;
        for (var currentColumn = this.tableHeader.right; currentColumn != this.tableHeader; currentColumn = currentColumn.right) {
            if (currentColumn.size < s) {
                s = currentColumn.size;
                result = currentColumn;
            }
        }
        return result;
    };
    return Search;
})();

window.onload = function () {
    var search = new Search();
    search.initialize();
    search.search();

    var paper = Raphael("content", 800, 800);
    var squares = new Array(8);
    for (var i = 0; i < 8; i++) {
        squares[i] = new Array(8);
        for (var j = 0; j < 8; j++) {
            var rect = paper.rect(i * 100, j * 100, 100, 100);
            rect.attr("stroke", "#000");
            rect.attr("fill", "#222");
            squares[i][j] = rect;
        }
    }

    for (i = 0; i < 8; i++) {
        for (j = i % 2; j < 8; j = j + 2) {
            var rect = squares[i][j];
            rect.attr("fill", "#BBB");
        }
    }
};
//# sourceMappingURL=app.js.map
