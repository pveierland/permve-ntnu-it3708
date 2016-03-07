import QtQuick 2.0

Rectangle {
    id: coin
    width: 16
    height: 16
    visible: true
    color: "transparent"
    smooth: true

    function use() {
        useCoin.start();
    }

    Image {
        id: coinImage
        source: "sprites/0.png"
        anchors.centerIn: parent;
    }

    SequentialAnimation {
        running: true
        loops: Animation.Infinite;

        PropertyAction { target: coinImage; property: "source"; value: "sprites/1.png" }
        PauseAnimation { duration: 50 }
        PropertyAction { target: coinImage; property: "source"; value: "sprites/2.png" }
        PauseAnimation { duration: 50 }
        PropertyAction { target: coinImage; property: "source"; value: "sprites/3.png" }
        PauseAnimation { duration: 50 }
        PropertyAction { target: coinImage; property: "source"; value: "sprites/0.png" }
        PauseAnimation { duration: 50 }
    }

    SequentialAnimation {
        id: useCoin

        PropertyAction { target: coin; property: "visible"; value: true }
        NumberAnimation { target: coin; property: "y"; to: coin.y - 30; duration: 200 }
        NumberAnimation { target: coin; property: "y"; to: coin.y - 15; duration: 200 }
        PropertyAction { target: coin; property: "visible"; value: false }
    }
}

