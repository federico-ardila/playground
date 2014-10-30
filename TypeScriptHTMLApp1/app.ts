/// <reference path="Scripts/typings/raphael/raphael.d.ts" />
///<reference path="Scripts/typings/jquery/jquery.d.ts"/>
///<reference path="Dlx.ts"/>

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

    static getAll() : Array<IPentominoFigure> {
        return [
            PentominoFigures.F, PentominoFigures.I, PentominoFigures.L,
            PentominoFigures.N, PentominoFigures.P, PentominoFigures.T,
            PentominoFigures.U, PentominoFigures.V, PentominoFigures.W,
            PentominoFigures.X, PentominoFigures.Y, PentominoFigures.Z
        ];
    }

// ReSharper disable InconsistentNaming
    static F: IPentominoFigure = {
        geometry: [
            [false, true, true],
            [true, true, false],
            [false, true, false]
        ],
        color: "#ff6",
        name: "F"
    }

    static P: IPentominoFigure = {
        geometry: [
            [true, true],
            [true, true],
            [true, false]
        ],
        color: "#039",
        name: "P"
    }

    static I: IPentominoFigure = {
        geometry: [
            [true],
            [true],
            [true],
            [true],
            [true]
        ],
        color: "#f0f",
        name: "I"
    }

    static L: IPentominoFigure = {
        geometry: [
            [true, false],
            [true, false],
            [true, false],
            [true, true]
        ],
        color: "#f93",
        name: "L"
    }

    static T: IPentominoFigure = {
        geometry: [
            [true, true, true],
            [false, true, false],
            [false, true, false]
        ],
        color: "#ff6",
        name: "T"
    }

    static N: IPentominoFigure = {
        geometry: [
            [false, true],
            [true, true],
            [true, false],
            [true, false]
        ],
        color: "#3c3",
        name: "N"
    }

    static U: IPentominoFigure = {
        geometry: [
            [true, false, true],
            [true, true, true]
        ],
        color: "#0fF",
        name: "U"
    }

    static V: IPentominoFigure = {
        geometry: [
            [true, false, false],
            [true, false, false],
            [true, true, true]
        ],
        color: "#c39",
        name: "V"
    }

    static W: IPentominoFigure = {
        geometry: [
            [true, false, false],
            [true, true, false],
            [false, true, true]
        ],
        color: "#33f",
        name: "W"
    }

    static X: IPentominoFigure = {
        geometry: [
            [false, true, false],
            [true, true, true],
            [false, true, false]
        ],
        color: "#f00",
        name: "X"
    }

    static Y: IPentominoFigure = {
        geometry: [
            [false, true],
            [true, true],
            [false, true],
            [false, true]
        ],
        color: "#0c9",
        name: "Y"
    }

    static Z: IPentominoFigure = {
        geometry: [
            [true, true, false],
            [false, true, false],
            [false, true, true]
        ],
        color: "#9f3",
        name: "Z"
    }

// ReSharper restore InconsistentNaming
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

        var figures = PentominoFigures.getAll().map(f => new FigureRotations(f));

        var figuresSelect = <HTMLSelectElement>document.getElementById("figure-select");
        var figuresMap: { [name: string]: FigureRotations } = {};

        var currentFigure = new FigureRotations(PentominoFigures.F);

        figures.forEach(f => {
            var option = document.createElement("option");
            option.value = f.figure.name;
            option.text = f.figure.name;
            figuresSelect.appendChild(option);
            figuresMap[f.figure.name] = f;
        });

        $(figuresSelect).change(event => {
            var valueSelected = figuresSelect.value;
            currentFigure = figuresMap[valueSelected];
            this.clearBorad();
            this.drawFigure(currentFigure.getDrawInfo());
        });


        
        this.drawFigure(currentFigure.getDrawInfo());

        if (upButton) {
            $(upButton).click(event => {
                currentFigure.moveUp();
                this.clearBorad();
                this.drawFigure(currentFigure.getDrawInfo());
            });
        }

        if (downButton) {
            $(downButton).click(event => {
                currentFigure.moveDown();
                this.clearBorad();
                this.drawFigure(currentFigure.getDrawInfo());
            });
        }

        if (leftButton) {
            $(leftButton).click(event => {
                currentFigure.moveLeft();
                this.clearBorad();
                this.drawFigure(currentFigure.getDrawInfo());
            });
        }

        if (rightButton) {
            $(rightButton).click(event => {
                currentFigure.moveRight();
                this.clearBorad();
                this.drawFigure(currentFigure.getDrawInfo());
            });
        }


        if (rotateButton) {
            $(rotateButton).click(event => {
                this.clearBorad();
                currentFigure.changeRotationStateCLockwise();
                this.drawFigure(currentFigure.getDrawInfo());
            });
        }
        $(document).keydown(event => {
            switch (event.which) {
            case 37: // left
                currentFigure.moveLeft();
                this.clearBorad();
                this.drawFigure(currentFigure.getDrawInfo());
                break;

            case 38: // up
                currentFigure.moveUp();
                this.clearBorad();
                this.drawFigure(currentFigure.getDrawInfo());
                break;

            case 39: // right
                currentFigure.moveRight();
                this.clearBorad();
                this.drawFigure(currentFigure.getDrawInfo());
                break;

            case 40: // down
                currentFigure.moveDown();
                this.clearBorad();
                this.drawFigure(currentFigure.getDrawInfo());
                break;
            case 82: // r
                this.clearBorad();
                currentFigure.changeRotationStateCLockwise();
                this.drawFigure(currentFigure.getDrawInfo());
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

    testSearch();

    var container = document.getElementById("content");
    var upButton = document.getElementById("up-button");
    var downButton = document.getElementById("down-button");
    var leftButton = document.getElementById("left-button");
    var rightButton = document.getElementById("right-button");
    var rotateButton = document.getElementById("rotate-button");
    var pentominoDrawer = new PentominoDrawer(container, 800, rotateButton, upButton, downButton, leftButton, rightButton);



};