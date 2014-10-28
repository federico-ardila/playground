/// <reference path="Scripts/typings/raphael/raphael.d.ts" />


class BasicDataObject {
    left: BasicDataObject;
    right: BasicDataObject;

    removeFromRow() {
        this.right.left = this.left;
        this.left.right = this.right;
    }

    reinsertIntoRow() {
        this.right.left = this;
        this.left.right = this;
    }

    up: BasicDataObject;
    down: BasicDataObject;

    removeFromColumn() {
        this.up.down = this.down;
        this.down.up = this.up;
    }

    reinsertIntoColumn() {
        this.up.down = this;
        this.down.up = this;
    }
}

class DataObject extends BasicDataObject {
    columnHeader: ColumnHeader;
}

class TableHeader extends BasicDataObject {
    removeFromRow() {
        throw new Error("The Table header should never be removed nor reinseted");
    }

    reinsertIntoRow() {
        throw new Error("The Table header should never be removed nor reinseted");
    }
}

class ColumnHeader extends BasicDataObject {
    name: string;
    size: number;

    constructor(name: string, left: BasicDataObject) {
        super();
        this.name = name;
        this.left = left;
        left.right = this;
        this.size = 0;
        this.up = this;
        this.down = this;
    }

    removeFromColumn() {
        throw new Error("A column header should never removed nor reinseted into the column ");
    }

    reinsertIntoColumn() {
        throw new Error("A column header should never removed nor reinseted into the column ");
    }

    addElementAtTheBottom(element: DataObject) {
        element.up = this.up;
        this.up.down = element;
        element.down = this;
        this.up = element;
        element.columnHeader = this;
        this.size++;
    }


    coverColumn() {
        this.removeFromRow();
        for (var columnElement = this.down; columnElement != this; columnElement = columnElement.down) {
            for (var rowElemet = <DataObject> columnElement.right; rowElemet != columnElement; rowElemet = <DataObject> rowElemet.right) {
                rowElemet.removeFromColumn();
                rowElemet.columnHeader.size--;
            }
        }
    }

    uncoverColumn() {
        for (var columnElement = this.up; columnElement != this; columnElement = columnElement.up) {
            for (var rowElemet = <DataObject> columnElement.left; rowElemet != columnElement; rowElemet = <DataObject> rowElemet.left) {
                rowElemet.columnHeader.size++;
                rowElemet.reinsertIntoColumn();
            }
        }
        this.reinsertIntoRow();
    }
}

class Search {
    solution: DataObject[];
    tableHeader: TableHeader;

    initialize() {
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
        this.solution = new Array<DataObject>(rows.length);
        var columns = new Array<ColumnHeader>(columnNames.length);
        var lastCol = this.tableHeader;
        columnNames.forEach
        ((name, index) => {
            columns[index] = new ColumnHeader(name, lastCol);
            lastCol = columns[index];
        });
        lastCol.right = this.tableHeader;
        this.tableHeader.left = lastCol;

        rows.forEach
        ((row, index) => {
            var firstRowlElement = new DataObject();
            var lastelement: DataObject;
            row.forEach
            ((colIndex, index2) => {
                var newElement: DataObject;
                if (index2 == 0) {
                    newElement = firstRowlElement;
                } else  {
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
    }

    private printSolution() {
        this.solution.forEach((dataObject, index) => {
            var line = "";
            line += dataObject.columnHeader.name +" ";
            for (var rowObject = <DataObject>dataObject.right; rowObject != dataObject; rowObject = <DataObject>rowObject.right) {
                line += rowObject.columnHeader.name + " ";
            }
            console.log(line);
        });
    }


    private searchInternal(k: number) {
        if (this.tableHeader.right === this.tableHeader) {
            this.printSolution();
            return;
        }
        var columnHeader = this.selectColumn();
        columnHeader.coverColumn();
        for (var row = columnHeader.down; row != columnHeader; row = row.down) {
            this.solution[k] = <DataObject>row;
            for (var j = <DataObject>row.right; j != row; j = <DataObject>j.right) {
                j.columnHeader.coverColumn();
            }
            this.searchInternal(k + 1);
            row = this.solution[k];
            for (j = <DataObject>row.left; j != row; j = <DataObject>j.left) {
                j.columnHeader.uncoverColumn();
            }
        }
        columnHeader.uncoverColumn();
    }

    search() {
        this.searchInternal(0);
    }



    private selectColumn(): ColumnHeader {
        var s: number = Infinity;
        var result: ColumnHeader;
        for (var currentColumn = <ColumnHeader>this.tableHeader.right; currentColumn != this.tableHeader; currentColumn = <ColumnHeader>currentColumn.right) {

            if (currentColumn.size < s) {
                s = currentColumn.size;
                result = currentColumn;
            }
        }
        return result;
    }
}


window.onload = () => {
    var search = new Search();
    search.initialize();
    search.search();

    var paper = Raphael("content", 800, 800);
    var squares: RaphaelElement[][] = new Array < Array <RaphaelElement>>(8);
    for (var i = 0; i < 8; i++) {
        squares[i] = new Array<RaphaelElement>(8);
        for (var j = 0; j < 8; j++) {
            var rect = paper.rect(i * 100, j*100, 100, 100);
            rect.attr("stroke", "#000");
            rect.attr("fill", "#222");
            squares[i][j] = rect;
        }
    }

    for (i = 0; i < 8; i++) {

        for (j = i%2; j < 8; j= j+2) {
            var rect = squares[i][j];
            rect.attr("fill", "#BBB");
        }
    }

    
};