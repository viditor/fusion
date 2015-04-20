var fs = require("fs")
var path = require("path")
var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

function merge(protovideo) {
    return new Bluebird(function(resolve, reject) {
        var process = new Fluently()
        var duration = 0
        for(var index in protovideo.clips) {
            var clip = protovideo.clips[index]
            process.addInput(clip.file)
            duration += clip.duration
        }
        process.on("error", function(error) {
            reject(error)
        })
        process.on("end", function() {
            resolve(protovideo)
        })
        var clip_directory = path.join(__dirname, "clips")
        if(!fs.existsSync(clip_directory)) {
            fs.mkdir(clip_directory)
        }
        protovideo.duration = duration
        if(protovideo.format == undefined) {
            protovideo.format = "mp4"
        }
        protovideo.file = path.join(clip_directory, ShortID.generate() + "." + protovideo.format)
        process.mergeToFile(protovideo.file, "./clips")
    })
}

module.exports = merge

//todo: handle bad video formats
//todo: use complex filters?
