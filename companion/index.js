import { inbox } from "file-transfer";
import { me } from "companion";
import * as messaging from "messaging";
import { settingsStorage } from "settings";


messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}



async function processAllFiles() {
  let file;
  while ((file = await inbox.pop())) {
    const payload = await file.text();
    console.log(`file contents: ${payload}`);
    sendData(payload)
  }     
}

inbox.addEventListener("newfile", processAllFiles);
processAllFiles()

function sendData(message) {
  console.log(`la información es ${message}`)
  if(message === 'INTERNET'){
    restoreSettings();
    //try internet connection
  }else {
    //send information
    saveInformation(message)
  }
}



function getData(accessToken)  {
  let date = new Date();
  let todayDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; //YYYY-MM-DD
 
  fetch('path', {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  })
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      messaging.peerSocket.send('1');
    }
  })
  .catch(err => {
    console.log('[FETCH]: ' + err);
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
       messaging.peerSocket.send('0');
    }
  })
}

// A user changes Settings
settingsStorage.onchange = evt => {
  if (evt.key === "oauth") {
    // Settings page sent us an oAuth token
    let data = JSON.parse(evt.newValue);
    getData(data.access_token) ;
  }
};

// Restore previously saved settings and send to the device
function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {
    let key = settingsStorage.key(index);
    if (key && key === "oauth") {
      // We already have an oauth token
      let data = JSON.parse(settingsStorage.getItem(key))
      getData(data.access_token);
    }
  }
}

async function saveInformation(message) {
  try {
    let response = await fetch('path', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(message)
    });
    let result = await response.json();
    console.log(result.message);
  }catch(err) {
    console.log(`ocurrio un error en el punto donde se enviarón los datos:  ${err}`)  
  }
}

