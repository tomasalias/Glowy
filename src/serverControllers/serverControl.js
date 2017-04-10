console.log("Starting...");
var path = require('path');
var exec = require('child_process').exec;
var configReader = require('../../configReader')
var filePathINI = path.join(__dirname, 'ini.json');
var filePathOFF = path.join(__dirname, 'stop.json');
var fs = require('fs');
var mc_server = null;
var HashMap = require('hashmap');
var map = new HashMap();

var express = require('express');
//SOCKET IO NPM INSTALL
var app = express();
var serv = require('http').createServer(app);
var startQueue = {};

serv.listen(8080);
console.log("Server initialized");


var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    socket.on('status', function (name) {
        var server = map.get(name);
        if (server != null) {
            socket.emit("statusON"); //server status ON
        } else {
            socket.emit("statusOFF"); //server status OFF
        }
    });
    socket.on('startServer', function (name) {
        var server = map.get(name);
        if (server == null) {
            var poth = configReader.rootPath + '/servers/' + name;
            console.log("Starting server of " + name);
            var mc_server2 = exec('"java" -Xmx256M -Xms256M -Dcom.mojang.eula.agree=true -jar server.jar', { cwd: path.resolve(process.cwd() + "/servers/" + name) }, function(err, stdout, stderr) {
                if(err){ console.log(err); socket.emit("statusOFF"); return; }   
            });
            map.set(name, mc_server2);
            socket.emit("statusON"); //status on
        }
    });
    socket.on('command', function (name, cmd) {
        var server = map.get(name);
        console.log("packet received")
        if (server != null) {
            if (cmd == "stop") { //this is not the most efficient way but it works...
                server.stdin.write("stop\r");
                map.remove(name);
                socket.emit("statusOFF");
                console.log("Closing server of " + name);
            } else {
                console.log("else")
                if (cmd != null) {
                    console.log("In the server of " + name + " this command was executed: " + cmd);
                    server.stdin.write(cmd + "\r");
                }
            }
        }
    });
    socket.on('getIP', function(name) {
        var ip = getIP(name);
        socket.emit("ip", ip);
    })
    socket.on('stopServer', function (name) {
        //Hashmap saves the variable name and the username
        var server = map.get(name);
        if (server != null) {
            var lelo = map.get(name);
            lelo.stdin.write("stop\r");
            map.remove(name);
            console.log("Closing server of " + name);
            socket.emit("statusOFF");
        }
    });
    socket.on('stopAllServers', function () { //pararTodos means Stop All servers
        stopAllServers();
    });
    socket.on('allServers', function () { //see all the servers
        var todo1 = map.keys();
        var count1 = 0;
        var max2 = todo1.length;
        var mandar = [];
        while (count1 <= max2) {
            var paDecir = todo1[count1];
            if (paDecir != null) {
                mandar[count1] = paDecir;
            }
            count1++;
        }
        if (mandar != null) {
            socket.emit("todos", mandar); //sending all the servers in a list
        }
    });
});

//Stop the last server
function stopLastServer() {
    var todo = map.keys();
    if (todo.length == 3) { //hardcoded value of How many servers can be ran
        var paBorrar = todo[0];
        var lelo2 = map.get(todo[0]);
        if (lelo2 != null) {
            lelo2.stdin.write("stop\r");
            console.log("Closing server of " + paBorrar + " to save RAM");
            map.remove(paBorrar);
        }
    }
}
//Stop all the servers
function stopAllServers() {
    var todo = map.keys();
    var count = 0;
    var max = todo.length;
    while (count <= max) {
        var toDelete = todo[count];
        var lelo2 = map.get(toDelete); //lelo doesnt mean anything xD
        if (lelo2 != null) {
            lelo2.stdin.write("stop\r");
            console.log("Closing server of " + toDelete);
            map.remove(toDelete);
        }
        count++;
    }
}

function getIP(name){
    var ip = configReader.readConfig();
    var port = configReader.readServerInfo(name);
    var ipWithPort = ip.ip + ":" + (port.port - 1);
    return ipWithPort;
}