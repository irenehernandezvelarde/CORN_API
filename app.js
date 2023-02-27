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
// Start HTTP server
const app = express()
// Set port number
const port = process.env.PORT || 7352
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
  console.log(receivedPOST.type)
  if (receivedPOST) {
    if (receivedPOST.type == "profiles") {
      var resultado=await queryDatabase("SELECT * from User");
      result = { status: "OK", result: resultado}
    }
    else if (receivedPOST.type == "setup_payment") {
      if(receivedPOST.id_destiny.length==0){
        result = {status:"ERROR",message:"user_id is required"}
      }
      else if(receivedPOST.quantity<0){
        result = {status:"ERROR",message:"Wrong amount"}
      }
      else{
        const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token= ' ';
        const charactersLength = characters.length;
        for ( let i = 0; i < 200; i++ ) {
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
        var horesMinuts=today.getHours()+":"+today.getMinutes()+":"+today.getSeconds()
        today = mm+'/'+dd+'/'+yyyy+" "+horesMinuts;
        await queryDatabase("INSERT INTO Transactions(destiny,quantity,token,accepted,TimeSetup) "+
        "values('"+receivedPOST.id_destiny+"',"+
        receivedPOST.quantity+","+
        "'"+token+"',"+
        "false, STR_TO_DATE('"+today+"','%m/%d/%Y %H:%i:%s'));"
        );
        var resultado = await(queryDatabase("select token from Transactions where token='"+token+"';"))
        console.log(resultado);
        result={status:"OK",result:resultado}
      }
    }
    else if(receivedPOST.type == "sync"){
      console.log("SYNQUING")
      var existingPhone=await queryDatabase("SELECT phone from User where phone='"+receivedPOST.phone+"';");
        if(existingPhone[0]!=null){
          var resultado=await queryDatabase("SELECT * from User WHERE phone='"+receivedPOST.phone+"';");
          console.log("selct",resultado)
          result={status: "OK",result:resultado,message:"accepted"}
        }
        else{
          await queryDatabase("INSERT INTO User(phone,name,surname,email) VALUES('"+
          receivedPOST.phone+"','"+receivedPOST.name+"','"+receivedPOST.surname+"','"+receivedPOST.email+"');");
          var resultado=await queryDatabase("SELECT * from User WHERE phone='"+receivedPOST.phone+"';");
          console.log(resultado)
          result={status: "OK",result:resultado,message:"created"}
        }}
    else if(receivedPOST.type == "start_payment"){
      var cuenta = await(queryDatabase("select count(*) from Transactions where token='"+receivedPOST.transactionToken+"';"))
      if(receivedPOST.transactionToken.length==0){
        result = {status:"ERROR",message:"Error token buit"}
      }
      else if(cuenta>1){
        result = {status:"ERROR",message:"Transaccio repetida"}
      }
      else{
        var resultado = await(queryDatabase("select quantity from Transactions where token='"+receivedPOST.transactionToken+"';"))
        console.log(resultado[0].quantity);
        result={status:"OK",message:"Transaccio realtzada correctament",transaction_type:"pagament",amount:resultado[0].quantity}
      }
    }
    else if(receivedPOST.type == "finish_payment"){
      var cuenta = await(queryDatabase("select count(*) from Transactions where token='"+receivedPOST.transactionToken+"';"))
      if(receivedPOST.transactionToken.length==0){
        result = {status:"ERROR",message:"Error token buit"}
      }
      else if(cuenta>1){
        result = {status:"ERROR",message:"Transaccio repetida"}
      }
      else{
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
        var horesMinuts=today.getHours()+":"+today.getMinutes()+":"+today.getSeconds()
        today = mm+'/'+dd+'/'+yyyy+" "+horesMinuts;
        console.log(today);
        console.log(receivedPOST.transactionToken);
          if(receivedPOST.accepted=="true"){
            await queryDatabase("UPDATE Transactions SET accepted=true, origin='"+receivedPOST.origin_id+"', TimeAccept=STR_TO_DATE('"+today+"','%m/%d/%Y %H:%i:%s') WHERE token='"+receivedPOST.transactionToken+"';");
            var response="Acceptada"
          }
          else{
            await queryDatabase("UPDATE Transactions SET accepted=falseorigin='"+receivedPOST.origin_id+"',TimeAccept=STR_TO_DATE('"+today+"','%m/%d/%Y %H:%i:%s') WHERE token='"+receivedPOST.transactionToken+"';");
            var response="Refusada"
          }
          var resultado = await(queryDatabase("select * from Transactions where token='"+receivedPOST.transactionToken+"';"))
          result={status:"OK",response:response}
        }
      }
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}
  async function sincronitzar(phone,name,surname,email){
      var existingPhone=await queryDatabase("SELECT phone from User where phone='"+phone+"';");
        if(existingPhone[0]!=null){
          var resultado=await queryDatabase("SELECT * from User WHERE phone='"+phone+"';");
          result={status: "OK",result:resultado}
        }
        else{
          await queryDatabase("INSERT INTO User(phone,name,surname,email) VALUES('"+
          phone+"','"+name+"','"+surname+"','"+email+"');");
          var resultado=await queryDatabase("SELECT * from User WHERE phone='"+phone+"';");
          result={status: "OK",result:resultado}
        }
        return result
      }
  async function setup_payment (id_destiny, quantity) {
    console.log(id_destiny);
    if(id_destiny.length==0){
      result = {status:"ERROR",message:"user_id is required"}
    }
    else if(quantity<0){
      result = {status:"ERROR",message:"Wrong amount"}
    }
    else{
      const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token= ' ';
      const charactersLength = characters.length;
      for ( let i = 0; i < 200; i++ ) {
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
      var horesMinuts=today.getHours()+":"+today.getMinutes()+":"+today.getSeconds()
      today = mm+'/'+dd+'/'+yyyy+" "+horesMinuts;
      await queryDatabase("INSERT INTO Transactions(destiny,quantity,token,accepted,TimeSetup) "+
      "values('"+id_destiny+"',"+
      quantity+","+
      "'"+token+"',"+
      "false, STR_TO_DATE('"+today+"','%m/%d/%Y %H:%i:%s'));"
      );
      var resultado = await(queryDatabase("select token from Transactions where token='"+token+"';"))
      result={status:"OK",response:resultado}
      console.log(resultado);
      result={status:"OK",response:resultado}
      return result
    }
  }
  async function start_payment () {
    var cuenta = await(queryDatabase("select count(*) from Transactions where token='"+receivedPOST.transactionToken+"';"))
    if(receivedPOST.transactionToken.length==0){
      result = {status:"ERROR",message:"Error token buit"}
    }
    else if(cuenta>1){
      result = {status:"ERROR",message:"Transaccio repetida"}
    }
    else{
      var resultado = await(queryDatabase("select * from Transactions where token='"+receivedPOST.token+"';"))
      result={status:"OK",message:"Transaccio realtzada correctament",transaction_type:"pagament",amount:receivedPOST.quantity,result:resultado}
    }
  }
  async function finish_payment (transactionToken, accepted) {
    var cuenta = await(queryDatabase("select count(*) from Transactions where token='"+transactionToken+"';"))
    if(transactionToken.length==0){
      result = {status:"ERROR",message:"Error token buit"}
    }
    else if(cuenta>1){
      result = {status:"ERROR",message:"Transaccio repetida"}
    }
    else{
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
      var horesMinuts=today.getHours()+":"+today.getMinutes()
      today = mm+'/'+dd+'/'+yyyy+" "+horesMinuts;
      if(accepted=="true"){
        await queryDatabase("UPDATE Transactions SET accepted=true TimeAccept='"+today+"' WHERE token='"+transactionToken+"';");
        var response="Acceptada"
      }
      else{
        await queryDatabase("UPDATE Transactions SET accepted=false TimeAccept='"+today+"' WHERE token='"+transactionToken+"';");
        var response="Refusada"
      }
      var resultado = await(queryDatabase("select * from Transactions where token='"+transactionToken+"';"))
      result={status:"OK",transaction_type:"pagament",amount:quantity,response:response}
    }
  }


// Run WebSocket server
const WebSocket = require('ws')
const { response } = require('express')
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
      host: process.env.MYSQLHOST || "containers-us-west-93.railway.app",
      port: process.env.MYSQLPORT || 7352,
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD || "Pf3EYHF733G4gfl29o4m",
      database: process.env.MYSQLDATABASE || "railway"
    });

    connection.query(query, (error, results) => { 
      if (error) reject(error);
      resolve(results)
    });
     
    connection.end();
  })
}