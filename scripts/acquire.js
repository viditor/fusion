var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

function acquire(protovideo) {
    return Bluebird.map(protovideo.clips, function(clip, index) {
        if(typeof clip.asset == "string") {
            //todo: check for url or data before label
            if(protovideo.assets[clip.asset] != undefined) {
                clip.asset = protovideo.assets[clip.asset]
            } else {
                throw "Asset '" + clip.asset + "' is invalid."
            }
        }
        if(clip.asset.data != undefined) {
            //todo: save data to file
                //http://stackoverflow.com/q/11335460
        } else if(clip.asset.url != undefined) {
            if(clip.asset.url.indexOf("youtube.com") != -1) {
                return youtube(clip.asset.url).then(function(asset_file) {
                    clip.asset.file = asset_file
                    return clip
                })
            } else {
                //todo: save file from http
                    //http://stackoverflow.com/q/11944932
            }
        } else {
            throw new Error("Clip #" + index + " has no asset.")
        }
    }).then(function(clips) {
        protovideo.clips = clips
        return protovideo
    })
}

var fs = require("fs")
var path = require("path")
var ytdl = require("ytdl-core")
var ShortID = require("shortid")
var Bluebird = require("bluebird")

function youtube(youtube_url) {
    return new Bluebird(function(resolve, reject) {
        var directory = path.join(__dirname, "/../assets")
        if(!fs.existsSync(directory)) {
            fs.mkdir(directory)
        }
        //todo: use youtube_id instead of asset_id
        //todo: throw an error for bad youtube_urls
        var asset_id = ShortID.generate()
        var asset_file = path.join(directory, asset_id + ".flv")
        //todo: be flexible about video quality
        var process = ytdl(youtube_url, {"quality": 5})
        process.on("error", function(error) {
            reject(error)
        })
        process.on("end", function() {
            resolve(asset_file)
        })
        process.pipe(fs.createWriteStream(asset_file))
    })
}

module.exports = acquire

