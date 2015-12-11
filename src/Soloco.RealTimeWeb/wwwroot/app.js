(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _reqwest = require('reqwest');

var _reqwest2 = _interopRequireDefault(_reqwest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var jsonHeaders = { 'Accept': 'application/json' };
var serviceBase = 'http://localhost:5010/';
var clientId = 'realTimeWebClient';

function call(verb, contentType, url, data, responseHandler, errorHandler) {

    function parseErrors(handler) {
        return function (request) {
            var data = JSON.parse(request.response);
            return handler(data.errors, request);
        };
    }

    (0, _reqwest2.default)({
        url: serviceBase + url,
        method: verb,
        //type: 'json',
        contentType: contentType,
        data: data,
        headers: jsonHeaders,
        success: responseHandler,
        error: parseErrors(errorHandler)
    });
}

function get(url, data, responseHandler, errorHandler) {
    call('get', 'application/json', url, data, responseHandler, errorHandler);
}

function post(url, data, responseHandler, errorHandler) {
    call('post', 'application/x-www-form-urlencoded', url, data, responseHandler, errorHandler);
}

exports.default = {
    serviceBase: serviceBase,
    clientId: clientId,
    post: post,
    get: get
};

},{"reqwest":"reqwest"}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ = require('./');

var _2 = _interopRequireDefault(_);

var _navigate = require('./navigate');

var _navigate2 = _interopRequireDefault(_navigate);

var _user = require('../state/user');

var _store = require('store');

var _store2 = _interopRequireDefault(_store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//const proxy = $.connection.membership;
var storageKey = 'authorizationData';

//proxy.client.LoginSuccessful = function (name) {
//    userStateActions.logon(name);
//};

//function login(userName, password) {
//    proxy.server.login(userName, password);
//}

function login(userName, password, useRefreshTokens) {

    function handleResponse(response) {
        loggedOn(userName, response.access_token, useRefreshTokens);
    }

    function handleError(request) {
        var data = JSON.parse(request.response);
        _user.actions.logonFailed(data.error_description);
    }

    var data = 'grant_type=password&username=' + userName + '&password=' + password;
    if (useRefreshTokens) {
        data = data + '&client_id=' + _2.default.clientId;
    }

    _user.actions.logonPending();

    _2.default.post('token', data, handleResponse, handleError);
}

function logOff() {

    _store2.default.remove(storageKey);

    _user.actions.logoff();

    _navigate2.default.to('/');
}

function loggedOn(userName, token, refreshToken) {

    var data = {
        token: token,
        userName: userName,
        useRefreshTokens: refreshToken ? true : false,
        refreshToken: refreshToken
    };

    _store2.default.set(storageKey, data);

    _user.actions.logon(userName, refreshToken ? true : false);

    _navigate2.default.to('/home');
}

function register(userName, eMail, password) {

    function handleResponse(response) {
        login(userName, password);
    }

    function handleError(request) {
        var data = JSON.parse(request.response);
        _user.actions.registrationFailed(data.error_description);
    }

    var data = {
        userName: userName,
        eMail: eMail,
        password: password
    };

    _user.actions.registerPending();

    _2.default.post('api/account/register', data, handleResponse, handleError);
}

function externalProviderUrl(provider) {
    var redirectUri = location.protocol + '//' + location.host + '/Account/Complete';

    return _2.default.serviceBase + "api/Account/ExternalLogin?provider=" + provider + "&response_type=token&client_id=" + _2.default.clientId + "&redirect_uri=" + redirectUri;
}

function externalProviderCompleted(fragment) {

    function handleResponse(response) {
        loggedOn(response.userName, response.access_token, null);
    }

    function handleError(request) {
        var data = JSON.parse(request.response);
        _user.actions.associateExternalFailed(data.error_description);
    }

    if (fragment.haslocalaccount === 'False') {
        return _user.actions.associateExternal(fragment.provider, fragment.external_access_token, fragment.external_user_name);
    }

    var data = 'provider=' + fragment.provider + '&externalAccessToken=' + fragment.external_access_token;

    _2.default.get('api/account/ObtainLocalAccessToken', data, handleResponse, handleError);
}

function registerExternal(userName, provider, externalAccessToken) {

    function handleResponse(response) {
        loggedOn(response.userName, response.access_token, null);
    }

    function handleError(errors, request) {
        _user.actions.associateExternalFailed(errors[0]);
    }

    var data = {
        userName: userName,
        provider: provider,
        externalAccessToken: externalAccessToken
    };

    _user.actions.associateExternalPending();

    _2.default.post('api/account/registerexternal', data, handleResponse, handleError);
}

function initialize() {
    var data = _store2.default.get(storageKey);
    if (data) {
        loggedOn(data.userName, data.token, data.refreshToken);
    }
}

//$.connection.hub.start()
//    .done(function(){ console.log('Now connected, connection ID=' + $.connection.hub.id); })
//    .fail(function(){ console.log('Could not Connect!'); });

exports.default = {
    initialize: initialize,
    login: login,
    logOff: logOff,
    register: register,
    externalProviderUrl: externalProviderUrl,
    externalProviderCompleted: externalProviderCompleted,
    registerExternal: registerExternal
};

},{"../state/user":16,"./":1,"./navigate":3,"store":"store"}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _reduxRouter = require('redux-router');

var _dispatcher = require('../state/dispatcher');

var _dispatcher2 = _interopRequireDefault(_dispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var to = function to(url) {
    _dispatcher2.default.dispatch((0, _reduxRouter.pushState)(null, url));
};

exports.default = { to: to };

},{"../state/dispatcher":14,"redux-router":"redux-router"}],4:[function(require,module,exports){
'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _redux = require('redux');

var _reactRedux = require('react-redux');

var _reduxDevtools = require('redux-devtools');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _react3 = require('redux-devtools/lib/react');

var _reduxRouter = require('redux-router');

var _history = require('history');

var _membership = require('./api/membership');

var _membership2 = _interopRequireDefault(_membership);

var _reducers = require('./state/reducers');

var _reducers2 = _interopRequireDefault(_reducers);

var _dispatcher = require('./state/dispatcher');

var _dispatcher2 = _interopRequireDefault(_dispatcher);

var _router = require('./router');

var _router2 = _interopRequireDefault(_router);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var storeFactory = (0, _redux.compose)((0, _redux.applyMiddleware)(_reduxThunk2.default), (0, _reduxRouter.reduxReactRouter)({ createHistory: _history.createHistory }), (0, _reduxDevtools.devTools)(), (0, _reduxDevtools.persistState)(window.location.href.match(/[?&]debug_session=([^&]+)\b/)))(_redux.createStore);

var store = storeFactory(_reducers2.default);

_dispatcher2.default.set(store.dispatch);

var contentElement = document.getElementById('application-content');

_reactDom2.default.render(_react2.default.createElement(
    'div',
    null,
    _react2.default.createElement(
        _reactRedux.Provider,
        { store: store },
        _react2.default.createElement(_router2.default, null)
    ),
    _react2.default.createElement(
        _react3.DebugPanel,
        { top: true, right: true, bottom: true },
        _react2.default.createElement(_react3.DevTools, { store: store, monitor: _react3.LogMonitor })
    )
), contentElement);

_membership2.default.initialize();

},{"./api/membership":2,"./router":13,"./state/dispatcher":14,"./state/reducers":15,"history":"history","react":"react","react-dom":"react-dom","react-redux":"react-redux","redux":"redux","redux-devtools":20,"redux-devtools/lib/react":27,"redux-router":"redux-router","redux-thunk":"redux-thunk"}],5:[function(require,module,exports){
'use strict';

var React = require('react');

var About = React.createClass({
    displayName: 'About',
    render: function render() {
        return React.createElement(
            'div',
            null,
            'About us!'
        );
    }
});

module.exports = About;

},{"react":"react"}],6:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _reactBootstrap = require('react-bootstrap');

var _user = require('../../state/user');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HomePage = (function (_Component) {
    _inherits(HomePage, _Component);

    function HomePage() {
        _classCallCheck(this, HomePage);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(HomePage).apply(this, arguments));
    }

    _createClass(HomePage, [{
        key: 'render',
        value: function render() {
            var title = _react2.default.createElement(
                'h2',
                null,
                'Activity'
            );
            var loader = this.props.logonPending ? _react2.default.createElement(
                'div',
                null,
                'Loading'
            ) : null;

            return _react2.default.createElement(
                _reactBootstrap.Grid,
                null,
                _react2.default.createElement(
                    _reactBootstrap.Row,
                    { className: 'show-grid' },
                    _react2.default.createElement(
                        _reactBootstrap.Col,
                        { xs: 12, md: 8 },
                        _react2.default.createElement(
                            _reactBootstrap.Jumbotron,
                            null,
                            _react2.default.createElement(
                                'h2',
                                null,
                                'Home sweet home'
                            )
                        )
                    ),
                    _react2.default.createElement(
                        _reactBootstrap.Col,
                        { xs: 12, md: 4 },
                        _react2.default.createElement(_reactBootstrap.Panel, { header: title, bsStyle: 'info' })
                    )
                )
            );
        }
    }]);

    return HomePage;
})(_react.Component);

HomePage.propTypes = {
    allowed: _react.PropTypes.bool.isRequired
};

function select(state) {
    return {
        allowed: state.user.status === _user.userStatus.authenticated
    };
}

exports.default = (0, _reactRedux.connect)(select)(HomePage);

},{"../../state/user":16,"react":"react","react-bootstrap":"react-bootstrap","react-redux":"react-redux"}],7:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _reactBootstrap = require('react-bootstrap');

var _user = require('../../state/user');

var _membership = require('../../api/membership');

var _membership2 = _interopRequireDefault(_membership);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LogonPage = (function (_Component) {
    _inherits(LogonPage, _Component);

    function LogonPage() {
        _classCallCheck(this, LogonPage);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(LogonPage).apply(this, arguments));
    }

    _createClass(LogonPage, [{
        key: 'onClick',
        value: function onClick() {
            var _refs = this.refs;
            var userNameInput = _refs.userNameInput;
            var passwordInput = _refs.passwordInput;

            var userName = userNameInput.getValue();
            var password = passwordInput.getValue();
            _membership2.default.login(userName, password);
        }
    }, {
        key: 'facebook',
        value: function facebook() {
            this.authExternalProvider('Facebook');
        }
    }, {
        key: 'google',
        value: function google() {
            this.authExternalProvider('Google');
        }
    }, {
        key: 'authExternalProvider',
        value: function authExternalProvider(provider) {
            var externalProviderUrl = _membership2.default.externalProviderUrl(provider);
            window.authenticationScope = { complete: _membership2.default.externalProviderCompleted };
            window.open(externalProviderUrl, "Authenticate Account", "location=0,status=0,width=600,height=750");
        }
    }, {
        key: 'associateExternal',
        value: function associateExternal() {
            var userName = this.refs.userNameInput.getValue();
            var _props = this.props;
            var provider = _props.provider;
            var externalAccessToken = _props.externalAccessToken;
            var externalUserName = _props.externalUserName;

            _membership2.default.registerExternal(userName, provider, externalAccessToken, externalUserName);
        }
    }, {
        key: 'render',
        value: function render() {
            var title = _react2.default.createElement(
                'h2',
                null,
                'Log On'
            );
            var loader = this.props.processing ? _react2.default.createElement(
                'div',
                null,
                'Loading'
            ) : null;

            var content = this.props.associateExternal ? _react2.default.createElement(
                _reactBootstrap.Panel,
                { header: title, bsStyle: 'info' },
                _react2.default.createElement(
                    'div',
                    null,
                    _react2.default.createElement(
                        'p',
                        null,
                        _react2.default.createElement(
                            'strong',
                            null,
                            'You have successfully authenticated with ',
                            this.props.provider,
                            ' '
                        ),
                        '.'
                    ),
                    _react2.default.createElement(
                        'p',
                        null,
                        'Please enter a user name below for this site and click the Register button to log in.'
                    )
                ),
                _react2.default.createElement(_reactBootstrap.Input, {
                    type: 'text',
                    placeholder: 'User name',
                    hasFeedback: true,
                    ref: 'userNameInput' }),
                _react2.default.createElement(
                    _reactBootstrap.Button,
                    { bsStyle: 'success', bzSize: 'large', className: 'btn-block', onClick: this.associateExternal.bind(this) },
                    'Button'
                ),
                loader,
                _react2.default.createElement(
                    'div',
                    null,
                    this.props.message
                )
            ) : _react2.default.createElement(
                _reactBootstrap.Panel,
                { header: title, bsStyle: 'info' },
                _react2.default.createElement(_reactBootstrap.Input, {
                    type: 'text',
                    placeholder: 'Email or username',
                    hasFeedback: true,
                    ref: 'userNameInput' }),
                _react2.default.createElement(_reactBootstrap.Input, {
                    type: 'password',
                    placeholder: 'Password',
                    hasFeedback: true,
                    ref: 'passwordInput' }),
                _react2.default.createElement(
                    _reactBootstrap.Button,
                    { bsStyle: 'success', bzSize: 'large', className: 'btn-block', onClick: this.onClick.bind(this) },
                    'Log On'
                ),
                loader,
                _react2.default.createElement(
                    'div',
                    null,
                    this.props.message
                ),
                _react2.default.createElement(
                    _reactBootstrap.Button,
                    { bsStyle: 'facebook', bsSize: 'large', className: 'btn-block', onClick: this.facebook.bind(this) },
                    _react2.default.createElement('i', { className: 'fa fa-facebook' }),
                    ' | Connect with Facebook'
                ),
                _react2.default.createElement(
                    _reactBootstrap.Button,
                    { bsStyle: 'google-plus', bsSize: 'large', className: 'btn-block', onClick: this.google.bind(this) },
                    _react2.default.createElement('i', { className: 'fa fa-google-plus' }),
                    ' | Connect with Google+'
                )
            );

            return _react2.default.createElement(
                _reactBootstrap.Grid,
                null,
                _react2.default.createElement(
                    _reactBootstrap.Row,
                    { className: 'show-grid' },
                    _react2.default.createElement(
                        _reactBootstrap.Col,
                        { xs: 12, md: 8 },
                        _react2.default.createElement(
                            _reactBootstrap.Jumbotron,
                            null,
                            _react2.default.createElement(
                                'h2',
                                null,
                                'We would like to know you'
                            )
                        )
                    ),
                    _react2.default.createElement(
                        _reactBootstrap.Col,
                        { xs: 12, md: 4 },
                        content
                    )
                )
            );
        }
    }]);

    return LogonPage;
})(_react.Component);

LogonPage.propTypes = {
    associateExternal: _react.PropTypes.bool.isRequired,
    processing: _react.PropTypes.bool.isRequired,
    message: _react.PropTypes.string,
    provider: _react.PropTypes.string,
    externalAccessToken: _react.PropTypes.string,
    externalUserName: _react.PropTypes.string
};

function select(state) {
    return {
        processing: state.user.processing,
        associateExternal: state.user.status === _user.userStatus.associateExternal || state.user.status === _user.userStatus.accociateExternalPending,
        message: state.user.message,
        provider: state.user.provider,
        externalAccessToken: state.user.externalAccessToken,
        externalUserName: state.user.externalUserName
    };
}

exports.default = (0, _reactRedux.connect)(select)(LogonPage);

},{"../../api/membership":2,"../../state/user":16,"react":"react","react-bootstrap":"react-bootstrap","react-redux":"react-redux"}],8:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _reactBootstrap = require('react-bootstrap');

var _reactBootstrapGrid = require('react-bootstrap-grid');

var _user = require('../../state/user');

var _header = require('./header');

var _header2 = _interopRequireDefault(_header);

var _footer = require('./footer');

var _footer2 = _interopRequireDefault(_footer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Application = (function (_Component) {
    _inherits(Application, _Component);

    function Application() {
        _classCallCheck(this, Application);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Application).apply(this, arguments));
    }

    _createClass(Application, [{
        key: 'render',
        value: function render() {
            var _props = this.props;
            var dispatch = _props.dispatch;
            var user = _props.user;

            return _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement(_header2.default, {
                    userAuthenticated: user.status == _user.userStatus.authenticated,
                    userName: user.name }),
                this.props.children,
                _react2.default.createElement(
                    _reactBootstrapGrid.Container,
                    null,
                    _react2.default.createElement(_footer2.default, null)
                )
            );
        }
    }]);

    return Application;
})(_react.Component);

Application.propTypes = {
    user: _react.PropTypes.shape({
        status: _react2.default.PropTypes.oneOf(_user.userStatus.values),
        name: _react.PropTypes.string
    }).isRequired
};

function select(state) {
    return { user: state.user };
}

exports.default = (0, _reactRedux.connect)(select)(Application);

},{"../../state/user":16,"./footer":9,"./header":10,"react":"react","react-bootstrap":"react-bootstrap","react-bootstrap-grid":"react-bootstrap-grid","react-redux":"react-redux"}],9:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var separatorStyle = {
    borderBottom: '1px solid #ccc',
    fontSize: '1px',
    height: '8px',
    marginBottom: '8px'
};

var Footer = (function (_Component) {
    _inherits(Footer, _Component);

    function Footer() {
        _classCallCheck(this, Footer);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Footer).apply(this, arguments));
    }

    _createClass(Footer, [{
        key: 'render',
        value: function render() {
            return _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement('div', { style: separatorStyle }),
                _react2.default.createElement(
                    'div',
                    null,
                    '© 2015 Soloco'
                )
            );
        }
    }]);

    return Footer;
})(_react.Component);

module.exports = Footer;

},{"react":"react"}],10:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouter = require('react-router');

var _reactBootstrap = require('react-bootstrap');

var _reactBootstrapGrid = require('react-bootstrap-grid');

var _navigate = require('./../../api/navigate');

var _navigate2 = _interopRequireDefault(_navigate);

var _membership = require('./../../api/membership');

var _membership2 = _interopRequireDefault(_membership);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Header = (function (_Component) {
    _inherits(Header, _Component);

    function Header() {
        _classCallCheck(this, Header);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Header).apply(this, arguments));
    }

    _createClass(Header, [{
        key: 'render',
        value: function render() {
            var _props = this.props;
            var userAuthenticated = _props.userAuthenticated;
            var userName = _props.userName;

            var items = userAuthenticated ? [_react2.default.createElement(
                _reactBootstrap.Nav,
                { onSelect: function onSelect(key, href) {
                        return _navigate2.default.to(href);
                    } },
                _react2.default.createElement(
                    _reactBootstrap.NavItem,
                    { href: '/home' },
                    'Home'
                ),
                _react2.default.createElement(
                    _reactBootstrap.NavItem,
                    { href: '/devices' },
                    'Devices'
                ),
                _react2.default.createElement(
                    _reactBootstrap.NavItem,
                    { href: '/about' },
                    'About'
                )
            ), _react2.default.createElement(
                _reactBootstrap.Nav,
                { pullRight: true, onSelect: function onSelect(key, href) {
                        return _navigate2.default.to(href);
                    } },
                _react2.default.createElement(
                    _reactBootstrap.NavItem,
                    { href: '/profile' },
                    userName
                ),
                _react2.default.createElement(
                    _reactBootstrap.NavItem,
                    { onSelect: function onSelect() {
                            return _membership2.default.logOff();
                        } },
                    'Log Off'
                )
            )] : [_react2.default.createElement(
                _reactBootstrap.Nav,
                { onSelect: function onSelect(key, href) {
                        return _navigate2.default.to(href);
                    } },
                _react2.default.createElement(
                    _reactBootstrap.NavItem,
                    { href: '/about' },
                    'About'
                )
            ), _react2.default.createElement(
                _reactBootstrap.Nav,
                { pullRight: true },
                _react2.default.createElement(
                    _reactBootstrap.NavItem,
                    { onSelect: function onSelect() {
                            return _navigate2.default.to('/register');
                        } },
                    'Join'
                ),
                _react2.default.createElement(
                    _reactBootstrap.NavItem,
                    { onSelect: function onSelect() {
                            return _navigate2.default.to('/logon');
                        } },
                    'Log On'
                )
            )];

            return _react2.default.createElement(
                _reactBootstrap.Navbar,
                null,
                _react2.default.createElement(
                    _reactBootstrap.NavBrand,
                    null,
                    'Soloco - Reactive Starter Kit'
                ),
                items
            );
        }
    }]);

    return Header;
})(_react.Component);

Header.propTypes = {
    userAuthenticated: _react.PropTypes.bool.isRequired,
    userName: _react.PropTypes.string
};

exports.default = Header;

},{"./../../api/membership":2,"./../../api/navigate":3,"react":"react","react-bootstrap":"react-bootstrap","react-bootstrap-grid":"react-bootstrap-grid","react-router":"react-router"}],11:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NotFoundPage = (function (_Component) {
    _inherits(NotFoundPage, _Component);

    function NotFoundPage() {
        _classCallCheck(this, NotFoundPage);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(NotFoundPage).apply(this, arguments));
    }

    _createClass(NotFoundPage, [{
        key: 'render',
        value: function render() {
            return _react2.default.createElement(
                'div',
                null,
                _react2.default.createElement(
                    'h1',
                    null,
                    'Page not found'
                ),
                _react2.default.createElement(
                    'p',
                    null,
                    'Sorry, but the page you were trying to view does not exist.'
                )
            );
        }
    }]);

    return NotFoundPage;
})(_react.Component);

exports.default = NotFoundPage;

},{"react":"react"}],12:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRedux = require('react-redux');

var _reactBootstrap = require('react-bootstrap');

var _user = require('../../state/user');

var _membership = require('../../api/membership');

var _membership2 = _interopRequireDefault(_membership);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LogonPage = (function (_Component) {
    _inherits(LogonPage, _Component);

    function LogonPage() {
        _classCallCheck(this, LogonPage);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(LogonPage).apply(this, arguments));
    }

    _createClass(LogonPage, [{
        key: 'onClick',
        value: function onClick() {
            var _refs = this.refs;
            var userNameInput = _refs.userNameInput;
            var eMailInput = _refs.eMailInput;
            var passwordInput = _refs.passwordInput;

            var userName = userNameInput.getValue();
            var eMail = eMailInput.getValue();
            var password = passwordInput.getValue();
            _membership2.default.register(userName, eMail, password);
        }
    }, {
        key: 'render',
        value: function render() {
            var title = _react2.default.createElement(
                'h2',
                null,
                'Register'
            );
            var loader = this.props.processing ? _react2.default.createElement(
                'div',
                null,
                'Loading'
            ) : null;

            var content = _react2.default.createElement(
                _reactBootstrap.Panel,
                { header: title, bsStyle: 'info' },
                _react2.default.createElement(_reactBootstrap.Input, {
                    type: 'text',
                    placeholder: 'Username',
                    hasFeedback: true,
                    ref: 'userNameInput' }),
                _react2.default.createElement(_reactBootstrap.Input, {
                    type: 'email',
                    placeholder: 'Email',
                    hasFeedback: true,
                    ref: 'eMailInput' }),
                _react2.default.createElement(_reactBootstrap.Input, {
                    type: 'password',
                    placeholder: 'Password',
                    hasFeedback: true,
                    ref: 'passwordInput' }),
                _react2.default.createElement(_reactBootstrap.Input, {
                    type: 'password',
                    placeholder: 'Repeat Password',
                    hasFeedback: true,
                    ref: 'passwordInput' }),
                _react2.default.createElement(
                    _reactBootstrap.Button,
                    { bsStyle: 'success', bzSize: 'large', className: 'btn-block', onClick: this.onClick.bind(this) },
                    'Register'
                ),
                loader,
                _react2.default.createElement(
                    'div',
                    null,
                    this.props.message
                )
            );

            return _react2.default.createElement(
                _reactBootstrap.Grid,
                null,
                _react2.default.createElement(
                    _reactBootstrap.Row,
                    { className: 'show-grid' },
                    _react2.default.createElement(
                        _reactBootstrap.Col,
                        { xs: 12, md: 8 },
                        _react2.default.createElement(
                            _reactBootstrap.Jumbotron,
                            null,
                            _react2.default.createElement(
                                'h2',
                                null,
                                'Join us'
                            )
                        )
                    ),
                    _react2.default.createElement(
                        _reactBootstrap.Col,
                        { xs: 12, md: 4 },
                        content
                    )
                )
            );
        }
    }]);

    return LogonPage;
})(_react.Component);

LogonPage.propTypes = {
    processing: _react.PropTypes.bool.isRequired,
    message: _react.PropTypes.string
};

function select(state) {
    return {
        processing: state.user.processing,
        message: state.user.message
    };
}

exports.default = (0, _reactRedux.connect)(select)(LogonPage);

},{"../../api/membership":2,"../../state/user":16,"react":"react","react-bootstrap":"react-bootstrap","react-redux":"react-redux"}],13:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouter = require('react-router');

var _reduxRouter = require('redux-router');

var _MainPage = require('./components/MainPage');

var _MainPage2 = _interopRequireDefault(_MainPage);

var _HomeView = require('./components/HomeView');

var _HomeView2 = _interopRequireDefault(_HomeView);

var _AboutView = require('./components/AboutView');

var _AboutView2 = _interopRequireDefault(_AboutView);

var _LogonView = require('./components/LogonView');

var _LogonView2 = _interopRequireDefault(_LogonView);

var _RegisterView = require('./components/RegisterView');

var _RegisterView2 = _interopRequireDefault(_RegisterView);

var _NotFoundPage = require('./components/NotFoundPage');

var _NotFoundPage2 = _interopRequireDefault(_NotFoundPage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ApplicationRouter = (function (_Component) {
    _inherits(ApplicationRouter, _Component);

    function ApplicationRouter() {
        _classCallCheck(this, ApplicationRouter);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(ApplicationRouter).apply(this, arguments));
    }

    _createClass(ApplicationRouter, [{
        key: 'render',
        value: function render() {
            return _react2.default.createElement(
                _reduxRouter.ReduxRouter,
                null,
                _react2.default.createElement(
                    _reactRouter.Route,
                    { path: '/', component: _MainPage2.default },
                    _react2.default.createElement(_reactRouter.IndexRoute, { component: _LogonView2.default }),
                    '.',
                    _react2.default.createElement(_reactRouter.Route, { path: 'home', component: _HomeView2.default }),
                    _react2.default.createElement(_reactRouter.Route, { path: 'about', component: _AboutView2.default }),
                    _react2.default.createElement(_reactRouter.Route, { path: 'register', component: _RegisterView2.default }),
                    _react2.default.createElement(_reactRouter.Route, { path: 'logon', component: _LogonView2.default })
                ),
                _react2.default.createElement(_reactRouter.Route, { path: '*', component: _NotFoundPage2.default })
            );
        }
    }]);

    return ApplicationRouter;
})(_react.Component);

exports.default = ApplicationRouter;

},{"./components/AboutView":5,"./components/HomeView":6,"./components/LogonView":7,"./components/MainPage":8,"./components/NotFoundPage":11,"./components/RegisterView":12,"react":"react","react-router":"react-router","redux-router":"redux-router"}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var dispatcher;

function set(value) {
    dispatcher = value;
}

function dispatch(action) {
    return dispatcher(action);
}

exports.default = {
    set: set,
    dispatch: dispatch
};

},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _redux = require('redux');

var _reduxRouter = require('redux-router');

var _user = require('./user');

var reducers = (0, _redux.combineReducers)({
    router: _reduxRouter.routerStateReducer,
    user: _user.reducer
});

exports.default = reducers;

},{"./user":16,"redux":"redux","redux-router":"redux-router"}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.actions = exports.actionsDefinitions = exports.userStatus = undefined;
exports.reducer = reducer;

var _dispatcher = require('./dispatcher');

var _dispatcher2 = _interopRequireDefault(_dispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dispatch = _dispatcher2.default.dispatch;

var userStatus = exports.userStatus = {
    notAuthenticated: 'notAuthenticated',
    authenticated: 'authenticated',
    associateExternal: 'associateExternal',
    values: ['notAuthenticated', 'authenticated', 'associateExternal']
};

var actionsDefinitions = exports.actionsDefinitions = {
    LOG_OFF: 'LOG_OFF',

    LOG_ON: 'LOG_ON',
    LOG_ON_PENDING: 'LOG_ON_PENDING',
    LOG_ON_FAILED: 'LOG_ON_FAILED',

    REGISTER: 'REGISTER',
    REGISTER_PENDING: 'REGISTER_PENDING',

    ASSOCIATE_EXTERNAL: 'ASSOCIATE_EXTERNAL',
    ASSOCIATE_EXTERNAL_PENDING: 'ASSOCIATE_EXTERNAL_PENDING',
    ASSOCIATE_EXTERNAL_FAILED: 'ASSOCIATE_EXTERNAL_FAILED'
};

var actions = exports.actions = {
    logon: function logon(name, refreshTokens) {
        return dispatch({
            type: actionsDefinitions.LOG_ON,
            name: name,
            refreshTokens: refreshTokens
        });
    },

    logonPending: function logonPending() {
        return dispatch({
            type: actionsDefinitions.LOG_ON_PENDING
        });
    },

    logonFailed: function logonFailed(message) {
        return dispatch({
            type: actionsDefinitions.LOG_ON_FAILED,
            message: message
        });
    },

    logoff: function logoff() {
        return dispatch({
            type: actionsDefinitions.LOG_OFF
        });
    },

    register: function register() {
        return dispatch({
            type: actionsDefinitions.REGISTER
        });
    },

    registerPending: function registerPending() {
        return dispatch({
            type: actionsDefinitions.REGISTER_PENDING
        });
    },

    associateExternal: function associateExternal(provider, externalAccessToken, externalUserName) {
        return dispatch({
            type: actionsDefinitions.ASSOCIATE_EXTERNAL,
            provider: provider,
            externalAccessToken: externalAccessToken,
            externalUserName: externalUserName
        });
    },

    associateExternalPending: function associateExternalPending() {
        return dispatch({
            type: actionsDefinitions.ASSOCIATE_EXTERNAL_PENDING
        });
    },

    associateExternalFailed: function associateExternalFailed(message) {
        return dispatch({
            type: actionsDefinitions.ASSOCIATE_EXTERNAL_FAILED,
            message: message
        });
    }
};

var notAuthenticated = { status: userStatus.notAuthenticated };

function reducer() {
    var state = arguments.length <= 0 || arguments[0] === undefined ? notAuthenticated : arguments[0];
    var action = arguments[1];

    switch (action.type) {
        case actionsDefinitions.LOG_ON:
            return {
                status: userStatus.authenticated,
                name: action.name,
                processing: false
            };

        case actionsDefinitions.LOG_ON_PENDIG:
            return {
                status: userStatus.notAuthenticated,
                name: state.name,
                processing: true
            };

        case actionsDefinitions.LOG_ON_FAILED:
            return {
                status: userStatus.notAuthenticated,
                message: action.message
            };

        case actionsDefinitions.LOG_OFF:
            return {
                status: userStatus.notAuthenticated
            };

        case actionsDefinitions.REGISTER:
            return {
                status: userStatus.notAuthenticated,
                processing: false
            };

        case actionsDefinitions.REGISTER_PENDING:
            return {
                status: userStatus.notAuthenticated,
                processing: true
            };

        case actionsDefinitions.ASSOCIATE_EXTERNAL:
            return {
                status: userStatus.associateExternal,
                provider: action.provider,
                externalAccessToken: action.externalAccessToken,
                externalUserName: action.externalUserName,
                processing: false
            };

        case actionsDefinitions.ASSOCIATE_EXTERNAL_PENDING:
            return {
                status: userStatus.associateExternal,
                provider: state.provider,
                externalAccessToken: state.externalAccessToken,
                externalUserName: state.externalUserName,
                processing: true
            };

        case actionsDefinitions.ASSOCIATE_EXTERNAL_FAILED:
            return {
                status: userStatus.associateExternal,
                message: action.message,
                provider: state.provider,
                externalAccessToken: state.externalAccessToken,
                externalUserName: state.externalUserName
            };

        default:
            return state;
    }
};

},{"./dispatcher":14}],17:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],18:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports['default'] = createDevTools;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _reactReduxLibComponentsCreateAll = require('react-redux/lib/components/createAll');

var _reactReduxLibComponentsCreateAll2 = _interopRequireDefault(_reactReduxLibComponentsCreateAll);

var _devTools = require('./devTools');

function createDevTools(React) {
  var PropTypes = React.PropTypes;
  var Component = React.Component;

  var _createAll = _reactReduxLibComponentsCreateAll2['default'](React);

  var connect = _createAll.connect;

  var DevTools = (function (_Component) {
    _inherits(DevTools, _Component);

    function DevTools() {
      _classCallCheck(this, _DevTools);

      _Component.apply(this, arguments);
    }

    DevTools.prototype.render = function render() {
      var Monitor = this.props.monitor;

      return React.createElement(Monitor, this.props);
    };

    var _DevTools = DevTools;
    DevTools = connect(function (state) {
      return state;
    }, _devTools.ActionCreators)(DevTools) || DevTools;
    return DevTools;
  })(Component);

  return (function (_Component2) {
    _inherits(DevToolsWrapper, _Component2);

    _createClass(DevToolsWrapper, null, [{
      key: 'propTypes',
      value: {
        monitor: PropTypes.func.isRequired,
        store: PropTypes.shape({
          devToolsStore: PropTypes.shape({
            dispatch: PropTypes.func.isRequired
          }).isRequired
        }).isRequired
      },
      enumerable: true
    }]);

    function DevToolsWrapper(props, context) {
      _classCallCheck(this, DevToolsWrapper);

      if (props.store && !props.store.devToolsStore) {
        console.error('Could not find the devTools store inside your store. ' + 'Have you applied devTools() store enhancer?');
      }
      _Component2.call(this, props, context);
    }

    DevToolsWrapper.prototype.render = function render() {
      return React.createElement(DevTools, _extends({}, this.props, {
        store: this.props.store.devToolsStore }));
    };

    return DevToolsWrapper;
  })(Component);
}

module.exports = exports['default'];
},{"./devTools":19,"react-redux/lib/components/createAll":155}],19:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = devTools;
var ActionTypes = {
  PERFORM_ACTION: 'PERFORM_ACTION',
  RESET: 'RESET',
  ROLLBACK: 'ROLLBACK',
  COMMIT: 'COMMIT',
  SWEEP: 'SWEEP',
  TOGGLE_ACTION: 'TOGGLE_ACTION',
  JUMP_TO_STATE: 'JUMP_TO_STATE',
  SET_MONITOR_STATE: 'SET_MONITOR_STATE',
  RECOMPUTE_STATES: 'RECOMPUTE_STATES'
};

var INIT_ACTION = {
  type: '@@INIT'
};

function toggle(obj, key) {
  var clone = _extends({}, obj);
  if (clone[key]) {
    delete clone[key];
  } else {
    clone[key] = true;
  }
  return clone;
}

/**
 * Computes the next entry in the log by applying an action.
 */
function computeNextEntry(reducer, action, state, error) {
  if (error) {
    return {
      state: state,
      error: 'Interrupted by an error up the chain'
    };
  }

  var nextState = state;
  var nextError = undefined;
  try {
    nextState = reducer(state, action);
  } catch (err) {
    nextError = err.toString();
    console.error(err.stack || err);
  }

  return {
    state: nextState,
    error: nextError
  };
}

/**
 * Runs the reducer on all actions to get a fresh computation log.
 * It's probably a good idea to do this only if the code has changed,
 * but until we have some tests we'll just do it every time an action fires.
 */
function recomputeStates(reducer, committedState, stagedActions, skippedActions) {
  var computedStates = [];

  for (var i = 0; i < stagedActions.length; i++) {
    var action = stagedActions[i];

    var previousEntry = computedStates[i - 1];
    var previousState = previousEntry ? previousEntry.state : committedState;
    var previousError = previousEntry ? previousEntry.error : undefined;

    var shouldSkip = Boolean(skippedActions[i]);
    var entry = shouldSkip ? previousEntry : computeNextEntry(reducer, action, previousState, previousError);

    computedStates.push(entry);
  }

  return computedStates;
}

/**
 * Lifts the app state reducer into a DevTools state reducer.
 */
function liftReducer(reducer, initialState) {
  var initialLiftedState = {
    committedState: initialState,
    stagedActions: [INIT_ACTION],
    skippedActions: {},
    currentStateIndex: 0,
    monitorState: {
      isVisible: true
    },
    timestamps: [Date.now()]
  };

  /**
   * Manages how the DevTools actions modify the DevTools state.
   */
  return function liftedReducer(liftedState, liftedAction) {
    if (liftedState === undefined) liftedState = initialLiftedState;

    var shouldRecomputeStates = true;
    var committedState = liftedState.committedState;
    var stagedActions = liftedState.stagedActions;
    var skippedActions = liftedState.skippedActions;
    var computedStates = liftedState.computedStates;
    var currentStateIndex = liftedState.currentStateIndex;
    var monitorState = liftedState.monitorState;
    var timestamps = liftedState.timestamps;

    switch (liftedAction.type) {
      case ActionTypes.RESET:
        committedState = initialState;
        stagedActions = [INIT_ACTION];
        skippedActions = {};
        currentStateIndex = 0;
        timestamps = [liftedAction.timestamp];
        break;
      case ActionTypes.COMMIT:
        committedState = computedStates[currentStateIndex].state;
        stagedActions = [INIT_ACTION];
        skippedActions = {};
        currentStateIndex = 0;
        timestamps = [liftedAction.timestamp];
        break;
      case ActionTypes.ROLLBACK:
        stagedActions = [INIT_ACTION];
        skippedActions = {};
        currentStateIndex = 0;
        timestamps = [liftedAction.timestamp];
        break;
      case ActionTypes.TOGGLE_ACTION:
        skippedActions = toggle(skippedActions, liftedAction.index);
        break;
      case ActionTypes.JUMP_TO_STATE:
        currentStateIndex = liftedAction.index;
        // Optimization: we know the history has not changed.
        shouldRecomputeStates = false;
        break;
      case ActionTypes.SWEEP:
        stagedActions = stagedActions.filter(function (_, i) {
          return !skippedActions[i];
        });
        timestamps = timestamps.filter(function (_, i) {
          return !skippedActions[i];
        });
        skippedActions = {};
        currentStateIndex = Math.min(currentStateIndex, stagedActions.length - 1);
        break;
      case ActionTypes.PERFORM_ACTION:
        if (currentStateIndex === stagedActions.length - 1) {
          currentStateIndex++;
        }

        stagedActions = [].concat(stagedActions, [liftedAction.action]);
        timestamps = [].concat(timestamps, [liftedAction.timestamp]);

        // Optimization: we know that the past has not changed.
        shouldRecomputeStates = false;
        // Instead of recomputing the states, append the next one.
        var previousEntry = computedStates[computedStates.length - 1];
        var nextEntry = computeNextEntry(reducer, liftedAction.action, previousEntry.state, previousEntry.error);
        computedStates = [].concat(computedStates, [nextEntry]);
        break;
      case ActionTypes.SET_MONITOR_STATE:
        monitorState = liftedAction.monitorState;
        break;
      case ActionTypes.RECOMPUTE_STATES:
        stagedActions = liftedAction.stagedActions;
        timestamps = liftedAction.timestamps;
        committedState = liftedAction.committedState;
        currentStateIndex = stagedActions.length - 1;
        skippedActions = {};
        break;
      default:
        break;
    }

    if (shouldRecomputeStates) {
      computedStates = recomputeStates(reducer, committedState, stagedActions, skippedActions);
    }

    return {
      committedState: committedState,
      stagedActions: stagedActions,
      skippedActions: skippedActions,
      computedStates: computedStates,
      currentStateIndex: currentStateIndex,
      monitorState: monitorState,
      timestamps: timestamps
    };
  };
}

/**
 * Lifts an app action to a DevTools action.
 */
function liftAction(action) {
  var liftedAction = {
    type: ActionTypes.PERFORM_ACTION,
    action: action,
    timestamp: Date.now()
  };
  return liftedAction;
}

/**
 * Unlifts the DevTools state to the app state.
 */
function unliftState(liftedState) {
  var computedStates = liftedState.computedStates;
  var currentStateIndex = liftedState.currentStateIndex;
  var state = computedStates[currentStateIndex].state;

  return state;
}

/**
 * Unlifts the DevTools store to act like the app's store.
 */
function unliftStore(liftedStore, reducer) {
  var lastDefinedState = undefined;
  return _extends({}, liftedStore, {
    devToolsStore: liftedStore,
    dispatch: function dispatch(action) {
      liftedStore.dispatch(liftAction(action));
      return action;
    },
    getState: function getState() {
      var state = unliftState(liftedStore.getState());
      if (state !== undefined) {
        lastDefinedState = state;
      }
      return lastDefinedState;
    },
    getReducer: function getReducer() {
      return reducer;
    },
    replaceReducer: function replaceReducer(nextReducer) {
      liftedStore.replaceReducer(liftReducer(nextReducer));
    }
  });
}

/**
 * Action creators to change the DevTools state.
 */
var ActionCreators = {
  reset: function reset() {
    return { type: ActionTypes.RESET, timestamp: Date.now() };
  },
  rollback: function rollback() {
    return { type: ActionTypes.ROLLBACK, timestamp: Date.now() };
  },
  commit: function commit() {
    return { type: ActionTypes.COMMIT, timestamp: Date.now() };
  },
  sweep: function sweep() {
    return { type: ActionTypes.SWEEP };
  },
  toggleAction: function toggleAction(index) {
    return { type: ActionTypes.TOGGLE_ACTION, index: index };
  },
  jumpToState: function jumpToState(index) {
    return { type: ActionTypes.JUMP_TO_STATE, index: index };
  },
  setMonitorState: function setMonitorState(monitorState) {
    return { type: ActionTypes.SET_MONITOR_STATE, monitorState: monitorState };
  },
  recomputeStates: function recomputeStates(committedState, stagedActions) {
    return {
      type: ActionTypes.RECOMPUTE_STATES,
      committedState: committedState,
      stagedActions: stagedActions
    };
  }
};

exports.ActionCreators = ActionCreators;
/**
 * Redux DevTools middleware.
 */

function devTools() {
  return function (next) {
    return function (reducer, initialState) {
      var liftedReducer = liftReducer(reducer, initialState);
      var liftedStore = next(liftedReducer);
      var store = unliftStore(liftedStore, reducer);
      return store;
    };
  };
}
},{}],20:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequire(obj) { return obj && obj.__esModule ? obj['default'] : obj; }

var _devTools = require('./devTools');

exports.devTools = _interopRequire(_devTools);

var _persistState = require('./persistState');

exports.persistState = _interopRequire(_persistState);
},{"./devTools":19,"./persistState":21}],21:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = persistState;

function persistState(sessionId) {
  var stateDeserializer = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
  var actionDeserializer = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  if (!sessionId) {
    return function (next) {
      return function () {
        return next.apply(undefined, arguments);
      };
    };
  }

  function deserializeState(fullState) {
    return _extends({}, fullState, {
      committedState: stateDeserializer(fullState.committedState),
      computedStates: fullState.computedStates.map(function (computedState) {
        return _extends({}, computedState, {
          state: stateDeserializer(computedState.state)
        });
      })
    });
  }

  function deserializeActions(fullState) {
    return _extends({}, fullState, {
      stagedActions: fullState.stagedActions.map(function (action) {
        return actionDeserializer(action);
      })
    });
  }

  function deserialize(fullState) {
    if (!fullState) {
      return fullState;
    }
    var deserializedState = fullState;
    if (typeof stateDeserializer === 'function') {
      deserializedState = deserializeState(deserializedState);
    }
    if (typeof actionDeserializer === 'function') {
      deserializedState = deserializeActions(deserializedState);
    }
    return deserializedState;
  }

  return function (next) {
    return function (reducer, initialState) {
      var key = 'redux-dev-session-' + sessionId;

      var finalInitialState = undefined;
      try {
        finalInitialState = deserialize(JSON.parse(localStorage.getItem(key))) || initialState;
        next(reducer, initialState);
      } catch (e) {
        console.warn('Could not read debug session from localStorage:', e);
        try {
          localStorage.removeItem(key);
        } finally {
          finalInitialState = undefined;
        }
      }

      var store = next(reducer, finalInitialState);

      return _extends({}, store, {
        dispatch: function dispatch(action) {
          store.dispatch(action);

          try {
            localStorage.setItem(key, JSON.stringify(store.getState()));
          } catch (e) {
            console.warn('Could not write debug session to localStorage:', e);
          }

          return action;
        }
      });
    };
  };
}

module.exports = exports['default'];
},{}],22:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.getDefaultStyle = getDefaultStyle;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function getDefaultStyle(props) {
  var left = props.left;
  var right = props.right;
  var bottom = props.bottom;
  var top = props.top;

  if (typeof left === 'undefined' && typeof right === 'undefined') {
    right = true;
  }
  if (typeof top === 'undefined' && typeof bottom === 'undefined') {
    bottom = true;
  }

  return {
    position: 'fixed',
    zIndex: 10000,
    fontSize: 17,
    overflow: 'hidden',
    opacity: 1,
    color: 'white',
    left: left ? 0 : undefined,
    right: right ? 0 : undefined,
    top: top ? 0 : undefined,
    bottom: bottom ? 0 : undefined,
    maxHeight: bottom && top ? '100%' : '30%',
    maxWidth: left && right ? '100%' : '30%',
    wordWrap: 'break-word',
    boxSizing: 'border-box',
    boxShadow: '-2px 0 7px 0 rgba(0, 0, 0, 0.5)'
  };
}

var DebugPanel = (function (_Component) {
  _inherits(DebugPanel, _Component);

  function DebugPanel() {
    _classCallCheck(this, DebugPanel);

    _Component.apply(this, arguments);
  }

  DebugPanel.prototype.render = function render() {
    return _react2['default'].createElement(
      'div',
      { style: _extends({}, this.props.getStyle(this.props), this.props.style) },
      this.props.children
    );
  };

  _createClass(DebugPanel, null, [{
    key: 'propTypes',
    value: {
      left: _react.PropTypes.bool,
      right: _react.PropTypes.bool,
      bottom: _react.PropTypes.bool,
      top: _react.PropTypes.bool,
      getStyle: _react.PropTypes.func.isRequired
    },
    enumerable: true
  }, {
    key: 'defaultProps',
    value: {
      getStyle: getDefaultStyle
    },
    enumerable: true
  }]);

  return DebugPanel;
})(_react.Component);

exports['default'] = DebugPanel;
},{"react":"react"}],23:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _LogMonitorEntry = require('./LogMonitorEntry');

var _LogMonitorEntry2 = _interopRequireDefault(_LogMonitorEntry);

var _LogMonitorButton = require('./LogMonitorButton');

var _LogMonitorButton2 = _interopRequireDefault(_LogMonitorButton);

var _themes = require('./themes');

var themes = _interopRequireWildcard(_themes);

var styles = {
  container: {
    fontFamily: 'monaco, Consolas, Lucida Console, monospace',
    position: 'relative',
    overflowY: 'hidden',
    width: '100%',
    height: '100%',
    minWidth: 300
  },
  buttonBar: {
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: 'transparent',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'row'
  },
  elements: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 38,
    bottom: 0,
    overflowX: 'hidden',
    overflowY: 'auto'
  }
};

var LogMonitor = (function (_Component) {
  _inherits(LogMonitor, _Component);

  function LogMonitor(props) {
    _classCallCheck(this, LogMonitor);

    _Component.call(this, props);
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyPress.bind(this));
    }
  }

  LogMonitor.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    var node = _react.findDOMNode(this.refs.elements);
    if (!node) {
      this.scrollDown = true;
    } else if (this.props.stagedActions.length < nextProps.stagedActions.length) {
      var scrollTop = node.scrollTop;
      var offsetHeight = node.offsetHeight;
      var scrollHeight = node.scrollHeight;

      this.scrollDown = Math.abs(scrollHeight - (scrollTop + offsetHeight)) < 20;
    } else {
      this.scrollDown = false;
    }
  };

  LogMonitor.prototype.componentDidUpdate = function componentDidUpdate() {
    var node = _react.findDOMNode(this.refs.elements);
    if (!node) {
      return;
    }
    if (this.scrollDown) {
      var offsetHeight = node.offsetHeight;
      var scrollHeight = node.scrollHeight;

      node.scrollTop = scrollHeight - offsetHeight;
      this.scrollDown = false;
    }
  };

  LogMonitor.prototype.componentWillMount = function componentWillMount() {
    var visibleOnLoad = this.props.visibleOnLoad;
    var monitorState = this.props.monitorState;

    this.props.setMonitorState(_extends({}, monitorState, {
      isVisible: visibleOnLoad
    }));
  };

  LogMonitor.prototype.handleRollback = function handleRollback() {
    this.props.rollback();
  };

  LogMonitor.prototype.handleSweep = function handleSweep() {
    this.props.sweep();
  };

  LogMonitor.prototype.handleCommit = function handleCommit() {
    this.props.commit();
  };

  LogMonitor.prototype.handleToggleAction = function handleToggleAction(index) {
    this.props.toggleAction(index);
  };

  LogMonitor.prototype.handleReset = function handleReset() {
    this.props.reset();
  };

  LogMonitor.prototype.handleKeyPress = function handleKeyPress(event) {
    var monitorState = this.props.monitorState;

    if (event.ctrlKey && event.keyCode === 72) {
      // Ctrl+H
      event.preventDefault();
      this.props.setMonitorState(_extends({}, monitorState, {
        isVisible: !monitorState.isVisible
      }));
    }
  };

  LogMonitor.prototype.render = function render() {
    var elements = [];
    var _props = this.props;
    var monitorState = _props.monitorState;
    var skippedActions = _props.skippedActions;
    var stagedActions = _props.stagedActions;
    var computedStates = _props.computedStates;
    var select = _props.select;

    var theme = undefined;
    if (typeof this.props.theme === 'string') {
      if (typeof themes[this.props.theme] !== 'undefined') {
        theme = themes[this.props.theme];
      } else {
        console.warn('DevTools theme ' + this.props.theme + ' not found, defaulting to nicinabox');
        theme = themes.nicinabox;
      }
    } else {
      theme = this.props.theme;
    }
    if (!monitorState.isVisible) {
      return null;
    }

    for (var i = 0; i < stagedActions.length; i++) {
      var action = stagedActions[i];
      var _computedStates$i = computedStates[i];
      var state = _computedStates$i.state;
      var error = _computedStates$i.error;

      var previousState = undefined;
      if (i > 0) {
        previousState = computedStates[i - 1].state;
      }
      elements.push(_react2['default'].createElement(_LogMonitorEntry2['default'], { key: i,
        index: i,
        theme: theme,
        select: select,
        action: action,
        state: state,
        previousState: previousState,
        collapsed: skippedActions[i],
        error: error,
        onActionClick: this.handleToggleAction.bind(this) }));
    }

    return _react2['default'].createElement(
      'div',
      { style: _extends({}, styles.container, { backgroundColor: theme.base00 }) },
      _react2['default'].createElement(
        'div',
        { style: _extends({}, styles.buttonBar, { borderColor: theme.base02 }) },
        _react2['default'].createElement(
          _LogMonitorButton2['default'],
          { theme: theme, onClick: this.handleReset.bind(this) },
          'Reset'
        ),
        _react2['default'].createElement(
          _LogMonitorButton2['default'],
          { theme: theme, onClick: this.handleRollback.bind(this), enabled: computedStates.length },
          'Revert'
        ),
        _react2['default'].createElement(
          _LogMonitorButton2['default'],
          { theme: theme, onClick: this.handleSweep.bind(this), enabled: Object.keys(skippedActions).some(function (key) {
              return skippedActions[key];
            }) },
          'Sweep'
        ),
        _react2['default'].createElement(
          _LogMonitorButton2['default'],
          { theme: theme, onClick: this.handleCommit.bind(this), enabled: computedStates.length > 1 },
          'Commit'
        )
      ),
      _react2['default'].createElement(
        'div',
        { style: styles.elements, ref: 'elements' },
        elements
      )
    );
  };

  _createClass(LogMonitor, null, [{
    key: 'propTypes',
    value: {
      computedStates: _react.PropTypes.array.isRequired,
      currentStateIndex: _react.PropTypes.number.isRequired,
      monitorState: _react.PropTypes.object.isRequired,
      stagedActions: _react.PropTypes.array.isRequired,
      skippedActions: _react.PropTypes.object.isRequired,
      reset: _react.PropTypes.func.isRequired,
      commit: _react.PropTypes.func.isRequired,
      rollback: _react.PropTypes.func.isRequired,
      sweep: _react.PropTypes.func.isRequired,
      toggleAction: _react.PropTypes.func.isRequired,
      jumpToState: _react.PropTypes.func.isRequired,
      setMonitorState: _react.PropTypes.func.isRequired,
      select: _react.PropTypes.func.isRequired,
      visibleOnLoad: _react.PropTypes.bool,
      theme: _react.PropTypes.oneOfType([_react.PropTypes.object, _react.PropTypes.string])
    },
    enumerable: true
  }, {
    key: 'defaultProps',
    value: {
      select: function select(state) {
        return state;
      },
      monitorState: { isVisible: true },
      theme: 'nicinabox',
      visibleOnLoad: true
    },
    enumerable: true
  }]);

  return LogMonitor;
})(_react.Component);

exports['default'] = LogMonitor;
module.exports = exports['default'];
},{"./LogMonitorButton":24,"./LogMonitorEntry":25,"./themes":50,"react":"react"}],24:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _utilsBrighten = require('../utils/brighten');

var _utilsBrighten2 = _interopRequireDefault(_utilsBrighten);

var styles = {
  base: {
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: 3,
    padding: 4,
    marginLeft: 3,
    marginRight: 3,
    marginTop: 5,
    marginBottom: 5,
    flexGrow: 1,
    display: 'inline-block',
    fontSize: '0.8em',
    color: 'white',
    textDecoration: 'none'
  }
};

var LogMonitorButton = (function (_React$Component) {
  _inherits(LogMonitorButton, _React$Component);

  function LogMonitorButton(props) {
    _classCallCheck(this, LogMonitorButton);

    _React$Component.call(this, props);
    this.state = {
      hovered: false,
      active: false
    };
  }

  LogMonitorButton.prototype.handleMouseEnter = function handleMouseEnter() {
    this.setState({ hovered: true });
  };

  LogMonitorButton.prototype.handleMouseLeave = function handleMouseLeave() {
    this.setState({ hovered: false });
  };

  LogMonitorButton.prototype.handleMouseDown = function handleMouseDown() {
    this.setState({ active: true });
  };

  LogMonitorButton.prototype.handleMouseUp = function handleMouseUp() {
    this.setState({ active: false });
  };

  LogMonitorButton.prototype.onClick = function onClick() {
    if (!this.props.enabled) {
      return;
    }
    if (this.props.onClick) {
      this.props.onClick();
    }
  };

  LogMonitorButton.prototype.render = function render() {
    var style = _extends({}, styles.base, {
      backgroundColor: this.props.theme.base02
    });
    if (this.props.enabled && this.state.hovered) {
      style = _extends({}, style, {
        backgroundColor: _utilsBrighten2['default'](this.props.theme.base02, 0.2)
      });
    }
    if (!this.props.enabled) {
      style = _extends({}, style, {
        opacity: 0.2,
        cursor: 'text',
        backgroundColor: 'transparent'
      });
    }
    return _react2['default'].createElement(
      'a',
      { onMouseEnter: this.handleMouseEnter.bind(this),
        onMouseLeave: this.handleMouseLeave.bind(this),
        onMouseDown: this.handleMouseDown.bind(this),
        onMouseUp: this.handleMouseUp.bind(this),
        style: style, onClick: this.onClick.bind(this) },
      this.props.children
    );
  };

  return LogMonitorButton;
})(_react2['default'].Component);

exports['default'] = LogMonitorButton;
module.exports = exports['default'];
},{"../utils/brighten":67,"react":"react"}],25:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactJsonTree = require('react-json-tree');

var _reactJsonTree2 = _interopRequireDefault(_reactJsonTree);

var _LogMonitorEntryAction = require('./LogMonitorEntryAction');

var _LogMonitorEntryAction2 = _interopRequireDefault(_LogMonitorEntryAction);

var styles = {
  entry: {
    display: 'block',
    WebkitUserSelect: 'none'
  },
  tree: {
    paddingLeft: 0
  }
};

var LogMonitorEntry = (function (_Component) {
  _inherits(LogMonitorEntry, _Component);

  function LogMonitorEntry() {
    _classCallCheck(this, LogMonitorEntry);

    _Component.apply(this, arguments);
  }

  LogMonitorEntry.prototype.printState = function printState(state, error) {
    var errorText = error;
    if (!errorText) {
      try {
        return _react2['default'].createElement(_reactJsonTree2['default'], {
          theme: this.props.theme,
          keyName: 'state',
          data: this.props.select(state),
          previousData: this.props.select(this.props.previousState),
          style: styles.tree });
      } catch (err) {
        errorText = 'Error selecting state.';
      }
    }
    return _react2['default'].createElement(
      'div',
      { style: {
          color: this.props.theme.base08,
          paddingTop: 20,
          paddingLeft: 30,
          paddingRight: 30,
          paddingBottom: 35
        } },
      errorText
    );
  };

  LogMonitorEntry.prototype.handleActionClick = function handleActionClick() {
    var _props = this.props;
    var index = _props.index;
    var onActionClick = _props.onActionClick;

    if (index > 0) {
      onActionClick(index);
    }
  };

  LogMonitorEntry.prototype.render = function render() {
    var _props2 = this.props;
    var index = _props2.index;
    var error = _props2.error;
    var action = _props2.action;
    var state = _props2.state;
    var collapsed = _props2.collapsed;

    var styleEntry = {
      opacity: collapsed ? 0.5 : 1,
      cursor: index > 0 ? 'pointer' : 'default'
    };
    return _react2['default'].createElement(
      'div',
      { style: { textDecoration: collapsed ? 'line-through' : 'none' } },
      _react2['default'].createElement(_LogMonitorEntryAction2['default'], {
        theme: this.props.theme,
        collapsed: collapsed,
        action: action,
        onClick: this.handleActionClick.bind(this),
        style: _extends({}, styles.entry, styleEntry) }),
      !collapsed && _react2['default'].createElement(
        'div',
        null,
        this.printState(state, error)
      )
    );
  };

  _createClass(LogMonitorEntry, null, [{
    key: 'propTypes',
    value: {
      index: _react.PropTypes.number.isRequired,
      state: _react.PropTypes.object.isRequired,
      action: _react.PropTypes.object.isRequired,
      select: _react.PropTypes.func.isRequired,
      error: _react.PropTypes.string,
      onActionClick: _react.PropTypes.func.isRequired,
      collapsed: _react.PropTypes.bool
    },
    enumerable: true
  }]);

  return LogMonitorEntry;
})(_react.Component);

exports['default'] = LogMonitorEntry;
module.exports = exports['default'];
},{"./LogMonitorEntryAction":26,"react":"react","react-json-tree":78}],26:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactJsonTree = require('react-json-tree');

var _reactJsonTree2 = _interopRequireDefault(_reactJsonTree);

var styles = {
  actionBar: {
    paddingTop: 8,
    paddingBottom: 7,
    paddingLeft: 16
  },
  payload: {
    margin: 0,
    overflow: 'auto'
  }
};

var LogMonitorAction = (function (_React$Component) {
  _inherits(LogMonitorAction, _React$Component);

  function LogMonitorAction() {
    _classCallCheck(this, LogMonitorAction);

    _React$Component.apply(this, arguments);
  }

  LogMonitorAction.prototype.renderPayload = function renderPayload(payload) {
    return _react2['default'].createElement(
      'div',
      { style: _extends({}, styles.payload, {
          backgroundColor: this.props.theme.base00
        }) },
      Object.keys(payload).length > 0 ? _react2['default'].createElement(_reactJsonTree2['default'], { theme: this.props.theme, keyName: 'action', data: payload }) : ''
    );
  };

  LogMonitorAction.prototype.render = function render() {
    var _props$action = this.props.action;
    var type = _props$action.type;

    var payload = _objectWithoutProperties(_props$action, ['type']);

    return _react2['default'].createElement(
      'div',
      { style: _extends({
          backgroundColor: this.props.theme.base02,
          color: this.props.theme.base06
        }, this.props.style) },
      _react2['default'].createElement(
        'div',
        { style: styles.actionBar,
          onClick: this.props.onClick },
        type
      ),
      !this.props.collapsed ? this.renderPayload(payload) : ''
    );
  };

  return LogMonitorAction;
})(_react2['default'].Component);

exports['default'] = LogMonitorAction;
module.exports = exports['default'];
},{"react":"react","react-json-tree":78}],27:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequire(obj) { return obj && obj.__esModule ? obj['default'] : obj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createDevTools = require('../createDevTools');

var _createDevTools2 = _interopRequireDefault(_createDevTools);

var DevTools = _createDevTools2['default'](_react2['default']);
exports.DevTools = DevTools;

var _LogMonitor = require('./LogMonitor');

exports.LogMonitor = _interopRequire(_LogMonitor);

var _DebugPanel = require('./DebugPanel');

exports.DebugPanel = _interopRequire(_DebugPanel);
},{"../createDevTools":18,"./DebugPanel":22,"./LogMonitor":23,"react":"react"}],28:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'apathy',
  author: 'jannik siebert (https://github.com/janniks)',
  base00: '#031A16',
  base01: '#0B342D',
  base02: '#184E45',
  base03: '#2B685E',
  base04: '#5F9C92',
  base05: '#81B5AC',
  base06: '#A7CEC8',
  base07: '#D2E7E4',
  base08: '#3E9688',
  base09: '#3E7996',
  base0A: '#3E4C96',
  base0B: '#883E96',
  base0C: '#963E4C',
  base0D: '#96883E',
  base0E: '#4C963E',
  base0F: '#3E965B'
};
module.exports = exports['default'];
},{}],29:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'ashes',
  author: 'jannik siebert (https://github.com/janniks)',
  base00: '#1C2023',
  base01: '#393F45',
  base02: '#565E65',
  base03: '#747C84',
  base04: '#ADB3BA',
  base05: '#C7CCD1',
  base06: '#DFE2E5',
  base07: '#F3F4F5',
  base08: '#C7AE95',
  base09: '#C7C795',
  base0A: '#AEC795',
  base0B: '#95C7AE',
  base0C: '#95AEC7',
  base0D: '#AE95C7',
  base0E: '#C795AE',
  base0F: '#C79595'
};
module.exports = exports['default'];
},{}],30:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'atelier dune',
  author: 'bram de haan (http://atelierbram.github.io/syntax-highlighting/atelier-schemes/dune)',
  base00: '#20201d',
  base01: '#292824',
  base02: '#6e6b5e',
  base03: '#7d7a68',
  base04: '#999580',
  base05: '#a6a28c',
  base06: '#e8e4cf',
  base07: '#fefbec',
  base08: '#d73737',
  base09: '#b65611',
  base0A: '#cfb017',
  base0B: '#60ac39',
  base0C: '#1fad83',
  base0D: '#6684e1',
  base0E: '#b854d4',
  base0F: '#d43552'
};
module.exports = exports['default'];
},{}],31:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'atelier forest',
  author: 'bram de haan (http://atelierbram.github.io/syntax-highlighting/atelier-schemes/forest)',
  base00: '#1b1918',
  base01: '#2c2421',
  base02: '#68615e',
  base03: '#766e6b',
  base04: '#9c9491',
  base05: '#a8a19f',
  base06: '#e6e2e0',
  base07: '#f1efee',
  base08: '#f22c40',
  base09: '#df5320',
  base0A: '#d5911a',
  base0B: '#5ab738',
  base0C: '#00ad9c',
  base0D: '#407ee7',
  base0E: '#6666ea',
  base0F: '#c33ff3'
};
module.exports = exports['default'];
},{}],32:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'atelier heath',
  author: 'bram de haan (http://atelierbram.github.io/syntax-highlighting/atelier-schemes/heath)',
  base00: '#1b181b',
  base01: '#292329',
  base02: '#695d69',
  base03: '#776977',
  base04: '#9e8f9e',
  base05: '#ab9bab',
  base06: '#d8cad8',
  base07: '#f7f3f7',
  base08: '#ca402b',
  base09: '#a65926',
  base0A: '#bb8a35',
  base0B: '#379a37',
  base0C: '#159393',
  base0D: '#516aec',
  base0E: '#7b59c0',
  base0F: '#cc33cc'
};
module.exports = exports['default'];
},{}],33:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'atelier lakeside',
  author: 'bram de haan (http://atelierbram.github.io/syntax-highlighting/atelier-schemes/lakeside/)',
  base00: '#161b1d',
  base01: '#1f292e',
  base02: '#516d7b',
  base03: '#5a7b8c',
  base04: '#7195a8',
  base05: '#7ea2b4',
  base06: '#c1e4f6',
  base07: '#ebf8ff',
  base08: '#d22d72',
  base09: '#935c25',
  base0A: '#8a8a0f',
  base0B: '#568c3b',
  base0C: '#2d8f6f',
  base0D: '#257fad',
  base0E: '#5d5db1',
  base0F: '#b72dd2'
};
module.exports = exports['default'];
},{}],34:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'atelier seaside',
  author: 'bram de haan (http://atelierbram.github.io/syntax-highlighting/atelier-schemes/seaside/)',
  base00: '#131513',
  base01: '#242924',
  base02: '#5e6e5e',
  base03: '#687d68',
  base04: '#809980',
  base05: '#8ca68c',
  base06: '#cfe8cf',
  base07: '#f0fff0',
  base08: '#e6193c',
  base09: '#87711d',
  base0A: '#c3c322',
  base0B: '#29a329',
  base0C: '#1999b3',
  base0D: '#3d62f5',
  base0E: '#ad2bee',
  base0F: '#e619c3'
};
module.exports = exports['default'];
},{}],35:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'bespin',
  author: 'jan t. sott',
  base00: '#28211c',
  base01: '#36312e',
  base02: '#5e5d5c',
  base03: '#666666',
  base04: '#797977',
  base05: '#8a8986',
  base06: '#9d9b97',
  base07: '#baae9e',
  base08: '#cf6a4c',
  base09: '#cf7d34',
  base0A: '#f9ee98',
  base0B: '#54be0d',
  base0C: '#afc4db',
  base0D: '#5ea6ea',
  base0E: '#9b859d',
  base0F: '#937121'
};
module.exports = exports['default'];
},{}],36:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'brewer',
  author: 'timothée poisot (http://github.com/tpoisot)',
  base00: '#0c0d0e',
  base01: '#2e2f30',
  base02: '#515253',
  base03: '#737475',
  base04: '#959697',
  base05: '#b7b8b9',
  base06: '#dadbdc',
  base07: '#fcfdfe',
  base08: '#e31a1c',
  base09: '#e6550d',
  base0A: '#dca060',
  base0B: '#31a354',
  base0C: '#80b1d3',
  base0D: '#3182bd',
  base0E: '#756bb1',
  base0F: '#b15928'
};
module.exports = exports['default'];
},{}],37:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'bright',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#000000',
  base01: '#303030',
  base02: '#505050',
  base03: '#b0b0b0',
  base04: '#d0d0d0',
  base05: '#e0e0e0',
  base06: '#f5f5f5',
  base07: '#ffffff',
  base08: '#fb0120',
  base09: '#fc6d24',
  base0A: '#fda331',
  base0B: '#a1c659',
  base0C: '#76c7b7',
  base0D: '#6fb3d2',
  base0E: '#d381c3',
  base0F: '#be643c'
};
module.exports = exports['default'];
},{}],38:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'chalk',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#151515',
  base01: '#202020',
  base02: '#303030',
  base03: '#505050',
  base04: '#b0b0b0',
  base05: '#d0d0d0',
  base06: '#e0e0e0',
  base07: '#f5f5f5',
  base08: '#fb9fb1',
  base09: '#eda987',
  base0A: '#ddb26f',
  base0B: '#acc267',
  base0C: '#12cfc0',
  base0D: '#6fc2ef',
  base0E: '#e1a3ee',
  base0F: '#deaf8f'
};
module.exports = exports['default'];
},{}],39:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'codeschool',
  author: 'brettof86',
  base00: '#232c31',
  base01: '#1c3657',
  base02: '#2a343a',
  base03: '#3f4944',
  base04: '#84898c',
  base05: '#9ea7a6',
  base06: '#a7cfa3',
  base07: '#b5d8f6',
  base08: '#2a5491',
  base09: '#43820d',
  base0A: '#a03b1e',
  base0B: '#237986',
  base0C: '#b02f30',
  base0D: '#484d79',
  base0E: '#c59820',
  base0F: '#c98344'
};
module.exports = exports['default'];
},{}],40:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'colors',
  author: 'mrmrs (http://clrs.cc)',
  base00: '#111111',
  base01: '#333333',
  base02: '#555555',
  base03: '#777777',
  base04: '#999999',
  base05: '#bbbbbb',
  base06: '#dddddd',
  base07: '#ffffff',
  base08: '#ff4136',
  base09: '#ff851b',
  base0A: '#ffdc00',
  base0B: '#2ecc40',
  base0C: '#7fdbff',
  base0D: '#0074d9',
  base0E: '#b10dc9',
  base0F: '#85144b'
};
module.exports = exports['default'];
},{}],41:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'default',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#181818',
  base01: '#282828',
  base02: '#383838',
  base03: '#585858',
  base04: '#b8b8b8',
  base05: '#d8d8d8',
  base06: '#e8e8e8',
  base07: '#f8f8f8',
  base08: '#ab4642',
  base09: '#dc9656',
  base0A: '#f7ca88',
  base0B: '#a1b56c',
  base0C: '#86c1b9',
  base0D: '#7cafc2',
  base0E: '#ba8baf',
  base0F: '#a16946'
};
module.exports = exports['default'];
},{}],42:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'eighties',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#2d2d2d',
  base01: '#393939',
  base02: '#515151',
  base03: '#747369',
  base04: '#a09f93',
  base05: '#d3d0c8',
  base06: '#e8e6df',
  base07: '#f2f0ec',
  base08: '#f2777a',
  base09: '#f99157',
  base0A: '#ffcc66',
  base0B: '#99cc99',
  base0C: '#66cccc',
  base0D: '#6699cc',
  base0E: '#cc99cc',
  base0F: '#d27b53'
};
module.exports = exports['default'];
},{}],43:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'embers',
  author: 'jannik siebert (https://github.com/janniks)',
  base00: '#16130F',
  base01: '#2C2620',
  base02: '#433B32',
  base03: '#5A5047',
  base04: '#8A8075',
  base05: '#A39A90',
  base06: '#BEB6AE',
  base07: '#DBD6D1',
  base08: '#826D57',
  base09: '#828257',
  base0A: '#6D8257',
  base0B: '#57826D',
  base0C: '#576D82',
  base0D: '#6D5782',
  base0E: '#82576D',
  base0F: '#825757'
};
module.exports = exports['default'];
},{}],44:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'flat',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#2C3E50',
  base01: '#34495E',
  base02: '#7F8C8D',
  base03: '#95A5A6',
  base04: '#BDC3C7',
  base05: '#e0e0e0',
  base06: '#f5f5f5',
  base07: '#ECF0F1',
  base08: '#E74C3C',
  base09: '#E67E22',
  base0A: '#F1C40F',
  base0B: '#2ECC71',
  base0C: '#1ABC9C',
  base0D: '#3498DB',
  base0E: '#9B59B6',
  base0F: '#be643c'
};
module.exports = exports['default'];
},{}],45:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'google',
  author: 'seth wright (http://sethawright.com)',
  base00: '#1d1f21',
  base01: '#282a2e',
  base02: '#373b41',
  base03: '#969896',
  base04: '#b4b7b4',
  base05: '#c5c8c6',
  base06: '#e0e0e0',
  base07: '#ffffff',
  base08: '#CC342B',
  base09: '#F96A38',
  base0A: '#FBA922',
  base0B: '#198844',
  base0C: '#3971ED',
  base0D: '#3971ED',
  base0E: '#A36AC7',
  base0F: '#3971ED'
};
module.exports = exports['default'];
},{}],46:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'grayscale',
  author: 'alexandre gavioli (https://github.com/alexx2/)',
  base00: '#101010',
  base01: '#252525',
  base02: '#464646',
  base03: '#525252',
  base04: '#ababab',
  base05: '#b9b9b9',
  base06: '#e3e3e3',
  base07: '#f7f7f7',
  base08: '#7c7c7c',
  base09: '#999999',
  base0A: '#a0a0a0',
  base0B: '#8e8e8e',
  base0C: '#868686',
  base0D: '#686868',
  base0E: '#747474',
  base0F: '#5e5e5e'
};
module.exports = exports['default'];
},{}],47:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'green screen',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#001100',
  base01: '#003300',
  base02: '#005500',
  base03: '#007700',
  base04: '#009900',
  base05: '#00bb00',
  base06: '#00dd00',
  base07: '#00ff00',
  base08: '#007700',
  base09: '#009900',
  base0A: '#007700',
  base0B: '#00bb00',
  base0C: '#005500',
  base0D: '#009900',
  base0E: '#00bb00',
  base0F: '#005500'
};
module.exports = exports['default'];
},{}],48:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'harmonic16',
  author: 'jannik siebert (https://github.com/janniks)',
  base00: '#0b1c2c',
  base01: '#223b54',
  base02: '#405c79',
  base03: '#627e99',
  base04: '#aabcce',
  base05: '#cbd6e2',
  base06: '#e5ebf1',
  base07: '#f7f9fb',
  base08: '#bf8b56',
  base09: '#bfbf56',
  base0A: '#8bbf56',
  base0B: '#56bf8b',
  base0C: '#568bbf',
  base0D: '#8b56bf',
  base0E: '#bf568b',
  base0F: '#bf5656'
};
module.exports = exports['default'];
},{}],49:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'hopscotch',
  author: 'jan t. sott',
  base00: '#322931',
  base01: '#433b42',
  base02: '#5c545b',
  base03: '#797379',
  base04: '#989498',
  base05: '#b9b5b8',
  base06: '#d5d3d5',
  base07: '#ffffff',
  base08: '#dd464c',
  base09: '#fd8b19',
  base0A: '#fdcc59',
  base0B: '#8fc13e',
  base0C: '#149b93',
  base0D: '#1290bf',
  base0E: '#c85e7c',
  base0F: '#b33508'
};
module.exports = exports['default'];
},{}],50:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequire(obj) { return obj && obj.__esModule ? obj['default'] : obj; }

var _threezerotwofour = require('./threezerotwofour');

exports.threezerotwofour = _interopRequire(_threezerotwofour);

var _apathy = require('./apathy');

exports.apathy = _interopRequire(_apathy);

var _ashes = require('./ashes');

exports.ashes = _interopRequire(_ashes);

var _atelierDune = require('./atelier-dune');

exports.atelierDune = _interopRequire(_atelierDune);

var _atelierForest = require('./atelier-forest');

exports.atelierForest = _interopRequire(_atelierForest);

var _atelierHeath = require('./atelier-heath');

exports.atelierHeath = _interopRequire(_atelierHeath);

var _atelierLakeside = require('./atelier-lakeside');

exports.atelierLakeside = _interopRequire(_atelierLakeside);

var _atelierSeaside = require('./atelier-seaside');

exports.atelierSeaside = _interopRequire(_atelierSeaside);

var _bespin = require('./bespin');

exports.bespin = _interopRequire(_bespin);

var _brewer = require('./brewer');

exports.brewer = _interopRequire(_brewer);

var _bright = require('./bright');

exports.bright = _interopRequire(_bright);

var _chalk = require('./chalk');

exports.chalk = _interopRequire(_chalk);

var _codeschool = require('./codeschool');

exports.codeschool = _interopRequire(_codeschool);

var _colors = require('./colors');

exports.colors = _interopRequire(_colors);

var _default = require('./default');

exports['default'] = _interopRequire(_default);

var _eighties = require('./eighties');

exports.eighties = _interopRequire(_eighties);

var _embers = require('./embers');

exports.embers = _interopRequire(_embers);

var _flat = require('./flat');

exports.flat = _interopRequire(_flat);

var _google = require('./google');

exports.google = _interopRequire(_google);

var _grayscale = require('./grayscale');

exports.grayscale = _interopRequire(_grayscale);

var _greenscreen = require('./greenscreen');

exports.greenscreen = _interopRequire(_greenscreen);

var _harmonic = require('./harmonic');

exports.harmonic = _interopRequire(_harmonic);

var _hopscotch = require('./hopscotch');

exports.hopscotch = _interopRequire(_hopscotch);

var _isotope = require('./isotope');

exports.isotope = _interopRequire(_isotope);

var _marrakesh = require('./marrakesh');

exports.marrakesh = _interopRequire(_marrakesh);

var _mocha = require('./mocha');

exports.mocha = _interopRequire(_mocha);

var _monokai = require('./monokai');

exports.monokai = _interopRequire(_monokai);

var _ocean = require('./ocean');

exports.ocean = _interopRequire(_ocean);

var _paraiso = require('./paraiso');

exports.paraiso = _interopRequire(_paraiso);

var _pop = require('./pop');

exports.pop = _interopRequire(_pop);

var _railscasts = require('./railscasts');

exports.railscasts = _interopRequire(_railscasts);

var _shapeshifter = require('./shapeshifter');

exports.shapeshifter = _interopRequire(_shapeshifter);

var _solarized = require('./solarized');

exports.solarized = _interopRequire(_solarized);

var _summerfruit = require('./summerfruit');

exports.summerfruit = _interopRequire(_summerfruit);

var _tomorrow = require('./tomorrow');

exports.tomorrow = _interopRequire(_tomorrow);

var _tube = require('./tube');

exports.tube = _interopRequire(_tube);

var _twilight = require('./twilight');

exports.twilight = _interopRequire(_twilight);

var _nicinabox = require('./nicinabox');

exports.nicinabox = _interopRequire(_nicinabox);
},{"./apathy":28,"./ashes":29,"./atelier-dune":30,"./atelier-forest":31,"./atelier-heath":32,"./atelier-lakeside":33,"./atelier-seaside":34,"./bespin":35,"./brewer":36,"./bright":37,"./chalk":38,"./codeschool":39,"./colors":40,"./default":41,"./eighties":42,"./embers":43,"./flat":44,"./google":45,"./grayscale":46,"./greenscreen":47,"./harmonic":48,"./hopscotch":49,"./isotope":51,"./marrakesh":52,"./mocha":53,"./monokai":54,"./nicinabox":55,"./ocean":56,"./paraiso":57,"./pop":58,"./railscasts":59,"./shapeshifter":60,"./solarized":61,"./summerfruit":62,"./threezerotwofour":63,"./tomorrow":64,"./tube":65,"./twilight":66}],51:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'isotope',
  author: 'jan t. sott',
  base00: '#000000',
  base01: '#404040',
  base02: '#606060',
  base03: '#808080',
  base04: '#c0c0c0',
  base05: '#d0d0d0',
  base06: '#e0e0e0',
  base07: '#ffffff',
  base08: '#ff0000',
  base09: '#ff9900',
  base0A: '#ff0099',
  base0B: '#33ff00',
  base0C: '#00ffff',
  base0D: '#0066ff',
  base0E: '#cc00ff',
  base0F: '#3300ff'
};
module.exports = exports['default'];
},{}],52:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'marrakesh',
  author: 'alexandre gavioli (http://github.com/alexx2/)',
  base00: '#201602',
  base01: '#302e00',
  base02: '#5f5b17',
  base03: '#6c6823',
  base04: '#86813b',
  base05: '#948e48',
  base06: '#ccc37a',
  base07: '#faf0a5',
  base08: '#c35359',
  base09: '#b36144',
  base0A: '#a88339',
  base0B: '#18974e',
  base0C: '#75a738',
  base0D: '#477ca1',
  base0E: '#8868b3',
  base0F: '#b3588e'
};
module.exports = exports['default'];
},{}],53:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'mocha',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#3B3228',
  base01: '#534636',
  base02: '#645240',
  base03: '#7e705a',
  base04: '#b8afad',
  base05: '#d0c8c6',
  base06: '#e9e1dd',
  base07: '#f5eeeb',
  base08: '#cb6077',
  base09: '#d28b71',
  base0A: '#f4bc87',
  base0B: '#beb55b',
  base0C: '#7bbda4',
  base0D: '#8ab3b5',
  base0E: '#a89bb9',
  base0F: '#bb9584'
};
module.exports = exports['default'];
},{}],54:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#272822',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633'
};
module.exports = exports['default'];
},{}],55:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'nicinabox',
  author: 'nicinabox (http://github.com/nicinabox)',
  base00: '#2A2F3A',
  base01: '#3C444F',
  base02: '#4F5A65',
  base03: '#BEBEBE',
  base04: '#b0b0b0', // unmodified
  base05: '#d0d0d0', // unmodified
  base06: '#FFFFFF',
  base07: '#f5f5f5', // unmodified
  base08: '#fb9fb1', // unmodified
  base09: '#FC6D24',
  base0A: '#ddb26f', // unmodified
  base0B: '#A1C659',
  base0C: '#12cfc0', // unmodified
  base0D: '#6FB3D2',
  base0E: '#D381C3',
  base0F: '#deaf8f' // unmodified
};
module.exports = exports['default'];
},{}],56:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'ocean',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#2b303b',
  base01: '#343d46',
  base02: '#4f5b66',
  base03: '#65737e',
  base04: '#a7adba',
  base05: '#c0c5ce',
  base06: '#dfe1e8',
  base07: '#eff1f5',
  base08: '#bf616a',
  base09: '#d08770',
  base0A: '#ebcb8b',
  base0B: '#a3be8c',
  base0C: '#96b5b4',
  base0D: '#8fa1b3',
  base0E: '#b48ead',
  base0F: '#ab7967'
};
module.exports = exports['default'];
},{}],57:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'paraiso',
  author: 'jan t. sott',
  base00: '#2f1e2e',
  base01: '#41323f',
  base02: '#4f424c',
  base03: '#776e71',
  base04: '#8d8687',
  base05: '#a39e9b',
  base06: '#b9b6b0',
  base07: '#e7e9db',
  base08: '#ef6155',
  base09: '#f99b15',
  base0A: '#fec418',
  base0B: '#48b685',
  base0C: '#5bc4bf',
  base0D: '#06b6ef',
  base0E: '#815ba4',
  base0F: '#e96ba8'
};
module.exports = exports['default'];
},{}],58:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'pop',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#000000',
  base01: '#202020',
  base02: '#303030',
  base03: '#505050',
  base04: '#b0b0b0',
  base05: '#d0d0d0',
  base06: '#e0e0e0',
  base07: '#ffffff',
  base08: '#eb008a',
  base09: '#f29333',
  base0A: '#f8ca12',
  base0B: '#37b349',
  base0C: '#00aabb',
  base0D: '#0e5a94',
  base0E: '#b31e8d',
  base0F: '#7a2d00'
};
module.exports = exports['default'];
},{}],59:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'railscasts',
  author: 'ryan bates (http://railscasts.com)',
  base00: '#2b2b2b',
  base01: '#272935',
  base02: '#3a4055',
  base03: '#5a647e',
  base04: '#d4cfc9',
  base05: '#e6e1dc',
  base06: '#f4f1ed',
  base07: '#f9f7f3',
  base08: '#da4939',
  base09: '#cc7833',
  base0A: '#ffc66d',
  base0B: '#a5c261',
  base0C: '#519f50',
  base0D: '#6d9cbe',
  base0E: '#b6b3eb',
  base0F: '#bc9458'
};
module.exports = exports['default'];
},{}],60:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'shapeshifter',
  author: 'tyler benziger (http://tybenz.com)',
  base00: '#000000',
  base01: '#040404',
  base02: '#102015',
  base03: '#343434',
  base04: '#555555',
  base05: '#ababab',
  base06: '#e0e0e0',
  base07: '#f9f9f9',
  base08: '#e92f2f',
  base09: '#e09448',
  base0A: '#dddd13',
  base0B: '#0ed839',
  base0C: '#23edda',
  base0D: '#3b48e3',
  base0E: '#f996e2',
  base0F: '#69542d'
};
module.exports = exports['default'];
},{}],61:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'solarized',
  author: 'ethan schoonover (http://ethanschoonover.com/solarized)',
  base00: '#002b36',
  base01: '#073642',
  base02: '#586e75',
  base03: '#657b83',
  base04: '#839496',
  base05: '#93a1a1',
  base06: '#eee8d5',
  base07: '#fdf6e3',
  base08: '#dc322f',
  base09: '#cb4b16',
  base0A: '#b58900',
  base0B: '#859900',
  base0C: '#2aa198',
  base0D: '#268bd2',
  base0E: '#6c71c4',
  base0F: '#d33682'
};
module.exports = exports['default'];
},{}],62:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'summerfruit',
  author: 'christopher corley (http://cscorley.github.io/)',
  base00: '#151515',
  base01: '#202020',
  base02: '#303030',
  base03: '#505050',
  base04: '#B0B0B0',
  base05: '#D0D0D0',
  base06: '#E0E0E0',
  base07: '#FFFFFF',
  base08: '#FF0086',
  base09: '#FD8900',
  base0A: '#ABA800',
  base0B: '#00C918',
  base0C: '#1faaaa',
  base0D: '#3777E6',
  base0E: '#AD00A1',
  base0F: '#cc6633'
};
module.exports = exports['default'];
},{}],63:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'threezerotwofour',
  author: 'jan t. sott (http://github.com/idleberg)',
  base00: '#090300',
  base01: '#3a3432',
  base02: '#4a4543',
  base03: '#5c5855',
  base04: '#807d7c',
  base05: '#a5a2a2',
  base06: '#d6d5d4',
  base07: '#f7f7f7',
  base08: '#db2d20',
  base09: '#e8bbd0',
  base0A: '#fded02',
  base0B: '#01a252',
  base0C: '#b5e4f4',
  base0D: '#01a0e4',
  base0E: '#a16a94',
  base0F: '#cdab53'
};
module.exports = exports['default'];
},{}],64:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'tomorrow',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#1d1f21',
  base01: '#282a2e',
  base02: '#373b41',
  base03: '#969896',
  base04: '#b4b7b4',
  base05: '#c5c8c6',
  base06: '#e0e0e0',
  base07: '#ffffff',
  base08: '#cc6666',
  base09: '#de935f',
  base0A: '#f0c674',
  base0B: '#b5bd68',
  base0C: '#8abeb7',
  base0D: '#81a2be',
  base0E: '#b294bb',
  base0F: '#a3685a'
};
module.exports = exports['default'];
},{}],65:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'london tube',
  author: 'jan t. sott',
  base00: '#231f20',
  base01: '#1c3f95',
  base02: '#5a5758',
  base03: '#737171',
  base04: '#959ca1',
  base05: '#d9d8d8',
  base06: '#e7e7e8',
  base07: '#ffffff',
  base08: '#ee2e24',
  base09: '#f386a1',
  base0A: '#ffd204',
  base0B: '#00853e',
  base0C: '#85cebc',
  base0D: '#009ddc',
  base0E: '#98005d',
  base0F: '#b06110'
};
module.exports = exports['default'];
},{}],66:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = {
  scheme: 'twilight',
  author: 'david hart (http://hart-dev.com)',
  base00: '#1e1e1e',
  base01: '#323537',
  base02: '#464b50',
  base03: '#5f5a60',
  base04: '#838184',
  base05: '#a7a7a7',
  base06: '#c3c3c3',
  base07: '#ffffff',
  base08: '#cf6a4c',
  base09: '#cda869',
  base0A: '#f9ee98',
  base0B: '#8f9d6a',
  base0C: '#afc4db',
  base0D: '#7587a6',
  base0E: '#9b859d',
  base0F: '#9b703f'
};
module.exports = exports['default'];
},{}],67:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (hexColor, lightness) {
  var hex = String(hexColor).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) {
    hex = hex.replace(/(.)/g, '$1$1');
  }
  var lum = lightness || 0;

  var rgb = '#';
  var c = undefined;
  for (var i = 0; i < 3; ++i) {
    c = parseInt(hex.substr(i * 2, 2), 16);
    c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16);
    rgb += ('00' + c).substr(c.length);
  }
  return rgb;
};

module.exports = exports['default'];
},{}],68:[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactMixin = require('react-mixin');

var _reactMixin2 = _interopRequireDefault(_reactMixin);

var _mixins = require('./mixins');

var _JSONArrow = require('./JSONArrow');

var _JSONArrow2 = _interopRequireDefault(_JSONArrow);

var _grabNode = require('./grab-node');

var _grabNode2 = _interopRequireDefault(_grabNode);

var styles = {
  base: {
    position: 'relative',
    paddingTop: 3,
    paddingBottom: 3,
    paddingRight: 0,
    marginLeft: 14
  },
  label: {
    margin: 0,
    padding: 0,
    display: 'inline-block'
  },
  span: {
    cursor: 'default'
  },
  spanType: {
    marginLeft: 5,
    marginRight: 5
  }
};

var JSONArrayNode = (function (_React$Component) {
  _inherits(JSONArrayNode, _React$Component);

  function JSONArrayNode(props) {
    _classCallCheck(this, _JSONArrayNode);

    _React$Component.call(this, props);
    this.defaultProps = {
      data: [],
      initialExpanded: false
    };
    this.needsChildNodes = true;
    this.renderedChildren = [];
    this.itemString = false;
    this.state = {
      expanded: this.props.initialExpanded,
      createdChildNodes: false
    };
  }

  // Returns the child nodes for each element in the array. If we have
  // generated them previously, we return from cache, otherwise we create
  // them.

  JSONArrayNode.prototype.getChildNodes = function getChildNodes() {
    var _this = this;

    if (this.state.expanded && this.needsChildNodes) {
      (function () {
        var childNodes = [];
        _this.props.data.forEach(function (element, idx) {
          var prevData = undefined;
          if (typeof _this.props.previousData !== 'undefined' && _this.props.previousData !== null) {
            prevData = _this.props.previousData[idx];
          }
          var node = _grabNode2['default'](idx, element, prevData, _this.props.theme);
          if (node !== false) {
            childNodes.push(node);
          }
        });
        _this.needsChildNodes = false;
        _this.renderedChildren = childNodes;
      })();
    }
    return this.renderedChildren;
  };

  // Returns the "n Items" string for this node, generating and
  // caching it if it hasn't been created yet.

  JSONArrayNode.prototype.getItemString = function getItemString() {
    if (!this.itemString) {
      this.itemString = this.props.data.length + ' item' + (this.props.data.length !== 1 ? 's' : '');
    }
    return this.itemString;
  };

  JSONArrayNode.prototype.render = function render() {
    var childNodes = this.getChildNodes();
    var childListStyle = {
      padding: 0,
      margin: 0,
      listStyle: 'none',
      display: this.state.expanded ? 'block' : 'none'
    };
    var containerStyle = undefined;
    var spanStyle = _extends({}, styles.span, {
      color: this.props.theme.base0E
    });
    containerStyle = _extends({}, styles.base);
    if (this.state.expanded) {
      spanStyle = _extends({}, spanStyle, {
        color: this.props.theme.base03
      });
    }
    return _react2['default'].createElement(
      'li',
      { style: containerStyle },
      _react2['default'].createElement(_JSONArrow2['default'], { theme: this.props.theme, open: this.state.expanded, onClick: this.handleClick.bind(this) }),
      _react2['default'].createElement(
        'label',
        { style: _extends({}, styles.label, {
            color: this.props.theme.base0D
          }), onClick: this.handleClick.bind(this) },
        this.props.keyName,
        ':'
      ),
      _react2['default'].createElement(
        'span',
        { style: spanStyle, onClick: this.handleClick.bind(this) },
        _react2['default'].createElement(
          'span',
          { style: styles.spanType },
          '[]'
        ),
        this.getItemString()
      ),
      _react2['default'].createElement(
        'ol',
        { style: childListStyle },
        childNodes
      )
    );
  };

  var _JSONArrayNode = JSONArrayNode;
  JSONArrayNode = _reactMixin2['default'].decorate(_mixins.ExpandedStateHandlerMixin)(JSONArrayNode) || JSONArrayNode;
  return JSONArrayNode;
})(_react2['default'].Component);

exports['default'] = JSONArrayNode;
module.exports = exports['default'];

// flag to see if we still need to render our child nodes

// cache store for our child nodes

// cache store for the number of items string we display
},{"./JSONArrow":69,"./grab-node":77,"./mixins":80,"babel-runtime/helpers/class-call-check":93,"babel-runtime/helpers/extends":95,"babel-runtime/helpers/inherits":96,"babel-runtime/helpers/interop-require-default":97,"react":"react","react-mixin":152}],69:[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var styles = {
  base: {
    display: 'inline-block',
    marginLeft: 0,
    marginTop: 8,
    marginRight: 5,
    'float': 'left',
    transition: '150ms',
    WebkitTransition: '150ms',
    MozTransition: '150ms',
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderTopWidth: 5,
    borderTopStyle: 'solid',
    WebkitTransform: 'rotateZ(-90deg)',
    MozTransform: 'rotateZ(-90deg)',
    transform: 'rotateZ(-90deg)'
  },
  open: {
    WebkitTransform: 'rotateZ(0deg)',
    MozTransform: 'rotateZ(0deg)',
    transform: 'rotateZ(0deg)'
  }
};

var JSONArrow = (function (_React$Component) {
  _inherits(JSONArrow, _React$Component);

  function JSONArrow() {
    _classCallCheck(this, JSONArrow);

    _React$Component.apply(this, arguments);
  }

  JSONArrow.prototype.render = function render() {
    var style = _extends({}, styles.base, {
      borderTopColor: this.props.theme.base0D
    });
    if (this.props.open) {
      style = _extends({}, style, styles.open);
    }
    return _react2['default'].createElement('div', { style: style, onClick: this.props.onClick });
  };

  return JSONArrow;
})(_react2['default'].Component);

exports['default'] = JSONArrow;
module.exports = exports['default'];
},{"babel-runtime/helpers/class-call-check":93,"babel-runtime/helpers/extends":95,"babel-runtime/helpers/inherits":96,"babel-runtime/helpers/interop-require-default":97,"react":"react"}],70:[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactMixin = require('react-mixin');

var _reactMixin2 = _interopRequireDefault(_reactMixin);

var _mixins = require('./mixins');

var _utilsHexToRgb = require('./utils/hexToRgb');

var _utilsHexToRgb2 = _interopRequireDefault(_utilsHexToRgb);

var styles = {
  base: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingRight: 0,
    marginLeft: 14
  },
  label: {
    display: 'inline-block',
    marginRight: 5
  }
};

var JSONBooleanNode = (function (_React$Component) {
  _inherits(JSONBooleanNode, _React$Component);

  function JSONBooleanNode() {
    _classCallCheck(this, _JSONBooleanNode);

    _React$Component.apply(this, arguments);
  }

  JSONBooleanNode.prototype.render = function render() {
    var truthString = this.props.value ? 'true' : 'false';
    var backgroundColor = 'transparent';
    if (this.props.previousValue !== this.props.value) {
      var bgColor = _utilsHexToRgb2['default'](this.props.theme.base06);
      backgroundColor = 'rgba(' + bgColor.r + ', ' + bgColor.g + ', ' + bgColor.b + ', 0.1)';
    }
    return _react2['default'].createElement(
      'li',
      { style: _extends({}, styles.base, { backgroundColor: backgroundColor }), onClick: this.handleClick.bind(this) },
      _react2['default'].createElement(
        'label',
        { style: _extends({}, styles.label, {
            color: this.props.theme.base0D
          }) },
        this.props.keyName,
        ':'
      ),
      _react2['default'].createElement(
        'span',
        { style: { color: this.props.theme.base09 } },
        truthString
      )
    );
  };

  var _JSONBooleanNode = JSONBooleanNode;
  JSONBooleanNode = _reactMixin2['default'].decorate(_mixins.SquashClickEventMixin)(JSONBooleanNode) || JSONBooleanNode;
  return JSONBooleanNode;
})(_react2['default'].Component);

exports['default'] = JSONBooleanNode;
module.exports = exports['default'];
},{"./mixins":80,"./utils/hexToRgb":84,"babel-runtime/helpers/class-call-check":93,"babel-runtime/helpers/extends":95,"babel-runtime/helpers/inherits":96,"babel-runtime/helpers/interop-require-default":97,"react":"react","react-mixin":152}],71:[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactMixin = require('react-mixin');

var _reactMixin2 = _interopRequireDefault(_reactMixin);

var _mixins = require('./mixins');

var _utilsHexToRgb = require('./utils/hexToRgb');

var _utilsHexToRgb2 = _interopRequireDefault(_utilsHexToRgb);

var styles = {
  base: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingRight: 0,
    marginLeft: 14
  },
  label: {
    display: 'inline-block',
    marginRight: 5
  }
};

var JSONDateNode = (function (_React$Component) {
  _inherits(JSONDateNode, _React$Component);

  function JSONDateNode() {
    _classCallCheck(this, _JSONDateNode);

    _React$Component.apply(this, arguments);
  }

  JSONDateNode.prototype.render = function render() {
    var backgroundColor = 'transparent';
    if (this.props.previousValue !== this.props.value) {
      var bgColor = _utilsHexToRgb2['default'](this.props.theme.base06);
      backgroundColor = 'rgba(' + bgColor.r + ', ' + bgColor.g + ', ' + bgColor.b + ', 0.1)';
    }
    return _react2['default'].createElement(
      'li',
      { style: _extends({}, styles.base, { backgroundColor: backgroundColor }), onClick: this.handleClick.bind(this) },
      _react2['default'].createElement(
        'label',
        { style: _extends({}, styles.label, {
            color: this.props.theme.base0D
          }) },
        this.props.keyName,
        ':'
      ),
      _react2['default'].createElement(
        'span',
        { style: { color: this.props.theme.base0B } },
        this.props.value.toISOString()
      )
    );
  };

  var _JSONDateNode = JSONDateNode;
  JSONDateNode = _reactMixin2['default'].decorate(_mixins.SquashClickEventMixin)(JSONDateNode) || JSONDateNode;
  return JSONDateNode;
})(_react2['default'].Component);

exports['default'] = JSONDateNode;
module.exports = exports['default'];
},{"./mixins":80,"./utils/hexToRgb":84,"babel-runtime/helpers/class-call-check":93,"babel-runtime/helpers/extends":95,"babel-runtime/helpers/inherits":96,"babel-runtime/helpers/interop-require-default":97,"react":"react","react-mixin":152}],72:[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _Number$isSafeInteger = require('babel-runtime/core-js/number/is-safe-integer')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactMixin = require('react-mixin');

var _reactMixin2 = _interopRequireDefault(_reactMixin);

var _mixins = require('./mixins');

var _JSONArrow = require('./JSONArrow');

var _JSONArrow2 = _interopRequireDefault(_JSONArrow);

var _grabNode = require('./grab-node');

var _grabNode2 = _interopRequireDefault(_grabNode);

var styles = {
  base: {
    position: 'relative',
    paddingTop: 3,
    paddingBottom: 3,
    paddingRight: 0,
    marginLeft: 14
  },
  label: {
    margin: 0,
    padding: 0,
    display: 'inline-block'
  },
  span: {
    cursor: 'default'
  },
  spanType: {
    marginLeft: 5,
    marginRight: 5
  }
};

var JSONIterableNode = (function (_React$Component) {
  _inherits(JSONIterableNode, _React$Component);

  function JSONIterableNode(props) {
    _classCallCheck(this, _JSONIterableNode);

    _React$Component.call(this, props);
    this.defaultProps = {
      data: [],
      initialExpanded: false
    };
    this.needsChildNodes = true;
    this.renderedChildren = [];
    this.itemString = false;
    this.state = {
      expanded: this.props.initialExpanded,
      createdChildNodes: false
    };
  }

  // Returns the child nodes for each entry in iterable. If we have
  // generated them previously, we return from cache, otherwise we create
  // them.

  JSONIterableNode.prototype.getChildNodes = function getChildNodes() {
    if (this.state.expanded && this.needsChildNodes) {
      var childNodes = [];
      for (var _iterator = this.props.data, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var entry = _ref;

        var key = null;
        var value = null;
        if (Array.isArray(entry)) {
          key = entry[0];
          value = entry[1];
        } else {
          key = childNodes.length;
          value = entry;
        }

        var prevData = undefined;
        if (typeof this.props.previousData !== 'undefined' && this.props.previousData !== null) {
          prevData = this.props.previousData[key];
        }
        var node = _grabNode2['default'](key, value, prevData, this.props.theme);
        if (node !== false) {
          childNodes.push(node);
        }
      }
      this.needsChildNodes = false;
      this.renderedChildren = childNodes;
    }
    return this.renderedChildren;
  };

  // Returns the "n entries" string for this node, generating and
  // caching it if it hasn't been created yet.

  JSONIterableNode.prototype.getItemString = function getItemString() {
    if (!this.itemString) {
      var data = this.props.data;

      var count = 0;
      if (_Number$isSafeInteger(data.size)) {
        count = data.size;
      } else {
        for (var _iterator2 = data, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _getIterator(_iterator2);;) {
          var _ref2;

          if (_isArray2) {
            if (_i2 >= _iterator2.length) break;
            _ref2 = _iterator2[_i2++];
          } else {
            _i2 = _iterator2.next();
            if (_i2.done) break;
            _ref2 = _i2.value;
          }

          var entry = _ref2;
          // eslint-disable-line no-unused-vars
          count += 1;
        }
      }
      this.itemString = count + ' entr' + (count !== 1 ? 'ies' : 'y');
    }
    return this.itemString;
  };

  JSONIterableNode.prototype.render = function render() {
    var childNodes = this.getChildNodes();
    var childListStyle = {
      padding: 0,
      margin: 0,
      listStyle: 'none',
      display: this.state.expanded ? 'block' : 'none'
    };
    var containerStyle = undefined;
    var spanStyle = _extends({}, styles.span, {
      color: this.props.theme.base0E
    });
    containerStyle = _extends({}, styles.base);
    if (this.state.expanded) {
      spanStyle = _extends({}, spanStyle, {
        color: this.props.theme.base03
      });
    }
    return _react2['default'].createElement(
      'li',
      { style: containerStyle },
      _react2['default'].createElement(_JSONArrow2['default'], { theme: this.props.theme, open: this.state.expanded, onClick: this.handleClick.bind(this) }),
      _react2['default'].createElement(
        'label',
        { style: _extends({}, styles.label, {
            color: this.props.theme.base0D
          }), onClick: this.handleClick.bind(this) },
        this.props.keyName,
        ':'
      ),
      _react2['default'].createElement(
        'span',
        { style: spanStyle, onClick: this.handleClick.bind(this) },
        _react2['default'].createElement(
          'span',
          { style: styles.spanType },
          '()'
        ),
        this.getItemString()
      ),
      _react2['default'].createElement(
        'ol',
        { style: childListStyle },
        childNodes
      )
    );
  };

  var _JSONIterableNode = JSONIterableNode;
  JSONIterableNode = _reactMixin2['default'].decorate(_mixins.ExpandedStateHandlerMixin)(JSONIterableNode) || JSONIterableNode;
  return JSONIterableNode;
})(_react2['default'].Component);

exports['default'] = JSONIterableNode;
module.exports = exports['default'];

// flag to see if we still need to render our child nodes

// cache store for our child nodes

// cache store for the number of items string we display
},{"./JSONArrow":69,"./grab-node":77,"./mixins":80,"babel-runtime/core-js/get-iterator":85,"babel-runtime/core-js/number/is-safe-integer":86,"babel-runtime/helpers/class-call-check":93,"babel-runtime/helpers/extends":95,"babel-runtime/helpers/inherits":96,"babel-runtime/helpers/interop-require-default":97,"react":"react","react-mixin":152}],73:[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactMixin = require('react-mixin');

var _reactMixin2 = _interopRequireDefault(_reactMixin);

var _mixins = require('./mixins');

var _utilsHexToRgb = require('./utils/hexToRgb');

var _utilsHexToRgb2 = _interopRequireDefault(_utilsHexToRgb);

var styles = {
  base: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingRight: 0,
    marginLeft: 14
  },
  label: {
    display: 'inline-block',
    marginRight: 5
  }
};

var JSONNullNode = (function (_React$Component) {
  _inherits(JSONNullNode, _React$Component);

  function JSONNullNode() {
    _classCallCheck(this, _JSONNullNode);

    _React$Component.apply(this, arguments);
  }

  JSONNullNode.prototype.render = function render() {
    var backgroundColor = 'transparent';
    if (this.props.previousValue !== this.props.value) {
      var bgColor = _utilsHexToRgb2['default'](this.props.theme.base06);
      backgroundColor = 'rgba(' + bgColor.r + ', ' + bgColor.g + ', ' + bgColor.b + ', 0.1)';
    }
    return _react2['default'].createElement(
      'li',
      { style: _extends({}, styles.base, { backgroundColor: backgroundColor }), onClick: this.handleClick.bind(this) },
      _react2['default'].createElement(
        'label',
        { style: _extends({}, styles.label, {
            color: this.props.theme.base0D
          }) },
        this.props.keyName,
        ':'
      ),
      _react2['default'].createElement(
        'span',
        { style: { color: this.props.theme.base08 } },
        'null'
      )
    );
  };

  var _JSONNullNode = JSONNullNode;
  JSONNullNode = _reactMixin2['default'].decorate(_mixins.SquashClickEventMixin)(JSONNullNode) || JSONNullNode;
  return JSONNullNode;
})(_react2['default'].Component);

exports['default'] = JSONNullNode;
module.exports = exports['default'];
},{"./mixins":80,"./utils/hexToRgb":84,"babel-runtime/helpers/class-call-check":93,"babel-runtime/helpers/extends":95,"babel-runtime/helpers/inherits":96,"babel-runtime/helpers/interop-require-default":97,"react":"react","react-mixin":152}],74:[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactMixin = require('react-mixin');

var _reactMixin2 = _interopRequireDefault(_reactMixin);

var _mixins = require('./mixins');

var _utilsHexToRgb = require('./utils/hexToRgb');

var _utilsHexToRgb2 = _interopRequireDefault(_utilsHexToRgb);

var styles = {
  base: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingRight: 0,
    marginLeft: 14
  },
  label: {
    display: 'inline-block',
    marginRight: 5
  }
};

var JSONNumberNode = (function (_React$Component) {
  _inherits(JSONNumberNode, _React$Component);

  function JSONNumberNode() {
    _classCallCheck(this, _JSONNumberNode);

    _React$Component.apply(this, arguments);
  }

  JSONNumberNode.prototype.render = function render() {
    var backgroundColor = 'transparent';
    if (this.props.previousValue !== this.props.value) {
      var bgColor = _utilsHexToRgb2['default'](this.props.theme.base06);
      backgroundColor = 'rgba(' + bgColor.r + ', ' + bgColor.g + ', ' + bgColor.b + ', 0.1)';
    }
    return _react2['default'].createElement(
      'li',
      { style: _extends({}, styles.base, { backgroundColor: backgroundColor }), onClick: this.handleClick.bind(this) },
      _react2['default'].createElement(
        'label',
        { style: _extends({}, styles.label, {
            color: this.props.theme.base0D
          }) },
        this.props.keyName,
        ':'
      ),
      _react2['default'].createElement(
        'span',
        { style: { color: this.props.theme.base09 } },
        this.props.value
      )
    );
  };

  var _JSONNumberNode = JSONNumberNode;
  JSONNumberNode = _reactMixin2['default'].decorate(_mixins.SquashClickEventMixin)(JSONNumberNode) || JSONNumberNode;
  return JSONNumberNode;
})(_react2['default'].Component);

exports['default'] = JSONNumberNode;
module.exports = exports['default'];
},{"./mixins":80,"./utils/hexToRgb":84,"babel-runtime/helpers/class-call-check":93,"babel-runtime/helpers/extends":95,"babel-runtime/helpers/inherits":96,"babel-runtime/helpers/interop-require-default":97,"react":"react","react-mixin":152}],75:[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactMixin = require('react-mixin');

var _reactMixin2 = _interopRequireDefault(_reactMixin);

var _mixins = require('./mixins');

var _JSONArrow = require('./JSONArrow');

var _JSONArrow2 = _interopRequireDefault(_JSONArrow);

var _grabNode = require('./grab-node');

var _grabNode2 = _interopRequireDefault(_grabNode);

var styles = {
  base: {
    position: 'relative',
    paddingTop: 3,
    paddingBottom: 3,
    marginLeft: 14
  },
  label: {
    margin: 0,
    padding: 0,
    display: 'inline-block'
  },
  span: {
    cursor: 'default'
  },
  spanType: {
    marginLeft: 5,
    marginRight: 5
  }
};

var JSONObjectNode = (function (_React$Component) {
  _inherits(JSONObjectNode, _React$Component);

  function JSONObjectNode(props) {
    _classCallCheck(this, _JSONObjectNode);

    _React$Component.call(this, props);
    this.defaultProps = {
      data: [],
      initialExpanded: false
    };
    this.itemString = false;
    this.needsChildNodes = true;
    this.renderedChildren = [];
    this.state = {
      expanded: this.props.initialExpanded,
      createdChildNodes: false
    };
  }

  // Returns the child nodes for each element in the object. If we have
  // generated them previously, we return from cache, otherwise we create
  // them.

  JSONObjectNode.prototype.getChildNodes = function getChildNodes() {
    if (this.state.expanded && this.needsChildNodes) {
      var obj = this.props.data;
      var childNodes = [];
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
          var prevData = undefined;
          if (typeof this.props.previousData !== 'undefined' && this.props.previousData !== null) {
            prevData = this.props.previousData[k];
          }
          var node = _grabNode2['default'](k, obj[k], prevData, this.props.theme);
          if (node !== false) {
            childNodes.push(node);
          }
        }
      }
      this.needsChildNodes = false;
      this.renderedChildren = childNodes;
    }
    return this.renderedChildren;
  };

  // Returns the "n Items" string for this node, generating and
  // caching it if it hasn't been created yet.

  JSONObjectNode.prototype.getItemString = function getItemString() {
    if (!this.itemString) {
      var len = _Object$keys(this.props.data).length;
      this.itemString = len + ' key' + (len !== 1 ? 's' : '');
    }
    return this.itemString;
  };

  JSONObjectNode.prototype.render = function render() {
    var childListStyle = {
      padding: 0,
      margin: 0,
      listStyle: 'none',
      display: this.state.expanded ? 'block' : 'none'
    };
    var containerStyle = undefined;
    var spanStyle = _extends({}, styles.span, {
      color: this.props.theme.base0B
    });
    containerStyle = _extends({}, styles.base);
    if (this.state.expanded) {
      spanStyle = _extends({}, spanStyle, {
        color: this.props.theme.base03
      });
    }
    return _react2['default'].createElement(
      'li',
      { style: containerStyle },
      _react2['default'].createElement(_JSONArrow2['default'], { theme: this.props.theme, open: this.state.expanded, onClick: this.handleClick.bind(this) }),
      _react2['default'].createElement(
        'label',
        { style: _extends({}, styles.label, {
            color: this.props.theme.base0D
          }), onClick: this.handleClick.bind(this) },
        this.props.keyName,
        ':'
      ),
      _react2['default'].createElement(
        'span',
        { style: spanStyle, onClick: this.handleClick.bind(this) },
        _react2['default'].createElement(
          'span',
          { style: styles.spanType },
          '{}'
        ),
        this.getItemString()
      ),
      _react2['default'].createElement(
        'ul',
        { style: childListStyle },
        this.getChildNodes()
      )
    );
  };

  var _JSONObjectNode = JSONObjectNode;
  JSONObjectNode = _reactMixin2['default'].decorate(_mixins.ExpandedStateHandlerMixin)(JSONObjectNode) || JSONObjectNode;
  return JSONObjectNode;
})(_react2['default'].Component);

exports['default'] = JSONObjectNode;
module.exports = exports['default'];

// cache store for the number of items string we display

// flag to see if we still need to render our child nodes

// cache store for our child nodes
},{"./JSONArrow":69,"./grab-node":77,"./mixins":80,"babel-runtime/core-js/object/keys":90,"babel-runtime/helpers/class-call-check":93,"babel-runtime/helpers/extends":95,"babel-runtime/helpers/inherits":96,"babel-runtime/helpers/interop-require-default":97,"react":"react","react-mixin":152}],76:[function(require,module,exports){
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactMixin = require('react-mixin');

var _reactMixin2 = _interopRequireDefault(_reactMixin);

var _mixins = require('./mixins');

var _utilsHexToRgb = require('./utils/hexToRgb');

var _utilsHexToRgb2 = _interopRequireDefault(_utilsHexToRgb);

var styles = {
  base: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingRight: 0,
    marginLeft: 14
  },
  label: {
    display: 'inline-block',
    marginRight: 5
  }
};

var JSONStringNode = (function (_React$Component) {
  _inherits(JSONStringNode, _React$Component);

  function JSONStringNode() {
    _classCallCheck(this, _JSONStringNode);

    _React$Component.apply(this, arguments);
  }

  JSONStringNode.prototype.render = function render() {
    var backgroundColor = 'transparent';
    if (this.props.previousValue !== this.props.value) {
      var bgColor = _utilsHexToRgb2['default'](this.props.theme.base06);
      backgroundColor = 'rgba(' + bgColor.r + ', ' + bgColor.g + ', ' + bgColor.b + ', 0.1)';
    }
    return _react2['default'].createElement(
      'li',
      { style: _extends({}, styles.base, { backgroundColor: backgroundColor }), onClick: this.handleClick.bind(this) },
      _react2['default'].createElement(
        'label',
        { style: _extends({}, styles.label, {
            color: this.props.theme.base0D
          }) },
        this.props.keyName,
        ':'
      ),
      _react2['default'].createElement(
        'span',
        { style: { color: this.props.theme.base0B } },
        '"',
        this.props.value,
        '"'
      )
    );
  };

  var _JSONStringNode = JSONStringNode;
  JSONStringNode = _reactMixin2['default'].decorate(_mixins.SquashClickEventMixin)(JSONStringNode) || JSONStringNode;
  return JSONStringNode;
})(_react2['default'].Component);

exports['default'] = JSONStringNode;
module.exports = exports['default'];
},{"./mixins":80,"./utils/hexToRgb":84,"babel-runtime/helpers/class-call-check":93,"babel-runtime/helpers/extends":95,"babel-runtime/helpers/inherits":96,"babel-runtime/helpers/interop-require-default":97,"react":"react","react-mixin":152}],77:[function(require,module,exports){
'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _objType = require('./obj-type');

var _objType2 = _interopRequireDefault(_objType);

var _JSONObjectNode = require('./JSONObjectNode');

var _JSONObjectNode2 = _interopRequireDefault(_JSONObjectNode);

var _JSONArrayNode = require('./JSONArrayNode');

var _JSONArrayNode2 = _interopRequireDefault(_JSONArrayNode);

var _JSONIterableNode = require('./JSONIterableNode');

var _JSONIterableNode2 = _interopRequireDefault(_JSONIterableNode);

var _JSONStringNode = require('./JSONStringNode');

var _JSONStringNode2 = _interopRequireDefault(_JSONStringNode);

var _JSONNumberNode = require('./JSONNumberNode');

var _JSONNumberNode2 = _interopRequireDefault(_JSONNumberNode);

var _JSONBooleanNode = require('./JSONBooleanNode');

var _JSONBooleanNode2 = _interopRequireDefault(_JSONBooleanNode);

var _JSONNullNode = require('./JSONNullNode');

var _JSONNullNode2 = _interopRequireDefault(_JSONNullNode);

var _JSONDateNode = require('./JSONDateNode');

var _JSONDateNode2 = _interopRequireDefault(_JSONDateNode);

exports['default'] = function (key, value, prevValue, theme) {
  var initialExpanded = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

  var nodeType = _objType2['default'](value);
  if (nodeType === 'Object') {
    return _react2['default'].createElement(_JSONObjectNode2['default'], { data: value, previousData: prevValue, theme: theme, initialExpanded: initialExpanded, keyName: key, key: key });
  } else if (nodeType === 'Array') {
    return _react2['default'].createElement(_JSONArrayNode2['default'], { data: value, previousData: prevValue, theme: theme, initialExpanded: initialExpanded, keyName: key, key: key });
  } else if (nodeType === 'Iterable') {
    return _react2['default'].createElement(_JSONIterableNode2['default'], { data: value, previousData: prevValue, theme: theme, initialExpanded: initialExpanded, keyName: key, key: key });
  } else if (nodeType === 'String') {
    return _react2['default'].createElement(_JSONStringNode2['default'], { keyName: key, previousValue: prevValue, theme: theme, value: value, key: key });
  } else if (nodeType === 'Number') {
    return _react2['default'].createElement(_JSONNumberNode2['default'], { keyName: key, previousValue: prevValue, theme: theme, value: value, key: key });
  } else if (nodeType === 'Boolean') {
    return _react2['default'].createElement(_JSONBooleanNode2['default'], { keyName: key, previousValue: prevValue, theme: theme, value: value, key: key });
  } else if (nodeType === 'Date') {
    return _react2['default'].createElement(_JSONDateNode2['default'], { keyName: key, previousValue: prevValue, theme: theme, value: value, key: key });
  } else if (nodeType === 'Null') {
    return _react2['default'].createElement(_JSONNullNode2['default'], { keyName: key, previousValue: prevValue, theme: theme, value: value, key: key });
  }
  return false;
};

module.exports = exports['default'];
},{"./JSONArrayNode":68,"./JSONBooleanNode":70,"./JSONDateNode":71,"./JSONIterableNode":72,"./JSONNullNode":73,"./JSONNumberNode":74,"./JSONObjectNode":75,"./JSONStringNode":76,"./obj-type":82,"babel-runtime/helpers/interop-require-default":97,"react":"react"}],78:[function(require,module,exports){
// ES6 + inline style port of JSONViewer https://bitbucket.org/davevedder/react-json-viewer/
// all credits and original code to the author
// Dave Vedder <veddermatic@gmail.com> http://www.eskimospy.com/
// port by Daniele Zannotti http://www.github.com/dzannotti <dzannotti@me.com>

'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _grabNode = require('./grab-node');

var _grabNode2 = _interopRequireDefault(_grabNode);

var _themesSolarized = require('./themes/solarized');

var _themesSolarized2 = _interopRequireDefault(_themesSolarized);

var styles = {
  tree: {
    border: 0,
    padding: 0,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 2,
    marginRight: 0,
    fontSize: '0.90em',
    listStyle: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none'
  }
};

var JSONTree = (function (_React$Component) {
  _inherits(JSONTree, _React$Component);

  _createClass(JSONTree, null, [{
    key: 'propTypes',
    value: {
      data: _react2['default'].PropTypes.oneOfType([_react2['default'].PropTypes.array, _react2['default'].PropTypes.object]).isRequired
    },
    enumerable: true
  }, {
    key: 'defaultProps',
    value: {
      theme: _themesSolarized2['default']
    },
    enumerable: true
  }]);

  function JSONTree(props) {
    _classCallCheck(this, JSONTree);

    _React$Component.call(this, props);
  }

  JSONTree.prototype.render = function render() {
    var keyName = this.props.keyName || 'root';
    var rootNode = _grabNode2['default'](keyName, this.props.data, this.props.previousData, this.props.theme, true);
    return _react2['default'].createElement(
      'ul',
      { style: _extends({}, styles.tree, this.props.style) },
      rootNode
    );
  };

  return JSONTree;
})(_react2['default'].Component);

exports['default'] = JSONTree;
module.exports = exports['default'];
},{"./grab-node":77,"./themes/solarized":83,"babel-runtime/helpers/class-call-check":93,"babel-runtime/helpers/create-class":94,"babel-runtime/helpers/extends":95,"babel-runtime/helpers/inherits":96,"babel-runtime/helpers/interop-require-default":97,"react":"react"}],79:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = {
  handleClick: function handleClick(e) {
    e.stopPropagation();
    this.setState({
      expanded: !this.state.expanded
    });
  },

  componentWillReceiveProps: function componentWillReceiveProps() {
    // resets our caches and flags we need to build child nodes again
    this.renderedChildren = [];
    this.itemString = false;
    this.needsChildNodes = true;
  }
};
module.exports = exports["default"];
},{}],80:[function(require,module,exports){
'use strict';

var _interopRequire = require('babel-runtime/helpers/interop-require')['default'];

exports.__esModule = true;

var _squashClickEvent = require('./squash-click-event');

exports.SquashClickEventMixin = _interopRequire(_squashClickEvent);

var _expandedStateHandler = require('./expanded-state-handler');

exports.ExpandedStateHandlerMixin = _interopRequire(_expandedStateHandler);
},{"./expanded-state-handler":79,"./squash-click-event":81,"babel-runtime/helpers/interop-require":98}],81:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = {
  handleClick: function handleClick(e) {
    e.stopPropagation();
  }
};
module.exports = exports["default"];
},{}],82:[function(require,module,exports){
'use strict';

var _Symbol$iterator = require('babel-runtime/core-js/symbol/iterator')['default'];

exports.__esModule = true;

exports['default'] = function (obj) {
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj) && typeof obj[_Symbol$iterator] === 'function') {
    return 'Iterable';
  }
  return Object.prototype.toString.call(obj).slice(8, -1);
};

module.exports = exports['default'];
},{"babel-runtime/core-js/symbol/iterator":92}],83:[function(require,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"dup":61}],84:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports["default"] = function (hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

module.exports = exports["default"];
},{}],85:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/get-iterator"), __esModule: true };
},{"core-js/library/fn/get-iterator":99}],86:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/number/is-safe-integer"), __esModule: true };
},{"core-js/library/fn/number/is-safe-integer":100}],87:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/assign"), __esModule: true };
},{"core-js/library/fn/object/assign":101}],88:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/create"), __esModule: true };
},{"core-js/library/fn/object/create":102}],89:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/define-property"), __esModule: true };
},{"core-js/library/fn/object/define-property":103}],90:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/keys"), __esModule: true };
},{"core-js/library/fn/object/keys":104}],91:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/set-prototype-of"), __esModule: true };
},{"core-js/library/fn/object/set-prototype-of":105}],92:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/symbol/iterator"), __esModule: true };
},{"core-js/library/fn/symbol/iterator":106}],93:[function(require,module,exports){
"use strict";

exports["default"] = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

exports.__esModule = true;
},{}],94:[function(require,module,exports){
"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

exports["default"] = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;

      _Object$defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

exports.__esModule = true;
},{"babel-runtime/core-js/object/define-property":89}],95:[function(require,module,exports){
"use strict";

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

exports["default"] = _Object$assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

exports.__esModule = true;
},{"babel-runtime/core-js/object/assign":87}],96:[function(require,module,exports){
"use strict";

var _Object$create = require("babel-runtime/core-js/object/create")["default"];

var _Object$setPrototypeOf = require("babel-runtime/core-js/object/set-prototype-of")["default"];

exports["default"] = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = _Object$create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _Object$setPrototypeOf ? _Object$setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

exports.__esModule = true;
},{"babel-runtime/core-js/object/create":88,"babel-runtime/core-js/object/set-prototype-of":91}],97:[function(require,module,exports){
"use strict";

exports["default"] = function (obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
};

exports.__esModule = true;
},{}],98:[function(require,module,exports){
"use strict";

exports["default"] = function (obj) {
  return obj && obj.__esModule ? obj["default"] : obj;
};

exports.__esModule = true;
},{}],99:[function(require,module,exports){
require('../modules/web.dom.iterable');
require('../modules/es6.string.iterator');
module.exports = require('../modules/core.get-iterator');
},{"../modules/core.get-iterator":144,"../modules/es6.string.iterator":150,"../modules/web.dom.iterable":151}],100:[function(require,module,exports){
require('../../modules/es6.number.is-safe-integer');
module.exports = require('../../modules/$.core').Number.isSafeInteger;
},{"../../modules/$.core":112,"../../modules/es6.number.is-safe-integer":146}],101:[function(require,module,exports){
require('../../modules/es6.object.assign');
module.exports = require('../../modules/$.core').Object.assign;
},{"../../modules/$.core":112,"../../modules/es6.object.assign":147}],102:[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function create(P, D){
  return $.create(P, D);
};
},{"../../modules/$":128}],103:[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function defineProperty(it, key, desc){
  return $.setDesc(it, key, desc);
};
},{"../../modules/$":128}],104:[function(require,module,exports){
require('../../modules/es6.object.keys');
module.exports = require('../../modules/$.core').Object.keys;
},{"../../modules/$.core":112,"../../modules/es6.object.keys":148}],105:[function(require,module,exports){
require('../../modules/es6.object.set-prototype-of');
module.exports = require('../../modules/$.core').Object.setPrototypeOf;
},{"../../modules/$.core":112,"../../modules/es6.object.set-prototype-of":149}],106:[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/web.dom.iterable');
module.exports = require('../../modules/$.wks')('iterator');
},{"../../modules/$.wks":142,"../../modules/es6.string.iterator":150,"../../modules/web.dom.iterable":151}],107:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],108:[function(require,module,exports){
module.exports = function(){ /* empty */ };
},{}],109:[function(require,module,exports){
var isObject = require('./$.is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./$.is-object":123}],110:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./$.cof')
  , TAG = require('./$.wks')('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};
},{"./$.cof":111,"./$.wks":142}],111:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],112:[function(require,module,exports){
var core = module.exports = {version: '1.2.6'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],113:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./$.a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./$.a-function":107}],114:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],115:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./$.fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./$.fails":117}],116:[function(require,module,exports){
var global    = require('./$.global')
  , core      = require('./$.core')
  , ctx       = require('./$.ctx')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , IS_WRAP   = type & $export.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && key in target;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(param){
        return this instanceof C ? new C(param) : C(param);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    if(IS_PROTO)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
  }
};
// type bitmap
$export.F = 1;  // forced
$export.G = 2;  // global
$export.S = 4;  // static
$export.P = 8;  // proto
$export.B = 16; // bind
$export.W = 32; // wrap
module.exports = $export;
},{"./$.core":112,"./$.ctx":113,"./$.global":118}],117:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],118:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],119:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],120:[function(require,module,exports){
var $          = require('./$')
  , createDesc = require('./$.property-desc');
module.exports = require('./$.descriptors') ? function(object, key, value){
  return $.setDesc(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./$":128,"./$.descriptors":115,"./$.property-desc":132}],121:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./$.cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":111}],122:[function(require,module,exports){
// 20.1.2.3 Number.isInteger(number)
var isObject = require('./$.is-object')
  , floor    = Math.floor;
module.exports = function isInteger(it){
  return !isObject(it) && isFinite(it) && floor(it) === it;
};
},{"./$.is-object":123}],123:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],124:[function(require,module,exports){
'use strict';
var $              = require('./$')
  , descriptor     = require('./$.property-desc')
  , setToStringTag = require('./$.set-to-string-tag')
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./$.hide')(IteratorPrototype, require('./$.wks')('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = $.create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};
},{"./$":128,"./$.hide":120,"./$.property-desc":132,"./$.set-to-string-tag":135,"./$.wks":142}],125:[function(require,module,exports){
'use strict';
var LIBRARY        = require('./$.library')
  , $export        = require('./$.export')
  , redefine       = require('./$.redefine')
  , hide           = require('./$.hide')
  , has            = require('./$.has')
  , Iterators      = require('./$.iterators')
  , $iterCreate    = require('./$.iter-create')
  , setToStringTag = require('./$.set-to-string-tag')
  , getProto       = require('./$').getProto
  , ITERATOR       = require('./$.wks')('iterator')
  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR    = '@@iterator'
  , KEYS           = 'keys'
  , VALUES         = 'values';

var returnThis = function(){ return this; };

module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , methods, key;
  // Fix native
  if($native){
    var IteratorPrototype = getProto($default.call(new Base));
    // Set @@toStringTag to native iterators
    setToStringTag(IteratorPrototype, TAG, true);
    // FF fix
    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
    // fix Array#{values, @@iterator}.name in V8 / FF
    if(DEF_VALUES && $native.name !== VALUES){
      VALUES_BUG = true;
      $default = function values(){ return $native.call(this); };
    }
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES  ? $default : getMethod(VALUES),
      keys:    IS_SET      ? $default : getMethod(KEYS),
      entries: !DEF_VALUES ? $default : getMethod('entries')
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};
},{"./$":128,"./$.export":116,"./$.has":119,"./$.hide":120,"./$.iter-create":124,"./$.iterators":127,"./$.library":129,"./$.redefine":133,"./$.set-to-string-tag":135,"./$.wks":142}],126:[function(require,module,exports){
module.exports = function(done, value){
  return {value: value, done: !!done};
};
},{}],127:[function(require,module,exports){
module.exports = {};
},{}],128:[function(require,module,exports){
var $Object = Object;
module.exports = {
  create:     $Object.create,
  getProto:   $Object.getPrototypeOf,
  isEnum:     {}.propertyIsEnumerable,
  getDesc:    $Object.getOwnPropertyDescriptor,
  setDesc:    $Object.defineProperty,
  setDescs:   $Object.defineProperties,
  getKeys:    $Object.keys,
  getNames:   $Object.getOwnPropertyNames,
  getSymbols: $Object.getOwnPropertySymbols,
  each:       [].forEach
};
},{}],129:[function(require,module,exports){
module.exports = true;
},{}],130:[function(require,module,exports){
// 19.1.2.1 Object.assign(target, source, ...)
var $        = require('./$')
  , toObject = require('./$.to-object')
  , IObject  = require('./$.iobject');

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = require('./$.fails')(function(){
  var a = Object.assign
    , A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return a({}, A)[S] != 7 || Object.keys(a({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , $$    = arguments
    , $$len = $$.length
    , index = 1
    , getKeys    = $.getKeys
    , getSymbols = $.getSymbols
    , isEnum     = $.isEnum;
  while($$len > index){
    var S      = IObject($$[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  }
  return T;
} : Object.assign;
},{"./$":128,"./$.fails":117,"./$.iobject":121,"./$.to-object":140}],131:[function(require,module,exports){
// most Object methods by ES6 should accept primitives
var $export = require('./$.export')
  , core    = require('./$.core')
  , fails   = require('./$.fails');
module.exports = function(KEY, exec){
  var fn  = (core.Object || {})[KEY] || Object[KEY]
    , exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function(){ fn(1); }), 'Object', exp);
};
},{"./$.core":112,"./$.export":116,"./$.fails":117}],132:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],133:[function(require,module,exports){
module.exports = require('./$.hide');
},{"./$.hide":120}],134:[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var getDesc  = require('./$').getDesc
  , isObject = require('./$.is-object')
  , anObject = require('./$.an-object');
var check = function(O, proto){
  anObject(O);
  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = require('./$.ctx')(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};
},{"./$":128,"./$.an-object":109,"./$.ctx":113,"./$.is-object":123}],135:[function(require,module,exports){
var def = require('./$').setDesc
  , has = require('./$.has')
  , TAG = require('./$.wks')('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"./$":128,"./$.has":119,"./$.wks":142}],136:[function(require,module,exports){
var global = require('./$.global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./$.global":118}],137:[function(require,module,exports){
var toInteger = require('./$.to-integer')
  , defined   = require('./$.defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"./$.defined":114,"./$.to-integer":138}],138:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],139:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./$.iobject')
  , defined = require('./$.defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./$.defined":114,"./$.iobject":121}],140:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":114}],141:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],142:[function(require,module,exports){
var store  = require('./$.shared')('wks')
  , uid    = require('./$.uid')
  , Symbol = require('./$.global').Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
};
},{"./$.global":118,"./$.shared":136,"./$.uid":141}],143:[function(require,module,exports){
var classof   = require('./$.classof')
  , ITERATOR  = require('./$.wks')('iterator')
  , Iterators = require('./$.iterators');
module.exports = require('./$.core').getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
},{"./$.classof":110,"./$.core":112,"./$.iterators":127,"./$.wks":142}],144:[function(require,module,exports){
var anObject = require('./$.an-object')
  , get      = require('./core.get-iterator-method');
module.exports = require('./$.core').getIterator = function(it){
  var iterFn = get(it);
  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
  return anObject(iterFn.call(it));
};
},{"./$.an-object":109,"./$.core":112,"./core.get-iterator-method":143}],145:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./$.add-to-unscopables')
  , step             = require('./$.iter-step')
  , Iterators        = require('./$.iterators')
  , toIObject        = require('./$.to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./$.iter-define')(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');
},{"./$.add-to-unscopables":108,"./$.iter-define":125,"./$.iter-step":126,"./$.iterators":127,"./$.to-iobject":139}],146:[function(require,module,exports){
// 20.1.2.5 Number.isSafeInteger(number)
var $export   = require('./$.export')
  , isInteger = require('./$.is-integer')
  , abs       = Math.abs;

$export($export.S, 'Number', {
  isSafeInteger: function isSafeInteger(number){
    return isInteger(number) && abs(number) <= 0x1fffffffffffff;
  }
});
},{"./$.export":116,"./$.is-integer":122}],147:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./$.export');

$export($export.S + $export.F, 'Object', {assign: require('./$.object-assign')});
},{"./$.export":116,"./$.object-assign":130}],148:[function(require,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = require('./$.to-object');

require('./$.object-sap')('keys', function($keys){
  return function keys(it){
    return $keys(toObject(it));
  };
});
},{"./$.object-sap":131,"./$.to-object":140}],149:[function(require,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = require('./$.export');
$export($export.S, 'Object', {setPrototypeOf: require('./$.set-proto').set});
},{"./$.export":116,"./$.set-proto":134}],150:[function(require,module,exports){
'use strict';
var $at  = require('./$.string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./$.iter-define')(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
},{"./$.iter-define":125,"./$.string-at":137}],151:[function(require,module,exports){
require('./es6.array.iterator');
var Iterators = require('./$.iterators');
Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
},{"./$.iterators":127,"./es6.array.iterator":145}],152:[function(require,module,exports){
var mixin = require('smart-mixin');
var assign = require('object-assign');

var mixinProto = mixin({
  // lifecycle stuff is as you'd expect
  componentDidMount: mixin.MANY,
  componentWillMount: mixin.MANY,
  componentWillReceiveProps: mixin.MANY,
  shouldComponentUpdate: mixin.ONCE,
  componentWillUpdate: mixin.MANY,
  componentDidUpdate: mixin.MANY,
  componentWillUnmount: mixin.MANY,
  getChildContext: mixin.MANY_MERGED
});

function setDefaultProps(reactMixin) {
  var getDefaultProps = reactMixin.getDefaultProps;

  if (getDefaultProps) {
    reactMixin.defaultProps = getDefaultProps();

    delete reactMixin.getDefaultProps;
  }
}

function setInitialState(reactMixin) {
  var getInitialState = reactMixin.getInitialState;
  var componentWillMount = reactMixin.componentWillMount;

  function applyInitialState(instance) {
    var state = instance.state || {};
    assign(state, getInitialState.call(instance));
    instance.state = state;
  }

  if (getInitialState) {
    if (!componentWillMount) {
      reactMixin.componentWillMount = function() {
        applyInitialState(this);
      };
    } else {
      reactMixin.componentWillMount = function() {
        applyInitialState(this);
        componentWillMount.call(this);
      };
    }

    delete reactMixin.getInitialState;
  }
}

function mixinClass(reactClass, reactMixin) {
  setDefaultProps(reactMixin);
  setInitialState(reactMixin);

  var prototypeMethods = {};
  var staticProps = {};

  Object.keys(reactMixin).forEach(function(key) {
    if (key === 'mixins') {
      return; // Handled below to ensure proper order regardless of property iteration order
    }
    if (key === 'statics') {
      return; // gets special handling
    } else if (typeof reactMixin[key] === 'function') {
      prototypeMethods[key] = reactMixin[key];
    } else {
      staticProps[key] = reactMixin[key];
    }
  });

  mixinProto(reactClass.prototype, prototypeMethods);

  var mergePropTypes = function(left, right, key) {
    if (!left) return right;
    if (!right) return left;

    var result = {};
    Object.keys(left).forEach(function(leftKey) {
      if (!right[leftKey]) {
        result[leftKey] = left[leftKey];
      }
    });

    Object.keys(right).forEach(function(rightKey) {
      if (left[rightKey]) {
        result[rightKey] = function checkBothContextTypes() {
          return right[rightKey].apply(this, arguments) && left[rightKey].apply(this, arguments);
        };
      } else {
        result[rightKey] = right[rightKey];
      }
    });

    return result;
  };

  mixin({
    childContextTypes: mergePropTypes,
    contextTypes: mergePropTypes,
    propTypes: mixin.MANY_MERGED_LOOSE,
    defaultProps: mixin.MANY_MERGED_LOOSE
  })(reactClass, staticProps);

  // statics is a special case because it merges directly onto the class
  if (reactMixin.statics) {
    Object.getOwnPropertyNames(reactMixin.statics).forEach(function(key) {
      var left = reactClass[key];
      var right = reactMixin.statics[key];

      if (left !== undefined && right !== undefined) {
        throw new TypeError('Cannot mixin statics because statics.' + key + ' and Component.' + key + ' are defined.');
      }

      reactClass[key] = left !== undefined ? left : right;
    });
  }

  // If more mixins are defined, they need to run. This emulate's react's behavior.
  // See behavior in code at:
  // https://github.com/facebook/react/blob/41aa3496aa632634f650edbe10d617799922d265/src/isomorphic/classic/class/ReactClass.js#L468
  // Note the .reverse(). In React, a fresh constructor is created, then all mixins are mixed in recursively,
  // then the actual spec is mixed in last.
  //
  // With ES6 classes, the properties are already there, so smart-mixin mixes functions (a, b) -> b()a(), which is
  // the opposite of how React does it. If we reverse this array, we basically do the whole logic in reverse,
  // which makes the result the same. See the test for more.
  // See also:
  // https://github.com/facebook/react/blob/41aa3496aa632634f650edbe10d617799922d265/src/isomorphic/classic/class/ReactClass.js#L853
  if (reactMixin.mixins) {
    reactMixin.mixins.reverse().forEach(mixinClass.bind(null, reactClass));
  }

  return reactClass;
}

module.exports = (function() {
  var reactMixin = mixinProto;

  reactMixin.onClass = function(reactClass, mixin) {
    return mixinClass(reactClass, mixin);
  };

  reactMixin.decorate = function(mixin) {
    return function(reactClass) {
      return reactMixin.onClass(reactClass, mixin);
    };
  };

  return reactMixin;
})();

},{"object-assign":153,"smart-mixin":154}],153:[function(require,module,exports){
'use strict';

function ToObject(val) {
	if (val == null) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var keys;
	var to = ToObject(target);

	for (var s = 1; s < arguments.length; s++) {
		from = arguments[s];
		keys = Object.keys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			to[keys[i]] = from[keys[i]];
		}
	}

	return to;
};

},{}],154:[function(require,module,exports){
var objToStr = function(x){ return Object.prototype.toString.call(x); };

var thrower = function(error){
    throw error;
};

var mixins = module.exports = function makeMixinFunction(rules, _opts){
    var opts = _opts || {};
    if (!opts.unknownFunction) {
        opts.unknownFunction = mixins.ONCE;
    }

    if (!opts.nonFunctionProperty) {
        opts.nonFunctionProperty = function(left, right, key){
            if (left !== undefined && right !== undefined) {
                var getTypeName = function(obj){
                    if (obj && obj.constructor && obj.constructor.name) {
                        return obj.constructor.name;
                    }
                    else {
                        return objToStr(obj).slice(8, -1);
                    }
                };
                throw new TypeError('Cannot mixin key ' + key + ' because it is provided by multiple sources, '
                        + 'and the types are ' + getTypeName(left) + ' and ' + getTypeName(right));
            }
            return left === undefined ? right : left;
        };
    }

    function setNonEnumerable(target, key, value){
        if (key in target){
            target[key] = value;
        }
        else {
            Object.defineProperty(target, key, {
                value: value,
                writable: true,
                configurable: true
            });
        }
    }

    return function applyMixin(source, mixin){
        Object.keys(mixin).forEach(function(key){
            var left = source[key], right = mixin[key], rule = rules[key];

            // this is just a weird case where the key was defined, but there's no value
            // behave like the key wasn't defined
            if (left === undefined && right === undefined) return;

            var wrapIfFunction = function(thing){
                return typeof thing !== "function" ? thing
                : function(){
                    return thing.call(this, arguments);
                };
            };

            // do we have a rule for this key?
            if (rule) {
                // may throw here
                var fn = rule(left, right, key);
                setNonEnumerable(source, key, wrapIfFunction(fn));
                return;
            }

            var leftIsFn = typeof left === "function";
            var rightIsFn = typeof right === "function";

            // check to see if they're some combination of functions or undefined
            // we already know there's no rule, so use the unknown function behavior
            if (leftIsFn && right === undefined
             || rightIsFn && left === undefined
             || leftIsFn && rightIsFn) {
                // may throw, the default is ONCE so if both are functions
                // the default is to throw
                setNonEnumerable(source, key, wrapIfFunction(opts.unknownFunction(left, right, key)));
                return;
            }

            // we have no rule for them, one may be a function but one or both aren't
            // our default is MANY_MERGED_LOOSE which will merge objects, concat arrays
            // and throw if there's a type mismatch or both are primitives (how do you merge 3, and "foo"?)
            source[key] = opts.nonFunctionProperty(left, right, key);
        });
    };
};

mixins._mergeObjects = function(obj1, obj2) {
    var assertObject = function(obj, obj2){
        var type = objToStr(obj);
        if (type !== '[object Object]') {
            var displayType = obj.constructor ? obj.constructor.name : 'Unknown';
            var displayType2 = obj2.constructor ? obj2.constructor.name : 'Unknown';
            thrower('cannot merge returned value of type ' + displayType + ' with an ' + displayType2);
        }
    };

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        return obj1.concat(obj2);
    }

    assertObject(obj1, obj2);
    assertObject(obj2, obj1);

    var result = {};
    Object.keys(obj1).forEach(function(k){
        if (Object.prototype.hasOwnProperty.call(obj2, k)) {
            thrower('cannot merge returns because both have the ' + JSON.stringify(k) + ' key');
        }
        result[k] = obj1[k];
    });

    Object.keys(obj2).forEach(function(k){
        // we can skip the conflict check because all conflicts would already be found
        result[k] = obj2[k];
    });
    return result;

}

// define our built-in mixin types
mixins.ONCE = function(left, right, key){
    if (left && right) {
        throw new TypeError('Cannot mixin ' + key + ' because it has a unique constraint.');
    }

    var fn = left || right;

    return function(args){
        return fn.apply(this, args);
    };
};

mixins.MANY = function(left, right, key){
    return function(args){
        if (right) right.apply(this, args);
        return left ? left.apply(this, args) : undefined;
    };
};

mixins.MANY_MERGED_LOOSE = function(left, right, key) {
    if(left && right) {
        return mixins._mergeObjects(left, right);
    }

    return left || right;
}

mixins.MANY_MERGED = function(left, right, key){
    return function(args){
        var res1 = right && right.apply(this, args);
        var res2 = left && left.apply(this, args);
        if (res1 && res2) {
            return mixins._mergeObjects(res1, res2)
        }
        return res2 || res1;
    };
};


mixins.REDUCE_LEFT = function(_left, _right, key){
    var left = _left || function(x){ return x };
    var right = _right || function(x){ return x };
    return function(args){
        return right.call(this, left.apply(this, args));
    };
};

mixins.REDUCE_RIGHT = function(_left, _right, key){
    var left = _left || function(x){ return x };
    var right = _right || function(x){ return x };
    return function(args){
        return left.call(this, right.apply(this, args));
    };
};


},{}],155:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = createAll;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _createProvider = require('./createProvider');

var _createProvider2 = _interopRequireDefault(_createProvider);

var _createConnect = require('./createConnect');

var _createConnect2 = _interopRequireDefault(_createConnect);

function createAll(React) {
  var Provider = _createProvider2['default'](React);
  var connect = _createConnect2['default'](React);

  return { Provider: Provider, connect: connect };
}

module.exports = exports['default'];
},{"./createConnect":156,"./createProvider":157}],156:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = createConnect;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _utilsCreateStoreShape = require('../utils/createStoreShape');

var _utilsCreateStoreShape2 = _interopRequireDefault(_utilsCreateStoreShape);

var _utilsShallowEqual = require('../utils/shallowEqual');

var _utilsShallowEqual2 = _interopRequireDefault(_utilsShallowEqual);

var _utilsIsPlainObject = require('../utils/isPlainObject');

var _utilsIsPlainObject2 = _interopRequireDefault(_utilsIsPlainObject);

var _utilsWrapActionCreators = require('../utils/wrapActionCreators');

var _utilsWrapActionCreators2 = _interopRequireDefault(_utilsWrapActionCreators);

var _hoistNonReactStatics = require('hoist-non-react-statics');

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var defaultMapStateToProps = function defaultMapStateToProps() {
  return {};
};
var defaultMapDispatchToProps = function defaultMapDispatchToProps(dispatch) {
  return { dispatch: dispatch };
};
var defaultMergeProps = function defaultMergeProps(stateProps, dispatchProps, parentProps) {
  return _extends({}, parentProps, stateProps, dispatchProps);
};

function getDisplayName(Component) {
  return Component.displayName || Component.name || 'Component';
}

// Helps track hot reloading.
var nextVersion = 0;

function createConnect(React) {
  var Component = React.Component;
  var PropTypes = React.PropTypes;

  var storeShape = _utilsCreateStoreShape2['default'](PropTypes);

  return function connect(mapStateToProps, mapDispatchToProps, mergeProps) {
    var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

    var shouldSubscribe = Boolean(mapStateToProps);
    var finalMapStateToProps = mapStateToProps || defaultMapStateToProps;
    var finalMapDispatchToProps = _utilsIsPlainObject2['default'](mapDispatchToProps) ? _utilsWrapActionCreators2['default'](mapDispatchToProps) : mapDispatchToProps || defaultMapDispatchToProps;
    var finalMergeProps = mergeProps || defaultMergeProps;
    var shouldUpdateStateProps = finalMapStateToProps.length > 1;
    var shouldUpdateDispatchProps = finalMapDispatchToProps.length > 1;
    var _options$pure = options.pure;
    var pure = _options$pure === undefined ? true : _options$pure;

    // Helps track hot reloading.
    var version = nextVersion++;

    function computeStateProps(store, props) {
      var state = store.getState();
      var stateProps = shouldUpdateStateProps ? finalMapStateToProps(state, props) : finalMapStateToProps(state);

      _invariant2['default'](_utilsIsPlainObject2['default'](stateProps), '`mapStateToProps` must return an object. Instead received %s.', stateProps);
      return stateProps;
    }

    function computeDispatchProps(store, props) {
      var dispatch = store.dispatch;

      var dispatchProps = shouldUpdateDispatchProps ? finalMapDispatchToProps(dispatch, props) : finalMapDispatchToProps(dispatch);

      _invariant2['default'](_utilsIsPlainObject2['default'](dispatchProps), '`mapDispatchToProps` must return an object. Instead received %s.', dispatchProps);
      return dispatchProps;
    }

    function _computeNextState(stateProps, dispatchProps, parentProps) {
      var mergedProps = finalMergeProps(stateProps, dispatchProps, parentProps);
      _invariant2['default'](_utilsIsPlainObject2['default'](mergedProps), '`mergeProps` must return an object. Instead received %s.', mergedProps);
      return mergedProps;
    }

    return function wrapWithConnect(WrappedComponent) {
      var Connect = (function (_Component) {
        _inherits(Connect, _Component);

        Connect.prototype.shouldComponentUpdate = function shouldComponentUpdate(nextProps, nextState) {
          if (!pure) {
            this.updateStateProps(nextProps);
            this.updateDispatchProps(nextProps);
            this.updateState(nextProps);
            return true;
          }

          var storeChanged = nextState.storeState !== this.state.storeState;
          var propsChanged = !_utilsShallowEqual2['default'](nextProps, this.props);
          var mapStateProducedChange = false;
          var dispatchPropsChanged = false;

          if (storeChanged || propsChanged && shouldUpdateStateProps) {
            mapStateProducedChange = this.updateStateProps(nextProps);
          }

          if (propsChanged && shouldUpdateDispatchProps) {
            dispatchPropsChanged = this.updateDispatchProps(nextProps);
          }

          if (propsChanged || mapStateProducedChange || dispatchPropsChanged) {
            this.updateState(nextProps);
            return true;
          }

          return false;
        };

        function Connect(props, context) {
          _classCallCheck(this, Connect);

          _Component.call(this, props, context);
          this.version = version;
          this.store = props.store || context.store;

          _invariant2['default'](this.store, 'Could not find "store" in either the context or ' + ('props of "' + this.constructor.displayName + '". ') + 'Either wrap the root component in a <Provider>, ' + ('or explicitly pass "store" as a prop to "' + this.constructor.displayName + '".'));

          this.stateProps = computeStateProps(this.store, props);
          this.dispatchProps = computeDispatchProps(this.store, props);
          this.state = { storeState: null };
          this.updateState();
        }

        Connect.prototype.computeNextState = function computeNextState() {
          var props = arguments.length <= 0 || arguments[0] === undefined ? this.props : arguments[0];

          return _computeNextState(this.stateProps, this.dispatchProps, props);
        };

        Connect.prototype.updateStateProps = function updateStateProps() {
          var props = arguments.length <= 0 || arguments[0] === undefined ? this.props : arguments[0];

          var nextStateProps = computeStateProps(this.store, props);
          if (_utilsShallowEqual2['default'](nextStateProps, this.stateProps)) {
            return false;
          }

          this.stateProps = nextStateProps;
          return true;
        };

        Connect.prototype.updateDispatchProps = function updateDispatchProps() {
          var props = arguments.length <= 0 || arguments[0] === undefined ? this.props : arguments[0];

          var nextDispatchProps = computeDispatchProps(this.store, props);
          if (_utilsShallowEqual2['default'](nextDispatchProps, this.dispatchProps)) {
            return false;
          }

          this.dispatchProps = nextDispatchProps;
          return true;
        };

        Connect.prototype.updateState = function updateState() {
          var props = arguments.length <= 0 || arguments[0] === undefined ? this.props : arguments[0];

          this.nextState = this.computeNextState(props);
        };

        Connect.prototype.isSubscribed = function isSubscribed() {
          return typeof this.unsubscribe === 'function';
        };

        Connect.prototype.trySubscribe = function trySubscribe() {
          if (shouldSubscribe && !this.unsubscribe) {
            this.unsubscribe = this.store.subscribe(this.handleChange.bind(this));
            this.handleChange();
          }
        };

        Connect.prototype.tryUnsubscribe = function tryUnsubscribe() {
          if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
          }
        };

        Connect.prototype.componentDidMount = function componentDidMount() {
          this.trySubscribe();
        };

        Connect.prototype.componentWillUnmount = function componentWillUnmount() {
          this.tryUnsubscribe();
        };

        Connect.prototype.handleChange = function handleChange() {
          if (!this.unsubscribe) {
            return;
          }

          this.setState({
            storeState: this.store.getState()
          });
        };

        Connect.prototype.getWrappedInstance = function getWrappedInstance() {
          return this.refs.wrappedInstance;
        };

        Connect.prototype.render = function render() {
          return React.createElement(WrappedComponent, _extends({ ref: 'wrappedInstance'
          }, this.nextState));
        };

        return Connect;
      })(Component);

      Connect.displayName = 'Connect(' + getDisplayName(WrappedComponent) + ')';
      Connect.WrappedComponent = WrappedComponent;
      Connect.contextTypes = {
        store: storeShape
      };
      Connect.propTypes = {
        store: storeShape
      };

      if (process.env.NODE_ENV !== 'production') {
        Connect.prototype.componentWillUpdate = function componentWillUpdate() {
          if (this.version === version) {
            return;
          }

          // We are hot reloading!
          this.version = version;

          // Update the state and bindings.
          this.trySubscribe();
          this.updateStateProps();
          this.updateDispatchProps();
          this.updateState();
        };
      }

      return _hoistNonReactStatics2['default'](Connect, WrappedComponent);
    };
  };
}

module.exports = exports['default'];
}).call(this,require('_process'))

},{"../utils/createStoreShape":158,"../utils/isPlainObject":159,"../utils/shallowEqual":160,"../utils/wrapActionCreators":161,"_process":17,"hoist-non-react-statics":162,"invariant":163}],157:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = createProvider;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _utilsCreateStoreShape = require('../utils/createStoreShape');

var _utilsCreateStoreShape2 = _interopRequireDefault(_utilsCreateStoreShape);

function isUsingOwnerContext(React) {
  var version = React.version;

  if (typeof version !== 'string') {
    return true;
  }

  var sections = version.split('.');
  var major = parseInt(sections[0], 10);
  var minor = parseInt(sections[1], 10);

  return major === 0 && minor === 13;
}

function createProvider(React) {
  var Component = React.Component;
  var PropTypes = React.PropTypes;
  var Children = React.Children;

  var storeShape = _utilsCreateStoreShape2['default'](PropTypes);
  var requireFunctionChild = isUsingOwnerContext(React);

  var didWarnAboutChild = false;
  function warnAboutFunctionChild() {
    if (didWarnAboutChild || requireFunctionChild) {
      return;
    }

    didWarnAboutChild = true;
    console.error( // eslint-disable-line no-console
    'With React 0.14 and later versions, you no longer need to ' + 'wrap <Provider> child into a function.');
  }
  function warnAboutElementChild() {
    if (didWarnAboutChild || !requireFunctionChild) {
      return;
    }

    didWarnAboutChild = true;
    console.error( // eslint-disable-line no-console
    'With React 0.13, you need to ' + 'wrap <Provider> child into a function. ' + 'This restriction will be removed with React 0.14.');
  }

  var didWarnAboutReceivingStore = false;
  function warnAboutReceivingStore() {
    if (didWarnAboutReceivingStore) {
      return;
    }

    didWarnAboutReceivingStore = true;
    console.error( // eslint-disable-line no-console
    '<Provider> does not support changing `store` on the fly. ' + 'It is most likely that you see this error because you updated to ' + 'Redux 2.x and React Redux 2.x which no longer hot reload reducers ' + 'automatically. See https://github.com/rackt/react-redux/releases/' + 'tag/v2.0.0 for the migration instructions.');
  }

  var Provider = (function (_Component) {
    _inherits(Provider, _Component);

    Provider.prototype.getChildContext = function getChildContext() {
      return { store: this.store };
    };

    function Provider(props, context) {
      _classCallCheck(this, Provider);

      _Component.call(this, props, context);
      this.store = props.store;
    }

    Provider.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
      var store = this.store;
      var nextStore = nextProps.store;

      if (store !== nextStore) {
        warnAboutReceivingStore();
      }
    };

    Provider.prototype.render = function render() {
      var children = this.props.children;

      if (typeof children === 'function') {
        warnAboutFunctionChild();
        children = children();
      } else {
        warnAboutElementChild();
      }

      return Children.only(children);
    };

    return Provider;
  })(Component);

  Provider.childContextTypes = {
    store: storeShape.isRequired
  };
  Provider.propTypes = {
    store: storeShape.isRequired,
    children: (requireFunctionChild ? PropTypes.func : PropTypes.element).isRequired
  };

  return Provider;
}

module.exports = exports['default'];
},{"../utils/createStoreShape":158}],158:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = createStoreShape;

function createStoreShape(PropTypes) {
  return PropTypes.shape({
    subscribe: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired
  });
}

module.exports = exports["default"];
},{}],159:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = isPlainObject;
var fnToString = function fnToString(fn) {
  return Function.prototype.toString.call(fn);
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */

function isPlainObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  var proto = typeof obj.constructor === 'function' ? Object.getPrototypeOf(obj) : Object.prototype;

  if (proto === null) {
    return true;
  }

  var constructor = proto.constructor;

  return typeof constructor === 'function' && constructor instanceof constructor && fnToString(constructor) === fnToString(Object);
}

module.exports = exports['default'];
},{}],160:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = shallowEqual;

function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  var hasOwn = Object.prototype.hasOwnProperty;
  for (var i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
      return false;
    }
  }

  return true;
}

module.exports = exports["default"];
},{}],161:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = wrapActionCreators;

var _redux = require('redux');

function wrapActionCreators(actionCreators) {
  return function (dispatch) {
    return _redux.bindActionCreators(actionCreators, dispatch);
  };
}

module.exports = exports['default'];
},{"redux":"redux"}],162:[function(require,module,exports){
/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var REACT_STATICS = {
    childContextTypes: true,
    contextTypes: true,
    defaultProps: true,
    displayName: true,
    getDefaultProps: true,
    mixins: true,
    propTypes: true,
    type: true
};

var KNOWN_STATICS = {
    name: true,
    length: true,
    prototype: true,
    caller: true,
    arguments: true,
    arity: true
};

module.exports = function hoistNonReactStatics(targetComponent, sourceComponent) {
    var keys = Object.getOwnPropertyNames(sourceComponent);
    for (var i=0; i<keys.length; ++i) {
        if (!REACT_STATICS[keys[i]] && !KNOWN_STATICS[keys[i]]) {
            targetComponent[keys[i]] = sourceComponent[keys[i]];
        }
    }

    return targetComponent;
};

},{}],163:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

}).call(this,require('_process'))

},{"_process":17}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDbGllbnRcXFNvdXJjZVxcYXBpXFxJbmRleC5qcyIsIkNsaWVudFxcU291cmNlXFxhcGlcXG1lbWJlcnNoaXAuanMiLCJDbGllbnRcXFNvdXJjZVxcYXBpXFxuYXZpZ2F0ZS5qcyIsIkNsaWVudFxcU291cmNlXFxhcHAuanMiLCJDbGllbnRcXFNvdXJjZVxcY29tcG9uZW50c1xcQWJvdXRWaWV3XFxBYm91dC5qcyIsIkNsaWVudFxcU291cmNlXFxjb21wb25lbnRzXFxIb21lVmlld1xcSW5kZXguanMiLCJDbGllbnRcXFNvdXJjZVxcY29tcG9uZW50c1xcTG9nb25WaWV3XFxJbmRleC5qcyIsIkNsaWVudFxcU291cmNlXFxjb21wb25lbnRzXFxNYWluUGFnZVxcSW5kZXguanMiLCJDbGllbnRcXFNvdXJjZVxcY29tcG9uZW50c1xcTWFpblBhZ2VcXGZvb3Rlci5qcyIsIkNsaWVudFxcU291cmNlXFxjb21wb25lbnRzXFxNYWluUGFnZVxcaGVhZGVyLmpzIiwiQ2xpZW50XFxTb3VyY2VcXGNvbXBvbmVudHNcXE5vdEZvdW5kUGFnZVxcaW5kZXguanMiLCJDbGllbnRcXFNvdXJjZVxcY29tcG9uZW50c1xcUmVnaXN0ZXJWaWV3XFxJbmRleC5qcyIsIkNsaWVudFxcU291cmNlXFxyb3V0ZXIuanMiLCJDbGllbnRcXFNvdXJjZVxcc3RhdGVcXGRpc3BhdGNoZXIuanMiLCJDbGllbnRcXFNvdXJjZVxcc3RhdGVcXHJlZHVjZXJzLmpzIiwiQ2xpZW50XFxTb3VyY2VcXHN0YXRlXFx1c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvY3JlYXRlRGV2VG9vbHMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL2RldlRvb2xzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcGVyc2lzdFN0YXRlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC9EZWJ1Z1BhbmVsLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC9Mb2dNb25pdG9yLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC9Mb2dNb25pdG9yQnV0dG9uLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC9Mb2dNb25pdG9yRW50cnkuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L0xvZ01vbml0b3JFbnRyeUFjdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9hcGF0aHkuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9hc2hlcy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2F0ZWxpZXItZHVuZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2F0ZWxpZXItZm9yZXN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYXRlbGllci1oZWF0aC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2F0ZWxpZXItbGFrZXNpZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9hdGVsaWVyLXNlYXNpZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9iZXNwaW4uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9icmV3ZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9icmlnaHQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9jaGFsay5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2NvZGVzY2hvb2wuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9jb2xvcnMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9kZWZhdWx0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvZWlnaHRpZXMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9lbWJlcnMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9mbGF0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvZ29vZ2xlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvZ3JheXNjYWxlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvZ3JlZW5zY3JlZW4uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9oYXJtb25pYy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2hvcHNjb3RjaC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvaXNvdG9wZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL21hcnJha2VzaC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL21vY2hhLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvbW9ub2thaS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL25pY2luYWJveC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL29jZWFuLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvcGFyYWlzby5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL3BvcC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL3JhaWxzY2FzdHMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9zaGFwZXNoaWZ0ZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9zb2xhcml6ZWQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9zdW1tZXJmcnVpdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL3RocmVlemVyb3R3b2ZvdXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy90b21vcnJvdy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL3R1YmUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy90d2lsaWdodC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvdXRpbHMvYnJpZ2h0ZW4uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTkFycmF5Tm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9KU09OQXJyb3cuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTkJvb2xlYW5Ob2RlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL0pTT05EYXRlTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9KU09OSXRlcmFibGVOb2RlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL0pTT05OdWxsTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9KU09OTnVtYmVyTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9KU09OT2JqZWN0Tm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9KU09OU3RyaW5nTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9ncmFiLW5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvbWl4aW5zL2V4cGFuZGVkLXN0YXRlLWhhbmRsZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvbWl4aW5zL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL21peGlucy9zcXVhc2gtY2xpY2stZXZlbnQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvb2JqLXR5cGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvdXRpbHMvaGV4VG9SZ2IuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL2dldC1pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvbnVtYmVyL2lzLXNhZmUtaW50ZWdlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2Fzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2NyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2RlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2tleXMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9zZXQtcHJvdG90eXBlLW9mLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9zeW1ib2wvaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2suanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2NyZWF0ZS1jbGFzcy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL2dldC1pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vbnVtYmVyL2lzLXNhZmUtaW50ZWdlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2Fzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2NyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2RlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2tleXMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9zZXQtcHJvdG90eXBlLW9mLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9mbi9zeW1ib2wvaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5hLWZ1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuYWRkLXRvLXVuc2NvcGFibGVzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuYW4tb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuY2xhc3NvZi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmNvZi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmNvcmUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jdHguanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5kZWZpbmVkLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZGVzY3JpcHRvcnMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5leHBvcnQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5mYWlscy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmdsb2JhbC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmhhcy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmhpZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5pb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXMtaW50ZWdlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmlzLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLml0ZXItY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlci1kZWZpbmUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5pdGVyLXN0ZXAuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5pdGVyYXRvcnMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmxpYnJhcnkuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5vYmplY3QtYXNzaWduLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQub2JqZWN0LXNhcC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnByb3BlcnR5LWRlc2MuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5yZWRlZmluZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnNldC1wcm90by5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnNldC10by1zdHJpbmctdGFnLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuc2hhcmVkLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuc3RyaW5nLWF0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudG8taW50ZWdlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnRvLWlvYmplY3QuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC50by1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC51aWQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC53a3MuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvY29yZS5nZXQtaXRlcmF0b3ItbWV0aG9kLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2NvcmUuZ2V0LWl0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5hcnJheS5pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYubnVtYmVyLmlzLXNhZmUtaW50ZWdlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYub2JqZWN0LmFzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYub2JqZWN0LmtleXMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm9iamVjdC5zZXQtcHJvdG90eXBlLW9mLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5zdHJpbmcuaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvd2ViLmRvbS5pdGVyYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtbWl4aW4vaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LW1peGluL25vZGVfbW9kdWxlcy9vYmplY3QtYXNzaWduL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1taXhpbi9ub2RlX21vZHVsZXMvc21hcnQtbWl4aW4vaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L2xpYi9jb21wb25lbnRzL2NyZWF0ZUFsbC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtcmVkdXgvbGliL2NvbXBvbmVudHMvY3JlYXRlQ29ubmVjdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtcmVkdXgvbGliL2NvbXBvbmVudHMvY3JlYXRlUHJvdmlkZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L2xpYi91dGlscy9jcmVhdGVTdG9yZVNoYXBlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1yZWR1eC9saWIvdXRpbHMvaXNQbGFpbk9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtcmVkdXgvbGliL3V0aWxzL3NoYWxsb3dFcXVhbC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtcmVkdXgvbGliL3V0aWxzL3dyYXBBY3Rpb25DcmVhdG9ycy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtcmVkdXgvbm9kZV9tb2R1bGVzL2hvaXN0LW5vbi1yZWFjdC1zdGF0aWNzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1yZWR1eC9ub2RlX21vZHVsZXMvaW52YXJpYW50L2Jyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7QUNFQSxJQUFNLFdBQVcsR0FBRyxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxDQUFDO0FBQ3JELElBQU0sV0FBVyxHQUFHLHdCQUF3QixDQUFDO0FBQzdDLElBQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDOztBQUVyQyxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRTs7QUFFdkUsYUFBUyxXQUFXLENBQUMsT0FBTyxFQUFFO0FBQzFCLGVBQU8sVUFBUyxPQUFPLEVBQUU7QUFDckIsZ0JBQU0sSUFBSSxHQUFHLElB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7O0FDRkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgcmVxd2VzdCBmcm9tICdyZXF3ZXN0JztcclxuXHJcbmNvbnN0IGpzb25IZWFkZXJzID0geyAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nIH07XHJcbmNvbnN0IHNlcnZpY2VCYXNlID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAxMC8nO1xyXG5jb25zdCBjbGllbnRJZCA9ICdyZWFsVGltZVdlYkNsaWVudCc7XHJcblxyXG5mdW5jdGlvbiBjYWxsKHZlcmIsIGNvbnRlbnRUeXBlLCB1cmwsIGRhdGEsIHJlc3BvbnNlSGFuZGxlciwgZXJyb3JIYW5kbGVyKSB7XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIHBhcnNlRXJyb3JzKGhhbmRsZXIpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocmVxdWVzdCkge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIoZGF0YS5lcnJvcnMsIHJlcXVlc3QpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXF3ZXN0KHtcclxuICAgICAgICB1cmw6IHNlcnZpY2VCYXNlICsgdXJsLFxyXG4gICAgICAgIG1ldGhvZDogdmVyYixcclxuICAgICAgICAvL3R5cGU6ICdqc29uJyxcclxuICAgICAgICBjb250ZW50VHlwZTogY29udGVudFR5cGUsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBoZWFkZXJzOiBqc29uSGVhZGVycyxcclxuICAgICAgICBzdWNjZXNzOiByZXNwb25zZUhhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IHBhcnNlRXJyb3JzKGVycm9ySGFuZGxlcilcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXQodXJsLCBkYXRhLCByZXNwb25zZUhhbmRsZXIsIGVycm9ySGFuZGxlcikge1xyXG4gICAgY2FsbCgnZ2V0JywgJ2FwcGxpY2F0aW9uL2pzb24nLCB1cmwsIGRhdGEsIHJlc3BvbnNlSGFuZGxlciwgZXJyb3JIYW5kbGVyKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcG9zdCh1cmwsIGRhdGEsIHJlc3BvbnNlSGFuZGxlciwgZXJyb3JIYW5kbGVyKSB7XHJcbiAgICBjYWxsKCdwb3N0JywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcsIHVybCwgZGF0YSwgcmVzcG9uc2VIYW5kbGVyLCBlcnJvckhhbmRsZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgICBzZXJ2aWNlQmFzZTogc2VydmljZUJhc2UsXHJcbiAgICBjbGllbnRJZDogY2xpZW50SWQsXHJcbiAgICBwb3N0OiBwb3N0LFxyXG4gICAgZ2V0OiBnZXRcclxufSIsImltcG9ydCBhcGkgZnJvbSAnLi8nO1xyXG5pbXBvcnQgbmF2aWdhdGUgZnJvbSAnLi9uYXZpZ2F0ZSc7XHJcbmltcG9ydCB7IGFjdGlvbnMgYXMgdXNlclN0YXRlQWN0aW9ucyB9IGZyb20gJy4uL3N0YXRlL3VzZXInO1xyXG5pbXBvcnQgc3RvcmUgZnJvbSAnc3RvcmUnO1xyXG5cclxuLy9jb25zdCBwcm94eSA9ICQuY29ubmVjdGlvbi5tZW1iZXJzaGlwO1xyXG5jb25zdCBzdG9yYWdlS2V5ID0gJ2F1dGhvcml6YXRpb25EYXRhJztcclxuXHJcbi8vcHJveHkuY2xpZW50LkxvZ2luU3VjY2Vzc2Z1bCA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbi8vICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb24obmFtZSk7XHJcbi8vfTtcclxuXHJcbi8vZnVuY3Rpb24gbG9naW4odXNlck5hbWUsIHBhc3N3b3JkKSB7XHJcbi8vICAgIHByb3h5LnNlcnZlci5sb2dpbih1c2VyTmFtZSwgcGFzc3dvcmQpO1xyXG4vL31cclxuXHJcbmZ1bmN0aW9uIGxvZ2luKHVzZXJOYW1lLCBwYXNzd29yZCwgdXNlUmVmcmVzaFRva2Vucykge1xyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgbG9nZ2VkT24odXNlck5hbWUsIHJlc3BvbnNlLmFjY2Vzc190b2tlbiwgdXNlUmVmcmVzaFRva2Vucyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGFuZGxlRXJyb3IocmVxdWVzdCkge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gICAgICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb25GYWlsZWQoZGF0YS5lcnJvcl9kZXNjcmlwdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGRhdGEgPSAnZ3JhbnRfdHlwZT1wYXNzd29yZCZ1c2VybmFtZT0nICsgdXNlck5hbWUgKyAnJnBhc3N3b3JkPScgKyBwYXNzd29yZDtcclxuICAgIGlmICh1c2VSZWZyZXNoVG9rZW5zKSB7XHJcbiAgICAgICAgZGF0YSA9IGRhdGEgKyAnJmNsaWVudF9pZD0nICsgYXBpLmNsaWVudElkO1xyXG4gICAgfVxyXG5cclxuICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb25QZW5kaW5nKCk7XHJcblxyXG4gICAgYXBpLnBvc3QoJ3Rva2VuJywgZGF0YSwgaGFuZGxlUmVzcG9uc2UsIGhhbmRsZUVycm9yKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9nT2ZmKCkge1xyXG5cclxuICAgIHN0b3JlLnJlbW92ZShzdG9yYWdlS2V5KTtcclxuXHJcbiAgICB1c2VyU3RhdGVBY3Rpb25zLmxvZ29mZigpO1xyXG4gICAgXHJcbiAgICBuYXZpZ2F0ZS50bygnLycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2dnZWRPbih1c2VyTmFtZSwgdG9rZW4sIHJlZnJlc2hUb2tlbikge1xyXG4gICAgICAgICBcclxuICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgdG9rZW46IHRva2VuLCBcclxuICAgICAgICB1c2VyTmFtZTogdXNlck5hbWUsXHJcbiAgICAgICAgdXNlUmVmcmVzaFRva2VuczogcmVmcmVzaFRva2VuID8gdHJ1ZSA6IGZhbHNlLFxyXG4gICAgICAgIHJlZnJlc2hUb2tlbjogcmVmcmVzaFRva2VuXHJcbiAgICB9O1xyXG5cclxuICAgIHN0b3JlLnNldChzdG9yYWdlS2V5LCBkYXRhKTtcclxuICAgICAgICBcclxuICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb24odXNlck5hbWUsIHJlZnJlc2hUb2tlbiA/IHRydWUgOiBmYWxzZSk7XHJcbiAgICBcclxuICAgIG5hdmlnYXRlLnRvKCcvaG9tZScpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWdpc3Rlcih1c2VyTmFtZSwgZU1haWwsIHBhc3N3b3JkKSB7XHJcblxyXG4gICAgZnVuY3Rpb24gaGFuZGxlUmVzcG9uc2UocmVzcG9uc2UpIHtcclxuICAgICAgICBsb2dpbih1c2VyTmFtZSwgcGFzc3dvcmQpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZUVycm9yKHJlcXVlc3QpIHtcclxuICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlKTtcclxuICAgICAgICB1c2VyU3RhdGVBY3Rpb25zLnJlZ2lzdHJhdGlvbkZhaWxlZChkYXRhLmVycm9yX2Rlc2NyaXB0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICB1c2VyTmFtZTogdXNlck5hbWUsXHJcbiAgICAgICAgZU1haWw6IGVNYWlsLFxyXG4gICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxyXG4gICAgfTtcclxuXHJcbiAgICB1c2VyU3RhdGVBY3Rpb25zLnJlZ2lzdGVyUGVuZGluZygpO1xyXG4gICAgXHJcbiAgICBhcGkucG9zdCgnYXBpL2FjY291bnQvcmVnaXN0ZXInLCBkYXRhLCBoYW5kbGVSZXNwb25zZSwgaGFuZGxlRXJyb3IpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBleHRlcm5hbFByb3ZpZGVyVXJsKHByb3ZpZGVyKSB7XHJcbiAgICB2YXIgcmVkaXJlY3RVcmkgPSBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0ICsgJy9BY2NvdW50L0NvbXBsZXRlJztcclxuXHJcbiAgICByZXR1cm4gYXBpLnNlcnZpY2VCYXNlICsgXCJhcGkvQWNjb3VudC9FeHRlcm5hbExvZ2luP3Byb3ZpZGVyPVwiICsgcHJvdmlkZXJcclxuICAgICAgICArIFwiJnJlc3BvbnNlX3R5cGU9dG9rZW4mY2xpZW50X2lkPVwiICsgYXBpLmNsaWVudElkXHJcbiAgICAgICAgKyBcIiZyZWRpcmVjdF91cmk9XCIgKyByZWRpcmVjdFVyaTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXh0ZXJuYWxQcm92aWRlckNvbXBsZXRlZChmcmFnbWVudCkge1xyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgbG9nZ2VkT24ocmVzcG9uc2UudXNlck5hbWUsIHJlc3BvbnNlLmFjY2Vzc190b2tlbiwgbnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGFuZGxlRXJyb3IocmVxdWVzdCkge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gICAgICAgIHVzZXJTdGF0ZUFjdGlvbnMuYXNzb2NpYXRlRXh0ZXJuYWxGYWlsZWQoZGF0YS5lcnJvcl9kZXNjcmlwdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGZyYWdtZW50Lmhhc2xvY2FsYWNjb3VudCA9PT0gJ0ZhbHNlJykge1xyXG4gICAgICAgIHJldHVybiB1c2VyU3RhdGVBY3Rpb25zLmFzc29jaWF0ZUV4dGVybmFsKGZyYWdtZW50LnByb3ZpZGVyLCBmcmFnbWVudC5leHRlcm5hbF9hY2Nlc3NfdG9rZW4sIGZyYWdtZW50LmV4dGVybmFsX3VzZXJfbmFtZSk7ICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkYXRhID0gJ3Byb3ZpZGVyPScgKyBmcmFnbWVudC5wcm92aWRlciArICcmZXh0ZXJuYWxBY2Nlc3NUb2tlbj0nICsgZnJhZ21lbnQuZXh0ZXJuYWxfYWNjZXNzX3Rva2VuO1xyXG5cclxuICAgIGFwaS5nZXQoJ2FwaS9hY2NvdW50L09idGFpbkxvY2FsQWNjZXNzVG9rZW4nLCBkYXRhLCBoYW5kbGVSZXNwb25zZSwgaGFuZGxlRXJyb3IpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWdpc3RlckV4dGVybmFsKHVzZXJOYW1lLCBwcm92aWRlciwgZXh0ZXJuYWxBY2Nlc3NUb2tlbikge1xyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVSZXNwb25zZShyZXNwb25zZSkge1xyXG4gICAgICAgIGxvZ2dlZE9uKHJlc3BvbnNlLnVzZXJOYW1lLCByZXNwb25zZS5hY2Nlc3NfdG9rZW4sIG51bGwpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZUVycm9yKGVycm9ycywgcmVxdWVzdCkge1xyXG4gICAgICAgIHVzZXJTdGF0ZUFjdGlvbnMuYXNzb2NpYXRlRXh0ZXJuYWxGYWlsZWQoZXJyb3JzWzBdKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICAgIHVzZXJOYW1lOiB1c2VyTmFtZSxcclxuICAgICAgICBwcm92aWRlcjogcHJvdmlkZXIsXHJcbiAgICAgICAgZXh0ZXJuYWxBY2Nlc3NUb2tlbjogZXh0ZXJuYWxBY2Nlc3NUb2tlblxyXG4gICAgfTtcclxuXHJcbiAgICB1c2VyU3RhdGVBY3Rpb25zLmFzc29jaWF0ZUV4dGVybmFsUGVuZGluZygpO1xyXG5cclxuICAgIGFwaS5wb3N0KCdhcGkvYWNjb3VudC9yZWdpc3RlcmV4dGVybmFsJywgZGF0YSwgaGFuZGxlUmVzcG9uc2UsIGhhbmRsZUVycm9yKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcclxuICAgIGNvbnN0IGRhdGEgPSBzdG9yZS5nZXQoc3RvcmFnZUtleSk7XHJcbiAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIGxvZ2dlZE9uKGRhdGEudXNlck5hbWUsIGRhdGEudG9rZW4sIGRhdGEucmVmcmVzaFRva2VuKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8kLmNvbm5lY3Rpb24uaHViLnN0YXJ0KClcclxuLy8gICAgLmRvbmUoZnVuY3Rpb24oKXsgY29uc29sZS5sb2coJ05vdyBjb25uZWN0ZWQsIGNvbm5lY3Rpb24gSUQ9JyArICQuY29ubmVjdGlvbi5odWIuaWQpOyB9KVxyXG4vLyAgICAuZmFpbChmdW5jdGlvbigpeyBjb25zb2xlLmxvZygnQ291bGQgbm90IENvbm5lY3QhJyk7IH0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG4gICAgaW5pdGlhbGl6ZTogaW5pdGlhbGl6ZSxcclxuICAgIGxvZ2luOiBsb2dpbixcclxuICAgIGxvZ09mZjogbG9nT2ZmLFxyXG4gICAgcmVnaXN0ZXI6IHJlZ2lzdGVyLFxyXG4gICAgZXh0ZXJuYWxQcm92aWRlclVybDogZXh0ZXJuYWxQcm92aWRlclVybCxcclxuICAgIGV4dGVybmFsUHJvdmlkZXJDb21wbGV0ZWQ6IGV4dGVybmFsUHJvdmlkZXJDb21wbGV0ZWQsXHJcbiAgICByZWdpc3RlckV4dGVybmFsOiByZWdpc3RlckV4dGVybmFsXHJcbn0iLCJpbXBvcnQgeyBwdXNoU3RhdGUgfSBmcm9tICdyZWR1eC1yb3V0ZXInO1xyXG5pbXBvcnQgZGlzcGF0Y2hlciBmcm9tICcuLi9zdGF0ZS9kaXNwYXRjaGVyJztcclxuXHJcbnZhciB0byA9IGZ1bmN0aW9uICh1cmwpIHtcclxuICAgIGRpc3BhdGNoZXIuZGlzcGF0Y2gocHVzaFN0YXRlKG51bGwsIHVybCkpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgeyB0bzogdG8gfSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCBSZWFjdERvbSBmcm9tICdyZWFjdC1kb20nO1xyXG5pbXBvcnQgeyBjb21wb3NlLCBjcmVhdGVTdG9yZSwgYXBwbHlNaWRkbGV3YXJlIH0gZnJvbSAncmVkdXgnO1xyXG5pbXBvcnQgeyBQcm92aWRlciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHsgZGV2VG9vbHMsIHBlcnNpc3RTdGF0ZSB9IGZyb20gJ3JlZHV4LWRldnRvb2xzJztcclxuaW1wb3J0IHRodW5rIGZyb20gJ3JlZHV4LXRodW5rJztcclxuaW1wb3J0IHsgRGV2VG9vbHMsIERlYnVnUGFuZWwsIExvZ01vbml0b3IgfSBmcm9tICdyZWR1eC1kZXZ0b29scy9saWIvcmVhY3QnO1xyXG5pbXBvcnQgeyByZWR1eFJlYWN0Um91dGVyIH0gZnJvbSAncmVkdXgtcm91dGVyJztcclxuaW1wb3J0IHsgY3JlYXRlSGlzdG9yeSB9IGZyb20gJ2hpc3RvcnknO1xyXG5cclxuaW1wb3J0IG1lbWJlcnNoaXAgZnJvbSAnLi9hcGkvbWVtYmVyc2hpcCc7XHJcbmltcG9ydCByZWR1Y2VycyBmcm9tICcuL3N0YXRlL3JlZHVjZXJzJztcclxuaW1wb3J0IGRpc3BhdGNoZXIgZnJvbSAnLi9zdGF0ZS9kaXNwYXRjaGVyJztcclxuXHJcbmltcG9ydCBSb3V0ZXIgZnJvbSAnLi9yb3V0ZXInO1xyXG5cclxuY29uc3Qgc3RvcmVGYWN0b3J5ID0gY29tcG9zZShcclxuICBhcHBseU1pZGRsZXdhcmUodGh1bmspLFxyXG4gIHJlZHV4UmVhY3RSb3V0ZXIoeyBjcmVhdGVIaXN0b3J5IH0pLFxyXG4gIGRldlRvb2xzKCksXHJcbiAgcGVyc2lzdFN0YXRlKHdpbmRvdy5sb2NhdGlvbi5ocmVmLm1hdGNoKC9bPyZdZGVidWdfc2Vzc2lvbj0oW14mXSspXFxiLykpXHJcbikoY3JlYXRlU3RvcmUpO1xyXG5cclxuY29uc3Qgc3RvcmUgPSBzdG9yZUZhY3RvcnkocmVkdWNlcnMpO1xyXG5cclxuZGlzcGF0Y2hlci5zZXQoc3RvcmUuZGlzcGF0Y2gpO1xyXG5cclxubGV0IGNvbnRlbnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcGxpY2F0aW9uLWNvbnRlbnQnKTtcclxuXHJcblJlYWN0RG9tLnJlbmRlcigoXHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxQcm92aWRlciBzdG9yZT17c3RvcmV9PlxyXG4gICAgICAgICAgICA8Um91dGVyIC8+XHJcbiAgICAgICAgPC9Qcm92aWRlcj4gICAgIFxyXG4gICAgICAgIDxEZWJ1Z1BhbmVsIHRvcCByaWdodCBib3R0b20+XHJcbiAgICAgICAgICAgIDxEZXZUb29scyBzdG9yZT17c3RvcmV9IG1vbml0b3I9e0xvZ01vbml0b3J9IC8+XHJcbiAgICAgICAgPC9EZWJ1Z1BhbmVsPlxyXG4gICAgPC9kaXY+XHJcbiksIGNvbnRlbnRFbGVtZW50KTtcclxuXHJcbm1lbWJlcnNoaXAuaW5pdGlhbGl6ZSgpO1xyXG5cclxuIiwibGV0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcclxuXHJcbmxldCBBYm91dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuICg8ZGl2PkFib3V0IHVzITwvZGl2Pik7XHJcbiAgICB9LFxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWJvdXQ7IiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgSW5wdXQsIEJ1dHRvbiwgUGFuZWwsIEdyaWQsIFJvdywgQ29sLCBKdW1ib3Ryb24gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5cclxuaW1wb3J0IHsgYWN0aW9ucyBhcyB1c2VyQWN0aW9ucywgdXNlclN0YXR1cyB9IGZyb20gJy4uLy4uL3N0YXRlL3VzZXInXHJcblxyXG5jbGFzcyBIb21lUGFnZSBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIHZhciB0aXRsZSA9ICggPGgyPkFjdGl2aXR5PC9oMj4gKTtcclxuICAgICAgICB2YXIgbG9hZGVyID0gdGhpcy5wcm9wcy5sb2dvblBlbmRpbmdcclxuICAgICAgICAgICAgPyAoIDxkaXY+TG9hZGluZzwvZGl2PiApXHJcbiAgICAgICAgICAgIDogbnVsbDtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPEdyaWQ+XHJcbiAgICAgICAgICAgICAgICA8Um93IGNsYXNzTmFtZT1cInNob3ctZ3JpZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxDb2wgeHM9ezEyfSBtZD17OH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxKdW1ib3Ryb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDI+SG9tZSBzd2VldCBob21lPC9oMj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9KdW1ib3Ryb24+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICAgICAgPENvbCB4cz17MTJ9IG1kPXs0fT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFBhbmVsIGhlYWRlcj17dGl0bGV9IGJzU3R5bGU9XCJpbmZvXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvUGFuZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICA8L1Jvdz5cclxuICAgICAgICAgICAgPC9HcmlkPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkhvbWVQYWdlLnByb3BUeXBlcyA9IHtcclxuICAgIGFsbG93ZWQ6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXHJcbn07XHJcblxyXG5mdW5jdGlvbiBzZWxlY3Qoc3RhdGUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYWxsb3dlZDogc3RhdGUudXNlci5zdGF0dXMgPT09IHVzZXJTdGF0dXMuYXV0aGVudGljYXRlZFxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29ubmVjdChzZWxlY3QpKEhvbWVQYWdlKTtcclxuIiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgSW5wdXQsIEJ1dHRvbiwgUGFuZWwsIEdyaWQsIFJvdywgQ29sLCBKdW1ib3Ryb24gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5cclxuaW1wb3J0IHsgYWN0aW9ucyBhcyB1c2VyQWN0aW9ucywgdXNlclN0YXR1cyB9IGZyb20gJy4uLy4uL3N0YXRlL3VzZXInXHJcbmltcG9ydCBtZW1iZXJzaGlwIGZyb20gJy4uLy4uL2FwaS9tZW1iZXJzaGlwJ1xyXG5cclxuY2xhc3MgTG9nb25QYWdlIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIG9uQ2xpY2soKSB7XHJcbiAgICAgICAgY29uc3QgeyB1c2VyTmFtZUlucHV0LCBwYXNzd29yZElucHV0IH0gPSB0aGlzLnJlZnM7XHJcbiAgICAgICAgY29uc3QgdXNlck5hbWUgPSB1c2VyTmFtZUlucHV0LmdldFZhbHVlKCk7XHJcbiAgICAgICAgY29uc3QgcGFzc3dvcmQgPSBwYXNzd29yZElucHV0LmdldFZhbHVlKCk7XHJcbiAgICAgICAgbWVtYmVyc2hpcC5sb2dpbih1c2VyTmFtZSwgcGFzc3dvcmQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBmYWNlYm9vaygpIHtcclxuICAgICAgICB0aGlzLmF1dGhFeHRlcm5hbFByb3ZpZGVyKCdGYWNlYm9vaycpO1xyXG4gICAgfVxyXG5cclxuICAgIGdvb2dsZSgpIHtcclxuICAgICAgICB0aGlzLmF1dGhFeHRlcm5hbFByb3ZpZGVyKCdHb29nbGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBhdXRoRXh0ZXJuYWxQcm92aWRlcihwcm92aWRlcikge1xyXG4gICAgICAgIGNvbnN0IGV4dGVybmFsUHJvdmlkZXJVcmwgPSBtZW1iZXJzaGlwLmV4dGVybmFsUHJvdmlkZXJVcmwocHJvdmlkZXIpO1xyXG4gICAgICAgIHdpbmRvdy5hdXRoZW50aWNhdGlvblNjb3BlID0geyBjb21wbGV0ZTogbWVtYmVyc2hpcC5leHRlcm5hbFByb3ZpZGVyQ29tcGxldGVkIH07XHJcbiAgICAgICAgd2luZG93Lm9wZW4oZXh0ZXJuYWxQcm92aWRlclVybCwgXCJBdXRoZW50aWNhdGUgQWNjb3VudFwiLCBcImxvY2F0aW9uPTAsc3RhdHVzPTAsd2lkdGg9NjAwLGhlaWdodD03NTBcIik7XHJcbiAgICB9XHJcblxyXG4gICAgYXNzb2NpYXRlRXh0ZXJuYWwoKSB7XHJcbiAgICAgICAgY29uc3QgdXNlck5hbWUgPSB0aGlzLnJlZnMudXNlck5hbWVJbnB1dC5nZXRWYWx1ZSgpO1xyXG4gICAgICAgIGNvbnN0IHsgcHJvdmlkZXIsIGV4dGVybmFsQWNjZXNzVG9rZW4sIGV4dGVybmFsVXNlck5hbWUgfSA9IHRoaXMucHJvcHM7XHJcblxyXG4gICAgICAgIG1lbWJlcnNoaXAucmVnaXN0ZXJFeHRlcm5hbCh1c2VyTmFtZSwgcHJvdmlkZXIsIGV4dGVybmFsQWNjZXNzVG9rZW4sIGV4dGVybmFsVXNlck5hbWUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgdmFyIHRpdGxlID0gKCA8aDI+TG9nIE9uPC9oMj4gKTtcclxuICAgICAgICB2YXIgbG9hZGVyID0gdGhpcy5wcm9wcy5wcm9jZXNzaW5nXHJcbiAgICAgICAgICAgID8gKCA8ZGl2PkxvYWRpbmc8L2Rpdj4gKVxyXG4gICAgICAgICAgICA6IG51bGw7XHJcblxyXG4gICAgICAgIHZhciBjb250ZW50ID0gdGhpcy5wcm9wcy5hc3NvY2lhdGVFeHRlcm5hbFxyXG4gICAgICAgICAgICA/ICggICAgICAgIFxyXG4gICAgICAgICAgICAgICAgPFBhbmVsIGhlYWRlcj17dGl0bGV9IGJzU3R5bGU9XCJpbmZvXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+PHN0cm9uZz5Zb3UgaGF2ZSBzdWNjZXNzZnVsbHkgYXV0aGVudGljYXRlZCB3aXRoIHt0aGlzLnByb3BzLnByb3ZpZGVyfSA8L3N0cm9uZz4uPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5QbGVhc2UgZW50ZXIgYSB1c2VyIG5hbWUgYmVsb3cgZm9yIHRoaXMgc2l0ZSBhbmQgY2xpY2sgdGhlIFJlZ2lzdGVyIGJ1dHRvbiB0byBsb2cgaW4uPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxJbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiVXNlciBuYW1lXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGFzRmVlZGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmPVwidXNlck5hbWVJbnB1dFwiLz5cclxuICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGJzU3R5bGU9XCJzdWNjZXNzXCIgYnpTaXplPVwibGFyZ2VcIiBjbGFzc05hbWU9XCJidG4tYmxvY2tcIiBvbkNsaWNrPXt0aGlzLmFzc29jaWF0ZUV4dGVybmFsLmJpbmQodGhpcyl9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgQnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAge2xvYWRlcn1cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2Pnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L1BhbmVsPlxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgOiAoIFxyXG4gICAgICAgICAgICAgICAgICAgIDxQYW5lbCBoZWFkZXI9e3RpdGxlfSBic1N0eWxlPVwiaW5mb1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SW5wdXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRW1haWwgb3IgdXNlcm5hbWVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRmVlZGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cInVzZXJOYW1lSW5wdXRcIi8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiUGFzc3dvcmRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRmVlZGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cInBhc3N3b3JkSW5wdXRcIi8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gYnNTdHlsZT1cInN1Y2Nlc3NcIiBielNpemU9XCJsYXJnZVwiIGNsYXNzTmFtZT1cImJ0bi1ibG9ja1wiIG9uQ2xpY2s9e3RoaXMub25DbGljay5iaW5kKHRoaXMpfSA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMb2cgT25cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bG9hZGVyfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2Pnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gYnNTdHlsZT1cImZhY2Vib29rXCIgYnNTaXplPVwibGFyZ2VcIiBjbGFzc05hbWU9XCJidG4tYmxvY2tcIiBvbkNsaWNrPXt0aGlzLmZhY2Vib29rLmJpbmQodGhpcyl9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwiZmEgZmEtZmFjZWJvb2tcIj48L2k+IHwgQ29ubmVjdCB3aXRoIEZhY2Vib29rXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGJzU3R5bGU9XCJnb29nbGUtcGx1c1wiIGJzU2l6ZT1cImxhcmdlXCIgY2xhc3NOYW1lPVwiYnRuLWJsb2NrXCIgb25DbGljaz17dGhpcy5nb29nbGUuYmluZCh0aGlzKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJmYSBmYS1nb29nbGUtcGx1c1wiPjwvaT4gfCBDb25uZWN0IHdpdGggR29vZ2xlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj4gXHJcbiAgICAgICAgICAgICAgICAgICAgPC9QYW5lbD5cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxHcmlkPlxyXG4gICAgICAgICAgICAgICAgPFJvdyBjbGFzc05hbWU9XCJzaG93LWdyaWRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8Q29sIHhzPXsxMn0gbWQ9ezh9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SnVtYm90cm9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgyPldlIHdvdWxkIGxpa2UgdG8ga25vdyB5b3U8L2gyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0p1bWJvdHJvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L0NvbD5cclxuICAgICAgICAgICAgICAgICAgICA8Q29sIHhzPXsxMn0gbWQ9ezR9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2NvbnRlbnR9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICA8L1Jvdz5cclxuICAgICAgICAgICAgPC9HcmlkPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkxvZ29uUGFnZS5wcm9wVHlwZXMgPSB7XHJcbiAgICBhc3NvY2lhdGVFeHRlcm5hbDogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcclxuICAgIHByb2Nlc3Npbmc6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXHJcbiAgICBtZXNzYWdlOiBQcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgcHJvdmlkZXI6IFByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICBleHRlcm5hbEFjY2Vzc1Rva2VuOiBQcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgZXh0ZXJuYWxVc2VyTmFtZTogUHJvcFR5cGVzLnN0cmluZ1xyXG59O1xyXG5cclxuZnVuY3Rpb24gc2VsZWN0KHN0YXRlKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHByb2Nlc3Npbmc6IHN0YXRlLnVzZXIucHJvY2Vzc2luZyxcclxuICAgICAgICBhc3NvY2lhdGVFeHRlcm5hbDogc3RhdGUudXNlci5zdGF0dXMgPT09IHVzZXJTdGF0dXMuYXNzb2NpYXRlRXh0ZXJuYWwgfHwgc3RhdGUudXNlci5zdGF0dXMgPT09IHVzZXJTdGF0dXMuYWNjb2NpYXRlRXh0ZXJuYWxQZW5kaW5nLFxyXG4gICAgICAgIG1lc3NhZ2U6IHN0YXRlLnVzZXIubWVzc2FnZSxcclxuICAgICAgICBwcm92aWRlcjogc3RhdGUudXNlci5wcm92aWRlcixcclxuICAgICAgICBleHRlcm5hbEFjY2Vzc1Rva2VuOiBzdGF0ZS51c2VyLmV4dGVybmFsQWNjZXNzVG9rZW4sXHJcbiAgICAgICAgZXh0ZXJuYWxVc2VyTmFtZTogc3RhdGUudXNlci5leHRlcm5hbFVzZXJOYW1lXHJcbiAgICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb25uZWN0KHNlbGVjdCkoTG9nb25QYWdlKTtcclxuIiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgQnV0dG9uLCBQYW5lbCwgSnVtYm90cm9uIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwLWdyaWQnO1xyXG5cclxuaW1wb3J0IHsgYWN0aW9ucyBhcyB1c2VyQWN0aW9ucywgdXNlclN0YXR1cyB9IGZyb20gJy4uLy4uL3N0YXRlL3VzZXInXHJcbmltcG9ydCBIZWFkZXIgZnJvbSAnLi9oZWFkZXInO1xyXG5pbXBvcnQgRm9vdGVyIGZyb20gJy4vZm9vdGVyJztcclxuXHJcbmNsYXNzIEFwcGxpY2F0aW9uIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICBjb25zdCB7IGRpc3BhdGNoLCB1c2VyIH0gPSB0aGlzLnByb3BzO1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8SGVhZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgdXNlckF1dGhlbnRpY2F0ZWQ9e3VzZXIuc3RhdHVzID09IHVzZXJTdGF0dXMuYXV0aGVudGljYXRlZH1cclxuICAgICAgICAgICAgICAgICAgICB1c2VyTmFtZT17dXNlci5uYW1lfSAvPlxyXG4gICAgICAgICAgICAgICAge3RoaXMucHJvcHMuY2hpbGRyZW59XHJcbiAgICAgICAgICAgICAgICA8Q29udGFpbmVyPlxyXG4gICAgICAgICAgICAgICAgICAgIDxGb290ZXIgLz5cclxuICAgICAgICAgICAgICAgIDwvQ29udGFpbmVyPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5BcHBsaWNhdGlvbi5wcm9wVHlwZXMgPSB7XHJcbiAgICB1c2VyOiBQcm9wVHlwZXMuc2hhcGUoe1xyXG4gICAgICAgIHN0YXR1czogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKHVzZXJTdGF0dXMudmFsdWVzKSxcclxuICAgICAgICBuYW1lOiBQcm9wVHlwZXMuc3RyaW5nXHJcbiAgICB9KS5pc1JlcXVpcmVkXHJcbn07XHJcblxyXG5mdW5jdGlvbiBzZWxlY3Qoc3RhdGUpIHtcclxuICAgIHJldHVybiB7IHVzZXI6IHN0YXRlLnVzZXIgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29ubmVjdChzZWxlY3QpKEFwcGxpY2F0aW9uKTsiLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzLCBDb21wb25lbnQgfSBmcm9tICdyZWFjdCc7XHJcblxyXG52YXIgc2VwYXJhdG9yU3R5bGUgPSB7XHJcbiAgICBib3JkZXJCb3R0b206ICcxcHggc29saWQgI2NjYycsXHJcbiAgICBmb250U2l6ZTogJzFweCcsXHJcbiAgICBoZWlnaHQ6ICc4cHgnLFxyXG4gICAgbWFyZ2luQm90dG9tOiAnOHB4J1xyXG59O1xyXG5cclxuY2xhc3MgRm9vdGVyIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17c2VwYXJhdG9yU3R5bGV9Lz5cclxuICAgICAgICAgICAgICAgIDxkaXY+wqkgMjAxNSBTb2xvY288L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb290ZXI7IiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBSb3V0ZXIsIFJvdXRlLCBMaW5rIH0gZnJvbSAncmVhY3Qtcm91dGVyJ1xyXG5cclxuaW1wb3J0IHsgTmF2YmFyLCBOYXZCcmFuZCwgTmF2LCBOYXZJdGVtLCBOYXZEcm9wZG93biwgTWVudUl0ZW0gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tICdyZWFjdC1ib290c3RyYXAtZ3JpZCc7XHJcbmltcG9ydCBuYXZpZ2F0ZSBmcm9tICcuLy4uLy4uL2FwaS9uYXZpZ2F0ZSc7XHJcbmltcG9ydCBtZW1iZXJzaGlwIGZyb20gJy4vLi4vLi4vYXBpL21lbWJlcnNoaXAnO1xyXG5cclxuY2xhc3MgSGVhZGVyIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIFxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIGNvbnN0IHsgdXNlckF1dGhlbnRpY2F0ZWQsIHVzZXJOYW1lIH0gPSB0aGlzLnByb3BzO1xyXG5cclxuICAgICAgICB2YXIgaXRlbXMgPSB1c2VyQXV0aGVudGljYXRlZFxyXG4gICAgICAgICAgICA/IFsgKFxyXG4gICAgICAgICAgICAgICAgPE5hdiBvblNlbGVjdD17KGtleSwgaHJlZikgPT5uYXZpZ2F0ZS50byhocmVmKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj0nL2hvbWUnPkhvbWU8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj0nL2RldmljZXMnPkRldmljZXM8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj0nL2Fib3V0Jz5BYm91dDwvTmF2SXRlbT5cclxuICAgICAgICAgICAgICAgIDwvTmF2PlxyXG4gICAgICAgICAgICAgICAgKSwgKFxyXG4gICAgICAgICAgICAgICAgPE5hdiBwdWxsUmlnaHQ9e3RydWV9IG9uU2VsZWN0PXsoa2V5LCBocmVmKSA9Pm5hdmlnYXRlLnRvKGhyZWYpfT5cclxuICAgICAgICAgICAgICAgICAgICA8TmF2SXRlbSBocmVmPScvcHJvZmlsZSc+eyB1c2VyTmFtZSB9PC9OYXZJdGVtPlxyXG4gICAgICAgICAgICAgICAgICAgIDxOYXZJdGVtIG9uU2VsZWN0PXsoKSA9PiBtZW1iZXJzaGlwLmxvZ09mZigpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgTG9nIE9mZlxyXG4gICAgICAgICAgICAgICAgICAgIDwvTmF2SXRlbT5cclxuICAgICAgICAgICAgICAgIDwvTmF2PlxyXG4gICAgICAgICAgICAgICAgKSBdXHJcbiAgICAgICAgICAgIDogIFsgKFxyXG4gICAgICAgICAgICAgICAgPE5hdiBvblNlbGVjdD17KGtleSwgaHJlZikgPT4gbmF2aWdhdGUudG8oaHJlZil9PlxyXG4gICAgICAgICAgICAgICAgICAgIDxOYXZJdGVtIGhyZWY9Jy9hYm91dCc+QWJvdXQ8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICA8L05hdj5cclxuICAgICAgICAgICAgICAgICksIChcclxuICAgICAgICAgICAgICAgIDxOYXYgcHVsbFJpZ2h0PXt0cnVlfT5cclxuICAgICAgICAgICAgICAgICAgICA8TmF2SXRlbSBvblNlbGVjdD17KCkgPT4gbmF2aWdhdGUudG8oJy9yZWdpc3RlcicpfT5cclxuICAgICAgICAgICAgICAgICAgICBKb2luXHJcbiAgICAgICAgICAgICAgICAgICAgPC9OYXZJdGVtPlxyXG4gICAgICAgICAgICAgICAgICAgIDxOYXZJdGVtIG9uU2VsZWN0PXsoKSA9PiBuYXZpZ2F0ZS50bygnL2xvZ29uJyl9PlxyXG4gICAgICAgICAgICAgICAgICAgIExvZyBPblxyXG4gICAgICAgICAgICAgICAgICAgIDwvTmF2SXRlbT5cclxuICAgICAgICAgICAgICAgIDwvTmF2PlxyXG4gICAgICAgICAgICAgICAgKSBdO1xyXG5cclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8TmF2YmFyPlxyXG4gICAgICAgICAgICAgICAgPE5hdkJyYW5kPlNvbG9jbyAtIFJlYWN0aXZlIFN0YXJ0ZXIgS2l0PC9OYXZCcmFuZD5cclxuICAgICAgICAgICAgICAgIHtpdGVtc31cclxuICAgICAgICAgICAgPC9OYXZiYXI+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG5cclxuSGVhZGVyLnByb3BUeXBlcyA9IHtcclxuICAgIHVzZXJBdXRoZW50aWNhdGVkOiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxyXG4gICAgdXNlck5hbWU6IFByb3BUeXBlcy5zdHJpbmdcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEhlYWRlcjtcclxuIiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5cclxuXHJcblxyXG5jbGFzcyBOb3RGb3VuZFBhZ2UgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgPGgxPlBhZ2Ugbm90IGZvdW5kPC9oMT5cclxuICAgICAgICAgICAgICAgIDxwPlNvcnJ5LCBidXQgdGhlIHBhZ2UgeW91IHdlcmUgdHJ5aW5nIHRvIHZpZXcgZG9lcyBub3QgZXhpc3QuPC9wPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgTm90Rm91bmRQYWdlO1xyXG4iLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzLCBDb21wb25lbnQgfSBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcblxyXG5pbXBvcnQgeyBJbnB1dCwgQnV0dG9uLCBQYW5lbCwgR3JpZCwgUm93LCBDb2wsIEp1bWJvdHJvbiB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcblxyXG5pbXBvcnQgeyBhY3Rpb25zIGFzIHVzZXJBY3Rpb25zLCB1c2VyU3RhdHVzIH0gZnJvbSAnLi4vLi4vc3RhdGUvdXNlcidcclxuaW1wb3J0IG1lbWJlcnNoaXAgZnJvbSAnLi4vLi4vYXBpL21lbWJlcnNoaXAnXHJcblxyXG5jbGFzcyBMb2dvblBhZ2UgZXh0ZW5kcyBDb21wb25lbnQge1xyXG4gICAgb25DbGljaygpIHtcclxuICAgICAgICBjb25zdCB7IHVzZXJOYW1lSW5wdXQsIGVNYWlsSW5wdXQsIHBhc3N3b3JkSW5wdXQgfSA9IHRoaXMucmVmcztcclxuICAgICAgICBjb25zdCB1c2VyTmFtZSA9IHVzZXJOYW1lSW5wdXQuZ2V0VmFsdWUoKTtcclxuICAgICAgICBjb25zdCBlTWFpbCA9IGVNYWlsSW5wdXQuZ2V0VmFsdWUoKTtcclxuICAgICAgICBjb25zdCBwYXNzd29yZCA9IHBhc3N3b3JkSW5wdXQuZ2V0VmFsdWUoKTtcclxuICAgICAgICBtZW1iZXJzaGlwLnJlZ2lzdGVyKHVzZXJOYW1lLCBlTWFpbCwgcGFzc3dvcmQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgdmFyIHRpdGxlID0gKCA8aDI+UmVnaXN0ZXI8L2gyPiApO1xyXG4gICAgICAgIHZhciBsb2FkZXIgPSB0aGlzLnByb3BzLnByb2Nlc3NpbmdcclxuICAgICAgICAgICAgPyAoIDxkaXY+TG9hZGluZzwvZGl2PiApXHJcbiAgICAgICAgICAgIDogbnVsbDtcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnQgPSBcclxuICAgICAgICAgICAgICAgICAgICA8UGFuZWwgaGVhZGVyPXt0aXRsZX0gYnNTdHlsZT1cImluZm9cIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPElucHV0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlVzZXJuYW1lXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0ZlZWRiYWNrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWY9XCJ1c2VyTmFtZUlucHV0XCIvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SW5wdXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJlbWFpbFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkVtYWlsXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0ZlZWRiYWNrICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cImVNYWlsSW5wdXRcIi8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiUGFzc3dvcmRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRmVlZGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cInBhc3N3b3JkSW5wdXRcIi8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiUmVwZWF0IFBhc3N3b3JkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0ZlZWRiYWNrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWY9XCJwYXNzd29yZElucHV0XCIvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGJzU3R5bGU9XCJzdWNjZXNzXCIgYnpTaXplPVwibGFyZ2VcIiBjbGFzc05hbWU9XCJidG4tYmxvY2tcIiBvbkNsaWNrPXt0aGlzLm9uQ2xpY2suYmluZCh0aGlzKX0gPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVnaXN0ZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bG9hZGVyfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2Pnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9QYW5lbD4gICBcclxuICAgICAgICAgICAgICAgIDtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPEdyaWQ+XHJcbiAgICAgICAgICAgICAgICA8Um93IGNsYXNzTmFtZT1cInNob3ctZ3JpZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxDb2wgeHM9ezEyfSBtZD17OH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxKdW1ib3Ryb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDI+Sm9pbiB1czwvaDI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvSnVtYm90cm9uPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvQ29sPlxyXG4gICAgICAgICAgICAgICAgICAgIDxDb2wgeHM9ezEyfSBtZD17NH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29udGVudH1cclxuICAgICAgICAgICAgICAgICAgICA8L0NvbD5cclxuICAgICAgICAgICAgICAgIDwvUm93PlxyXG4gICAgICAgICAgICA8L0dyaWQ+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG5cclxuTG9nb25QYWdlLnByb3BUeXBlcyA9IHtcclxuICAgIHByb2Nlc3Npbmc6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXHJcbiAgICBtZXNzYWdlOiBQcm9wVHlwZXMuc3RyaW5nLFxyXG59O1xyXG5cclxuZnVuY3Rpb24gc2VsZWN0KHN0YXRlKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHByb2Nlc3Npbmc6IHN0YXRlLnVzZXIucHJvY2Vzc2luZyxcclxuICAgICAgICBtZXNzYWdlOiBzdGF0ZS51c2VyLm1lc3NhZ2VcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNvbm5lY3Qoc2VsZWN0KShMb2dvblBhZ2UpO1xyXG4iLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzLCBDb21wb25lbnQgfSBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IFJvdXRlciwgUm91dGUsIExpbmssIEluZGV4Um91dGUgfSBmcm9tICdyZWFjdC1yb3V0ZXInO1xyXG5pbXBvcnQgeyBSZWR1eFJvdXRlciB9IGZyb20gJ3JlZHV4LXJvdXRlcic7XHJcblxyXG5pbXBvcnQgTWFpblBhZ2UgZnJvbSAnLi9jb21wb25lbnRzL01haW5QYWdlJztcclxuaW1wb3J0IEhvbWVWaWV3IGZyb20gJy4vY29tcG9uZW50cy9Ib21lVmlldyc7XHJcbmltcG9ydCBBYm91dFZpZXcgZnJvbSAnLi9jb21wb25lbnRzL0Fib3V0Vmlldyc7XHJcbmltcG9ydCBMb2dvblZpZXcgZnJvbSAnLi9jb21wb25lbnRzL0xvZ29uVmlldyc7XHJcbmltcG9ydCBSZWdpc3RlclZpZXcgZnJvbSAnLi9jb21wb25lbnRzL1JlZ2lzdGVyVmlldyc7XHJcblxyXG5pbXBvcnQgTm90Rm91bmRQYWdlIGZyb20gJy4vY29tcG9uZW50cy9Ob3RGb3VuZFBhZ2UnO1xyXG5cclxuY2xhc3MgQXBwbGljYXRpb25Sb3V0ZXIgZXh0ZW5kcyBDb21wb25lbnQge1xyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxSZWR1eFJvdXRlcj5cclxuICAgICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL1wiIGNvbXBvbmVudD17TWFpblBhZ2V9PlxyXG4gICAgICAgICAgICAgICAgICAgIDxJbmRleFJvdXRlIGNvbXBvbmVudD17TG9nb25WaWV3fS8+LlxyXG4gICAgICAgICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiaG9tZVwiIGNvbXBvbmVudD17SG9tZVZpZXd9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCJhYm91dFwiIGNvbXBvbmVudD17QWJvdXRWaWV3fSAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwicmVnaXN0ZXJcIiBjb21wb25lbnQ9e1JlZ2lzdGVyVmlld30gLz5cclxuICAgICAgICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cImxvZ29uXCIgY29tcG9uZW50PXtMb2dvblZpZXd9IC8+XHJcbiAgICAgICAgICAgICAgICA8L1JvdXRlPlxyXG4gICAgICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIqXCIgY29tcG9uZW50PXtOb3RGb3VuZFBhZ2V9Lz5cclxuICAgICAgICAgICAgPC9SZWR1eFJvdXRlcj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBBcHBsaWNhdGlvblJvdXRlcjtcclxuIiwidmFyIGRpc3BhdGNoZXI7XHJcblxyXG5mdW5jdGlvbiBzZXQodmFsdWUpIHtcclxuICAgIGRpc3BhdGNoZXIgPSB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGlzcGF0Y2goYWN0aW9uKSB7XHJcbiAgICByZXR1cm4gZGlzcGF0Y2hlcihhY3Rpb24pO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgICBzZXQ6IHNldCxcclxuICAgIGRpc3BhdGNoOiBkaXNwYXRjaFxyXG59IiwiaW1wb3J0IHsgY29tYmluZVJlZHVjZXJzIH0gZnJvbSAncmVkdXgnO1xyXG5pbXBvcnQgeyByb3V0ZXJTdGF0ZVJlZHVjZXIgfSBmcm9tICdyZWR1eC1yb3V0ZXInO1xyXG5pbXBvcnQgeyByZWR1Y2VyIGFzIHVzZXJSZWR1Y2VyIH0gZnJvbSAnLi91c2VyJztcclxuXHJcbmNvbnN0IHJlZHVjZXJzID0gY29tYmluZVJlZHVjZXJzKHtcclxuICAgIHJvdXRlcjogcm91dGVyU3RhdGVSZWR1Y2VyLFxyXG4gICAgdXNlcjogdXNlclJlZHVjZXJcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCByZWR1Y2VyczsiLCJpbXBvcnQgZGlzcGF0Y2hlciBmcm9tICcuL2Rpc3BhdGNoZXInO1xyXG52YXIgZGlzcGF0Y2ggPSBkaXNwYXRjaGVyLmRpc3BhdGNoO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZXJTdGF0dXMgPSB7XHJcbiAgICBub3RBdXRoZW50aWNhdGVkOiAnbm90QXV0aGVudGljYXRlZCcsXHJcbiAgICBhdXRoZW50aWNhdGVkOiAnYXV0aGVudGljYXRlZCcsXHJcbiAgICBhc3NvY2lhdGVFeHRlcm5hbDogJ2Fzc29jaWF0ZUV4dGVybmFsJyxcclxuICAgIHZhbHVlczogWydub3RBdXRoZW50aWNhdGVkJywgJ2F1dGhlbnRpY2F0ZWQnLCAnYXNzb2NpYXRlRXh0ZXJuYWwnXVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGFjdGlvbnNEZWZpbml0aW9ucyA9IHtcclxuICAgIExPR19PRkY6ICdMT0dfT0ZGJyxcclxuICAgIFxyXG4gICAgTE9HX09OOiAnTE9HX09OJyxcclxuICAgIExPR19PTl9QRU5ESU5HOiAnTE9HX09OX1BFTkRJTkcnLFxyXG4gICAgTE9HX09OX0ZBSUxFRDogJ0xPR19PTl9GQUlMRUQnLFxyXG5cclxuICAgIFJFR0lTVEVSOiAnUkVHSVNURVInLFxyXG4gICAgUkVHSVNURVJfUEVORElORzogJ1JFR0lTVEVSX1BFTkRJTkcnLFxyXG4gICAgXHJcbiAgICBBU1NPQ0lBVEVfRVhURVJOQUw6ICdBU1NPQ0lBVEVfRVhURVJOQUwnLFxyXG4gICAgQVNTT0NJQVRFX0VYVEVSTkFMX1BFTkRJTkc6ICdBU1NPQ0lBVEVfRVhURVJOQUxfUEVORElORycsXHJcbiAgICBBU1NPQ0lBVEVfRVhURVJOQUxfRkFJTEVEOiAnQVNTT0NJQVRFX0VYVEVSTkFMX0ZBSUxFRCdcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBhY3Rpb25zID0ge1xyXG4gICAgbG9nb246IGZ1bmN0aW9uKG5hbWUsIHJlZnJlc2hUb2tlbnMpIHtcclxuICAgICAgICByZXR1cm4gZGlzcGF0Y2goe1xyXG4gICAgICAgICAgICB0eXBlOiBhY3Rpb25zRGVmaW5pdGlvbnMuTE9HX09OLFxyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICByZWZyZXNoVG9rZW5zOiByZWZyZXNoVG9rZW5zXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvZ29uUGVuZGluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKHtcclxuICAgICAgICAgICAgdHlwZTogYWN0aW9uc0RlZmluaXRpb25zLkxPR19PTl9QRU5ESU5HXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvZ29uRmFpbGVkOiBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKHtcclxuICAgICAgICAgICAgdHlwZTogYWN0aW9uc0RlZmluaXRpb25zLkxPR19PTl9GQUlMRUQsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9nb2ZmOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gZGlzcGF0Y2goe1xyXG4gICAgICAgICAgICB0eXBlOiBhY3Rpb25zRGVmaW5pdGlvbnMuTE9HX09GRlxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICByZWdpc3RlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKHtcclxuICAgICAgICAgICAgdHlwZTogYWN0aW9uc0RlZmluaXRpb25zLlJFR0lTVEVSXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlZ2lzdGVyUGVuZGluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKHtcclxuICAgICAgICAgICAgdHlwZTogYWN0aW9uc0RlZmluaXRpb25zLlJFR0lTVEVSX1BFTkRJTkdcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgYXNzb2NpYXRlRXh0ZXJuYWw6IGZ1bmN0aW9uKHByb3ZpZGVyLCBleHRlcm5hbEFjY2Vzc1Rva2VuLCBleHRlcm5hbFVzZXJOYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKHtcclxuICAgICAgICAgICAgdHlwZTogYWN0aW9uc0RlZmluaXRpb25zLkFTU09DSUFURV9FWFRFUk5BTCxcclxuICAgICAgICAgICAgcHJvdmlkZXI6IHByb3ZpZGVyLFxyXG4gICAgICAgICAgICBleHRlcm5hbEFjY2Vzc1Rva2VuOiBleHRlcm5hbEFjY2Vzc1Rva2VuLFxyXG4gICAgICAgICAgICBleHRlcm5hbFVzZXJOYW1lOiBleHRlcm5hbFVzZXJOYW1lXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBhc3NvY2lhdGVFeHRlcm5hbFBlbmRpbmc6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gZGlzcGF0Y2goe1xyXG4gICAgICAgICAgICB0eXBlOiBhY3Rpb25zRGVmaW5pdGlvbnMuQVNTT0NJQVRFX0VYVEVSTkFMX1BFTkRJTkdcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgYXNzb2NpYXRlRXh0ZXJuYWxGYWlsZWQ6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKHtcclxuICAgICAgICAgICAgdHlwZTogYWN0aW9uc0RlZmluaXRpb25zLkFTU09DSUFURV9FWFRFUk5BTF9GQUlMRUQsIFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5jb25zdCBub3RBdXRoZW50aWNhdGVkID0geyBzdGF0dXM6IHVzZXJTdGF0dXMubm90QXV0aGVudGljYXRlZCB9O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZXIoc3RhdGUgPSBub3RBdXRoZW50aWNhdGVkLCBhY3Rpb24pIHtcclxuICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcclxuICAgICAgICBjYXNlIGFjdGlvbnNEZWZpbml0aW9ucy5MT0dfT046XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHVzZXJTdGF0dXMuYXV0aGVudGljYXRlZCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IGFjdGlvbi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc2luZzogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY2FzZSBhY3Rpb25zRGVmaW5pdGlvbnMuTE9HX09OX1BFTkRJRzpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogdXNlclN0YXR1cy5ub3RBdXRoZW50aWNhdGVkLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogc3RhdGUubmFtZSxcclxuICAgICAgICAgICAgICAgIHByb2Nlc3Npbmc6IHRydWVcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY2FzZSBhY3Rpb25zRGVmaW5pdGlvbnMuTE9HX09OX0ZBSUxFRDpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogdXNlclN0YXR1cy5ub3RBdXRoZW50aWNhdGVkLCBcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGFjdGlvbi5tZXNzYWdlXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGNhc2UgYWN0aW9uc0RlZmluaXRpb25zLkxPR19PRkY6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHVzZXJTdGF0dXMubm90QXV0aGVudGljYXRlZFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBjYXNlIGFjdGlvbnNEZWZpbml0aW9ucy5SRUdJU1RFUjpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogdXNlclN0YXR1cy5ub3RBdXRoZW50aWNhdGVkLFxyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc2luZzogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY2FzZSBhY3Rpb25zRGVmaW5pdGlvbnMuUkVHSVNURVJfUEVORElORzpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogdXNlclN0YXR1cy5ub3RBdXRoZW50aWNhdGVkLFxyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc2luZzogdHJ1ZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBjYXNlIGFjdGlvbnNEZWZpbml0aW9ucy5BU1NPQ0lBVEVfRVhURVJOQUw6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHVzZXJTdGF0dXMuYXNzb2NpYXRlRXh0ZXJuYWwsXHJcbiAgICAgICAgICAgICAgICBwcm92aWRlcjogYWN0aW9uLnByb3ZpZGVyLFxyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxBY2Nlc3NUb2tlbjogYWN0aW9uLmV4dGVybmFsQWNjZXNzVG9rZW4sXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbFVzZXJOYW1lOiBhY3Rpb24uZXh0ZXJuYWxVc2VyTmFtZSxcclxuICAgICAgICAgICAgICAgIHByb2Nlc3Npbmc6IGZhbHNlXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGNhc2UgYWN0aW9uc0RlZmluaXRpb25zLkFTU09DSUFURV9FWFRFUk5BTF9QRU5ESU5HOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiB1c2VyU3RhdHVzLmFzc29jaWF0ZUV4dGVybmFsLFxyXG4gICAgICAgICAgICAgICAgcHJvdmlkZXI6IHN0YXRlLnByb3ZpZGVyLFxyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxBY2Nlc3NUb2tlbjogc3RhdGUuZXh0ZXJuYWxBY2Nlc3NUb2tlbixcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsVXNlck5hbWU6IHN0YXRlLmV4dGVybmFsVXNlck5hbWUsXHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzaW5nOiB0cnVlXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGNhc2UgYWN0aW9uc0RlZmluaXRpb25zLkFTU09DSUFURV9FWFRFUk5BTF9GQUlMRUQ6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHVzZXJTdGF0dXMuYXNzb2NpYXRlRXh0ZXJuYWwsIFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYWN0aW9uLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICBwcm92aWRlcjogc3RhdGUucHJvdmlkZXIsXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbEFjY2Vzc1Rva2VuOiBzdGF0ZS5leHRlcm5hbEFjY2Vzc1Rva2VuLFxyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxVc2VyTmFtZTogc3RhdGUuZXh0ZXJuYWxVc2VyTmFtZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICB9XHJcbn07IiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGNyZWF0ZURldlRvb2xzO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3JlYWN0UmVkdXhMaWJDb21wb25lbnRzQ3JlYXRlQWxsID0gcmVxdWlyZSgncmVhY3QtcmVkdXgvbGliL2NvbXBvbmVudHMvY3JlYXRlQWxsJyk7XG5cbnZhciBfcmVhY3RSZWR1eExpYkNvbXBvbmVudHNDcmVhdGVBbGwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RSZWR1eExpYkNvbXBvbmVudHNDcmVhdGVBbGwpO1xuXG52YXIgX2RldlRvb2xzID0gcmVxdWlyZSgnLi9kZXZUb29scycpO1xuXG5mdW5jdGlvbiBjcmVhdGVEZXZUb29scyhSZWFjdCkge1xuICB2YXIgUHJvcFR5cGVzID0gUmVhY3QuUHJvcFR5cGVzO1xuICB2YXIgQ29tcG9uZW50ID0gUmVhY3QuQ29tcG9uZW50O1xuXG4gIHZhciBfY3JlYXRlQWxsID0gX3JlYWN0UmVkdXhMaWJDb21wb25lbnRzQ3JlYXRlQWxsMlsnZGVmYXVsdCddKFJlYWN0KTtcblxuICB2YXIgY29ubmVjdCA9IF9jcmVhdGVBbGwuY29ubmVjdDtcblxuICB2YXIgRGV2VG9vbHMgPSAoZnVuY3Rpb24gKF9Db21wb25lbnQpIHtcbiAgICBfaW5oZXJpdHMoRGV2VG9vbHMsIF9Db21wb25lbnQpO1xuXG4gICAgZnVuY3Rpb24gRGV2VG9vbHMoKSB7XG4gICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX0RldlRvb2xzKTtcblxuICAgICAgX0NvbXBvbmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIERldlRvb2xzLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICB2YXIgTW9uaXRvciA9IHRoaXMucHJvcHMubW9uaXRvcjtcblxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTW9uaXRvciwgdGhpcy5wcm9wcyk7XG4gICAgfTtcblxuICAgIHZhciBfRGV2VG9vbHMgPSBEZXZUb29scztcbiAgICBEZXZUb29scyA9IGNvbm5lY3QoZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSwgX2RldlRvb2xzLkFjdGlvbkNyZWF0b3JzKShEZXZUb29scykgfHwgRGV2VG9vbHM7XG4gICAgcmV0dXJuIERldlRvb2xzO1xuICB9KShDb21wb25lbnQpO1xuXG4gIHJldHVybiAoZnVuY3Rpb24gKF9Db21wb25lbnQyKSB7XG4gICAgX2luaGVyaXRzKERldlRvb2xzV3JhcHBlciwgX0NvbXBvbmVudDIpO1xuXG4gICAgX2NyZWF0ZUNsYXNzKERldlRvb2xzV3JhcHBlciwgbnVsbCwgW3tcbiAgICAgIGtleTogJ3Byb3BUeXBlcycsXG4gICAgICB2YWx1ZToge1xuICAgICAgICBtb25pdG9yOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgICBzdG9yZTogUHJvcFR5cGVzLnNoYXBlKHtcbiAgICAgICAgICBkZXZUb29sc1N0b3JlOiBQcm9wVHlwZXMuc2hhcGUoe1xuICAgICAgICAgICAgZGlzcGF0Y2g6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcbiAgICAgICAgICB9KS5pc1JlcXVpcmVkXG4gICAgICAgIH0pLmlzUmVxdWlyZWRcbiAgICAgIH0sXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfV0pO1xuXG4gICAgZnVuY3Rpb24gRGV2VG9vbHNXcmFwcGVyKHByb3BzLCBjb250ZXh0KSB7XG4gICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRGV2VG9vbHNXcmFwcGVyKTtcblxuICAgICAgaWYgKHByb3BzLnN0b3JlICYmICFwcm9wcy5zdG9yZS5kZXZUb29sc1N0b3JlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvdWxkIG5vdCBmaW5kIHRoZSBkZXZUb29scyBzdG9yZSBpbnNpZGUgeW91ciBzdG9yZS4gJyArICdIYXZlIHlvdSBhcHBsaWVkIGRldlRvb2xzKCkgc3RvcmUgZW5oYW5jZXI/Jyk7XG4gICAgICB9XG4gICAgICBfQ29tcG9uZW50Mi5jYWxsKHRoaXMsIHByb3BzLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICBEZXZUb29sc1dyYXBwZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KERldlRvb2xzLCBfZXh0ZW5kcyh7fSwgdGhpcy5wcm9wcywge1xuICAgICAgICBzdG9yZTogdGhpcy5wcm9wcy5zdG9yZS5kZXZUb29sc1N0b3JlIH0pKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIERldlRvb2xzV3JhcHBlcjtcbiAgfSkoQ29tcG9uZW50KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBkZXZUb29scztcbnZhciBBY3Rpb25UeXBlcyA9IHtcbiAgUEVSRk9STV9BQ1RJT046ICdQRVJGT1JNX0FDVElPTicsXG4gIFJFU0VUOiAnUkVTRVQnLFxuICBST0xMQkFDSzogJ1JPTExCQUNLJyxcbiAgQ09NTUlUOiAnQ09NTUlUJyxcbiAgU1dFRVA6ICdTV0VFUCcsXG4gIFRPR0dMRV9BQ1RJT046ICdUT0dHTEVfQUNUSU9OJyxcbiAgSlVNUF9UT19TVEFURTogJ0pVTVBfVE9fU1RBVEUnLFxuICBTRVRfTU9OSVRPUl9TVEFURTogJ1NFVF9NT05JVE9SX1NUQVRFJyxcbiAgUkVDT01QVVRFX1NUQVRFUzogJ1JFQ09NUFVURV9TVEFURVMnXG59O1xuXG52YXIgSU5JVF9BQ1RJT04gPSB7XG4gIHR5cGU6ICdAQElOSVQnXG59O1xuXG5mdW5jdGlvbiB0b2dnbGUob2JqLCBrZXkpIHtcbiAgdmFyIGNsb25lID0gX2V4dGVuZHMoe30sIG9iaik7XG4gIGlmIChjbG9uZVtrZXldKSB7XG4gICAgZGVsZXRlIGNsb25lW2tleV07XG4gIH0gZWxzZSB7XG4gICAgY2xvbmVba2V5XSA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIGNsb25lO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBuZXh0IGVudHJ5IGluIHRoZSBsb2cgYnkgYXBwbHlpbmcgYW4gYWN0aW9uLlxuICovXG5mdW5jdGlvbiBjb21wdXRlTmV4dEVudHJ5KHJlZHVjZXIsIGFjdGlvbiwgc3RhdGUsIGVycm9yKSB7XG4gIGlmIChlcnJvcikge1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICBlcnJvcjogJ0ludGVycnVwdGVkIGJ5IGFuIGVycm9yIHVwIHRoZSBjaGFpbidcbiAgICB9O1xuICB9XG5cbiAgdmFyIG5leHRTdGF0ZSA9IHN0YXRlO1xuICB2YXIgbmV4dEVycm9yID0gdW5kZWZpbmVkO1xuICB0cnkge1xuICAgIG5leHRTdGF0ZSA9IHJlZHVjZXIoc3RhdGUsIGFjdGlvbik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIG5leHRFcnJvciA9IGVyci50b1N0cmluZygpO1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrIHx8IGVycik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN0YXRlOiBuZXh0U3RhdGUsXG4gICAgZXJyb3I6IG5leHRFcnJvclxuICB9O1xufVxuXG4vKipcbiAqIFJ1bnMgdGhlIHJlZHVjZXIgb24gYWxsIGFjdGlvbnMgdG8gZ2V0IGEgZnJlc2ggY29tcHV0YXRpb24gbG9nLlxuICogSXQncyBwcm9iYWJseSBhIGdvb2QgaWRlYSB0byBkbyB0aGlzIG9ubHkgaWYgdGhlIGNvZGUgaGFzIGNoYW5nZWQsXG4gKiBidXQgdW50aWwgd2UgaGF2ZSBzb21lIHRlc3RzIHdlJ2xsIGp1c3QgZG8gaXQgZXZlcnkgdGltZSBhbiBhY3Rpb24gZmlyZXMuXG4gKi9cbmZ1bmN0aW9uIHJlY29tcHV0ZVN0YXRlcyhyZWR1Y2VyLCBjb21taXR0ZWRTdGF0ZSwgc3RhZ2VkQWN0aW9ucywgc2tpcHBlZEFjdGlvbnMpIHtcbiAgdmFyIGNvbXB1dGVkU3RhdGVzID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFnZWRBY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGFjdGlvbiA9IHN0YWdlZEFjdGlvbnNbaV07XG5cbiAgICB2YXIgcHJldmlvdXNFbnRyeSA9IGNvbXB1dGVkU3RhdGVzW2kgLSAxXTtcbiAgICB2YXIgcHJldmlvdXNTdGF0ZSA9IHByZXZpb3VzRW50cnkgPyBwcmV2aW91c0VudHJ5LnN0YXRlIDogY29tbWl0dGVkU3RhdGU7XG4gICAgdmFyIHByZXZpb3VzRXJyb3IgPSBwcmV2aW91c0VudHJ5ID8gcHJldmlvdXNFbnRyeS5lcnJvciA6IHVuZGVmaW5lZDtcblxuICAgIHZhciBzaG91bGRTa2lwID0gQm9vbGVhbihza2lwcGVkQWN0aW9uc1tpXSk7XG4gICAgdmFyIGVudHJ5ID0gc2hvdWxkU2tpcCA/IHByZXZpb3VzRW50cnkgOiBjb21wdXRlTmV4dEVudHJ5KHJlZHVjZXIsIGFjdGlvbiwgcHJldmlvdXNTdGF0ZSwgcHJldmlvdXNFcnJvcik7XG5cbiAgICBjb21wdXRlZFN0YXRlcy5wdXNoKGVudHJ5KTtcbiAgfVxuXG4gIHJldHVybiBjb21wdXRlZFN0YXRlcztcbn1cblxuLyoqXG4gKiBMaWZ0cyB0aGUgYXBwIHN0YXRlIHJlZHVjZXIgaW50byBhIERldlRvb2xzIHN0YXRlIHJlZHVjZXIuXG4gKi9cbmZ1bmN0aW9uIGxpZnRSZWR1Y2VyKHJlZHVjZXIsIGluaXRpYWxTdGF0ZSkge1xuICB2YXIgaW5pdGlhbExpZnRlZFN0YXRlID0ge1xuICAgIGNvbW1pdHRlZFN0YXRlOiBpbml0aWFsU3RhdGUsXG4gICAgc3RhZ2VkQWN0aW9uczogW0lOSVRfQUNUSU9OXSxcbiAgICBza2lwcGVkQWN0aW9uczoge30sXG4gICAgY3VycmVudFN0YXRlSW5kZXg6IDAsXG4gICAgbW9uaXRvclN0YXRlOiB7XG4gICAgICBpc1Zpc2libGU6IHRydWVcbiAgICB9LFxuICAgIHRpbWVzdGFtcHM6IFtEYXRlLm5vdygpXVxuICB9O1xuXG4gIC8qKlxuICAgKiBNYW5hZ2VzIGhvdyB0aGUgRGV2VG9vbHMgYWN0aW9ucyBtb2RpZnkgdGhlIERldlRvb2xzIHN0YXRlLlxuICAgKi9cbiAgcmV0dXJuIGZ1bmN0aW9uIGxpZnRlZFJlZHVjZXIobGlmdGVkU3RhdGUsIGxpZnRlZEFjdGlvbikge1xuICAgIGlmIChsaWZ0ZWRTdGF0ZSA9PT0gdW5kZWZpbmVkKSBsaWZ0ZWRTdGF0ZSA9IGluaXRpYWxMaWZ0ZWRTdGF0ZTtcblxuICAgIHZhciBzaG91bGRSZWNvbXB1dGVTdGF0ZXMgPSB0cnVlO1xuICAgIHZhciBjb21taXR0ZWRTdGF0ZSA9IGxpZnRlZFN0YXRlLmNvbW1pdHRlZFN0YXRlO1xuICAgIHZhciBzdGFnZWRBY3Rpb25zID0gbGlmdGVkU3RhdGUuc3RhZ2VkQWN0aW9ucztcbiAgICB2YXIgc2tpcHBlZEFjdGlvbnMgPSBsaWZ0ZWRTdGF0ZS5za2lwcGVkQWN0aW9ucztcbiAgICB2YXIgY29tcHV0ZWRTdGF0ZXMgPSBsaWZ0ZWRTdGF0ZS5jb21wdXRlZFN0YXRlcztcbiAgICB2YXIgY3VycmVudFN0YXRlSW5kZXggPSBsaWZ0ZWRTdGF0ZS5jdXJyZW50U3RhdGVJbmRleDtcbiAgICB2YXIgbW9uaXRvclN0YXRlID0gbGlmdGVkU3RhdGUubW9uaXRvclN0YXRlO1xuICAgIHZhciB0aW1lc3RhbXBzID0gbGlmdGVkU3RhdGUudGltZXN0YW1wcztcblxuICAgIHN3aXRjaCAobGlmdGVkQWN0aW9uLnR5cGUpIHtcbiAgICAgIGNhc2UgQWN0aW9uVHlwZXMuUkVTRVQ6XG4gICAgICAgIGNvbW1pdHRlZFN0YXRlID0gaW5pdGlhbFN0YXRlO1xuICAgICAgICBzdGFnZWRBY3Rpb25zID0gW0lOSVRfQUNUSU9OXTtcbiAgICAgICAgc2tpcHBlZEFjdGlvbnMgPSB7fTtcbiAgICAgICAgY3VycmVudFN0YXRlSW5kZXggPSAwO1xuICAgICAgICB0aW1lc3RhbXBzID0gW2xpZnRlZEFjdGlvbi50aW1lc3RhbXBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQWN0aW9uVHlwZXMuQ09NTUlUOlxuICAgICAgICBjb21taXR0ZWRTdGF0ZSA9IGNvbXB1dGVkU3RhdGVzW2N1cnJlbnRTdGF0ZUluZGV4XS5zdGF0ZTtcbiAgICAgICAgc3RhZ2VkQWN0aW9ucyA9IFtJTklUX0FDVElPTl07XG4gICAgICAgIHNraXBwZWRBY3Rpb25zID0ge307XG4gICAgICAgIGN1cnJlbnRTdGF0ZUluZGV4ID0gMDtcbiAgICAgICAgdGltZXN0YW1wcyA9IFtsaWZ0ZWRBY3Rpb24udGltZXN0YW1wXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEFjdGlvblR5cGVzLlJPTExCQUNLOlxuICAgICAgICBzdGFnZWRBY3Rpb25zID0gW0lOSVRfQUNUSU9OXTtcbiAgICAgICAgc2tpcHBlZEFjdGlvbnMgPSB7fTtcbiAgICAgICAgY3VycmVudFN0YXRlSW5kZXggPSAwO1xuICAgICAgICB0aW1lc3RhbXBzID0gW2xpZnRlZEFjdGlvbi50aW1lc3RhbXBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQWN0aW9uVHlwZXMuVE9HR0xFX0FDVElPTjpcbiAgICAgICAgc2tpcHBlZEFjdGlvbnMgPSB0b2dnbGUoc2tpcHBlZEFjdGlvbnMsIGxpZnRlZEFjdGlvbi5pbmRleCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBY3Rpb25UeXBlcy5KVU1QX1RPX1NUQVRFOlxuICAgICAgICBjdXJyZW50U3RhdGVJbmRleCA9IGxpZnRlZEFjdGlvbi5pbmRleDtcbiAgICAgICAgLy8gT3B0aW1pemF0aW9uOiB3ZSBrbm93IHRoZSBoaXN0b3J5IGhhcyBub3QgY2hhbmdlZC5cbiAgICAgICAgc2hvdWxkUmVjb21wdXRlU3RhdGVzID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBY3Rpb25UeXBlcy5TV0VFUDpcbiAgICAgICAgc3RhZ2VkQWN0aW9ucyA9IHN0YWdlZEFjdGlvbnMuZmlsdGVyKGZ1bmN0aW9uIChfLCBpKSB7XG4gICAgICAgICAgcmV0dXJuICFza2lwcGVkQWN0aW9uc1tpXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRpbWVzdGFtcHMgPSB0aW1lc3RhbXBzLmZpbHRlcihmdW5jdGlvbiAoXywgaSkge1xuICAgICAgICAgIHJldHVybiAhc2tpcHBlZEFjdGlvbnNbaV07XG4gICAgICAgIH0pO1xuICAgICAgICBza2lwcGVkQWN0aW9ucyA9IHt9O1xuICAgICAgICBjdXJyZW50U3RhdGVJbmRleCA9IE1hdGgubWluKGN1cnJlbnRTdGF0ZUluZGV4LCBzdGFnZWRBY3Rpb25zLmxlbmd0aCAtIDEpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQWN0aW9uVHlwZXMuUEVSRk9STV9BQ1RJT046XG4gICAgICAgIGlmIChjdXJyZW50U3RhdGVJbmRleCA9PT0gc3RhZ2VkQWN0aW9ucy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgY3VycmVudFN0YXRlSW5kZXgrKztcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YWdlZEFjdGlvbnMgPSBbXS5jb25jYXQoc3RhZ2VkQWN0aW9ucywgW2xpZnRlZEFjdGlvbi5hY3Rpb25dKTtcbiAgICAgICAgdGltZXN0YW1wcyA9IFtdLmNvbmNhdCh0aW1lc3RhbXBzLCBbbGlmdGVkQWN0aW9uLnRpbWVzdGFtcF0pO1xuXG4gICAgICAgIC8vIE9wdGltaXphdGlvbjogd2Uga25vdyB0aGF0IHRoZSBwYXN0IGhhcyBub3QgY2hhbmdlZC5cbiAgICAgICAgc2hvdWxkUmVjb21wdXRlU3RhdGVzID0gZmFsc2U7XG4gICAgICAgIC8vIEluc3RlYWQgb2YgcmVjb21wdXRpbmcgdGhlIHN0YXRlcywgYXBwZW5kIHRoZSBuZXh0IG9uZS5cbiAgICAgICAgdmFyIHByZXZpb3VzRW50cnkgPSBjb21wdXRlZFN0YXRlc1tjb21wdXRlZFN0YXRlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIG5leHRFbnRyeSA9IGNvbXB1dGVOZXh0RW50cnkocmVkdWNlciwgbGlmdGVkQWN0aW9uLmFjdGlvbiwgcHJldmlvdXNFbnRyeS5zdGF0ZSwgcHJldmlvdXNFbnRyeS5lcnJvcik7XG4gICAgICAgIGNvbXB1dGVkU3RhdGVzID0gW10uY29uY2F0KGNvbXB1dGVkU3RhdGVzLCBbbmV4dEVudHJ5XSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBY3Rpb25UeXBlcy5TRVRfTU9OSVRPUl9TVEFURTpcbiAgICAgICAgbW9uaXRvclN0YXRlID0gbGlmdGVkQWN0aW9uLm1vbml0b3JTdGF0ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEFjdGlvblR5cGVzLlJFQ09NUFVURV9TVEFURVM6XG4gICAgICAgIHN0YWdlZEFjdGlvbnMgPSBsaWZ0ZWRBY3Rpb24uc3RhZ2VkQWN0aW9ucztcbiAgICAgICAgdGltZXN0YW1wcyA9IGxpZnRlZEFjdGlvbi50aW1lc3RhbXBzO1xuICAgICAgICBjb21taXR0ZWRTdGF0ZSA9IGxpZnRlZEFjdGlvbi5jb21taXR0ZWRTdGF0ZTtcbiAgICAgICAgY3VycmVudFN0YXRlSW5kZXggPSBzdGFnZWRBY3Rpb25zLmxlbmd0aCAtIDE7XG4gICAgICAgIHNraXBwZWRBY3Rpb25zID0ge307XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHNob3VsZFJlY29tcHV0ZVN0YXRlcykge1xuICAgICAgY29tcHV0ZWRTdGF0ZXMgPSByZWNvbXB1dGVTdGF0ZXMocmVkdWNlciwgY29tbWl0dGVkU3RhdGUsIHN0YWdlZEFjdGlvbnMsIHNraXBwZWRBY3Rpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29tbWl0dGVkU3RhdGU6IGNvbW1pdHRlZFN0YXRlLFxuICAgICAgc3RhZ2VkQWN0aW9uczogc3RhZ2VkQWN0aW9ucyxcbiAgICAgIHNraXBwZWRBY3Rpb25zOiBza2lwcGVkQWN0aW9ucyxcbiAgICAgIGNvbXB1dGVkU3RhdGVzOiBjb21wdXRlZFN0YXRlcyxcbiAgICAgIGN1cnJlbnRTdGF0ZUluZGV4OiBjdXJyZW50U3RhdGVJbmRleCxcbiAgICAgIG1vbml0b3JTdGF0ZTogbW9uaXRvclN0YXRlLFxuICAgICAgdGltZXN0YW1wczogdGltZXN0YW1wc1xuICAgIH07XG4gIH07XG59XG5cbi8qKlxuICogTGlmdHMgYW4gYXBwIGFjdGlvbiB0byBhIERldlRvb2xzIGFjdGlvbi5cbiAqL1xuZnVuY3Rpb24gbGlmdEFjdGlvbihhY3Rpb24pIHtcbiAgdmFyIGxpZnRlZEFjdGlvbiA9IHtcbiAgICB0eXBlOiBBY3Rpb25UeXBlcy5QRVJGT1JNX0FDVElPTixcbiAgICBhY3Rpb246IGFjdGlvbixcbiAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgfTtcbiAgcmV0dXJuIGxpZnRlZEFjdGlvbjtcbn1cblxuLyoqXG4gKiBVbmxpZnRzIHRoZSBEZXZUb29scyBzdGF0ZSB0byB0aGUgYXBwIHN0YXRlLlxuICovXG5mdW5jdGlvbiB1bmxpZnRTdGF0ZShsaWZ0ZWRTdGF0ZSkge1xuICB2YXIgY29tcHV0ZWRTdGF0ZXMgPSBsaWZ0ZWRTdGF0ZS5jb21wdXRlZFN0YXRlcztcbiAgdmFyIGN1cnJlbnRTdGF0ZUluZGV4ID0gbGlmdGVkU3RhdGUuY3VycmVudFN0YXRlSW5kZXg7XG4gIHZhciBzdGF0ZSA9IGNvbXB1dGVkU3RhdGVzW2N1cnJlbnRTdGF0ZUluZGV4XS5zdGF0ZTtcblxuICByZXR1cm4gc3RhdGU7XG59XG5cbi8qKlxuICogVW5saWZ0cyB0aGUgRGV2VG9vbHMgc3RvcmUgdG8gYWN0IGxpa2UgdGhlIGFwcCdzIHN0b3JlLlxuICovXG5mdW5jdGlvbiB1bmxpZnRTdG9yZShsaWZ0ZWRTdG9yZSwgcmVkdWNlcikge1xuICB2YXIgbGFzdERlZmluZWRTdGF0ZSA9IHVuZGVmaW5lZDtcbiAgcmV0dXJuIF9leHRlbmRzKHt9LCBsaWZ0ZWRTdG9yZSwge1xuICAgIGRldlRvb2xzU3RvcmU6IGxpZnRlZFN0b3JlLFxuICAgIGRpc3BhdGNoOiBmdW5jdGlvbiBkaXNwYXRjaChhY3Rpb24pIHtcbiAgICAgIGxpZnRlZFN0b3JlLmRpc3BhdGNoKGxpZnRBY3Rpb24oYWN0aW9uKSk7XG4gICAgICByZXR1cm4gYWN0aW9uO1xuICAgIH0sXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uIGdldFN0YXRlKCkge1xuICAgICAgdmFyIHN0YXRlID0gdW5saWZ0U3RhdGUobGlmdGVkU3RvcmUuZ2V0U3RhdGUoKSk7XG4gICAgICBpZiAoc3RhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBsYXN0RGVmaW5lZFN0YXRlID0gc3RhdGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGFzdERlZmluZWRTdGF0ZTtcbiAgICB9LFxuICAgIGdldFJlZHVjZXI6IGZ1bmN0aW9uIGdldFJlZHVjZXIoKSB7XG4gICAgICByZXR1cm4gcmVkdWNlcjtcbiAgICB9LFxuICAgIHJlcGxhY2VSZWR1Y2VyOiBmdW5jdGlvbiByZXBsYWNlUmVkdWNlcihuZXh0UmVkdWNlcikge1xuICAgICAgbGlmdGVkU3RvcmUucmVwbGFjZVJlZHVjZXIobGlmdFJlZHVjZXIobmV4dFJlZHVjZXIpKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIEFjdGlvbiBjcmVhdG9ycyB0byBjaGFuZ2UgdGhlIERldlRvb2xzIHN0YXRlLlxuICovXG52YXIgQWN0aW9uQ3JlYXRvcnMgPSB7XG4gIHJlc2V0OiBmdW5jdGlvbiByZXNldCgpIHtcbiAgICByZXR1cm4geyB0eXBlOiBBY3Rpb25UeXBlcy5SRVNFVCwgdGltZXN0YW1wOiBEYXRlLm5vdygpIH07XG4gIH0sXG4gIHJvbGxiYWNrOiBmdW5jdGlvbiByb2xsYmFjaygpIHtcbiAgICByZXR1cm4geyB0eXBlOiBBY3Rpb25UeXBlcy5ST0xMQkFDSywgdGltZXN0YW1wOiBEYXRlLm5vdygpIH07XG4gIH0sXG4gIGNvbW1pdDogZnVuY3Rpb24gY29tbWl0KCkge1xuICAgIHJldHVybiB7IHR5cGU6IEFjdGlvblR5cGVzLkNPTU1JVCwgdGltZXN0YW1wOiBEYXRlLm5vdygpIH07XG4gIH0sXG4gIHN3ZWVwOiBmdW5jdGlvbiBzd2VlcCgpIHtcbiAgICByZXR1cm4geyB0eXBlOiBBY3Rpb25UeXBlcy5TV0VFUCB9O1xuICB9LFxuICB0b2dnbGVBY3Rpb246IGZ1bmN0aW9uIHRvZ2dsZUFjdGlvbihpbmRleCkge1xuICAgIHJldHVybiB7IHR5cGU6IEFjdGlvblR5cGVzLlRPR0dMRV9BQ1RJT04sIGluZGV4OiBpbmRleCB9O1xuICB9LFxuICBqdW1wVG9TdGF0ZTogZnVuY3Rpb24ganVtcFRvU3RhdGUoaW5kZXgpIHtcbiAgICByZXR1cm4geyB0eXBlOiBBY3Rpb25UeXBlcy5KVU1QX1RPX1NUQVRFLCBpbmRleDogaW5kZXggfTtcbiAgfSxcbiAgc2V0TW9uaXRvclN0YXRlOiBmdW5jdGlvbiBzZXRNb25pdG9yU3RhdGUobW9uaXRvclN0YXRlKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogQWN0aW9uVHlwZXMuU0VUX01PTklUT1JfU1RBVEUsIG1vbml0b3JTdGF0ZTogbW9uaXRvclN0YXRlIH07XG4gIH0sXG4gIHJlY29tcHV0ZVN0YXRlczogZnVuY3Rpb24gcmVjb21wdXRlU3RhdGVzKGNvbW1pdHRlZFN0YXRlLCBzdGFnZWRBY3Rpb25zKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IEFjdGlvblR5cGVzLlJFQ09NUFVURV9TVEFURVMsXG4gICAgICBjb21taXR0ZWRTdGF0ZTogY29tbWl0dGVkU3RhdGUsXG4gICAgICBzdGFnZWRBY3Rpb25zOiBzdGFnZWRBY3Rpb25zXG4gICAgfTtcbiAgfVxufTtcblxuZXhwb3J0cy5BY3Rpb25DcmVhdG9ycyA9IEFjdGlvbkNyZWF0b3JzO1xuLyoqXG4gKiBSZWR1eCBEZXZUb29scyBtaWRkbGV3YXJlLlxuICovXG5cbmZ1bmN0aW9uIGRldlRvb2xzKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKG5leHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHJlZHVjZXIsIGluaXRpYWxTdGF0ZSkge1xuICAgICAgdmFyIGxpZnRlZFJlZHVjZXIgPSBsaWZ0UmVkdWNlcihyZWR1Y2VyLCBpbml0aWFsU3RhdGUpO1xuICAgICAgdmFyIGxpZnRlZFN0b3JlID0gbmV4dChsaWZ0ZWRSZWR1Y2VyKTtcbiAgICAgIHZhciBzdG9yZSA9IHVubGlmdFN0b3JlKGxpZnRlZFN0b3JlLCByZWR1Y2VyKTtcbiAgICAgIHJldHVybiBzdG9yZTtcbiAgICB9O1xuICB9O1xufSIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlKG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqWydkZWZhdWx0J10gOiBvYmo7IH1cblxudmFyIF9kZXZUb29scyA9IHJlcXVpcmUoJy4vZGV2VG9vbHMnKTtcblxuZXhwb3J0cy5kZXZUb29scyA9IF9pbnRlcm9wUmVxdWlyZShfZGV2VG9vbHMpO1xuXG52YXIgX3BlcnNpc3RTdGF0ZSA9IHJlcXVpcmUoJy4vcGVyc2lzdFN0YXRlJyk7XG5cbmV4cG9ydHMucGVyc2lzdFN0YXRlID0gX2ludGVyb3BSZXF1aXJlKF9wZXJzaXN0U3RhdGUpOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gcGVyc2lzdFN0YXRlO1xuXG5mdW5jdGlvbiBwZXJzaXN0U3RhdGUoc2Vzc2lvbklkKSB7XG4gIHZhciBzdGF0ZURlc2VyaWFsaXplciA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IG51bGwgOiBhcmd1bWVudHNbMV07XG4gIHZhciBhY3Rpb25EZXNlcmlhbGl6ZXIgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDIgfHwgYXJndW1lbnRzWzJdID09PSB1bmRlZmluZWQgPyBudWxsIDogYXJndW1lbnRzWzJdO1xuXG4gIGlmICghc2Vzc2lvbklkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChuZXh0KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV4dC5hcHBseSh1bmRlZmluZWQsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBkZXNlcmlhbGl6ZVN0YXRlKGZ1bGxTdGF0ZSkge1xuICAgIHJldHVybiBfZXh0ZW5kcyh7fSwgZnVsbFN0YXRlLCB7XG4gICAgICBjb21taXR0ZWRTdGF0ZTogc3RhdGVEZXNlcmlhbGl6ZXIoZnVsbFN0YXRlLmNvbW1pdHRlZFN0YXRlKSxcbiAgICAgIGNvbXB1dGVkU3RhdGVzOiBmdWxsU3RhdGUuY29tcHV0ZWRTdGF0ZXMubWFwKGZ1bmN0aW9uIChjb21wdXRlZFN0YXRlKSB7XG4gICAgICAgIHJldHVybiBfZXh0ZW5kcyh7fSwgY29tcHV0ZWRTdGF0ZSwge1xuICAgICAgICAgIHN0YXRlOiBzdGF0ZURlc2VyaWFsaXplcihjb21wdXRlZFN0YXRlLnN0YXRlKVxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZXNlcmlhbGl6ZUFjdGlvbnMoZnVsbFN0YXRlKSB7XG4gICAgcmV0dXJuIF9leHRlbmRzKHt9LCBmdWxsU3RhdGUsIHtcbiAgICAgIHN0YWdlZEFjdGlvbnM6IGZ1bGxTdGF0ZS5zdGFnZWRBY3Rpb25zLm1hcChmdW5jdGlvbiAoYWN0aW9uKSB7XG4gICAgICAgIHJldHVybiBhY3Rpb25EZXNlcmlhbGl6ZXIoYWN0aW9uKTtcbiAgICAgIH0pXG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZXNlcmlhbGl6ZShmdWxsU3RhdGUpIHtcbiAgICBpZiAoIWZ1bGxTdGF0ZSkge1xuICAgICAgcmV0dXJuIGZ1bGxTdGF0ZTtcbiAgICB9XG4gICAgdmFyIGRlc2VyaWFsaXplZFN0YXRlID0gZnVsbFN0YXRlO1xuICAgIGlmICh0eXBlb2Ygc3RhdGVEZXNlcmlhbGl6ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGRlc2VyaWFsaXplZFN0YXRlID0gZGVzZXJpYWxpemVTdGF0ZShkZXNlcmlhbGl6ZWRTdGF0ZSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYWN0aW9uRGVzZXJpYWxpemVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBkZXNlcmlhbGl6ZWRTdGF0ZSA9IGRlc2VyaWFsaXplQWN0aW9ucyhkZXNlcmlhbGl6ZWRTdGF0ZSk7XG4gICAgfVxuICAgIHJldHVybiBkZXNlcmlhbGl6ZWRTdGF0ZTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAobmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAocmVkdWNlciwgaW5pdGlhbFN0YXRlKSB7XG4gICAgICB2YXIga2V5ID0gJ3JlZHV4LWRldi1zZXNzaW9uLScgKyBzZXNzaW9uSWQ7XG5cbiAgICAgIHZhciBmaW5hbEluaXRpYWxTdGF0ZSA9IHVuZGVmaW5lZDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpbmFsSW5pdGlhbFN0YXRlID0gZGVzZXJpYWxpemUoSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKSkgfHwgaW5pdGlhbFN0YXRlO1xuICAgICAgICBuZXh0KHJlZHVjZXIsIGluaXRpYWxTdGF0ZSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignQ291bGQgbm90IHJlYWQgZGVidWcgc2Vzc2lvbiBmcm9tIGxvY2FsU3RvcmFnZTonLCBlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGZpbmFsSW5pdGlhbFN0YXRlID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBzdG9yZSA9IG5leHQocmVkdWNlciwgZmluYWxJbml0aWFsU3RhdGUpO1xuXG4gICAgICByZXR1cm4gX2V4dGVuZHMoe30sIHN0b3JlLCB7XG4gICAgICAgIGRpc3BhdGNoOiBmdW5jdGlvbiBkaXNwYXRjaChhY3Rpb24pIHtcbiAgICAgICAgICBzdG9yZS5kaXNwYXRjaChhY3Rpb24pO1xuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoc3RvcmUuZ2V0U3RhdGUoKSkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQ291bGQgbm90IHdyaXRlIGRlYnVnIHNlc3Npb24gdG8gbG9jYWxTdG9yYWdlOicsIGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBhY3Rpb247XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZXhwb3J0cy5nZXREZWZhdWx0U3R5bGUgPSBnZXREZWZhdWx0U3R5bGU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxuZnVuY3Rpb24gZ2V0RGVmYXVsdFN0eWxlKHByb3BzKSB7XG4gIHZhciBsZWZ0ID0gcHJvcHMubGVmdDtcbiAgdmFyIHJpZ2h0ID0gcHJvcHMucmlnaHQ7XG4gIHZhciBib3R0b20gPSBwcm9wcy5ib3R0b207XG4gIHZhciB0b3AgPSBwcm9wcy50b3A7XG5cbiAgaWYgKHR5cGVvZiBsZWZ0ID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcmlnaHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmlnaHQgPSB0cnVlO1xuICB9XG4gIGlmICh0eXBlb2YgdG9wID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgYm90dG9tID09PSAndW5kZWZpbmVkJykge1xuICAgIGJvdHRvbSA9IHRydWU7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgIHpJbmRleDogMTAwMDAsXG4gICAgZm9udFNpemU6IDE3LFxuICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICBvcGFjaXR5OiAxLFxuICAgIGNvbG9yOiAnd2hpdGUnLFxuICAgIGxlZnQ6IGxlZnQgPyAwIDogdW5kZWZpbmVkLFxuICAgIHJpZ2h0OiByaWdodCA/IDAgOiB1bmRlZmluZWQsXG4gICAgdG9wOiB0b3AgPyAwIDogdW5kZWZpbmVkLFxuICAgIGJvdHRvbTogYm90dG9tID8gMCA6IHVuZGVmaW5lZCxcbiAgICBtYXhIZWlnaHQ6IGJvdHRvbSAmJiB0b3AgPyAnMTAwJScgOiAnMzAlJyxcbiAgICBtYXhXaWR0aDogbGVmdCAmJiByaWdodCA/ICcxMDAlJyA6ICczMCUnLFxuICAgIHdvcmRXcmFwOiAnYnJlYWstd29yZCcsXG4gICAgYm94U2l6aW5nOiAnYm9yZGVyLWJveCcsXG4gICAgYm94U2hhZG93OiAnLTJweCAwIDdweCAwIHJnYmEoMCwgMCwgMCwgMC41KSdcbiAgfTtcbn1cblxudmFyIERlYnVnUGFuZWwgPSAoZnVuY3Rpb24gKF9Db21wb25lbnQpIHtcbiAgX2luaGVyaXRzKERlYnVnUGFuZWwsIF9Db21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIERlYnVnUGFuZWwoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIERlYnVnUGFuZWwpO1xuXG4gICAgX0NvbXBvbmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgRGVidWdQYW5lbC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdkaXYnLFxuICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHRoaXMucHJvcHMuZ2V0U3R5bGUodGhpcy5wcm9wcyksIHRoaXMucHJvcHMuc3R5bGUpIH0sXG4gICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgKTtcbiAgfTtcblxuICBfY3JlYXRlQ2xhc3MoRGVidWdQYW5lbCwgbnVsbCwgW3tcbiAgICBrZXk6ICdwcm9wVHlwZXMnLFxuICAgIHZhbHVlOiB7XG4gICAgICBsZWZ0OiBfcmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgICByaWdodDogX3JlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgICAgYm90dG9tOiBfcmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgICB0b3A6IF9yZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICAgIGdldFN0eWxlOiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9LCB7XG4gICAga2V5OiAnZGVmYXVsdFByb3BzJyxcbiAgICB2YWx1ZToge1xuICAgICAgZ2V0U3R5bGU6IGdldERlZmF1bHRTdHlsZVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9XSk7XG5cbiAgcmV0dXJuIERlYnVnUGFuZWw7XG59KShfcmVhY3QuQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gRGVidWdQYW5lbDsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSBuZXdPYmpbJ2RlZmF1bHQnXSA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9Mb2dNb25pdG9yRW50cnkgPSByZXF1aXJlKCcuL0xvZ01vbml0b3JFbnRyeScpO1xuXG52YXIgX0xvZ01vbml0b3JFbnRyeTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Mb2dNb25pdG9yRW50cnkpO1xuXG52YXIgX0xvZ01vbml0b3JCdXR0b24gPSByZXF1aXJlKCcuL0xvZ01vbml0b3JCdXR0b24nKTtcblxudmFyIF9Mb2dNb25pdG9yQnV0dG9uMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0xvZ01vbml0b3JCdXR0b24pO1xuXG52YXIgX3RoZW1lcyA9IHJlcXVpcmUoJy4vdGhlbWVzJyk7XG5cbnZhciB0aGVtZXMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfdGhlbWVzKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgZm9udEZhbWlseTogJ21vbmFjbywgQ29uc29sYXMsIEx1Y2lkYSBDb25zb2xlLCBtb25vc3BhY2UnLFxuICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgIG92ZXJmbG93WTogJ2hpZGRlbicsXG4gICAgd2lkdGg6ICcxMDAlJyxcbiAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICBtaW5XaWR0aDogMzAwXG4gIH0sXG4gIGJ1dHRvbkJhcjoge1xuICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgYm9yZGVyQm90dG9tV2lkdGg6IDEsXG4gICAgYm9yZGVyQm90dG9tU3R5bGU6ICdzb2xpZCcsXG4gICAgYm9yZGVyQ29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgekluZGV4OiAxLFxuICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICBmbGV4RGlyZWN0aW9uOiAncm93J1xuICB9LFxuICBlbGVtZW50czoge1xuICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgIGxlZnQ6IDAsXG4gICAgcmlnaHQ6IDAsXG4gICAgdG9wOiAzOCxcbiAgICBib3R0b206IDAsXG4gICAgb3ZlcmZsb3dYOiAnaGlkZGVuJyxcbiAgICBvdmVyZmxvd1k6ICdhdXRvJ1xuICB9XG59O1xuXG52YXIgTG9nTW9uaXRvciA9IChmdW5jdGlvbiAoX0NvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoTG9nTW9uaXRvciwgX0NvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gTG9nTW9uaXRvcihwcm9wcykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMb2dNb25pdG9yKTtcblxuICAgIF9Db21wb25lbnQuY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlS2V5UHJlc3MuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgTG9nTW9uaXRvci5wcm90b3R5cGUuY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyA9IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG4gICAgdmFyIG5vZGUgPSBfcmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmVsZW1lbnRzKTtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIHRoaXMuc2Nyb2xsRG93biA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLnN0YWdlZEFjdGlvbnMubGVuZ3RoIDwgbmV4dFByb3BzLnN0YWdlZEFjdGlvbnMubGVuZ3RoKSB7XG4gICAgICB2YXIgc2Nyb2xsVG9wID0gbm9kZS5zY3JvbGxUb3A7XG4gICAgICB2YXIgb2Zmc2V0SGVpZ2h0ID0gbm9kZS5vZmZzZXRIZWlnaHQ7XG4gICAgICB2YXIgc2Nyb2xsSGVpZ2h0ID0gbm9kZS5zY3JvbGxIZWlnaHQ7XG5cbiAgICAgIHRoaXMuc2Nyb2xsRG93biA9IE1hdGguYWJzKHNjcm9sbEhlaWdodCAtIChzY3JvbGxUb3AgKyBvZmZzZXRIZWlnaHQpKSA8IDIwO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNjcm9sbERvd24gPSBmYWxzZTtcbiAgICB9XG4gIH07XG5cbiAgTG9nTW9uaXRvci5wcm90b3R5cGUuY29tcG9uZW50RGlkVXBkYXRlID0gZnVuY3Rpb24gY29tcG9uZW50RGlkVXBkYXRlKCkge1xuICAgIHZhciBub2RlID0gX3JlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5lbGVtZW50cyk7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLnNjcm9sbERvd24pIHtcbiAgICAgIHZhciBvZmZzZXRIZWlnaHQgPSBub2RlLm9mZnNldEhlaWdodDtcbiAgICAgIHZhciBzY3JvbGxIZWlnaHQgPSBub2RlLnNjcm9sbEhlaWdodDtcblxuICAgICAgbm9kZS5zY3JvbGxUb3AgPSBzY3JvbGxIZWlnaHQgLSBvZmZzZXRIZWlnaHQ7XG4gICAgICB0aGlzLnNjcm9sbERvd24gPSBmYWxzZTtcbiAgICB9XG4gIH07XG5cbiAgTG9nTW9uaXRvci5wcm90b3R5cGUuY29tcG9uZW50V2lsbE1vdW50ID0gZnVuY3Rpb24gY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgIHZhciB2aXNpYmxlT25Mb2FkID0gdGhpcy5wcm9wcy52aXNpYmxlT25Mb2FkO1xuICAgIHZhciBtb25pdG9yU3RhdGUgPSB0aGlzLnByb3BzLm1vbml0b3JTdGF0ZTtcblxuICAgIHRoaXMucHJvcHMuc2V0TW9uaXRvclN0YXRlKF9leHRlbmRzKHt9LCBtb25pdG9yU3RhdGUsIHtcbiAgICAgIGlzVmlzaWJsZTogdmlzaWJsZU9uTG9hZFxuICAgIH0pKTtcbiAgfTtcblxuICBMb2dNb25pdG9yLnByb3RvdHlwZS5oYW5kbGVSb2xsYmFjayA9IGZ1bmN0aW9uIGhhbmRsZVJvbGxiYWNrKCkge1xuICAgIHRoaXMucHJvcHMucm9sbGJhY2soKTtcbiAgfTtcblxuICBMb2dNb25pdG9yLnByb3RvdHlwZS5oYW5kbGVTd2VlcCA9IGZ1bmN0aW9uIGhhbmRsZVN3ZWVwKCkge1xuICAgIHRoaXMucHJvcHMuc3dlZXAoKTtcbiAgfTtcblxuICBMb2dNb25pdG9yLnByb3RvdHlwZS5oYW5kbGVDb21taXQgPSBmdW5jdGlvbiBoYW5kbGVDb21taXQoKSB7XG4gICAgdGhpcy5wcm9wcy5jb21taXQoKTtcbiAgfTtcblxuICBMb2dNb25pdG9yLnByb3RvdHlwZS5oYW5kbGVUb2dnbGVBY3Rpb24gPSBmdW5jdGlvbiBoYW5kbGVUb2dnbGVBY3Rpb24oaW5kZXgpIHtcbiAgICB0aGlzLnByb3BzLnRvZ2dsZUFjdGlvbihpbmRleCk7XG4gIH07XG5cbiAgTG9nTW9uaXRvci5wcm90b3R5cGUuaGFuZGxlUmVzZXQgPSBmdW5jdGlvbiBoYW5kbGVSZXNldCgpIHtcbiAgICB0aGlzLnByb3BzLnJlc2V0KCk7XG4gIH07XG5cbiAgTG9nTW9uaXRvci5wcm90b3R5cGUuaGFuZGxlS2V5UHJlc3MgPSBmdW5jdGlvbiBoYW5kbGVLZXlQcmVzcyhldmVudCkge1xuICAgIHZhciBtb25pdG9yU3RhdGUgPSB0aGlzLnByb3BzLm1vbml0b3JTdGF0ZTtcblxuICAgIGlmIChldmVudC5jdHJsS2V5ICYmIGV2ZW50LmtleUNvZGUgPT09IDcyKSB7XG4gICAgICAvLyBDdHJsK0hcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnByb3BzLnNldE1vbml0b3JTdGF0ZShfZXh0ZW5kcyh7fSwgbW9uaXRvclN0YXRlLCB7XG4gICAgICAgIGlzVmlzaWJsZTogIW1vbml0b3JTdGF0ZS5pc1Zpc2libGVcbiAgICAgIH0pKTtcbiAgICB9XG4gIH07XG5cbiAgTG9nTW9uaXRvci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBlbGVtZW50cyA9IFtdO1xuICAgIHZhciBfcHJvcHMgPSB0aGlzLnByb3BzO1xuICAgIHZhciBtb25pdG9yU3RhdGUgPSBfcHJvcHMubW9uaXRvclN0YXRlO1xuICAgIHZhciBza2lwcGVkQWN0aW9ucyA9IF9wcm9wcy5za2lwcGVkQWN0aW9ucztcbiAgICB2YXIgc3RhZ2VkQWN0aW9ucyA9IF9wcm9wcy5zdGFnZWRBY3Rpb25zO1xuICAgIHZhciBjb21wdXRlZFN0YXRlcyA9IF9wcm9wcy5jb21wdXRlZFN0YXRlcztcbiAgICB2YXIgc2VsZWN0ID0gX3Byb3BzLnNlbGVjdDtcblxuICAgIHZhciB0aGVtZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMudGhlbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAodHlwZW9mIHRoZW1lc1t0aGlzLnByb3BzLnRoZW1lXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhlbWUgPSB0aGVtZXNbdGhpcy5wcm9wcy50aGVtZV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0RldlRvb2xzIHRoZW1lICcgKyB0aGlzLnByb3BzLnRoZW1lICsgJyBub3QgZm91bmQsIGRlZmF1bHRpbmcgdG8gbmljaW5hYm94Jyk7XG4gICAgICAgIHRoZW1lID0gdGhlbWVzLm5pY2luYWJveDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhlbWUgPSB0aGlzLnByb3BzLnRoZW1lO1xuICAgIH1cbiAgICBpZiAoIW1vbml0b3JTdGF0ZS5pc1Zpc2libGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhZ2VkQWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGFjdGlvbiA9IHN0YWdlZEFjdGlvbnNbaV07XG4gICAgICB2YXIgX2NvbXB1dGVkU3RhdGVzJGkgPSBjb21wdXRlZFN0YXRlc1tpXTtcbiAgICAgIHZhciBzdGF0ZSA9IF9jb21wdXRlZFN0YXRlcyRpLnN0YXRlO1xuICAgICAgdmFyIGVycm9yID0gX2NvbXB1dGVkU3RhdGVzJGkuZXJyb3I7XG5cbiAgICAgIHZhciBwcmV2aW91c1N0YXRlID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgIHByZXZpb3VzU3RhdGUgPSBjb21wdXRlZFN0YXRlc1tpIC0gMV0uc3RhdGU7XG4gICAgICB9XG4gICAgICBlbGVtZW50cy5wdXNoKF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9Mb2dNb25pdG9yRW50cnkyWydkZWZhdWx0J10sIHsga2V5OiBpLFxuICAgICAgICBpbmRleDogaSxcbiAgICAgICAgdGhlbWU6IHRoZW1lLFxuICAgICAgICBzZWxlY3Q6IHNlbGVjdCxcbiAgICAgICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgcHJldmlvdXNTdGF0ZTogcHJldmlvdXNTdGF0ZSxcbiAgICAgICAgY29sbGFwc2VkOiBza2lwcGVkQWN0aW9uc1tpXSxcbiAgICAgICAgZXJyb3I6IGVycm9yLFxuICAgICAgICBvbkFjdGlvbkNsaWNrOiB0aGlzLmhhbmRsZVRvZ2dsZUFjdGlvbi5iaW5kKHRoaXMpIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnZGl2JyxcbiAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMuY29udGFpbmVyLCB7IGJhY2tncm91bmRDb2xvcjogdGhlbWUuYmFzZTAwIH0pIH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2RpdicsXG4gICAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMuYnV0dG9uQmFyLCB7IGJvcmRlckNvbG9yOiB0aGVtZS5iYXNlMDIgfSkgfSxcbiAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgX0xvZ01vbml0b3JCdXR0b24yWydkZWZhdWx0J10sXG4gICAgICAgICAgeyB0aGVtZTogdGhlbWUsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlUmVzZXQuYmluZCh0aGlzKSB9LFxuICAgICAgICAgICdSZXNldCdcbiAgICAgICAgKSxcbiAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgX0xvZ01vbml0b3JCdXR0b24yWydkZWZhdWx0J10sXG4gICAgICAgICAgeyB0aGVtZTogdGhlbWUsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlUm9sbGJhY2suYmluZCh0aGlzKSwgZW5hYmxlZDogY29tcHV0ZWRTdGF0ZXMubGVuZ3RoIH0sXG4gICAgICAgICAgJ1JldmVydCdcbiAgICAgICAgKSxcbiAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgX0xvZ01vbml0b3JCdXR0b24yWydkZWZhdWx0J10sXG4gICAgICAgICAgeyB0aGVtZTogdGhlbWUsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlU3dlZXAuYmluZCh0aGlzKSwgZW5hYmxlZDogT2JqZWN0LmtleXMoc2tpcHBlZEFjdGlvbnMpLnNvbWUoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICByZXR1cm4gc2tpcHBlZEFjdGlvbnNba2V5XTtcbiAgICAgICAgICAgIH0pIH0sXG4gICAgICAgICAgJ1N3ZWVwJ1xuICAgICAgICApLFxuICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICBfTG9nTW9uaXRvckJ1dHRvbjJbJ2RlZmF1bHQnXSxcbiAgICAgICAgICB7IHRoZW1lOiB0aGVtZSwgb25DbGljazogdGhpcy5oYW5kbGVDb21taXQuYmluZCh0aGlzKSwgZW5hYmxlZDogY29tcHV0ZWRTdGF0ZXMubGVuZ3RoID4gMSB9LFxuICAgICAgICAgICdDb21taXQnXG4gICAgICAgIClcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2RpdicsXG4gICAgICAgIHsgc3R5bGU6IHN0eWxlcy5lbGVtZW50cywgcmVmOiAnZWxlbWVudHMnIH0sXG4gICAgICAgIGVsZW1lbnRzXG4gICAgICApXG4gICAgKTtcbiAgfTtcblxuICBfY3JlYXRlQ2xhc3MoTG9nTW9uaXRvciwgbnVsbCwgW3tcbiAgICBrZXk6ICdwcm9wVHlwZXMnLFxuICAgIHZhbHVlOiB7XG4gICAgICBjb21wdXRlZFN0YXRlczogX3JlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxuICAgICAgY3VycmVudFN0YXRlSW5kZXg6IF9yZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXG4gICAgICBtb25pdG9yU3RhdGU6IF9yZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICBzdGFnZWRBY3Rpb25zOiBfcmVhY3QuUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXG4gICAgICBza2lwcGVkQWN0aW9uczogX3JlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgIHJlc2V0OiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgIGNvbW1pdDogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICByb2xsYmFjazogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICBzd2VlcDogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICB0b2dnbGVBY3Rpb246IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAganVtcFRvU3RhdGU6IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgc2V0TW9uaXRvclN0YXRlOiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgIHNlbGVjdDogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICB2aXNpYmxlT25Mb2FkOiBfcmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgICB0aGVtZTogX3JlYWN0LlByb3BUeXBlcy5vbmVPZlR5cGUoW19yZWFjdC5Qcm9wVHlwZXMub2JqZWN0LCBfcmVhY3QuUHJvcFR5cGVzLnN0cmluZ10pXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH0sIHtcbiAgICBrZXk6ICdkZWZhdWx0UHJvcHMnLFxuICAgIHZhbHVlOiB7XG4gICAgICBzZWxlY3Q6IGZ1bmN0aW9uIHNlbGVjdChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9LFxuICAgICAgbW9uaXRvclN0YXRlOiB7IGlzVmlzaWJsZTogdHJ1ZSB9LFxuICAgICAgdGhlbWU6ICduaWNpbmFib3gnLFxuICAgICAgdmlzaWJsZU9uTG9hZDogdHJ1ZVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9XSk7XG5cbiAgcmV0dXJuIExvZ01vbml0b3I7XG59KShfcmVhY3QuQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gTG9nTW9uaXRvcjtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3V0aWxzQnJpZ2h0ZW4gPSByZXF1aXJlKCcuLi91dGlscy9icmlnaHRlbicpO1xuXG52YXIgX3V0aWxzQnJpZ2h0ZW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNCcmlnaHRlbik7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGJhc2U6IHtcbiAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICBmb250V2VpZ2h0OiAnYm9sZCcsXG4gICAgYm9yZGVyUmFkaXVzOiAzLFxuICAgIHBhZGRpbmc6IDQsXG4gICAgbWFyZ2luTGVmdDogMyxcbiAgICBtYXJnaW5SaWdodDogMyxcbiAgICBtYXJnaW5Ub3A6IDUsXG4gICAgbWFyZ2luQm90dG9tOiA1LFxuICAgIGZsZXhHcm93OiAxLFxuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgIGZvbnRTaXplOiAnMC44ZW0nLFxuICAgIGNvbG9yOiAnd2hpdGUnLFxuICAgIHRleHREZWNvcmF0aW9uOiAnbm9uZSdcbiAgfVxufTtcblxudmFyIExvZ01vbml0b3JCdXR0b24gPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKExvZ01vbml0b3JCdXR0b24sIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIExvZ01vbml0b3JCdXR0b24ocHJvcHMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTG9nTW9uaXRvckJ1dHRvbik7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmNhbGwodGhpcywgcHJvcHMpO1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBob3ZlcmVkOiBmYWxzZSxcbiAgICAgIGFjdGl2ZTogZmFsc2VcbiAgICB9O1xuICB9XG5cbiAgTG9nTW9uaXRvckJ1dHRvbi5wcm90b3R5cGUuaGFuZGxlTW91c2VFbnRlciA9IGZ1bmN0aW9uIGhhbmRsZU1vdXNlRW50ZXIoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7IGhvdmVyZWQ6IHRydWUgfSk7XG4gIH07XG5cbiAgTG9nTW9uaXRvckJ1dHRvbi5wcm90b3R5cGUuaGFuZGxlTW91c2VMZWF2ZSA9IGZ1bmN0aW9uIGhhbmRsZU1vdXNlTGVhdmUoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7IGhvdmVyZWQ6IGZhbHNlIH0pO1xuICB9O1xuXG4gIExvZ01vbml0b3JCdXR0b24ucHJvdG90eXBlLmhhbmRsZU1vdXNlRG93biA9IGZ1bmN0aW9uIGhhbmRsZU1vdXNlRG93bigpIHtcbiAgICB0aGlzLnNldFN0YXRlKHsgYWN0aXZlOiB0cnVlIH0pO1xuICB9O1xuXG4gIExvZ01vbml0b3JCdXR0b24ucHJvdG90eXBlLmhhbmRsZU1vdXNlVXAgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZVVwKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoeyBhY3RpdmU6IGZhbHNlIH0pO1xuICB9O1xuXG4gIExvZ01vbml0b3JCdXR0b24ucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbiBvbkNsaWNrKCkge1xuICAgIGlmICghdGhpcy5wcm9wcy5lbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLm9uQ2xpY2spIHtcbiAgICAgIHRoaXMucHJvcHMub25DbGljaygpO1xuICAgIH1cbiAgfTtcblxuICBMb2dNb25pdG9yQnV0dG9uLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIHN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlcy5iYXNlLCB7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTAyXG4gICAgfSk7XG4gICAgaWYgKHRoaXMucHJvcHMuZW5hYmxlZCAmJiB0aGlzLnN0YXRlLmhvdmVyZWQpIHtcbiAgICAgIHN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlLCB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogX3V0aWxzQnJpZ2h0ZW4yWydkZWZhdWx0J10odGhpcy5wcm9wcy50aGVtZS5iYXNlMDIsIDAuMilcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoIXRoaXMucHJvcHMuZW5hYmxlZCkge1xuICAgICAgc3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGUsIHtcbiAgICAgICAgb3BhY2l0eTogMC4yLFxuICAgICAgICBjdXJzb3I6ICd0ZXh0JyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQnXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2EnLFxuICAgICAgeyBvbk1vdXNlRW50ZXI6IHRoaXMuaGFuZGxlTW91c2VFbnRlci5iaW5kKHRoaXMpLFxuICAgICAgICBvbk1vdXNlTGVhdmU6IHRoaXMuaGFuZGxlTW91c2VMZWF2ZS5iaW5kKHRoaXMpLFxuICAgICAgICBvbk1vdXNlRG93bjogdGhpcy5oYW5kbGVNb3VzZURvd24uYmluZCh0aGlzKSxcbiAgICAgICAgb25Nb3VzZVVwOiB0aGlzLmhhbmRsZU1vdXNlVXAuYmluZCh0aGlzKSxcbiAgICAgICAgc3R5bGU6IHN0eWxlLCBvbkNsaWNrOiB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICk7XG4gIH07XG5cbiAgcmV0dXJuIExvZ01vbml0b3JCdXR0b247XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gTG9nTW9uaXRvckJ1dHRvbjtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0SnNvblRyZWUgPSByZXF1aXJlKCdyZWFjdC1qc29uLXRyZWUnKTtcblxudmFyIF9yZWFjdEpzb25UcmVlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0SnNvblRyZWUpO1xuXG52YXIgX0xvZ01vbml0b3JFbnRyeUFjdGlvbiA9IHJlcXVpcmUoJy4vTG9nTW9uaXRvckVudHJ5QWN0aW9uJyk7XG5cbnZhciBfTG9nTW9uaXRvckVudHJ5QWN0aW9uMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0xvZ01vbml0b3JFbnRyeUFjdGlvbik7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGVudHJ5OiB7XG4gICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZSdcbiAgfSxcbiAgdHJlZToge1xuICAgIHBhZGRpbmdMZWZ0OiAwXG4gIH1cbn07XG5cbnZhciBMb2dNb25pdG9yRW50cnkgPSAoZnVuY3Rpb24gKF9Db21wb25lbnQpIHtcbiAgX2luaGVyaXRzKExvZ01vbml0b3JFbnRyeSwgX0NvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gTG9nTW9uaXRvckVudHJ5KCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMb2dNb25pdG9yRW50cnkpO1xuXG4gICAgX0NvbXBvbmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgTG9nTW9uaXRvckVudHJ5LnByb3RvdHlwZS5wcmludFN0YXRlID0gZnVuY3Rpb24gcHJpbnRTdGF0ZShzdGF0ZSwgZXJyb3IpIHtcbiAgICB2YXIgZXJyb3JUZXh0ID0gZXJyb3I7XG4gICAgaWYgKCFlcnJvclRleHQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfcmVhY3RKc29uVHJlZTJbJ2RlZmF1bHQnXSwge1xuICAgICAgICAgIHRoZW1lOiB0aGlzLnByb3BzLnRoZW1lLFxuICAgICAgICAgIGtleU5hbWU6ICdzdGF0ZScsXG4gICAgICAgICAgZGF0YTogdGhpcy5wcm9wcy5zZWxlY3Qoc3RhdGUpLFxuICAgICAgICAgIHByZXZpb3VzRGF0YTogdGhpcy5wcm9wcy5zZWxlY3QodGhpcy5wcm9wcy5wcmV2aW91c1N0YXRlKSxcbiAgICAgICAgICBzdHlsZTogc3R5bGVzLnRyZWUgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgZXJyb3JUZXh0ID0gJ0Vycm9yIHNlbGVjdGluZyBzdGF0ZS4nO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnZGl2JyxcbiAgICAgIHsgc3R5bGU6IHtcbiAgICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDgsXG4gICAgICAgICAgcGFkZGluZ1RvcDogMjAsXG4gICAgICAgICAgcGFkZGluZ0xlZnQ6IDMwLFxuICAgICAgICAgIHBhZGRpbmdSaWdodDogMzAsXG4gICAgICAgICAgcGFkZGluZ0JvdHRvbTogMzVcbiAgICAgICAgfSB9LFxuICAgICAgZXJyb3JUZXh0XG4gICAgKTtcbiAgfTtcblxuICBMb2dNb25pdG9yRW50cnkucHJvdG90eXBlLmhhbmRsZUFjdGlvbkNsaWNrID0gZnVuY3Rpb24gaGFuZGxlQWN0aW9uQ2xpY2soKSB7XG4gICAgdmFyIF9wcm9wcyA9IHRoaXMucHJvcHM7XG4gICAgdmFyIGluZGV4ID0gX3Byb3BzLmluZGV4O1xuICAgIHZhciBvbkFjdGlvbkNsaWNrID0gX3Byb3BzLm9uQWN0aW9uQ2xpY2s7XG5cbiAgICBpZiAoaW5kZXggPiAwKSB7XG4gICAgICBvbkFjdGlvbkNsaWNrKGluZGV4KTtcbiAgICB9XG4gIH07XG5cbiAgTG9nTW9uaXRvckVudHJ5LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIF9wcm9wczIgPSB0aGlzLnByb3BzO1xuICAgIHZhciBpbmRleCA9IF9wcm9wczIuaW5kZXg7XG4gICAgdmFyIGVycm9yID0gX3Byb3BzMi5lcnJvcjtcbiAgICB2YXIgYWN0aW9uID0gX3Byb3BzMi5hY3Rpb247XG4gICAgdmFyIHN0YXRlID0gX3Byb3BzMi5zdGF0ZTtcbiAgICB2YXIgY29sbGFwc2VkID0gX3Byb3BzMi5jb2xsYXBzZWQ7XG5cbiAgICB2YXIgc3R5bGVFbnRyeSA9IHtcbiAgICAgIG9wYWNpdHk6IGNvbGxhcHNlZCA/IDAuNSA6IDEsXG4gICAgICBjdXJzb3I6IGluZGV4ID4gMCA/ICdwb2ludGVyJyA6ICdkZWZhdWx0J1xuICAgIH07XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2RpdicsXG4gICAgICB7IHN0eWxlOiB7IHRleHREZWNvcmF0aW9uOiBjb2xsYXBzZWQgPyAnbGluZS10aHJvdWdoJyA6ICdub25lJyB9IH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfTG9nTW9uaXRvckVudHJ5QWN0aW9uMlsnZGVmYXVsdCddLCB7XG4gICAgICAgIHRoZW1lOiB0aGlzLnByb3BzLnRoZW1lLFxuICAgICAgICBjb2xsYXBzZWQ6IGNvbGxhcHNlZCxcbiAgICAgICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgICAgIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQWN0aW9uQ2xpY2suYmluZCh0aGlzKSxcbiAgICAgICAgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMuZW50cnksIHN0eWxlRW50cnkpIH0pLFxuICAgICAgIWNvbGxhcHNlZCAmJiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2RpdicsXG4gICAgICAgIG51bGwsXG4gICAgICAgIHRoaXMucHJpbnRTdGF0ZShzdGF0ZSwgZXJyb3IpXG4gICAgICApXG4gICAgKTtcbiAgfTtcblxuICBfY3JlYXRlQ2xhc3MoTG9nTW9uaXRvckVudHJ5LCBudWxsLCBbe1xuICAgIGtleTogJ3Byb3BUeXBlcycsXG4gICAgdmFsdWU6IHtcbiAgICAgIGluZGV4OiBfcmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICAgICAgc3RhdGU6IF9yZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICBhY3Rpb246IF9yZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICBzZWxlY3Q6IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgZXJyb3I6IF9yZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgb25BY3Rpb25DbGljazogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICBjb2xsYXBzZWQ6IF9yZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9XSk7XG5cbiAgcmV0dXJuIExvZ01vbml0b3JFbnRyeTtcbn0pKF9yZWFjdC5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBMb2dNb25pdG9yRW50cnk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKG9iaiwga2V5cykgeyB2YXIgdGFyZ2V0ID0ge307IGZvciAodmFyIGkgaW4gb2JqKSB7IGlmIChrZXlzLmluZGV4T2YoaSkgPj0gMCkgY29udGludWU7IGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgaSkpIGNvbnRpbnVlOyB0YXJnZXRbaV0gPSBvYmpbaV07IH0gcmV0dXJuIHRhcmdldDsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0SnNvblRyZWUgPSByZXF1aXJlKCdyZWFjdC1qc29uLXRyZWUnKTtcblxudmFyIF9yZWFjdEpzb25UcmVlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0SnNvblRyZWUpO1xuXG52YXIgc3R5bGVzID0ge1xuICBhY3Rpb25CYXI6IHtcbiAgICBwYWRkaW5nVG9wOiA4LFxuICAgIHBhZGRpbmdCb3R0b206IDcsXG4gICAgcGFkZGluZ0xlZnQ6IDE2XG4gIH0sXG4gIHBheWxvYWQ6IHtcbiAgICBtYXJnaW46IDAsXG4gICAgb3ZlcmZsb3c6ICdhdXRvJ1xuICB9XG59O1xuXG52YXIgTG9nTW9uaXRvckFjdGlvbiA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoTG9nTW9uaXRvckFjdGlvbiwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gTG9nTW9uaXRvckFjdGlvbigpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTG9nTW9uaXRvckFjdGlvbik7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBMb2dNb25pdG9yQWN0aW9uLnByb3RvdHlwZS5yZW5kZXJQYXlsb2FkID0gZnVuY3Rpb24gcmVuZGVyUGF5bG9hZChwYXlsb2FkKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2RpdicsXG4gICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLnBheWxvYWQsIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTAwXG4gICAgICAgIH0pIH0sXG4gICAgICBPYmplY3Qua2V5cyhwYXlsb2FkKS5sZW5ndGggPiAwID8gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX3JlYWN0SnNvblRyZWUyWydkZWZhdWx0J10sIHsgdGhlbWU6IHRoaXMucHJvcHMudGhlbWUsIGtleU5hbWU6ICdhY3Rpb24nLCBkYXRhOiBwYXlsb2FkIH0pIDogJydcbiAgICApO1xuICB9O1xuXG4gIExvZ01vbml0b3JBY3Rpb24ucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgX3Byb3BzJGFjdGlvbiA9IHRoaXMucHJvcHMuYWN0aW9uO1xuICAgIHZhciB0eXBlID0gX3Byb3BzJGFjdGlvbi50eXBlO1xuXG4gICAgdmFyIHBheWxvYWQgPSBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMoX3Byb3BzJGFjdGlvbiwgWyd0eXBlJ10pO1xuXG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2RpdicsXG4gICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7XG4gICAgICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwMixcbiAgICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDZcbiAgICAgICAgfSwgdGhpcy5wcm9wcy5zdHlsZSkgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnZGl2JyxcbiAgICAgICAgeyBzdHlsZTogc3R5bGVzLmFjdGlvbkJhcixcbiAgICAgICAgICBvbkNsaWNrOiB0aGlzLnByb3BzLm9uQ2xpY2sgfSxcbiAgICAgICAgdHlwZVxuICAgICAgKSxcbiAgICAgICF0aGlzLnByb3BzLmNvbGxhcHNlZCA/IHRoaXMucmVuZGVyUGF5bG9hZChwYXlsb2FkKSA6ICcnXG4gICAgKTtcbiAgfTtcblxuICByZXR1cm4gTG9nTW9uaXRvckFjdGlvbjtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBMb2dNb25pdG9yQWN0aW9uO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmUob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmpbJ2RlZmF1bHQnXSA6IG9iajsgfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9jcmVhdGVEZXZUb29scyA9IHJlcXVpcmUoJy4uL2NyZWF0ZURldlRvb2xzJyk7XG5cbnZhciBfY3JlYXRlRGV2VG9vbHMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY3JlYXRlRGV2VG9vbHMpO1xuXG52YXIgRGV2VG9vbHMgPSBfY3JlYXRlRGV2VG9vbHMyWydkZWZhdWx0J10oX3JlYWN0MlsnZGVmYXVsdCddKTtcbmV4cG9ydHMuRGV2VG9vbHMgPSBEZXZUb29scztcblxudmFyIF9Mb2dNb25pdG9yID0gcmVxdWlyZSgnLi9Mb2dNb25pdG9yJyk7XG5cbmV4cG9ydHMuTG9nTW9uaXRvciA9IF9pbnRlcm9wUmVxdWlyZShfTG9nTW9uaXRvcik7XG5cbnZhciBfRGVidWdQYW5lbCA9IHJlcXVpcmUoJy4vRGVidWdQYW5lbCcpO1xuXG5leHBvcnRzLkRlYnVnUGFuZWwgPSBfaW50ZXJvcFJlcXVpcmUoX0RlYnVnUGFuZWwpOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnYXBhdGh5JyxcbiAgYXV0aG9yOiAnamFubmlrIHNpZWJlcnQgKGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5uaWtzKScsXG4gIGJhc2UwMDogJyMwMzFBMTYnLFxuICBiYXNlMDE6ICcjMEIzNDJEJyxcbiAgYmFzZTAyOiAnIzE4NEU0NScsXG4gIGJhc2UwMzogJyMyQjY4NUUnLFxuICBiYXNlMDQ6ICcjNUY5QzkyJyxcbiAgYmFzZTA1OiAnIzgxQjVBQycsXG4gIGJhc2UwNjogJyNBN0NFQzgnLFxuICBiYXNlMDc6ICcjRDJFN0U0JyxcbiAgYmFzZTA4OiAnIzNFOTY4OCcsXG4gIGJhc2UwOTogJyMzRTc5OTYnLFxuICBiYXNlMEE6ICcjM0U0Qzk2JyxcbiAgYmFzZTBCOiAnIzg4M0U5NicsXG4gIGJhc2UwQzogJyM5NjNFNEMnLFxuICBiYXNlMEQ6ICcjOTY4ODNFJyxcbiAgYmFzZTBFOiAnIzRDOTYzRScsXG4gIGJhc2UwRjogJyMzRTk2NUInXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdhc2hlcycsXG4gIGF1dGhvcjogJ2phbm5payBzaWViZXJ0IChodHRwczovL2dpdGh1Yi5jb20vamFubmlrcyknLFxuICBiYXNlMDA6ICcjMUMyMDIzJyxcbiAgYmFzZTAxOiAnIzM5M0Y0NScsXG4gIGJhc2UwMjogJyM1NjVFNjUnLFxuICBiYXNlMDM6ICcjNzQ3Qzg0JyxcbiAgYmFzZTA0OiAnI0FEQjNCQScsXG4gIGJhc2UwNTogJyNDN0NDRDEnLFxuICBiYXNlMDY6ICcjREZFMkU1JyxcbiAgYmFzZTA3OiAnI0YzRjRGNScsXG4gIGJhc2UwODogJyNDN0FFOTUnLFxuICBiYXNlMDk6ICcjQzdDNzk1JyxcbiAgYmFzZTBBOiAnI0FFQzc5NScsXG4gIGJhc2UwQjogJyM5NUM3QUUnLFxuICBiYXNlMEM6ICcjOTVBRUM3JyxcbiAgYmFzZTBEOiAnI0FFOTVDNycsXG4gIGJhc2UwRTogJyNDNzk1QUUnLFxuICBiYXNlMEY6ICcjQzc5NTk1J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnYXRlbGllciBkdW5lJyxcbiAgYXV0aG9yOiAnYnJhbSBkZSBoYWFuIChodHRwOi8vYXRlbGllcmJyYW0uZ2l0aHViLmlvL3N5bnRheC1oaWdobGlnaHRpbmcvYXRlbGllci1zY2hlbWVzL2R1bmUpJyxcbiAgYmFzZTAwOiAnIzIwMjAxZCcsXG4gIGJhc2UwMTogJyMyOTI4MjQnLFxuICBiYXNlMDI6ICcjNmU2YjVlJyxcbiAgYmFzZTAzOiAnIzdkN2E2OCcsXG4gIGJhc2UwNDogJyM5OTk1ODAnLFxuICBiYXNlMDU6ICcjYTZhMjhjJyxcbiAgYmFzZTA2OiAnI2U4ZTRjZicsXG4gIGJhc2UwNzogJyNmZWZiZWMnLFxuICBiYXNlMDg6ICcjZDczNzM3JyxcbiAgYmFzZTA5OiAnI2I2NTYxMScsXG4gIGJhc2UwQTogJyNjZmIwMTcnLFxuICBiYXNlMEI6ICcjNjBhYzM5JyxcbiAgYmFzZTBDOiAnIzFmYWQ4MycsXG4gIGJhc2UwRDogJyM2Njg0ZTEnLFxuICBiYXNlMEU6ICcjYjg1NGQ0JyxcbiAgYmFzZTBGOiAnI2Q0MzU1Midcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2F0ZWxpZXIgZm9yZXN0JyxcbiAgYXV0aG9yOiAnYnJhbSBkZSBoYWFuIChodHRwOi8vYXRlbGllcmJyYW0uZ2l0aHViLmlvL3N5bnRheC1oaWdobGlnaHRpbmcvYXRlbGllci1zY2hlbWVzL2ZvcmVzdCknLFxuICBiYXNlMDA6ICcjMWIxOTE4JyxcbiAgYmFzZTAxOiAnIzJjMjQyMScsXG4gIGJhc2UwMjogJyM2ODYxNWUnLFxuICBiYXNlMDM6ICcjNzY2ZTZiJyxcbiAgYmFzZTA0OiAnIzljOTQ5MScsXG4gIGJhc2UwNTogJyNhOGExOWYnLFxuICBiYXNlMDY6ICcjZTZlMmUwJyxcbiAgYmFzZTA3OiAnI2YxZWZlZScsXG4gIGJhc2UwODogJyNmMjJjNDAnLFxuICBiYXNlMDk6ICcjZGY1MzIwJyxcbiAgYmFzZTBBOiAnI2Q1OTExYScsXG4gIGJhc2UwQjogJyM1YWI3MzgnLFxuICBiYXNlMEM6ICcjMDBhZDljJyxcbiAgYmFzZTBEOiAnIzQwN2VlNycsXG4gIGJhc2UwRTogJyM2NjY2ZWEnLFxuICBiYXNlMEY6ICcjYzMzZmYzJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnYXRlbGllciBoZWF0aCcsXG4gIGF1dGhvcjogJ2JyYW0gZGUgaGFhbiAoaHR0cDovL2F0ZWxpZXJicmFtLmdpdGh1Yi5pby9zeW50YXgtaGlnaGxpZ2h0aW5nL2F0ZWxpZXItc2NoZW1lcy9oZWF0aCknLFxuICBiYXNlMDA6ICcjMWIxODFiJyxcbiAgYmFzZTAxOiAnIzI5MjMyOScsXG4gIGJhc2UwMjogJyM2OTVkNjknLFxuICBiYXNlMDM6ICcjNzc2OTc3JyxcbiAgYmFzZTA0OiAnIzllOGY5ZScsXG4gIGJhc2UwNTogJyNhYjliYWInLFxuICBiYXNlMDY6ICcjZDhjYWQ4JyxcbiAgYmFzZTA3OiAnI2Y3ZjNmNycsXG4gIGJhc2UwODogJyNjYTQwMmInLFxuICBiYXNlMDk6ICcjYTY1OTI2JyxcbiAgYmFzZTBBOiAnI2JiOGEzNScsXG4gIGJhc2UwQjogJyMzNzlhMzcnLFxuICBiYXNlMEM6ICcjMTU5MzkzJyxcbiAgYmFzZTBEOiAnIzUxNmFlYycsXG4gIGJhc2UwRTogJyM3YjU5YzAnLFxuICBiYXNlMEY6ICcjY2MzM2NjJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnYXRlbGllciBsYWtlc2lkZScsXG4gIGF1dGhvcjogJ2JyYW0gZGUgaGFhbiAoaHR0cDovL2F0ZWxpZXJicmFtLmdpdGh1Yi5pby9zeW50YXgtaGlnaGxpZ2h0aW5nL2F0ZWxpZXItc2NoZW1lcy9sYWtlc2lkZS8pJyxcbiAgYmFzZTAwOiAnIzE2MWIxZCcsXG4gIGJhc2UwMTogJyMxZjI5MmUnLFxuICBiYXNlMDI6ICcjNTE2ZDdiJyxcbiAgYmFzZTAzOiAnIzVhN2I4YycsXG4gIGJhc2UwNDogJyM3MTk1YTgnLFxuICBiYXNlMDU6ICcjN2VhMmI0JyxcbiAgYmFzZTA2OiAnI2MxZTRmNicsXG4gIGJhc2UwNzogJyNlYmY4ZmYnLFxuICBiYXNlMDg6ICcjZDIyZDcyJyxcbiAgYmFzZTA5OiAnIzkzNWMyNScsXG4gIGJhc2UwQTogJyM4YThhMGYnLFxuICBiYXNlMEI6ICcjNTY4YzNiJyxcbiAgYmFzZTBDOiAnIzJkOGY2ZicsXG4gIGJhc2UwRDogJyMyNTdmYWQnLFxuICBiYXNlMEU6ICcjNWQ1ZGIxJyxcbiAgYmFzZTBGOiAnI2I3MmRkMidcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2F0ZWxpZXIgc2Vhc2lkZScsXG4gIGF1dGhvcjogJ2JyYW0gZGUgaGFhbiAoaHR0cDovL2F0ZWxpZXJicmFtLmdpdGh1Yi5pby9zeW50YXgtaGlnaGxpZ2h0aW5nL2F0ZWxpZXItc2NoZW1lcy9zZWFzaWRlLyknLFxuICBiYXNlMDA6ICcjMTMxNTEzJyxcbiAgYmFzZTAxOiAnIzI0MjkyNCcsXG4gIGJhc2UwMjogJyM1ZTZlNWUnLFxuICBiYXNlMDM6ICcjNjg3ZDY4JyxcbiAgYmFzZTA0OiAnIzgwOTk4MCcsXG4gIGJhc2UwNTogJyM4Y2E2OGMnLFxuICBiYXNlMDY6ICcjY2ZlOGNmJyxcbiAgYmFzZTA3OiAnI2YwZmZmMCcsXG4gIGJhc2UwODogJyNlNjE5M2MnLFxuICBiYXNlMDk6ICcjODc3MTFkJyxcbiAgYmFzZTBBOiAnI2MzYzMyMicsXG4gIGJhc2UwQjogJyMyOWEzMjknLFxuICBiYXNlMEM6ICcjMTk5OWIzJyxcbiAgYmFzZTBEOiAnIzNkNjJmNScsXG4gIGJhc2UwRTogJyNhZDJiZWUnLFxuICBiYXNlMEY6ICcjZTYxOWMzJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnYmVzcGluJyxcbiAgYXV0aG9yOiAnamFuIHQuIHNvdHQnLFxuICBiYXNlMDA6ICcjMjgyMTFjJyxcbiAgYmFzZTAxOiAnIzM2MzEyZScsXG4gIGJhc2UwMjogJyM1ZTVkNWMnLFxuICBiYXNlMDM6ICcjNjY2NjY2JyxcbiAgYmFzZTA0OiAnIzc5Nzk3NycsXG4gIGJhc2UwNTogJyM4YTg5ODYnLFxuICBiYXNlMDY6ICcjOWQ5Yjk3JyxcbiAgYmFzZTA3OiAnI2JhYWU5ZScsXG4gIGJhc2UwODogJyNjZjZhNGMnLFxuICBiYXNlMDk6ICcjY2Y3ZDM0JyxcbiAgYmFzZTBBOiAnI2Y5ZWU5OCcsXG4gIGJhc2UwQjogJyM1NGJlMGQnLFxuICBiYXNlMEM6ICcjYWZjNGRiJyxcbiAgYmFzZTBEOiAnIzVlYTZlYScsXG4gIGJhc2UwRTogJyM5Yjg1OWQnLFxuICBiYXNlMEY6ICcjOTM3MTIxJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnYnJld2VyJyxcbiAgYXV0aG9yOiAndGltb3Row6llIHBvaXNvdCAoaHR0cDovL2dpdGh1Yi5jb20vdHBvaXNvdCknLFxuICBiYXNlMDA6ICcjMGMwZDBlJyxcbiAgYmFzZTAxOiAnIzJlMmYzMCcsXG4gIGJhc2UwMjogJyM1MTUyNTMnLFxuICBiYXNlMDM6ICcjNzM3NDc1JyxcbiAgYmFzZTA0OiAnIzk1OTY5NycsXG4gIGJhc2UwNTogJyNiN2I4YjknLFxuICBiYXNlMDY6ICcjZGFkYmRjJyxcbiAgYmFzZTA3OiAnI2ZjZmRmZScsXG4gIGJhc2UwODogJyNlMzFhMWMnLFxuICBiYXNlMDk6ICcjZTY1NTBkJyxcbiAgYmFzZTBBOiAnI2RjYTA2MCcsXG4gIGJhc2UwQjogJyMzMWEzNTQnLFxuICBiYXNlMEM6ICcjODBiMWQzJyxcbiAgYmFzZTBEOiAnIzMxODJiZCcsXG4gIGJhc2UwRTogJyM3NTZiYjEnLFxuICBiYXNlMEY6ICcjYjE1OTI4J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnYnJpZ2h0JyxcbiAgYXV0aG9yOiAnY2hyaXMga2VtcHNvbiAoaHR0cDovL2Nocmlza2VtcHNvbi5jb20pJyxcbiAgYmFzZTAwOiAnIzAwMDAwMCcsXG4gIGJhc2UwMTogJyMzMDMwMzAnLFxuICBiYXNlMDI6ICcjNTA1MDUwJyxcbiAgYmFzZTAzOiAnI2IwYjBiMCcsXG4gIGJhc2UwNDogJyNkMGQwZDAnLFxuICBiYXNlMDU6ICcjZTBlMGUwJyxcbiAgYmFzZTA2OiAnI2Y1ZjVmNScsXG4gIGJhc2UwNzogJyNmZmZmZmYnLFxuICBiYXNlMDg6ICcjZmIwMTIwJyxcbiAgYmFzZTA5OiAnI2ZjNmQyNCcsXG4gIGJhc2UwQTogJyNmZGEzMzEnLFxuICBiYXNlMEI6ICcjYTFjNjU5JyxcbiAgYmFzZTBDOiAnIzc2YzdiNycsXG4gIGJhc2UwRDogJyM2ZmIzZDInLFxuICBiYXNlMEU6ICcjZDM4MWMzJyxcbiAgYmFzZTBGOiAnI2JlNjQzYydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2NoYWxrJyxcbiAgYXV0aG9yOiAnY2hyaXMga2VtcHNvbiAoaHR0cDovL2Nocmlza2VtcHNvbi5jb20pJyxcbiAgYmFzZTAwOiAnIzE1MTUxNScsXG4gIGJhc2UwMTogJyMyMDIwMjAnLFxuICBiYXNlMDI6ICcjMzAzMDMwJyxcbiAgYmFzZTAzOiAnIzUwNTA1MCcsXG4gIGJhc2UwNDogJyNiMGIwYjAnLFxuICBiYXNlMDU6ICcjZDBkMGQwJyxcbiAgYmFzZTA2OiAnI2UwZTBlMCcsXG4gIGJhc2UwNzogJyNmNWY1ZjUnLFxuICBiYXNlMDg6ICcjZmI5ZmIxJyxcbiAgYmFzZTA5OiAnI2VkYTk4NycsXG4gIGJhc2UwQTogJyNkZGIyNmYnLFxuICBiYXNlMEI6ICcjYWNjMjY3JyxcbiAgYmFzZTBDOiAnIzEyY2ZjMCcsXG4gIGJhc2UwRDogJyM2ZmMyZWYnLFxuICBiYXNlMEU6ICcjZTFhM2VlJyxcbiAgYmFzZTBGOiAnI2RlYWY4Zidcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2NvZGVzY2hvb2wnLFxuICBhdXRob3I6ICdicmV0dG9mODYnLFxuICBiYXNlMDA6ICcjMjMyYzMxJyxcbiAgYmFzZTAxOiAnIzFjMzY1NycsXG4gIGJhc2UwMjogJyMyYTM0M2EnLFxuICBiYXNlMDM6ICcjM2Y0OTQ0JyxcbiAgYmFzZTA0OiAnIzg0ODk4YycsXG4gIGJhc2UwNTogJyM5ZWE3YTYnLFxuICBiYXNlMDY6ICcjYTdjZmEzJyxcbiAgYmFzZTA3OiAnI2I1ZDhmNicsXG4gIGJhc2UwODogJyMyYTU0OTEnLFxuICBiYXNlMDk6ICcjNDM4MjBkJyxcbiAgYmFzZTBBOiAnI2EwM2IxZScsXG4gIGJhc2UwQjogJyMyMzc5ODYnLFxuICBiYXNlMEM6ICcjYjAyZjMwJyxcbiAgYmFzZTBEOiAnIzQ4NGQ3OScsXG4gIGJhc2UwRTogJyNjNTk4MjAnLFxuICBiYXNlMEY6ICcjYzk4MzQ0J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnY29sb3JzJyxcbiAgYXV0aG9yOiAnbXJtcnMgKGh0dHA6Ly9jbHJzLmNjKScsXG4gIGJhc2UwMDogJyMxMTExMTEnLFxuICBiYXNlMDE6ICcjMzMzMzMzJyxcbiAgYmFzZTAyOiAnIzU1NTU1NScsXG4gIGJhc2UwMzogJyM3Nzc3NzcnLFxuICBiYXNlMDQ6ICcjOTk5OTk5JyxcbiAgYmFzZTA1OiAnI2JiYmJiYicsXG4gIGJhc2UwNjogJyNkZGRkZGQnLFxuICBiYXNlMDc6ICcjZmZmZmZmJyxcbiAgYmFzZTA4OiAnI2ZmNDEzNicsXG4gIGJhc2UwOTogJyNmZjg1MWInLFxuICBiYXNlMEE6ICcjZmZkYzAwJyxcbiAgYmFzZTBCOiAnIzJlY2M0MCcsXG4gIGJhc2UwQzogJyM3ZmRiZmYnLFxuICBiYXNlMEQ6ICcjMDA3NGQ5JyxcbiAgYmFzZTBFOiAnI2IxMGRjOScsXG4gIGJhc2UwRjogJyM4NTE0NGInXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdkZWZhdWx0JyxcbiAgYXV0aG9yOiAnY2hyaXMga2VtcHNvbiAoaHR0cDovL2Nocmlza2VtcHNvbi5jb20pJyxcbiAgYmFzZTAwOiAnIzE4MTgxOCcsXG4gIGJhc2UwMTogJyMyODI4MjgnLFxuICBiYXNlMDI6ICcjMzgzODM4JyxcbiAgYmFzZTAzOiAnIzU4NTg1OCcsXG4gIGJhc2UwNDogJyNiOGI4YjgnLFxuICBiYXNlMDU6ICcjZDhkOGQ4JyxcbiAgYmFzZTA2OiAnI2U4ZThlOCcsXG4gIGJhc2UwNzogJyNmOGY4ZjgnLFxuICBiYXNlMDg6ICcjYWI0NjQyJyxcbiAgYmFzZTA5OiAnI2RjOTY1NicsXG4gIGJhc2UwQTogJyNmN2NhODgnLFxuICBiYXNlMEI6ICcjYTFiNTZjJyxcbiAgYmFzZTBDOiAnIzg2YzFiOScsXG4gIGJhc2UwRDogJyM3Y2FmYzInLFxuICBiYXNlMEU6ICcjYmE4YmFmJyxcbiAgYmFzZTBGOiAnI2ExNjk0Nidcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2VpZ2h0aWVzJyxcbiAgYXV0aG9yOiAnY2hyaXMga2VtcHNvbiAoaHR0cDovL2Nocmlza2VtcHNvbi5jb20pJyxcbiAgYmFzZTAwOiAnIzJkMmQyZCcsXG4gIGJhc2UwMTogJyMzOTM5MzknLFxuICBiYXNlMDI6ICcjNTE1MTUxJyxcbiAgYmFzZTAzOiAnIzc0NzM2OScsXG4gIGJhc2UwNDogJyNhMDlmOTMnLFxuICBiYXNlMDU6ICcjZDNkMGM4JyxcbiAgYmFzZTA2OiAnI2U4ZTZkZicsXG4gIGJhc2UwNzogJyNmMmYwZWMnLFxuICBiYXNlMDg6ICcjZjI3NzdhJyxcbiAgYmFzZTA5OiAnI2Y5OTE1NycsXG4gIGJhc2UwQTogJyNmZmNjNjYnLFxuICBiYXNlMEI6ICcjOTljYzk5JyxcbiAgYmFzZTBDOiAnIzY2Y2NjYycsXG4gIGJhc2UwRDogJyM2Njk5Y2MnLFxuICBiYXNlMEU6ICcjY2M5OWNjJyxcbiAgYmFzZTBGOiAnI2QyN2I1Mydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2VtYmVycycsXG4gIGF1dGhvcjogJ2phbm5payBzaWViZXJ0IChodHRwczovL2dpdGh1Yi5jb20vamFubmlrcyknLFxuICBiYXNlMDA6ICcjMTYxMzBGJyxcbiAgYmFzZTAxOiAnIzJDMjYyMCcsXG4gIGJhc2UwMjogJyM0MzNCMzInLFxuICBiYXNlMDM6ICcjNUE1MDQ3JyxcbiAgYmFzZTA0OiAnIzhBODA3NScsXG4gIGJhc2UwNTogJyNBMzlBOTAnLFxuICBiYXNlMDY6ICcjQkVCNkFFJyxcbiAgYmFzZTA3OiAnI0RCRDZEMScsXG4gIGJhc2UwODogJyM4MjZENTcnLFxuICBiYXNlMDk6ICcjODI4MjU3JyxcbiAgYmFzZTBBOiAnIzZEODI1NycsXG4gIGJhc2UwQjogJyM1NzgyNkQnLFxuICBiYXNlMEM6ICcjNTc2RDgyJyxcbiAgYmFzZTBEOiAnIzZENTc4MicsXG4gIGJhc2UwRTogJyM4MjU3NkQnLFxuICBiYXNlMEY6ICcjODI1NzU3J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnZmxhdCcsXG4gIGF1dGhvcjogJ2NocmlzIGtlbXBzb24gKGh0dHA6Ly9jaHJpc2tlbXBzb24uY29tKScsXG4gIGJhc2UwMDogJyMyQzNFNTAnLFxuICBiYXNlMDE6ICcjMzQ0OTVFJyxcbiAgYmFzZTAyOiAnIzdGOEM4RCcsXG4gIGJhc2UwMzogJyM5NUE1QTYnLFxuICBiYXNlMDQ6ICcjQkRDM0M3JyxcbiAgYmFzZTA1OiAnI2UwZTBlMCcsXG4gIGJhc2UwNjogJyNmNWY1ZjUnLFxuICBiYXNlMDc6ICcjRUNGMEYxJyxcbiAgYmFzZTA4OiAnI0U3NEMzQycsXG4gIGJhc2UwOTogJyNFNjdFMjInLFxuICBiYXNlMEE6ICcjRjFDNDBGJyxcbiAgYmFzZTBCOiAnIzJFQ0M3MScsXG4gIGJhc2UwQzogJyMxQUJDOUMnLFxuICBiYXNlMEQ6ICcjMzQ5OERCJyxcbiAgYmFzZTBFOiAnIzlCNTlCNicsXG4gIGJhc2UwRjogJyNiZTY0M2MnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdnb29nbGUnLFxuICBhdXRob3I6ICdzZXRoIHdyaWdodCAoaHR0cDovL3NldGhhd3JpZ2h0LmNvbSknLFxuICBiYXNlMDA6ICcjMWQxZjIxJyxcbiAgYmFzZTAxOiAnIzI4MmEyZScsXG4gIGJhc2UwMjogJyMzNzNiNDEnLFxuICBiYXNlMDM6ICcjOTY5ODk2JyxcbiAgYmFzZTA0OiAnI2I0YjdiNCcsXG4gIGJhc2UwNTogJyNjNWM4YzYnLFxuICBiYXNlMDY6ICcjZTBlMGUwJyxcbiAgYmFzZTA3OiAnI2ZmZmZmZicsXG4gIGJhc2UwODogJyNDQzM0MkInLFxuICBiYXNlMDk6ICcjRjk2QTM4JyxcbiAgYmFzZTBBOiAnI0ZCQTkyMicsXG4gIGJhc2UwQjogJyMxOTg4NDQnLFxuICBiYXNlMEM6ICcjMzk3MUVEJyxcbiAgYmFzZTBEOiAnIzM5NzFFRCcsXG4gIGJhc2UwRTogJyNBMzZBQzcnLFxuICBiYXNlMEY6ICcjMzk3MUVEJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnZ3JheXNjYWxlJyxcbiAgYXV0aG9yOiAnYWxleGFuZHJlIGdhdmlvbGkgKGh0dHBzOi8vZ2l0aHViLmNvbS9hbGV4eDIvKScsXG4gIGJhc2UwMDogJyMxMDEwMTAnLFxuICBiYXNlMDE6ICcjMjUyNTI1JyxcbiAgYmFzZTAyOiAnIzQ2NDY0NicsXG4gIGJhc2UwMzogJyM1MjUyNTInLFxuICBiYXNlMDQ6ICcjYWJhYmFiJyxcbiAgYmFzZTA1OiAnI2I5YjliOScsXG4gIGJhc2UwNjogJyNlM2UzZTMnLFxuICBiYXNlMDc6ICcjZjdmN2Y3JyxcbiAgYmFzZTA4OiAnIzdjN2M3YycsXG4gIGJhc2UwOTogJyM5OTk5OTknLFxuICBiYXNlMEE6ICcjYTBhMGEwJyxcbiAgYmFzZTBCOiAnIzhlOGU4ZScsXG4gIGJhc2UwQzogJyM4Njg2ODYnLFxuICBiYXNlMEQ6ICcjNjg2ODY4JyxcbiAgYmFzZTBFOiAnIzc0NzQ3NCcsXG4gIGJhc2UwRjogJyM1ZTVlNWUnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdncmVlbiBzY3JlZW4nLFxuICBhdXRob3I6ICdjaHJpcyBrZW1wc29uIChodHRwOi8vY2hyaXNrZW1wc29uLmNvbSknLFxuICBiYXNlMDA6ICcjMDAxMTAwJyxcbiAgYmFzZTAxOiAnIzAwMzMwMCcsXG4gIGJhc2UwMjogJyMwMDU1MDAnLFxuICBiYXNlMDM6ICcjMDA3NzAwJyxcbiAgYmFzZTA0OiAnIzAwOTkwMCcsXG4gIGJhc2UwNTogJyMwMGJiMDAnLFxuICBiYXNlMDY6ICcjMDBkZDAwJyxcbiAgYmFzZTA3OiAnIzAwZmYwMCcsXG4gIGJhc2UwODogJyMwMDc3MDAnLFxuICBiYXNlMDk6ICcjMDA5OTAwJyxcbiAgYmFzZTBBOiAnIzAwNzcwMCcsXG4gIGJhc2UwQjogJyMwMGJiMDAnLFxuICBiYXNlMEM6ICcjMDA1NTAwJyxcbiAgYmFzZTBEOiAnIzAwOTkwMCcsXG4gIGJhc2UwRTogJyMwMGJiMDAnLFxuICBiYXNlMEY6ICcjMDA1NTAwJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnaGFybW9uaWMxNicsXG4gIGF1dGhvcjogJ2phbm5payBzaWViZXJ0IChodHRwczovL2dpdGh1Yi5jb20vamFubmlrcyknLFxuICBiYXNlMDA6ICcjMGIxYzJjJyxcbiAgYmFzZTAxOiAnIzIyM2I1NCcsXG4gIGJhc2UwMjogJyM0MDVjNzknLFxuICBiYXNlMDM6ICcjNjI3ZTk5JyxcbiAgYmFzZTA0OiAnI2FhYmNjZScsXG4gIGJhc2UwNTogJyNjYmQ2ZTInLFxuICBiYXNlMDY6ICcjZTVlYmYxJyxcbiAgYmFzZTA3OiAnI2Y3ZjlmYicsXG4gIGJhc2UwODogJyNiZjhiNTYnLFxuICBiYXNlMDk6ICcjYmZiZjU2JyxcbiAgYmFzZTBBOiAnIzhiYmY1NicsXG4gIGJhc2UwQjogJyM1NmJmOGInLFxuICBiYXNlMEM6ICcjNTY4YmJmJyxcbiAgYmFzZTBEOiAnIzhiNTZiZicsXG4gIGJhc2UwRTogJyNiZjU2OGInLFxuICBiYXNlMEY6ICcjYmY1NjU2J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnaG9wc2NvdGNoJyxcbiAgYXV0aG9yOiAnamFuIHQuIHNvdHQnLFxuICBiYXNlMDA6ICcjMzIyOTMxJyxcbiAgYmFzZTAxOiAnIzQzM2I0MicsXG4gIGJhc2UwMjogJyM1YzU0NWInLFxuICBiYXNlMDM6ICcjNzk3Mzc5JyxcbiAgYmFzZTA0OiAnIzk4OTQ5OCcsXG4gIGJhc2UwNTogJyNiOWI1YjgnLFxuICBiYXNlMDY6ICcjZDVkM2Q1JyxcbiAgYmFzZTA3OiAnI2ZmZmZmZicsXG4gIGJhc2UwODogJyNkZDQ2NGMnLFxuICBiYXNlMDk6ICcjZmQ4YjE5JyxcbiAgYmFzZTBBOiAnI2ZkY2M1OScsXG4gIGJhc2UwQjogJyM4ZmMxM2UnLFxuICBiYXNlMEM6ICcjMTQ5YjkzJyxcbiAgYmFzZTBEOiAnIzEyOTBiZicsXG4gIGJhc2UwRTogJyNjODVlN2MnLFxuICBiYXNlMEY6ICcjYjMzNTA4J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlKG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqWydkZWZhdWx0J10gOiBvYmo7IH1cblxudmFyIF90aHJlZXplcm90d29mb3VyID0gcmVxdWlyZSgnLi90aHJlZXplcm90d29mb3VyJyk7XG5cbmV4cG9ydHMudGhyZWV6ZXJvdHdvZm91ciA9IF9pbnRlcm9wUmVxdWlyZShfdGhyZWV6ZXJvdHdvZm91cik7XG5cbnZhciBfYXBhdGh5ID0gcmVxdWlyZSgnLi9hcGF0aHknKTtcblxuZXhwb3J0cy5hcGF0aHkgPSBfaW50ZXJvcFJlcXVpcmUoX2FwYXRoeSk7XG5cbnZhciBfYXNoZXMgPSByZXF1aXJlKCcuL2FzaGVzJyk7XG5cbmV4cG9ydHMuYXNoZXMgPSBfaW50ZXJvcFJlcXVpcmUoX2FzaGVzKTtcblxudmFyIF9hdGVsaWVyRHVuZSA9IHJlcXVpcmUoJy4vYXRlbGllci1kdW5lJyk7XG5cbmV4cG9ydHMuYXRlbGllckR1bmUgPSBfaW50ZXJvcFJlcXVpcmUoX2F0ZWxpZXJEdW5lKTtcblxudmFyIF9hdGVsaWVyRm9yZXN0ID0gcmVxdWlyZSgnLi9hdGVsaWVyLWZvcmVzdCcpO1xuXG5leHBvcnRzLmF0ZWxpZXJGb3Jlc3QgPSBfaW50ZXJvcFJlcXVpcmUoX2F0ZWxpZXJGb3Jlc3QpO1xuXG52YXIgX2F0ZWxpZXJIZWF0aCA9IHJlcXVpcmUoJy4vYXRlbGllci1oZWF0aCcpO1xuXG5leHBvcnRzLmF0ZWxpZXJIZWF0aCA9IF9pbnRlcm9wUmVxdWlyZShfYXRlbGllckhlYXRoKTtcblxudmFyIF9hdGVsaWVyTGFrZXNpZGUgPSByZXF1aXJlKCcuL2F0ZWxpZXItbGFrZXNpZGUnKTtcblxuZXhwb3J0cy5hdGVsaWVyTGFrZXNpZGUgPSBfaW50ZXJvcFJlcXVpcmUoX2F0ZWxpZXJMYWtlc2lkZSk7XG5cbnZhciBfYXRlbGllclNlYXNpZGUgPSByZXF1aXJlKCcuL2F0ZWxpZXItc2Vhc2lkZScpO1xuXG5leHBvcnRzLmF0ZWxpZXJTZWFzaWRlID0gX2ludGVyb3BSZXF1aXJlKF9hdGVsaWVyU2Vhc2lkZSk7XG5cbnZhciBfYmVzcGluID0gcmVxdWlyZSgnLi9iZXNwaW4nKTtcblxuZXhwb3J0cy5iZXNwaW4gPSBfaW50ZXJvcFJlcXVpcmUoX2Jlc3Bpbik7XG5cbnZhciBfYnJld2VyID0gcmVxdWlyZSgnLi9icmV3ZXInKTtcblxuZXhwb3J0cy5icmV3ZXIgPSBfaW50ZXJvcFJlcXVpcmUoX2JyZXdlcik7XG5cbnZhciBfYnJpZ2h0ID0gcmVxdWlyZSgnLi9icmlnaHQnKTtcblxuZXhwb3J0cy5icmlnaHQgPSBfaW50ZXJvcFJlcXVpcmUoX2JyaWdodCk7XG5cbnZhciBfY2hhbGsgPSByZXF1aXJlKCcuL2NoYWxrJyk7XG5cbmV4cG9ydHMuY2hhbGsgPSBfaW50ZXJvcFJlcXVpcmUoX2NoYWxrKTtcblxudmFyIF9jb2Rlc2Nob29sID0gcmVxdWlyZSgnLi9jb2Rlc2Nob29sJyk7XG5cbmV4cG9ydHMuY29kZXNjaG9vbCA9IF9pbnRlcm9wUmVxdWlyZShfY29kZXNjaG9vbCk7XG5cbnZhciBfY29sb3JzID0gcmVxdWlyZSgnLi9jb2xvcnMnKTtcblxuZXhwb3J0cy5jb2xvcnMgPSBfaW50ZXJvcFJlcXVpcmUoX2NvbG9ycyk7XG5cbnZhciBfZGVmYXVsdCA9IHJlcXVpcmUoJy4vZGVmYXVsdCcpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBfaW50ZXJvcFJlcXVpcmUoX2RlZmF1bHQpO1xuXG52YXIgX2VpZ2h0aWVzID0gcmVxdWlyZSgnLi9laWdodGllcycpO1xuXG5leHBvcnRzLmVpZ2h0aWVzID0gX2ludGVyb3BSZXF1aXJlKF9laWdodGllcyk7XG5cbnZhciBfZW1iZXJzID0gcmVxdWlyZSgnLi9lbWJlcnMnKTtcblxuZXhwb3J0cy5lbWJlcnMgPSBfaW50ZXJvcFJlcXVpcmUoX2VtYmVycyk7XG5cbnZhciBfZmxhdCA9IHJlcXVpcmUoJy4vZmxhdCcpO1xuXG5leHBvcnRzLmZsYXQgPSBfaW50ZXJvcFJlcXVpcmUoX2ZsYXQpO1xuXG52YXIgX2dvb2dsZSA9IHJlcXVpcmUoJy4vZ29vZ2xlJyk7XG5cbmV4cG9ydHMuZ29vZ2xlID0gX2ludGVyb3BSZXF1aXJlKF9nb29nbGUpO1xuXG52YXIgX2dyYXlzY2FsZSA9IHJlcXVpcmUoJy4vZ3JheXNjYWxlJyk7XG5cbmV4cG9ydHMuZ3JheXNjYWxlID0gX2ludGVyb3BSZXF1aXJlKF9ncmF5c2NhbGUpO1xuXG52YXIgX2dyZWVuc2NyZWVuID0gcmVxdWlyZSgnLi9ncmVlbnNjcmVlbicpO1xuXG5leHBvcnRzLmdyZWVuc2NyZWVuID0gX2ludGVyb3BSZXF1aXJlKF9ncmVlbnNjcmVlbik7XG5cbnZhciBfaGFybW9uaWMgPSByZXF1aXJlKCcuL2hhcm1vbmljJyk7XG5cbmV4cG9ydHMuaGFybW9uaWMgPSBfaW50ZXJvcFJlcXVpcmUoX2hhcm1vbmljKTtcblxudmFyIF9ob3BzY290Y2ggPSByZXF1aXJlKCcuL2hvcHNjb3RjaCcpO1xuXG5leHBvcnRzLmhvcHNjb3RjaCA9IF9pbnRlcm9wUmVxdWlyZShfaG9wc2NvdGNoKTtcblxudmFyIF9pc290b3BlID0gcmVxdWlyZSgnLi9pc290b3BlJyk7XG5cbmV4cG9ydHMuaXNvdG9wZSA9IF9pbnRlcm9wUmVxdWlyZShfaXNvdG9wZSk7XG5cbnZhciBfbWFycmFrZXNoID0gcmVxdWlyZSgnLi9tYXJyYWtlc2gnKTtcblxuZXhwb3J0cy5tYXJyYWtlc2ggPSBfaW50ZXJvcFJlcXVpcmUoX21hcnJha2VzaCk7XG5cbnZhciBfbW9jaGEgPSByZXF1aXJlKCcuL21vY2hhJyk7XG5cbmV4cG9ydHMubW9jaGEgPSBfaW50ZXJvcFJlcXVpcmUoX21vY2hhKTtcblxudmFyIF9tb25va2FpID0gcmVxdWlyZSgnLi9tb25va2FpJyk7XG5cbmV4cG9ydHMubW9ub2thaSA9IF9pbnRlcm9wUmVxdWlyZShfbW9ub2thaSk7XG5cbnZhciBfb2NlYW4gPSByZXF1aXJlKCcuL29jZWFuJyk7XG5cbmV4cG9ydHMub2NlYW4gPSBfaW50ZXJvcFJlcXVpcmUoX29jZWFuKTtcblxudmFyIF9wYXJhaXNvID0gcmVxdWlyZSgnLi9wYXJhaXNvJyk7XG5cbmV4cG9ydHMucGFyYWlzbyA9IF9pbnRlcm9wUmVxdWlyZShfcGFyYWlzbyk7XG5cbnZhciBfcG9wID0gcmVxdWlyZSgnLi9wb3AnKTtcblxuZXhwb3J0cy5wb3AgPSBfaW50ZXJvcFJlcXVpcmUoX3BvcCk7XG5cbnZhciBfcmFpbHNjYXN0cyA9IHJlcXVpcmUoJy4vcmFpbHNjYXN0cycpO1xuXG5leHBvcnRzLnJhaWxzY2FzdHMgPSBfaW50ZXJvcFJlcXVpcmUoX3JhaWxzY2FzdHMpO1xuXG52YXIgX3NoYXBlc2hpZnRlciA9IHJlcXVpcmUoJy4vc2hhcGVzaGlmdGVyJyk7XG5cbmV4cG9ydHMuc2hhcGVzaGlmdGVyID0gX2ludGVyb3BSZXF1aXJlKF9zaGFwZXNoaWZ0ZXIpO1xuXG52YXIgX3NvbGFyaXplZCA9IHJlcXVpcmUoJy4vc29sYXJpemVkJyk7XG5cbmV4cG9ydHMuc29sYXJpemVkID0gX2ludGVyb3BSZXF1aXJlKF9zb2xhcml6ZWQpO1xuXG52YXIgX3N1bW1lcmZydWl0ID0gcmVxdWlyZSgnLi9zdW1tZXJmcnVpdCcpO1xuXG5leHBvcnRzLnN1bW1lcmZydWl0ID0gX2ludGVyb3BSZXF1aXJlKF9zdW1tZXJmcnVpdCk7XG5cbnZhciBfdG9tb3Jyb3cgPSByZXF1aXJlKCcuL3RvbW9ycm93Jyk7XG5cbmV4cG9ydHMudG9tb3Jyb3cgPSBfaW50ZXJvcFJlcXVpcmUoX3RvbW9ycm93KTtcblxudmFyIF90dWJlID0gcmVxdWlyZSgnLi90dWJlJyk7XG5cbmV4cG9ydHMudHViZSA9IF9pbnRlcm9wUmVxdWlyZShfdHViZSk7XG5cbnZhciBfdHdpbGlnaHQgPSByZXF1aXJlKCcuL3R3aWxpZ2h0Jyk7XG5cbmV4cG9ydHMudHdpbGlnaHQgPSBfaW50ZXJvcFJlcXVpcmUoX3R3aWxpZ2h0KTtcblxudmFyIF9uaWNpbmFib3ggPSByZXF1aXJlKCcuL25pY2luYWJveCcpO1xuXG5leHBvcnRzLm5pY2luYWJveCA9IF9pbnRlcm9wUmVxdWlyZShfbmljaW5hYm94KTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2lzb3RvcGUnLFxuICBhdXRob3I6ICdqYW4gdC4gc290dCcsXG4gIGJhc2UwMDogJyMwMDAwMDAnLFxuICBiYXNlMDE6ICcjNDA0MDQwJyxcbiAgYmFzZTAyOiAnIzYwNjA2MCcsXG4gIGJhc2UwMzogJyM4MDgwODAnLFxuICBiYXNlMDQ6ICcjYzBjMGMwJyxcbiAgYmFzZTA1OiAnI2QwZDBkMCcsXG4gIGJhc2UwNjogJyNlMGUwZTAnLFxuICBiYXNlMDc6ICcjZmZmZmZmJyxcbiAgYmFzZTA4OiAnI2ZmMDAwMCcsXG4gIGJhc2UwOTogJyNmZjk5MDAnLFxuICBiYXNlMEE6ICcjZmYwMDk5JyxcbiAgYmFzZTBCOiAnIzMzZmYwMCcsXG4gIGJhc2UwQzogJyMwMGZmZmYnLFxuICBiYXNlMEQ6ICcjMDA2NmZmJyxcbiAgYmFzZTBFOiAnI2NjMDBmZicsXG4gIGJhc2UwRjogJyMzMzAwZmYnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdtYXJyYWtlc2gnLFxuICBhdXRob3I6ICdhbGV4YW5kcmUgZ2F2aW9saSAoaHR0cDovL2dpdGh1Yi5jb20vYWxleHgyLyknLFxuICBiYXNlMDA6ICcjMjAxNjAyJyxcbiAgYmFzZTAxOiAnIzMwMmUwMCcsXG4gIGJhc2UwMjogJyM1ZjViMTcnLFxuICBiYXNlMDM6ICcjNmM2ODIzJyxcbiAgYmFzZTA0OiAnIzg2ODEzYicsXG4gIGJhc2UwNTogJyM5NDhlNDgnLFxuICBiYXNlMDY6ICcjY2NjMzdhJyxcbiAgYmFzZTA3OiAnI2ZhZjBhNScsXG4gIGJhc2UwODogJyNjMzUzNTknLFxuICBiYXNlMDk6ICcjYjM2MTQ0JyxcbiAgYmFzZTBBOiAnI2E4ODMzOScsXG4gIGJhc2UwQjogJyMxODk3NGUnLFxuICBiYXNlMEM6ICcjNzVhNzM4JyxcbiAgYmFzZTBEOiAnIzQ3N2NhMScsXG4gIGJhc2UwRTogJyM4ODY4YjMnLFxuICBiYXNlMEY6ICcjYjM1ODhlJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnbW9jaGEnLFxuICBhdXRob3I6ICdjaHJpcyBrZW1wc29uIChodHRwOi8vY2hyaXNrZW1wc29uLmNvbSknLFxuICBiYXNlMDA6ICcjM0IzMjI4JyxcbiAgYmFzZTAxOiAnIzUzNDYzNicsXG4gIGJhc2UwMjogJyM2NDUyNDAnLFxuICBiYXNlMDM6ICcjN2U3MDVhJyxcbiAgYmFzZTA0OiAnI2I4YWZhZCcsXG4gIGJhc2UwNTogJyNkMGM4YzYnLFxuICBiYXNlMDY6ICcjZTllMWRkJyxcbiAgYmFzZTA3OiAnI2Y1ZWVlYicsXG4gIGJhc2UwODogJyNjYjYwNzcnLFxuICBiYXNlMDk6ICcjZDI4YjcxJyxcbiAgYmFzZTBBOiAnI2Y0YmM4NycsXG4gIGJhc2UwQjogJyNiZWI1NWInLFxuICBiYXNlMEM6ICcjN2JiZGE0JyxcbiAgYmFzZTBEOiAnIzhhYjNiNScsXG4gIGJhc2UwRTogJyNhODliYjknLFxuICBiYXNlMEY6ICcjYmI5NTg0J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnbW9ub2thaScsXG4gIGF1dGhvcjogJ3dpbWVyIGhhemVuYmVyZyAoaHR0cDovL3d3dy5tb25va2FpLm5sKScsXG4gIGJhc2UwMDogJyMyNzI4MjInLFxuICBiYXNlMDE6ICcjMzgzODMwJyxcbiAgYmFzZTAyOiAnIzQ5NDgzZScsXG4gIGJhc2UwMzogJyM3NTcxNWUnLFxuICBiYXNlMDQ6ICcjYTU5Zjg1JyxcbiAgYmFzZTA1OiAnI2Y4ZjhmMicsXG4gIGJhc2UwNjogJyNmNWY0ZjEnLFxuICBiYXNlMDc6ICcjZjlmOGY1JyxcbiAgYmFzZTA4OiAnI2Y5MjY3MicsXG4gIGJhc2UwOTogJyNmZDk3MWYnLFxuICBiYXNlMEE6ICcjZjRiZjc1JyxcbiAgYmFzZTBCOiAnI2E2ZTIyZScsXG4gIGJhc2UwQzogJyNhMWVmZTQnLFxuICBiYXNlMEQ6ICcjNjZkOWVmJyxcbiAgYmFzZTBFOiAnI2FlODFmZicsXG4gIGJhc2UwRjogJyNjYzY2MzMnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICduaWNpbmFib3gnLFxuICBhdXRob3I6ICduaWNpbmFib3ggKGh0dHA6Ly9naXRodWIuY29tL25pY2luYWJveCknLFxuICBiYXNlMDA6ICcjMkEyRjNBJyxcbiAgYmFzZTAxOiAnIzNDNDQ0RicsXG4gIGJhc2UwMjogJyM0RjVBNjUnLFxuICBiYXNlMDM6ICcjQkVCRUJFJyxcbiAgYmFzZTA0OiAnI2IwYjBiMCcsIC8vIHVubW9kaWZpZWRcbiAgYmFzZTA1OiAnI2QwZDBkMCcsIC8vIHVubW9kaWZpZWRcbiAgYmFzZTA2OiAnI0ZGRkZGRicsXG4gIGJhc2UwNzogJyNmNWY1ZjUnLCAvLyB1bm1vZGlmaWVkXG4gIGJhc2UwODogJyNmYjlmYjEnLCAvLyB1bm1vZGlmaWVkXG4gIGJhc2UwOTogJyNGQzZEMjQnLFxuICBiYXNlMEE6ICcjZGRiMjZmJywgLy8gdW5tb2RpZmllZFxuICBiYXNlMEI6ICcjQTFDNjU5JyxcbiAgYmFzZTBDOiAnIzEyY2ZjMCcsIC8vIHVubW9kaWZpZWRcbiAgYmFzZTBEOiAnIzZGQjNEMicsXG4gIGJhc2UwRTogJyNEMzgxQzMnLFxuICBiYXNlMEY6ICcjZGVhZjhmJyAvLyB1bm1vZGlmaWVkXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdvY2VhbicsXG4gIGF1dGhvcjogJ2NocmlzIGtlbXBzb24gKGh0dHA6Ly9jaHJpc2tlbXBzb24uY29tKScsXG4gIGJhc2UwMDogJyMyYjMwM2InLFxuICBiYXNlMDE6ICcjMzQzZDQ2JyxcbiAgYmFzZTAyOiAnIzRmNWI2NicsXG4gIGJhc2UwMzogJyM2NTczN2UnLFxuICBiYXNlMDQ6ICcjYTdhZGJhJyxcbiAgYmFzZTA1OiAnI2MwYzVjZScsXG4gIGJhc2UwNjogJyNkZmUxZTgnLFxuICBiYXNlMDc6ICcjZWZmMWY1JyxcbiAgYmFzZTA4OiAnI2JmNjE2YScsXG4gIGJhc2UwOTogJyNkMDg3NzAnLFxuICBiYXNlMEE6ICcjZWJjYjhiJyxcbiAgYmFzZTBCOiAnI2EzYmU4YycsXG4gIGJhc2UwQzogJyM5NmI1YjQnLFxuICBiYXNlMEQ6ICcjOGZhMWIzJyxcbiAgYmFzZTBFOiAnI2I0OGVhZCcsXG4gIGJhc2UwRjogJyNhYjc5NjcnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdwYXJhaXNvJyxcbiAgYXV0aG9yOiAnamFuIHQuIHNvdHQnLFxuICBiYXNlMDA6ICcjMmYxZTJlJyxcbiAgYmFzZTAxOiAnIzQxMzIzZicsXG4gIGJhc2UwMjogJyM0ZjQyNGMnLFxuICBiYXNlMDM6ICcjNzc2ZTcxJyxcbiAgYmFzZTA0OiAnIzhkODY4NycsXG4gIGJhc2UwNTogJyNhMzllOWInLFxuICBiYXNlMDY6ICcjYjliNmIwJyxcbiAgYmFzZTA3OiAnI2U3ZTlkYicsXG4gIGJhc2UwODogJyNlZjYxNTUnLFxuICBiYXNlMDk6ICcjZjk5YjE1JyxcbiAgYmFzZTBBOiAnI2ZlYzQxOCcsXG4gIGJhc2UwQjogJyM0OGI2ODUnLFxuICBiYXNlMEM6ICcjNWJjNGJmJyxcbiAgYmFzZTBEOiAnIzA2YjZlZicsXG4gIGJhc2UwRTogJyM4MTViYTQnLFxuICBiYXNlMEY6ICcjZTk2YmE4J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAncG9wJyxcbiAgYXV0aG9yOiAnY2hyaXMga2VtcHNvbiAoaHR0cDovL2Nocmlza2VtcHNvbi5jb20pJyxcbiAgYmFzZTAwOiAnIzAwMDAwMCcsXG4gIGJhc2UwMTogJyMyMDIwMjAnLFxuICBiYXNlMDI6ICcjMzAzMDMwJyxcbiAgYmFzZTAzOiAnIzUwNTA1MCcsXG4gIGJhc2UwNDogJyNiMGIwYjAnLFxuICBiYXNlMDU6ICcjZDBkMGQwJyxcbiAgYmFzZTA2OiAnI2UwZTBlMCcsXG4gIGJhc2UwNzogJyNmZmZmZmYnLFxuICBiYXNlMDg6ICcjZWIwMDhhJyxcbiAgYmFzZTA5OiAnI2YyOTMzMycsXG4gIGJhc2UwQTogJyNmOGNhMTInLFxuICBiYXNlMEI6ICcjMzdiMzQ5JyxcbiAgYmFzZTBDOiAnIzAwYWFiYicsXG4gIGJhc2UwRDogJyMwZTVhOTQnLFxuICBiYXNlMEU6ICcjYjMxZThkJyxcbiAgYmFzZTBGOiAnIzdhMmQwMCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ3JhaWxzY2FzdHMnLFxuICBhdXRob3I6ICdyeWFuIGJhdGVzIChodHRwOi8vcmFpbHNjYXN0cy5jb20pJyxcbiAgYmFzZTAwOiAnIzJiMmIyYicsXG4gIGJhc2UwMTogJyMyNzI5MzUnLFxuICBiYXNlMDI6ICcjM2E0MDU1JyxcbiAgYmFzZTAzOiAnIzVhNjQ3ZScsXG4gIGJhc2UwNDogJyNkNGNmYzknLFxuICBiYXNlMDU6ICcjZTZlMWRjJyxcbiAgYmFzZTA2OiAnI2Y0ZjFlZCcsXG4gIGJhc2UwNzogJyNmOWY3ZjMnLFxuICBiYXNlMDg6ICcjZGE0OTM5JyxcbiAgYmFzZTA5OiAnI2NjNzgzMycsXG4gIGJhc2UwQTogJyNmZmM2NmQnLFxuICBiYXNlMEI6ICcjYTVjMjYxJyxcbiAgYmFzZTBDOiAnIzUxOWY1MCcsXG4gIGJhc2UwRDogJyM2ZDljYmUnLFxuICBiYXNlMEU6ICcjYjZiM2ViJyxcbiAgYmFzZTBGOiAnI2JjOTQ1OCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ3NoYXBlc2hpZnRlcicsXG4gIGF1dGhvcjogJ3R5bGVyIGJlbnppZ2VyIChodHRwOi8vdHliZW56LmNvbSknLFxuICBiYXNlMDA6ICcjMDAwMDAwJyxcbiAgYmFzZTAxOiAnIzA0MDQwNCcsXG4gIGJhc2UwMjogJyMxMDIwMTUnLFxuICBiYXNlMDM6ICcjMzQzNDM0JyxcbiAgYmFzZTA0OiAnIzU1NTU1NScsXG4gIGJhc2UwNTogJyNhYmFiYWInLFxuICBiYXNlMDY6ICcjZTBlMGUwJyxcbiAgYmFzZTA3OiAnI2Y5ZjlmOScsXG4gIGJhc2UwODogJyNlOTJmMmYnLFxuICBiYXNlMDk6ICcjZTA5NDQ4JyxcbiAgYmFzZTBBOiAnI2RkZGQxMycsXG4gIGJhc2UwQjogJyMwZWQ4MzknLFxuICBiYXNlMEM6ICcjMjNlZGRhJyxcbiAgYmFzZTBEOiAnIzNiNDhlMycsXG4gIGJhc2UwRTogJyNmOTk2ZTInLFxuICBiYXNlMEY6ICcjNjk1NDJkJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnc29sYXJpemVkJyxcbiAgYXV0aG9yOiAnZXRoYW4gc2Nob29ub3ZlciAoaHR0cDovL2V0aGFuc2Nob29ub3Zlci5jb20vc29sYXJpemVkKScsXG4gIGJhc2UwMDogJyMwMDJiMzYnLFxuICBiYXNlMDE6ICcjMDczNjQyJyxcbiAgYmFzZTAyOiAnIzU4NmU3NScsXG4gIGJhc2UwMzogJyM2NTdiODMnLFxuICBiYXNlMDQ6ICcjODM5NDk2JyxcbiAgYmFzZTA1OiAnIzkzYTFhMScsXG4gIGJhc2UwNjogJyNlZWU4ZDUnLFxuICBiYXNlMDc6ICcjZmRmNmUzJyxcbiAgYmFzZTA4OiAnI2RjMzIyZicsXG4gIGJhc2UwOTogJyNjYjRiMTYnLFxuICBiYXNlMEE6ICcjYjU4OTAwJyxcbiAgYmFzZTBCOiAnIzg1OTkwMCcsXG4gIGJhc2UwQzogJyMyYWExOTgnLFxuICBiYXNlMEQ6ICcjMjY4YmQyJyxcbiAgYmFzZTBFOiAnIzZjNzFjNCcsXG4gIGJhc2UwRjogJyNkMzM2ODInXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdzdW1tZXJmcnVpdCcsXG4gIGF1dGhvcjogJ2NocmlzdG9waGVyIGNvcmxleSAoaHR0cDovL2NzY29ybGV5LmdpdGh1Yi5pby8pJyxcbiAgYmFzZTAwOiAnIzE1MTUxNScsXG4gIGJhc2UwMTogJyMyMDIwMjAnLFxuICBiYXNlMDI6ICcjMzAzMDMwJyxcbiAgYmFzZTAzOiAnIzUwNTA1MCcsXG4gIGJhc2UwNDogJyNCMEIwQjAnLFxuICBiYXNlMDU6ICcjRDBEMEQwJyxcbiAgYmFzZTA2OiAnI0UwRTBFMCcsXG4gIGJhc2UwNzogJyNGRkZGRkYnLFxuICBiYXNlMDg6ICcjRkYwMDg2JyxcbiAgYmFzZTA5OiAnI0ZEODkwMCcsXG4gIGJhc2UwQTogJyNBQkE4MDAnLFxuICBiYXNlMEI6ICcjMDBDOTE4JyxcbiAgYmFzZTBDOiAnIzFmYWFhYScsXG4gIGJhc2UwRDogJyMzNzc3RTYnLFxuICBiYXNlMEU6ICcjQUQwMEExJyxcbiAgYmFzZTBGOiAnI2NjNjYzMydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ3RocmVlemVyb3R3b2ZvdXInLFxuICBhdXRob3I6ICdqYW4gdC4gc290dCAoaHR0cDovL2dpdGh1Yi5jb20vaWRsZWJlcmcpJyxcbiAgYmFzZTAwOiAnIzA5MDMwMCcsXG4gIGJhc2UwMTogJyMzYTM0MzInLFxuICBiYXNlMDI6ICcjNGE0NTQzJyxcbiAgYmFzZTAzOiAnIzVjNTg1NScsXG4gIGJhc2UwNDogJyM4MDdkN2MnLFxuICBiYXNlMDU6ICcjYTVhMmEyJyxcbiAgYmFzZTA2OiAnI2Q2ZDVkNCcsXG4gIGJhc2UwNzogJyNmN2Y3ZjcnLFxuICBiYXNlMDg6ICcjZGIyZDIwJyxcbiAgYmFzZTA5OiAnI2U4YmJkMCcsXG4gIGJhc2UwQTogJyNmZGVkMDInLFxuICBiYXNlMEI6ICcjMDFhMjUyJyxcbiAgYmFzZTBDOiAnI2I1ZTRmNCcsXG4gIGJhc2UwRDogJyMwMWEwZTQnLFxuICBiYXNlMEU6ICcjYTE2YTk0JyxcbiAgYmFzZTBGOiAnI2NkYWI1Mydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ3RvbW9ycm93JyxcbiAgYXV0aG9yOiAnY2hyaXMga2VtcHNvbiAoaHR0cDovL2Nocmlza2VtcHNvbi5jb20pJyxcbiAgYmFzZTAwOiAnIzFkMWYyMScsXG4gIGJhc2UwMTogJyMyODJhMmUnLFxuICBiYXNlMDI6ICcjMzczYjQxJyxcbiAgYmFzZTAzOiAnIzk2OTg5NicsXG4gIGJhc2UwNDogJyNiNGI3YjQnLFxuICBiYXNlMDU6ICcjYzVjOGM2JyxcbiAgYmFzZTA2OiAnI2UwZTBlMCcsXG4gIGJhc2UwNzogJyNmZmZmZmYnLFxuICBiYXNlMDg6ICcjY2M2NjY2JyxcbiAgYmFzZTA5OiAnI2RlOTM1ZicsXG4gIGJhc2UwQTogJyNmMGM2NzQnLFxuICBiYXNlMEI6ICcjYjViZDY4JyxcbiAgYmFzZTBDOiAnIzhhYmViNycsXG4gIGJhc2UwRDogJyM4MWEyYmUnLFxuICBiYXNlMEU6ICcjYjI5NGJiJyxcbiAgYmFzZTBGOiAnI2EzNjg1YSdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2xvbmRvbiB0dWJlJyxcbiAgYXV0aG9yOiAnamFuIHQuIHNvdHQnLFxuICBiYXNlMDA6ICcjMjMxZjIwJyxcbiAgYmFzZTAxOiAnIzFjM2Y5NScsXG4gIGJhc2UwMjogJyM1YTU3NTgnLFxuICBiYXNlMDM6ICcjNzM3MTcxJyxcbiAgYmFzZTA0OiAnIzk1OWNhMScsXG4gIGJhc2UwNTogJyNkOWQ4ZDgnLFxuICBiYXNlMDY6ICcjZTdlN2U4JyxcbiAgYmFzZTA3OiAnI2ZmZmZmZicsXG4gIGJhc2UwODogJyNlZTJlMjQnLFxuICBiYXNlMDk6ICcjZjM4NmExJyxcbiAgYmFzZTBBOiAnI2ZmZDIwNCcsXG4gIGJhc2UwQjogJyMwMDg1M2UnLFxuICBiYXNlMEM6ICcjODVjZWJjJyxcbiAgYmFzZTBEOiAnIzAwOWRkYycsXG4gIGJhc2UwRTogJyM5ODAwNWQnLFxuICBiYXNlMEY6ICcjYjA2MTEwJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAndHdpbGlnaHQnLFxuICBhdXRob3I6ICdkYXZpZCBoYXJ0IChodHRwOi8vaGFydC1kZXYuY29tKScsXG4gIGJhc2UwMDogJyMxZTFlMWUnLFxuICBiYXNlMDE6ICcjMzIzNTM3JyxcbiAgYmFzZTAyOiAnIzQ2NGI1MCcsXG4gIGJhc2UwMzogJyM1ZjVhNjAnLFxuICBiYXNlMDQ6ICcjODM4MTg0JyxcbiAgYmFzZTA1OiAnI2E3YTdhNycsXG4gIGJhc2UwNjogJyNjM2MzYzMnLFxuICBiYXNlMDc6ICcjZmZmZmZmJyxcbiAgYmFzZTA4OiAnI2NmNmE0YycsXG4gIGJhc2UwOTogJyNjZGE4NjknLFxuICBiYXNlMEE6ICcjZjllZTk4JyxcbiAgYmFzZTBCOiAnIzhmOWQ2YScsXG4gIGJhc2UwQzogJyNhZmM0ZGInLFxuICBiYXNlMEQ6ICcjNzU4N2E2JyxcbiAgYmFzZTBFOiAnIzliODU5ZCcsXG4gIGJhc2UwRjogJyM5YjcwM2YnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBmdW5jdGlvbiAoaGV4Q29sb3IsIGxpZ2h0bmVzcykge1xuICB2YXIgaGV4ID0gU3RyaW5nKGhleENvbG9yKS5yZXBsYWNlKC9bXjAtOWEtZl0vZ2ksICcnKTtcbiAgaWYgKGhleC5sZW5ndGggPCA2KSB7XG4gICAgaGV4ID0gaGV4LnJlcGxhY2UoLyguKS9nLCAnJDEkMScpO1xuICB9XG4gIHZhciBsdW0gPSBsaWdodG5lc3MgfHwgMDtcblxuICB2YXIgcmdiID0gJyMnO1xuICB2YXIgYyA9IHVuZGVmaW5lZDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyArK2kpIHtcbiAgICBjID0gcGFyc2VJbnQoaGV4LnN1YnN0cihpICogMiwgMiksIDE2KTtcbiAgICBjID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLCBjICsgYyAqIGx1bSksIDI1NSkpLnRvU3RyaW5nKDE2KTtcbiAgICByZ2IgKz0gKCcwMCcgKyBjKS5zdWJzdHIoYy5sZW5ndGgpO1xuICB9XG4gIHJldHVybiByZ2I7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW5oZXJpdHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2snKVsnZGVmYXVsdCddO1xuXG52YXIgX2V4dGVuZHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcycpWydkZWZhdWx0J107XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0TWl4aW4gPSByZXF1aXJlKCdyZWFjdC1taXhpbicpO1xuXG52YXIgX3JlYWN0TWl4aW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RNaXhpbik7XG5cbnZhciBfbWl4aW5zID0gcmVxdWlyZSgnLi9taXhpbnMnKTtcblxudmFyIF9KU09OQXJyb3cgPSByZXF1aXJlKCcuL0pTT05BcnJvdycpO1xuXG52YXIgX0pTT05BcnJvdzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09OQXJyb3cpO1xuXG52YXIgX2dyYWJOb2RlID0gcmVxdWlyZSgnLi9ncmFiLW5vZGUnKTtcblxudmFyIF9ncmFiTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ncmFiTm9kZSk7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGJhc2U6IHtcbiAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICBwYWRkaW5nVG9wOiAzLFxuICAgIHBhZGRpbmdCb3R0b206IDMsXG4gICAgcGFkZGluZ1JpZ2h0OiAwLFxuICAgIG1hcmdpbkxlZnQ6IDE0XG4gIH0sXG4gIGxhYmVsOiB7XG4gICAgbWFyZ2luOiAwLFxuICAgIHBhZGRpbmc6IDAsXG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaydcbiAgfSxcbiAgc3Bhbjoge1xuICAgIGN1cnNvcjogJ2RlZmF1bHQnXG4gIH0sXG4gIHNwYW5UeXBlOiB7XG4gICAgbWFyZ2luTGVmdDogNSxcbiAgICBtYXJnaW5SaWdodDogNVxuICB9XG59O1xuXG52YXIgSlNPTkFycmF5Tm9kZSA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoSlNPTkFycmF5Tm9kZSwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gSlNPTkFycmF5Tm9kZShwcm9wcykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfSlNPTkFycmF5Tm9kZSk7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmNhbGwodGhpcywgcHJvcHMpO1xuICAgIHRoaXMuZGVmYXVsdFByb3BzID0ge1xuICAgICAgZGF0YTogW10sXG4gICAgICBpbml0aWFsRXhwYW5kZWQ6IGZhbHNlXG4gICAgfTtcbiAgICB0aGlzLm5lZWRzQ2hpbGROb2RlcyA9IHRydWU7XG4gICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gW107XG4gICAgdGhpcy5pdGVtU3RyaW5nID0gZmFsc2U7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGV4cGFuZGVkOiB0aGlzLnByb3BzLmluaXRpYWxFeHBhbmRlZCxcbiAgICAgIGNyZWF0ZWRDaGlsZE5vZGVzOiBmYWxzZVxuICAgIH07XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBjaGlsZCBub2RlcyBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBhcnJheS4gSWYgd2UgaGF2ZVxuICAvLyBnZW5lcmF0ZWQgdGhlbSBwcmV2aW91c2x5LCB3ZSByZXR1cm4gZnJvbSBjYWNoZSwgb3RoZXJ3aXNlIHdlIGNyZWF0ZVxuICAvLyB0aGVtLlxuXG4gIEpTT05BcnJheU5vZGUucHJvdG90eXBlLmdldENoaWxkTm9kZXMgPSBmdW5jdGlvbiBnZXRDaGlsZE5vZGVzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZiAodGhpcy5zdGF0ZS5leHBhbmRlZCAmJiB0aGlzLm5lZWRzQ2hpbGROb2Rlcykge1xuICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSBbXTtcbiAgICAgICAgX3RoaXMucHJvcHMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50LCBpZHgpIHtcbiAgICAgICAgICB2YXIgcHJldkRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5wcm9wcy5wcmV2aW91c0RhdGEgIT09ICd1bmRlZmluZWQnICYmIF90aGlzLnByb3BzLnByZXZpb3VzRGF0YSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcHJldkRhdGEgPSBfdGhpcy5wcm9wcy5wcmV2aW91c0RhdGFbaWR4XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIG5vZGUgPSBfZ3JhYk5vZGUyWydkZWZhdWx0J10oaWR4LCBlbGVtZW50LCBwcmV2RGF0YSwgX3RoaXMucHJvcHMudGhlbWUpO1xuICAgICAgICAgIGlmIChub2RlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgY2hpbGROb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIF90aGlzLm5lZWRzQ2hpbGROb2RlcyA9IGZhbHNlO1xuICAgICAgICBfdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gY2hpbGROb2RlcztcbiAgICAgIH0pKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlbmRlcmVkQ2hpbGRyZW47XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgXCJuIEl0ZW1zXCIgc3RyaW5nIGZvciB0aGlzIG5vZGUsIGdlbmVyYXRpbmcgYW5kXG4gIC8vIGNhY2hpbmcgaXQgaWYgaXQgaGFzbid0IGJlZW4gY3JlYXRlZCB5ZXQuXG5cbiAgSlNPTkFycmF5Tm9kZS5wcm90b3R5cGUuZ2V0SXRlbVN0cmluZyA9IGZ1bmN0aW9uIGdldEl0ZW1TdHJpbmcoKSB7XG4gICAgaWYgKCF0aGlzLml0ZW1TdHJpbmcpIHtcbiAgICAgIHRoaXMuaXRlbVN0cmluZyA9IHRoaXMucHJvcHMuZGF0YS5sZW5ndGggKyAnIGl0ZW0nICsgKHRoaXMucHJvcHMuZGF0YS5sZW5ndGggIT09IDEgPyAncycgOiAnJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLml0ZW1TdHJpbmc7XG4gIH07XG5cbiAgSlNPTkFycmF5Tm9kZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBjaGlsZE5vZGVzID0gdGhpcy5nZXRDaGlsZE5vZGVzKCk7XG4gICAgdmFyIGNoaWxkTGlzdFN0eWxlID0ge1xuICAgICAgcGFkZGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIGxpc3RTdHlsZTogJ25vbmUnLFxuICAgICAgZGlzcGxheTogdGhpcy5zdGF0ZS5leHBhbmRlZCA/ICdibG9jaycgOiAnbm9uZSdcbiAgICB9O1xuICAgIHZhciBjb250YWluZXJTdHlsZSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgc3BhblN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlcy5zcGFuLCB7XG4gICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMEVcbiAgICB9KTtcbiAgICBjb250YWluZXJTdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZXMuYmFzZSk7XG4gICAgaWYgKHRoaXMuc3RhdGUuZXhwYW5kZWQpIHtcbiAgICAgIHNwYW5TdHlsZSA9IF9leHRlbmRzKHt9LCBzcGFuU3R5bGUsIHtcbiAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTAzXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2xpJyxcbiAgICAgIHsgc3R5bGU6IGNvbnRhaW5lclN0eWxlIH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTkFycm93MlsnZGVmYXVsdCddLCB7IHRoZW1lOiB0aGlzLnByb3BzLnRoZW1lLCBvcGVuOiB0aGlzLnN0YXRlLmV4cGFuZGVkLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2xhYmVsJyxcbiAgICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5sYWJlbCwge1xuICAgICAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBEXG4gICAgICAgICAgfSksIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgICB0aGlzLnByb3BzLmtleU5hbWUsXG4gICAgICAgICc6J1xuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnc3BhbicsXG4gICAgICAgIHsgc3R5bGU6IHNwYW5TdHlsZSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICdzcGFuJyxcbiAgICAgICAgICB7IHN0eWxlOiBzdHlsZXMuc3BhblR5cGUgfSxcbiAgICAgICAgICAnW10nXG4gICAgICAgICksXG4gICAgICAgIHRoaXMuZ2V0SXRlbVN0cmluZygpXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdvbCcsXG4gICAgICAgIHsgc3R5bGU6IGNoaWxkTGlzdFN0eWxlIH0sXG4gICAgICAgIGNoaWxkTm9kZXNcbiAgICAgIClcbiAgICApO1xuICB9O1xuXG4gIHZhciBfSlNPTkFycmF5Tm9kZSA9IEpTT05BcnJheU5vZGU7XG4gIEpTT05BcnJheU5vZGUgPSBfcmVhY3RNaXhpbjJbJ2RlZmF1bHQnXS5kZWNvcmF0ZShfbWl4aW5zLkV4cGFuZGVkU3RhdGVIYW5kbGVyTWl4aW4pKEpTT05BcnJheU5vZGUpIHx8IEpTT05BcnJheU5vZGU7XG4gIHJldHVybiBKU09OQXJyYXlOb2RlO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEpTT05BcnJheU5vZGU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLy8gZmxhZyB0byBzZWUgaWYgd2Ugc3RpbGwgbmVlZCB0byByZW5kZXIgb3VyIGNoaWxkIG5vZGVzXG5cbi8vIGNhY2hlIHN0b3JlIGZvciBvdXIgY2hpbGQgbm9kZXNcblxuLy8gY2FjaGUgc3RvcmUgZm9yIHRoZSBudW1iZXIgb2YgaXRlbXMgc3RyaW5nIHdlIGRpc3BsYXkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW5oZXJpdHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2snKVsnZGVmYXVsdCddO1xuXG52YXIgX2V4dGVuZHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcycpWydkZWZhdWx0J107XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgc3R5bGVzID0ge1xuICBiYXNlOiB7XG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgbWFyZ2luTGVmdDogMCxcbiAgICBtYXJnaW5Ub3A6IDgsXG4gICAgbWFyZ2luUmlnaHQ6IDUsXG4gICAgJ2Zsb2F0JzogJ2xlZnQnLFxuICAgIHRyYW5zaXRpb246ICcxNTBtcycsXG4gICAgV2Via2l0VHJhbnNpdGlvbjogJzE1MG1zJyxcbiAgICBNb3pUcmFuc2l0aW9uOiAnMTUwbXMnLFxuICAgIGJvcmRlckxlZnQ6ICc1cHggc29saWQgdHJhbnNwYXJlbnQnLFxuICAgIGJvcmRlclJpZ2h0OiAnNXB4IHNvbGlkIHRyYW5zcGFyZW50JyxcbiAgICBib3JkZXJUb3BXaWR0aDogNSxcbiAgICBib3JkZXJUb3BTdHlsZTogJ3NvbGlkJyxcbiAgICBXZWJraXRUcmFuc2Zvcm06ICdyb3RhdGVaKC05MGRlZyknLFxuICAgIE1velRyYW5zZm9ybTogJ3JvdGF0ZVooLTkwZGVnKScsXG4gICAgdHJhbnNmb3JtOiAncm90YXRlWigtOTBkZWcpJ1xuICB9LFxuICBvcGVuOiB7XG4gICAgV2Via2l0VHJhbnNmb3JtOiAncm90YXRlWigwZGVnKScsXG4gICAgTW96VHJhbnNmb3JtOiAncm90YXRlWigwZGVnKScsXG4gICAgdHJhbnNmb3JtOiAncm90YXRlWigwZGVnKSdcbiAgfVxufTtcblxudmFyIEpTT05BcnJvdyA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoSlNPTkFycm93LCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBKU09OQXJyb3coKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEpTT05BcnJvdyk7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBKU09OQXJyb3cucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgc3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJhc2UsIHtcbiAgICAgIGJvcmRlclRvcENvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRFxuICAgIH0pO1xuICAgIGlmICh0aGlzLnByb3BzLm9wZW4pIHtcbiAgICAgIHN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlLCBzdHlsZXMub3Blbik7XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudCgnZGl2JywgeyBzdHlsZTogc3R5bGUsIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGljayB9KTtcbiAgfTtcblxuICByZXR1cm4gSlNPTkFycm93O1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEpTT05BcnJvdztcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbmhlcml0cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cycpWydkZWZhdWx0J107XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3MtY2FsbC1jaGVjaycpWydkZWZhdWx0J107XG5cbnZhciBfZXh0ZW5kcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9leHRlbmRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RNaXhpbiA9IHJlcXVpcmUoJ3JlYWN0LW1peGluJyk7XG5cbnZhciBfcmVhY3RNaXhpbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdE1peGluKTtcblxudmFyIF9taXhpbnMgPSByZXF1aXJlKCcuL21peGlucycpO1xuXG52YXIgX3V0aWxzSGV4VG9SZ2IgPSByZXF1aXJlKCcuL3V0aWxzL2hleFRvUmdiJyk7XG5cbnZhciBfdXRpbHNIZXhUb1JnYjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc0hleFRvUmdiKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYmFzZToge1xuICAgIHBhZGRpbmdUb3A6IDMsXG4gICAgcGFkZGluZ0JvdHRvbTogMyxcbiAgICBwYWRkaW5nUmlnaHQ6IDAsXG4gICAgbWFyZ2luTGVmdDogMTRcbiAgfSxcbiAgbGFiZWw6IHtcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICBtYXJnaW5SaWdodDogNVxuICB9XG59O1xuXG52YXIgSlNPTkJvb2xlYW5Ob2RlID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhKU09OQm9vbGVhbk5vZGUsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIEpTT05Cb29sZWFuTm9kZSgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX0pTT05Cb29sZWFuTm9kZSk7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBKU09OQm9vbGVhbk5vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgdHJ1dGhTdHJpbmcgPSB0aGlzLnByb3BzLnZhbHVlID8gJ3RydWUnIDogJ2ZhbHNlJztcbiAgICB2YXIgYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICBpZiAodGhpcy5wcm9wcy5wcmV2aW91c1ZhbHVlICE9PSB0aGlzLnByb3BzLnZhbHVlKSB7XG4gICAgICB2YXIgYmdDb2xvciA9IF91dGlsc0hleFRvUmdiMlsnZGVmYXVsdCddKHRoaXMucHJvcHMudGhlbWUuYmFzZTA2KTtcbiAgICAgIGJhY2tncm91bmRDb2xvciA9ICdyZ2JhKCcgKyBiZ0NvbG9yLnIgKyAnLCAnICsgYmdDb2xvci5nICsgJywgJyArIGJnQ29sb3IuYiArICcsIDAuMSknO1xuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnbGknLFxuICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5iYXNlLCB7IGJhY2tncm91bmRDb2xvcjogYmFja2dyb3VuZENvbG9yIH0pLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnbGFiZWwnLFxuICAgICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmxhYmVsLCB7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMERcbiAgICAgICAgICB9KSB9LFxuICAgICAgICB0aGlzLnByb3BzLmtleU5hbWUsXG4gICAgICAgICc6J1xuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnc3BhbicsXG4gICAgICAgIHsgc3R5bGU6IHsgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTA5IH0gfSxcbiAgICAgICAgdHJ1dGhTdHJpbmdcbiAgICAgIClcbiAgICApO1xuICB9O1xuXG4gIHZhciBfSlNPTkJvb2xlYW5Ob2RlID0gSlNPTkJvb2xlYW5Ob2RlO1xuICBKU09OQm9vbGVhbk5vZGUgPSBfcmVhY3RNaXhpbjJbJ2RlZmF1bHQnXS5kZWNvcmF0ZShfbWl4aW5zLlNxdWFzaENsaWNrRXZlbnRNaXhpbikoSlNPTkJvb2xlYW5Ob2RlKSB8fCBKU09OQm9vbGVhbk5vZGU7XG4gIHJldHVybiBKU09OQm9vbGVhbk5vZGU7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gSlNPTkJvb2xlYW5Ob2RlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2luaGVyaXRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrJylbJ2RlZmF1bHQnXTtcblxudmFyIF9leHRlbmRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdE1peGluID0gcmVxdWlyZSgncmVhY3QtbWl4aW4nKTtcblxudmFyIF9yZWFjdE1peGluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0TWl4aW4pO1xuXG52YXIgX21peGlucyA9IHJlcXVpcmUoJy4vbWl4aW5zJyk7XG5cbnZhciBfdXRpbHNIZXhUb1JnYiA9IHJlcXVpcmUoJy4vdXRpbHMvaGV4VG9SZ2InKTtcblxudmFyIF91dGlsc0hleFRvUmdiMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzSGV4VG9SZ2IpO1xuXG52YXIgc3R5bGVzID0ge1xuICBiYXNlOiB7XG4gICAgcGFkZGluZ1RvcDogMyxcbiAgICBwYWRkaW5nQm90dG9tOiAzLFxuICAgIHBhZGRpbmdSaWdodDogMCxcbiAgICBtYXJnaW5MZWZ0OiAxNFxuICB9LFxuICBsYWJlbDoge1xuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgIG1hcmdpblJpZ2h0OiA1XG4gIH1cbn07XG5cbnZhciBKU09ORGF0ZU5vZGUgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKEpTT05EYXRlTm9kZSwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gSlNPTkRhdGVOb2RlKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfSlNPTkRhdGVOb2RlKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIEpTT05EYXRlTm9kZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBiYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIGlmICh0aGlzLnByb3BzLnByZXZpb3VzVmFsdWUgIT09IHRoaXMucHJvcHMudmFsdWUpIHtcbiAgICAgIHZhciBiZ0NvbG9yID0gX3V0aWxzSGV4VG9SZ2IyWydkZWZhdWx0J10odGhpcy5wcm9wcy50aGVtZS5iYXNlMDYpO1xuICAgICAgYmFja2dyb3VuZENvbG9yID0gJ3JnYmEoJyArIGJnQ29sb3IuciArICcsICcgKyBiZ0NvbG9yLmcgKyAnLCAnICsgYmdDb2xvci5iICsgJywgMC4xKSc7XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdsaScsXG4gICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJhc2UsIHsgYmFja2dyb3VuZENvbG9yOiBiYWNrZ3JvdW5kQ29sb3IgfSksIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdsYWJlbCcsXG4gICAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMubGFiZWwsIHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRFxuICAgICAgICAgIH0pIH0sXG4gICAgICAgIHRoaXMucHJvcHMua2V5TmFtZSxcbiAgICAgICAgJzonXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdzcGFuJyxcbiAgICAgICAgeyBzdHlsZTogeyBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMEIgfSB9LFxuICAgICAgICB0aGlzLnByb3BzLnZhbHVlLnRvSVNPU3RyaW5nKClcbiAgICAgIClcbiAgICApO1xuICB9O1xuXG4gIHZhciBfSlNPTkRhdGVOb2RlID0gSlNPTkRhdGVOb2RlO1xuICBKU09ORGF0ZU5vZGUgPSBfcmVhY3RNaXhpbjJbJ2RlZmF1bHQnXS5kZWNvcmF0ZShfbWl4aW5zLlNxdWFzaENsaWNrRXZlbnRNaXhpbikoSlNPTkRhdGVOb2RlKSB8fCBKU09ORGF0ZU5vZGU7XG4gIHJldHVybiBKU09ORGF0ZU5vZGU7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gSlNPTkRhdGVOb2RlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2luaGVyaXRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrJylbJ2RlZmF1bHQnXTtcblxudmFyIF9leHRlbmRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2dldEl0ZXJhdG9yID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9jb3JlLWpzL2dldC1pdGVyYXRvcicpWydkZWZhdWx0J107XG5cbnZhciBfTnVtYmVyJGlzU2FmZUludGVnZXIgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2NvcmUtanMvbnVtYmVyL2lzLXNhZmUtaW50ZWdlcicpWydkZWZhdWx0J107XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0TWl4aW4gPSByZXF1aXJlKCdyZWFjdC1taXhpbicpO1xuXG52YXIgX3JlYWN0TWl4aW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RNaXhpbik7XG5cbnZhciBfbWl4aW5zID0gcmVxdWlyZSgnLi9taXhpbnMnKTtcblxudmFyIF9KU09OQXJyb3cgPSByZXF1aXJlKCcuL0pTT05BcnJvdycpO1xuXG52YXIgX0pTT05BcnJvdzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09OQXJyb3cpO1xuXG52YXIgX2dyYWJOb2RlID0gcmVxdWlyZSgnLi9ncmFiLW5vZGUnKTtcblxudmFyIF9ncmFiTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ncmFiTm9kZSk7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGJhc2U6IHtcbiAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICBwYWRkaW5nVG9wOiAzLFxuICAgIHBhZGRpbmdCb3R0b206IDMsXG4gICAgcGFkZGluZ1JpZ2h0OiAwLFxuICAgIG1hcmdpbkxlZnQ6IDE0XG4gIH0sXG4gIGxhYmVsOiB7XG4gICAgbWFyZ2luOiAwLFxuICAgIHBhZGRpbmc6IDAsXG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaydcbiAgfSxcbiAgc3Bhbjoge1xuICAgIGN1cnNvcjogJ2RlZmF1bHQnXG4gIH0sXG4gIHNwYW5UeXBlOiB7XG4gICAgbWFyZ2luTGVmdDogNSxcbiAgICBtYXJnaW5SaWdodDogNVxuICB9XG59O1xuXG52YXIgSlNPTkl0ZXJhYmxlTm9kZSA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoSlNPTkl0ZXJhYmxlTm9kZSwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gSlNPTkl0ZXJhYmxlTm9kZShwcm9wcykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfSlNPTkl0ZXJhYmxlTm9kZSk7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmNhbGwodGhpcywgcHJvcHMpO1xuICAgIHRoaXMuZGVmYXVsdFByb3BzID0ge1xuICAgICAgZGF0YTogW10sXG4gICAgICBpbml0aWFsRXhwYW5kZWQ6IGZhbHNlXG4gICAgfTtcbiAgICB0aGlzLm5lZWRzQ2hpbGROb2RlcyA9IHRydWU7XG4gICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gW107XG4gICAgdGhpcy5pdGVtU3RyaW5nID0gZmFsc2U7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGV4cGFuZGVkOiB0aGlzLnByb3BzLmluaXRpYWxFeHBhbmRlZCxcbiAgICAgIGNyZWF0ZWRDaGlsZE5vZGVzOiBmYWxzZVxuICAgIH07XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBjaGlsZCBub2RlcyBmb3IgZWFjaCBlbnRyeSBpbiBpdGVyYWJsZS4gSWYgd2UgaGF2ZVxuICAvLyBnZW5lcmF0ZWQgdGhlbSBwcmV2aW91c2x5LCB3ZSByZXR1cm4gZnJvbSBjYWNoZSwgb3RoZXJ3aXNlIHdlIGNyZWF0ZVxuICAvLyB0aGVtLlxuXG4gIEpTT05JdGVyYWJsZU5vZGUucHJvdG90eXBlLmdldENoaWxkTm9kZXMgPSBmdW5jdGlvbiBnZXRDaGlsZE5vZGVzKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmV4cGFuZGVkICYmIHRoaXMubmVlZHNDaGlsZE5vZGVzKSB7XG4gICAgICB2YXIgY2hpbGROb2RlcyA9IFtdO1xuICAgICAgZm9yICh2YXIgX2l0ZXJhdG9yID0gdGhpcy5wcm9wcy5kYXRhLCBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoX2l0ZXJhdG9yKSwgX2kgPSAwLCBfaXRlcmF0b3IgPSBfaXNBcnJheSA/IF9pdGVyYXRvciA6IF9nZXRJdGVyYXRvcihfaXRlcmF0b3IpOzspIHtcbiAgICAgICAgdmFyIF9yZWY7XG5cbiAgICAgICAgaWYgKF9pc0FycmF5KSB7XG4gICAgICAgICAgaWYgKF9pID49IF9pdGVyYXRvci5sZW5ndGgpIGJyZWFrO1xuICAgICAgICAgIF9yZWYgPSBfaXRlcmF0b3JbX2krK107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX2kgPSBfaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgIGlmIChfaS5kb25lKSBicmVhaztcbiAgICAgICAgICBfcmVmID0gX2kudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZW50cnkgPSBfcmVmO1xuXG4gICAgICAgIHZhciBrZXkgPSBudWxsO1xuICAgICAgICB2YXIgdmFsdWUgPSBudWxsO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShlbnRyeSkpIHtcbiAgICAgICAgICBrZXkgPSBlbnRyeVswXTtcbiAgICAgICAgICB2YWx1ZSA9IGVudHJ5WzFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGtleSA9IGNoaWxkTm9kZXMubGVuZ3RoO1xuICAgICAgICAgIHZhbHVlID0gZW50cnk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJldkRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy5wcmV2aW91c0RhdGEgIT09ICd1bmRlZmluZWQnICYmIHRoaXMucHJvcHMucHJldmlvdXNEYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgcHJldkRhdGEgPSB0aGlzLnByb3BzLnByZXZpb3VzRGF0YVtrZXldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBub2RlID0gX2dyYWJOb2RlMlsnZGVmYXVsdCddKGtleSwgdmFsdWUsIHByZXZEYXRhLCB0aGlzLnByb3BzLnRoZW1lKTtcbiAgICAgICAgaWYgKG5vZGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgY2hpbGROb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLm5lZWRzQ2hpbGROb2RlcyA9IGZhbHNlO1xuICAgICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gY2hpbGROb2RlcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZWRDaGlsZHJlbjtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBcIm4gZW50cmllc1wiIHN0cmluZyBmb3IgdGhpcyBub2RlLCBnZW5lcmF0aW5nIGFuZFxuICAvLyBjYWNoaW5nIGl0IGlmIGl0IGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LlxuXG4gIEpTT05JdGVyYWJsZU5vZGUucHJvdG90eXBlLmdldEl0ZW1TdHJpbmcgPSBmdW5jdGlvbiBnZXRJdGVtU3RyaW5nKCkge1xuICAgIGlmICghdGhpcy5pdGVtU3RyaW5nKSB7XG4gICAgICB2YXIgZGF0YSA9IHRoaXMucHJvcHMuZGF0YTtcblxuICAgICAgdmFyIGNvdW50ID0gMDtcbiAgICAgIGlmIChfTnVtYmVyJGlzU2FmZUludGVnZXIoZGF0YS5zaXplKSkge1xuICAgICAgICBjb3VudCA9IGRhdGEuc2l6ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIF9pdGVyYXRvcjIgPSBkYXRhLCBfaXNBcnJheTIgPSBBcnJheS5pc0FycmF5KF9pdGVyYXRvcjIpLCBfaTIgPSAwLCBfaXRlcmF0b3IyID0gX2lzQXJyYXkyID8gX2l0ZXJhdG9yMiA6IF9nZXRJdGVyYXRvcihfaXRlcmF0b3IyKTs7KSB7XG4gICAgICAgICAgdmFyIF9yZWYyO1xuXG4gICAgICAgICAgaWYgKF9pc0FycmF5Mikge1xuICAgICAgICAgICAgaWYgKF9pMiA+PSBfaXRlcmF0b3IyLmxlbmd0aCkgYnJlYWs7XG4gICAgICAgICAgICBfcmVmMiA9IF9pdGVyYXRvcjJbX2kyKytdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfaTIgPSBfaXRlcmF0b3IyLm5leHQoKTtcbiAgICAgICAgICAgIGlmIChfaTIuZG9uZSkgYnJlYWs7XG4gICAgICAgICAgICBfcmVmMiA9IF9pMi52YWx1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgZW50cnkgPSBfcmVmMjtcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgY291bnQgKz0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5pdGVtU3RyaW5nID0gY291bnQgKyAnIGVudHInICsgKGNvdW50ICE9PSAxID8gJ2llcycgOiAneScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pdGVtU3RyaW5nO1xuICB9O1xuXG4gIEpTT05JdGVyYWJsZU5vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgY2hpbGROb2RlcyA9IHRoaXMuZ2V0Q2hpbGROb2RlcygpO1xuICAgIHZhciBjaGlsZExpc3RTdHlsZSA9IHtcbiAgICAgIHBhZGRpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBsaXN0U3R5bGU6ICdub25lJyxcbiAgICAgIGRpc3BsYXk6IHRoaXMuc3RhdGUuZXhwYW5kZWQgPyAnYmxvY2snIDogJ25vbmUnXG4gICAgfTtcbiAgICB2YXIgY29udGFpbmVyU3R5bGUgPSB1bmRlZmluZWQ7XG4gICAgdmFyIHNwYW5TdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZXMuc3Bhbiwge1xuICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBFXG4gICAgfSk7XG4gICAgY29udGFpbmVyU3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJhc2UpO1xuICAgIGlmICh0aGlzLnN0YXRlLmV4cGFuZGVkKSB7XG4gICAgICBzcGFuU3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3BhblN0eWxlLCB7XG4gICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwM1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdsaScsXG4gICAgICB7IHN0eWxlOiBjb250YWluZXJTdHlsZSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05BcnJvdzJbJ2RlZmF1bHQnXSwgeyB0aGVtZTogdGhpcy5wcm9wcy50aGVtZSwgb3BlbjogdGhpcy5zdGF0ZS5leHBhbmRlZCwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0pLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdsYWJlbCcsXG4gICAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMubGFiZWwsIHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRFxuICAgICAgICAgIH0pLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgICAgdGhpcy5wcm9wcy5rZXlOYW1lLFxuICAgICAgICAnOidcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ3NwYW4nLFxuICAgICAgICB7IHN0eWxlOiBzcGFuU3R5bGUsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAnc3BhbicsXG4gICAgICAgICAgeyBzdHlsZTogc3R5bGVzLnNwYW5UeXBlIH0sXG4gICAgICAgICAgJygpJ1xuICAgICAgICApLFxuICAgICAgICB0aGlzLmdldEl0ZW1TdHJpbmcoKVxuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnb2wnLFxuICAgICAgICB7IHN0eWxlOiBjaGlsZExpc3RTdHlsZSB9LFxuICAgICAgICBjaGlsZE5vZGVzXG4gICAgICApXG4gICAgKTtcbiAgfTtcblxuICB2YXIgX0pTT05JdGVyYWJsZU5vZGUgPSBKU09OSXRlcmFibGVOb2RlO1xuICBKU09OSXRlcmFibGVOb2RlID0gX3JlYWN0TWl4aW4yWydkZWZhdWx0J10uZGVjb3JhdGUoX21peGlucy5FeHBhbmRlZFN0YXRlSGFuZGxlck1peGluKShKU09OSXRlcmFibGVOb2RlKSB8fCBKU09OSXRlcmFibGVOb2RlO1xuICByZXR1cm4gSlNPTkl0ZXJhYmxlTm9kZTtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBKU09OSXRlcmFibGVOb2RlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbi8vIGZsYWcgdG8gc2VlIGlmIHdlIHN0aWxsIG5lZWQgdG8gcmVuZGVyIG91ciBjaGlsZCBub2Rlc1xuXG4vLyBjYWNoZSBzdG9yZSBmb3Igb3VyIGNoaWxkIG5vZGVzXG5cbi8vIGNhY2hlIHN0b3JlIGZvciB0aGUgbnVtYmVyIG9mIGl0ZW1zIHN0cmluZyB3ZSBkaXNwbGF5IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2luaGVyaXRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrJylbJ2RlZmF1bHQnXTtcblxudmFyIF9leHRlbmRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdE1peGluID0gcmVxdWlyZSgncmVhY3QtbWl4aW4nKTtcblxudmFyIF9yZWFjdE1peGluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0TWl4aW4pO1xuXG52YXIgX21peGlucyA9IHJlcXVpcmUoJy4vbWl4aW5zJyk7XG5cbnZhciBfdXRpbHNIZXhUb1JnYiA9IHJlcXVpcmUoJy4vdXRpbHMvaGV4VG9SZ2InKTtcblxudmFyIF91dGlsc0hleFRvUmdiMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzSGV4VG9SZ2IpO1xuXG52YXIgc3R5bGVzID0ge1xuICBiYXNlOiB7XG4gICAgcGFkZGluZ1RvcDogMyxcbiAgICBwYWRkaW5nQm90dG9tOiAzLFxuICAgIHBhZGRpbmdSaWdodDogMCxcbiAgICBtYXJnaW5MZWZ0OiAxNFxuICB9LFxuICBsYWJlbDoge1xuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgIG1hcmdpblJpZ2h0OiA1XG4gIH1cbn07XG5cbnZhciBKU09OTnVsbE5vZGUgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKEpTT05OdWxsTm9kZSwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gSlNPTk51bGxOb2RlKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfSlNPTk51bGxOb2RlKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIEpTT05OdWxsTm9kZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBiYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIGlmICh0aGlzLnByb3BzLnByZXZpb3VzVmFsdWUgIT09IHRoaXMucHJvcHMudmFsdWUpIHtcbiAgICAgIHZhciBiZ0NvbG9yID0gX3V0aWxzSGV4VG9SZ2IyWydkZWZhdWx0J10odGhpcy5wcm9wcy50aGVtZS5iYXNlMDYpO1xuICAgICAgYmFja2dyb3VuZENvbG9yID0gJ3JnYmEoJyArIGJnQ29sb3IuciArICcsICcgKyBiZ0NvbG9yLmcgKyAnLCAnICsgYmdDb2xvci5iICsgJywgMC4xKSc7XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdsaScsXG4gICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJhc2UsIHsgYmFja2dyb3VuZENvbG9yOiBiYWNrZ3JvdW5kQ29sb3IgfSksIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdsYWJlbCcsXG4gICAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMubGFiZWwsIHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRFxuICAgICAgICAgIH0pIH0sXG4gICAgICAgIHRoaXMucHJvcHMua2V5TmFtZSxcbiAgICAgICAgJzonXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdzcGFuJyxcbiAgICAgICAgeyBzdHlsZTogeyBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDggfSB9LFxuICAgICAgICAnbnVsbCdcbiAgICAgIClcbiAgICApO1xuICB9O1xuXG4gIHZhciBfSlNPTk51bGxOb2RlID0gSlNPTk51bGxOb2RlO1xuICBKU09OTnVsbE5vZGUgPSBfcmVhY3RNaXhpbjJbJ2RlZmF1bHQnXS5kZWNvcmF0ZShfbWl4aW5zLlNxdWFzaENsaWNrRXZlbnRNaXhpbikoSlNPTk51bGxOb2RlKSB8fCBKU09OTnVsbE5vZGU7XG4gIHJldHVybiBKU09OTnVsbE5vZGU7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gSlNPTk51bGxOb2RlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2luaGVyaXRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrJylbJ2RlZmF1bHQnXTtcblxudmFyIF9leHRlbmRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdE1peGluID0gcmVxdWlyZSgncmVhY3QtbWl4aW4nKTtcblxudmFyIF9yZWFjdE1peGluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0TWl4aW4pO1xuXG52YXIgX21peGlucyA9IHJlcXVpcmUoJy4vbWl4aW5zJyk7XG5cbnZhciBfdXRpbHNIZXhUb1JnYiA9IHJlcXVpcmUoJy4vdXRpbHMvaGV4VG9SZ2InKTtcblxudmFyIF91dGlsc0hleFRvUmdiMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzSGV4VG9SZ2IpO1xuXG52YXIgc3R5bGVzID0ge1xuICBiYXNlOiB7XG4gICAgcGFkZGluZ1RvcDogMyxcbiAgICBwYWRkaW5nQm90dG9tOiAzLFxuICAgIHBhZGRpbmdSaWdodDogMCxcbiAgICBtYXJnaW5MZWZ0OiAxNFxuICB9LFxuICBsYWJlbDoge1xuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgIG1hcmdpblJpZ2h0OiA1XG4gIH1cbn07XG5cbnZhciBKU09OTnVtYmVyTm9kZSA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoSlNPTk51bWJlck5vZGUsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIEpTT05OdW1iZXJOb2RlKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfSlNPTk51bWJlck5vZGUpO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgSlNPTk51bWJlck5vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICBpZiAodGhpcy5wcm9wcy5wcmV2aW91c1ZhbHVlICE9PSB0aGlzLnByb3BzLnZhbHVlKSB7XG4gICAgICB2YXIgYmdDb2xvciA9IF91dGlsc0hleFRvUmdiMlsnZGVmYXVsdCddKHRoaXMucHJvcHMudGhlbWUuYmFzZTA2KTtcbiAgICAgIGJhY2tncm91bmRDb2xvciA9ICdyZ2JhKCcgKyBiZ0NvbG9yLnIgKyAnLCAnICsgYmdDb2xvci5nICsgJywgJyArIGJnQ29sb3IuYiArICcsIDAuMSknO1xuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnbGknLFxuICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5iYXNlLCB7IGJhY2tncm91bmRDb2xvcjogYmFja2dyb3VuZENvbG9yIH0pLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnbGFiZWwnLFxuICAgICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmxhYmVsLCB7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMERcbiAgICAgICAgICB9KSB9LFxuICAgICAgICB0aGlzLnByb3BzLmtleU5hbWUsXG4gICAgICAgICc6J1xuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnc3BhbicsXG4gICAgICAgIHsgc3R5bGU6IHsgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTA5IH0gfSxcbiAgICAgICAgdGhpcy5wcm9wcy52YWx1ZVxuICAgICAgKVxuICAgICk7XG4gIH07XG5cbiAgdmFyIF9KU09OTnVtYmVyTm9kZSA9IEpTT05OdW1iZXJOb2RlO1xuICBKU09OTnVtYmVyTm9kZSA9IF9yZWFjdE1peGluMlsnZGVmYXVsdCddLmRlY29yYXRlKF9taXhpbnMuU3F1YXNoQ2xpY2tFdmVudE1peGluKShKU09OTnVtYmVyTm9kZSkgfHwgSlNPTk51bWJlck5vZGU7XG4gIHJldHVybiBKU09OTnVtYmVyTm9kZTtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBKU09OTnVtYmVyTm9kZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbmhlcml0cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cycpWydkZWZhdWx0J107XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3MtY2FsbC1jaGVjaycpWydkZWZhdWx0J107XG5cbnZhciBfZXh0ZW5kcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9leHRlbmRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9PYmplY3Qka2V5cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3Qva2V5cycpWydkZWZhdWx0J107XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0TWl4aW4gPSByZXF1aXJlKCdyZWFjdC1taXhpbicpO1xuXG52YXIgX3JlYWN0TWl4aW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RNaXhpbik7XG5cbnZhciBfbWl4aW5zID0gcmVxdWlyZSgnLi9taXhpbnMnKTtcblxudmFyIF9KU09OQXJyb3cgPSByZXF1aXJlKCcuL0pTT05BcnJvdycpO1xuXG52YXIgX0pTT05BcnJvdzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09OQXJyb3cpO1xuXG52YXIgX2dyYWJOb2RlID0gcmVxdWlyZSgnLi9ncmFiLW5vZGUnKTtcblxudmFyIF9ncmFiTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ncmFiTm9kZSk7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGJhc2U6IHtcbiAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICBwYWRkaW5nVG9wOiAzLFxuICAgIHBhZGRpbmdCb3R0b206IDMsXG4gICAgbWFyZ2luTGVmdDogMTRcbiAgfSxcbiAgbGFiZWw6IHtcbiAgICBtYXJnaW46IDAsXG4gICAgcGFkZGluZzogMCxcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ1xuICB9LFxuICBzcGFuOiB7XG4gICAgY3Vyc29yOiAnZGVmYXVsdCdcbiAgfSxcbiAgc3BhblR5cGU6IHtcbiAgICBtYXJnaW5MZWZ0OiA1LFxuICAgIG1hcmdpblJpZ2h0OiA1XG4gIH1cbn07XG5cbnZhciBKU09OT2JqZWN0Tm9kZSA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoSlNPTk9iamVjdE5vZGUsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIEpTT05PYmplY3ROb2RlKHByb3BzKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIF9KU09OT2JqZWN0Tm9kZSk7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmNhbGwodGhpcywgcHJvcHMpO1xuICAgIHRoaXMuZGVmYXVsdFByb3BzID0ge1xuICAgICAgZGF0YTogW10sXG4gICAgICBpbml0aWFsRXhwYW5kZWQ6IGZhbHNlXG4gICAgfTtcbiAgICB0aGlzLml0ZW1TdHJpbmcgPSBmYWxzZTtcbiAgICB0aGlzLm5lZWRzQ2hpbGROb2RlcyA9IHRydWU7XG4gICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gW107XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGV4cGFuZGVkOiB0aGlzLnByb3BzLmluaXRpYWxFeHBhbmRlZCxcbiAgICAgIGNyZWF0ZWRDaGlsZE5vZGVzOiBmYWxzZVxuICAgIH07XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBjaGlsZCBub2RlcyBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBvYmplY3QuIElmIHdlIGhhdmVcbiAgLy8gZ2VuZXJhdGVkIHRoZW0gcHJldmlvdXNseSwgd2UgcmV0dXJuIGZyb20gY2FjaGUsIG90aGVyd2lzZSB3ZSBjcmVhdGVcbiAgLy8gdGhlbS5cblxuICBKU09OT2JqZWN0Tm9kZS5wcm90b3R5cGUuZ2V0Q2hpbGROb2RlcyA9IGZ1bmN0aW9uIGdldENoaWxkTm9kZXMoKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuZXhwYW5kZWQgJiYgdGhpcy5uZWVkc0NoaWxkTm9kZXMpIHtcbiAgICAgIHZhciBvYmogPSB0aGlzLnByb3BzLmRhdGE7XG4gICAgICB2YXIgY2hpbGROb2RlcyA9IFtdO1xuICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgIHZhciBwcmV2RGF0YSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMucHJldmlvdXNEYXRhICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLnByb3BzLnByZXZpb3VzRGF0YSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcHJldkRhdGEgPSB0aGlzLnByb3BzLnByZXZpb3VzRGF0YVtrXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIG5vZGUgPSBfZ3JhYk5vZGUyWydkZWZhdWx0J10oaywgb2JqW2tdLCBwcmV2RGF0YSwgdGhpcy5wcm9wcy50aGVtZSk7XG4gICAgICAgICAgaWYgKG5vZGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICBjaGlsZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLm5lZWRzQ2hpbGROb2RlcyA9IGZhbHNlO1xuICAgICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gY2hpbGROb2RlcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZWRDaGlsZHJlbjtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBcIm4gSXRlbXNcIiBzdHJpbmcgZm9yIHRoaXMgbm9kZSwgZ2VuZXJhdGluZyBhbmRcbiAgLy8gY2FjaGluZyBpdCBpZiBpdCBoYXNuJ3QgYmVlbiBjcmVhdGVkIHlldC5cblxuICBKU09OT2JqZWN0Tm9kZS5wcm90b3R5cGUuZ2V0SXRlbVN0cmluZyA9IGZ1bmN0aW9uIGdldEl0ZW1TdHJpbmcoKSB7XG4gICAgaWYgKCF0aGlzLml0ZW1TdHJpbmcpIHtcbiAgICAgIHZhciBsZW4gPSBfT2JqZWN0JGtleXModGhpcy5wcm9wcy5kYXRhKS5sZW5ndGg7XG4gICAgICB0aGlzLml0ZW1TdHJpbmcgPSBsZW4gKyAnIGtleScgKyAobGVuICE9PSAxID8gJ3MnIDogJycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pdGVtU3RyaW5nO1xuICB9O1xuXG4gIEpTT05PYmplY3ROb2RlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIGNoaWxkTGlzdFN0eWxlID0ge1xuICAgICAgcGFkZGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIGxpc3RTdHlsZTogJ25vbmUnLFxuICAgICAgZGlzcGxheTogdGhpcy5zdGF0ZS5leHBhbmRlZCA/ICdibG9jaycgOiAnbm9uZSdcbiAgICB9O1xuICAgIHZhciBjb250YWluZXJTdHlsZSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgc3BhblN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlcy5zcGFuLCB7XG4gICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMEJcbiAgICB9KTtcbiAgICBjb250YWluZXJTdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZXMuYmFzZSk7XG4gICAgaWYgKHRoaXMuc3RhdGUuZXhwYW5kZWQpIHtcbiAgICAgIHNwYW5TdHlsZSA9IF9leHRlbmRzKHt9LCBzcGFuU3R5bGUsIHtcbiAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTAzXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2xpJyxcbiAgICAgIHsgc3R5bGU6IGNvbnRhaW5lclN0eWxlIH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTkFycm93MlsnZGVmYXVsdCddLCB7IHRoZW1lOiB0aGlzLnByb3BzLnRoZW1lLCBvcGVuOiB0aGlzLnN0YXRlLmV4cGFuZGVkLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2xhYmVsJyxcbiAgICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5sYWJlbCwge1xuICAgICAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBEXG4gICAgICAgICAgfSksIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgICB0aGlzLnByb3BzLmtleU5hbWUsXG4gICAgICAgICc6J1xuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnc3BhbicsXG4gICAgICAgIHsgc3R5bGU6IHNwYW5TdHlsZSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICdzcGFuJyxcbiAgICAgICAgICB7IHN0eWxlOiBzdHlsZXMuc3BhblR5cGUgfSxcbiAgICAgICAgICAne30nXG4gICAgICAgICksXG4gICAgICAgIHRoaXMuZ2V0SXRlbVN0cmluZygpXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICd1bCcsXG4gICAgICAgIHsgc3R5bGU6IGNoaWxkTGlzdFN0eWxlIH0sXG4gICAgICAgIHRoaXMuZ2V0Q2hpbGROb2RlcygpXG4gICAgICApXG4gICAgKTtcbiAgfTtcblxuICB2YXIgX0pTT05PYmplY3ROb2RlID0gSlNPTk9iamVjdE5vZGU7XG4gIEpTT05PYmplY3ROb2RlID0gX3JlYWN0TWl4aW4yWydkZWZhdWx0J10uZGVjb3JhdGUoX21peGlucy5FeHBhbmRlZFN0YXRlSGFuZGxlck1peGluKShKU09OT2JqZWN0Tm9kZSkgfHwgSlNPTk9iamVjdE5vZGU7XG4gIHJldHVybiBKU09OT2JqZWN0Tm9kZTtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBKU09OT2JqZWN0Tm9kZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG4vLyBjYWNoZSBzdG9yZSBmb3IgdGhlIG51bWJlciBvZiBpdGVtcyBzdHJpbmcgd2UgZGlzcGxheVxuXG4vLyBmbGFnIHRvIHNlZSBpZiB3ZSBzdGlsbCBuZWVkIHRvIHJlbmRlciBvdXIgY2hpbGQgbm9kZXNcblxuLy8gY2FjaGUgc3RvcmUgZm9yIG91ciBjaGlsZCBub2RlcyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbmhlcml0cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cycpWydkZWZhdWx0J107XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3MtY2FsbC1jaGVjaycpWydkZWZhdWx0J107XG5cbnZhciBfZXh0ZW5kcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9leHRlbmRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RNaXhpbiA9IHJlcXVpcmUoJ3JlYWN0LW1peGluJyk7XG5cbnZhciBfcmVhY3RNaXhpbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdE1peGluKTtcblxudmFyIF9taXhpbnMgPSByZXF1aXJlKCcuL21peGlucycpO1xuXG52YXIgX3V0aWxzSGV4VG9SZ2IgPSByZXF1aXJlKCcuL3V0aWxzL2hleFRvUmdiJyk7XG5cbnZhciBfdXRpbHNIZXhUb1JnYjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc0hleFRvUmdiKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYmFzZToge1xuICAgIHBhZGRpbmdUb3A6IDMsXG4gICAgcGFkZGluZ0JvdHRvbTogMyxcbiAgICBwYWRkaW5nUmlnaHQ6IDAsXG4gICAgbWFyZ2luTGVmdDogMTRcbiAgfSxcbiAgbGFiZWw6IHtcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICBtYXJnaW5SaWdodDogNVxuICB9XG59O1xuXG52YXIgSlNPTlN0cmluZ05vZGUgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKEpTT05TdHJpbmdOb2RlLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBKU09OU3RyaW5nTm9kZSgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX0pTT05TdHJpbmdOb2RlKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIEpTT05TdHJpbmdOb2RlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIGJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgaWYgKHRoaXMucHJvcHMucHJldmlvdXNWYWx1ZSAhPT0gdGhpcy5wcm9wcy52YWx1ZSkge1xuICAgICAgdmFyIGJnQ29sb3IgPSBfdXRpbHNIZXhUb1JnYjJbJ2RlZmF1bHQnXSh0aGlzLnByb3BzLnRoZW1lLmJhc2UwNik7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgnICsgYmdDb2xvci5yICsgJywgJyArIGJnQ29sb3IuZyArICcsICcgKyBiZ0NvbG9yLmIgKyAnLCAwLjEpJztcbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2xpJyxcbiAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMuYmFzZSwgeyBiYWNrZ3JvdW5kQ29sb3I6IGJhY2tncm91bmRDb2xvciB9KSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2xhYmVsJyxcbiAgICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5sYWJlbCwge1xuICAgICAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBEXG4gICAgICAgICAgfSkgfSxcbiAgICAgICAgdGhpcy5wcm9wcy5rZXlOYW1lLFxuICAgICAgICAnOidcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ3NwYW4nLFxuICAgICAgICB7IHN0eWxlOiB7IGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwQiB9IH0sXG4gICAgICAgICdcIicsXG4gICAgICAgIHRoaXMucHJvcHMudmFsdWUsXG4gICAgICAgICdcIidcbiAgICAgIClcbiAgICApO1xuICB9O1xuXG4gIHZhciBfSlNPTlN0cmluZ05vZGUgPSBKU09OU3RyaW5nTm9kZTtcbiAgSlNPTlN0cmluZ05vZGUgPSBfcmVhY3RNaXhpbjJbJ2RlZmF1bHQnXS5kZWNvcmF0ZShfbWl4aW5zLlNxdWFzaENsaWNrRXZlbnRNaXhpbikoSlNPTlN0cmluZ05vZGUpIHx8IEpTT05TdHJpbmdOb2RlO1xuICByZXR1cm4gSlNPTlN0cmluZ05vZGU7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gSlNPTlN0cmluZ05vZGU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX29ialR5cGUgPSByZXF1aXJlKCcuL29iai10eXBlJyk7XG5cbnZhciBfb2JqVHlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9vYmpUeXBlKTtcblxudmFyIF9KU09OT2JqZWN0Tm9kZSA9IHJlcXVpcmUoJy4vSlNPTk9iamVjdE5vZGUnKTtcblxudmFyIF9KU09OT2JqZWN0Tm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09OT2JqZWN0Tm9kZSk7XG5cbnZhciBfSlNPTkFycmF5Tm9kZSA9IHJlcXVpcmUoJy4vSlNPTkFycmF5Tm9kZScpO1xuXG52YXIgX0pTT05BcnJheU5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTkFycmF5Tm9kZSk7XG5cbnZhciBfSlNPTkl0ZXJhYmxlTm9kZSA9IHJlcXVpcmUoJy4vSlNPTkl0ZXJhYmxlTm9kZScpO1xuXG52YXIgX0pTT05JdGVyYWJsZU5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTkl0ZXJhYmxlTm9kZSk7XG5cbnZhciBfSlNPTlN0cmluZ05vZGUgPSByZXF1aXJlKCcuL0pTT05TdHJpbmdOb2RlJyk7XG5cbnZhciBfSlNPTlN0cmluZ05vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTlN0cmluZ05vZGUpO1xuXG52YXIgX0pTT05OdW1iZXJOb2RlID0gcmVxdWlyZSgnLi9KU09OTnVtYmVyTm9kZScpO1xuXG52YXIgX0pTT05OdW1iZXJOb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05OdW1iZXJOb2RlKTtcblxudmFyIF9KU09OQm9vbGVhbk5vZGUgPSByZXF1aXJlKCcuL0pTT05Cb29sZWFuTm9kZScpO1xuXG52YXIgX0pTT05Cb29sZWFuTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09OQm9vbGVhbk5vZGUpO1xuXG52YXIgX0pTT05OdWxsTm9kZSA9IHJlcXVpcmUoJy4vSlNPTk51bGxOb2RlJyk7XG5cbnZhciBfSlNPTk51bGxOb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05OdWxsTm9kZSk7XG5cbnZhciBfSlNPTkRhdGVOb2RlID0gcmVxdWlyZSgnLi9KU09ORGF0ZU5vZGUnKTtcblxudmFyIF9KU09ORGF0ZU5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTkRhdGVOb2RlKTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gZnVuY3Rpb24gKGtleSwgdmFsdWUsIHByZXZWYWx1ZSwgdGhlbWUpIHtcbiAgdmFyIGluaXRpYWxFeHBhbmRlZCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gNCB8fCBhcmd1bWVudHNbNF0gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogYXJndW1lbnRzWzRdO1xuXG4gIHZhciBub2RlVHlwZSA9IF9vYmpUeXBlMlsnZGVmYXVsdCddKHZhbHVlKTtcbiAgaWYgKG5vZGVUeXBlID09PSAnT2JqZWN0Jykge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTk9iamVjdE5vZGUyWydkZWZhdWx0J10sIHsgZGF0YTogdmFsdWUsIHByZXZpb3VzRGF0YTogcHJldlZhbHVlLCB0aGVtZTogdGhlbWUsIGluaXRpYWxFeHBhbmRlZDogaW5pdGlhbEV4cGFuZGVkLCBrZXlOYW1lOiBrZXksIGtleToga2V5IH0pO1xuICB9IGVsc2UgaWYgKG5vZGVUeXBlID09PSAnQXJyYXknKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09OQXJyYXlOb2RlMlsnZGVmYXVsdCddLCB7IGRhdGE6IHZhbHVlLCBwcmV2aW91c0RhdGE6IHByZXZWYWx1ZSwgdGhlbWU6IHRoZW1lLCBpbml0aWFsRXhwYW5kZWQ6IGluaXRpYWxFeHBhbmRlZCwga2V5TmFtZToga2V5LCBrZXk6IGtleSB9KTtcbiAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gJ0l0ZXJhYmxlJykge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTkl0ZXJhYmxlTm9kZTJbJ2RlZmF1bHQnXSwgeyBkYXRhOiB2YWx1ZSwgcHJldmlvdXNEYXRhOiBwcmV2VmFsdWUsIHRoZW1lOiB0aGVtZSwgaW5pdGlhbEV4cGFuZGVkOiBpbml0aWFsRXhwYW5kZWQsIGtleU5hbWU6IGtleSwga2V5OiBrZXkgfSk7XG4gIH0gZWxzZSBpZiAobm9kZVR5cGUgPT09ICdTdHJpbmcnKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09OU3RyaW5nTm9kZTJbJ2RlZmF1bHQnXSwgeyBrZXlOYW1lOiBrZXksIHByZXZpb3VzVmFsdWU6IHByZXZWYWx1ZSwgdGhlbWU6IHRoZW1lLCB2YWx1ZTogdmFsdWUsIGtleToga2V5IH0pO1xuICB9IGVsc2UgaWYgKG5vZGVUeXBlID09PSAnTnVtYmVyJykge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTk51bWJlck5vZGUyWydkZWZhdWx0J10sIHsga2V5TmFtZToga2V5LCBwcmV2aW91c1ZhbHVlOiBwcmV2VmFsdWUsIHRoZW1lOiB0aGVtZSwgdmFsdWU6IHZhbHVlLCBrZXk6IGtleSB9KTtcbiAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gJ0Jvb2xlYW4nKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09OQm9vbGVhbk5vZGUyWydkZWZhdWx0J10sIHsga2V5TmFtZToga2V5LCBwcmV2aW91c1ZhbHVlOiBwcmV2VmFsdWUsIHRoZW1lOiB0aGVtZSwgdmFsdWU6IHZhbHVlLCBrZXk6IGtleSB9KTtcbiAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gJ0RhdGUnKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09ORGF0ZU5vZGUyWydkZWZhdWx0J10sIHsga2V5TmFtZToga2V5LCBwcmV2aW91c1ZhbHVlOiBwcmV2VmFsdWUsIHRoZW1lOiB0aGVtZSwgdmFsdWU6IHZhbHVlLCBrZXk6IGtleSB9KTtcbiAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gJ051bGwnKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09OTnVsbE5vZGUyWydkZWZhdWx0J10sIHsga2V5TmFtZToga2V5LCBwcmV2aW91c1ZhbHVlOiBwcmV2VmFsdWUsIHRoZW1lOiB0aGVtZSwgdmFsdWU6IHZhbHVlLCBrZXk6IGtleSB9KTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIvLyBFUzYgKyBpbmxpbmUgc3R5bGUgcG9ydCBvZiBKU09OVmlld2VyIGh0dHBzOi8vYml0YnVja2V0Lm9yZy9kYXZldmVkZGVyL3JlYWN0LWpzb24tdmlld2VyL1xuLy8gYWxsIGNyZWRpdHMgYW5kIG9yaWdpbmFsIGNvZGUgdG8gdGhlIGF1dGhvclxuLy8gRGF2ZSBWZWRkZXIgPHZlZGRlcm1hdGljQGdtYWlsLmNvbT4gaHR0cDovL3d3dy5lc2tpbW9zcHkuY29tL1xuLy8gcG9ydCBieSBEYW5pZWxlIFphbm5vdHRpIGh0dHA6Ly93d3cuZ2l0aHViLmNvbS9kemFubm90dGkgPGR6YW5ub3R0aUBtZS5jb20+XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9pbmhlcml0cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cycpWydkZWZhdWx0J107XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY3JlYXRlLWNsYXNzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrJylbJ2RlZmF1bHQnXTtcblxudmFyIF9leHRlbmRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9ncmFiTm9kZSA9IHJlcXVpcmUoJy4vZ3JhYi1ub2RlJyk7XG5cbnZhciBfZ3JhYk5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ3JhYk5vZGUpO1xuXG52YXIgX3RoZW1lc1NvbGFyaXplZCA9IHJlcXVpcmUoJy4vdGhlbWVzL3NvbGFyaXplZCcpO1xuXG52YXIgX3RoZW1lc1NvbGFyaXplZDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF90aGVtZXNTb2xhcml6ZWQpO1xuXG52YXIgc3R5bGVzID0ge1xuICB0cmVlOiB7XG4gICAgYm9yZGVyOiAwLFxuICAgIHBhZGRpbmc6IDAsXG4gICAgbWFyZ2luVG9wOiA4LFxuICAgIG1hcmdpbkJvdHRvbTogOCxcbiAgICBtYXJnaW5MZWZ0OiAyLFxuICAgIG1hcmdpblJpZ2h0OiAwLFxuICAgIGZvbnRTaXplOiAnMC45MGVtJyxcbiAgICBsaXN0U3R5bGU6ICdub25lJyxcbiAgICBNb3pVc2VyU2VsZWN0OiAnbm9uZScsXG4gICAgV2Via2l0VXNlclNlbGVjdDogJ25vbmUnXG4gIH1cbn07XG5cbnZhciBKU09OVHJlZSA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoSlNPTlRyZWUsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIF9jcmVhdGVDbGFzcyhKU09OVHJlZSwgbnVsbCwgW3tcbiAgICBrZXk6ICdwcm9wVHlwZXMnLFxuICAgIHZhbHVlOiB7XG4gICAgICBkYXRhOiBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9uZU9mVHlwZShbX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5hcnJheSwgX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5vYmplY3RdKS5pc1JlcXVpcmVkXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH0sIHtcbiAgICBrZXk6ICdkZWZhdWx0UHJvcHMnLFxuICAgIHZhbHVlOiB7XG4gICAgICB0aGVtZTogX3RoZW1lc1NvbGFyaXplZDJbJ2RlZmF1bHQnXVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9XSk7XG5cbiAgZnVuY3Rpb24gSlNPTlRyZWUocHJvcHMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSlNPTlRyZWUpO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5jYWxsKHRoaXMsIHByb3BzKTtcbiAgfVxuXG4gIEpTT05UcmVlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIGtleU5hbWUgPSB0aGlzLnByb3BzLmtleU5hbWUgfHwgJ3Jvb3QnO1xuICAgIHZhciByb290Tm9kZSA9IF9ncmFiTm9kZTJbJ2RlZmF1bHQnXShrZXlOYW1lLCB0aGlzLnByb3BzLmRhdGEsIHRoaXMucHJvcHMucHJldmlvdXNEYXRhLCB0aGlzLnByb3BzLnRoZW1lLCB0cnVlKTtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAndWwnLFxuICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy50cmVlLCB0aGlzLnByb3BzLnN0eWxlKSB9LFxuICAgICAgcm9vdE5vZGVcbiAgICApO1xuICB9O1xuXG4gIHJldHVybiBKU09OVHJlZTtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBKU09OVHJlZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB7XG4gIGhhbmRsZUNsaWNrOiBmdW5jdGlvbiBoYW5kbGVDbGljayhlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGV4cGFuZGVkOiAhdGhpcy5zdGF0ZS5leHBhbmRlZFxuICAgIH0pO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMoKSB7XG4gICAgLy8gcmVzZXRzIG91ciBjYWNoZXMgYW5kIGZsYWdzIHdlIG5lZWQgdG8gYnVpbGQgY2hpbGQgbm9kZXMgYWdhaW5cbiAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBbXTtcbiAgICB0aGlzLml0ZW1TdHJpbmcgPSBmYWxzZTtcbiAgICB0aGlzLm5lZWRzQ2hpbGROb2RlcyA9IHRydWU7XG4gIH1cbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbnRlcm9wUmVxdWlyZSA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3NxdWFzaENsaWNrRXZlbnQgPSByZXF1aXJlKCcuL3NxdWFzaC1jbGljay1ldmVudCcpO1xuXG5leHBvcnRzLlNxdWFzaENsaWNrRXZlbnRNaXhpbiA9IF9pbnRlcm9wUmVxdWlyZShfc3F1YXNoQ2xpY2tFdmVudCk7XG5cbnZhciBfZXhwYW5kZWRTdGF0ZUhhbmRsZXIgPSByZXF1aXJlKCcuL2V4cGFuZGVkLXN0YXRlLWhhbmRsZXInKTtcblxuZXhwb3J0cy5FeHBhbmRlZFN0YXRlSGFuZGxlck1peGluID0gX2ludGVyb3BSZXF1aXJlKF9leHBhbmRlZFN0YXRlSGFuZGxlcik7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHtcbiAgaGFuZGxlQ2xpY2s6IGZ1bmN0aW9uIGhhbmRsZUNsaWNrKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzW1wiZGVmYXVsdFwiXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfU3ltYm9sJGl0ZXJhdG9yID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9jb3JlLWpzL3N5bWJvbC9pdGVyYXRvcicpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgaWYgKG9iaiAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheShvYmopICYmIHR5cGVvZiBvYmpbX1N5bWJvbCRpdGVyYXRvcl0gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gJ0l0ZXJhYmxlJztcbiAgfVxuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikuc2xpY2UoOCwgLTEpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gKGhleCkge1xuICB2YXIgcmVzdWx0ID0gL14jPyhbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KSQvaS5leGVjKGhleCk7XG4gIHJldHVybiByZXN1bHQgPyB7XG4gICAgcjogcGFyc2VJbnQocmVzdWx0WzFdLCAxNiksXG4gICAgZzogcGFyc2VJbnQocmVzdWx0WzJdLCAxNiksXG4gICAgYjogcGFyc2VJbnQocmVzdWx0WzNdLCAxNilcbiAgfSA6IG51bGw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9nZXQtaXRlcmF0b3JcIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vbnVtYmVyL2lzLXNhZmUtaW50ZWdlclwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvYXNzaWduXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9jcmVhdGVcIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2RlZmluZS1wcm9wZXJ0eVwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3Qva2V5c1wiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZlwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9zeW1ib2wvaXRlcmF0b3JcIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAoaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7XG4gIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTtcbiAgfVxufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9PYmplY3QkZGVmaW5lUHJvcGVydHkgPSByZXF1aXJlKFwiYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9kZWZpbmUtcHJvcGVydHlcIilbXCJkZWZhdWx0XCJdO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07XG4gICAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7XG4gICAgICBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7XG4gICAgICBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlO1xuXG4gICAgICBfT2JqZWN0JGRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTtcbiAgICBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTtcbiAgICByZXR1cm4gQ29uc3RydWN0b3I7XG4gIH07XG59KSgpO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX09iamVjdCRhc3NpZ24gPSByZXF1aXJlKFwiYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9hc3NpZ25cIilbXCJkZWZhdWx0XCJdO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IF9PYmplY3QkYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldO1xuXG4gICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHtcbiAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9PYmplY3QkY3JlYXRlID0gcmVxdWlyZShcImJhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3QvY3JlYXRlXCIpW1wiZGVmYXVsdFwiXTtcblxudmFyIF9PYmplY3Qkc2V0UHJvdG90eXBlT2YgPSByZXF1aXJlKFwiYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9zZXQtcHJvdG90eXBlLW9mXCIpW1wiZGVmYXVsdFwiXTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHtcbiAgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90IFwiICsgdHlwZW9mIHN1cGVyQ2xhc3MpO1xuICB9XG5cbiAgc3ViQ2xhc3MucHJvdG90eXBlID0gX09iamVjdCRjcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICB2YWx1ZTogc3ViQ2xhc3MsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfVxuICB9KTtcbiAgaWYgKHN1cGVyQ2xhc3MpIF9PYmplY3Qkc2V0UHJvdG90eXBlT2YgPyBfT2JqZWN0JHNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7XG59O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHtcbiAgICBcImRlZmF1bHRcIjogb2JqXG4gIH07XG59O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9ialtcImRlZmF1bHRcIl0gOiBvYmo7XG59O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsInJlcXVpcmUoJy4uL21vZHVsZXMvd2ViLmRvbS5pdGVyYWJsZScpO1xucmVxdWlyZSgnLi4vbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uL21vZHVsZXMvY29yZS5nZXQtaXRlcmF0b3InKTsiLCJyZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5udW1iZXIuaXMtc2FmZS1pbnRlZ2VyJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJC5jb3JlJykuTnVtYmVyLmlzU2FmZUludGVnZXI7IiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYub2JqZWN0LmFzc2lnbicpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzLyQuY29yZScpLk9iamVjdC5hc3NpZ247IiwidmFyICQgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzLyQnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlKFAsIEQpe1xuICByZXR1cm4gJC5jcmVhdGUoUCwgRCk7XG59OyIsInZhciAkID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZmluZVByb3BlcnR5KGl0LCBrZXksIGRlc2Mpe1xuICByZXR1cm4gJC5zZXREZXNjKGl0LCBrZXksIGRlc2MpO1xufTsiLCJyZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5vYmplY3Qua2V5cycpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzLyQuY29yZScpLk9iamVjdC5rZXlzOyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2Lm9iamVjdC5zZXQtcHJvdG90eXBlLW9mJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJC5jb3JlJykuT2JqZWN0LnNldFByb3RvdHlwZU9mOyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2LnN0cmluZy5pdGVyYXRvcicpO1xucmVxdWlyZSgnLi4vLi4vbW9kdWxlcy93ZWIuZG9tLml0ZXJhYmxlJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJC53a3MnKSgnaXRlcmF0b3InKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgaWYodHlwZW9mIGl0ICE9ICdmdW5jdGlvbicpdGhyb3cgVHlwZUVycm9yKGl0ICsgJyBpcyBub3QgYSBmdW5jdGlvbiEnKTtcbiAgcmV0dXJuIGl0O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7IC8qIGVtcHR5ICovIH07IiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi8kLmlzLW9iamVjdCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIGlmKCFpc09iamVjdChpdCkpdGhyb3cgVHlwZUVycm9yKGl0ICsgJyBpcyBub3QgYW4gb2JqZWN0IScpO1xuICByZXR1cm4gaXQ7XG59OyIsIi8vIGdldHRpbmcgdGFnIGZyb20gMTkuMS4zLjYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZygpXG52YXIgY29mID0gcmVxdWlyZSgnLi8kLmNvZicpXG4gICwgVEFHID0gcmVxdWlyZSgnLi8kLndrcycpKCd0b1N0cmluZ1RhZycpXG4gIC8vIEVTMyB3cm9uZyBoZXJlXG4gICwgQVJHID0gY29mKGZ1bmN0aW9uKCl7IHJldHVybiBhcmd1bWVudHM7IH0oKSkgPT0gJ0FyZ3VtZW50cyc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICB2YXIgTywgVCwgQjtcbiAgcmV0dXJuIGl0ID09PSB1bmRlZmluZWQgPyAnVW5kZWZpbmVkJyA6IGl0ID09PSBudWxsID8gJ051bGwnXG4gICAgLy8gQEB0b1N0cmluZ1RhZyBjYXNlXG4gICAgOiB0eXBlb2YgKFQgPSAoTyA9IE9iamVjdChpdCkpW1RBR10pID09ICdzdHJpbmcnID8gVFxuICAgIC8vIGJ1aWx0aW5UYWcgY2FzZVxuICAgIDogQVJHID8gY29mKE8pXG4gICAgLy8gRVMzIGFyZ3VtZW50cyBmYWxsYmFja1xuICAgIDogKEIgPSBjb2YoTykpID09ICdPYmplY3QnICYmIHR5cGVvZiBPLmNhbGxlZSA9PSAnZnVuY3Rpb24nID8gJ0FyZ3VtZW50cycgOiBCO1xufTsiLCJ2YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKGl0KS5zbGljZSg4LCAtMSk7XG59OyIsInZhciBjb3JlID0gbW9kdWxlLmV4cG9ydHMgPSB7dmVyc2lvbjogJzEuMi42J307XG5pZih0eXBlb2YgX19lID09ICdudW1iZXInKV9fZSA9IGNvcmU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWYiLCIvLyBvcHRpb25hbCAvIHNpbXBsZSBjb250ZXh0IGJpbmRpbmdcbnZhciBhRnVuY3Rpb24gPSByZXF1aXJlKCcuLyQuYS1mdW5jdGlvbicpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihmbiwgdGhhdCwgbGVuZ3RoKXtcbiAgYUZ1bmN0aW9uKGZuKTtcbiAgaWYodGhhdCA9PT0gdW5kZWZpbmVkKXJldHVybiBmbjtcbiAgc3dpdGNoKGxlbmd0aCl7XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24oYSl7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhKTtcbiAgICB9O1xuICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSwgYik7XG4gICAgfTtcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbihhLCBiLCBjKXtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoYXQsIGEsIGIsIGMpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKC8qIC4uLmFyZ3MgKi8pe1xuICAgIHJldHVybiBmbi5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xuICB9O1xufTsiLCIvLyA3LjIuMSBSZXF1aXJlT2JqZWN0Q29lcmNpYmxlKGFyZ3VtZW50KVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIGlmKGl0ID09IHVuZGVmaW5lZCl0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBjYWxsIG1ldGhvZCBvbiAgXCIgKyBpdCk7XG4gIHJldHVybiBpdDtcbn07IiwiLy8gVGhhbmsncyBJRTggZm9yIGhpcyBmdW5ueSBkZWZpbmVQcm9wZXJ0eVxubW9kdWxlLmV4cG9ydHMgPSAhcmVxdWlyZSgnLi8kLmZhaWxzJykoZnVuY3Rpb24oKXtcbiAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh7fSwgJ2EnLCB7Z2V0OiBmdW5jdGlvbigpeyByZXR1cm4gNzsgfX0pLmEgIT0gNztcbn0pOyIsInZhciBnbG9iYWwgICAgPSByZXF1aXJlKCcuLyQuZ2xvYmFsJylcbiAgLCBjb3JlICAgICAgPSByZXF1aXJlKCcuLyQuY29yZScpXG4gICwgY3R4ICAgICAgID0gcmVxdWlyZSgnLi8kLmN0eCcpXG4gICwgUFJPVE9UWVBFID0gJ3Byb3RvdHlwZSc7XG5cbnZhciAkZXhwb3J0ID0gZnVuY3Rpb24odHlwZSwgbmFtZSwgc291cmNlKXtcbiAgdmFyIElTX0ZPUkNFRCA9IHR5cGUgJiAkZXhwb3J0LkZcbiAgICAsIElTX0dMT0JBTCA9IHR5cGUgJiAkZXhwb3J0LkdcbiAgICAsIElTX1NUQVRJQyA9IHR5cGUgJiAkZXhwb3J0LlNcbiAgICAsIElTX1BST1RPICA9IHR5cGUgJiAkZXhwb3J0LlBcbiAgICAsIElTX0JJTkQgICA9IHR5cGUgJiAkZXhwb3J0LkJcbiAgICAsIElTX1dSQVAgICA9IHR5cGUgJiAkZXhwb3J0LldcbiAgICAsIGV4cG9ydHMgICA9IElTX0dMT0JBTCA/IGNvcmUgOiBjb3JlW25hbWVdIHx8IChjb3JlW25hbWVdID0ge30pXG4gICAgLCB0YXJnZXQgICAgPSBJU19HTE9CQUwgPyBnbG9iYWwgOiBJU19TVEFUSUMgPyBnbG9iYWxbbmFtZV0gOiAoZ2xvYmFsW25hbWVdIHx8IHt9KVtQUk9UT1RZUEVdXG4gICAgLCBrZXksIG93biwgb3V0O1xuICBpZihJU19HTE9CQUwpc291cmNlID0gbmFtZTtcbiAgZm9yKGtleSBpbiBzb3VyY2Upe1xuICAgIC8vIGNvbnRhaW5zIGluIG5hdGl2ZVxuICAgIG93biA9ICFJU19GT1JDRUQgJiYgdGFyZ2V0ICYmIGtleSBpbiB0YXJnZXQ7XG4gICAgaWYob3duICYmIGtleSBpbiBleHBvcnRzKWNvbnRpbnVlO1xuICAgIC8vIGV4cG9ydCBuYXRpdmUgb3IgcGFzc2VkXG4gICAgb3V0ID0gb3duID8gdGFyZ2V0W2tleV0gOiBzb3VyY2Vba2V5XTtcbiAgICAvLyBwcmV2ZW50IGdsb2JhbCBwb2xsdXRpb24gZm9yIG5hbWVzcGFjZXNcbiAgICBleHBvcnRzW2tleV0gPSBJU19HTE9CQUwgJiYgdHlwZW9mIHRhcmdldFtrZXldICE9ICdmdW5jdGlvbicgPyBzb3VyY2Vba2V5XVxuICAgIC8vIGJpbmQgdGltZXJzIHRvIGdsb2JhbCBmb3IgY2FsbCBmcm9tIGV4cG9ydCBjb250ZXh0XG4gICAgOiBJU19CSU5EICYmIG93biA/IGN0eChvdXQsIGdsb2JhbClcbiAgICAvLyB3cmFwIGdsb2JhbCBjb25zdHJ1Y3RvcnMgZm9yIHByZXZlbnQgY2hhbmdlIHRoZW0gaW4gbGlicmFyeVxuICAgIDogSVNfV1JBUCAmJiB0YXJnZXRba2V5XSA9PSBvdXQgPyAoZnVuY3Rpb24oQyl7XG4gICAgICB2YXIgRiA9IGZ1bmN0aW9uKHBhcmFtKXtcbiAgICAgICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBDID8gbmV3IEMocGFyYW0pIDogQyhwYXJhbSk7XG4gICAgICB9O1xuICAgICAgRltQUk9UT1RZUEVdID0gQ1tQUk9UT1RZUEVdO1xuICAgICAgcmV0dXJuIEY7XG4gICAgLy8gbWFrZSBzdGF0aWMgdmVyc2lvbnMgZm9yIHByb3RvdHlwZSBtZXRob2RzXG4gICAgfSkob3V0KSA6IElTX1BST1RPICYmIHR5cGVvZiBvdXQgPT0gJ2Z1bmN0aW9uJyA/IGN0eChGdW5jdGlvbi5jYWxsLCBvdXQpIDogb3V0O1xuICAgIGlmKElTX1BST1RPKShleHBvcnRzW1BST1RPVFlQRV0gfHwgKGV4cG9ydHNbUFJPVE9UWVBFXSA9IHt9KSlba2V5XSA9IG91dDtcbiAgfVxufTtcbi8vIHR5cGUgYml0bWFwXG4kZXhwb3J0LkYgPSAxOyAgLy8gZm9yY2VkXG4kZXhwb3J0LkcgPSAyOyAgLy8gZ2xvYmFsXG4kZXhwb3J0LlMgPSA0OyAgLy8gc3RhdGljXG4kZXhwb3J0LlAgPSA4OyAgLy8gcHJvdG9cbiRleHBvcnQuQiA9IDE2OyAvLyBiaW5kXG4kZXhwb3J0LlcgPSAzMjsgLy8gd3JhcFxubW9kdWxlLmV4cG9ydHMgPSAkZXhwb3J0OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZXhlYyl7XG4gIHRyeSB7XG4gICAgcmV0dXJuICEhZXhlYygpO1xuICB9IGNhdGNoKGUpe1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59OyIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS96bG9pcm9jay9jb3JlLWpzL2lzc3Vlcy84NiNpc3N1ZWNvbW1lbnQtMTE1NzU5MDI4XG52YXIgZ2xvYmFsID0gbW9kdWxlLmV4cG9ydHMgPSB0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnICYmIHdpbmRvdy5NYXRoID09IE1hdGhcbiAgPyB3aW5kb3cgOiB0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJyAmJiBzZWxmLk1hdGggPT0gTWF0aCA/IHNlbGYgOiBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuaWYodHlwZW9mIF9fZyA9PSAnbnVtYmVyJylfX2cgPSBnbG9iYWw7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWYiLCJ2YXIgaGFzT3duUHJvcGVydHkgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQsIGtleSl7XG4gIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKGl0LCBrZXkpO1xufTsiLCJ2YXIgJCAgICAgICAgICA9IHJlcXVpcmUoJy4vJCcpXG4gICwgY3JlYXRlRGVzYyA9IHJlcXVpcmUoJy4vJC5wcm9wZXJ0eS1kZXNjJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vJC5kZXNjcmlwdG9ycycpID8gZnVuY3Rpb24ob2JqZWN0LCBrZXksIHZhbHVlKXtcbiAgcmV0dXJuICQuc2V0RGVzYyhvYmplY3QsIGtleSwgY3JlYXRlRGVzYygxLCB2YWx1ZSkpO1xufSA6IGZ1bmN0aW9uKG9iamVjdCwga2V5LCB2YWx1ZSl7XG4gIG9iamVjdFtrZXldID0gdmFsdWU7XG4gIHJldHVybiBvYmplY3Q7XG59OyIsIi8vIGZhbGxiYWNrIGZvciBub24tYXJyYXktbGlrZSBFUzMgYW5kIG5vbi1lbnVtZXJhYmxlIG9sZCBWOCBzdHJpbmdzXG52YXIgY29mID0gcmVxdWlyZSgnLi8kLmNvZicpO1xubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QoJ3onKS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgwKSA/IE9iamVjdCA6IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIGNvZihpdCkgPT0gJ1N0cmluZycgPyBpdC5zcGxpdCgnJykgOiBPYmplY3QoaXQpO1xufTsiLCIvLyAyMC4xLjIuMyBOdW1iZXIuaXNJbnRlZ2VyKG51bWJlcilcbnZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vJC5pcy1vYmplY3QnKVxuICAsIGZsb29yICAgID0gTWF0aC5mbG9vcjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNJbnRlZ2VyKGl0KXtcbiAgcmV0dXJuICFpc09iamVjdChpdCkgJiYgaXNGaW5pdGUoaXQpICYmIGZsb29yKGl0KSA9PT0gaXQ7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICByZXR1cm4gdHlwZW9mIGl0ID09PSAnb2JqZWN0JyA/IGl0ICE9PSBudWxsIDogdHlwZW9mIGl0ID09PSAnZnVuY3Rpb24nO1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgJCAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLyQnKVxuICAsIGRlc2NyaXB0b3IgICAgID0gcmVxdWlyZSgnLi8kLnByb3BlcnR5LWRlc2MnKVxuICAsIHNldFRvU3RyaW5nVGFnID0gcmVxdWlyZSgnLi8kLnNldC10by1zdHJpbmctdGFnJylcbiAgLCBJdGVyYXRvclByb3RvdHlwZSA9IHt9O1xuXG4vLyAyNS4xLjIuMS4xICVJdGVyYXRvclByb3RvdHlwZSVbQEBpdGVyYXRvcl0oKVxucmVxdWlyZSgnLi8kLmhpZGUnKShJdGVyYXRvclByb3RvdHlwZSwgcmVxdWlyZSgnLi8kLndrcycpKCdpdGVyYXRvcicpLCBmdW5jdGlvbigpeyByZXR1cm4gdGhpczsgfSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oQ29uc3RydWN0b3IsIE5BTUUsIG5leHQpe1xuICBDb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSAkLmNyZWF0ZShJdGVyYXRvclByb3RvdHlwZSwge25leHQ6IGRlc2NyaXB0b3IoMSwgbmV4dCl9KTtcbiAgc2V0VG9TdHJpbmdUYWcoQ29uc3RydWN0b3IsIE5BTUUgKyAnIEl0ZXJhdG9yJyk7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBMSUJSQVJZICAgICAgICA9IHJlcXVpcmUoJy4vJC5saWJyYXJ5JylcbiAgLCAkZXhwb3J0ICAgICAgICA9IHJlcXVpcmUoJy4vJC5leHBvcnQnKVxuICAsIHJlZGVmaW5lICAgICAgID0gcmVxdWlyZSgnLi8kLnJlZGVmaW5lJylcbiAgLCBoaWRlICAgICAgICAgICA9IHJlcXVpcmUoJy4vJC5oaWRlJylcbiAgLCBoYXMgICAgICAgICAgICA9IHJlcXVpcmUoJy4vJC5oYXMnKVxuICAsIEl0ZXJhdG9ycyAgICAgID0gcmVxdWlyZSgnLi8kLml0ZXJhdG9ycycpXG4gICwgJGl0ZXJDcmVhdGUgICAgPSByZXF1aXJlKCcuLyQuaXRlci1jcmVhdGUnKVxuICAsIHNldFRvU3RyaW5nVGFnID0gcmVxdWlyZSgnLi8kLnNldC10by1zdHJpbmctdGFnJylcbiAgLCBnZXRQcm90byAgICAgICA9IHJlcXVpcmUoJy4vJCcpLmdldFByb3RvXG4gICwgSVRFUkFUT1IgICAgICAgPSByZXF1aXJlKCcuLyQud2tzJykoJ2l0ZXJhdG9yJylcbiAgLCBCVUdHWSAgICAgICAgICA9ICEoW10ua2V5cyAmJiAnbmV4dCcgaW4gW10ua2V5cygpKSAvLyBTYWZhcmkgaGFzIGJ1Z2d5IGl0ZXJhdG9ycyB3L28gYG5leHRgXG4gICwgRkZfSVRFUkFUT1IgICAgPSAnQEBpdGVyYXRvcidcbiAgLCBLRVlTICAgICAgICAgICA9ICdrZXlzJ1xuICAsIFZBTFVFUyAgICAgICAgID0gJ3ZhbHVlcyc7XG5cbnZhciByZXR1cm5UaGlzID0gZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXM7IH07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oQmFzZSwgTkFNRSwgQ29uc3RydWN0b3IsIG5leHQsIERFRkFVTFQsIElTX1NFVCwgRk9SQ0VEKXtcbiAgJGl0ZXJDcmVhdGUoQ29uc3RydWN0b3IsIE5BTUUsIG5leHQpO1xuICB2YXIgZ2V0TWV0aG9kID0gZnVuY3Rpb24oa2luZCl7XG4gICAgaWYoIUJVR0dZICYmIGtpbmQgaW4gcHJvdG8pcmV0dXJuIHByb3RvW2tpbmRdO1xuICAgIHN3aXRjaChraW5kKXtcbiAgICAgIGNhc2UgS0VZUzogcmV0dXJuIGZ1bmN0aW9uIGtleXMoKXsgcmV0dXJuIG5ldyBDb25zdHJ1Y3Rvcih0aGlzLCBraW5kKTsgfTtcbiAgICAgIGNhc2UgVkFMVUVTOiByZXR1cm4gZnVuY3Rpb24gdmFsdWVzKCl7IHJldHVybiBuZXcgQ29uc3RydWN0b3IodGhpcywga2luZCk7IH07XG4gICAgfSByZXR1cm4gZnVuY3Rpb24gZW50cmllcygpeyByZXR1cm4gbmV3IENvbnN0cnVjdG9yKHRoaXMsIGtpbmQpOyB9O1xuICB9O1xuICB2YXIgVEFHICAgICAgICA9IE5BTUUgKyAnIEl0ZXJhdG9yJ1xuICAgICwgREVGX1ZBTFVFUyA9IERFRkFVTFQgPT0gVkFMVUVTXG4gICAgLCBWQUxVRVNfQlVHID0gZmFsc2VcbiAgICAsIHByb3RvICAgICAgPSBCYXNlLnByb3RvdHlwZVxuICAgICwgJG5hdGl2ZSAgICA9IHByb3RvW0lURVJBVE9SXSB8fCBwcm90b1tGRl9JVEVSQVRPUl0gfHwgREVGQVVMVCAmJiBwcm90b1tERUZBVUxUXVxuICAgICwgJGRlZmF1bHQgICA9ICRuYXRpdmUgfHwgZ2V0TWV0aG9kKERFRkFVTFQpXG4gICAgLCBtZXRob2RzLCBrZXk7XG4gIC8vIEZpeCBuYXRpdmVcbiAgaWYoJG5hdGl2ZSl7XG4gICAgdmFyIEl0ZXJhdG9yUHJvdG90eXBlID0gZ2V0UHJvdG8oJGRlZmF1bHQuY2FsbChuZXcgQmFzZSkpO1xuICAgIC8vIFNldCBAQHRvU3RyaW5nVGFnIHRvIG5hdGl2ZSBpdGVyYXRvcnNcbiAgICBzZXRUb1N0cmluZ1RhZyhJdGVyYXRvclByb3RvdHlwZSwgVEFHLCB0cnVlKTtcbiAgICAvLyBGRiBmaXhcbiAgICBpZighTElCUkFSWSAmJiBoYXMocHJvdG8sIEZGX0lURVJBVE9SKSloaWRlKEl0ZXJhdG9yUHJvdG90eXBlLCBJVEVSQVRPUiwgcmV0dXJuVGhpcyk7XG4gICAgLy8gZml4IEFycmF5I3t2YWx1ZXMsIEBAaXRlcmF0b3J9Lm5hbWUgaW4gVjggLyBGRlxuICAgIGlmKERFRl9WQUxVRVMgJiYgJG5hdGl2ZS5uYW1lICE9PSBWQUxVRVMpe1xuICAgICAgVkFMVUVTX0JVRyA9IHRydWU7XG4gICAgICAkZGVmYXVsdCA9IGZ1bmN0aW9uIHZhbHVlcygpeyByZXR1cm4gJG5hdGl2ZS5jYWxsKHRoaXMpOyB9O1xuICAgIH1cbiAgfVxuICAvLyBEZWZpbmUgaXRlcmF0b3JcbiAgaWYoKCFMSUJSQVJZIHx8IEZPUkNFRCkgJiYgKEJVR0dZIHx8IFZBTFVFU19CVUcgfHwgIXByb3RvW0lURVJBVE9SXSkpe1xuICAgIGhpZGUocHJvdG8sIElURVJBVE9SLCAkZGVmYXVsdCk7XG4gIH1cbiAgLy8gUGx1ZyBmb3IgbGlicmFyeVxuICBJdGVyYXRvcnNbTkFNRV0gPSAkZGVmYXVsdDtcbiAgSXRlcmF0b3JzW1RBR10gID0gcmV0dXJuVGhpcztcbiAgaWYoREVGQVVMVCl7XG4gICAgbWV0aG9kcyA9IHtcbiAgICAgIHZhbHVlczogIERFRl9WQUxVRVMgID8gJGRlZmF1bHQgOiBnZXRNZXRob2QoVkFMVUVTKSxcbiAgICAgIGtleXM6ICAgIElTX1NFVCAgICAgID8gJGRlZmF1bHQgOiBnZXRNZXRob2QoS0VZUyksXG4gICAgICBlbnRyaWVzOiAhREVGX1ZBTFVFUyA/ICRkZWZhdWx0IDogZ2V0TWV0aG9kKCdlbnRyaWVzJylcbiAgICB9O1xuICAgIGlmKEZPUkNFRClmb3Ioa2V5IGluIG1ldGhvZHMpe1xuICAgICAgaWYoIShrZXkgaW4gcHJvdG8pKXJlZGVmaW5lKHByb3RvLCBrZXksIG1ldGhvZHNba2V5XSk7XG4gICAgfSBlbHNlICRleHBvcnQoJGV4cG9ydC5QICsgJGV4cG9ydC5GICogKEJVR0dZIHx8IFZBTFVFU19CVUcpLCBOQU1FLCBtZXRob2RzKTtcbiAgfVxuICByZXR1cm4gbWV0aG9kcztcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkb25lLCB2YWx1ZSl7XG4gIHJldHVybiB7dmFsdWU6IHZhbHVlLCBkb25lOiAhIWRvbmV9O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHt9OyIsInZhciAkT2JqZWN0ID0gT2JqZWN0O1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNyZWF0ZTogICAgICRPYmplY3QuY3JlYXRlLFxuICBnZXRQcm90bzogICAkT2JqZWN0LmdldFByb3RvdHlwZU9mLFxuICBpc0VudW06ICAgICB7fS5wcm9wZXJ0eUlzRW51bWVyYWJsZSxcbiAgZ2V0RGVzYzogICAgJE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gIHNldERlc2M6ICAgICRPYmplY3QuZGVmaW5lUHJvcGVydHksXG4gIHNldERlc2NzOiAgICRPYmplY3QuZGVmaW5lUHJvcGVydGllcyxcbiAgZ2V0S2V5czogICAgJE9iamVjdC5rZXlzLFxuICBnZXROYW1lczogICAkT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMsXG4gIGdldFN5bWJvbHM6ICRPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzLFxuICBlYWNoOiAgICAgICBbXS5mb3JFYWNoXG59OyIsIm1vZHVsZS5leHBvcnRzID0gdHJ1ZTsiLCIvLyAxOS4xLjIuMSBPYmplY3QuYXNzaWduKHRhcmdldCwgc291cmNlLCAuLi4pXG52YXIgJCAgICAgICAgPSByZXF1aXJlKCcuLyQnKVxuICAsIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi8kLnRvLW9iamVjdCcpXG4gICwgSU9iamVjdCAgPSByZXF1aXJlKCcuLyQuaW9iamVjdCcpO1xuXG4vLyBzaG91bGQgd29yayB3aXRoIHN5bWJvbHMgYW5kIHNob3VsZCBoYXZlIGRldGVybWluaXN0aWMgcHJvcGVydHkgb3JkZXIgKFY4IGJ1Zylcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi8kLmZhaWxzJykoZnVuY3Rpb24oKXtcbiAgdmFyIGEgPSBPYmplY3QuYXNzaWduXG4gICAgLCBBID0ge31cbiAgICAsIEIgPSB7fVxuICAgICwgUyA9IFN5bWJvbCgpXG4gICAgLCBLID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0JztcbiAgQVtTXSA9IDc7XG4gIEsuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24oayl7IEJba10gPSBrOyB9KTtcbiAgcmV0dXJuIGEoe30sIEEpW1NdICE9IDcgfHwgT2JqZWN0LmtleXMoYSh7fSwgQikpLmpvaW4oJycpICE9IEs7XG59KSA/IGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQsIHNvdXJjZSl7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgdmFyIFQgICAgID0gdG9PYmplY3QodGFyZ2V0KVxuICAgICwgJCQgICAgPSBhcmd1bWVudHNcbiAgICAsICQkbGVuID0gJCQubGVuZ3RoXG4gICAgLCBpbmRleCA9IDFcbiAgICAsIGdldEtleXMgICAgPSAkLmdldEtleXNcbiAgICAsIGdldFN5bWJvbHMgPSAkLmdldFN5bWJvbHNcbiAgICAsIGlzRW51bSAgICAgPSAkLmlzRW51bTtcbiAgd2hpbGUoJCRsZW4gPiBpbmRleCl7XG4gICAgdmFyIFMgICAgICA9IElPYmplY3QoJCRbaW5kZXgrK10pXG4gICAgICAsIGtleXMgICA9IGdldFN5bWJvbHMgPyBnZXRLZXlzKFMpLmNvbmNhdChnZXRTeW1ib2xzKFMpKSA6IGdldEtleXMoUylcbiAgICAgICwgbGVuZ3RoID0ga2V5cy5sZW5ndGhcbiAgICAgICwgaiAgICAgID0gMFxuICAgICAgLCBrZXk7XG4gICAgd2hpbGUobGVuZ3RoID4gailpZihpc0VudW0uY2FsbChTLCBrZXkgPSBrZXlzW2orK10pKVRba2V5XSA9IFNba2V5XTtcbiAgfVxuICByZXR1cm4gVDtcbn0gOiBPYmplY3QuYXNzaWduOyIsIi8vIG1vc3QgT2JqZWN0IG1ldGhvZHMgYnkgRVM2IHNob3VsZCBhY2NlcHQgcHJpbWl0aXZlc1xudmFyICRleHBvcnQgPSByZXF1aXJlKCcuLyQuZXhwb3J0JylcbiAgLCBjb3JlICAgID0gcmVxdWlyZSgnLi8kLmNvcmUnKVxuICAsIGZhaWxzICAgPSByZXF1aXJlKCcuLyQuZmFpbHMnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oS0VZLCBleGVjKXtcbiAgdmFyIGZuICA9IChjb3JlLk9iamVjdCB8fCB7fSlbS0VZXSB8fCBPYmplY3RbS0VZXVxuICAgICwgZXhwID0ge307XG4gIGV4cFtLRVldID0gZXhlYyhmbik7XG4gICRleHBvcnQoJGV4cG9ydC5TICsgJGV4cG9ydC5GICogZmFpbHMoZnVuY3Rpb24oKXsgZm4oMSk7IH0pLCAnT2JqZWN0JywgZXhwKTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihiaXRtYXAsIHZhbHVlKXtcbiAgcmV0dXJuIHtcbiAgICBlbnVtZXJhYmxlICA6ICEoYml0bWFwICYgMSksXG4gICAgY29uZmlndXJhYmxlOiAhKGJpdG1hcCAmIDIpLFxuICAgIHdyaXRhYmxlICAgIDogIShiaXRtYXAgJiA0KSxcbiAgICB2YWx1ZSAgICAgICA6IHZhbHVlXG4gIH07XG59OyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi8kLmhpZGUnKTsiLCIvLyBXb3JrcyB3aXRoIF9fcHJvdG9fXyBvbmx5LiBPbGQgdjggY2FuJ3Qgd29yayB3aXRoIG51bGwgcHJvdG8gb2JqZWN0cy5cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG52YXIgZ2V0RGVzYyAgPSByZXF1aXJlKCcuLyQnKS5nZXREZXNjXG4gICwgaXNPYmplY3QgPSByZXF1aXJlKCcuLyQuaXMtb2JqZWN0JylcbiAgLCBhbk9iamVjdCA9IHJlcXVpcmUoJy4vJC5hbi1vYmplY3QnKTtcbnZhciBjaGVjayA9IGZ1bmN0aW9uKE8sIHByb3RvKXtcbiAgYW5PYmplY3QoTyk7XG4gIGlmKCFpc09iamVjdChwcm90bykgJiYgcHJvdG8gIT09IG51bGwpdGhyb3cgVHlwZUVycm9yKHByb3RvICsgXCI6IGNhbid0IHNldCBhcyBwcm90b3R5cGUhXCIpO1xufTtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBzZXQ6IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCAoJ19fcHJvdG9fXycgaW4ge30gPyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgZnVuY3Rpb24odGVzdCwgYnVnZ3ksIHNldCl7XG4gICAgICB0cnkge1xuICAgICAgICBzZXQgPSByZXF1aXJlKCcuLyQuY3R4JykoRnVuY3Rpb24uY2FsbCwgZ2V0RGVzYyhPYmplY3QucHJvdG90eXBlLCAnX19wcm90b19fJykuc2V0LCAyKTtcbiAgICAgICAgc2V0KHRlc3QsIFtdKTtcbiAgICAgICAgYnVnZ3kgPSAhKHRlc3QgaW5zdGFuY2VvZiBBcnJheSk7XG4gICAgICB9IGNhdGNoKGUpeyBidWdneSA9IHRydWU7IH1cbiAgICAgIHJldHVybiBmdW5jdGlvbiBzZXRQcm90b3R5cGVPZihPLCBwcm90byl7XG4gICAgICAgIGNoZWNrKE8sIHByb3RvKTtcbiAgICAgICAgaWYoYnVnZ3kpTy5fX3Byb3RvX18gPSBwcm90bztcbiAgICAgICAgZWxzZSBzZXQoTywgcHJvdG8pO1xuICAgICAgICByZXR1cm4gTztcbiAgICAgIH07XG4gICAgfSh7fSwgZmFsc2UpIDogdW5kZWZpbmVkKSxcbiAgY2hlY2s6IGNoZWNrXG59OyIsInZhciBkZWYgPSByZXF1aXJlKCcuLyQnKS5zZXREZXNjXG4gICwgaGFzID0gcmVxdWlyZSgnLi8kLmhhcycpXG4gICwgVEFHID0gcmVxdWlyZSgnLi8kLndrcycpKCd0b1N0cmluZ1RhZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0LCB0YWcsIHN0YXQpe1xuICBpZihpdCAmJiAhaGFzKGl0ID0gc3RhdCA/IGl0IDogaXQucHJvdG90eXBlLCBUQUcpKWRlZihpdCwgVEFHLCB7Y29uZmlndXJhYmxlOiB0cnVlLCB2YWx1ZTogdGFnfSk7XG59OyIsInZhciBnbG9iYWwgPSByZXF1aXJlKCcuLyQuZ2xvYmFsJylcbiAgLCBTSEFSRUQgPSAnX19jb3JlLWpzX3NoYXJlZF9fJ1xuICAsIHN0b3JlICA9IGdsb2JhbFtTSEFSRURdIHx8IChnbG9iYWxbU0hBUkVEXSA9IHt9KTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oa2V5KXtcbiAgcmV0dXJuIHN0b3JlW2tleV0gfHwgKHN0b3JlW2tleV0gPSB7fSk7XG59OyIsInZhciB0b0ludGVnZXIgPSByZXF1aXJlKCcuLyQudG8taW50ZWdlcicpXG4gICwgZGVmaW5lZCAgID0gcmVxdWlyZSgnLi8kLmRlZmluZWQnKTtcbi8vIHRydWUgIC0+IFN0cmluZyNhdFxuLy8gZmFsc2UgLT4gU3RyaW5nI2NvZGVQb2ludEF0XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFRPX1NUUklORyl7XG4gIHJldHVybiBmdW5jdGlvbih0aGF0LCBwb3Mpe1xuICAgIHZhciBzID0gU3RyaW5nKGRlZmluZWQodGhhdCkpXG4gICAgICAsIGkgPSB0b0ludGVnZXIocG9zKVxuICAgICAgLCBsID0gcy5sZW5ndGhcbiAgICAgICwgYSwgYjtcbiAgICBpZihpIDwgMCB8fCBpID49IGwpcmV0dXJuIFRPX1NUUklORyA/ICcnIDogdW5kZWZpbmVkO1xuICAgIGEgPSBzLmNoYXJDb2RlQXQoaSk7XG4gICAgcmV0dXJuIGEgPCAweGQ4MDAgfHwgYSA+IDB4ZGJmZiB8fCBpICsgMSA9PT0gbCB8fCAoYiA9IHMuY2hhckNvZGVBdChpICsgMSkpIDwgMHhkYzAwIHx8IGIgPiAweGRmZmZcbiAgICAgID8gVE9fU1RSSU5HID8gcy5jaGFyQXQoaSkgOiBhXG4gICAgICA6IFRPX1NUUklORyA/IHMuc2xpY2UoaSwgaSArIDIpIDogKGEgLSAweGQ4MDAgPDwgMTApICsgKGIgLSAweGRjMDApICsgMHgxMDAwMDtcbiAgfTtcbn07IiwiLy8gNy4xLjQgVG9JbnRlZ2VyXG52YXIgY2VpbCAgPSBNYXRoLmNlaWxcbiAgLCBmbG9vciA9IE1hdGguZmxvb3I7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIGlzTmFOKGl0ID0gK2l0KSA/IDAgOiAoaXQgPiAwID8gZmxvb3IgOiBjZWlsKShpdCk7XG59OyIsIi8vIHRvIGluZGV4ZWQgb2JqZWN0LCB0b09iamVjdCB3aXRoIGZhbGxiYWNrIGZvciBub24tYXJyYXktbGlrZSBFUzMgc3RyaW5nc1xudmFyIElPYmplY3QgPSByZXF1aXJlKCcuLyQuaW9iamVjdCcpXG4gICwgZGVmaW5lZCA9IHJlcXVpcmUoJy4vJC5kZWZpbmVkJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIElPYmplY3QoZGVmaW5lZChpdCkpO1xufTsiLCIvLyA3LjEuMTMgVG9PYmplY3QoYXJndW1lbnQpXG52YXIgZGVmaW5lZCA9IHJlcXVpcmUoJy4vJC5kZWZpbmVkJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIE9iamVjdChkZWZpbmVkKGl0KSk7XG59OyIsInZhciBpZCA9IDBcbiAgLCBweCA9IE1hdGgucmFuZG9tKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGtleSl7XG4gIHJldHVybiAnU3ltYm9sKCcuY29uY2F0KGtleSA9PT0gdW5kZWZpbmVkID8gJycgOiBrZXksICcpXycsICgrK2lkICsgcHgpLnRvU3RyaW5nKDM2KSk7XG59OyIsInZhciBzdG9yZSAgPSByZXF1aXJlKCcuLyQuc2hhcmVkJykoJ3drcycpXG4gICwgdWlkICAgID0gcmVxdWlyZSgnLi8kLnVpZCcpXG4gICwgU3ltYm9sID0gcmVxdWlyZSgnLi8kLmdsb2JhbCcpLlN5bWJvbDtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obmFtZSl7XG4gIHJldHVybiBzdG9yZVtuYW1lXSB8fCAoc3RvcmVbbmFtZV0gPVxuICAgIFN5bWJvbCAmJiBTeW1ib2xbbmFtZV0gfHwgKFN5bWJvbCB8fCB1aWQpKCdTeW1ib2wuJyArIG5hbWUpKTtcbn07IiwidmFyIGNsYXNzb2YgICA9IHJlcXVpcmUoJy4vJC5jbGFzc29mJylcbiAgLCBJVEVSQVRPUiAgPSByZXF1aXJlKCcuLyQud2tzJykoJ2l0ZXJhdG9yJylcbiAgLCBJdGVyYXRvcnMgPSByZXF1aXJlKCcuLyQuaXRlcmF0b3JzJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vJC5jb3JlJykuZ2V0SXRlcmF0b3JNZXRob2QgPSBmdW5jdGlvbihpdCl7XG4gIGlmKGl0ICE9IHVuZGVmaW5lZClyZXR1cm4gaXRbSVRFUkFUT1JdXG4gICAgfHwgaXRbJ0BAaXRlcmF0b3InXVxuICAgIHx8IEl0ZXJhdG9yc1tjbGFzc29mKGl0KV07XG59OyIsInZhciBhbk9iamVjdCA9IHJlcXVpcmUoJy4vJC5hbi1vYmplY3QnKVxuICAsIGdldCAgICAgID0gcmVxdWlyZSgnLi9jb3JlLmdldC1pdGVyYXRvci1tZXRob2QnKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi8kLmNvcmUnKS5nZXRJdGVyYXRvciA9IGZ1bmN0aW9uKGl0KXtcbiAgdmFyIGl0ZXJGbiA9IGdldChpdCk7XG4gIGlmKHR5cGVvZiBpdGVyRm4gIT0gJ2Z1bmN0aW9uJyl0aHJvdyBUeXBlRXJyb3IoaXQgKyAnIGlzIG5vdCBpdGVyYWJsZSEnKTtcbiAgcmV0dXJuIGFuT2JqZWN0KGl0ZXJGbi5jYWxsKGl0KSk7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciBhZGRUb1Vuc2NvcGFibGVzID0gcmVxdWlyZSgnLi8kLmFkZC10by11bnNjb3BhYmxlcycpXG4gICwgc3RlcCAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vJC5pdGVyLXN0ZXAnKVxuICAsIEl0ZXJhdG9ycyAgICAgICAgPSByZXF1aXJlKCcuLyQuaXRlcmF0b3JzJylcbiAgLCB0b0lPYmplY3QgICAgICAgID0gcmVxdWlyZSgnLi8kLnRvLWlvYmplY3QnKTtcblxuLy8gMjIuMS4zLjQgQXJyYXkucHJvdG90eXBlLmVudHJpZXMoKVxuLy8gMjIuMS4zLjEzIEFycmF5LnByb3RvdHlwZS5rZXlzKClcbi8vIDIyLjEuMy4yOSBBcnJheS5wcm90b3R5cGUudmFsdWVzKClcbi8vIDIyLjEuMy4zMCBBcnJheS5wcm90b3R5cGVbQEBpdGVyYXRvcl0oKVxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLyQuaXRlci1kZWZpbmUnKShBcnJheSwgJ0FycmF5JywgZnVuY3Rpb24oaXRlcmF0ZWQsIGtpbmQpe1xuICB0aGlzLl90ID0gdG9JT2JqZWN0KGl0ZXJhdGVkKTsgLy8gdGFyZ2V0XG4gIHRoaXMuX2kgPSAwOyAgICAgICAgICAgICAgICAgICAvLyBuZXh0IGluZGV4XG4gIHRoaXMuX2sgPSBraW5kOyAgICAgICAgICAgICAgICAvLyBraW5kXG4vLyAyMi4xLjUuMi4xICVBcnJheUl0ZXJhdG9yUHJvdG90eXBlJS5uZXh0KClcbn0sIGZ1bmN0aW9uKCl7XG4gIHZhciBPICAgICA9IHRoaXMuX3RcbiAgICAsIGtpbmQgID0gdGhpcy5fa1xuICAgICwgaW5kZXggPSB0aGlzLl9pKys7XG4gIGlmKCFPIHx8IGluZGV4ID49IE8ubGVuZ3RoKXtcbiAgICB0aGlzLl90ID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiBzdGVwKDEpO1xuICB9XG4gIGlmKGtpbmQgPT0gJ2tleXMnICApcmV0dXJuIHN0ZXAoMCwgaW5kZXgpO1xuICBpZihraW5kID09ICd2YWx1ZXMnKXJldHVybiBzdGVwKDAsIE9baW5kZXhdKTtcbiAgcmV0dXJuIHN0ZXAoMCwgW2luZGV4LCBPW2luZGV4XV0pO1xufSwgJ3ZhbHVlcycpO1xuXG4vLyBhcmd1bWVudHNMaXN0W0BAaXRlcmF0b3JdIGlzICVBcnJheVByb3RvX3ZhbHVlcyUgKDkuNC40LjYsIDkuNC40LjcpXG5JdGVyYXRvcnMuQXJndW1lbnRzID0gSXRlcmF0b3JzLkFycmF5O1xuXG5hZGRUb1Vuc2NvcGFibGVzKCdrZXlzJyk7XG5hZGRUb1Vuc2NvcGFibGVzKCd2YWx1ZXMnKTtcbmFkZFRvVW5zY29wYWJsZXMoJ2VudHJpZXMnKTsiLCIvLyAyMC4xLjIuNSBOdW1iZXIuaXNTYWZlSW50ZWdlcihudW1iZXIpXG52YXIgJGV4cG9ydCAgID0gcmVxdWlyZSgnLi8kLmV4cG9ydCcpXG4gICwgaXNJbnRlZ2VyID0gcmVxdWlyZSgnLi8kLmlzLWludGVnZXInKVxuICAsIGFicyAgICAgICA9IE1hdGguYWJzO1xuXG4kZXhwb3J0KCRleHBvcnQuUywgJ051bWJlcicsIHtcbiAgaXNTYWZlSW50ZWdlcjogZnVuY3Rpb24gaXNTYWZlSW50ZWdlcihudW1iZXIpe1xuICAgIHJldHVybiBpc0ludGVnZXIobnVtYmVyKSAmJiBhYnMobnVtYmVyKSA8PSAweDFmZmZmZmZmZmZmZmZmO1xuICB9XG59KTsiLCIvLyAxOS4xLjMuMSBPYmplY3QuYXNzaWduKHRhcmdldCwgc291cmNlKVxudmFyICRleHBvcnQgPSByZXF1aXJlKCcuLyQuZXhwb3J0Jyk7XG5cbiRleHBvcnQoJGV4cG9ydC5TICsgJGV4cG9ydC5GLCAnT2JqZWN0Jywge2Fzc2lnbjogcmVxdWlyZSgnLi8kLm9iamVjdC1hc3NpZ24nKX0pOyIsIi8vIDE5LjEuMi4xNCBPYmplY3Qua2V5cyhPKVxudmFyIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi8kLnRvLW9iamVjdCcpO1xuXG5yZXF1aXJlKCcuLyQub2JqZWN0LXNhcCcpKCdrZXlzJywgZnVuY3Rpb24oJGtleXMpe1xuICByZXR1cm4gZnVuY3Rpb24ga2V5cyhpdCl7XG4gICAgcmV0dXJuICRrZXlzKHRvT2JqZWN0KGl0KSk7XG4gIH07XG59KTsiLCIvLyAxOS4xLjMuMTkgT2JqZWN0LnNldFByb3RvdHlwZU9mKE8sIHByb3RvKVxudmFyICRleHBvcnQgPSByZXF1aXJlKCcuLyQuZXhwb3J0Jyk7XG4kZXhwb3J0KCRleHBvcnQuUywgJ09iamVjdCcsIHtzZXRQcm90b3R5cGVPZjogcmVxdWlyZSgnLi8kLnNldC1wcm90bycpLnNldH0pOyIsIid1c2Ugc3RyaWN0JztcbnZhciAkYXQgID0gcmVxdWlyZSgnLi8kLnN0cmluZy1hdCcpKHRydWUpO1xuXG4vLyAyMS4xLjMuMjcgU3RyaW5nLnByb3RvdHlwZVtAQGl0ZXJhdG9yXSgpXG5yZXF1aXJlKCcuLyQuaXRlci1kZWZpbmUnKShTdHJpbmcsICdTdHJpbmcnLCBmdW5jdGlvbihpdGVyYXRlZCl7XG4gIHRoaXMuX3QgPSBTdHJpbmcoaXRlcmF0ZWQpOyAvLyB0YXJnZXRcbiAgdGhpcy5faSA9IDA7ICAgICAgICAgICAgICAgIC8vIG5leHQgaW5kZXhcbi8vIDIxLjEuNS4yLjEgJVN0cmluZ0l0ZXJhdG9yUHJvdG90eXBlJS5uZXh0KClcbn0sIGZ1bmN0aW9uKCl7XG4gIHZhciBPICAgICA9IHRoaXMuX3RcbiAgICAsIGluZGV4ID0gdGhpcy5faVxuICAgICwgcG9pbnQ7XG4gIGlmKGluZGV4ID49IE8ubGVuZ3RoKXJldHVybiB7dmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZX07XG4gIHBvaW50ID0gJGF0KE8sIGluZGV4KTtcbiAgdGhpcy5faSArPSBwb2ludC5sZW5ndGg7XG4gIHJldHVybiB7dmFsdWU6IHBvaW50LCBkb25lOiBmYWxzZX07XG59KTsiLCJyZXF1aXJlKCcuL2VzNi5hcnJheS5pdGVyYXRvcicpO1xudmFyIEl0ZXJhdG9ycyA9IHJlcXVpcmUoJy4vJC5pdGVyYXRvcnMnKTtcbkl0ZXJhdG9ycy5Ob2RlTGlzdCA9IEl0ZXJhdG9ycy5IVE1MQ29sbGVjdGlvbiA9IEl0ZXJhdG9ycy5BcnJheTsiLCJ2YXIgbWl4aW4gPSByZXF1aXJlKCdzbWFydC1taXhpbicpO1xudmFyIGFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxudmFyIG1peGluUHJvdG8gPSBtaXhpbih7XG4gIC8vIGxpZmVjeWNsZSBzdHVmZiBpcyBhcyB5b3UnZCBleHBlY3RcbiAgY29tcG9uZW50RGlkTW91bnQ6IG1peGluLk1BTlksXG4gIGNvbXBvbmVudFdpbGxNb3VudDogbWl4aW4uTUFOWSxcbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogbWl4aW4uTUFOWSxcbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBtaXhpbi5PTkNFLFxuICBjb21wb25lbnRXaWxsVXBkYXRlOiBtaXhpbi5NQU5ZLFxuICBjb21wb25lbnREaWRVcGRhdGU6IG1peGluLk1BTlksXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBtaXhpbi5NQU5ZLFxuICBnZXRDaGlsZENvbnRleHQ6IG1peGluLk1BTllfTUVSR0VEXG59KTtcblxuZnVuY3Rpb24gc2V0RGVmYXVsdFByb3BzKHJlYWN0TWl4aW4pIHtcbiAgdmFyIGdldERlZmF1bHRQcm9wcyA9IHJlYWN0TWl4aW4uZ2V0RGVmYXVsdFByb3BzO1xuXG4gIGlmIChnZXREZWZhdWx0UHJvcHMpIHtcbiAgICByZWFjdE1peGluLmRlZmF1bHRQcm9wcyA9IGdldERlZmF1bHRQcm9wcygpO1xuXG4gICAgZGVsZXRlIHJlYWN0TWl4aW4uZ2V0RGVmYXVsdFByb3BzO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldEluaXRpYWxTdGF0ZShyZWFjdE1peGluKSB7XG4gIHZhciBnZXRJbml0aWFsU3RhdGUgPSByZWFjdE1peGluLmdldEluaXRpYWxTdGF0ZTtcbiAgdmFyIGNvbXBvbmVudFdpbGxNb3VudCA9IHJlYWN0TWl4aW4uY29tcG9uZW50V2lsbE1vdW50O1xuXG4gIGZ1bmN0aW9uIGFwcGx5SW5pdGlhbFN0YXRlKGluc3RhbmNlKSB7XG4gICAgdmFyIHN0YXRlID0gaW5zdGFuY2Uuc3RhdGUgfHwge307XG4gICAgYXNzaWduKHN0YXRlLCBnZXRJbml0aWFsU3RhdGUuY2FsbChpbnN0YW5jZSkpO1xuICAgIGluc3RhbmNlLnN0YXRlID0gc3RhdGU7XG4gIH1cblxuICBpZiAoZ2V0SW5pdGlhbFN0YXRlKSB7XG4gICAgaWYgKCFjb21wb25lbnRXaWxsTW91bnQpIHtcbiAgICAgIHJlYWN0TWl4aW4uY29tcG9uZW50V2lsbE1vdW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGFwcGx5SW5pdGlhbFN0YXRlKHRoaXMpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVhY3RNaXhpbi5jb21wb25lbnRXaWxsTW91bnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgYXBwbHlJbml0aWFsU3RhdGUodGhpcyk7XG4gICAgICAgIGNvbXBvbmVudFdpbGxNb3VudC5jYWxsKHRoaXMpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBkZWxldGUgcmVhY3RNaXhpbi5nZXRJbml0aWFsU3RhdGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWl4aW5DbGFzcyhyZWFjdENsYXNzLCByZWFjdE1peGluKSB7XG4gIHNldERlZmF1bHRQcm9wcyhyZWFjdE1peGluKTtcbiAgc2V0SW5pdGlhbFN0YXRlKHJlYWN0TWl4aW4pO1xuXG4gIHZhciBwcm90b3R5cGVNZXRob2RzID0ge307XG4gIHZhciBzdGF0aWNQcm9wcyA9IHt9O1xuXG4gIE9iamVjdC5rZXlzKHJlYWN0TWl4aW4pLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKGtleSA9PT0gJ21peGlucycpIHtcbiAgICAgIHJldHVybjsgLy8gSGFuZGxlZCBiZWxvdyB0byBlbnN1cmUgcHJvcGVyIG9yZGVyIHJlZ2FyZGxlc3Mgb2YgcHJvcGVydHkgaXRlcmF0aW9uIG9yZGVyXG4gICAgfVxuICAgIGlmIChrZXkgPT09ICdzdGF0aWNzJykge1xuICAgICAgcmV0dXJuOyAvLyBnZXRzIHNwZWNpYWwgaGFuZGxpbmdcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiByZWFjdE1peGluW2tleV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHByb3RvdHlwZU1ldGhvZHNba2V5XSA9IHJlYWN0TWl4aW5ba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGljUHJvcHNba2V5XSA9IHJlYWN0TWl4aW5ba2V5XTtcbiAgICB9XG4gIH0pO1xuXG4gIG1peGluUHJvdG8ocmVhY3RDbGFzcy5wcm90b3R5cGUsIHByb3RvdHlwZU1ldGhvZHMpO1xuXG4gIHZhciBtZXJnZVByb3BUeXBlcyA9IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0LCBrZXkpIHtcbiAgICBpZiAoIWxlZnQpIHJldHVybiByaWdodDtcbiAgICBpZiAoIXJpZ2h0KSByZXR1cm4gbGVmdDtcblxuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhsZWZ0KS5mb3JFYWNoKGZ1bmN0aW9uKGxlZnRLZXkpIHtcbiAgICAgIGlmICghcmlnaHRbbGVmdEtleV0pIHtcbiAgICAgICAgcmVzdWx0W2xlZnRLZXldID0gbGVmdFtsZWZ0S2V5XTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIE9iamVjdC5rZXlzKHJpZ2h0KS5mb3JFYWNoKGZ1bmN0aW9uKHJpZ2h0S2V5KSB7XG4gICAgICBpZiAobGVmdFtyaWdodEtleV0pIHtcbiAgICAgICAgcmVzdWx0W3JpZ2h0S2V5XSA9IGZ1bmN0aW9uIGNoZWNrQm90aENvbnRleHRUeXBlcygpIHtcbiAgICAgICAgICByZXR1cm4gcmlnaHRbcmlnaHRLZXldLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgJiYgbGVmdFtyaWdodEtleV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtyaWdodEtleV0gPSByaWdodFtyaWdodEtleV07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIG1peGluKHtcbiAgICBjaGlsZENvbnRleHRUeXBlczogbWVyZ2VQcm9wVHlwZXMsXG4gICAgY29udGV4dFR5cGVzOiBtZXJnZVByb3BUeXBlcyxcbiAgICBwcm9wVHlwZXM6IG1peGluLk1BTllfTUVSR0VEX0xPT1NFLFxuICAgIGRlZmF1bHRQcm9wczogbWl4aW4uTUFOWV9NRVJHRURfTE9PU0VcbiAgfSkocmVhY3RDbGFzcywgc3RhdGljUHJvcHMpO1xuXG4gIC8vIHN0YXRpY3MgaXMgYSBzcGVjaWFsIGNhc2UgYmVjYXVzZSBpdCBtZXJnZXMgZGlyZWN0bHkgb250byB0aGUgY2xhc3NcbiAgaWYgKHJlYWN0TWl4aW4uc3RhdGljcykge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHJlYWN0TWl4aW4uc3RhdGljcykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBsZWZ0ID0gcmVhY3RDbGFzc1trZXldO1xuICAgICAgdmFyIHJpZ2h0ID0gcmVhY3RNaXhpbi5zdGF0aWNzW2tleV07XG5cbiAgICAgIGlmIChsZWZ0ICE9PSB1bmRlZmluZWQgJiYgcmlnaHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgbWl4aW4gc3RhdGljcyBiZWNhdXNlIHN0YXRpY3MuJyArIGtleSArICcgYW5kIENvbXBvbmVudC4nICsga2V5ICsgJyBhcmUgZGVmaW5lZC4nKTtcbiAgICAgIH1cblxuICAgICAgcmVhY3RDbGFzc1trZXldID0gbGVmdCAhPT0gdW5kZWZpbmVkID8gbGVmdCA6IHJpZ2h0O1xuICAgIH0pO1xuICB9XG5cbiAgLy8gSWYgbW9yZSBtaXhpbnMgYXJlIGRlZmluZWQsIHRoZXkgbmVlZCB0byBydW4uIFRoaXMgZW11bGF0ZSdzIHJlYWN0J3MgYmVoYXZpb3IuXG4gIC8vIFNlZSBiZWhhdmlvciBpbiBjb2RlIGF0OlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi80MWFhMzQ5NmFhNjMyNjM0ZjY1MGVkYmUxMGQ2MTc3OTk5MjJkMjY1L3NyYy9pc29tb3JwaGljL2NsYXNzaWMvY2xhc3MvUmVhY3RDbGFzcy5qcyNMNDY4XG4gIC8vIE5vdGUgdGhlIC5yZXZlcnNlKCkuIEluIFJlYWN0LCBhIGZyZXNoIGNvbnN0cnVjdG9yIGlzIGNyZWF0ZWQsIHRoZW4gYWxsIG1peGlucyBhcmUgbWl4ZWQgaW4gcmVjdXJzaXZlbHksXG4gIC8vIHRoZW4gdGhlIGFjdHVhbCBzcGVjIGlzIG1peGVkIGluIGxhc3QuXG4gIC8vXG4gIC8vIFdpdGggRVM2IGNsYXNzZXMsIHRoZSBwcm9wZXJ0aWVzIGFyZSBhbHJlYWR5IHRoZXJlLCBzbyBzbWFydC1taXhpbiBtaXhlcyBmdW5jdGlvbnMgKGEsIGIpIC0+IGIoKWEoKSwgd2hpY2ggaXNcbiAgLy8gdGhlIG9wcG9zaXRlIG9mIGhvdyBSZWFjdCBkb2VzIGl0LiBJZiB3ZSByZXZlcnNlIHRoaXMgYXJyYXksIHdlIGJhc2ljYWxseSBkbyB0aGUgd2hvbGUgbG9naWMgaW4gcmV2ZXJzZSxcbiAgLy8gd2hpY2ggbWFrZXMgdGhlIHJlc3VsdCB0aGUgc2FtZS4gU2VlIHRoZSB0ZXN0IGZvciBtb3JlLlxuICAvLyBTZWUgYWxzbzpcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvNDFhYTM0OTZhYTYzMjYzNGY2NTBlZGJlMTBkNjE3Nzk5OTIyZDI2NS9zcmMvaXNvbW9ycGhpYy9jbGFzc2ljL2NsYXNzL1JlYWN0Q2xhc3MuanMjTDg1M1xuICBpZiAocmVhY3RNaXhpbi5taXhpbnMpIHtcbiAgICByZWFjdE1peGluLm1peGlucy5yZXZlcnNlKCkuZm9yRWFjaChtaXhpbkNsYXNzLmJpbmQobnVsbCwgcmVhY3RDbGFzcykpO1xuICB9XG5cbiAgcmV0dXJuIHJlYWN0Q2xhc3M7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgcmVhY3RNaXhpbiA9IG1peGluUHJvdG87XG5cbiAgcmVhY3RNaXhpbi5vbkNsYXNzID0gZnVuY3Rpb24ocmVhY3RDbGFzcywgbWl4aW4pIHtcbiAgICByZXR1cm4gbWl4aW5DbGFzcyhyZWFjdENsYXNzLCBtaXhpbik7XG4gIH07XG5cbiAgcmVhY3RNaXhpbi5kZWNvcmF0ZSA9IGZ1bmN0aW9uKG1peGluKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlYWN0Q2xhc3MpIHtcbiAgICAgIHJldHVybiByZWFjdE1peGluLm9uQ2xhc3MocmVhY3RDbGFzcywgbWl4aW4pO1xuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIHJlYWN0TWl4aW47XG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBUb09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PSBudWxsKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LmFzc2lnbiBjYW5ub3QgYmUgY2FsbGVkIHdpdGggbnVsbCBvciB1bmRlZmluZWQnKTtcblx0fVxuXG5cdHJldHVybiBPYmplY3QodmFsKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIGtleXM7XG5cdHZhciB0byA9IFRvT2JqZWN0KHRhcmdldCk7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gYXJndW1lbnRzW3NdO1xuXHRcdGtleXMgPSBPYmplY3Qua2V5cyhPYmplY3QoZnJvbSkpO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0b1trZXlzW2ldXSA9IGZyb21ba2V5c1tpXV07XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRvO1xufTtcbiIsInZhciBvYmpUb1N0ciA9IGZ1bmN0aW9uKHgpeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpOyB9O1xuXG52YXIgdGhyb3dlciA9IGZ1bmN0aW9uKGVycm9yKXtcbiAgICB0aHJvdyBlcnJvcjtcbn07XG5cbnZhciBtaXhpbnMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1ha2VNaXhpbkZ1bmN0aW9uKHJ1bGVzLCBfb3B0cyl7XG4gICAgdmFyIG9wdHMgPSBfb3B0cyB8fCB7fTtcbiAgICBpZiAoIW9wdHMudW5rbm93bkZ1bmN0aW9uKSB7XG4gICAgICAgIG9wdHMudW5rbm93bkZ1bmN0aW9uID0gbWl4aW5zLk9OQ0U7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRzLm5vbkZ1bmN0aW9uUHJvcGVydHkpIHtcbiAgICAgICAgb3B0cy5ub25GdW5jdGlvblByb3BlcnR5ID0gZnVuY3Rpb24obGVmdCwgcmlnaHQsIGtleSl7XG4gICAgICAgICAgICBpZiAobGVmdCAhPT0gdW5kZWZpbmVkICYmIHJpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZ2V0VHlwZU5hbWUgPSBmdW5jdGlvbihvYmope1xuICAgICAgICAgICAgICAgICAgICBpZiAob2JqICYmIG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iai5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialRvU3RyKG9iaikuc2xpY2UoOCwgLTEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgbWl4aW4ga2V5ICcgKyBrZXkgKyAnIGJlY2F1c2UgaXQgaXMgcHJvdmlkZWQgYnkgbXVsdGlwbGUgc291cmNlcywgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKyAnYW5kIHRoZSB0eXBlcyBhcmUgJyArIGdldFR5cGVOYW1lKGxlZnQpICsgJyBhbmQgJyArIGdldFR5cGVOYW1lKHJpZ2h0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbGVmdCA9PT0gdW5kZWZpbmVkID8gcmlnaHQgOiBsZWZ0O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldE5vbkVudW1lcmFibGUodGFyZ2V0LCBrZXksIHZhbHVlKXtcbiAgICAgICAgaWYgKGtleSBpbiB0YXJnZXQpe1xuICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGFwcGx5TWl4aW4oc291cmNlLCBtaXhpbil7XG4gICAgICAgIE9iamVjdC5rZXlzKG1peGluKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XG4gICAgICAgICAgICB2YXIgbGVmdCA9IHNvdXJjZVtrZXldLCByaWdodCA9IG1peGluW2tleV0sIHJ1bGUgPSBydWxlc1trZXldO1xuXG4gICAgICAgICAgICAvLyB0aGlzIGlzIGp1c3QgYSB3ZWlyZCBjYXNlIHdoZXJlIHRoZSBrZXkgd2FzIGRlZmluZWQsIGJ1dCB0aGVyZSdzIG5vIHZhbHVlXG4gICAgICAgICAgICAvLyBiZWhhdmUgbGlrZSB0aGUga2V5IHdhc24ndCBkZWZpbmVkXG4gICAgICAgICAgICBpZiAobGVmdCA9PT0gdW5kZWZpbmVkICYmIHJpZ2h0ID09PSB1bmRlZmluZWQpIHJldHVybjtcblxuICAgICAgICAgICAgdmFyIHdyYXBJZkZ1bmN0aW9uID0gZnVuY3Rpb24odGhpbmcpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdGhpbmcgIT09IFwiZnVuY3Rpb25cIiA/IHRoaW5nXG4gICAgICAgICAgICAgICAgOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpbmcuY2FsbCh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBkbyB3ZSBoYXZlIGEgcnVsZSBmb3IgdGhpcyBrZXk/XG4gICAgICAgICAgICBpZiAocnVsZSkge1xuICAgICAgICAgICAgICAgIC8vIG1heSB0aHJvdyBoZXJlXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gcnVsZShsZWZ0LCByaWdodCwga2V5KTtcbiAgICAgICAgICAgICAgICBzZXROb25FbnVtZXJhYmxlKHNvdXJjZSwga2V5LCB3cmFwSWZGdW5jdGlvbihmbikpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGxlZnRJc0ZuID0gdHlwZW9mIGxlZnQgPT09IFwiZnVuY3Rpb25cIjtcbiAgICAgICAgICAgIHZhciByaWdodElzRm4gPSB0eXBlb2YgcmlnaHQgPT09IFwiZnVuY3Rpb25cIjtcblxuICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIHRoZXkncmUgc29tZSBjb21iaW5hdGlvbiBvZiBmdW5jdGlvbnMgb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICAvLyB3ZSBhbHJlYWR5IGtub3cgdGhlcmUncyBubyBydWxlLCBzbyB1c2UgdGhlIHVua25vd24gZnVuY3Rpb24gYmVoYXZpb3JcbiAgICAgICAgICAgIGlmIChsZWZ0SXNGbiAmJiByaWdodCA9PT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgfHwgcmlnaHRJc0ZuICYmIGxlZnQgPT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgIHx8IGxlZnRJc0ZuICYmIHJpZ2h0SXNGbikge1xuICAgICAgICAgICAgICAgIC8vIG1heSB0aHJvdywgdGhlIGRlZmF1bHQgaXMgT05DRSBzbyBpZiBib3RoIGFyZSBmdW5jdGlvbnNcbiAgICAgICAgICAgICAgICAvLyB0aGUgZGVmYXVsdCBpcyB0byB0aHJvd1xuICAgICAgICAgICAgICAgIHNldE5vbkVudW1lcmFibGUoc291cmNlLCBrZXksIHdyYXBJZkZ1bmN0aW9uKG9wdHMudW5rbm93bkZ1bmN0aW9uKGxlZnQsIHJpZ2h0LCBrZXkpKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIG5vIHJ1bGUgZm9yIHRoZW0sIG9uZSBtYXkgYmUgYSBmdW5jdGlvbiBidXQgb25lIG9yIGJvdGggYXJlbid0XG4gICAgICAgICAgICAvLyBvdXIgZGVmYXVsdCBpcyBNQU5ZX01FUkdFRF9MT09TRSB3aGljaCB3aWxsIG1lcmdlIG9iamVjdHMsIGNvbmNhdCBhcnJheXNcbiAgICAgICAgICAgIC8vIGFuZCB0aHJvdyBpZiB0aGVyZSdzIGEgdHlwZSBtaXNtYXRjaCBvciBib3RoIGFyZSBwcmltaXRpdmVzIChob3cgZG8geW91IG1lcmdlIDMsIGFuZCBcImZvb1wiPylcbiAgICAgICAgICAgIHNvdXJjZVtrZXldID0gb3B0cy5ub25GdW5jdGlvblByb3BlcnR5KGxlZnQsIHJpZ2h0LCBrZXkpO1xuICAgICAgICB9KTtcbiAgICB9O1xufTtcblxubWl4aW5zLl9tZXJnZU9iamVjdHMgPSBmdW5jdGlvbihvYmoxLCBvYmoyKSB7XG4gICAgdmFyIGFzc2VydE9iamVjdCA9IGZ1bmN0aW9uKG9iaiwgb2JqMil7XG4gICAgICAgIHZhciB0eXBlID0gb2JqVG9TdHIob2JqKTtcbiAgICAgICAgaWYgKHR5cGUgIT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICB2YXIgZGlzcGxheVR5cGUgPSBvYmouY29uc3RydWN0b3IgPyBvYmouY29uc3RydWN0b3IubmFtZSA6ICdVbmtub3duJztcbiAgICAgICAgICAgIHZhciBkaXNwbGF5VHlwZTIgPSBvYmoyLmNvbnN0cnVjdG9yID8gb2JqMi5jb25zdHJ1Y3Rvci5uYW1lIDogJ1Vua25vd24nO1xuICAgICAgICAgICAgdGhyb3dlcignY2Fubm90IG1lcmdlIHJldHVybmVkIHZhbHVlIG9mIHR5cGUgJyArIGRpc3BsYXlUeXBlICsgJyB3aXRoIGFuICcgKyBkaXNwbGF5VHlwZTIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KG9iajEpICYmIEFycmF5LmlzQXJyYXkob2JqMikpIHtcbiAgICAgICAgcmV0dXJuIG9iajEuY29uY2F0KG9iajIpO1xuICAgIH1cblxuICAgIGFzc2VydE9iamVjdChvYmoxLCBvYmoyKTtcbiAgICBhc3NlcnRPYmplY3Qob2JqMiwgb2JqMSk7XG5cbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgT2JqZWN0LmtleXMob2JqMSkuZm9yRWFjaChmdW5jdGlvbihrKXtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmoyLCBrKSkge1xuICAgICAgICAgICAgdGhyb3dlcignY2Fubm90IG1lcmdlIHJldHVybnMgYmVjYXVzZSBib3RoIGhhdmUgdGhlICcgKyBKU09OLnN0cmluZ2lmeShrKSArICcga2V5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0W2tdID0gb2JqMVtrXTtcbiAgICB9KTtcblxuICAgIE9iamVjdC5rZXlzKG9iajIpLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgIC8vIHdlIGNhbiBza2lwIHRoZSBjb25mbGljdCBjaGVjayBiZWNhdXNlIGFsbCBjb25mbGljdHMgd291bGQgYWxyZWFkeSBiZSBmb3VuZFxuICAgICAgICByZXN1bHRba10gPSBvYmoyW2tdO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG5cbn1cblxuLy8gZGVmaW5lIG91ciBidWlsdC1pbiBtaXhpbiB0eXBlc1xubWl4aW5zLk9OQ0UgPSBmdW5jdGlvbihsZWZ0LCByaWdodCwga2V5KXtcbiAgICBpZiAobGVmdCAmJiByaWdodCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgbWl4aW4gJyArIGtleSArICcgYmVjYXVzZSBpdCBoYXMgYSB1bmlxdWUgY29uc3RyYWludC4nKTtcbiAgICB9XG5cbiAgICB2YXIgZm4gPSBsZWZ0IHx8IHJpZ2h0O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFyZ3Mpe1xuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbn07XG5cbm1peGlucy5NQU5ZID0gZnVuY3Rpb24obGVmdCwgcmlnaHQsIGtleSl7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFyZ3Mpe1xuICAgICAgICBpZiAocmlnaHQpIHJpZ2h0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICByZXR1cm4gbGVmdCA/IGxlZnQuYXBwbHkodGhpcywgYXJncykgOiB1bmRlZmluZWQ7XG4gICAgfTtcbn07XG5cbm1peGlucy5NQU5ZX01FUkdFRF9MT09TRSA9IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0LCBrZXkpIHtcbiAgICBpZihsZWZ0ICYmIHJpZ2h0KSB7XG4gICAgICAgIHJldHVybiBtaXhpbnMuX21lcmdlT2JqZWN0cyhsZWZ0LCByaWdodCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxlZnQgfHwgcmlnaHQ7XG59XG5cbm1peGlucy5NQU5ZX01FUkdFRCA9IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0LCBrZXkpe1xuICAgIHJldHVybiBmdW5jdGlvbihhcmdzKXtcbiAgICAgICAgdmFyIHJlczEgPSByaWdodCAmJiByaWdodC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgdmFyIHJlczIgPSBsZWZ0ICYmIGxlZnQuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIGlmIChyZXMxICYmIHJlczIpIHtcbiAgICAgICAgICAgIHJldHVybiBtaXhpbnMuX21lcmdlT2JqZWN0cyhyZXMxLCByZXMyKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMyIHx8IHJlczE7XG4gICAgfTtcbn07XG5cblxubWl4aW5zLlJFRFVDRV9MRUZUID0gZnVuY3Rpb24oX2xlZnQsIF9yaWdodCwga2V5KXtcbiAgICB2YXIgbGVmdCA9IF9sZWZ0IHx8IGZ1bmN0aW9uKHgpeyByZXR1cm4geCB9O1xuICAgIHZhciByaWdodCA9IF9yaWdodCB8fCBmdW5jdGlvbih4KXsgcmV0dXJuIHggfTtcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJncyl7XG4gICAgICAgIHJldHVybiByaWdodC5jYWxsKHRoaXMsIGxlZnQuYXBwbHkodGhpcywgYXJncykpO1xuICAgIH07XG59O1xuXG5taXhpbnMuUkVEVUNFX1JJR0hUID0gZnVuY3Rpb24oX2xlZnQsIF9yaWdodCwga2V5KXtcbiAgICB2YXIgbGVmdCA9IF9sZWZ0IHx8IGZ1bmN0aW9uKHgpeyByZXR1cm4geCB9O1xuICAgIHZhciByaWdodCA9IF9yaWdodCB8fCBmdW5jdGlvbih4KXsgcmV0dXJuIHggfTtcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJncyl7XG4gICAgICAgIHJldHVybiBsZWZ0LmNhbGwodGhpcywgcmlnaHQuYXBwbHkodGhpcywgYXJncykpO1xuICAgIH07XG59O1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSBjcmVhdGVBbGw7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9jcmVhdGVQcm92aWRlciA9IHJlcXVpcmUoJy4vY3JlYXRlUHJvdmlkZXInKTtcblxudmFyIF9jcmVhdGVQcm92aWRlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jcmVhdGVQcm92aWRlcik7XG5cbnZhciBfY3JlYXRlQ29ubmVjdCA9IHJlcXVpcmUoJy4vY3JlYXRlQ29ubmVjdCcpO1xuXG52YXIgX2NyZWF0ZUNvbm5lY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY3JlYXRlQ29ubmVjdCk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUFsbChSZWFjdCkge1xuICB2YXIgUHJvdmlkZXIgPSBfY3JlYXRlUHJvdmlkZXIyWydkZWZhdWx0J10oUmVhY3QpO1xuICB2YXIgY29ubmVjdCA9IF9jcmVhdGVDb25uZWN0MlsnZGVmYXVsdCddKFJlYWN0KTtcblxuICByZXR1cm4geyBQcm92aWRlcjogUHJvdmlkZXIsIGNvbm5lY3Q6IGNvbm5lY3QgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBjcmVhdGVDb25uZWN0O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3V0aWxzQ3JlYXRlU3RvcmVTaGFwZSA9IHJlcXVpcmUoJy4uL3V0aWxzL2NyZWF0ZVN0b3JlU2hhcGUnKTtcblxudmFyIF91dGlsc0NyZWF0ZVN0b3JlU2hhcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNDcmVhdGVTdG9yZVNoYXBlKTtcblxudmFyIF91dGlsc1NoYWxsb3dFcXVhbCA9IHJlcXVpcmUoJy4uL3V0aWxzL3NoYWxsb3dFcXVhbCcpO1xuXG52YXIgX3V0aWxzU2hhbGxvd0VxdWFsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzU2hhbGxvd0VxdWFsKTtcblxudmFyIF91dGlsc0lzUGxhaW5PYmplY3QgPSByZXF1aXJlKCcuLi91dGlscy9pc1BsYWluT2JqZWN0Jyk7XG5cbnZhciBfdXRpbHNJc1BsYWluT2JqZWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzSXNQbGFpbk9iamVjdCk7XG5cbnZhciBfdXRpbHNXcmFwQWN0aW9uQ3JlYXRvcnMgPSByZXF1aXJlKCcuLi91dGlscy93cmFwQWN0aW9uQ3JlYXRvcnMnKTtcblxudmFyIF91dGlsc1dyYXBBY3Rpb25DcmVhdG9yczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc1dyYXBBY3Rpb25DcmVhdG9ycyk7XG5cbnZhciBfaG9pc3ROb25SZWFjdFN0YXRpY3MgPSByZXF1aXJlKCdob2lzdC1ub24tcmVhY3Qtc3RhdGljcycpO1xuXG52YXIgX2hvaXN0Tm9uUmVhY3RTdGF0aWNzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2hvaXN0Tm9uUmVhY3RTdGF0aWNzKTtcblxudmFyIF9pbnZhcmlhbnQgPSByZXF1aXJlKCdpbnZhcmlhbnQnKTtcblxudmFyIF9pbnZhcmlhbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaW52YXJpYW50KTtcblxudmFyIGRlZmF1bHRNYXBTdGF0ZVRvUHJvcHMgPSBmdW5jdGlvbiBkZWZhdWx0TWFwU3RhdGVUb1Byb3BzKCkge1xuICByZXR1cm4ge307XG59O1xudmFyIGRlZmF1bHRNYXBEaXNwYXRjaFRvUHJvcHMgPSBmdW5jdGlvbiBkZWZhdWx0TWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoKSB7XG4gIHJldHVybiB7IGRpc3BhdGNoOiBkaXNwYXRjaCB9O1xufTtcbnZhciBkZWZhdWx0TWVyZ2VQcm9wcyA9IGZ1bmN0aW9uIGRlZmF1bHRNZXJnZVByb3BzKHN0YXRlUHJvcHMsIGRpc3BhdGNoUHJvcHMsIHBhcmVudFByb3BzKSB7XG4gIHJldHVybiBfZXh0ZW5kcyh7fSwgcGFyZW50UHJvcHMsIHN0YXRlUHJvcHMsIGRpc3BhdGNoUHJvcHMpO1xufTtcblxuZnVuY3Rpb24gZ2V0RGlzcGxheU5hbWUoQ29tcG9uZW50KSB7XG4gIHJldHVybiBDb21wb25lbnQuZGlzcGxheU5hbWUgfHwgQ29tcG9uZW50Lm5hbWUgfHwgJ0NvbXBvbmVudCc7XG59XG5cbi8vIEhlbHBzIHRyYWNrIGhvdCByZWxvYWRpbmcuXG52YXIgbmV4dFZlcnNpb24gPSAwO1xuXG5mdW5jdGlvbiBjcmVhdGVDb25uZWN0KFJlYWN0KSB7XG4gIHZhciBDb21wb25lbnQgPSBSZWFjdC5Db21wb25lbnQ7XG4gIHZhciBQcm9wVHlwZXMgPSBSZWFjdC5Qcm9wVHlwZXM7XG5cbiAgdmFyIHN0b3JlU2hhcGUgPSBfdXRpbHNDcmVhdGVTdG9yZVNoYXBlMlsnZGVmYXVsdCddKFByb3BUeXBlcyk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzLCBtYXBEaXNwYXRjaFRvUHJvcHMsIG1lcmdlUHJvcHMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMyB8fCBhcmd1bWVudHNbM10gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzNdO1xuXG4gICAgdmFyIHNob3VsZFN1YnNjcmliZSA9IEJvb2xlYW4obWFwU3RhdGVUb1Byb3BzKTtcbiAgICB2YXIgZmluYWxNYXBTdGF0ZVRvUHJvcHMgPSBtYXBTdGF0ZVRvUHJvcHMgfHwgZGVmYXVsdE1hcFN0YXRlVG9Qcm9wcztcbiAgICB2YXIgZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMgPSBfdXRpbHNJc1BsYWluT2JqZWN0MlsnZGVmYXVsdCddKG1hcERpc3BhdGNoVG9Qcm9wcykgPyBfdXRpbHNXcmFwQWN0aW9uQ3JlYXRvcnMyWydkZWZhdWx0J10obWFwRGlzcGF0Y2hUb1Byb3BzKSA6IG1hcERpc3BhdGNoVG9Qcm9wcyB8fCBkZWZhdWx0TWFwRGlzcGF0Y2hUb1Byb3BzO1xuICAgIHZhciBmaW5hbE1lcmdlUHJvcHMgPSBtZXJnZVByb3BzIHx8IGRlZmF1bHRNZXJnZVByb3BzO1xuICAgIHZhciBzaG91bGRVcGRhdGVTdGF0ZVByb3BzID0gZmluYWxNYXBTdGF0ZVRvUHJvcHMubGVuZ3RoID4gMTtcbiAgICB2YXIgc2hvdWxkVXBkYXRlRGlzcGF0Y2hQcm9wcyA9IGZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzLmxlbmd0aCA+IDE7XG4gICAgdmFyIF9vcHRpb25zJHB1cmUgPSBvcHRpb25zLnB1cmU7XG4gICAgdmFyIHB1cmUgPSBfb3B0aW9ucyRwdXJlID09PSB1bmRlZmluZWQgPyB0cnVlIDogX29wdGlvbnMkcHVyZTtcblxuICAgIC8vIEhlbHBzIHRyYWNrIGhvdCByZWxvYWRpbmcuXG4gICAgdmFyIHZlcnNpb24gPSBuZXh0VmVyc2lvbisrO1xuXG4gICAgZnVuY3Rpb24gY29tcHV0ZVN0YXRlUHJvcHMoc3RvcmUsIHByb3BzKSB7XG4gICAgICB2YXIgc3RhdGUgPSBzdG9yZS5nZXRTdGF0ZSgpO1xuICAgICAgdmFyIHN0YXRlUHJvcHMgPSBzaG91bGRVcGRhdGVTdGF0ZVByb3BzID8gZmluYWxNYXBTdGF0ZVRvUHJvcHMoc3RhdGUsIHByb3BzKSA6IGZpbmFsTWFwU3RhdGVUb1Byb3BzKHN0YXRlKTtcblxuICAgICAgX2ludmFyaWFudDJbJ2RlZmF1bHQnXShfdXRpbHNJc1BsYWluT2JqZWN0MlsnZGVmYXVsdCddKHN0YXRlUHJvcHMpLCAnYG1hcFN0YXRlVG9Qcm9wc2AgbXVzdCByZXR1cm4gYW4gb2JqZWN0LiBJbnN0ZWFkIHJlY2VpdmVkICVzLicsIHN0YXRlUHJvcHMpO1xuICAgICAgcmV0dXJuIHN0YXRlUHJvcHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcHV0ZURpc3BhdGNoUHJvcHMoc3RvcmUsIHByb3BzKSB7XG4gICAgICB2YXIgZGlzcGF0Y2ggPSBzdG9yZS5kaXNwYXRjaDtcblxuICAgICAgdmFyIGRpc3BhdGNoUHJvcHMgPSBzaG91bGRVcGRhdGVEaXNwYXRjaFByb3BzID8gZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2gsIHByb3BzKSA6IGZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoKTtcblxuICAgICAgX2ludmFyaWFudDJbJ2RlZmF1bHQnXShfdXRpbHNJc1BsYWluT2JqZWN0MlsnZGVmYXVsdCddKGRpc3BhdGNoUHJvcHMpLCAnYG1hcERpc3BhdGNoVG9Qcm9wc2AgbXVzdCByZXR1cm4gYW4gb2JqZWN0LiBJbnN0ZWFkIHJlY2VpdmVkICVzLicsIGRpc3BhdGNoUHJvcHMpO1xuICAgICAgcmV0dXJuIGRpc3BhdGNoUHJvcHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2NvbXB1dGVOZXh0U3RhdGUoc3RhdGVQcm9wcywgZGlzcGF0Y2hQcm9wcywgcGFyZW50UHJvcHMpIHtcbiAgICAgIHZhciBtZXJnZWRQcm9wcyA9IGZpbmFsTWVyZ2VQcm9wcyhzdGF0ZVByb3BzLCBkaXNwYXRjaFByb3BzLCBwYXJlbnRQcm9wcyk7XG4gICAgICBfaW52YXJpYW50MlsnZGVmYXVsdCddKF91dGlsc0lzUGxhaW5PYmplY3QyWydkZWZhdWx0J10obWVyZ2VkUHJvcHMpLCAnYG1lcmdlUHJvcHNgIG11c3QgcmV0dXJuIGFuIG9iamVjdC4gSW5zdGVhZCByZWNlaXZlZCAlcy4nLCBtZXJnZWRQcm9wcyk7XG4gICAgICByZXR1cm4gbWVyZ2VkUHJvcHM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBXaXRoQ29ubmVjdChXcmFwcGVkQ29tcG9uZW50KSB7XG4gICAgICB2YXIgQ29ubmVjdCA9IChmdW5jdGlvbiAoX0NvbXBvbmVudCkge1xuICAgICAgICBfaW5oZXJpdHMoQ29ubmVjdCwgX0NvbXBvbmVudCk7XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUuc2hvdWxkQ29tcG9uZW50VXBkYXRlID0gZnVuY3Rpb24gc2hvdWxkQ29tcG9uZW50VXBkYXRlKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgICAgICAgaWYgKCFwdXJlKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlUHJvcHMobmV4dFByb3BzKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRGlzcGF0Y2hQcm9wcyhuZXh0UHJvcHMpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdGF0ZShuZXh0UHJvcHMpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHN0b3JlQ2hhbmdlZCA9IG5leHRTdGF0ZS5zdG9yZVN0YXRlICE9PSB0aGlzLnN0YXRlLnN0b3JlU3RhdGU7XG4gICAgICAgICAgdmFyIHByb3BzQ2hhbmdlZCA9ICFfdXRpbHNTaGFsbG93RXF1YWwyWydkZWZhdWx0J10obmV4dFByb3BzLCB0aGlzLnByb3BzKTtcbiAgICAgICAgICB2YXIgbWFwU3RhdGVQcm9kdWNlZENoYW5nZSA9IGZhbHNlO1xuICAgICAgICAgIHZhciBkaXNwYXRjaFByb3BzQ2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgaWYgKHN0b3JlQ2hhbmdlZCB8fCBwcm9wc0NoYW5nZWQgJiYgc2hvdWxkVXBkYXRlU3RhdGVQcm9wcykge1xuICAgICAgICAgICAgbWFwU3RhdGVQcm9kdWNlZENoYW5nZSA9IHRoaXMudXBkYXRlU3RhdGVQcm9wcyhuZXh0UHJvcHMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChwcm9wc0NoYW5nZWQgJiYgc2hvdWxkVXBkYXRlRGlzcGF0Y2hQcm9wcykge1xuICAgICAgICAgICAgZGlzcGF0Y2hQcm9wc0NoYW5nZWQgPSB0aGlzLnVwZGF0ZURpc3BhdGNoUHJvcHMobmV4dFByb3BzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocHJvcHNDaGFuZ2VkIHx8IG1hcFN0YXRlUHJvZHVjZWRDaGFuZ2UgfHwgZGlzcGF0Y2hQcm9wc0NoYW5nZWQpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdGUobmV4dFByb3BzKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiBDb25uZWN0KHByb3BzLCBjb250ZXh0KSB7XG4gICAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIENvbm5lY3QpO1xuXG4gICAgICAgICAgX0NvbXBvbmVudC5jYWxsKHRoaXMsIHByb3BzLCBjb250ZXh0KTtcbiAgICAgICAgICB0aGlzLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICAgIHRoaXMuc3RvcmUgPSBwcm9wcy5zdG9yZSB8fCBjb250ZXh0LnN0b3JlO1xuXG4gICAgICAgICAgX2ludmFyaWFudDJbJ2RlZmF1bHQnXSh0aGlzLnN0b3JlLCAnQ291bGQgbm90IGZpbmQgXCJzdG9yZVwiIGluIGVpdGhlciB0aGUgY29udGV4dCBvciAnICsgKCdwcm9wcyBvZiBcIicgKyB0aGlzLmNvbnN0cnVjdG9yLmRpc3BsYXlOYW1lICsgJ1wiLiAnKSArICdFaXRoZXIgd3JhcCB0aGUgcm9vdCBjb21wb25lbnQgaW4gYSA8UHJvdmlkZXI+LCAnICsgKCdvciBleHBsaWNpdGx5IHBhc3MgXCJzdG9yZVwiIGFzIGEgcHJvcCB0byBcIicgKyB0aGlzLmNvbnN0cnVjdG9yLmRpc3BsYXlOYW1lICsgJ1wiLicpKTtcblxuICAgICAgICAgIHRoaXMuc3RhdGVQcm9wcyA9IGNvbXB1dGVTdGF0ZVByb3BzKHRoaXMuc3RvcmUsIHByb3BzKTtcbiAgICAgICAgICB0aGlzLmRpc3BhdGNoUHJvcHMgPSBjb21wdXRlRGlzcGF0Y2hQcm9wcyh0aGlzLnN0b3JlLCBwcm9wcyk7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IHsgc3RvcmVTdGF0ZTogbnVsbCB9O1xuICAgICAgICAgIHRoaXMudXBkYXRlU3RhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLmNvbXB1dGVOZXh0U3RhdGUgPSBmdW5jdGlvbiBjb21wdXRlTmV4dFN0YXRlKCkge1xuICAgICAgICAgIHZhciBwcm9wcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRoaXMucHJvcHMgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgICAgICByZXR1cm4gX2NvbXB1dGVOZXh0U3RhdGUodGhpcy5zdGF0ZVByb3BzLCB0aGlzLmRpc3BhdGNoUHJvcHMsIHByb3BzKTtcbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS51cGRhdGVTdGF0ZVByb3BzID0gZnVuY3Rpb24gdXBkYXRlU3RhdGVQcm9wcygpIHtcbiAgICAgICAgICB2YXIgcHJvcHMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0aGlzLnByb3BzIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAgICAgdmFyIG5leHRTdGF0ZVByb3BzID0gY29tcHV0ZVN0YXRlUHJvcHModGhpcy5zdG9yZSwgcHJvcHMpO1xuICAgICAgICAgIGlmIChfdXRpbHNTaGFsbG93RXF1YWwyWydkZWZhdWx0J10obmV4dFN0YXRlUHJvcHMsIHRoaXMuc3RhdGVQcm9wcykpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLnN0YXRlUHJvcHMgPSBuZXh0U3RhdGVQcm9wcztcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS51cGRhdGVEaXNwYXRjaFByb3BzID0gZnVuY3Rpb24gdXBkYXRlRGlzcGF0Y2hQcm9wcygpIHtcbiAgICAgICAgICB2YXIgcHJvcHMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0aGlzLnByb3BzIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAgICAgdmFyIG5leHREaXNwYXRjaFByb3BzID0gY29tcHV0ZURpc3BhdGNoUHJvcHModGhpcy5zdG9yZSwgcHJvcHMpO1xuICAgICAgICAgIGlmIChfdXRpbHNTaGFsbG93RXF1YWwyWydkZWZhdWx0J10obmV4dERpc3BhdGNoUHJvcHMsIHRoaXMuZGlzcGF0Y2hQcm9wcykpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmRpc3BhdGNoUHJvcHMgPSBuZXh0RGlzcGF0Y2hQcm9wcztcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS51cGRhdGVTdGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZVN0YXRlKCkge1xuICAgICAgICAgIHZhciBwcm9wcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRoaXMucHJvcHMgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgICAgICB0aGlzLm5leHRTdGF0ZSA9IHRoaXMuY29tcHV0ZU5leHRTdGF0ZShwcm9wcyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUuaXNTdWJzY3JpYmVkID0gZnVuY3Rpb24gaXNTdWJzY3JpYmVkKCkge1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgdGhpcy51bnN1YnNjcmliZSA9PT0gJ2Z1bmN0aW9uJztcbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS50cnlTdWJzY3JpYmUgPSBmdW5jdGlvbiB0cnlTdWJzY3JpYmUoKSB7XG4gICAgICAgICAgaWYgKHNob3VsZFN1YnNjcmliZSAmJiAhdGhpcy51bnN1YnNjcmliZSkge1xuICAgICAgICAgICAgdGhpcy51bnN1YnNjcmliZSA9IHRoaXMuc3RvcmUuc3Vic2NyaWJlKHRoaXMuaGFuZGxlQ2hhbmdlLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVDaGFuZ2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUudHJ5VW5zdWJzY3JpYmUgPSBmdW5jdGlvbiB0cnlVbnN1YnNjcmliZSgpIHtcbiAgICAgICAgICBpZiAodGhpcy51bnN1YnNjcmliZSkge1xuICAgICAgICAgICAgdGhpcy51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgdGhpcy51bnN1YnNjcmliZSA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLmNvbXBvbmVudERpZE1vdW50ID0gZnVuY3Rpb24gY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgICAgICAgdGhpcy50cnlTdWJzY3JpYmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS5jb21wb25lbnRXaWxsVW5tb3VudCA9IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgICAgICAgIHRoaXMudHJ5VW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS5oYW5kbGVDaGFuZ2UgPSBmdW5jdGlvbiBoYW5kbGVDaGFuZ2UoKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLnVuc3Vic2NyaWJlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdG9yZVN0YXRlOiB0aGlzLnN0b3JlLmdldFN0YXRlKClcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS5nZXRXcmFwcGVkSW5zdGFuY2UgPSBmdW5jdGlvbiBnZXRXcmFwcGVkSW5zdGFuY2UoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucmVmcy53cmFwcGVkSW5zdGFuY2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFdyYXBwZWRDb21wb25lbnQsIF9leHRlbmRzKHsgcmVmOiAnd3JhcHBlZEluc3RhbmNlJ1xuICAgICAgICAgIH0sIHRoaXMubmV4dFN0YXRlKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIENvbm5lY3Q7XG4gICAgICB9KShDb21wb25lbnQpO1xuXG4gICAgICBDb25uZWN0LmRpc3BsYXlOYW1lID0gJ0Nvbm5lY3QoJyArIGdldERpc3BsYXlOYW1lKFdyYXBwZWRDb21wb25lbnQpICsgJyknO1xuICAgICAgQ29ubmVjdC5XcmFwcGVkQ29tcG9uZW50ID0gV3JhcHBlZENvbXBvbmVudDtcbiAgICAgIENvbm5lY3QuY29udGV4dFR5cGVzID0ge1xuICAgICAgICBzdG9yZTogc3RvcmVTaGFwZVxuICAgICAgfTtcbiAgICAgIENvbm5lY3QucHJvcFR5cGVzID0ge1xuICAgICAgICBzdG9yZTogc3RvcmVTaGFwZVxuICAgICAgfTtcblxuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUuY29tcG9uZW50V2lsbFVwZGF0ZSA9IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxVcGRhdGUoKSB7XG4gICAgICAgICAgaWYgKHRoaXMudmVyc2lvbiA9PT0gdmVyc2lvbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFdlIGFyZSBob3QgcmVsb2FkaW5nIVxuICAgICAgICAgIHRoaXMudmVyc2lvbiA9IHZlcnNpb247XG5cbiAgICAgICAgICAvLyBVcGRhdGUgdGhlIHN0YXRlIGFuZCBiaW5kaW5ncy5cbiAgICAgICAgICB0aGlzLnRyeVN1YnNjcmliZSgpO1xuICAgICAgICAgIHRoaXMudXBkYXRlU3RhdGVQcm9wcygpO1xuICAgICAgICAgIHRoaXMudXBkYXRlRGlzcGF0Y2hQcm9wcygpO1xuICAgICAgICAgIHRoaXMudXBkYXRlU3RhdGUoKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIF9ob2lzdE5vblJlYWN0U3RhdGljczJbJ2RlZmF1bHQnXShDb25uZWN0LCBXcmFwcGVkQ29tcG9uZW50KTtcbiAgICB9O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSBjcmVhdGVQcm92aWRlcjtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF91dGlsc0NyZWF0ZVN0b3JlU2hhcGUgPSByZXF1aXJlKCcuLi91dGlscy9jcmVhdGVTdG9yZVNoYXBlJyk7XG5cbnZhciBfdXRpbHNDcmVhdGVTdG9yZVNoYXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzQ3JlYXRlU3RvcmVTaGFwZSk7XG5cbmZ1bmN0aW9uIGlzVXNpbmdPd25lckNvbnRleHQoUmVhY3QpIHtcbiAgdmFyIHZlcnNpb24gPSBSZWFjdC52ZXJzaW9uO1xuXG4gIGlmICh0eXBlb2YgdmVyc2lvbiAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHZhciBzZWN0aW9ucyA9IHZlcnNpb24uc3BsaXQoJy4nKTtcbiAgdmFyIG1ham9yID0gcGFyc2VJbnQoc2VjdGlvbnNbMF0sIDEwKTtcbiAgdmFyIG1pbm9yID0gcGFyc2VJbnQoc2VjdGlvbnNbMV0sIDEwKTtcblxuICByZXR1cm4gbWFqb3IgPT09IDAgJiYgbWlub3IgPT09IDEzO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcm92aWRlcihSZWFjdCkge1xuICB2YXIgQ29tcG9uZW50ID0gUmVhY3QuQ29tcG9uZW50O1xuICB2YXIgUHJvcFR5cGVzID0gUmVhY3QuUHJvcFR5cGVzO1xuICB2YXIgQ2hpbGRyZW4gPSBSZWFjdC5DaGlsZHJlbjtcblxuICB2YXIgc3RvcmVTaGFwZSA9IF91dGlsc0NyZWF0ZVN0b3JlU2hhcGUyWydkZWZhdWx0J10oUHJvcFR5cGVzKTtcbiAgdmFyIHJlcXVpcmVGdW5jdGlvbkNoaWxkID0gaXNVc2luZ093bmVyQ29udGV4dChSZWFjdCk7XG5cbiAgdmFyIGRpZFdhcm5BYm91dENoaWxkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIHdhcm5BYm91dEZ1bmN0aW9uQ2hpbGQoKSB7XG4gICAgaWYgKGRpZFdhcm5BYm91dENoaWxkIHx8IHJlcXVpcmVGdW5jdGlvbkNoaWxkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZGlkV2FybkFib3V0Q2hpbGQgPSB0cnVlO1xuICAgIGNvbnNvbGUuZXJyb3IoIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICdXaXRoIFJlYWN0IDAuMTQgYW5kIGxhdGVyIHZlcnNpb25zLCB5b3Ugbm8gbG9uZ2VyIG5lZWQgdG8gJyArICd3cmFwIDxQcm92aWRlcj4gY2hpbGQgaW50byBhIGZ1bmN0aW9uLicpO1xuICB9XG4gIGZ1bmN0aW9uIHdhcm5BYm91dEVsZW1lbnRDaGlsZCgpIHtcbiAgICBpZiAoZGlkV2FybkFib3V0Q2hpbGQgfHwgIXJlcXVpcmVGdW5jdGlvbkNoaWxkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZGlkV2FybkFib3V0Q2hpbGQgPSB0cnVlO1xuICAgIGNvbnNvbGUuZXJyb3IoIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICdXaXRoIFJlYWN0IDAuMTMsIHlvdSBuZWVkIHRvICcgKyAnd3JhcCA8UHJvdmlkZXI+IGNoaWxkIGludG8gYSBmdW5jdGlvbi4gJyArICdUaGlzIHJlc3RyaWN0aW9uIHdpbGwgYmUgcmVtb3ZlZCB3aXRoIFJlYWN0IDAuMTQuJyk7XG4gIH1cblxuICB2YXIgZGlkV2FybkFib3V0UmVjZWl2aW5nU3RvcmUgPSBmYWxzZTtcbiAgZnVuY3Rpb24gd2FybkFib3V0UmVjZWl2aW5nU3RvcmUoKSB7XG4gICAgaWYgKGRpZFdhcm5BYm91dFJlY2VpdmluZ1N0b3JlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZGlkV2FybkFib3V0UmVjZWl2aW5nU3RvcmUgPSB0cnVlO1xuICAgIGNvbnNvbGUuZXJyb3IoIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICc8UHJvdmlkZXI+IGRvZXMgbm90IHN1cHBvcnQgY2hhbmdpbmcgYHN0b3JlYCBvbiB0aGUgZmx5LiAnICsgJ0l0IGlzIG1vc3QgbGlrZWx5IHRoYXQgeW91IHNlZSB0aGlzIGVycm9yIGJlY2F1c2UgeW91IHVwZGF0ZWQgdG8gJyArICdSZWR1eCAyLnggYW5kIFJlYWN0IFJlZHV4IDIueCB3aGljaCBubyBsb25nZXIgaG90IHJlbG9hZCByZWR1Y2VycyAnICsgJ2F1dG9tYXRpY2FsbHkuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcmFja3QvcmVhY3QtcmVkdXgvcmVsZWFzZXMvJyArICd0YWcvdjIuMC4wIGZvciB0aGUgbWlncmF0aW9uIGluc3RydWN0aW9ucy4nKTtcbiAgfVxuXG4gIHZhciBQcm92aWRlciA9IChmdW5jdGlvbiAoX0NvbXBvbmVudCkge1xuICAgIF9pbmhlcml0cyhQcm92aWRlciwgX0NvbXBvbmVudCk7XG5cbiAgICBQcm92aWRlci5wcm90b3R5cGUuZ2V0Q2hpbGRDb250ZXh0ID0gZnVuY3Rpb24gZ2V0Q2hpbGRDb250ZXh0KCkge1xuICAgICAgcmV0dXJuIHsgc3RvcmU6IHRoaXMuc3RvcmUgfTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gUHJvdmlkZXIocHJvcHMsIGNvbnRleHQpIHtcbiAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBQcm92aWRlcik7XG5cbiAgICAgIF9Db21wb25lbnQuY2FsbCh0aGlzLCBwcm9wcywgY29udGV4dCk7XG4gICAgICB0aGlzLnN0b3JlID0gcHJvcHMuc3RvcmU7XG4gICAgfVxuXG4gICAgUHJvdmlkZXIucHJvdG90eXBlLmNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMgPSBmdW5jdGlvbiBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wcykge1xuICAgICAgdmFyIHN0b3JlID0gdGhpcy5zdG9yZTtcbiAgICAgIHZhciBuZXh0U3RvcmUgPSBuZXh0UHJvcHMuc3RvcmU7XG5cbiAgICAgIGlmIChzdG9yZSAhPT0gbmV4dFN0b3JlKSB7XG4gICAgICAgIHdhcm5BYm91dFJlY2VpdmluZ1N0b3JlKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFByb3ZpZGVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLnByb3BzLmNoaWxkcmVuO1xuXG4gICAgICBpZiAodHlwZW9mIGNoaWxkcmVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHdhcm5BYm91dEZ1bmN0aW9uQ2hpbGQoKTtcbiAgICAgICAgY2hpbGRyZW4gPSBjaGlsZHJlbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2FybkFib3V0RWxlbWVudENoaWxkKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBDaGlsZHJlbi5vbmx5KGNoaWxkcmVuKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFByb3ZpZGVyO1xuICB9KShDb21wb25lbnQpO1xuXG4gIFByb3ZpZGVyLmNoaWxkQ29udGV4dFR5cGVzID0ge1xuICAgIHN0b3JlOiBzdG9yZVNoYXBlLmlzUmVxdWlyZWRcbiAgfTtcbiAgUHJvdmlkZXIucHJvcFR5cGVzID0ge1xuICAgIHN0b3JlOiBzdG9yZVNoYXBlLmlzUmVxdWlyZWQsXG4gICAgY2hpbGRyZW46IChyZXF1aXJlRnVuY3Rpb25DaGlsZCA/IFByb3BUeXBlcy5mdW5jIDogUHJvcFR5cGVzLmVsZW1lbnQpLmlzUmVxdWlyZWRcbiAgfTtcblxuICByZXR1cm4gUHJvdmlkZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBjcmVhdGVTdG9yZVNoYXBlO1xuXG5mdW5jdGlvbiBjcmVhdGVTdG9yZVNoYXBlKFByb3BUeXBlcykge1xuICByZXR1cm4gUHJvcFR5cGVzLnNoYXBlKHtcbiAgICBzdWJzY3JpYmU6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgZGlzcGF0Y2g6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgZ2V0U3RhdGU6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1tcImRlZmF1bHRcIl07IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0gaXNQbGFpbk9iamVjdDtcbnZhciBmblRvU3RyaW5nID0gZnVuY3Rpb24gZm5Ub1N0cmluZyhmbikge1xuICByZXR1cm4gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZm4pO1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gb2JqIFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBhcmd1bWVudCBhcHBlYXJzIHRvIGJlIGEgcGxhaW4gb2JqZWN0LlxuICovXG5cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qob2JqKSB7XG4gIGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFyIHByb3RvID0gdHlwZW9mIG9iai5jb25zdHJ1Y3RvciA9PT0gJ2Z1bmN0aW9uJyA/IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopIDogT2JqZWN0LnByb3RvdHlwZTtcblxuICBpZiAocHJvdG8gPT09IG51bGwpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHZhciBjb25zdHJ1Y3RvciA9IHByb3RvLmNvbnN0cnVjdG9yO1xuXG4gIHJldHVybiB0eXBlb2YgY29uc3RydWN0b3IgPT09ICdmdW5jdGlvbicgJiYgY29uc3RydWN0b3IgaW5zdGFuY2VvZiBjb25zdHJ1Y3RvciAmJiBmblRvU3RyaW5nKGNvbnN0cnVjdG9yKSA9PT0gZm5Ub1N0cmluZyhPYmplY3QpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gc2hhbGxvd0VxdWFsO1xuXG5mdW5jdGlvbiBzaGFsbG93RXF1YWwob2JqQSwgb2JqQikge1xuICBpZiAob2JqQSA9PT0gb2JqQikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgdmFyIGtleXNBID0gT2JqZWN0LmtleXMob2JqQSk7XG4gIHZhciBrZXlzQiA9IE9iamVjdC5rZXlzKG9iakIpO1xuXG4gIGlmIChrZXlzQS5sZW5ndGggIT09IGtleXNCLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFRlc3QgZm9yIEEncyBrZXlzIGRpZmZlcmVudCBmcm9tIEIuXG4gIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXNBLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFoYXNPd24uY2FsbChvYmpCLCBrZXlzQVtpXSkgfHwgb2JqQVtrZXlzQVtpXV0gIT09IG9iakJba2V5c0FbaV1dKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1tcImRlZmF1bHRcIl07IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0gd3JhcEFjdGlvbkNyZWF0b3JzO1xuXG52YXIgX3JlZHV4ID0gcmVxdWlyZSgncmVkdXgnKTtcblxuZnVuY3Rpb24gd3JhcEFjdGlvbkNyZWF0b3JzKGFjdGlvbkNyZWF0b3JzKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoZGlzcGF0Y2gpIHtcbiAgICByZXR1cm4gX3JlZHV4LmJpbmRBY3Rpb25DcmVhdG9ycyhhY3Rpb25DcmVhdG9ycywgZGlzcGF0Y2gpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIvKipcbiAqIENvcHlyaWdodCAyMDE1LCBZYWhvbyEgSW5jLlxuICogQ29weXJpZ2h0cyBsaWNlbnNlZCB1bmRlciB0aGUgTmV3IEJTRCBMaWNlbnNlLiBTZWUgdGhlIGFjY29tcGFueWluZyBMSUNFTlNFIGZpbGUgZm9yIHRlcm1zLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSRUFDVF9TVEFUSUNTID0ge1xuICAgIGNoaWxkQ29udGV4dFR5cGVzOiB0cnVlLFxuICAgIGNvbnRleHRUeXBlczogdHJ1ZSxcbiAgICBkZWZhdWx0UHJvcHM6IHRydWUsXG4gICAgZGlzcGxheU5hbWU6IHRydWUsXG4gICAgZ2V0RGVmYXVsdFByb3BzOiB0cnVlLFxuICAgIG1peGluczogdHJ1ZSxcbiAgICBwcm9wVHlwZXM6IHRydWUsXG4gICAgdHlwZTogdHJ1ZVxufTtcblxudmFyIEtOT1dOX1NUQVRJQ1MgPSB7XG4gICAgbmFtZTogdHJ1ZSxcbiAgICBsZW5ndGg6IHRydWUsXG4gICAgcHJvdG90eXBlOiB0cnVlLFxuICAgIGNhbGxlcjogdHJ1ZSxcbiAgICBhcmd1bWVudHM6IHRydWUsXG4gICAgYXJpdHk6IHRydWVcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaG9pc3ROb25SZWFjdFN0YXRpY3ModGFyZ2V0Q29tcG9uZW50LCBzb3VyY2VDb21wb25lbnQpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHNvdXJjZUNvbXBvbmVudCk7XG4gICAgZm9yICh2YXIgaT0wOyBpPGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKCFSRUFDVF9TVEFUSUNTW2tleXNbaV1dICYmICFLTk9XTl9TVEFUSUNTW2tleXNbaV1dKSB7XG4gICAgICAgICAgICB0YXJnZXRDb21wb25lbnRba2V5c1tpXV0gPSBzb3VyY2VDb21wb25lbnRba2V5c1tpXV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0Q29tcG9uZW50O1xufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNSwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBVc2UgaW52YXJpYW50KCkgdG8gYXNzZXJ0IHN0YXRlIHdoaWNoIHlvdXIgcHJvZ3JhbSBhc3N1bWVzIHRvIGJlIHRydWUuXG4gKlxuICogUHJvdmlkZSBzcHJpbnRmLXN0eWxlIGZvcm1hdCAob25seSAlcyBpcyBzdXBwb3J0ZWQpIGFuZCBhcmd1bWVudHNcbiAqIHRvIHByb3ZpZGUgaW5mb3JtYXRpb24gYWJvdXQgd2hhdCBicm9rZSBhbmQgd2hhdCB5b3Ugd2VyZVxuICogZXhwZWN0aW5nLlxuICpcbiAqIFRoZSBpbnZhcmlhbnQgbWVzc2FnZSB3aWxsIGJlIHN0cmlwcGVkIGluIHByb2R1Y3Rpb24sIGJ1dCB0aGUgaW52YXJpYW50XG4gKiB3aWxsIHJlbWFpbiB0byBlbnN1cmUgbG9naWMgZG9lcyBub3QgZGlmZmVyIGluIHByb2R1Y3Rpb24uXG4gKi9cblxudmFyIGludmFyaWFudCA9IGZ1bmN0aW9uKGNvbmRpdGlvbiwgZm9ybWF0LCBhLCBiLCBjLCBkLCBlLCBmKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFyaWFudCByZXF1aXJlcyBhbiBlcnJvciBtZXNzYWdlIGFyZ3VtZW50Jyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFjb25kaXRpb24pIHtcbiAgICB2YXIgZXJyb3I7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihcbiAgICAgICAgJ01pbmlmaWVkIGV4Y2VwdGlvbiBvY2N1cnJlZDsgdXNlIHRoZSBub24tbWluaWZpZWQgZGV2IGVudmlyb25tZW50ICcgK1xuICAgICAgICAnZm9yIHRoZSBmdWxsIGVycm9yIG1lc3NhZ2UgYW5kIGFkZGl0aW9uYWwgaGVscGZ1bCB3YXJuaW5ncy4nXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXJncyA9IFthLCBiLCBjLCBkLCBlLCBmXTtcbiAgICAgIHZhciBhcmdJbmRleCA9IDA7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihcbiAgICAgICAgZm9ybWF0LnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJnc1thcmdJbmRleCsrXTsgfSlcbiAgICAgICk7XG4gICAgICBlcnJvci5uYW1lID0gJ0ludmFyaWFudCBWaW9sYXRpb24nO1xuICAgIH1cblxuICAgIGVycm9yLmZyYW1lc1RvUG9wID0gMTsgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCBpbnZhcmlhbnQncyBvd24gZnJhbWVcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbnZhcmlhbnQ7XG4iXX0=
