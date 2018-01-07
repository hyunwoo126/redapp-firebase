const express = require('express');
const nodemailer = require('nodemailer');
const formidable = require('formidable');
const bodyParser = require('body-parser');

//firebase
const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

//redapp functions
const appStores = require('./redapp/appStores');
const styleEmail = require('./redapp/styleEmail');
const email_redapp = {
    info: 'info@redapp.co',
    from: 'info@redapp.co',
    all: 'sky@redapp.co, jason@redapp.co, ray@redapp.co',
    sky: 'sky@redapp.co', ray: 'ray@redapp.co', jason: 'jason@redapp.co',
}

exports.setupNewUser = functions.auth.user().onCreate(event => {
	db.collection("users").doc(event.data.uid).set({
		admin: false,
		email: event.data.email,
	})
	.then(function() {
		console.log("Document successfully written!");
	})
	.catch(function(error) {
		console.error("Error writing document: ", error);
	});
});

const app = express();
exports.app = functions.https.onRequest(app);


app.set('view engine', 'ejs');
app.get('/appstores', function(req, res) {

	// db.collection('users').get()
    // .then((snapshot) => {
    //     snapshot.forEach((doc) => {
    //         console.log(doc.id, '=>', doc.data());
    //     });
    // })
    // .catch((err) => {
    //     console.log('Error getting documents', err);
	// });
	


	res.render('pages/comingsoon');


});


app.get('/', function(req, res) {	
	res.render('pages/home');
});
app.get('/mail', function(req, res) {
	res.render('mail', {
		email_template: styleEmail('', 'body', {name: '{{sig_name}}', email: '{{sig_email}}'}), //vuejs
	});
});
app.post('/mail', function(req,res){
	var transporter = nodemailer.createTransport({
		service: "Gmail",
		auth: {
			user: req.body.from,
			pass: req.body.pass_gmail,
		}
	});

	transporter.sendMail({
		to: req.body.to,
		cc: req.body.cc,
		bcc: req.body.bcc,
		subject: req.body.subject,
		html: styleEmail(req.body.body, false, {name: req.body.sig_name, email: req.body.sig_email}),
	  }, function(error, info){
		if(error){
			res.send({
				error: true,
				msg: error.response,
			});
		} else {
			res.send({
				error: false,
				msg: info.response,
			});
		}
	});
});

app.get('/dashboard', function(req, res) {
	res.render('dashboard');
});
app.post('/dashboard', function(req, res){
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');


	var email = req.body.email;
	var password = 'redapp123';
	admin.auth().createUser({
		email: email,
		password: password,
	})
	.then(function(userRecord) {
		// See the UserRecord reference doc for the contents of userRecord.
		console.log("Successfully created new user:", userRecord.uid);
		res.send({
			email: email,
			password: password,
			firebase: userRecord,
		});
	})
	.catch(function(error) {
		console.log("Error creating new user:", error);
		res.send({
			error: true,
			message: error,
		});
	});
});






app.get('/pages/:name', function(req, res) {
	res.render('pages/'+req.params.name);
});


//404 should be at the bottom after all the other routes
app.get(/.*/, function (req, res, next) {
    res.render('pages/404');
});




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(function (req, res, next) {
	//res.setHeader('Access-Control-Allow-Origin', '*');
	//res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	//res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	//res.setHeader('Access-Control-Allow-Credentials', true);

   next();
});
//app.use(express.static('../public'));

app.get('/ping', (request, response) => {
    response.send("pong");
});
app.post('/ping', (request, response) => {
    console.log('/ping POST received');
    response.send("pong");
});


var transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: "sky@redapp.co", // service is detected from the username
		pass: "gusdn126"
	}
});

//testing purpose
app.get('/email', function(req, res) {
	var email_temp = {
		from: 'info@redapp.co',
		to: 'info@redapp.co',
		subject: '[redapp.co] TEST EMAIL '+Date.now(),
	};
	email_temp.html = styleEmail(
		'Your app has been successfully submitted to Redapp!<br>\
		Please contact jason@redapp.co if you have any questions about the status of your app in China.<br>\
		<br>\
		<br>\
		Best of luck,<br>\
		Redapp Team');

	transporter.sendMail(email_temp, function(error, info){
		if(error){
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});

	res.send('email sent');
});


app.post('/api/scrape', function(req, res){
	if(req.body.store && req.body.appName && typeof appStores[req.body.store] == 'function'){
		appStores[req.body.store](req.body.appName, res);
	} else {
		res.send('error');
	}
});



app.post('/api/reclaim', function(req, res){
    var mail_reclaim = {
        from: email_redapp.from,
        to: email_redapp.all,
        subject: '[redapp.co] reclaim request!',
        html: styleEmail({
            appName: req.body.appName,
            email: req.body.email,
            comments: req.body.comments,
        }),
    };

	transporter.sendMail(mail_reclaim, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	}); 
	res.send('ok');
});



app.post('/api/cta', function(req, res){
    var mail_cta = {
        from: email_redapp.from,
        to: email_redapp.all,
        subject: '[redapp.co] A potential new client! (from landing page contact form)',
        html: styleEmail({
            email: req.body.email,
            comments: req.body.comments,
        }),
    };               

    transporter.sendMail(mail_cta, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent (cta): ' + info.response);
        }
    }); 
    res.send('success');
});



var mail_appsubmit = {
	from: email_redapp.from,
	to: email_redapp.all,
	subject: '[redapp.co] App Submission Form',
	html: '',
	attachments: [],
  };

  var mail_appsubmit_apk = {
	from: email_redapp.from,
	to: email_redapp.all,
	subject: mail_appsubmit.subject+' (APK attachment)',
	text: 'APK file attached',
	attachments: [],
  };
var mail_appsubmit_confirm = {
	from: email_redapp.from,
	to: '',
	subject: '[redapp.co] Thank you for submitting your app to Redapp.',
};
mail_appsubmit_confirm.html = styleEmail(
	'Your app has been successfully submitted to Redapp!<br>\
	Please contact jason@redapp.co if you have any questions about the status of your app in China.<br>\
	<br>\
	<br>\
	Best of luck,<br>\
	Redapp Team');
var trackEmail = {};


app.post('/api/appsubmit', function(req, res){
    console.log('----- /appsubmit POST request received -----');
	// create an incoming form object
	var form = new formidable.IncomingForm();

	//clear attachments
	mail_appsubmit.attachments = [];

	//store string data key value pair here
	var textData = {};

	// specify that we want to allow the user to upload multiple files in a single request
	form.multiples = true;

	// store all uploads in the /uploads directory
	//form.uploadDir = path.join(__dirname, '/uploads');

	// every time a file has been uploaded successfully,
	form.on('file', function(field, file){
		if(field == 'apk'){
			mail_appsubmit_apk.attachments = [{
				filename: file.name,
				path: file.path,
			}];
		} else {
			mail_appsubmit.attachments.push({
				filename: file.name,
				path: file.path,
			});
		}

		// rename it to it's orignal name
		//fs.rename(file.path, path.join(form.uploadDir, file.name));
		// mail_appsubmit.attachments = [
		// 	{   // utf-8 string as an attachment
		// 		filename: 'text1.txt',
		// 		content: 'hello world!'
		// 	},
		// 	{   // binary buffer as an attachment
		// 		filename: 'text2.txt',
		// 		content: new Buffer('hello world!','utf-8')
		// 	},
		// 	{   // file on disk as an attachment
		// 		filename: 'text3.txt',
		// 		path: file.path, // stream this file
		// 	},
		// 	{   // filename and content type is derived from path
		// 		path: file.path,
		// 	},
		// ];
	});

	//grab text data
	form.on('field', function(name, value){
		textData[name] = value;
	});
	
	// log any errors that occur
	form.on('error', function(err) {
		console.log('An error has occured: \n' + err);
	});
	
	// once all the files have been uploaded, send a response to the client
	form.on('end', function(){
		mail_appsubmit_confirm.to = textData.email;
		trackEmail[textData.email] = 0;
		mail_appsubmit.html = styleEmail(textData);
		mail_appsubmit.subject = '[redapp.co] App Submission Form ('+textData.email+')';
		mail_appsubmit_apk.subject = mail_appsubmit.subject+' - APK attachment';

		transporter.sendMail(mail_appsubmit, function(error, info){
			if(error){
				console.log(error);
				delete trackEmail[textData.email];
			} else {
				console.log('Email sent (info): ' + info.response);
				if(typeof trackEmail[textData.email] == 'number'){
					if(trackEmail[textData.email] == 0){
						trackEmail[textData.email]++;
					} else {
						send_appsubmitConfirm();
						delete trackEmail[textData.email];
					}
				}
			}
		});
		//send email with APK in a separate email
		transporter.sendMail(mail_appsubmit_apk, function(error, info){
			if(error){
				console.log(error);
				delete trackEmail[textData.email];
			} else {
				console.log('Email sent (apk): ' + info.response);
				if(typeof trackEmail[textData.email] == 'number'){
					if(trackEmail[textData.email] == 0){
						trackEmail[textData.email]++;
					} else {
						send_appsubmitConfirm();
						delete trackEmail[textData.email];
					}
				}
			}
		});

		res.end('success');
	});
	
	// parse the incoming request containing the form data
	form.parse(req);
	
});

//send confirmation email to client
var send_appsubmitConfirm = function(){
	transporter.sendMail(mail_appsubmit_confirm, function(error, info){
		if(error){
			console.log(error);
		} else {
			console.log('App Submission Form confirmation email sent to client: ' + info.response);
		}
	});
}

