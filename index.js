//include required modules
const NodeCache = require("node-cache");
const cache = new NodeCache({
    stdTTL: 60 * 60 * 3,
    deleteOnExpire: true
});

const jwt = require('jsonwebtoken');
const config = require('./config');
const rp = require('request-promise');
const cors = require('cors')
const express = require('express');

const app = express();

var whitelist = ['https://mixopinions.com', 'https://www.mixopinions.com',
    'https://app.mixopinions.com', 'https://test.mixopinions.com',
    'http://localhost', 'http://localhost:8000', 'https://localhost:8000', 
    'https://localhost', 'https://dinnertable.chat', 'https://www.dinnertable.chat',
    'https://test.dinnertable.chat'];

var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}
app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
var email, userid, resp;
const port = process.env.PORT || 3000;

config.APIKey = process.env.API_KEY || config.APIKey;
config.APISecret = process.env.API_SECRET || config.APISecret;

//Use the ApiKey and APISecret from config.js
function makeToken() {
    const payload = {
        iss: config.APIKey,
        exp: ((new Date()).getTime() + 5000)
    };
    const token = jwt.sign(payload, config.APISecret);
    return token;
}

function generate(res, key) {
    const token = makeToken(redirect);
    const email = 'me'; // req.body.email;
    //check if the email was stored in the console
    console.log('/making key');
    //Store the options for Zoom API which will be used to make an API call later.
    var options = {
        method: 'POST',
        body: {
            settings: {
                participant_video: true,
                approval_type: 2
            }
        },
        //You can use a different uri if you're making an API call to a different Zoom endpoint.
        uri: "https://api.zoom.us/v2/users/" + email + "/meetings",
        qs: {
            status: 'active'
        },
        auth: {
            'bearer': token
        },
        headers: {
            'User-Agent': 'Zoom-api-Jwt-Request',
            'content-type': 'application/json'
        },
        json: true //Parse the JSON string in the response
    };

    //Use request-promise module's .then() method to make request calls.
    rp(options)
        .then(function (response) {
            // cache[key] = response;
            cache.set(key, response);
            //printing the response on the console
            console.log('User has', response);
            //console.log(typeof response);
            resp = response
            res.send(resp);

        })
        .catch(function (err) {
            // API call failed...
            console.log('API call failed, reason ', err);
        });
}


//get the form 
app.get('/', (req, res) => res.send(req.body));

function getKey(meeting) {
    const d = new Date();
    const day = d.getDate();
    // const meeting = req.meeting;
    const key = meeting + '-' + day;
    console.log('key', key);
    return key;
}

// let cache = {};
function onOnce(key) {
    const cb = (key, value) => {
        if (key === key) {
            cache.removeListener("set", cb);
            res(cache.get(key));
        }
    };

    return new Promise((res) => {
        cache.on("set", cb);
    });
}

app.post('/make/:meeting', (req, res) => {
    const meeting = req.params.meeting;
    const key = getKey(meeting);

    const redirect = req.body.redirect || null;
    // ------
    // if(MemoryStorage.[key]) return cache[key];
    const hasKey = cache.has(key);
    const hasKeyLoading = cache.has(key + 'Loading');

    // result => boolean
    if (hasKey) {
        console.log('key exists');
        const data = cache.get(key);
        res.send(data);
    }

    if (!hasKey) {
        if (!hasKeyLoading) {
            console.log('fetching key');
            cache.set(key + 'Loading', true);
            generate(res, key, redirect);
        } else {
            console.log('waiting on key');
            const data = onOnce(key);
            res.send(data);
        }
    }
});

//use userinfo from the form and make a post request to /userinfo
app.post('/userinfo', (req, res) => {
    //store the email address of the user in the email variable
    email = req.body.email;
    //check if the email was stored in the console
    console.log(email);
    //Store the options for Zoom API which will be used to make an API call later.
    var options = {
        //You can use a different uri if you're making an API call to a different Zoom endpoint.
        uri: "https://api.zoom.us/v2/users/" + email,
        qs: {
            status: 'active'
        },
        auth: {
            'bearer': token
        },
        headers: {
            'User-Agent': 'Zoom-api-Jwt-Request',
            'content-type': 'application/json'
        },
        json: true //Parse the JSON string in the response
    };

    //Use request-promise module's .then() method to make request calls.
    rp(options)
        .then(function (response) {
            //printing the response on the console
            console.log('User has', response);
            //console.log(typeof response);
            resp = response
            //Adding html to the page
            var title1 = '<center><h3>Your token: </h3></center>'
            var result1 = title1 + '<code><pre style="background-color:#aef8f9;">' + token + '</pre></code>';
            var title = '<center><h3>User\'s information:</h3></center>'
            //Prettify the JSON format using pre tag and JSON.stringify
            var result = title + '<code><pre style="background-color:#aef8f9;">' + JSON.stringify(resp, null, 2) + '</pre></code>'
            res.send(result1 + '<br>' + result);

        })
        .catch(function (err) {
            // API call failed...
            console.log('API call failed, reason ', err);
        });


});


app.listen(port, () => console.log(`Example app listening on port ${port}!`));