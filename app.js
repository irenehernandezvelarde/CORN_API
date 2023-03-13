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
      result = { status: "OK", result: resultado}
    }
    else if (receivedPOST.type == "get_profile_desktop") {
      var resultado=await queryDatabase("SELECT * from User where phone='"+receivedPOST.phone+"';");
      result = { status: "OK", result: resultado}
    }
    else if (receivedPOST.type == "get_transactions") {
      var transaction=await queryDatabase("SELECT * from Transactions where destiny='"+receivedPOST.phone+"' OR origin='"+receivedPOST.phone+"';");
      result = { status: "OK", transactions:transaction}
    }
    else if (receivedPOST.type == "get_transactions_app") {
      var phone = await queryDatabase("SELECT phone from User where token='"+receivedPOST.token+"';");
      var transaction=await queryDatabase("SELECT * from Transactions where destiny='"+phone[0].phone+"' OR origin='"+phone[0].phone+"';");
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
    else if(receivedPOST.type=="filtrar"){
      if(receivedPOST.tipusFiltre=="estat"){
        var resultado=await queryDatabase("SELECT * from User where state='"+receivedPOST.filtre+"';");
        result = { status: "OK", result: resultado}
      }
      else if(receivedPOST.tipusFiltre=="saldos"){
          var resultado=await queryDatabase("SELECT * from User where balance>="+receivedPOST.min+" AND balance <= "+receivedPOST.max+";");
          result = { status: "OK", result: resultado}
      }
      else if(receivedPOST.tipusFiltre=="nTransaccions"){
          var query1 = await queryDatabase("SELECT phone FROM User;");
          const saveUsers=[];
          for (var i=0; i< query1.length; i++){
            console.log(query1[i].phone);
            var query2 = await queryDatabase("SELECT count(*) as count FROM Transactions where origin='"+query1[i].phone+"' GROUP BY origin;");
            var query3 = await queryDatabase("SELECT count(*) as count FROM Transactions where destiny='"+query1[i].phone+"' GROUP BY destiny;");
            console.log(query2);
            if(query2[0]!=null && query3[0]!=null){
              if((query2[0].count+query3[0].count)>=receivedPOST.min&&(query2[0].count+query3[0].count)<=receivedPOST.max){
                saveUsers.push(query1[i].phone)
              }
            }
            else if(query2[0]!=null&& query3[0]==null){
              if((query2[0].count)>=receivedPOST.min&&(query2[0].count)<=receivedPOST.max){
                saveUsers.push(query1[i].phone)
              }
            }
            else if(query2[0]==null&& query3[0]!=null){
              if((query3[0].count)>=receivedPOST.min&&(query3[0].count)<=receivedPOST.max){
                saveUsers.push(query1[i].phone)
              }
            }
            else if(query2[0]==null&& query3[0]==null){
              if(0>=receivedPOST.min&&0<=receivedPOST.max){
                saveUsers.push(query1[i].phone)
              }
            }
            console.log(saveUsers);
          }
          var resultado= await queryDatabase("SELECT * FROM User WHERE phone in ("+saveUsers+");");
          result = { status: "OK", result: resultado}
      }
    }
    else if(receivedPOST.type=="send_id"){
      // Rebre el camp String amb dades binaries del client
      console.log("Entra ");
      const fileBuffer = Buffer.from(receivedPOST.photo, 'base64');
      //const fileBuffer2 = Buffer.from(receivedPOST.photo2, 'base64');
      if(receivedPOST.foto=="front"){
        await queryDatabase("UPDATE User SET frontImage = '"+receivedPOST.name+"' WHERE token= '"+receivedPOST.token+"';");
      }
      if(receivedPOST.foto=="back"){
        await queryDatabase("UPDATE User SET backImage = '"+receivedPOST.name+"' WHERE token= '"+receivedPOST.token+"';");
      }
      // Guardar les dades binaries en un arxiu (a la carpeta ‘private’ amb el nom original)
      const path = "./private"
      await fs.mkdir(path, { recursive: true }) // Crea el directori si no existeix
      await fs.writeFile(`${path}/${receivedPOST.name}`, fileBuffer)
      var files = await fs.readdir("./private")
      console.log(files);
      // Informar que tot ha anat bé
      await wait(1500)
      result = { status: "OK", name: receivedPOST.name }
    }
    else if(receivedPOST.type=="getImage"){
      var hasAccess = true
        // TODO : Comprovar aquí que l'usuari té permisos per accedir al fitxer

      if (hasAccess) {
    // Llegir l’arxiu que demana l’usuari i tranformar-lo a base64
        var name = await queryDatabase("SELECT frontImage,backImage FROM User where phone='"+receivedPOST.phone+"';");
        console.log(name);
        var base64 = "null"
        var base65 = "null"
        if(name[0].frontImage!=null){
          base64 = await fs.readFile(`./private/${name[0].frontImage}`, { encoding: 'base64'})
        }
        if(name[0].backImage!=null){
          base65 = await fs.readFile(`./private/${name[0].backImage}`, { encoding: 'base64'})
        }
        // Posar-lo com a camp de text en l’objecte que s’envia al client
        result = { status: "OK", name: name, foto1: base64,foto2: base65 }
      } else {
        result = { status: "KO", result: "Acces denied" }
      }

    }
    else if(receivedPOST.type=="modifyState"){
      if(receivedPOST.state=="Acceptat"){
        await queryDatabase("UPDATE User SET state='Acceptat' WHERE phone='"+receivedPOST.phone+"';");
        result={status: "OK",result:"Changed_state"}
      }
      else if(receivedPOST.state=="Rebutjat"){
        await queryDatabase("UPDATE User SET state='Rebutjat' WHERE phone='"+receivedPOST.phone+"';");
        result={status: "OK",result:"Changed_state"}
      }
      else if(receivedPOST.state=="No_verificat"){
        await queryDatabase("UPDATE User SET state='No_verificat' WHERE phone='"+receivedPOST.phone+"';");
        result={status: "OK",result:"Changed_state"}
      }
      else if(receivedPOST.state=="Per_verificar"){
        await queryDatabase("UPDATE User SET state='Per_verificar' WHERE phone='"+receivedPOST.phone+"';");
        result={status: "OK",result:"Changed_state"}
      }
      else{
        result={status: "ERROR",result:"Invalid state"}
      }
    }
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}



// Run WebSocket server
const WebSocket = require('ws')
const { response, query } = require('express')
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
      host: process.env.MYSQLHOST || "containers-us-west-81.railway.app",
      port: process.env.MYSQLPORT || 6542,
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD || "ZvP6TkYB4xZHY31vcYxp",
      database: process.env.MYSQLDATABASE || "railway"
    });

    connection.query(query, (error, results) => { 
      if (error) reject(error);
      resolve(results)
    });
     
    connection.end();
  })
}