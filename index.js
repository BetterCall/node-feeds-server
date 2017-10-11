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

	var data = req.body.entry[0]
	testRef.push(data)

	getUser("facebook" , data.uid)

	res.sendStatus(200)


});


app.get('/test', function(req, res) {
	console.log('test') 
	res.sendStatus(200);
})

app.listen(app.get('port'), function() {
  console.log('Bot is running on port ', app.get('port'));
});


function getUser( media , id ) {

	// Social database reference
	var socialRef = firebase.database().ref().child('social').child(media).child(id) 
	// Get user feeds id with media id 
	socialRef.once('value').then(function(snapshot) {
		// get snapshot key
		var userId = Object.keys(snapshot.val())[0];
		sendNotification(userId) 
		// Current user database reference
		var currentUserRef = firebase.database().ref().child('users').child(userId)
		currentUserRef.once('value').then(function (snapshot){
			testRef.push(snapshot.val())
		});
	});
} 


function sendNotification(userId) {
	// followers database reference
	var followersRef = firebase.database().ref().child('followers').child(userId)
	followersRef.once('value').then(function(snapshot) {
		// Followers id
		var followersId = Object.keys(snapshot.val());
		// foreach follower create notification
		followersId.forEach(function(followerId) {
			notificationRef.child(followerId).push(snapshot) 
		});
			
	}); 

}


function createNotification(data , media) {

	



}







