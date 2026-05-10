export default {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_rbEMILSBU',
      userPoolClientId: '6kgkftt1cbk54jveeljh1h1tcs',
      loginWith: {
        oauth: {
          domain: 'gerenciador-salas.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['https://gerenciador-salas.robsonruan.sifu1.web.ufersa.dev.br/'],
          redirectSignOut: ['https://gerenciador-salas.robsonruan.sifu1.web.ufersa.dev.br/'],
          providers: [{ name: 'Google', clientId: 'GOOGLE_CLIENT_ID', secretKey: 'GOOGLE_CLIENT_SECRET' }],
          responseType: 'code'
        }
      },
      signUpVerificationMethod: 'code'
    }
  }
};