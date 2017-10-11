'use strict';


var firebase = require('firebase').initializeApp({
	serviceAccount : "./firebaseService.json" , 
	databaseURL : "https://feed-72bdb.firebaseio.com" 
});

const bodyParser 	= require('body-parser')
const config 		= require('config')
const express		= require('express')
const http 			= require('http')
const request 		= require('request')

// Database References
var ref 				= firebase.database().ref()
var feedRef				= firebase.database().ref().child('feed')

var usersRef 			= firebase.database().ref().child('users')
var postsRef 			= firebase.database().ref().child('posts')
var userPostRef			= firebase.database().ref().child('user_post')

var socialRef 			= firebase.database().ref().child('social') 
var userFollowersRef	= firebase.database().ref().child('followers')

var activitiesRef 	    = firebase.database().ref().child('activities')
var testRef 			= firebase.database().ref().child('test')


var app = express();

app.set('port', process.env.PORT || 5555);
app.use(bodyParser.json())

const VALIDATION_TOKEN = "FACEBOOKAPI"

// Confirmation route 
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


// Facebook webhook notification
app.post('/FACEBOOKAPI', function(req , res) {

	var data = req.body.entry[0]
	testRef.push(data)

	let subscription = data.field

	// get feeds user id 
	var feedsUserId = getUser("facebook" , data.uid)
	// create news from facebook data
	var postKey = createNews(feedsUserId , "facebook" , subscription) 
	// create notification from facebook data
	var activityKey  = createNotification(userId , "facebook", postKey) 
	// share news + push notification 
	shareWithFollower(feedsUserId, postKey , activityKey)

	res.sendStatus(200)


});


// serve
app.listen(app.get('port'), function() {
  console.log('Bot is running on port ', app.get('port'));
});


function getUser( media , id ) {

	// Social database reference
	var userSocialRef = socialRef.child('social').child(media).child(id) 
	// Get user feeds id with media id 
	userSocialRef.once('value').then(function(snapshot) {
		// get snapshot key
		return Object.keys(snapshot.val())[0];
		//sendNotification(userId) 
		// Current user database reference
		
			
		/**
			var currentUserRef = firebase.database().ref().child('users').child(userId)
			currentUserRef.once('value').then(function (snapshot){
				testRef.push(snapshot.val())
			});

		**/
	});

} 


function shareWithFollower(feedsUserId, newsKey , notificationKey) {

	// get followers user list 
	var userFollowersRef = followersRef.child(userId)

	userFollowersRef.once('value').then(function(snapshot) {
		// Followers id list
		var followersId = Object.keys(snapshot.val());
		followersId.forEach(function(followerId) {
			
			feedRef.child(followerId).child(newsKey).set(true)
			activitiesRef.child(followerId).child(notificationKey).set(true) 
			
		})
	})

}



function sendNotification(userId) {
	// followers database reference
	var userFollowersRef = followersRef.child(userId)
	userFollowersRef.once('value').then(function(snapshot) {
		// Followers id
		var followersId = Object.keys(snapshot.val());
		// foreach follower create notification
		followersId.forEach(function(followerId) {
			var postData = {
				from: userId,
				media: 'facebook',
				type: 'feed',
				objectId: '-Kw5iOWPcNtuDV9HL8KZ',

			};
			activitiesRef.child(followerId).push(postData) 
		});
			
	}); 

}

function createNews(userId , media , subscription ) {
	var data = {
		userid : userId , 
		media : media , 
		subscription : subscription  
	}

	var keyRef = postsRef.push(data)
	userPostRef.child(userId).child(keyRef.key).set(true)
	return key.key
}


function createNotification(userId , media , objectId ) {

	var data = {
    	from: userId ,
	    media: media,
	    type: 'feed',
	    objectId: objectId,
	    
	};
	// create push data
	var key = activitiesRef.child(followerId).push(data)

  return key.key



}







