var cluster = require('cluster'); // required if worker id is needed
var sticky = require('sticky-session');

var StatsD = require('node-statsd'),
    client = new StatsD(),
    clientCounter = 0;

var server = require('http').createServer(function(req, res) {
  res.end('worker: ' + cluster.worker.id);
});

if (!sticky.listen(server, 3000)) {

    server.once('listening', function() {
        console.log('Started sticky server listening to port 3000');
    });
} else {

    var WebSocketServer = require('ws').Server,
        wss = new WebSocketServer({
            port: 8082
        });
    var serverId = cluster.worker.id;

    var maxMessageCount = 50,
        messageCount = 0;

    printServerStatus();

    setTimeout(function() {

        function doSend(data) {
            wss.broadcast(data);
        }

        (function loop() {
            setTimeout(function() {
                messageCount += 1;

                if (messageCount >= maxMessageCount) {
                    doSend("timeToGo");
                    messageCount = 0;
                } else {
                    doSend(getRandomData());
                }

                loop();
            }, 500);
        }());

    }, 100);

    wss.on('connection', function connection(ws) {

        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });

        clientCounter += 1;
        updateGauge(serverId);

        ws.on('close', function() {
            clientCounter -= 1;
            updateGauge(serverId);
        });
    });

    wss.broadcast = function broadcast(data) {

        wss.clients.forEach(function each(client) {
            // Do not send, if client is not open
            if (client.readyState == 1) {
                client.send(data);
            }
        });
    };
}

function printServerStatus() {
    console.log('started ws-server, testcase 2 - listening on port 8082');
}

function printConnectionData(ws, occurrence) {
    console.log(occurrence + ' connection-' + ws._ultron.id);
}

function updateGauge(serverId) {
    client.gauge('client connections-' + serverId, clientCounter);
}

function getRandomData() {
    var text = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
    var randomLength = Math.floor(Math.random() * 4000) + 1;

    for (var i = 0; i < randomLength; i++)
        text += chars.charAt(Math.floor(Math.random() * chars.length));

    return text;
}