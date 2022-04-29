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

