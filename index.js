// Place your server entry point code here
const args = require('minimist')(proccess.argv.slice(2))

const help = (`
server.js [options]
--port, -p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug, -d If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help, -h	Return this message and exit.
`)

if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

var express = require('express')
var app = express()

const fs = require('fs')
const morgan = require('morgan')
const logdb = require('./database.js')

app.use(express.json());

const port = args.port || args.p || process.env.PORT || 5000

if (args.log == 'false') {
    console.log("NOTICE: not creating file access.log")
} else {
    const logdir = './log/';

    if (!fs.existsSync(logdir)) {
        fs.mkdirSync(logdir);
    }

    const accesslog = fs.createWriteStream( logdir+'access.log', { flags: 'a' })

    app.use(morgan('combined', { stream: accesslog }))
}

app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    next();
})