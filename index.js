// By Andreno

// Loading packages
// Express
const app = require('express')();
// Http
const http = require('http').Server(app);
// Socket.io
const io = require('socket.io')(http);

// Port, on which the program will run
const PORT = 3000;

// Host, on which the programm will run
const HOST = 'localhost';

// Users, which on the chat
var connections = [];

// Function for convenient display of messages
function _ (text) {
	console.log(`[SERVER] ${text}`);
};


// If the user goes to the home page
app.get('/', (request, responce) => {
	// We send him main site file
	responce.sendFile(__dirname + '/public/index.html');
});

// If the user goes to the page about the project
app.get('/about', (request, responce) => {
	// We send him 'about.html' file
	responce.sendFile(__dirname + '/public/about.html');
});


// If new user was connected to chat
io.on('connection', socket => {
	// We add him to  connections
	connections.push(socket);
	_('New user connected to chat!');
	// Sending a new user online on the site
	io.emit('updateOnline', {count: connections.length});
	// If user was disconnected
	socket.on('disconnect', () => {
		// We deleting him in connections
		connections.splice(connections.indexOf(socket), 1);
		_('User disconnected.');
		// Sending a new one online to users
		io.emit('updateOnline', {count: connections.length});
		// If user registered on the site
		if (socket.profile) {
			// We send users about the event of a player's departure,
			// advanced in the parameters of his profile
			io.emit('userLeave', socket.profile);
		};
	});
	// If user send message to chat
	socket.on('sendMessage', msg => {
		if (!socket.profile) {
			_('Error: Unable to get profile from user');
			socket.emit('Error', {code: 4, text: 'Unable to get your profile. Plese, reload site.'})
			return;
		}
		_(`Received: sendMessage from ${socket.profile.name}.`);
		try {
			// We send this message to users
			io.emit('newMessage', {...socket.profile, ...msg});		
		} catch (e) { // If an error occurs
			// We send the user an error with its text
			socket.emit('Error', {code: 1, text: 'Unable to download message text'});
		};
	});
	// If the user sent a registration message (with a parameter of his name)
	socket.on('register', uName => { // uName - username
		_('Received: register.');
		if (uName.length > 12) { // If his name is more than 12 characters
			// We send him an error
			socket.emit('Error', {code: 2, text: 'The name cannot be longer than 12 characters.'});
			return; // Return is needed to terminate the function,
					// otherwise it will continue to work and the
					// user will be registered
		} else if (uName.length < 3) { // If his name is short than 3 characters
			socket.emit('Error', {code: 3, text: 'The name cannot be shorter than 3 characters.'}); // We send him an error
			return; // The same as with the previous return
		};
		// If all is well, then the function will continue to work.
		// Generating random username colors
		// Creating an array of colors
		let colors = ['FF0000', '00FF00', '0000FF', '7FE5F0', '696969', 'FF80ED', '660066']; //red, green, blue, light blue, grey, pink, purple
		
		// We get a random color
		let uColor = colors[Math.floor(Math.random() * colors.length)];
		// We send to all users that a new user has entered the conversation.
		io.emit('newUser', {name: uName, color: uColor});
		// We assign a profile to its socket
		socket.profile = {name: uName, color: uColor};
		// We send the user that he has successfully registered,
		// and his profile
		socket.emit('succesRegistration', socket.profile);
		_(`Sucess registration. Name: ${socket.profile.name}.`);
	});
});


//Start our server
http.listen(PORT, HOST, () => {
	_(`The chat is running on http://${HOST}:${PORT}. Go to this link.`);
});