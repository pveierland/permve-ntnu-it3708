import QtQuick 2.0

Item {
    transform: Scale { xScale: 4; yScale: 4 }

    id: root

    property int gridWidth: 0
    property int gridHeight: 0
    property variant gridValues: null
    property variant components: null

    signal wtf(string s)

    function loadComponents() {
        components = {}

        var enemy = Qt.createComponent('Enemy.qml');

        for (var i = 8; i <= 11; i++) {
            components[i] = enemy
        }

        root.components = components

        console.log("Components loaded! :)")
    }

    function getGridIndex(column, row) {
        return column + (row * root.gridWidth);
    }

    function setGrid(width, height, values) {
        root.gridWidth  = width
        root.gridHeight = height
        root.gridValues = new Array(width * height)

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var index = getGridIndex(x, y)
                var value = values[index]

                if (value != 0) {
                    var object  = components[value].createObject(page)
                    object.type = value
                    object.x = 16 * x
                    object.y = 16 * y

                    root.gridValues[index] = object
                }
            }
        }

        console.log('Grid loaded :D')
    }

    Rectangle {
        id: page
        width: 160; height: 160
        color: "black"

        MouseArea {
            onClicked: {
                var dx = Math.abs(agent.x - mouse.x)
                var dy = Math.abs(agent.y - mouse.y)

                if (dx > dy) {
                    if (mouse.x > agent.x) {
                        agent.moveRight()
                    } else {
                        agent.moveLeft()
                    }
                } else {
                    if (mouse.y > agent.y) {
                        agent.moveDown()
                    } else {
                        agent.moveUp()
                    }
                }
            }
            anchors.fill: parent
        }

        Agent {
            id: agent
            y: 0
            x: 0
        }
    }
}

