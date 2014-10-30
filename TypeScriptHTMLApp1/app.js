/// <reference path="Scripts/typings/raphael/raphael.d.ts" />
///<reference path="Scripts/typings/jquery/jquery.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

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
    PentominoFigures.f = {
        geometry: [
            [false, true, true],
            [true, true, false],
            [false, true, false]
        ],
        color: "#0f0",
        name: "F"
    };

    PentominoFigures.p = {
        geometry: [
            [true, true],
            [true, true],
            [true, false]
        ],
        color: "#00f",
        name: "F"
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

        var pRotations = new FigureRotations(PentominoFigures.p);
        this.drawFigure(pRotations.getDrawInfo());

        if (upButton) {
            $(upButton).click(function (event) {
                pRotations.moveUp();
                _this.clearBorad();
                _this.drawFigure(pRotations.getDrawInfo());
            });
        }

        if (downButton) {
            $(downButton).click(function (event) {
                pRotations.moveDown();
                _this.clearBorad();
                _this.drawFigure(pRotations.getDrawInfo());
            });
        }

        if (leftButton) {
            $(leftButton).click(function (event) {
                pRotations.moveLeft();
                _this.clearBorad();
                _this.drawFigure(pRotations.getDrawInfo());
            });
        }

        if (rightButton) {
            $(rightButton).click(function (event) {
                pRotations.moveRight();
                _this.clearBorad();
                _this.drawFigure(pRotations.getDrawInfo());
            });
        }

        if (rotateButton) {
            $(rotateButton).click(function (event) {
                _this.clearBorad();
                pRotations.changeRotationStateCLockwise();
                _this.drawFigure(pRotations.getDrawInfo());
            });
        }
        $(document).keydown(function (event) {
            switch (event.which) {
                case 37:
                    pRotations.moveLeft();
                    _this.clearBorad();
                    _this.drawFigure(pRotations.getDrawInfo());
                    break;

                case 38:
                    pRotations.moveUp();
                    _this.clearBorad();
                    _this.drawFigure(pRotations.getDrawInfo());
                    break;

                case 39:
                    pRotations.moveRight();
                    _this.clearBorad();
                    _this.drawFigure(pRotations.getDrawInfo());
                    break;

                case 40:
                    pRotations.moveDown();
                    _this.clearBorad();
                    _this.drawFigure(pRotations.getDrawInfo());
                    break;
                case 82:
                    _this.clearBorad();
                    pRotations.changeRotationStateCLockwise();
                    _this.drawFigure(pRotations.getDrawInfo());
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
//# sourceMappingURL=app.js.map
