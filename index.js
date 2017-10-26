'use strict';


var firebase = require('firebase').initializeApp({
	serviceAccount : "./firebaseService.json" , 
	databaseURL : "https://feed-72bdb.firebaseio.com" 
});

var ig = require('instagram-node').instagram();
 
// Every call to `ig.use()` overrides the `client_id/client_secret` 
// or `access_token` previously entered if they exist. 

ig.use({ client_id: 'd3a872612be54fec9231d181d68035b6',
         client_secret: '028422d9c50e4b17aa638af309e8b1f6' });


const bodyParser 	= require('body-parser')
const config 		= require('config')
const express		= require('express')
const http 			= require('http')
const request 		= require('request')
const EventEmitter  = require('events').EventEmitter

// Database References
var ref 				= firebase.database().ref()
var feedRef				= firebase.database().ref().child('feed')

var usersRef 			= firebase.database().ref().child('users')
var postsRef 			= firebase.database().ref().child('posts')
var userPostRef			= firebase.database().ref().child('user_post')

var socialRef 			= firebase.database().ref().child('social') 
var followersRef	= firebase.database().ref().child('followers')

var activitiesRef 	    = firebase.database().ref().child('activities')
var testRef 			= firebase.database().ref().child('test')

var user = new EventEmitter() 
var post = new EventEmitter()
var activity = new EventEmitter()

user.on('found' , function(id){
	console.log('ON USER : ' + id)
	createPost(id , "facebook" , "status") 

})

post.on('created' , function(userId , network , postId ){
	createActivity(userId , network , postId)
})

activity.on('created' , function(userId , activity , postId) {
	shareWithFollower(userId, activity , postId)
})


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

	let subscription = "status" // data.field
	console.log(data.uid)
	// get feeds user id 
	var feedsUserId = getUser("facebook" , data.uid)
	//console.log ('FEEDS USER ID : ' , feedsUserId)
 	// create news from facebook data
	//var postKey = 
	// create notification from facebook data
	//var activityKey  = createNotification(feedsUserId , "facebook", postKey) 
	// share news + push notification 
	//

	res.sendStatus(200)


});


// serve
app.listen(app.get('port'), function() {
  console.log('Bot is running on port ', app.get('port'));
});


function getUser( network , id ) {

	console.log('network : ' , network)
	console.log('ID : ' , id )

	// Social database reference
	var userSocialRef = socialRef.child(network).child(id) 
	// Get user feeds id with network id
	userSocialRef.once('value').then(function(snapshot) {
		// get snapshot key
		
		console.log(  Object.keys(snapshot.val())[0] )
		user.emit('found' , Object.keys(snapshot.val())[0] )
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


function shareWithFollower(userId, activity , postId) {

console.log(' POST ID : ' , postId )
	// add post to user feed
	feedRef.child(userId).child(postId).set(true)
	userPostRef.child(userId).child(postId).set(true)

	// get followers user list 
	var userFollowersRef = followersRef.child(userId)

	userFollowersRef.once('value').then(function(snapshot) {
		// Followers id list
		var followersId = Object.keys(snapshot.val());
		console.log('FOLLOWERS ID : ' , followersId)
		followersId.forEach(function(followerId) {
		console.log('FOLLOWERS ID : ' , followerId)

			feedRef.child(followerId).child(postId).set(true)
			activitiesRef.child(followerId).push(activity)
			
		})
	})

}



function createPost(userId , network , subscription ) {

	var data = {
		uid : userId , 
		network : network , 
		subscription : subscription  
	}

	var keyRef = postsRef.push(data)
	userPostRef.child(userId).child(keyRef.key).set(true)

	post.emit('created', userId , network , keyRef.key )
	
}


function createActivity(userId , network , objectId ) {

	var data = {
    	from: userId ,
	    network: network,
	    type: 'feed',
	    objectId: objectId,
	    
	};
	// create push data
	var keyRef = activitiesRef.child(userId).push(data)

	activity.emit('created', userId , data , objectId )

}







