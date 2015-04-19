var fs = require("fs")
var path = require("path")
var ytdl = require("ytdl-core")
var ShortID = require("shortid")
var Bluebird = require("bluebird")

function YoutubeDownload(youtube_url) {
    return new Bluebird(function(resolve, reject) {
        var directory = path.join(__dirname, "/../assets")
        if(!fs.existsSync(directory)) {
            fs.mkdir(directory)
        }
        var asset_id = ShortID.generate()
        var asset_file = path.join(directory, asset_id + ".flv")
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

module.exports = YoutubeDownload

//todo: handle invalid youtube_urls
//todo: select any quality, not just 5
