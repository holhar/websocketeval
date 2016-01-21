// Initialize StatsD module
var StatsD = require('node-statsd'),
    client = new StatsD(),
    clientCounter = 0;

var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 8082 });

var maxMessageCount = 50;

printServerStatus();

setTimeout(function() {

    function doSend(data) {
        wss.broadcast(data);
    }

    (function loop() {
        setTimeout(function() {
            doSend( getRandomData() );
            loop();
        }, 500);
    }());

}, 100);

wss.on('connection', function connection(ws) {

    clientCounter += 1;
    ws.messageCount = 0;
    updateGauge();

    ws.on('close', function() {
        clientCounter -= 1;
        updateGauge();
    });
});

wss.broadcast = function broadcast(data) {

  wss.clients.forEach(function each(client) {
    client.send(data);
    client.messageCount += 1;
    letLiveOrLetDie(client);
  });
};

function printServerStatus() {
    console.log('started ws-server, testcase 2 - listening on port 8082');
}

function printConnectionData(ws, occurrence) {
    console.log(occurrence + ' connection-' + ws._ultron.id);
}

function updateGauge() {
    client.gauge('client connections', clientCounter);
}

function letLiveOrLetDie(client) {
    if(client.messageCount >= maxMessageCount) {
        client.close();
    }
}

function getRandomData() {
    var text = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
    var randomLength = Math.floor(Math.random() * 4000) + 1;

    for( var i=0; i < randomLength; i++ )
        text += chars.charAt(Math.floor(Math.random() * chars.length));

    return text;
}
