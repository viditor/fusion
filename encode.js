var DataURI = require("datauri").promises

function encode(protovideo) {
    return DataURI(protovideo.file).then(function(content) {
        protovideo.content = content
        return protovideo
    })
}

module.exports = encode
