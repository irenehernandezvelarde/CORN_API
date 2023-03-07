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
  console.log(receivedPOST.type)
  if (receivedPOST) {
    if (receivedPOST.type == "profiles") {
      var resultado=await queryDatabase("SELECT * from User;");
      result = { status: "OK", result: resultado}
    }
    else if (receivedPOST.type == "get_profile") {
      var resultado=await queryDatabase("SELECT * from User where token='"+receivedPOST.token+"';");
      result = { status: "OK", result: resultado,token:receivedPOST.token}
    }
    else if (receivedPOST.type == "get_transactions") {
      var transaction=await queryDatabase("SELECT * from Transactions where destiny='"+receivedPOST.phone+"' OR origin='"+receivedPOST.phone+"';");
      result = { status: "OK", transactions:transaction}
    }
    else if(receivedPOST.type == "change_token"){
      
        await queryDatabase("UPDATE User SET token='' WHERE token='"+receivedPOST.token+"';");
        var resultado=await queryDatabase("SELECT * from User WHERE phone='"+receivedPOST.token+"';");
        result={status: "OK",result:resultado}
    }
    else if (receivedPOST.type == "setup_payment") {
      if(receivedPOST.token.length==0){
        result = {status:"ERROR",message:"token is required"}
      }
      else if(receivedPOST.quantity<0){
        result = {status:"ERROR",message:"Wrong amount"}
      }
      else{
        const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token= ' ';
        const charactersLength = characters.length;
        for ( let i = 0; i < 100; i++ ) {
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
        var id_destiny = await queryDatabase("SELECT phone FROM User WHERE token='"+receivedPOST.token+"';");
        await queryDatabase("INSERT INTO Transactions(destiny,quantity,token,accepted,TimeSetup) "+
          "values('"+id_destiny[0].phone+"',"+
          receivedPOST.quantity+","+
          "'"+token+"',"+
          "false, STR_TO_DATE('"+today+"','%m/%d/%Y %H:%i:%s'));"
          );
        var resultado = await(queryDatabase("select token from Transactions where token='"+token+"';"))
        console.log(resultado);
        result={status:"OK",result:resultado}
      }
    }
    /*else if(receivedPOST.type == "sync"){
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
        }}*/
    else if(receivedPOST.type == "login"){
      const characters ="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.;:?¿!<#$%&/()-+*";
        let token= ' ';
        const charactersLength = characters.length;
        for ( let i = 0; i < 30; i++ ) {
            token += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
      var existing=await queryDatabase("SELECT * from User where email='"+receivedPOST.email+"';");
        if(existing[0]!=null){
          if(existing[0].password==receivedPOST.password){
            await queryDatabase("UPDATE User SET token='"+token+"' WHERE email='"+receivedPOST.email+"';");
            var resultado=await queryDatabase("SELECT * from User WHERE email='"+receivedPOST.email+"';");
            result={status: "OK",result:resultado,message:"accepted"}
          }
          else{
            result={status: "ERROR",message:"incorrect password"}
          }
        }
        else{
          result={status: "ERROR",message:"unexistent",exist:existing}
        }}
    else if(receivedPOST.type == "signup"){
      const characters ="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.;:?¿!<#$%&/()-+*";
        let token= ' ';
        const charactersLength = characters.length;
        for ( let i = 0; i < 30; i++ ) {
            token += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        if(receivedPOST.phone.toString().length==0){
          result={status: "ERROR",message:"Insert phone"}
        }
        else if(receivedPOST.email.length==0){
          result={status: "ERROR",message:"Insert mail"}
        }
        else if(receivedPOST.name.length==0){
          result={status: "ERROR",message:"Insert name"}
        }
        else if(receivedPOST.surname.length==0){
          result={status: "ERROR",message:"Insert surname"}
        }
        else if(receivedPOST.password.length==0){
          result={status: "ERROR",message:"Insert password"}
        }
        else{
        await queryDatabase("INSERT INTO User(phone,name,surname,email,password,token,balance) VALUES('"+
            receivedPOST.phone+"','"+receivedPOST.name+"','"+receivedPOST.surname+"','"+receivedPOST.email+"','"+receivedPOST.password+"','"+token+"',50);");
            var resultado=await queryDatabase("SELECT * from User WHERE phone='"+receivedPOST.phone+"';");
            result={status: "OK",result:resultado,message:"created",mail:receivedPOST.email}
        }
    }
    else if(receivedPOST.type == "start_payment"){
      var cuenta = await(queryDatabase(`select count(*) from Transactions where token="${receivedPOST.transactionToken}";`))
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
      await queryDatabase("SET autocommit=0;") 
      var origin_id = await queryDatabase("select phone from User where token='"+receivedPOST.token+"';")
      console.log(origin_id[0].phone);
      var cuenta = await queryDatabase("select count(*) from Transactions where token='"+receivedPOST.transactionToken+"';")
      var dinero = await queryDatabase("SELECT balance FROM User WHERE phone='"+origin_id[0].phone+"';");
      console.log(dinero);
      if(receivedPOST.transactionToken.length==0){
        result = {status:"ERROR",message:"Error token buit"}
      }
      else if(cuenta>1){
        result = {status:"ERROR",message:"Transaccio repetida"}
      }
      else if(receivedPOST.quantity>dinero[0].balance){
        result = {status:"ERROR",message:"Diners insuficients"}
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
        var destino=null
        today = mm+'/'+dd+'/'+yyyy+" "+horesMinuts;
          if(receivedPOST.accepted=="true"){
            try{
              await queryDatabase("UPDATE Transactions SET accepted=true, origin='"+origin_id[0].phone+"', TimeAccept=STR_TO_DATE('"+today+"','%m/%d/%Y %H:%i:%s') WHERE token='"+receivedPOST.transactionToken+"';");
              await queryDatabase("UPDATE User SET balance=balance-"+receivedPOST.quantity+" WHERE phone='"+origin_id[0].phone+"';");
              destino = await queryDatabase("select destiny from Transactions where token='"+receivedPOST.transactionToken+"';")
              console.log(destino);
              await queryDatabase("UPDATE User SET balance=balance+"+receivedPOST.quantity+" WHERE phone='"+destino[0].destiny+"';")
              await queryDatabase("commit;")
            }
            catch(error){
              await queryDatabase("rollback;")
            }
            var response="Acceptada"
          }
          else{
            await queryDatabase("UPDATE Transactions SET accepted=false, origin='"+origin_id[0].phone+"',TimeAccept=STR_TO_DATE('"+today+"','%m/%d/%Y %H:%i:%s') WHERE token='"+receivedPOST.transactionToken+"';");
            var response="Refusada"
          }
          console.log(destino);
          var resultado = await queryDatabase("select * from Transactions where token='"+receivedPOST.transactionToken+"';")
          await queryDatabase("SET autocommit=1;") 
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
      host: process.env.MYSQLHOST || "containers-us-west-61.railway.app",
      port: process.env.MYSQLPORT || 7292,
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD || "OXngQGIlgaVy1NJ5gFcI",
      database: process.env.MYSQLDATABASE || "railway"
    });

    connection.query(query, (error, results) => { 
      if (error) reject(error);
      resolve(results)
    });
     
    connection.end();
  })
}