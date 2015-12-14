// Initialize StatsD module
var StatsD = require('node-statsd'),
    client = new StatsD();

var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 8081 });

printServerStatus();

setTimeout(function() {
    
    function doSend(data) {
        wss.broadcast(data);
    }
    
    (function loop() {
        var randomTimeout = getRandomTimeout();
        setTimeout(function() {
            doSend( getRandomData() );
            loop();  
        }, randomTimeout);
    }());
    
}, 100);


wss.on('connection', function connection(ws) {
    
    printConnectionData(ws);
    client.increment('client-connection'); // StatsD connection-metric

    ws.on('close', function() {
        console.log('closed connection-' + this._ultron.id);
    });
});

wss.broadcast = function broadcast(data) {
    
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

function printServerStatus() {
    console.log('started server -  listening on localhost:8081');
}

function printConnectionData(ws) {
    console.log('opened connection-' + ws._ultron.id);
}

function getRandomData() {
    var text = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
    var randomLength = Math.floor(Math.random() * 4000) + 1;  

    for( var i=0; i < randomLength; i++ )
        text += chars.charAt(Math.floor(Math.random() * chars.length));

    return text;
}

function getRandomTimeout() {
    return Math.floor(Math.random() * 10000) + 100;
}