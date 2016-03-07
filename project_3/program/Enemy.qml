import QtQuick 2.0

AnimatedSprite {
    id: enemy
    property int type: 0

    width: 16
    height: 16
    source: "sprites/pacman-general-sprites.png"
    frameCount: 8
    interpolate: false

    frameX: 456
    frameY: {
        if (type == 8) return 64
        else if (type == 9) return 80
        else if (type == 10) return 96
        else return 112
    }

    frameWidth: 16
    frameHeight: 16
    frameRate: 5
    smooth: false
}

