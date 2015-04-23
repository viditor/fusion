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
            return acquire_data(clip.asset.data).then(function(asset_file) {
                clip.asset.file = asset_file
                return clip
            })
        } else if(clip.asset.url != undefined) {
            if(clip.asset.url.indexOf("youtube.com") != -1) {
                return acquire_youtube(clip.asset.url).then(function(asset_file) {
                    clip.asset.file = asset_file
                    return clip
                })
            } else {
                return acquire_http(clip.asset.url).then(function(asset_file) {
                    clip.asset.file = asset_file
                    return clip
                })
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
var http = require("http")
var path = require("path")
var ytdl = require("ytdl-core")
var ShortID = require("shortid")
var Bluebird = require("bluebird")

function acquire_youtube(youtube_url) {
    return new Bluebird(function(resolve, reject) {
        var asset_directory = path.join(__dirname, "assets")
        if(!fs.existsSync(asset_directory)) {
            fs.mkdir(asset_directory)
        }
        //todo: use youtube_id instead of asset_id
        //todo: throw an error for bad youtube_urls
        var asset_id = ShortID.generate()
        var asset_file = path.join(asset_directory, asset_id + ".flv")
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

function acquire_http(url) {
    return new Bluebird(function(resolve, reject) {
        var asset_directory = path.join(__dirname, "assets")
        if(!fs.existsSync(asset_directory)) {
            fs.mkdir(asset_directory)
        }
        var asset_id = ShortID.generate()
        var asset_file = path.join(asset_directory, asset_id + ".flv")
        var request = http.get(url, function(response) {
            response.pipe(fs.createWriteStream(asset_file))
            response.on("end", function() {
                resolve(asset_file)
            })
        })
    })
}

function acquire_data(data) {
    return new Bluebird(function(resolve, reject) {
        var asset_directory = path.join(__dirname, "assets")
        if(!fs.existsSync(asset_directory)) {
            fs.mkdir(asset_directory)
        }
        var matches = data.match(/^data:.+\/(.+);base64,(.*)$/);
        var data_ext = matches[1];
        data = matches[2];
        var asset_id = ShortID.generate()
        var asset_file = path.join(asset_directory, asset_id + "." + data_ext)
        var regex = /^data:.+\/(.+);base64,(.*)$/
        data = new Buffer(data, "base64")
        fs.writeFile(asset_file, data, function(error) {
            if(error) {
                reject(error)
            } else {
                resolve(asset_file)
            }
        });
    })
}

module.exports = acquire

