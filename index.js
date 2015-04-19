var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

var merge = require("./scripts/merge.js")
var transform = require("./scripts/transform.js")
var youtube = require("./scripts/youtube.js")

function acquire(clips) {
    return Bluebird.map(clips, function(clip, index) {
        //if(clip.asset.data != undefined) {} else
        if(clip.asset.url != undefined) {
            if(clip.asset.url.indexOf("youtube.com") != -1) {
                return youtube(clip.asset.url).then(function(asset_file) {
                    clip.asset.file = asset_file
                    return clip
                })
            } else {
                //http
            }
        } else {
            throw new Error("Clip #" + index + " has no asset.")
        }
    })
}

function probe(clips) {
    return Bluebird.map(clips, function(clip) {
        return new Bluebird(function(resolve, reject) {
            Fluently.ffprobe(clip.asset.file, function(error, probe) {
                if(error) {
                    reject(error)
                } else {
                    clip.duration = probe.format.duration
                    resolve(clip)
                }
            })
        })
    })
}

function fusion(protovideo) {
    return acquire(protovideo.clips)
    .then(function(clips) {
        return probe(clips)
    }).then(function(clips) {
        return clips
    })
    /*return Bluebird.map(clips, function(clip) {
        return transform(screen, clip)
    }).then(function(clips) {
        return merge(clips)
    }).then(function(clip) {
        return clip
    })*/
}

var protovideo = {
    "surface": {
        "width": 1280,
        "height": 720
    },
    "clips": [
        {
            "asset": {
                "url": "https://www.youtube.com/watch?v=UiyDmqO59QE"
            },
            "tick": 0,
            "track": 0,
            "trim": {
                "left": 2.05,
                "right": 0
            },
            "size": {
                "width": 640,
                "height": 360
            }
        },
        {
            "asset": {
                "url": "https://www.youtube.com/watch?v=kfchvCyHmsc"
            },
            "tick": 6,
            "track": 0,
            "trim": {
                "left": 2.05,
                "right": 0
            },
            "size": {
                "width": 1280,
                "height": 720
            }
        }
    ]
}

fusion(protovideo).then(function(video) {
    console.log(video)
}).catch(function(error) {
    console.log(error)
})

function flatten(protovideo) {
    return new Bluebird(function(resolve, reject) {
        resolve(protovideo)
    })
}

//todo: flatten the clips before transforming
//todo: handle null values in clips
//todo: convert from and to data uri
//todo: probe data in clips
//todo: unlink any and all temp clips
//todo: check for clip dir before writing

module.exports = fusion
