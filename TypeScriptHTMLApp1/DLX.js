var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Dlx;
(function (Dlx) {
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
        function ColumnHeader(name) {
            _super.call(this);
            this.name = name;
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

    var Row = (function () {
        function Row(columns) {
            this.columns = columns;
            this.rowElements = new Array();
        }
        Row.prototype.addByName = function (name) {
            var column = this.columns.columnsMap[name];
            if (column) {
                this.rowElements.push(column);
            } else {
                throw new Error("The Column doesn't exist");
            }
        };

        Row.prototype.addByReference = function (column) {
            if (column === this.columns.rowElements[column.index]) {
                this.rowElements.push(column);
            } else {
                throw new Error("The Column doesn't exist");
            }
        };
        return Row;
    })();
    Dlx.Row = Row;

    var ColumnsRow = (function () {
        function ColumnsRow(columnNames) {
            var _this = this;
            this.rowElements = new Array();
            this.columnsMap = {};
            columnNames.forEach(function (name) {
                return _this.addColumn(name);
            });
        }
        ColumnsRow.prototype.addColumn = function (name) {
            var column = { index: this.rowElements.length, name: name };
            this.rowElements.push(column);
            this.columnsMap[column.name] = column;
        };
        return ColumnsRow;
    })();
    Dlx.ColumnsRow = ColumnsRow;

    var ProblemInstance = (function () {
        function ProblemInstance(columns) {
            this.columnsRow = columns;
            this.rows = new Array();
        }
        ProblemInstance.prototype.addRowsByNames = function (rows) {
            var _this = this;
            rows.forEach(function (row) {
                return _this.addRowByNames(row);
            });
        };

        ProblemInstance.prototype.addRowByNames = function (columnNames) {
            var row = new Row(this.columnsRow);
            columnNames.forEach(function (columnName) {
                return row.addByName(columnName);
            });
            this.rows.push(row);
        };
        return ProblemInstance;
    })();
    Dlx.ProblemInstance = ProblemInstance;

    var DataStructureConstructor = (function () {
        function DataStructureConstructor(instance) {
            var _this = this;
            this.tableHeader = new TableHeader();
            var columnMap = {};
            var columnHeaders = instance.columnsRow.rowElements.map(function (column) {
                var colHeader = new ColumnHeader(column.name);
                columnMap[column.name] = colHeader;
                return colHeader;
            });
            this.linkColumnHeaders(columnHeaders);
            instance.rows.forEach(function (row, index) {
                _this.insertAndLinkRow(row, columnMap);
            });
        }
        DataStructureConstructor.prototype.linkColumnHeaders = function (columnHeaders) {
            var _this = this;
            this.tableHeader.right = columnHeaders[0];
            columnHeaders[0].left = this.tableHeader;
            columnHeaders.forEach(function (columnHeader, index) {
                if (index > 0) {
                    columnHeader.left = columnHeaders[index - 1];
                    columnHeaders[index - 1].right = columnHeader;
                }
                if (index == columnHeaders.length - 1) {
                    columnHeader.right = _this.tableHeader;
                    _this.tableHeader.left = columnHeader;
                }
            });
        };

        DataStructureConstructor.prototype.insertAndLinkRow = function (row, columnMap) {
            var dataObjects = row.rowElements.map(function (node) {
                var columnHeader = columnMap[node.name];
                var dataObject = new DataObject();
                dataObject.columnHeader = columnHeader;
                dataObject.columnHeader.addElementAtTheBottom(dataObject);
                return dataObject;
            });
            dataObjects.forEach(function (dataObject, index) {
                if (index > 0) {
                    dataObject.left = dataObjects[index - 1];
                    dataObjects[index - 1].right = dataObject;
                }
                if (index == dataObjects.length - 1) {
                    dataObject.right = dataObjects[0];
                    dataObjects[0].left = dataObject;
                }
            });
        };
        return DataStructureConstructor;
    })();

    var Search = (function () {
        function Search(instance) {
            var dataStructure = new DataStructureConstructor(instance);
            this.tableHeader = dataStructure.tableHeader;
            this.solution = new Array(instance.columnsRow.rowElements.length);
        }
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
    Dlx.Search = Search;
})(Dlx || (Dlx = {}));

function testSearch() {
    //[ 0    1    2    3    4    5    6 ]
    var columnNames = ["A", "B", "C", "D", "E", "F", "G"];
    var rows = [
        ["C", "E", "F"],
        ["A", "D", "G"],
        ["B", "C", "F"],
        ["A", "D"],
        ["B", "G"],
        ["D", "E", "G"]
    ];
    var columns = new Dlx.ColumnsRow(columnNames);
    var problemInstance = new Dlx.ProblemInstance(columns);
    problemInstance.addRowsByNames(rows);
    var search = new Dlx.Search(problemInstance);
    search.search();
}
//# sourceMappingURL=Dlx.js.map
