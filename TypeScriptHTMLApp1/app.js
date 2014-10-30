/// <reference path="Scripts/typings/raphael/raphael.d.ts" />
///<reference path="Scripts/typings/jquery/jquery.d.ts"/>
///<reference path="Dlx.ts"/>

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
        } else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};

var FigureRotations = (function () {
    function FigureRotations(figure) {
        this.figure = figure;
        this.getRotations();
        this.currentRotation = 0;
        this.currentPosition = { top: 0, left: 0 };
    }
    FigureRotations.prototype.getRotations = function () {
        this.rotations = new Array();
        this.rotations[0] = this.figure.geometry;
        var i = 1;
        var nextRotation = this.getNextRotationClockwise(this.figure.geometry);
        while (!nextRotation.equals(this.figure.geometry)) {
            this.rotations.push(nextRotation);
            nextRotation = this.getNextRotationClockwise(nextRotation);
        }
        var fliped = this.getFliped(this.figure.geometry);
        var isNewShape = this.rotations.every(function (rotation) {
            return !rotation.equals(fliped);
        });
        if (isNewShape) {
            this.rotations.push(fliped);
            nextRotation = this.getNextRotationClockwise(fliped);
            while (!nextRotation.equals(fliped)) {
                this.rotations.push(nextRotation);
                nextRotation = this.getNextRotationClockwise(nextRotation);
            }
        }
    };

    FigureRotations.prototype.changeRotationStateCLockwise = function () {
        do {
            this.currentRotation = (this.currentRotation + 1) % this.rotations.length;
        } while(!this.isValidPosition(this.currentPosition));
    };

    FigureRotations.prototype.setPosition = function (newPosition) {
        if (!this.isValidPosition(newPosition)) {
            return false;
        }
        this.currentPosition = newPosition;
        return true;
    };

    FigureRotations.prototype.moveUp = function () {
        return this.setPosition({
            left: this.currentPosition.left,
            top: this.currentPosition.top - 1
        });
    };

    FigureRotations.prototype.moveDown = function () {
        return this.setPosition({
            left: this.currentPosition.left,
            top: this.currentPosition.top + 1
        });
    };

    FigureRotations.prototype.moveLeft = function () {
        return this.setPosition({
            left: this.currentPosition.left - 1,
            top: this.currentPosition.top
        });
    };

    FigureRotations.prototype.moveRight = function () {
        return this.setPosition({
            left: this.currentPosition.left + 1,
            top: this.currentPosition.top
        });
    };

    FigureRotations.prototype.isValidPosition = function (position) {
        var isValid = this.getTargetSquares(position, this.currentRotation).every(function (square) {
            var inboundsVertical = square.top >= 0 && square.top < 8;
            var inboundsHorizontal = square.left >= 0 && square.left < 8;
            var outbounds = !((square.top == 3 && (square.left == 3 || square.left == 4)) || (square.top == 4 && (square.left == 3 || square.left == 4)));

            return inboundsVertical && inboundsHorizontal && outbounds;
        });
        return isValid;
    };

    FigureRotations.prototype.getFliped = function (currentGeometry) {
        var width = currentGeometry[0].length;
        var height = currentGeometry.length;
        var result = new Array(height);
        for (var i = 0; i < height; i++) {
            result[i] = new Array(width);
            for (var j = 0; j < width; j++) {
                result[i][j] = currentGeometry[i][width - j - 1];
            }
        }
        return result;
    };

    FigureRotations.prototype.getNextRotationClockwise = function (currentGeometry) {
        var width = currentGeometry[0].length;
        var height = currentGeometry.length;
        var newwidth = height;
        var newHeight = width;
        var result = new Array(newHeight);
        for (var i = 0; i < newHeight; i++) {
            result[i] = new Array(newwidth);
            for (var j = 0; j < newwidth; j++) {
                result[i][j] = currentGeometry[newwidth - 1 - j][i];
            }
        }
        return result;
    };

    FigureRotations.prototype.getTargetSquares = function (position, rotation) {
        var result = new Array();
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
    };

    FigureRotations.prototype.getDrawInfo = function () {
        return {
            //position: this.currentPosition
            //geometry : this.rotations[this.currentRotation],
            color: this.figure.color,
            targetSquares: this.getTargetSquares(this.currentPosition, this.currentRotation)
        };
    };
    return FigureRotations;
})();

var PentominoFigures = (function () {
    function PentominoFigures() {
    }
    PentominoFigures.getAll = function () {
        return [
            PentominoFigures.F, PentominoFigures.I, PentominoFigures.L,
            PentominoFigures.N, PentominoFigures.P, PentominoFigures.T,
            PentominoFigures.U, PentominoFigures.V, PentominoFigures.W,
            PentominoFigures.X, PentominoFigures.Y, PentominoFigures.Z
        ];
    };

    PentominoFigures.F = {
        geometry: [
            [false, true, true],
            [true, true, false],
            [false, true, false]
        ],
        color: "#ff6",
        name: "F"
    };

    PentominoFigures.P = {
        geometry: [
            [true, true],
            [true, true],
            [true, false]
        ],
        color: "#039",
        name: "P"
    };

    PentominoFigures.I = {
        geometry: [
            [true],
            [true],
            [true],
            [true],
            [true]
        ],
        color: "#f0f",
        name: "I"
    };

    PentominoFigures.L = {
        geometry: [
            [true, false],
            [true, false],
            [true, false],
            [true, true]
        ],
        color: "#f93",
        name: "L"
    };

    PentominoFigures.T = {
        geometry: [
            [true, true, true],
            [false, true, false],
            [false, true, false]
        ],
        color: "#ff6",
        name: "T"
    };

    PentominoFigures.N = {
        geometry: [
            [false, true],
            [true, true],
            [true, false],
            [true, false]
        ],
        color: "#3c3",
        name: "N"
    };

    PentominoFigures.U = {
        geometry: [
            [true, false, true],
            [true, true, true]
        ],
        color: "#0fF",
        name: "U"
    };

    PentominoFigures.V = {
        geometry: [
            [true, false, false],
            [true, false, false],
            [true, true, true]
        ],
        color: "#c39",
        name: "V"
    };

    PentominoFigures.W = {
        geometry: [
            [true, false, false],
            [true, true, false],
            [false, true, true]
        ],
        color: "#33f",
        name: "W"
    };

    PentominoFigures.X = {
        geometry: [
            [false, true, false],
            [true, true, true],
            [false, true, false]
        ],
        color: "#f00",
        name: "X"
    };

    PentominoFigures.Y = {
        geometry: [
            [false, true],
            [true, true],
            [false, true],
            [false, true]
        ],
        color: "#0c9",
        name: "Y"
    };

    PentominoFigures.Z = {
        geometry: [
            [true, true, false],
            [false, true, false],
            [false, true, true]
        ],
        color: "#9f3",
        name: "Z"
    };
    return PentominoFigures;
})();

var PentominoDrawer = (function () {
    function PentominoDrawer(paperContainer, height, rotateButton, upButton, downButton, leftButton, rightButton) {
        var _this = this;
        this.squares = new Array(8);
        this.height = height / 9;
        this.paper = Raphael(paperContainer, height, height);
        this.drawBoard();

        var figures = PentominoFigures.getAll().map(function (f) {
            return new FigureRotations(f);
        });

        var figuresSelect = document.getElementById("figure-select");
        var figuresMap = {};

        var currentFigure = new FigureRotations(PentominoFigures.F);

        figures.forEach(function (f) {
            var option = document.createElement("option");
            option.value = f.figure.name;
            option.text = f.figure.name;
            figuresSelect.appendChild(option);
            figuresMap[f.figure.name] = f;
        });

        $(figuresSelect).change(function (event) {
            var valueSelected = figuresSelect.value;
            currentFigure = figuresMap[valueSelected];
            _this.clearBorad();
            _this.drawFigure(currentFigure.getDrawInfo());
        });

        this.drawFigure(currentFigure.getDrawInfo());

        if (upButton) {
            $(upButton).click(function (event) {
                currentFigure.moveUp();
                _this.clearBorad();
                _this.drawFigure(currentFigure.getDrawInfo());
            });
        }

        if (downButton) {
            $(downButton).click(function (event) {
                currentFigure.moveDown();
                _this.clearBorad();
                _this.drawFigure(currentFigure.getDrawInfo());
            });
        }

        if (leftButton) {
            $(leftButton).click(function (event) {
                currentFigure.moveLeft();
                _this.clearBorad();
                _this.drawFigure(currentFigure.getDrawInfo());
            });
        }

        if (rightButton) {
            $(rightButton).click(function (event) {
                currentFigure.moveRight();
                _this.clearBorad();
                _this.drawFigure(currentFigure.getDrawInfo());
            });
        }

        if (rotateButton) {
            $(rotateButton).click(function (event) {
                _this.clearBorad();
                currentFigure.changeRotationStateCLockwise();
                _this.drawFigure(currentFigure.getDrawInfo());
            });
        }
        $(document).keydown(function (event) {
            switch (event.which) {
                case 37:
                    currentFigure.moveLeft();
                    _this.clearBorad();
                    _this.drawFigure(currentFigure.getDrawInfo());
                    break;

                case 38:
                    currentFigure.moveUp();
                    _this.clearBorad();
                    _this.drawFigure(currentFigure.getDrawInfo());
                    break;

                case 39:
                    currentFigure.moveRight();
                    _this.clearBorad();
                    _this.drawFigure(currentFigure.getDrawInfo());
                    break;

                case 40:
                    currentFigure.moveDown();
                    _this.clearBorad();
                    _this.drawFigure(currentFigure.getDrawInfo());
                    break;
                case 82:
                    _this.clearBorad();
                    currentFigure.changeRotationStateCLockwise();
                    _this.drawFigure(currentFigure.getDrawInfo());
                    break;

                default:
                    return;
            }
            event.preventDefault(); // prevent the default action (scroll / move caret)
        });
    }
    PentominoDrawer.prototype.drawFigure = function (drawInfo) {
        var _this = this;
        drawInfo.targetSquares.forEach(function (c) {
            _this.squares[c.top][c.left].attr("fill", drawInfo.color);
        });
    };

    PentominoDrawer.prototype.clearBorad = function () {
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
    };

    PentominoDrawer.prototype.drawBoard = function () {
        var leters = ["A", "B", "C", "D", "E", "F", "G", "H"];
        for (var i = 0; i < 8; i++) {
            //var lable = this.paper.rect(0, this.height + this.height * i, this.height, this.height).attr("text", leters[i]);
            var text = this.paper.text(this.height / 2, (3 * this.height / 2) + this.height * i, (8 - i).toString());
            text.attr({ "font-size": 32, "font-family": "Arial, Helvetica, sans-serif" });
            text = this.paper.text((3 * this.height / 2) + this.height * i, this.height / 2, leters[i]);
            text.attr({ "font-size": 32, "font-family": "Arial, Helvetica, sans-serif" });
        }

        for (var i = 0; i < 8; i++) {
            this.squares[i] = new Array(8);
            for (var j = 0; j < 8; j++) {
                var rect = this.paper.rect(this.height + j * this.height, this.height + i * this.height, 100, 100);
                this.squares[i][j] = rect;
            }
        }
        this.clearBorad();
    };
    return PentominoDrawer;
})();

window.onload = function () {
    testSearch();

    var container = document.getElementById("content");
    var upButton = document.getElementById("up-button");
    var downButton = document.getElementById("down-button");
    var leftButton = document.getElementById("left-button");
    var rightButton = document.getElementById("right-button");
    var rotateButton = document.getElementById("rotate-button");
    var pentominoDrawer = new PentominoDrawer(container, 800, rotateButton, upButton, downButton, leftButton, rightButton);
};
//# sourceMappingURL=app.js.map
