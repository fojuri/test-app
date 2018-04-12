
const MainApp = require('./mainApp')
const { handleErrors } = require('./common');
// const customData = require('./api.js')


// const LOGIN_URL = `${options.endpoint}/login`;

const options = {
  stage: 'dev',
  appId: 'SkgjG6TYM',
  api: 'https://kw9lj3a57c.execute-api.us-east-1.amazonaws.com/',
}
// civic is imported in index.html
const civicSip = new civic.sip(options); // eslint-disable-line no-undef, new-cap

// TODO
const sessionService = {
  getExpiry: () => {},
};

// Actions
const MAIN_REFRESH = 'civic-login/MAIN_REFRESH';
const CIVIC_SIP_LOGIN = 'civic-login/CIVIC_SIP_LOGIN';
const SESSION_SUCCESS = 'civic-login/SESSION_SUCCESS';
const LOGIN_SUCCESS = 'civic-login/LOGIN_SUCCESS';
const LOG_OUT = 'civic-login/LOG_OUT';
const CIVIC_SIP_CANCELLED = 'civic-login/CIVIC_SIP_CANCELLED';
const CIVIC_SIP_ADD_EVENT_LISTENERS = 'civic-login/CIVIC_SIP_ADD_EVENT_LISTENERS';
const CIVIC_SIP_SUCCESS = 'civic-login/CIVIC_SIP_SUCCESS';
const CIVIC_SIP_ERROR = 'civic-login/CIVIC_SIP_ERROR';

const INITIAL_STATE = {
  session: {},
  redirect: false
};


function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case MAIN_REFRESH:
    case CIVIC_SIP_LOGIN:
      return {
        ...state,
        apiBusy: true,
        apiError: '',
      };
    case LOGIN_SUCCESS:
      return {
        ...state,
        apiBusy: false,
        redirect: true,
        session: {
          token: action.sessionToken,
          expires: action.expires,
        },
      };
    case CIVIC_SIP_CANCELLED:
    case SESSION_SUCCESS:
      return {
        ...state,
        apiBusy: false,
        session: {
          token: action.sessionToken,
          expires: action.expires,
        },
      };
    case LOG_OUT:
      return {
        ...state,
        session: undefined,
        apiError: '',
        apiBusy: false,
      };
    default:
      return state;
  }
}

const addEventListeners = (success, cancelled, error) => {
  civicSip.removeAllListeners('auth-code-received');
  civicSip.removeAllListeners('user-cancelled');
  civicSip.removeAllListeners('civic-sip-error');

  civicSip.addEventListener('auth-code-received', (e) => {
    success(e.response);
  });
  civicSip.addEventListener('user-cancelled', (e) => {
    cancelled(e.response);
  });
  civicSip.addEventListener('civic-sip-error', (e) => {
    error(e);
  });
};

const civicSipCancelled = dispatch => response => dispatch({
  type: CIVIC_SIP_CANCELLED,
  response,
});

const civicSipLogin = () => Promise.resolve(civicSip.signup({ scopeRequest: civicSip.ScopeRequests.BASIC_SIGNUP }));


const apiLoginSuccess = (sessionToken, expires) => (dispatch) => {
  console.log(sessionToken, 'myToken')
  dispatch({
    type: LOGIN_SUCCESS,
    sessionToken,
    expires,
  });

};

function sessionLogin(authToken) {
  return dispatch => fetch('http://localhost:3006/login', {
    body: JSON.stringify({ authToken }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
    mode: 'cors',
  }).then(handleErrors)
    .then(response => response)
    .then(body => dispatch(apiLoginSuccess(body.sessionToken, sessionService.getExpiry())));
}

const civicSipSuccess = (dispatch) => (authToken) => {
  dispatch({
    type: CIVIC_SIP_SUCCESS,
    authToken,
  });
  dispatch(sessionLogin(authToken));
};

// Action creators
const civicSipError = dispatch => error => dispatch({
  type: CIVIC_SIP_ERROR,
  error,
});

const login = () => (dispatch) => {
  dispatch({
    type: CIVIC_SIP_ADD_EVENT_LISTENERS,
  });
  addEventListeners(civicSipSuccess(dispatch), civicSipCancelled(dispatch), civicSipError(dispatch));
  dispatch({
    type: CIVIC_SIP_LOGIN,
  });
  return civicSipLogin();
};

const logout = () => (dispatch) => {
  dispatch({
    type: LOG_OUT,
  });
};

module.exports = {
  login,
  reducer,
  LOGIN_SUCCESS,
  logout,
  sessionLogin,
  addEventListeners,
};
