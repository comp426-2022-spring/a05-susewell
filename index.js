// Place your server entry point code here
const args = require('minimist')(process.argv.slice(2))

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

function coinFlip() {
    let flip =  Math.random();
    if (flip < 0.5){
        return 'heads'
    } else {
        return 'tails'
    }
}
function coinFlips(flips) {

    let result = [];
    for(let i = 0; i < flips; i++) {
      result [i] = coinFlip();
    }
    return result;
}

function countFlips(array) {

     let i = 0;
     let heads = 0
     let tails = 0
    
    while (i < array.length) {
      if (array[i] === 'heads') {
        heads += 1;
      }else {
        tails +=1
      }
      i++;
    }
    if (tails === 0) {
      return {'heads' : heads}
    } else if (heads === 0) {
      return {'tails' : tails}
    } else {
    return {'heads' : heads, 'tails' : tails}
    }
  }

  function flipACoin(call) {
    let flip =  coinFlip();
  
    if (call != flip){
     return {call: call, flip: flip, result: 'lose'}
    } else{
      return {call: call, flip: flip, result: 'win'}
    }
  }

app.use(express.static('./public'))


app.get('/app/flip/', (req, res) => {
    res.status(200).json({ 'flip' : coinFlip()})
})



app.get('/app/echo/:number', express.json(), (req, res) => {
    res.status(200).json({ 'message': req.params.number })
})

app.get('/app/echo/', (req, res) => {
    res.status(200).json({ 'message' : req.query.number })
})


app.get('/app/flips/:number', (req, res) => {
    let flips = coinFlips(req.params.number)
    let final = countFlips(flips)
    res.status(200).json({ 'raw' : flips, 'summary' : final})
})

app.get('/app/flip/call/heads', (req, res) => {
    let heads = flipACoin('heads')
    res.status(200).json(heads)
})

app.get('/app/flip/call/tails', (req, res) => {
    let tails = flipACoin('tails')
    res.status(200).json(tails)
})

if (args.debug || args.d) {
    app.get('/app/log/access/', (req, res, next) => {
        const stmt = db.prepare('SELECT * FROM access').all();
        res.status(200).json(stmt);
    })
    app.get ('/app/error/', (req, res, next) => {
        throw new Error('Error')
    })
}

app.use(function(req, res){
    const statusCode = 404
    const statusMessage = 'NOT FOUND'
    res.status(statusCode).end(statusCode+ ' ' +statusMessage)
});

const server = app.listen(port, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",port))
});
