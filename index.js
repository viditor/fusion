var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

var merge = require("./scripts/merge.js")
var probe = require("./scripts/probe.js")
var transform = require("./scripts/transform.js")
var acquire = require("./scripts/acquire.js")
var flatten = require("./scripts/flatten.js")

function fusion(protovideo) {
    return (function() {
        console.log("Acquiring assets.")
        return acquire(protovideo)
    }())
    .then(function(protovideo) {
        console.log("Probing clips.")
        return probe(protovideo)
    })
    .then(function(protovideo) {
        console.log("Flattening clips.")
        return flatten(protovideo)
    })
    /*.then(function(clips) {
        console.log("Transforming clips.")
        protovideo.clips = clips
        return transform(protovideo)
    })
    .then(function(clips) {
        console.log("Merging clips.")
        return merge(clips)
    })*/
}

var protovideo = {
    "screen": {
        "width": 1280,
        "height": 720
    },
    "assets": {
        "missing": {
            "url": "https://www.youtube.com/watch?v=UiyDmqO59QE"
        },
        "late for work": {
            "url": "https://www.youtube.com/watch?v=kfchvCyHmsc"
        }
    },
    "clips": [
        {
            "asset": "missing",
            "tick": 0,
            "track": 0,
            "trim": {
                "left": 2,
                "right": 0
            },
            "size": {
                "width": 640,
                "height": 360
            }
        },
        {
            "asset": "late for work",
            "tick": 4,
            "track": 1,
            "trim": {
                "left": 2,
                "right": 0
            },
            "size": {
                "width": 640,
                "height": 360
            },
            "position": {
                "x": 640,
                "y": 360
            }
        },
        //uncomment for [blackness]!
        /*{
            "asset": {
                "url": "https://www.youtube.com/watch?v=kfchvCyHmsc"
            },
            "tick": 4+8+4+1,
            "track": 1,
            "trim": {
                "left": 2,
                "right": 0
            },
            "size": {
                "width": 1280,
                "height": 720
            }
        }*/
    ]
}

fusion(protovideo).then(function(video) {
    console.log(JSON.stringify(video, null, 4))
})

module.exports = fusion

//todo: render [blackness] during transform?
//todo: convert from and to data uri
//todo: probe data in clips
//todo: unlink any and all temp clips
//todo: check for clip dir before writing
//todo: rename "screen" and "position"
//todo: handle null values in clips (trim, size, POSITION, etc)
