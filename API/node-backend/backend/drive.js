const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const path = require('path');
const uuid = require('uuid');
//const drive = google.drive({version: 'v3', auth});

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const FILES_PATH = path.join(__dirname,'./Files');

// Load client secrets from a local file.

  
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
}


/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth,cb) {
    const drive = google.drive({version: 'v3', auth});
    // drive.files.list({
    //   pageSize: 20,
    //   fields: 'nextPageToken, files(id, name, mimeType)',
    // }, (err, res) => {
    drive.files.list({
      fields: 'nextPageToken, files(id, name, mimeType)'
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const files = res.data.files;
      if (files.length) {
        // console.log('Files:');
        return cb(files);
        // files.map((file) => {
        //   console.log(`${file.name} (${file.id}) [${file.mimeType}]`);
        // });
      } else {
        console.log('No files found.');
      }
    });
}


function downloadFiles(auth,fileId,cb){
    //const drive = google.drive({version: 'v3', auth});
    const drive = google.drive('v3');
    // var fileId = '1hRdVOGYIM5VpjE4d7KvzcOlWcrkQD9EC';
    // console.log(fileId);
    const filename = uuid.v4();
    const filepath = path.join(FILES_PATH, filename);

    // console.log(filepath);
    let dest = fs.createWriteStream(filepath);
    drive.files.get({
        auth: auth,
        fileId: fileId,
        alt: 'media'
    },{responseType: 'stream'},
    function(err, res){
      console.log(res);
        res.data
        .on('end', () => {
            console.log('Done');
            return cb({filename,FILES_PATH});
        })
        .on('error', err => {
            console.log('Error', err);
            return cb(err);
        })
        .pipe(dest);
    });
}

function onInit(fn,cb) {
  fs.readFile('backend/credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    // authorize(JSON.parse(content), [downloadFiles, listFiles]);
    authorize(JSON.parse(content), fn);
    // authorize(JSON.parse(content), downloadFiles);
    return cb();
  });
}

function downloadFile(auth,fileId,) {
  const drive = google.drive('v3');
  let filename = drive.get();

}

module.exports = { listFiles,downloadFiles,onInit }