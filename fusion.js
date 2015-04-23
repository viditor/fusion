var Chalk = require("chalk")
var ShortID = require("shortid")

var acquire = require("./acquire.js")
var probe = require("./probe.js")
var flatten = require("./flatten.js")
var transform = require("./transform.js")
var merge = require("./merge.js")
var encode = require("./encode.js")
var clean = require("./clean.js")

function log(message, job_id) {
    var now = new Date(Date.now())
    var hours = now.getHours()
    var minutes = now.getMinutes()
    var seconds = now.getSeconds()
    var year = now.getFullYear()
    var month = now.getMonth() + 1
    var day = now.getDate()
    if(seconds < 10) {
        seconds = "0" + seconds
    }
    if(minutes < 10) {
        minutes = "0" + minutes
    }
    var datestring = year + "/" + month + "/" + day
    var timestring = hours + ":" + minutes + ":" + seconds
    var jobstring = Chalk.yellow("[" + job_id + "]")
    var datetimestring = Chalk.green("[" + datestring + " @ " + timestring + "]")
    console.log(datetimestring + jobstring, message)
}

function fusion(protovideo) {
    var job_id = ShortID.generate()
    return (function() {
        log("Acquiring assets.", job_id)
        return acquire(protovideo)
    }())
    .then(function(protovideo) {
        log("Probing clips.", job_id)
        return probe(protovideo)
    })
    .then(function(protovideo) {
        log("Flattening clips.", job_id)
        return flatten(protovideo)
    })
    .then(function(protovideo) {
        log("Transforming clips.", job_id)
        return transform(protovideo)
    })
    .then(function(protovideo) {
        log("Merging clips.", job_id)
        return merge(protovideo)
    })
    .then(function(protovideo) {
        log("Encoding video.", job_id)
        return encode(protovideo)
    })
    .then(function(protovideo) {
        log("Cleaning files.", job_id)
        return clean(protovideo)
    })
}

module.exports = fusion
