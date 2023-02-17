const express = require('express')
const fs = require('fs/promises')
const url = require('url')
const post = require('./post.js')
const { v4: uuidv4 } = require('uuid')
const mysql = require('mysql2')

// Wait 'ms' milliseconds
function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
console.log("Phone: "+queryDatabase("SELECT phone from User where phone="+612345678));
queryDatabase(
  'CREATE TABLE if not exists Transactions('+
  'id_transaction integer AUTO_INCREMENT primary key,'+
  'origin varchar(255),'+
  'destiny varchar(255),'+
  'quantity float,'+
  'token varchar(255) UNIQUE,'+
  'accepted boolean,'+
  'TimeSetup date,'+
  'TimeAccept date'+
');')
// Start HTTP server
const app = express()

// Set port number
const port = process.env.PORT || 3000

// Publish static files from 'public' folder
app.use(express.static('public'))
// Activate HTTP server
const httpServer = app.listen(port, appListen)
function appListen () {
  console.log(`Listening for HTTP queries on: http://localhost:${port}`)
}
// Set URL rout for POST queries
app.post('/dades', get_profiles)
async function get_profiles (req, res) {
  let receivedPOST = await post.getPostObject(req)
  let result = {};

  if (receivedPOST) {
    if (receivedPOST.type == "profiles") {
      var resultado=await queryDatabase("SELECT * from User");
      result = { status: "OK", result: resultado}
    }
  }
  app.post('/dades', sincronitzar)
  async function sincronitzar(){
    let receivedPOST = await post.getPostObject(req)
    let result = {};

  if (receivedPOST) {
      var existingPhone=await queryDatabase("SELECT phone from User where phone="+receivedPOST.phone);
        if(receivedPOST.phone==existingPhone.phone){
          var resultado=await queryDatabase("SELECT * from User WHERE phone="+receivedPOST.phone);
          result={status: "OK",result:resultado}
        }
        else{
          await queryDatabase("INSERT INTO User(phone,name,surname,email,password,token) VALUES("+
          receivedPOST.phone+",'"+receivedPOST.name+"',"+receivedPOST.surname+"',"+receivedPOST.email+"',"
          +receivedPOST.password+"');");
        }
      }
  }
  app.post('/dades', setup_payment)
  async function setup_payment (req, res) {
    let receivedPOST = await post.getPostObject(req)
    let result = {};
  
    if (receivedPOST) {
      if (receivedPOST.type == "setup_payment") {
        if(receivedPOST.id_destiny.toString().length==0){
          result = {status:"user_id is required"}
        }
        else if(receivedPOST.quantity<0){
          result = {status:"Wrong amount"}
        }
        else{
          const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let token= ' ';
          const charactersLength = characters.length;
          for ( let i = 0; i < 15; i++ ) {
              token += characters.charAt(Math.floor(Math.random() * charactersLength));
          }
          var today = new Date();
          var dd = today.getDate();

          var mm = today.getMonth()+1; 
          var yyyy = today.getFullYear();
          if(dd<10) 
          {
              dd='0'+dd;
          } 

          if(mm<10) 
          {
              mm='0'+mm;
          } 
          today = mm+'/'+dd+'/'+yyyy;
          await queryDatabase("INSERT INTO Transaction(origin,destiny,quantity,token,accepted,TimeSetup) "+
          "values('"+receivedPOST.id_origin+"',"+
          "'"+receivedPOST.id_destiny+"',"+
          receivedPOST.quantity+","+
          "'"+token+"',"+
          "false,'"+today+"');"
          );
        }
      }
    }
}

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

// Run WebSocket server
const WebSocket = require('ws')
const wss = new WebSocket.Server({ server: httpServer })
const socketsClients = new Map()
console.log(`Listening for WebSocket queries on ${port}`)

// What to do when a websocket client connects
wss.on('connection', (ws) => {

  console.log("Client connected")

  // Add client to the clients list
  const id = uuidv4()
  const color = Math.floor(Math.random() * 360)
  const metadata = { id, color }
  socketsClients.set(ws, metadata)

  // Send clients list to everyone
  sendClients()

  // What to do when a client is disconnected
  ws.on("close", () => {
    socketsClients.delete(ws)
  })

  // What to do when a client message is received
  ws.on('message', (bufferedMessage) => {
    var messageAsString = bufferedMessage.toString()
    var messageAsObject = {}
    
    try { messageAsObject = JSON.parse(messageAsString) } 
    catch (e) { console.log("Could not parse bufferedMessage from WS message") }

    if (messageAsObject.type == "bounce") {
      var rst = { type: "bounce", message: messageAsObject.message }
      ws.send(JSON.stringify(rst))
    } else if (messageAsObject.type == "broadcast") {
      var rst = { type: "broadcast", origin: id, message: messageAsObject.message }
      broadcast(rst)
    } else if (messageAsObject.type == "private") {
      var rst = { type: "private", origin: id, destination: messageAsObject.destination, message: messageAsObject.message }
      private(rst)
    }
  })
})

// Send clientsIds to everyone
function sendClients () {
  var clients = []
  socketsClients.forEach((value, key) => {
    clients.push(value.id)
  })
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      var id = socketsClients.get(client).id
      var messageAsString = JSON.stringify({ type: "clients", id: id, list: clients })
      client.send(messageAsString)
    }
  })
}

// Send a message to all websocket clients
async function broadcast (obj) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      var messageAsString = JSON.stringify(obj)
      client.send(messageAsString)
    }
  })
}

// Send a private message to a specific client
async function private (obj) {
  wss.clients.forEach((client) => {
    if (socketsClients.get(client).id == obj.destination && client.readyState === WebSocket.OPEN) {
      var messageAsString = JSON.stringify(obj)
      client.send(messageAsString)
      return
    }
  })
}

// Perform a query to the database
function queryDatabase (query) {

  return new Promise((resolve, reject) => {
    var connection = mysql.createConnection({
      host: process.env.MYSQLHOST || "containers-us-west-166.railway.app",
      port: process.env.MYSQLPORT || 8071,
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD || "QQgD4B4nQWHMpoUn8Pgr",
      database: process.env.MYSQLDATABASE || "railway"
    });

    connection.query(query, (error, results) => { 
      if (error) reject(error);
      resolve(results)
    });
     
    connection.end();
  })
}