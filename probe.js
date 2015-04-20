var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

function probe(protovideo) {
    return Bluebird.map(protovideo.clips, function(clip) {
        return new Bluebird(function(resolve, reject) {
            Fluently.ffprobe(clip.asset.file, function(error, probe) {
                if(error) {
                    reject(error)
                } else {
                    clip.asset.duration = probe.format.duration
                    clip.asset.size = {
                        width: probe.streams[0].width,
                        height: probe.streams[0].height
                    }
                    resolve(clip)
                }
            })
        })
    }).then(function(clips) {
        protovideo.clips = clips
        return protovideo
    })
}

module.exports = probe
