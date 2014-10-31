module Dlx {
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

        constructor(name: string) {
            super();
            this.name = name;
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

    export interface  IColumn {
        index: number;
        name: string;
    }

    export interface IRowElemts extends Array<IColumn>{ } 

    export class Row {
        rowElements: IRowElemts;
        columns: ColumnsRow;
        constructor(columns : ColumnsRow) {
            this.columns = columns;
            this.rowElements = new Array<IColumn>();
        }

        addByName(name: string) {
            var column = this.columns.columnsMap[name];
            if (column) {
                this.rowElements.push(column);
            } else {
                throw new Error("The Column doesn't exist");
            }
        }

        addByReference(column: IColumn) {
            if (column === this.columns.rowElements[column.index]) {
                this.rowElements.push(column);
            } else {
                throw new Error("The Column doesn't exist");
            }
        }
    }

    export class ColumnsRow {
        rowElements: IRowElemts;
        columnsMap : {[name :string]: IColumn};

        constructor(columnNames: string[]) {
            this.rowElements = new Array<IColumn>();
            this.columnsMap = {};
            columnNames.forEach(name => this.addColumn(name));
        }

        private addColumn(name:string) {
            var column = { index: this.rowElements.length, name: name };
            this.rowElements.push(column);
            this.columnsMap[column.name] = column;
        }
    }

    export class ProblemInstance {
        columnsRow: ColumnsRow;
        rows: Row[];

        constructor(columns:ColumnsRow) {
            this.columnsRow = columns;
            this.rows = new Array<Row>();
        }

        addRowsByNames(rows: string[][]) {
            rows.forEach(row => this.addRowByNames(row));
        }

        addRowByNames(columnNames: string[]) {
            var row = new Row(this.columnsRow);
            columnNames.forEach(columnName => row.addByName(columnName));
            this.rows.push(row);
        }
         
    }

    class DataStructureConstructor{

        tableHeader: TableHeader;

        constructor(instance: ProblemInstance) {
            this.tableHeader = new TableHeader();
            var columnMap: { [columnName: string]: ColumnHeader } = {};
            var columnHeaders = instance.columnsRow.rowElements.map(column => {
                var colHeader = new ColumnHeader(column.name);
                columnMap[column.name] = colHeader;
                return colHeader;
            });
            this.linkColumnHeaders(columnHeaders);
            instance.rows.forEach((row, index) => {
                this.insertAndLinkRow(row, columnMap);
            });
        }

        private linkColumnHeaders(columnHeaders: Array<ColumnHeader>) {
            this.tableHeader.right = columnHeaders[0];
            columnHeaders[0].left = this.tableHeader;
            columnHeaders.forEach((columnHeader, index) => {
                if (index > 0) {
                    columnHeader.left = columnHeaders[index - 1];
                    columnHeaders[index - 1].right = columnHeader;
                }
                if (index == columnHeaders.length - 1) {
                    columnHeader.right = this.tableHeader;
                    this.tableHeader.left = columnHeader;
                }
            });
        }

        private insertAndLinkRow(row: Row, columnMap: { [columnName: string]: ColumnHeader }) {
            var dataObjects = row.rowElements.map(node => {
                var columnHeader = columnMap[node.name];
                var dataObject = new DataObject();
                dataObject.columnHeader = columnHeader;
                dataObject.columnHeader.addElementAtTheBottom(dataObject);
                return dataObject;
            });
            dataObjects.forEach((dataObject, index) => {
                if (index > 0) {
                    dataObject.left = dataObjects[index - 1];
                    dataObjects[index - 1].right = dataObject;
                }
                if (index == dataObjects.length - 1) {
                    dataObject.right = dataObjects[0];
                    dataObjects[0].left = dataObject;
                }
            });
        }
    }

    export class Search {
        private currentSolution: DataObject[];
        private solutions : string[][];
        private tableHeader: TableHeader;
        private numberOfSolutions =1;

        constructor(instance: ProblemInstance) {
            var dataStructure = new DataStructureConstructor(instance);
            this.tableHeader = dataStructure.tableHeader;
            this.currentSolution = new Array<DataObject>(instance.columnsRow.rowElements.length);
        }

        private printSolution() {
            console.log("Solution " + this.numberOfSolutions.toString() + "-------------------------");
            this.numberOfSolutions++;
            this.currentSolution.forEach((dataObject, index) => {
                var solution = new Array<string>();
                solution.push(dataObject.columnHeader.name);
                for (var rowObject = <DataObject>dataObject.right; rowObject != dataObject; rowObject = <DataObject>rowObject.right) {
                    solution.push(rowObject.columnHeader.name);
                }
                this.solutions.push();
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
                this.currentSolution[k] = <DataObject>row;
                for (var j = <DataObject>row.right; j != row; j = <DataObject>j.right) {
                    j.columnHeader.coverColumn();
                }
                this.searchInternal(k + 1);
                row = this.currentSolution[k];
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
}

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