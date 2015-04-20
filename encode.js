var DataURI = require("datauri").promises

function encode(protovideo) {
    return DataURI(protovideo.file).then(function(content) {
        protovideo.content = content.substring(0, 64)
        return protovideo
    })
}

module.exports = encode
