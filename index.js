'use strict';


var firebase = require('firebase').initializeApp({
	serviceAccount : "./firebaseService.json" , 
	databaseURL : "https://feed-72bdb.firebaseio.com" 
});

const bodyParser = require('body-parser')
const config = require('config')
const express = require('express')
const http = require('http')
const request = require('request')

var ref = firebase.database().ref()
var notificationRef = firebase.database().ref().child('notification')
var testRef = firebase.database().ref().child('test')


var app = express();

app.set('port', process.env.PORT || 5555);
app.use(bodyParser.json())

const VALIDATION_TOKEN = "FACEBOOKAPI"

app.get('/FACEBOOKAPI', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.")
    res.sendStatus(403);
  }
});

app.post('/FACEBOOKAPI', function(req , res) {

	var value = req.body.entry[0]
	testRef.push(value) 


});


app.get('/test', function(req, res) {
	console.log('test') 
	res.sendStatus(200);
})

app.listen(app.get('port'), function() {
  console.log('Bot is running on port ', app.get('port'));
});