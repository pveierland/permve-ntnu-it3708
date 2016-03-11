import QtQuick 2.0

AnimatedSprite {
    id: enemy
    property int type: 0

    width: 16
    height: 16
    source: 'data/enemies.png'
    frameCount: 8
    interpolate: false

    currentFrame: { Math.floor(Math.random() * 9) }

    frameX: 0
    frameY: {
        if (type == 8) return 0
        else if (type == 9) return 16
        else if (type == 10) return 32
        else return 48
    }

    frameWidth: 16
    frameHeight: 16
    frameRate: 5
    smooth: false
}

