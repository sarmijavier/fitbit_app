import clock from "clock"
import document from "document"
import { user } from "user-profile"
import { outbox } from "file-transfer";
import * as fs from "fs";
import * as messaging from "messaging";
import { me as appbit } from "appbit";
import { today } from "user-activity";
import { HeartRateSensor } from "heart-rate";
import * as dayToday from "../date/date"
import {  listDirSync, unlinkSync, writeFileSync, statSync } from "fs"
import { me } from "appbit";


const myClock = document.getElementById("myClock")
const countdown = document.getElementById('countdown')
const wifi = document.getElementById('wifi')
const nowifi = document.getElementById('nowifi')
const sinchronization = document.getElementById('sinchronization')
const nosinchronization = document.getElementById('nosinchronization')
const steps = document.getElementById('steps')
const calories = document.getElementById('calories')
const heartRate = document.getElementById('heartRate')
const date = document.getElementById('date')

nowifi.style.visibility = 'hidden'
wifi.style.visibility = 'hidden'
sinchronization.style.visibility = 'hidden'
nosinchronization.style.visibility = 'hidden'


const dirIter
var contStart = 0
const listDir = listDirSync("/private/data");
while((dirIter = listDir.next()) && !dirIter.done) {
  if(dirIter.value === 'json.txt'){
    // means the json.txt, and that can't happen
  }else {
    contStart++ // IN CASE THE APP CLOSES AND THERE ARE FILES THAT THEY CAN'T SEND YET
  }
  console.log(dirIter.value)
}


var timer = 20 * 1
var min = 5
var sec = 0
var storeNumber = contStart //COUNT
var storeDataInternet = 0 // 1 internet - 0 no internet
var storeDataSynchronization = 0 // 1 synchronization - 0 no synchronization


startCountdown()
startClock()


function startClock(){
  let today =  new Date()
  let day = today.getDay()
  let year = today.getFullYear()
  let month = today.getMonth()
  date.text = `${dayToday.day(day)}, ${today.getDate()} ${dayToday.month(month)} ${year}`

  clock.granularity = 'seconds'; // seconds, minutes, hours
  clock.ontick = function(evt) {
  myClock.text = ("0" + evt.date.getHours()).slice(-2) + ":" +
                        ("0" + evt.date.getMinutes()).slice(-2)
    iniazilitationConfiguration()
  }    
}

function startCountdown() {
  min = parseInt(timer/60)
  sec = parseInt(timer%60)  
  if(timer < 1){
    
    internetConnection() // is there internet or it can send messages
    tryToSendAllInformation()
    
    timer = 60 * 5
    min = 5
    sec = 0
    takeData()
  }
  countdown.text = `${min}: ${sec}`
  timer--
  setTimeout(function() {
             startCountdown()
             }, 1000)
}

function tryToSendAllInformation() {
  if(storeNumber > 0 && storeDataInternet === 1 && storeDataSynchronization === 1){ //send information stored
    sendDataStore()
  }
}

function iniazilitationConfiguration() {
  if (HeartRateSensor) {
     const hrm = new HeartRateSensor();
     hrm.addEventListener("reading", () => {
     heartRate.text = hrm.heartRate
     hrm.stop()
     });
     hrm.start();
  } else {
     console.log("This device does NOT have a HeartRateSensor!");
  }
  
  if (appbit.permissions.granted("access_activity")) {
      steps.text =  today.adjusted.steps
      calories.text = today.adjusted.calories
  }  
}  

function internetConnection() {
 
  let internet = "INTERNET";
  writeFileSync("internetTest.txt", internet, "ascii");
    outbox
  .enqueueFile('internetTest.txt')
  .then((ft) => {
     console.log(`Transfer of ${ft.name} successfully queued.`);
  })
  .catch((error) => {
     console.log(`Failed to schedule transfer: ${error}`);
  })  
  
  unlinkSync('internetTest.txt')
  sychronizationConnection() // are we connect with companion or no
}


function sychronizationConnection() {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN){
    nosinchronization.style.visibility = 'hidden'
    sinchronization.style.visibility = 'visible'
    storeDataSynchronization = 1 //sinchronization

  }
  if (messaging.peerSocket.readyState === messaging.peerSocket.CLOSED) {
  // Display error message
    sinchronization.style.visibility = 'hidden'
    nosinchronization.style.visibility = 'visible'
    wifi.style.visibility = 'hidden'
    nowifi.style.visibility = 'visible'
    storeDataSynchronization = 0 //no synchronization
  }
}



function takeData() {
  let fecha = new Date()
  let today = `${fecha.getHours()}: ${fecha.getMinutes()}`
  console.log(today)
  let person = {
    edad: age(),
    genero: gender(),
    altura: height(),
    peso: weight(),
    hora: today
  }
  //console.log(JSON.stringify(person))
  saveData(person)
}


function saveData(json_data) {
  if (storeDataInternet === 1 && storeDataSynchronization === 1){
    fs.writeFileSync('json.txt', json_data, "json");
    sendData()  
  }else {
    fs.writeFileSync(`json${storeNumber}.txt`, json_data, "json");
    storeNumber++
  }
  

}


function sendData(){ //if there's a error with internet companion couldn't send anything, return 1
    outbox
    .enqueueFile('json.txt')
    .then((ft) => {
       console.log(`Transfer of ${ft.name} successfully queued.`);
    })
    .catch((error) => {
       console.log(`Failed to schedule transfer: ${error}`);
    }) 
    unlinkSync('json.txt')
}

function sendDataStore() {
  for( let i = 0; i<storeNumber; i++){
    outbox
      .enqueueFile(`json${i}.txt`)
      .then((ft) => {
        console.log(`Transfer of ${ft.name} successfully queued.`);
      })
      .catch((error) => {
         console.log(`Failed to schedule transfer: ${error}`);
      })
   }
   deleteDataStore()
}

function deleteDataStore() {
  for(let i = 0 ; i < storeNumber ; i++){
      unlinkSync(`json${i}.txt`) 
  }
  storeNumber = 0
}


messaging.peerSocket.onmessage = function(evt) {
     verifyConnection(evt.data)
}


function verifyConnection(internetConnection) {
  if(internetConnection === '1'){ // internet
    nowifi.style.visibility = 'hidden'
    wifi.style.visibility = 'visible'
    storeDataInternet = 1
  }else {
    wifi.style.visibility = 'hidden'
    nowifi.style.visibility = 'visible'  
    storeDataInternet = 0 //no internet
  }
}

var age = () => user.age
var gender = () => user.gender
var height = () => user.height
var weight = () => user.weight
