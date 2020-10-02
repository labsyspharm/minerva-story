const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
window.CognitoUser = AmazonCognitoIdentity.CognitoUser;
window.CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
window.AuthenticationDetails = AmazonCognitoIdentity.AuthenticationDetails;

import mb from 'minerva-browser';

export default {
  build_page: mb.build_page
}
