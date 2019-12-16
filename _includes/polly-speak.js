
// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; 
AWS.config.credentials = new AWS.CognitoIdentityCredentials({IdentityPoolId: 'us-east-1:dc514fec-457f-4d98-b391-098d88cdfd70'});

// Function invoked by button click
function speakText(txt) {
    // Create the JSON parameters for getSynthesizeSpeechUrl
    var speechParams = {
        OutputFormat: "mp3",
        SampleRate: "16000",
        Text: "",
        TextType: "text",
        VoiceId: "Matthew"
    };
    speechParams.Text = txt;
    
    // Create the Polly service object and presigner object
    var polly = new AWS.Polly({apiVersion: '2016-06-10'});
    var signer = new AWS.Polly.Presigner(speechParams, polly)

    return new Promise(function(resolve, reject) {
      // Create presigned URL of synthesized speech file
      signer.getSynthesizeSpeechUrl(speechParams, function(error, url) {
        if (error) {
          reject('');
        } else {
          resolve(url);
        }
      });
    });
} 
