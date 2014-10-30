/// <reference path="Scripts/typings/raphael/raphael.d.ts" />
///<reference path="Scripts/typings/jquery/jquery.d.ts"/>

interface Array<T> {
    equals(array: Array<T>): boolean;
}

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}   

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

interface IFigureGeometry extends Array<Array<boolean>> {}

interface IPentominoFigure {
    geometry: IFigureGeometry;
    color: string;
    name: string;
}

interface ICoordinate {
    top: number;
    left: number;
}



interface IDrawInfo {
    //position: ICoordinate;
    //geometry: boolean[][];
    targetSquares: Array<ICoordinate>;
    color: string;
}

class FigureRotations {
    figure: IPentominoFigure;
    rotations: IFigureGeometry[];
    currentRotation: number;
    currentPosition: ICoordinate;
    
    constructor(figure: IPentominoFigure) {
        this.figure = figure;
        this.getRotations();
        this.currentRotation = 0;
        this.currentPosition = { top: 0, left: 0 };
    }

    private getRotations() {
        this.rotations = new Array<IFigureGeometry>();
        this.rotations[0] = this.figure.geometry;
        var i = 1;
        var nextRotation = this.getNextRotationClockwise(this.figure.geometry);
        while (!nextRotation.equals(this.figure.geometry)) {
            this.rotations.push(nextRotation);
            nextRotation = this.getNextRotationClockwise(nextRotation);
        }
        var fliped = this.getFliped(this.figure.geometry);
        var isNewShape = this.rotations.every(rotation => !rotation.equals(fliped));
        if (isNewShape) {
            this.rotations.push(fliped);
            nextRotation = this.getNextRotationClockwise(fliped);
            while (!nextRotation.equals(fliped)) {
                this.rotations.push(nextRotation);
                nextRotation = this.getNextRotationClockwise(nextRotation);
            }
        }
    }

    changeRotationStateCLockwise() {
        do {
            this.currentRotation = (this.currentRotation + 1) % this.rotations.length;
        } while(!this.isValidPosition(this.currentPosition))
    }

    setPosition(newPosition: ICoordinate) : boolean {
        if (!this.isValidPosition(newPosition)) {
            return false;
        }
        this.currentPosition = newPosition;
        return true;
    }

    moveUp() : boolean {
        return this.setPosition({
            left: this.currentPosition.left,
            top: this.currentPosition.top - 1
        });
    }

    moveDown(): boolean {
        return this.setPosition({
            left: this.currentPosition.left,
            top: this.currentPosition.top + 1
        });
    }

    moveLeft(): boolean {
        return this.setPosition({
            left: this.currentPosition.left - 1,
            top: this.currentPosition.top 
        });
    }

    moveRight(): boolean {
        return this.setPosition({
            left: this.currentPosition.left + 1,
            top: this.currentPosition.top
        }); 
    }

    private isValidPosition(position:ICoordinate): boolean {
        var isValid = this.getTargetSquares(position, this.currentRotation).every(square => {
            var inboundsVertical = square.top >= 0 && square.top < 8;
            var inboundsHorizontal = square.left >= 0 && square.left < 8;
            var outbounds = !((square.top == 3 && (square.left == 3 || square.left == 4))
                || (square.top == 4 && (square.left == 3 || square.left == 4)));

            return inboundsVertical && inboundsHorizontal && outbounds;
        });
        return isValid;
    }

    private getFliped(currentGeometry: IFigureGeometry): IFigureGeometry {
        var width = currentGeometry[0].length;
        var height = currentGeometry.length;
        var result = new Array<Array<boolean>>(height);
        for (var i = 0; i < height; i++) {
            result[i] = new Array<boolean>(width);
            for (var j = 0; j < width; j++) {
                result[i][j] = currentGeometry[i][width-j-1];
            }
        }
        return result;
    }

    private getNextRotationClockwise(currentGeometry: IFigureGeometry): IFigureGeometry {
        var width = currentGeometry[0].length;
        var height = currentGeometry.length;
        var newwidth = height;
        var newHeight = width;
        var result = new Array<Array<boolean>>(newHeight);
        for (var i = 0; i < newHeight; i++) {
            result[i] = new Array<boolean>(newwidth);
            for (var j = 0; j < newwidth; j++) {
                result[i][j] = currentGeometry[newwidth- 1 - j][i];
            }
        }
        return result;
    }

    private getTargetSquares(position:ICoordinate, rotation:number): Array<ICoordinate> {
        var result = new Array<ICoordinate>();
        var currentGeometry = this.rotations[rotation];
        for (var i = 0; i < currentGeometry.length; i++) {
            for (var j = 0; j < currentGeometry[i].length; j++) {
                if (currentGeometry[i][j]) {
                    var top = position.top + i;
                    var left = position.left + j;
                    result.push({ top: top, left: left });
                }
            }
        }
        return result;
    }

    getDrawInfo(): IDrawInfo {
        return {
           //position: this.currentPosition
            //geometry : this.rotations[this.currentRotation],
            color: this.figure.color,
            targetSquares: this.getTargetSquares(this.currentPosition, this.currentRotation),
            
        };
    }
}

class PentominoFigures {

    static f: IPentominoFigure = {
        geometry: [
            [false, true, true],
            [true, true, false],
            [false, true, false]
        ],
        color: "#0f0",
        name: "F"
    }

        static p: IPentominoFigure = {
        geometry: [
            [true, true],
            [true, true],
            [true, false]
        ],
        color: "#00f",
        name: "F"
    }
}


class PentominoDrawer {
    paper: RaphaelPaper;
    height: number;
    squares: RaphaelElement[][] = new Array<Array<RaphaelElement>>(8);


    constructor(paperContainer: HTMLElement, height: number, rotateButton?: HTMLElement,
        upButton?: HTMLElement, downButton?: HTMLElement,
        leftButton?: HTMLElement, rightButton?: HTMLElement) {

        this.height = height / 9;
        this.paper = Raphael(paperContainer, height, height);
        this.drawBoard();

        var pRotations = new FigureRotations(PentominoFigures.p);
        this.drawFigure(pRotations.getDrawInfo());

        if (upButton) {
            $(upButton).click(event => {
                pRotations.moveUp();
                this.clearBorad();
                this.drawFigure(pRotations.getDrawInfo());
            });
        }

        if (downButton) {
            $(downButton).click(event => {
                pRotations.moveDown();
                this.clearBorad();
                this.drawFigure(pRotations.getDrawInfo());
            });
        }

        if (leftButton) {
            $(leftButton).click(event => {
                pRotations.moveLeft();
                this.clearBorad();
                this.drawFigure(pRotations.getDrawInfo());
            });
        }

        if (rightButton) {
            $(rightButton).click(event => {
                pRotations.moveRight();
                this.clearBorad();
                this.drawFigure(pRotations.getDrawInfo());
            });
        }


        if (rotateButton) {
            $(rotateButton).click(event => {
                this.clearBorad();
                pRotations.changeRotationStateCLockwise();
                this.drawFigure(pRotations.getDrawInfo());
            });
        }
        $(document).keydown(event => {
            switch (event.which) {
            case 37: // left
                pRotations.moveLeft();
                this.clearBorad();
                this.drawFigure(pRotations.getDrawInfo());
                break;

            case 38: // up
                pRotations.moveUp();
                this.clearBorad();
                this.drawFigure(pRotations.getDrawInfo());
                break;

            case 39: // right
                pRotations.moveRight();
                this.clearBorad();
                this.drawFigure(pRotations.getDrawInfo());
                break;

            case 40: // down
                pRotations.moveDown();
                this.clearBorad();
                this.drawFigure(pRotations.getDrawInfo());
                break;
            case 82: // r
                this.clearBorad();
                pRotations.changeRotationStateCLockwise();
                this.drawFigure(pRotations.getDrawInfo());
                break;

            default:
                return; // exit this handler for other keys
            }
            event.preventDefault(); // prevent the default action (scroll / move caret)
        });
    }


    private drawFigure(drawInfo: IDrawInfo) {
        drawInfo.targetSquares.forEach(c => {
            this.squares[c.top][c.left].attr("fill", drawInfo.color);
        });
    }

    private clearBorad() {
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {

                var rect = this.squares[i][j];
                rect.attr("stroke", "#000");
                if ((i % 2 == 0 && j % 2 == 0) || (i % 2 != 0 && j % 2 != 0)) {
                    rect.attr("fill", "#BBB");
                } else {
                    rect.attr("fill", "#222");
                }
            }
        }

        this.squares[3][3].attr("fill", "#fff").attr("stroke", "none");
        this.squares[3][4].attr("fill", "#fff").attr("stroke", "none");
        this.squares[4][3].attr("fill", "#fff").attr("stroke", "none");
        this.squares[4][4].attr("fill", "#fff").attr("stroke", "none");
    }

    private drawBoard() {
        var leters = ["A", "B", "C", "D", "E", "F", "G", "H"];
        for (var i = 0; i < 8; i++) {
            //var lable = this.paper.rect(0, this.height + this.height * i, this.height, this.height).attr("text", leters[i]);
            var text = this.paper.text(this.height / 2, (3 * this.height / 2) + this.height * i, (8-i).toString());
            text.attr({ "font-size": 32, "font-family": "Arial, Helvetica, sans-serif" });
            text = this.paper.text((3 * this.height / 2) + this.height * i, this.height / 2 , leters[i]);
            text.attr({ "font-size": 32, "font-family": "Arial, Helvetica, sans-serif" });
        }

        for (var i = 0; i < 8; i++) {
            this.squares[i] = new Array<RaphaelElement>(8);
            for (var j = 0; j < 8; j++) {
                var rect = this.paper.rect(this.height + j * this.height, this.height+ i * this.height, 100, 100);
                this.squares[i][j] = rect;
            }
        }
        this.clearBorad();
    }

}

window.onload = () => {
    var search = new Search();
    search.initialize();
    search.search();
    var container = document.getElementById("content");
    var upButton = document.getElementById("up-button");
    var downButton = document.getElementById("down-button");
    var leftButton = document.getElementById("left-button");
    var rightButton = document.getElementById("right-button");
    var rotateButton = document.getElementById("rotate-button");
    var pentominoDrawer = new PentominoDrawer(container, 800, rotateButton, upButton, downButton, leftButton, rightButton);



};