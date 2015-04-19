var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

var trim = require("./scripts/trim.js")
var merge = require("./scripts/merge.js")
var probe = require("./scripts/probe.js")
var transform = require("./scripts/transform.js")

function fusion(screen, clips) {
    return Bluebird.map(clips, function(clip) {
        return transform(screen, clip)
    }).then(function(clips) {
        return merge(clips)
    }).then(function(clip) {
        return clip
    })
}

var screen = {
    "width": 1280,
    "height": 720
}

var clips = [
    [
        {
            "clip_id": "123",
            "file": "./assets/1.flv",
            "duration": 8.056667,
            "trim": {
                "left": 4.056667,
                "right": 0
            },
            "position": {
                "x": 640/2,
                "y": 360/2
            },
            "dimensions": {
                "width": 640,
                "height": 360
            }
        }
    ],
    [
        {
            "clip_id": "456",
            "file": "./assets/1.flv",
            "duration": 8.056667,
            "trim": {
                "left": 2.056667,
                "right": 0
            },
            "position": {
                "x": 0,
                "y": 0
            },
            "dimensions": {
                "width": 640,
                "height": 360
            }
        },
        {
            "clip_id": "789",
            "file": "./assets/2.flv",
            "duration": 8.561,
            "trim": {
                "left": 2.561,
                "right": 0
            },
            "position": {
                "x": 640,
                "y": 360
            },
            "dimensions": {
                "width": 640,
                "height": 360
            }
        }
    ]
]

fusion(screen, clips).then(function(clip) {
    console.log(clip)
}).catch(function(error) {
    console.log(error)
})

//todo: better json format for clips vs subclips
//todo: unlink any and all temp clips
//todo: check for clip dir before writing
