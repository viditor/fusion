var fs = require("fs")
var Bluebird = require("bluebird")

function clean(protovideo) {
    return new Bluebird(function(resolve, reject) {
        fs.unlink(protovideo.file)
        delete protovideo.file
        
        for(var index in protovideo.clips) {
            var clip = protovideo.clips[index]
            fs.unlink(clip.file)
        }
        delete protovideo.clips
        
        for(var index in protovideo.assets) {
            var asset = protovideo.assets[index]
            fs.unlink(asset.file)
        }
        delete protovideo.assets
        
        resolve(protovideo)
    })
}

module.exports = clean
