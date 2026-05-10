import { signInWithRedirect, signOut, getCurrentUser, fetchAuthSession } from 'https://esm.sh/@aws-amplify/auth@1';

const config = {
  Cognito: {
    userPoolId: 'us-east-1_rbEMILSBU',
    userPoolClientId: '6kgkftt1cbk54jveeljh1h1tcs',
    loginWith: {
      oauth: {
        domain: 'gerenciador-salas.auth.us-east-1.amazoncognito.com',
        scopes: ['openid', 'email', 'profile'],
        redirectSignIn: 'https://gerenciador-salas.robsonruan.sifu1.web.ufersa.dev.br/',
        redirectSignOut: 'https://gerenciador-salas.robsonruan.sifu1.web.ufersa.dev.br/',
        providers: [{ name: 'Google' }],
        responseType: 'code'
      }
    }
  }
};

export async function signInWithGoogle() {
  const domain = config.Cognito.loginWith.oauth.domain;
  const clientId = config.Cognito.userPoolClientId;
  const redirectUri = encodeURIComponent(config.Cognito.loginWith.oauth.redirectSignIn);
  const scopes = encodeURIComponent(config.Cognito.loginWith.oauth.scopes.join(' '));
  
  const url = `https://${domain}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&identity_provider=Google`;
  
  window.location.href = url;
}

export async function handleSignOut() {
  const domain = config.Cognito.loginWith.oauth.domain;
  const clientId = config.Cognito.userPoolClientId;
  const redirectUri = encodeURIComponent(config.Cognito.loginWith.oauth.redirectSignOut);
  
  const url = `https://${domain}/logout?client_id=${clientId}&logout_uri=${redirectUri}`;
  
  window.location.href = url;
}

export async function checkAuth() {
  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    return null;
  }
}

export async function getUserAttributes() {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.payload;
  } catch (error) {
    return null;
  }
}

window.AuthService = { signInWithGoogle, handleSignOut, checkAuth, getUserAttributes };