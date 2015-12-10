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
    login: login,
    logOff: logOff,
    initialize: initialize,
    externalProviderUrl: externalProviderUrl,
    externalProviderCompleted: externalProviderCompleted,
    registerExternal: registerExternal
};

},{"../state/user":15,"./":1,"./navigate":3,"store":"store"}],3:[function(require,module,exports){
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

},{"../state/dispatcher":13,"redux-router":"redux-router"}],4:[function(require,module,exports){
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

},{"./api/membership":2,"./router":12,"./state/dispatcher":13,"./state/reducers":14,"history":"history","react":"react","react-dom":"react-dom","react-redux":"react-redux","redux":"redux","redux-devtools":19,"redux-devtools/lib/react":26,"redux-router":"redux-router","redux-thunk":"redux-thunk"}],5:[function(require,module,exports){
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

},{"../../state/user":15,"react":"react","react-bootstrap":"react-bootstrap","react-redux":"react-redux"}],7:[function(require,module,exports){
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

},{"../../api/membership":2,"../../state/user":15,"react":"react","react-bootstrap":"react-bootstrap","react-redux":"react-redux"}],8:[function(require,module,exports){
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

},{"../../state/user":15,"./footer":9,"./header":10,"react":"react","react-bootstrap":"react-bootstrap","react-bootstrap-grid":"react-bootstrap-grid","react-redux":"react-redux"}],9:[function(require,module,exports){
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
                { right: true, onSelect: function onSelect(key, href) {
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
                { right: true },
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
                    _react2.default.createElement(_reactRouter.Route, { path: 'logon', component: _LogonView2.default })
                ),
                _react2.default.createElement(_reactRouter.Route, { path: '*', component: _NotFoundPage2.default })
            );
        }
    }]);

    return ApplicationRouter;
})(_react.Component);

exports.default = ApplicationRouter;

},{"./components/AboutView":5,"./components/HomeView":6,"./components/LogonView":7,"./components/MainPage":8,"./components/NotFoundPage":11,"react":"react","react-router":"react-router","redux-router":"redux-router"}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./user":15,"redux":"redux","redux-router":"redux-router"}],15:[function(require,module,exports){
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

},{"./dispatcher":13}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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
},{"./devTools":18,"react-redux/lib/components/createAll":154}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequire(obj) { return obj && obj.__esModule ? obj['default'] : obj; }

var _devTools = require('./devTools');

exports.devTools = _interopRequire(_devTools);

var _persistState = require('./persistState');

exports.persistState = _interopRequire(_persistState);
},{"./devTools":18,"./persistState":20}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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
},{"react":"react"}],22:[function(require,module,exports){
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
},{"./LogMonitorButton":23,"./LogMonitorEntry":24,"./themes":49,"react":"react"}],23:[function(require,module,exports){
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
},{"../utils/brighten":66,"react":"react"}],24:[function(require,module,exports){
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
},{"./LogMonitorEntryAction":25,"react":"react","react-json-tree":77}],25:[function(require,module,exports){
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
},{"react":"react","react-json-tree":77}],26:[function(require,module,exports){
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
},{"../createDevTools":17,"./DebugPanel":21,"./LogMonitor":22,"react":"react"}],27:[function(require,module,exports){
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
},{}],28:[function(require,module,exports){
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
},{}],29:[function(require,module,exports){
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
},{}],30:[function(require,module,exports){
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
},{}],31:[function(require,module,exports){
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
},{}],32:[function(require,module,exports){
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
},{}],33:[function(require,module,exports){
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
},{}],34:[function(require,module,exports){
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
},{}],35:[function(require,module,exports){
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
},{}],36:[function(require,module,exports){
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
},{}],37:[function(require,module,exports){
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
},{}],38:[function(require,module,exports){
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
},{}],39:[function(require,module,exports){
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
},{}],40:[function(require,module,exports){
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
},{}],41:[function(require,module,exports){
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
},{}],42:[function(require,module,exports){
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
},{}],43:[function(require,module,exports){
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
},{}],44:[function(require,module,exports){
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
},{}],45:[function(require,module,exports){
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
},{}],46:[function(require,module,exports){
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
},{}],47:[function(require,module,exports){
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
},{}],48:[function(require,module,exports){
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
},{}],49:[function(require,module,exports){
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
},{"./apathy":27,"./ashes":28,"./atelier-dune":29,"./atelier-forest":30,"./atelier-heath":31,"./atelier-lakeside":32,"./atelier-seaside":33,"./bespin":34,"./brewer":35,"./bright":36,"./chalk":37,"./codeschool":38,"./colors":39,"./default":40,"./eighties":41,"./embers":42,"./flat":43,"./google":44,"./grayscale":45,"./greenscreen":46,"./harmonic":47,"./hopscotch":48,"./isotope":50,"./marrakesh":51,"./mocha":52,"./monokai":53,"./nicinabox":54,"./ocean":55,"./paraiso":56,"./pop":57,"./railscasts":58,"./shapeshifter":59,"./solarized":60,"./summerfruit":61,"./threezerotwofour":62,"./tomorrow":63,"./tube":64,"./twilight":65}],50:[function(require,module,exports){
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
},{}],51:[function(require,module,exports){
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
},{}],52:[function(require,module,exports){
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
},{}],53:[function(require,module,exports){
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
},{}],54:[function(require,module,exports){
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
},{}],55:[function(require,module,exports){
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
},{}],56:[function(require,module,exports){
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
},{}],57:[function(require,module,exports){
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
},{}],58:[function(require,module,exports){
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
},{}],59:[function(require,module,exports){
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
},{}],60:[function(require,module,exports){
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
},{}],61:[function(require,module,exports){
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
},{}],62:[function(require,module,exports){
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
},{}],63:[function(require,module,exports){
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
},{}],64:[function(require,module,exports){
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
},{}],65:[function(require,module,exports){
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
},{}],66:[function(require,module,exports){
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
},{}],67:[function(require,module,exports){
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
},{"./JSONArrow":68,"./grab-node":76,"./mixins":79,"babel-runtime/helpers/class-call-check":92,"babel-runtime/helpers/extends":94,"babel-runtime/helpers/inherits":95,"babel-runtime/helpers/interop-require-default":96,"react":"react","react-mixin":151}],68:[function(require,module,exports){
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
},{"babel-runtime/helpers/class-call-check":92,"babel-runtime/helpers/extends":94,"babel-runtime/helpers/inherits":95,"babel-runtime/helpers/interop-require-default":96,"react":"react"}],69:[function(require,module,exports){
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
},{"./mixins":79,"./utils/hexToRgb":83,"babel-runtime/helpers/class-call-check":92,"babel-runtime/helpers/extends":94,"babel-runtime/helpers/inherits":95,"babel-runtime/helpers/interop-require-default":96,"react":"react","react-mixin":151}],70:[function(require,module,exports){
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
},{"./mixins":79,"./utils/hexToRgb":83,"babel-runtime/helpers/class-call-check":92,"babel-runtime/helpers/extends":94,"babel-runtime/helpers/inherits":95,"babel-runtime/helpers/interop-require-default":96,"react":"react","react-mixin":151}],71:[function(require,module,exports){
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
},{"./JSONArrow":68,"./grab-node":76,"./mixins":79,"babel-runtime/core-js/get-iterator":84,"babel-runtime/core-js/number/is-safe-integer":85,"babel-runtime/helpers/class-call-check":92,"babel-runtime/helpers/extends":94,"babel-runtime/helpers/inherits":95,"babel-runtime/helpers/interop-require-default":96,"react":"react","react-mixin":151}],72:[function(require,module,exports){
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
},{"./mixins":79,"./utils/hexToRgb":83,"babel-runtime/helpers/class-call-check":92,"babel-runtime/helpers/extends":94,"babel-runtime/helpers/inherits":95,"babel-runtime/helpers/interop-require-default":96,"react":"react","react-mixin":151}],73:[function(require,module,exports){
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
},{"./mixins":79,"./utils/hexToRgb":83,"babel-runtime/helpers/class-call-check":92,"babel-runtime/helpers/extends":94,"babel-runtime/helpers/inherits":95,"babel-runtime/helpers/interop-require-default":96,"react":"react","react-mixin":151}],74:[function(require,module,exports){
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
},{"./JSONArrow":68,"./grab-node":76,"./mixins":79,"babel-runtime/core-js/object/keys":89,"babel-runtime/helpers/class-call-check":92,"babel-runtime/helpers/extends":94,"babel-runtime/helpers/inherits":95,"babel-runtime/helpers/interop-require-default":96,"react":"react","react-mixin":151}],75:[function(require,module,exports){
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
},{"./mixins":79,"./utils/hexToRgb":83,"babel-runtime/helpers/class-call-check":92,"babel-runtime/helpers/extends":94,"babel-runtime/helpers/inherits":95,"babel-runtime/helpers/interop-require-default":96,"react":"react","react-mixin":151}],76:[function(require,module,exports){
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
},{"./JSONArrayNode":67,"./JSONBooleanNode":69,"./JSONDateNode":70,"./JSONIterableNode":71,"./JSONNullNode":72,"./JSONNumberNode":73,"./JSONObjectNode":74,"./JSONStringNode":75,"./obj-type":81,"babel-runtime/helpers/interop-require-default":96,"react":"react"}],77:[function(require,module,exports){
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
},{"./grab-node":76,"./themes/solarized":82,"babel-runtime/helpers/class-call-check":92,"babel-runtime/helpers/create-class":93,"babel-runtime/helpers/extends":94,"babel-runtime/helpers/inherits":95,"babel-runtime/helpers/interop-require-default":96,"react":"react"}],78:[function(require,module,exports){
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
},{}],79:[function(require,module,exports){
'use strict';

var _interopRequire = require('babel-runtime/helpers/interop-require')['default'];

exports.__esModule = true;

var _squashClickEvent = require('./squash-click-event');

exports.SquashClickEventMixin = _interopRequire(_squashClickEvent);

var _expandedStateHandler = require('./expanded-state-handler');

exports.ExpandedStateHandlerMixin = _interopRequire(_expandedStateHandler);
},{"./expanded-state-handler":78,"./squash-click-event":80,"babel-runtime/helpers/interop-require":97}],80:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = {
  handleClick: function handleClick(e) {
    e.stopPropagation();
  }
};
module.exports = exports["default"];
},{}],81:[function(require,module,exports){
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
},{"babel-runtime/core-js/symbol/iterator":91}],82:[function(require,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"dup":60}],83:[function(require,module,exports){
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
},{}],84:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/get-iterator"), __esModule: true };
},{"core-js/library/fn/get-iterator":98}],85:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/number/is-safe-integer"), __esModule: true };
},{"core-js/library/fn/number/is-safe-integer":99}],86:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/assign"), __esModule: true };
},{"core-js/library/fn/object/assign":100}],87:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/create"), __esModule: true };
},{"core-js/library/fn/object/create":101}],88:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/define-property"), __esModule: true };
},{"core-js/library/fn/object/define-property":102}],89:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/keys"), __esModule: true };
},{"core-js/library/fn/object/keys":103}],90:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/set-prototype-of"), __esModule: true };
},{"core-js/library/fn/object/set-prototype-of":104}],91:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/symbol/iterator"), __esModule: true };
},{"core-js/library/fn/symbol/iterator":105}],92:[function(require,module,exports){
"use strict";

exports["default"] = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

exports.__esModule = true;
},{}],93:[function(require,module,exports){
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
},{"babel-runtime/core-js/object/define-property":88}],94:[function(require,module,exports){
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
},{"babel-runtime/core-js/object/assign":86}],95:[function(require,module,exports){
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
},{"babel-runtime/core-js/object/create":87,"babel-runtime/core-js/object/set-prototype-of":90}],96:[function(require,module,exports){
"use strict";

exports["default"] = function (obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
};

exports.__esModule = true;
},{}],97:[function(require,module,exports){
"use strict";

exports["default"] = function (obj) {
  return obj && obj.__esModule ? obj["default"] : obj;
};

exports.__esModule = true;
},{}],98:[function(require,module,exports){
require('../modules/web.dom.iterable');
require('../modules/es6.string.iterator');
module.exports = require('../modules/core.get-iterator');
},{"../modules/core.get-iterator":143,"../modules/es6.string.iterator":149,"../modules/web.dom.iterable":150}],99:[function(require,module,exports){
require('../../modules/es6.number.is-safe-integer');
module.exports = require('../../modules/$.core').Number.isSafeInteger;
},{"../../modules/$.core":111,"../../modules/es6.number.is-safe-integer":145}],100:[function(require,module,exports){
require('../../modules/es6.object.assign');
module.exports = require('../../modules/$.core').Object.assign;
},{"../../modules/$.core":111,"../../modules/es6.object.assign":146}],101:[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function create(P, D){
  return $.create(P, D);
};
},{"../../modules/$":127}],102:[function(require,module,exports){
var $ = require('../../modules/$');
module.exports = function defineProperty(it, key, desc){
  return $.setDesc(it, key, desc);
};
},{"../../modules/$":127}],103:[function(require,module,exports){
require('../../modules/es6.object.keys');
module.exports = require('../../modules/$.core').Object.keys;
},{"../../modules/$.core":111,"../../modules/es6.object.keys":147}],104:[function(require,module,exports){
require('../../modules/es6.object.set-prototype-of');
module.exports = require('../../modules/$.core').Object.setPrototypeOf;
},{"../../modules/$.core":111,"../../modules/es6.object.set-prototype-of":148}],105:[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/web.dom.iterable');
module.exports = require('../../modules/$.wks')('iterator');
},{"../../modules/$.wks":141,"../../modules/es6.string.iterator":149,"../../modules/web.dom.iterable":150}],106:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],107:[function(require,module,exports){
module.exports = function(){ /* empty */ };
},{}],108:[function(require,module,exports){
var isObject = require('./$.is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./$.is-object":122}],109:[function(require,module,exports){
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
},{"./$.cof":110,"./$.wks":141}],110:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],111:[function(require,module,exports){
var core = module.exports = {version: '1.2.6'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],112:[function(require,module,exports){
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
},{"./$.a-function":106}],113:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],114:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./$.fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./$.fails":116}],115:[function(require,module,exports){
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
},{"./$.core":111,"./$.ctx":112,"./$.global":117}],116:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],117:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],118:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],119:[function(require,module,exports){
var $          = require('./$')
  , createDesc = require('./$.property-desc');
module.exports = require('./$.descriptors') ? function(object, key, value){
  return $.setDesc(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./$":127,"./$.descriptors":114,"./$.property-desc":131}],120:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./$.cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":110}],121:[function(require,module,exports){
// 20.1.2.3 Number.isInteger(number)
var isObject = require('./$.is-object')
  , floor    = Math.floor;
module.exports = function isInteger(it){
  return !isObject(it) && isFinite(it) && floor(it) === it;
};
},{"./$.is-object":122}],122:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],123:[function(require,module,exports){
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
},{"./$":127,"./$.hide":119,"./$.property-desc":131,"./$.set-to-string-tag":134,"./$.wks":141}],124:[function(require,module,exports){
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
},{"./$":127,"./$.export":115,"./$.has":118,"./$.hide":119,"./$.iter-create":123,"./$.iterators":126,"./$.library":128,"./$.redefine":132,"./$.set-to-string-tag":134,"./$.wks":141}],125:[function(require,module,exports){
module.exports = function(done, value){
  return {value: value, done: !!done};
};
},{}],126:[function(require,module,exports){
module.exports = {};
},{}],127:[function(require,module,exports){
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
},{}],128:[function(require,module,exports){
module.exports = true;
},{}],129:[function(require,module,exports){
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
},{"./$":127,"./$.fails":116,"./$.iobject":120,"./$.to-object":139}],130:[function(require,module,exports){
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
},{"./$.core":111,"./$.export":115,"./$.fails":116}],131:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],132:[function(require,module,exports){
module.exports = require('./$.hide');
},{"./$.hide":119}],133:[function(require,module,exports){
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
},{"./$":127,"./$.an-object":108,"./$.ctx":112,"./$.is-object":122}],134:[function(require,module,exports){
var def = require('./$').setDesc
  , has = require('./$.has')
  , TAG = require('./$.wks')('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"./$":127,"./$.has":118,"./$.wks":141}],135:[function(require,module,exports){
var global = require('./$.global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./$.global":117}],136:[function(require,module,exports){
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
},{"./$.defined":113,"./$.to-integer":137}],137:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],138:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./$.iobject')
  , defined = require('./$.defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./$.defined":113,"./$.iobject":120}],139:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":113}],140:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],141:[function(require,module,exports){
var store  = require('./$.shared')('wks')
  , uid    = require('./$.uid')
  , Symbol = require('./$.global').Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
};
},{"./$.global":117,"./$.shared":135,"./$.uid":140}],142:[function(require,module,exports){
var classof   = require('./$.classof')
  , ITERATOR  = require('./$.wks')('iterator')
  , Iterators = require('./$.iterators');
module.exports = require('./$.core').getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
},{"./$.classof":109,"./$.core":111,"./$.iterators":126,"./$.wks":141}],143:[function(require,module,exports){
var anObject = require('./$.an-object')
  , get      = require('./core.get-iterator-method');
module.exports = require('./$.core').getIterator = function(it){
  var iterFn = get(it);
  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
  return anObject(iterFn.call(it));
};
},{"./$.an-object":108,"./$.core":111,"./core.get-iterator-method":142}],144:[function(require,module,exports){
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
},{"./$.add-to-unscopables":107,"./$.iter-define":124,"./$.iter-step":125,"./$.iterators":126,"./$.to-iobject":138}],145:[function(require,module,exports){
// 20.1.2.5 Number.isSafeInteger(number)
var $export   = require('./$.export')
  , isInteger = require('./$.is-integer')
  , abs       = Math.abs;

$export($export.S, 'Number', {
  isSafeInteger: function isSafeInteger(number){
    return isInteger(number) && abs(number) <= 0x1fffffffffffff;
  }
});
},{"./$.export":115,"./$.is-integer":121}],146:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./$.export');

$export($export.S + $export.F, 'Object', {assign: require('./$.object-assign')});
},{"./$.export":115,"./$.object-assign":129}],147:[function(require,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = require('./$.to-object');

require('./$.object-sap')('keys', function($keys){
  return function keys(it){
    return $keys(toObject(it));
  };
});
},{"./$.object-sap":130,"./$.to-object":139}],148:[function(require,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = require('./$.export');
$export($export.S, 'Object', {setPrototypeOf: require('./$.set-proto').set});
},{"./$.export":115,"./$.set-proto":133}],149:[function(require,module,exports){
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
},{"./$.iter-define":124,"./$.string-at":136}],150:[function(require,module,exports){
require('./es6.array.iterator');
var Iterators = require('./$.iterators');
Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
},{"./$.iterators":126,"./es6.array.iterator":144}],151:[function(require,module,exports){
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

},{"object-assign":152,"smart-mixin":153}],152:[function(require,module,exports){
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

},{}],153:[function(require,module,exports){
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


},{}],154:[function(require,module,exports){
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
},{"./createConnect":155,"./createProvider":156}],155:[function(require,module,exports){
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

},{"../utils/createStoreShape":157,"../utils/isPlainObject":158,"../utils/shallowEqual":159,"../utils/wrapActionCreators":160,"_process":16,"hoist-non-react-statics":161,"invariant":162}],156:[function(require,module,exports){
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
},{"../utils/createStoreShape":157}],157:[function(require,module,exports){
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
},{}],158:[function(require,module,exports){
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
},{}],159:[function(require,module,exports){
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
},{}],160:[function(require,module,exports){
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
},{"redux":"redux"}],161:[function(require,module,exports){
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

},{}],162:[function(require,module,exports){
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

},{"_process":16}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDbGllbnRcXFNvdXJjZVxcYXBpXFxJbmRleC5qcyIsIkNsaWVudFxcU291cmNlXFxhcGlcXG1lbWJlcnNoaXAuanMiLCJDbGllbnRcXFNvdXJjZVxcYXBpXFxuYXZpZ2F0ZS5qcyIsIkNsaWVudFxcU291cmNlXFxhcHAuanMiLCJDbGllbnRcXFNvdXJjZVxcY29tcG9uZW50c1xcQWJvdXRWaWV3XFxBYm91dC5qcyIsIkNsaWVudFxcU291cmNlXFxjb21wb25lbnRzXFxIb21lVmlld1xcSW5kZXguanMiLCJDbGllbnRcXFNvdXJjZVxcY29tcG9uZW50c1xcTG9nb25WaWV3XFxJbmRleC5qcyIsIkNsaWVudFxcU291cmNlXFxjb21wb25lbnRzXFxNYWluUGFnZVxcSW5kZXguanMiLCJDbGllbnRcXFNvdXJjZVxcY29tcG9uZW50c1xcTWFpblBhZ2VcXGZvb3Rlci5qcyIsIkNsaWVudFxcU291cmNlXFxjb21wb25lbnRzXFxNYWluUGFnZVxcaGVhZGVyLmpzIiwiQ2xpZW50XFxTb3VyY2VcXGNvbXBvbmVudHNcXE5vdEZvdW5kUGFnZVxcaW5kZXguanMiLCJDbGllbnRcXFNvdXJjZVxccm91dGVyLmpzIiwiQ2xpZW50XFxTb3VyY2VcXHN0YXRlXFxkaXNwYXRjaGVyLmpzIiwiQ2xpZW50XFxTb3VyY2VcXHN0YXRlXFxyZWR1Y2Vycy5qcyIsIkNsaWVudFxcU291cmNlXFxzdGF0ZVxcdXNlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL2NyZWF0ZURldlRvb2xzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9kZXZUb29scy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3BlcnNpc3RTdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvRGVidWdQYW5lbC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvTG9nTW9uaXRvci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvTG9nTW9uaXRvckJ1dHRvbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvTG9nTW9uaXRvckVudHJ5LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC9Mb2dNb25pdG9yRW50cnlBY3Rpb24uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYXBhdGh5LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYXNoZXMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9hdGVsaWVyLWR1bmUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9hdGVsaWVyLWZvcmVzdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2F0ZWxpZXItaGVhdGguanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9hdGVsaWVyLWxha2VzaWRlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYXRlbGllci1zZWFzaWRlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYmVzcGluLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYnJld2VyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYnJpZ2h0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvY2hhbGsuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9jb2Rlc2Nob29sLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvY29sb3JzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvZGVmYXVsdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2VpZ2h0aWVzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvZW1iZXJzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvZmxhdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2dvb2dsZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2dyYXlzY2FsZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2dyZWVuc2NyZWVuLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvaGFybW9uaWMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9ob3BzY290Y2guanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2lzb3RvcGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9tYXJyYWtlc2guanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9tb2NoYS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL21vbm9rYWkuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9uaWNpbmFib3guanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9vY2Vhbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL3BhcmFpc28uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9wb3AuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9yYWlsc2Nhc3RzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvc2hhcGVzaGlmdGVyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvc29sYXJpemVkLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvc3VtbWVyZnJ1aXQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy90aHJlZXplcm90d29mb3VyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvdG9tb3Jyb3cuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy90dWJlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvdHdpbGlnaHQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3V0aWxzL2JyaWdodGVuLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL0pTT05BcnJheU5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTkFycm93LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL0pTT05Cb29sZWFuTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9KU09ORGF0ZU5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTkl0ZXJhYmxlTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9KU09OTnVsbE5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTk51bWJlck5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTk9iamVjdE5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTlN0cmluZ05vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvZ3JhYi1ub2RlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL21peGlucy9leHBhbmRlZC1zdGF0ZS1oYW5kbGVyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL21peGlucy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9taXhpbnMvc3F1YXNoLWNsaWNrLWV2ZW50LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL29iai10eXBlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL3V0aWxzL2hleFRvUmdiLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9nZXQtaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL251bWJlci9pcy1zYWZlLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9kZWZpbmUtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvc3ltYm9sL2l0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jcmVhdGUtY2xhc3MuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9mbi9nZXQtaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL251bWJlci9pcy1zYWZlLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9kZWZpbmUtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9mbi9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vc3ltYm9sL2l0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuYS1mdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmFkZC10by11bnNjb3BhYmxlcy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmFuLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmNsYXNzb2YuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jb2YuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jb3JlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuY3R4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZGVmaW5lZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmRlc2NyaXB0b3JzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZXhwb3J0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZmFpbHMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5nbG9iYWwuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5oYXMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5oaWRlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmlzLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5pcy1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5pdGVyLWNyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLml0ZXItZGVmaW5lLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlci1zdGVwLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlcmF0b3JzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5saWJyYXJ5LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQub2JqZWN0LWFzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLm9iamVjdC1zYXAuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5wcm9wZXJ0eS1kZXNjLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQucmVkZWZpbmUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5zZXQtcHJvdG8uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5zZXQtdG8tc3RyaW5nLXRhZy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnNoYXJlZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnN0cmluZy1hdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnRvLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC50by1pb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudG8tb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudWlkLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQud2tzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2NvcmUuZ2V0LWl0ZXJhdG9yLW1ldGhvZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9jb3JlLmdldC1pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuYXJyYXkuaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm51bWJlci5pcy1zYWZlLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm9iamVjdC5hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm9iamVjdC5rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3Quc2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LW1peGluL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1taXhpbi9ub2RlX21vZHVsZXMvb2JqZWN0LWFzc2lnbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtbWl4aW4vbm9kZV9tb2R1bGVzL3NtYXJ0LW1peGluL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1yZWR1eC9saWIvY29tcG9uZW50cy9jcmVhdGVBbGwuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L2xpYi9jb21wb25lbnRzL2NyZWF0ZUNvbm5lY3QuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L2xpYi9jb21wb25lbnRzL2NyZWF0ZVByb3ZpZGVyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1yZWR1eC9saWIvdXRpbHMvY3JlYXRlU3RvcmVTaGFwZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtcmVkdXgvbGliL3V0aWxzL2lzUGxhaW5PYmplY3QuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L2xpYi91dGlscy9zaGFsbG93RXF1YWwuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L2xpYi91dGlscy93cmFwQWN0aW9uQ3JlYXRvcnMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L25vZGVfbW9kdWxlcy9ob2lzdC1ub24tcmVhY3Qtc3RhdGljcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtcmVkdXgvbm9kZV9tb2R1bGVzL2ludmFyaWFudC9icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O0FDRUEsSUFBTSxXQUFXLEdBQUcsRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztBQUNyRCxJQUFNLFdBQVcsR0FBRyx3QkFBd0IsQ0FBQztBQUM3QyxJQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQzs7QUFFckMsU0FBUyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUU7O0FBRXZFLGFBQVMsV0FBVyxDQUFDLE9BQU8sRUFBRTtBQUMxQixlQUFPLFVBQVMsT0FBTyxFQUFFO0FBQ3JCLGdCQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMxQyxtQkFBTyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN4QyxDQUFBO0tBQ0o7O0FBRUQsMkJBQVE7QUFDSixXQUFHLEVBQUUsV0FBVyxHQUFHLEdBQUc7QUFDdEIsY0FBTSxFQUFFLElBQUk7O0FBRVosbUJBQVcsRUFBRSxXQUFXO0FBQ3hCLFlBQUksRUFBRSxJQUFJO0FBQ1YsZUFBTyxFQUFFLFdBQVc7QUFDcEIsZUFBTyxFQUFFLGVBQWU7QUFDeEIsYUFBSyxFQUFFLFdBQVcsQ0FBQyxZQUFZLENBQUM7S0FDbkMsQ0FBQyxDQUFDO0NBQ047O0FBRUQsU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFO0FBQ25ELFFBQUksQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7Q0FDN0U7O0FBRUQsU0FBUyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFO0FBQ3BELFFBQUksQ0FBQyxNQUFNLEVBQUUsbUNBQW1DLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7Q0FDL0Y7O2tCQUVjO0FBQ1gsZUFBVyxFQUFFLFdBQVc7QUFDeEIsWUFBUSxFQUFFLFFBQVE7QUFDbEIsUUFBSSxFQUFFLElBQUk7QUFDVixPQUFHLEVBQUUsR0FBRztDQUNYOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2xDRCxJQUFNLFVBQVUsR0FBRyxtQkFBbUI7Ozs7Ozs7Ozs7QUFBQyxBQVV2QyxTQUFTLEtBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFOztBQUVqRCxhQUFTLGNBQWMsQ0FBQyxRQUFRLEVBQUU7QUFDOUIsZ0JBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0tBQy9EOztBQUVELGFBQVMsV0FBVyxDQUFDLE9BQU8sRUFBRTtBQUMxQixZQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMxQyxjQXRCQyxPQUFPLENBc0JTLFdBQVcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUN4RDs7QUFFRCxRQUFJLElBQUksR0FBRywrQkFBK0IsR0FBRyxRQUFRLEdBQUcsWUFBWSxHQUFHLFFBQVEsQ0FBQztBQUNoRixRQUFJLGdCQUFnQixFQUFFO0FBQ2xCLFlBQUksR0FBRyxJQUFJLEdBQUcsYUFBYSxHQUFHLFdBQUksUUFBUSxDQUFDO0tBQzlDOztBQUVELFVBOUJLLE9BQU8sQ0E4QkssWUFBWSxFQUFFLENBQUM7O0FBRWhDLGVBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0NBQ3hEOztBQUVELFNBQVMsTUFBTSxHQUFHOztBQUVkLG9CQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFekIsVUF2Q0ssT0FBTyxDQXVDSyxNQUFNLEVBQUUsQ0FBQzs7QUFFMUIsdUJBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3BCOztBQUVELFNBQVMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFOztBQUU3QyxRQUFNLElBQUksR0FBRztBQUNULGFBQUssRUFBRSxLQUFLO0FBQ1osZ0JBQVEsRUFBRSxRQUFRO0FBQ2xCLHdCQUFnQixFQUFFLFlBQVksR0FBRyxJQUFJLEdBQUcsS0FBSztBQUM3QyxvQkFBWSxFQUFFLFlBQVk7S0FDN0IsQ0FBQzs7QUFFRixvQkFBTSxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUU1QixVQXZESyxPQUFPLENBdURLLEtBQUssQ0FBQyxRQUFRLEVBQUUsWUFBWSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQzs7QUFFOUQsdUJBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0NBQ3hCOztBQUVELFNBQVMsbUJBQW1CLENBQUMsUUFBUSxFQUFFO0FBQ25DLFFBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUM7O0FBRWpGLFdBQU8sV0FBSSxXQUFXLEdBQUcscUNBQXFDLEdBQUcsUUFBUSxHQUNuRSxpQ0FBaUMsR0FBRyxXQUFJLFFBQVEsR0FDaEQsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO0NBQ3hDOztBQUVELFNBQVMseUJBQXlCLENBQUMsUUFBUSxFQUFFOztBQUV6QyxhQUFTLGNBQWMsQ0FBQyxRQUFRLEVBQUU7QUFDOUIsZ0JBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDNUQ7O0FBRUQsYUFBUyxXQUFXLENBQUMsT0FBTyxFQUFFO0FBQzFCLFlBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzFDLGNBNUVDLE9BQU8sQ0E0RVMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDcEU7O0FBRUQsUUFBSSxRQUFRLENBQUMsZUFBZSxLQUFLLE9BQU8sRUFBRTtBQUN0QyxlQUFPLE1BaEZOLE9BQU8sQ0FnRmdCLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLHFCQUFxQixFQUFFLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0tBQzdIOztBQUVELFFBQU0sSUFBSSxHQUFHLFdBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxHQUFHLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQzs7QUFFeEcsZUFBSSxHQUFHLENBQUMsb0NBQW9DLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztDQUNwRjs7QUFFRCxTQUFTLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUU7O0FBRS9ELGFBQVMsY0FBYyxDQUFDLFFBQVEsRUFBRTtBQUM5QixnQkFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztLQUM1RDs7QUFFRCxhQUFTLFdBQVcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQ2xDLGNBL0ZDLE9BQU8sQ0ErRlMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkQ7O0FBRUQsUUFBTSxJQUFJLEdBQUc7QUFDVCxnQkFBUSxFQUFFLFFBQVE7QUFDbEIsZ0JBQVEsRUFBRSxRQUFRO0FBQ2xCLDJCQUFtQixFQUFFLG1CQUFtQjtLQUMzQyxDQUFDOztBQUVGLFVBeEdLLE9BQU8sQ0F3R0ssd0JBQXdCLEVBQUUsQ0FBQzs7QUFFNUMsZUFBSSxJQUFJLENBQUMsOEJBQThCLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztDQUMvRTs7QUFFRCxTQUFTLFVBQVUsR0FBRztBQUNsQixRQUFNLElBQUksR0FBRyxnQkFBTSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbkMsUUFBSSxJQUFJLEVBQUU7QUFDTixnQkFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDMUQ7Q0FDSjs7Ozs7O0FBQUEsa0JBTWM7QUFDWCxTQUFLLEVBQUUsS0FBSztBQUNaLFVBQU0sRUFBRSxNQUFNO0FBQ2QsY0FBVSxFQUFFLFVBQVU7QUFDdEIsdUJBQW1CLEVBQUUsbUJBQW1CO0FBQ3hDLDZCQUF5QixFQUFFLHlCQUF5QjtBQUNwRCxvQkFBZ0IsRUFBRSxnQkFBZ0I7Q0FDckM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDOUhELElBQUksRUFBRSxHQUFHLFNBQUwsRUFBRSxDQUFhLEdBQUcsRUFBRTtBQUNwQix5QkFBVyxRQUFRLENBQUMsaUJBSmYsU0FBUyxFQUlnQixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztDQUM3QyxDQUFDOztrQkFFYSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7OztBQ1B6QixZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JiLElBQU0sWUFBWSxHQUFHLFdBZFosT0FBTyxFQWVkLFdBZjZCLGVBQWUsdUJBZXRCLEVBQ3RCLGlCQVhPLGdCQUFnQixFQVdOLEVBQUUsYUFBYSxXQVZ6QixhQUFhLEFBVVksRUFBRSxDQUFDLEVBQ25DLG1CQWZPLFFBQVEsR0FlTCxFQUNWLG1CQWhCaUIsWUFBWSxFQWdCaEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FDeEUsUUFuQmlCLFdBQVcsQ0FtQmYsQ0FBQzs7QUFFZixJQUFNLEtBQUssR0FBRyxZQUFZLG9CQUFVLENBQUM7O0FBRXJDLHFCQUFXLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRS9CLElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQzs7QUFFcEUsbUJBQVMsTUFBTSxDQUNYOzs7SUFDSTtvQkE1QkMsUUFBUTtVQTRCQyxLQUFLLEVBQUUsS0FBSyxBQUFDO1FBQ25CLHFEQUFVO0tBQ0g7SUFDWDtnQkE1QlcsVUFBVTtVQTRCVCxHQUFHLE1BQUEsRUFBQyxLQUFLLE1BQUEsRUFBQyxNQUFNLE1BQUE7UUFDeEIsc0NBN0JILFFBQVEsSUE2QkssS0FBSyxFQUFFLEtBQUssQUFBQyxFQUFDLE9BQU8sVUE3QlosVUFBVSxBQTZCZSxHQUFHO0tBQ3RDO0NBQ1gsRUFDUCxjQUFjLENBQUMsQ0FBQzs7QUFFbkIscUJBQVcsVUFBVSxFQUFFLENBQUM7Ozs7O0FDMUN4QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRTdCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7O0FBRTFCLFVBQU0sb0JBQUc7QUFDTCxlQUFROzs7O1NBQW9CLENBQUU7S0FDakM7Q0FDSixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDRmpCLFFBQVE7Y0FBUixRQUFROzthQUFSLFFBQVE7OEJBQVIsUUFBUTs7c0VBQVIsUUFBUTs7O2lCQUFSLFFBQVE7O2lDQUVEO0FBQ0wsZ0JBQUksS0FBSyxHQUFLOzs7O2FBQWlCLEFBQUUsQ0FBQztBQUNsQyxnQkFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQzVCOzs7O2FBQWtCLEdBQ3BCLElBQUksQ0FBQzs7QUFFWCxtQkFDSTtnQ0FibUIsSUFBSTs7Z0JBY25CO29DQWRxQixHQUFHO3NCQWNuQixTQUFTLEVBQUMsV0FBVztvQkFDdEI7d0NBZnNCLEdBQUc7MEJBZXBCLEVBQUUsRUFBRSxFQUFFLEFBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxBQUFDO3dCQUNmOzRDQWhCdUIsU0FBUzs7NEJBaUI1Qjs7Ozs2QkFBd0I7eUJBQ2hCO3FCQUNWO29CQUNOO3dDQXBCc0IsR0FBRzswQkFvQnBCLEVBQUUsRUFBRSxFQUFFLEFBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxBQUFDO3dCQUNmLDhDQXJCQSxLQUFLLElBcUJFLE1BQU0sRUFBRSxLQUFLLEFBQUMsRUFBQyxPQUFPLEVBQUMsTUFBTSxHQUM1QjtxQkFDTjtpQkFDSjthQUNILENBQ1Q7U0FDTDs7O1dBdkJDLFFBQVE7VUFQYSxTQUFTOztBQWlDcEMsUUFBUSxDQUFDLFNBQVMsR0FBRztBQUNqQixXQUFPLEVBQUUsT0FsQ0csU0FBUyxDQWtDRixJQUFJLENBQUMsVUFBVTtDQUNyQyxDQUFDOztBQUVGLFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUNuQixXQUFPO0FBQ0gsZUFBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLE1BbENOLFVBQVUsQ0FrQ08sYUFBYTtLQUMxRCxDQUFDO0NBQ0w7O2tCQUVjLGdCQTFDTixPQUFPLEVBMENPLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDbkNsQyxTQUFTO2NBQVQsU0FBUzs7YUFBVCxTQUFTOzhCQUFULFNBQVM7O3NFQUFULFNBQVM7OztpQkFBVCxTQUFTOztrQ0FDRDt3QkFDbUMsSUFBSSxDQUFDLElBQUk7Z0JBQTFDLGFBQWEsU0FBYixhQUFhO2dCQUFFLGFBQWEsU0FBYixhQUFhOztBQUNwQyxnQkFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzFDLGdCQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDMUMsaUNBQVcsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUN4Qzs7O21DQUVVO0FBQ1AsZ0JBQUksQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUN6Qzs7O2lDQUVRO0FBQ0wsZ0JBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN2Qzs7OzZDQUVvQixRQUFRLEVBQUU7QUFDM0IsZ0JBQU0sbUJBQW1CLEdBQUcscUJBQVcsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckUsa0JBQU0sQ0FBQyxtQkFBbUIsR0FBRyxFQUFFLFFBQVEsRUFBRSxxQkFBVyx5QkFBeUIsRUFBRSxDQUFDO0FBQ2hGLGtCQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLDBDQUEwQyxDQUFDLENBQUM7U0FDeEc7Ozs0Q0FFbUI7QUFDaEIsZ0JBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO3lCQUNRLElBQUksQ0FBQyxLQUFLO2dCQUE5RCxRQUFRLFVBQVIsUUFBUTtnQkFBRSxtQkFBbUIsVUFBbkIsbUJBQW1CO2dCQUFFLGdCQUFnQixVQUFoQixnQkFBZ0I7O0FBRXZELGlDQUFXLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztTQUMxRjs7O2lDQUVRO0FBQ0wsZ0JBQUksS0FBSyxHQUFLOzs7O2FBQWUsQUFBRSxDQUFDO0FBQ2hDLGdCQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FDMUI7Ozs7YUFBa0IsR0FDcEIsSUFBSSxDQUFDOztBQUVYLGdCQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixHQUVsQztnQ0ExQ1EsS0FBSztrQkEwQ04sTUFBTSxFQUFFLEtBQUssQUFBQyxFQUFDLE9BQU8sRUFBQyxNQUFNO2dCQUNoQzs7O29CQUNJOzs7d0JBQUc7Ozs7NEJBQWtELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUTs7eUJBQVc7O3FCQUFLO29CQUN4Rjs7OztxQkFBNEY7aUJBQzFGO2dCQUNOLDhDQS9DWCxLQUFLO0FBZ0RVLHdCQUFJLEVBQUMsTUFBTTtBQUNYLCtCQUFXLEVBQUMsV0FBVztBQUN2QiwrQkFBVyxNQUFBO0FBQ1gsdUJBQUcsRUFBQyxlQUFlLEdBQUU7Z0JBQ3pCO29DQXBESixNQUFNO3NCQW9ETSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sRUFBQyxPQUFPLEVBQUMsU0FBUyxFQUFDLFdBQVcsRUFBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQUFBQzs7aUJBRWpHO2dCQUNSLE1BQU07Z0JBQ1A7OztvQkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU87aUJBQU87YUFDM0IsR0FHSjtnQ0E1REksS0FBSztrQkE0REYsTUFBTSxFQUFFLEtBQUssQUFBQyxFQUFDLE9BQU8sRUFBQyxNQUFNO2dCQUNoQyw4Q0E3RGYsS0FBSztBQThEYyx3QkFBSSxFQUFDLE1BQU07QUFDWCwrQkFBVyxFQUFDLG1CQUFtQjtBQUMvQiwrQkFBVyxNQUFBO0FBQ1gsdUJBQUcsRUFBQyxlQUFlLEdBQUU7Z0JBQ3pCLDhDQWxFZixLQUFLO0FBbUVjLHdCQUFJLEVBQUMsVUFBVTtBQUNmLCtCQUFXLEVBQUMsVUFBVTtBQUN0QiwrQkFBVyxNQUFBO0FBQ1gsdUJBQUcsRUFBQyxlQUFlLEdBQUU7Z0JBQ3pCO29DQXZFUixNQUFNO3NCQXVFVSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sRUFBQyxPQUFPLEVBQUMsU0FBUyxFQUFDLFdBQVcsRUFBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEFBQUM7O2lCQUV2RjtnQkFDSixNQUFNO2dCQUNYOzs7b0JBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPO2lCQUFPO2dCQUMvQjtvQ0E1RVIsTUFBTTtzQkE0RVUsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLEVBQUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxXQUFXLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxBQUFDO29CQUM5RixxQ0FBRyxTQUFTLEVBQUMsZ0JBQWdCLEdBQUs7O2lCQUM3QjtnQkFDVDtvQ0EvRVIsTUFBTTtzQkErRVUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLEVBQUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxXQUFXLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxBQUFDO29CQUMvRixxQ0FBRyxTQUFTLEVBQUMsbUJBQW1CLEdBQUs7O2lCQUNoQzthQUNMLEFBQ1gsQ0FBQzs7QUFFVixtQkFDSTtnQ0F0Rm1CLElBQUk7O2dCQXVGbkI7b0NBdkZxQixHQUFHO3NCQXVGbkIsU0FBUyxFQUFDLFdBQVc7b0JBQ3RCO3dDQXhGc0IsR0FBRzswQkF3RnBCLEVBQUUsRUFBRSxFQUFFLEFBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxBQUFDO3dCQUNmOzRDQXpGdUIsU0FBUzs7NEJBMEY1Qjs7Ozs2QkFBa0M7eUJBQzFCO3FCQUNWO29CQUNOO3dDQTdGc0IsR0FBRzswQkE2RnBCLEVBQUUsRUFBRSxFQUFFLEFBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxBQUFDO3dCQUNWLE9BQU87cUJBQ1Y7aUJBQ0o7YUFDSCxDQUNUO1NBQ0w7OztXQTlGQyxTQUFTO1VBUlksU0FBUzs7QUF5R3BDLFNBQVMsQ0FBQyxTQUFTLEdBQUc7QUFDbEIscUJBQWlCLEVBQUUsT0ExR1AsU0FBUyxDQTBHUSxJQUFJLENBQUMsVUFBVTtBQUM1QyxjQUFVLEVBQUUsT0EzR0EsU0FBUyxDQTJHQyxJQUFJLENBQUMsVUFBVTtBQUNyQyxXQUFPLEVBQUUsT0E1R0csU0FBUyxDQTRHRixNQUFNO0FBQ3pCLFlBQVEsRUFBRSxPQTdHRSxTQUFTLENBNkdELE1BQU07QUFDMUIsdUJBQW1CLEVBQUUsT0E5R1QsU0FBUyxDQThHVSxNQUFNO0FBQ3JDLG9CQUFnQixFQUFFLE9BL0dOLFNBQVMsQ0ErR08sTUFBTTtDQUNyQyxDQUFDOztBQUVGLFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUNuQixXQUFPO0FBQ0gsa0JBQVUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVU7QUFDakMseUJBQWlCLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssTUFoSGhCLFVBQVUsQ0FnSGlCLGlCQUFpQixJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLE1BaEh0RSxVQUFVLENBZ0h1RSx3QkFBd0I7QUFDbEksZUFBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTztBQUMzQixnQkFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUTtBQUM3QiwyQkFBbUIsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLG1CQUFtQjtBQUNuRCx3QkFBZ0IsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQjtLQUNoRCxDQUFDO0NBQ0w7O2tCQUVjLGdCQTVITixPQUFPLEVBNEhPLE1BQU0sQ0FBQyxDQUFDLFNBQVMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDbkhuQyxXQUFXO2NBQVgsV0FBVzs7YUFBWCxXQUFXOzhCQUFYLFdBQVc7O3NFQUFYLFdBQVc7OztpQkFBWCxXQUFXOztpQ0FDSjt5QkFDc0IsSUFBSSxDQUFDLEtBQUs7Z0JBQTdCLFFBQVEsVUFBUixRQUFRO2dCQUFFLElBQUksVUFBSixJQUFJOztBQUN0QixtQkFDSTs7O2dCQUNJO0FBQ0kscUNBQWlCLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQVZyQixVQUFVLENBVXNCLGFBQWEsQUFBQztBQUMzRCw0QkFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLEFBQUMsR0FBRztnQkFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRO2dCQUNwQjt3Q0FmUCxTQUFTOztvQkFnQkUscURBQVU7aUJBQ0Y7YUFDVixDQUNSO1NBQ0w7OztXQWRDLFdBQVc7VUFWVSxTQUFTOztBQTJCcEMsV0FBVyxDQUFDLFNBQVMsR0FBRztBQUNwQixRQUFJLEVBQUUsT0E1Qk0sU0FBUyxDQTRCTCxLQUFLLENBQUM7QUFDbEIsY0FBTSxFQUFFLGdCQUFNLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUF2QkwsVUFBVSxDQXVCTSxNQUFNLENBQUM7QUFDaEQsWUFBSSxFQUFFLE9BOUJFLFNBQVMsQ0E4QkQsTUFBTTtLQUN6QixDQUFDLENBQUMsVUFBVTtDQUNoQixDQUFDOztBQUVGLFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUNuQixXQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUMvQjs7a0JBRWMsZ0JBckNOLE9BQU8sRUFxQ08sTUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDcEMzQyxJQUFJLGNBQWMsR0FBRztBQUNqQixnQkFBWSxFQUFFLGdCQUFnQjtBQUM5QixZQUFRLEVBQUUsS0FBSztBQUNmLFVBQU0sRUFBRSxLQUFLO0FBQ2IsZ0JBQVksRUFBRSxLQUFLO0NBQ3RCLENBQUM7O0lBRUksTUFBTTtjQUFOLE1BQU07O2FBQU4sTUFBTTs4QkFBTixNQUFNOztzRUFBTixNQUFNOzs7aUJBQU4sTUFBTTs7aUNBQ0M7QUFDTCxtQkFDSTs7O2dCQUNJLHVDQUFLLEtBQUssRUFBRSxjQUFjLEFBQUMsR0FBRTtnQkFDN0I7Ozs7aUJBQXdCO2FBQ3RCLENBQ1I7U0FDTDs7O1dBUkMsTUFBTTtVQVRlLFNBQVM7O0FBb0JwQyxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ1psQixNQUFNO2NBQU4sTUFBTTs7YUFBTixNQUFNOzhCQUFOLE1BQU07O3NFQUFOLE1BQU07OztpQkFBTixNQUFNOztpQ0FFQzt5QkFDbUMsSUFBSSxDQUFDLEtBQUs7Z0JBQTFDLGlCQUFpQixVQUFqQixpQkFBaUI7Z0JBQUUsUUFBUSxVQUFSLFFBQVE7O0FBRW5DLGdCQUFJLEtBQUssR0FBRyxpQkFBaUIsR0FDdkIsQ0FDRTtnQ0FaVyxHQUFHO2tCQVlULFFBQVEsRUFBRSxrQkFBQyxHQUFHLEVBQUUsSUFBSTsrQkFBSSxtQkFBUyxFQUFFLENBQUMsSUFBSSxDQUFDO3FCQUFBLEFBQUM7Z0JBQzNDO29DQWJZLE9BQU87c0JBYVYsSUFBSSxFQUFDLE9BQU87O2lCQUFlO2dCQUNwQztvQ0FkWSxPQUFPO3NCQWNWLElBQUksRUFBQyxVQUFVOztpQkFBa0I7Z0JBQzFDO29DQWZZLE9BQU87c0JBZVYsSUFBSSxFQUFDLFFBQVE7O2lCQUFnQjthQUNwQyxFQUVOO2dDQWxCVyxHQUFHO2tCQWtCVCxLQUFLLEVBQUUsSUFBSSxBQUFDLEVBQUMsUUFBUSxFQUFFLGtCQUFDLEdBQUcsRUFBRSxJQUFJOytCQUFJLG1CQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUM7cUJBQUEsQUFBQztnQkFDeEQ7b0NBbkJZLE9BQU87c0JBbUJWLElBQUksRUFBQyxVQUFVO29CQUFHLFFBQVE7aUJBQVk7Z0JBQy9DO29DQXBCWSxPQUFPO3NCQW9CVixRQUFRLEVBQUU7bUNBQU0scUJBQVcsTUFBTSxFQUFFO3lCQUFBLEFBQUM7O2lCQUVuQzthQUNSLENBQ0gsR0FDSixDQUNDO2dDQTFCVyxHQUFHO2tCQTBCVCxRQUFRLEVBQUUsa0JBQUMsR0FBRyxFQUFFLElBQUk7K0JBQUksbUJBQVMsRUFBRSxDQUFDLElBQUksQ0FBQztxQkFBQSxBQUFDO2dCQUMzQztvQ0EzQlksT0FBTztzQkEyQlYsSUFBSSxFQUFDLFFBQVE7O2lCQUFnQjthQUNwQyxFQUVOO2dDQTlCVyxHQUFHO2tCQThCVCxLQUFLLEVBQUUsSUFBSSxBQUFDO2dCQUNiO29DQS9CWSxPQUFPO3NCQStCVixRQUFRLEVBQUU7bUNBQU0sbUJBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQzt5QkFBQSxBQUFDOztpQkFFckM7YUFDUixDQUNILENBQUM7O0FBRVosbUJBQ0k7Z0NBdENILE1BQU07O2dCQXVDQztvQ0F2Q0MsUUFBUTs7O2lCQXVDeUM7Z0JBQ2pELEtBQUs7YUFDRCxDQUNYO1NBQ0w7OztXQXRDQyxNQUFNO1VBUmUsU0FBUzs7QUFpRHBDLE1BQU0sQ0FBQyxTQUFTLEdBQUc7QUFDZixxQkFBaUIsRUFBRSxPQWxEUCxTQUFTLENBa0RRLElBQUksQ0FBQyxVQUFVO0FBQzVDLFlBQVEsRUFBRSxPQW5ERSxTQUFTLENBbURELE1BQU07Q0FDN0IsQ0FBQzs7a0JBRWEsTUFBTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNsRGYsWUFBWTtjQUFaLFlBQVk7O2FBQVosWUFBWTs4QkFBWixZQUFZOztzRUFBWixZQUFZOzs7aUJBQVosWUFBWTs7aUNBRUw7QUFDTCxtQkFDSTs7O2dCQUNJOzs7O2lCQUF1QjtnQkFDdkI7Ozs7aUJBQWtFO2FBQ2hFLENBQ1A7U0FDTjs7O1dBVEMsWUFBWTtVQUpTLFNBQVM7O2tCQWdCckIsWUFBWTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNMckIsaUJBQWlCO2NBQWpCLGlCQUFpQjs7YUFBakIsaUJBQWlCOzhCQUFqQixpQkFBaUI7O3NFQUFqQixpQkFBaUI7OztpQkFBakIsaUJBQWlCOztpQ0FDVjtBQUNMLG1CQUNJOzZCQVpILFdBQVc7O2dCQWFKO2lDQWRDLEtBQUs7c0JBY0MsSUFBSSxFQUFDLEdBQUcsRUFBQyxTQUFTLG9CQUFXO29CQUNoQywyQ0FmVSxVQUFVLElBZVIsU0FBUyxxQkFBWSxHQUFFOztvQkFDbkMsMkNBaEJILEtBQUssSUFnQkssSUFBSSxFQUFDLE1BQU0sRUFBQyxTQUFTLG9CQUFXLEdBQUc7b0JBQzFDLDJDQWpCSCxLQUFLLElBaUJLLElBQUksRUFBQyxPQUFPLEVBQUMsU0FBUyxxQkFBWSxHQUFHO29CQUM1QywyQ0FsQkgsS0FBSyxJQWtCSyxJQUFJLEVBQUMsT0FBTyxFQUFDLFNBQVMscUJBQVksR0FBRztpQkFDeEM7Z0JBQ1IsMkNBcEJDLEtBQUssSUFvQkMsSUFBSSxFQUFDLEdBQUcsRUFBQyxTQUFTLHdCQUFlLEdBQUU7YUFDaEMsQ0FDaEI7U0FDTDs7O1dBYkMsaUJBQWlCO1VBWEksU0FBUzs7a0JBMkJyQixpQkFBaUI7Ozs7Ozs7O0FDM0JoQyxJQUFJLFVBQVUsQ0FBQzs7QUFFZixTQUFTLEdBQUcsQ0FBQyxLQUFLLEVBQUU7QUFDaEIsY0FBVSxHQUFHLEtBQUssQ0FBQztDQUN0Qjs7QUFFRCxTQUFTLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDdEIsV0FBTyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Q0FDN0I7O2tCQUVjO0FBQ1gsT0FBRyxFQUFFLEdBQUc7QUFDUixZQUFRLEVBQUUsUUFBUTtDQUNyQjs7Ozs7Ozs7Ozs7Ozs7O0FDVEQsSUFBTSxRQUFRLEdBQUcsV0FKUixlQUFlLEVBSVM7QUFDN0IsVUFBTSxlQUpELGtCQUFrQixBQUlHO0FBQzFCLFFBQUksUUFKQyxPQUFPLEFBSUs7Q0FDcEIsQ0FBQyxDQUFDOztrQkFFWSxRQUFROzs7Ozs7Ozs7UUNrRVAsT0FBTyxHQUFQLE9BQU87Ozs7Ozs7O0FBMUV2QixJQUFJLFFBQVEsR0FBRyxxQkFBVyxRQUFRLENBQUM7O0FBRTVCLElBQU0sVUFBVSxXQUFWLFVBQVUsR0FBRztBQUN0QixvQkFBZ0IsRUFBRSxrQkFBa0I7QUFDcEMsaUJBQWEsRUFBRSxlQUFlO0FBQzlCLHFCQUFpQixFQUFFLG1CQUFtQjtBQUN0QyxVQUFNLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsbUJBQW1CLENBQUM7Q0FDckUsQ0FBQzs7QUFFSyxJQUFNLGtCQUFrQixXQUFsQixrQkFBa0IsR0FBRztBQUM5QixXQUFPLEVBQUUsU0FBUzs7QUFFbEIsVUFBTSxFQUFFLFFBQVE7QUFDaEIsa0JBQWMsRUFBRSxnQkFBZ0I7QUFDaEMsaUJBQWEsRUFBRSxlQUFlOztBQUU5QixzQkFBa0IsRUFBRSxvQkFBb0I7QUFDeEMsOEJBQTBCLEVBQUUsNEJBQTRCO0FBQ3hELDZCQUF5QixFQUFFLDJCQUEyQjtDQUN6RCxDQUFDOztBQUVLLElBQU0sT0FBTyxXQUFQLE9BQU8sR0FBRztBQUNuQixTQUFLLEVBQUUsZUFBUyxJQUFJLEVBQUUsYUFBYSxFQUFFO0FBQ2pDLGVBQU8sUUFBUSxDQUFDO0FBQ1osZ0JBQUksRUFBRSxrQkFBa0IsQ0FBQyxNQUFNO0FBQy9CLGdCQUFJLEVBQUUsSUFBSTtBQUNWLHlCQUFhLEVBQUUsYUFBYTtTQUMvQixDQUFDLENBQUM7S0FDTjs7QUFFRCxnQkFBWSxFQUFFLHdCQUFXO0FBQ3JCLGVBQU8sUUFBUSxDQUFDO0FBQ1osZ0JBQUksRUFBRSxrQkFBa0IsQ0FBQyxjQUFjO1NBQzFDLENBQUMsQ0FBQztLQUNOOztBQUVELGVBQVcsRUFBRSxxQkFBUyxPQUFPLEVBQUU7QUFDM0IsZUFBTyxRQUFRLENBQUM7QUFDWixnQkFBSSxFQUFFLGtCQUFrQixDQUFDLGFBQWE7QUFDdEMsbUJBQU8sRUFBRSxPQUFPO1NBQ25CLENBQUMsQ0FBQztLQUNOOztBQUVELFVBQU0sRUFBRSxrQkFBVztBQUNmLGVBQU8sUUFBUSxDQUFDO0FBQ1osZ0JBQUksRUFBRSxrQkFBa0IsQ0FBQyxPQUFPO1NBQ25DLENBQUMsQ0FBQztLQUNOOztBQUVELHFCQUFpQixFQUFFLDJCQUFTLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxnQkFBZ0IsRUFBRTtBQUN6RSxlQUFPLFFBQVEsQ0FBQztBQUNaLGdCQUFJLEVBQUUsa0JBQWtCLENBQUMsa0JBQWtCO0FBQzNDLG9CQUFRLEVBQUUsUUFBUTtBQUNsQiwrQkFBbUIsRUFBRSxtQkFBbUI7QUFDeEMsNEJBQWdCLEVBQUUsZ0JBQWdCO1NBQ3JDLENBQUMsQ0FBQztLQUNOOztBQUVELDRCQUF3QixFQUFFLG9DQUFZO0FBQ2xDLGVBQU8sUUFBUSxDQUFDO0FBQ1osZ0JBQUksRUFBRSxrQkFBa0IsQ0FBQywwQkFBMEI7U0FDdEQsQ0FBQyxDQUFDO0tBQ047O0FBRUQsMkJBQXVCLEVBQUUsaUNBQVUsT0FBTyxFQUFFO0FBQ3hDLGVBQU8sUUFBUSxDQUFDO0FBQ1osZ0JBQUksRUFBRSxrQkFBa0IsQ0FBQyx5QkFBeUI7QUFDbEQsbUJBQU8sRUFBRSxPQUFPO1NBQ25CLENBQUMsQ0FBQztLQUNOO0NBQ0osQ0FBQzs7QUFFRixJQUFNLGdCQUFnQixHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOztBQUUxRCxTQUFTLE9BQU8sR0FBbUM7UUFBbEMsS0FBSyx5REFBRyxnQkFBZ0I7UUFBRSxNQUFNOztBQUNwRCxZQUFRLE1BQU0sQ0FBQyxJQUFJO0FBQ2YsYUFBSyxrQkFBa0IsQ0FBQyxNQUFNO0FBQzFCLG1CQUFPO0FBQ0gsc0JBQU0sRUFBRSxVQUFVLENBQUMsYUFBYTtBQUNoQyxvQkFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO0FBQ2pCLDBCQUFVLEVBQUUsS0FBSzthQUNwQixDQUFDOztBQUFBLEFBRU4sYUFBSyxrQkFBa0IsQ0FBQyxhQUFhO0FBQ2pDLG1CQUFPO0FBQ0gsc0JBQU0sRUFBRSxVQUFVLENBQUMsZ0JBQWdCO0FBQ25DLG9CQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7QUFDaEIsMEJBQVUsRUFBRSxJQUFJO2FBQ25CLENBQUM7O0FBQUEsQUFFTixhQUFLLGtCQUFrQixDQUFDLGFBQWE7QUFDakMsbUJBQU87QUFDSCxzQkFBTSxFQUFFLFVBQVUsQ0FBQyxnQkFBZ0I7QUFDbkMsdUJBQU8sRUFBRSxNQUFNLENBQUMsT0FBTzthQUMxQixDQUFDOztBQUFBLEFBRU4sYUFBSyxrQkFBa0IsQ0FBQyxPQUFPO0FBQzNCLG1CQUFPO0FBQ0gsc0JBQU0sRUFBRSxVQUFVLENBQUMsZ0JBQWdCO2FBQ3RDLENBQUM7O0FBQUEsQUFFTixhQUFLLGtCQUFrQixDQUFDLGtCQUFrQjtBQUN0QyxtQkFBTztBQUNILHNCQUFNLEVBQUUsVUFBVSxDQUFDLGlCQUFpQjtBQUNwQyx3QkFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO0FBQ3pCLG1DQUFtQixFQUFFLE1BQU0sQ0FBQyxtQkFBbUI7QUFDL0MsZ0NBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjtBQUN6QywwQkFBVSxFQUFFLEtBQUs7YUFDcEIsQ0FBQzs7QUFBQSxBQUVOLGFBQUssa0JBQWtCLENBQUMsMEJBQTBCO0FBQzlDLG1CQUFPO0FBQ0gsc0JBQU0sRUFBRSxVQUFVLENBQUMsaUJBQWlCO0FBQ3BDLHdCQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVE7QUFDeEIsbUNBQW1CLEVBQUUsS0FBSyxDQUFDLG1CQUFtQjtBQUM5QyxnQ0FBZ0IsRUFBRSxLQUFLLENBQUMsZ0JBQWdCO0FBQ3hDLDBCQUFVLEVBQUUsSUFBSTthQUNuQixDQUFDOztBQUFBLEFBRU4sYUFBSyxrQkFBa0IsQ0FBQyx5QkFBeUI7QUFDN0MsbUJBQU87QUFDSCxzQkFBTSxFQUFFLFVBQVUsQ0FBQyxpQkFBaUI7QUFDcEMsdUJBQU8sRUFBRSxNQUFNLENBQUMsT0FBTztBQUN2Qix3QkFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO0FBQ3hCLG1DQUFtQixFQUFFLEtBQUssQ0FBQyxtQkFBbUI7QUFDOUMsZ0NBQWdCLEVBQUUsS0FBSyxDQUFDLGdCQUFnQjthQUMzQyxDQUFDOztBQUFBLEFBRU47QUFDSSxtQkFBTyxLQUFLLENBQUM7QUFBQSxLQUNwQjtDQUNKLENBQUM7OztBQ3BJRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7O0FDRkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgcmVxd2VzdCBmcm9tICdyZXF3ZXN0JztcclxuXHJcbmNvbnN0IGpzb25IZWFkZXJzID0geyAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nIH07XHJcbmNvbnN0IHNlcnZpY2VCYXNlID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAxMC8nO1xyXG5jb25zdCBjbGllbnRJZCA9ICdyZWFsVGltZVdlYkNsaWVudCc7XHJcblxyXG5mdW5jdGlvbiBjYWxsKHZlcmIsIGNvbnRlbnRUeXBlLCB1cmwsIGRhdGEsIHJlc3BvbnNlSGFuZGxlciwgZXJyb3JIYW5kbGVyKSB7XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIHBhcnNlRXJyb3JzKGhhbmRsZXIpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocmVxdWVzdCkge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIoZGF0YS5lcnJvcnMsIHJlcXVlc3QpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXF3ZXN0KHtcclxuICAgICAgICB1cmw6IHNlcnZpY2VCYXNlICsgdXJsLFxyXG4gICAgICAgIG1ldGhvZDogdmVyYixcclxuICAgICAgICAvL3R5cGU6ICdqc29uJyxcclxuICAgICAgICBjb250ZW50VHlwZTogY29udGVudFR5cGUsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBoZWFkZXJzOiBqc29uSGVhZGVycyxcclxuICAgICAgICBzdWNjZXNzOiByZXNwb25zZUhhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IHBhcnNlRXJyb3JzKGVycm9ySGFuZGxlcilcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXQodXJsLCBkYXRhLCByZXNwb25zZUhhbmRsZXIsIGVycm9ySGFuZGxlcikge1xyXG4gICAgY2FsbCgnZ2V0JywgJ2FwcGxpY2F0aW9uL2pzb24nLCB1cmwsIGRhdGEsIHJlc3BvbnNlSGFuZGxlciwgZXJyb3JIYW5kbGVyKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcG9zdCh1cmwsIGRhdGEsIHJlc3BvbnNlSGFuZGxlciwgZXJyb3JIYW5kbGVyKSB7XHJcbiAgICBjYWxsKCdwb3N0JywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcsIHVybCwgZGF0YSwgcmVzcG9uc2VIYW5kbGVyLCBlcnJvckhhbmRsZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgICBzZXJ2aWNlQmFzZTogc2VydmljZUJhc2UsXHJcbiAgICBjbGllbnRJZDogY2xpZW50SWQsXHJcbiAgICBwb3N0OiBwb3N0LFxyXG4gICAgZ2V0OiBnZXRcclxufSIsImltcG9ydCBhcGkgZnJvbSAnLi8nO1xyXG5pbXBvcnQgbmF2aWdhdGUgZnJvbSAnLi9uYXZpZ2F0ZSc7XHJcbmltcG9ydCB7IGFjdGlvbnMgYXMgdXNlclN0YXRlQWN0aW9ucyB9IGZyb20gJy4uL3N0YXRlL3VzZXInO1xyXG5pbXBvcnQgc3RvcmUgZnJvbSAnc3RvcmUnO1xyXG5cclxuLy9jb25zdCBwcm94eSA9ICQuY29ubmVjdGlvbi5tZW1iZXJzaGlwO1xyXG5jb25zdCBzdG9yYWdlS2V5ID0gJ2F1dGhvcml6YXRpb25EYXRhJztcclxuXHJcbi8vcHJveHkuY2xpZW50LkxvZ2luU3VjY2Vzc2Z1bCA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbi8vICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb24obmFtZSk7XHJcbi8vfTtcclxuXHJcbi8vZnVuY3Rpb24gbG9naW4odXNlck5hbWUsIHBhc3N3b3JkKSB7XHJcbi8vICAgIHByb3h5LnNlcnZlci5sb2dpbih1c2VyTmFtZSwgcGFzc3dvcmQpO1xyXG4vL31cclxuXHJcbmZ1bmN0aW9uIGxvZ2luKHVzZXJOYW1lLCBwYXNzd29yZCwgdXNlUmVmcmVzaFRva2Vucykge1xyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgbG9nZ2VkT24odXNlck5hbWUsIHJlc3BvbnNlLmFjY2Vzc190b2tlbiwgdXNlUmVmcmVzaFRva2Vucyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGFuZGxlRXJyb3IocmVxdWVzdCkge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gICAgICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb25GYWlsZWQoZGF0YS5lcnJvcl9kZXNjcmlwdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGRhdGEgPSAnZ3JhbnRfdHlwZT1wYXNzd29yZCZ1c2VybmFtZT0nICsgdXNlck5hbWUgKyAnJnBhc3N3b3JkPScgKyBwYXNzd29yZDtcclxuICAgIGlmICh1c2VSZWZyZXNoVG9rZW5zKSB7XHJcbiAgICAgICAgZGF0YSA9IGRhdGEgKyAnJmNsaWVudF9pZD0nICsgYXBpLmNsaWVudElkO1xyXG4gICAgfVxyXG5cclxuICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb25QZW5kaW5nKCk7XHJcblxyXG4gICAgYXBpLnBvc3QoJ3Rva2VuJywgZGF0YSwgaGFuZGxlUmVzcG9uc2UsIGhhbmRsZUVycm9yKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9nT2ZmKCkge1xyXG5cclxuICAgIHN0b3JlLnJlbW92ZShzdG9yYWdlS2V5KTtcclxuXHJcbiAgICB1c2VyU3RhdGVBY3Rpb25zLmxvZ29mZigpO1xyXG4gICAgXHJcbiAgICBuYXZpZ2F0ZS50bygnLycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2dnZWRPbih1c2VyTmFtZSwgdG9rZW4sIHJlZnJlc2hUb2tlbikge1xyXG4gICAgICAgICBcclxuICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgdG9rZW46IHRva2VuLCBcclxuICAgICAgICB1c2VyTmFtZTogdXNlck5hbWUsXHJcbiAgICAgICAgdXNlUmVmcmVzaFRva2VuczogcmVmcmVzaFRva2VuID8gdHJ1ZSA6IGZhbHNlLFxyXG4gICAgICAgIHJlZnJlc2hUb2tlbjogcmVmcmVzaFRva2VuXHJcbiAgICB9O1xyXG5cclxuICAgIHN0b3JlLnNldChzdG9yYWdlS2V5LCBkYXRhKTtcclxuICAgICAgICBcclxuICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb24odXNlck5hbWUsIHJlZnJlc2hUb2tlbiA/IHRydWUgOiBmYWxzZSk7XHJcbiAgICBcclxuICAgIG5hdmlnYXRlLnRvKCcvaG9tZScpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBleHRlcm5hbFByb3ZpZGVyVXJsKHByb3ZpZGVyKSB7XHJcbiAgICB2YXIgcmVkaXJlY3RVcmkgPSBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0ICsgJy9BY2NvdW50L0NvbXBsZXRlJztcclxuXHJcbiAgICByZXR1cm4gYXBpLnNlcnZpY2VCYXNlICsgXCJhcGkvQWNjb3VudC9FeHRlcm5hbExvZ2luP3Byb3ZpZGVyPVwiICsgcHJvdmlkZXJcclxuICAgICAgICArIFwiJnJlc3BvbnNlX3R5cGU9dG9rZW4mY2xpZW50X2lkPVwiICsgYXBpLmNsaWVudElkXHJcbiAgICAgICAgKyBcIiZyZWRpcmVjdF91cmk9XCIgKyByZWRpcmVjdFVyaTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXh0ZXJuYWxQcm92aWRlckNvbXBsZXRlZChmcmFnbWVudCkge1xyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgbG9nZ2VkT24ocmVzcG9uc2UudXNlck5hbWUsIHJlc3BvbnNlLmFjY2Vzc190b2tlbiwgbnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGFuZGxlRXJyb3IocmVxdWVzdCkge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gICAgICAgIHVzZXJTdGF0ZUFjdGlvbnMuYXNzb2NpYXRlRXh0ZXJuYWxGYWlsZWQoZGF0YS5lcnJvcl9kZXNjcmlwdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGZyYWdtZW50Lmhhc2xvY2FsYWNjb3VudCA9PT0gJ0ZhbHNlJykge1xyXG4gICAgICAgIHJldHVybiB1c2VyU3RhdGVBY3Rpb25zLmFzc29jaWF0ZUV4dGVybmFsKGZyYWdtZW50LnByb3ZpZGVyLCBmcmFnbWVudC5leHRlcm5hbF9hY2Nlc3NfdG9rZW4sIGZyYWdtZW50LmV4dGVybmFsX3VzZXJfbmFtZSk7ICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkYXRhID0gJ3Byb3ZpZGVyPScgKyBmcmFnbWVudC5wcm92aWRlciArICcmZXh0ZXJuYWxBY2Nlc3NUb2tlbj0nICsgZnJhZ21lbnQuZXh0ZXJuYWxfYWNjZXNzX3Rva2VuO1xyXG5cclxuICAgIGFwaS5nZXQoJ2FwaS9hY2NvdW50L09idGFpbkxvY2FsQWNjZXNzVG9rZW4nLCBkYXRhLCBoYW5kbGVSZXNwb25zZSwgaGFuZGxlRXJyb3IpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWdpc3RlckV4dGVybmFsKHVzZXJOYW1lLCBwcm92aWRlciwgZXh0ZXJuYWxBY2Nlc3NUb2tlbikge1xyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVSZXNwb25zZShyZXNwb25zZSkge1xyXG4gICAgICAgIGxvZ2dlZE9uKHJlc3BvbnNlLnVzZXJOYW1lLCByZXNwb25zZS5hY2Nlc3NfdG9rZW4sIG51bGwpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZUVycm9yKGVycm9ycywgcmVxdWVzdCkge1xyXG4gICAgICAgIHVzZXJTdGF0ZUFjdGlvbnMuYXNzb2NpYXRlRXh0ZXJuYWxGYWlsZWQoZXJyb3JzWzBdKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICAgIHVzZXJOYW1lOiB1c2VyTmFtZSxcclxuICAgICAgICBwcm92aWRlcjogcHJvdmlkZXIsXHJcbiAgICAgICAgZXh0ZXJuYWxBY2Nlc3NUb2tlbjogZXh0ZXJuYWxBY2Nlc3NUb2tlblxyXG4gICAgfTtcclxuXHJcbiAgICB1c2VyU3RhdGVBY3Rpb25zLmFzc29jaWF0ZUV4dGVybmFsUGVuZGluZygpO1xyXG5cclxuICAgIGFwaS5wb3N0KCdhcGkvYWNjb3VudC9yZWdpc3RlcmV4dGVybmFsJywgZGF0YSwgaGFuZGxlUmVzcG9uc2UsIGhhbmRsZUVycm9yKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcclxuICAgIGNvbnN0IGRhdGEgPSBzdG9yZS5nZXQoc3RvcmFnZUtleSk7XHJcbiAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIGxvZ2dlZE9uKGRhdGEudXNlck5hbWUsIGRhdGEudG9rZW4sIGRhdGEucmVmcmVzaFRva2VuKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8kLmNvbm5lY3Rpb24uaHViLnN0YXJ0KClcclxuLy8gICAgLmRvbmUoZnVuY3Rpb24oKXsgY29uc29sZS5sb2coJ05vdyBjb25uZWN0ZWQsIGNvbm5lY3Rpb24gSUQ9JyArICQuY29ubmVjdGlvbi5odWIuaWQpOyB9KVxyXG4vLyAgICAuZmFpbChmdW5jdGlvbigpeyBjb25zb2xlLmxvZygnQ291bGQgbm90IENvbm5lY3QhJyk7IH0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG4gICAgbG9naW46IGxvZ2luLFxyXG4gICAgbG9nT2ZmOiBsb2dPZmYsXHJcbiAgICBpbml0aWFsaXplOiBpbml0aWFsaXplLFxyXG4gICAgZXh0ZXJuYWxQcm92aWRlclVybDogZXh0ZXJuYWxQcm92aWRlclVybCxcclxuICAgIGV4dGVybmFsUHJvdmlkZXJDb21wbGV0ZWQ6IGV4dGVybmFsUHJvdmlkZXJDb21wbGV0ZWQsXHJcbiAgICByZWdpc3RlckV4dGVybmFsOiByZWdpc3RlckV4dGVybmFsXHJcbn0iLCJpbXBvcnQgeyBwdXNoU3RhdGUgfSBmcm9tICdyZWR1eC1yb3V0ZXInO1xyXG5pbXBvcnQgZGlzcGF0Y2hlciBmcm9tICcuLi9zdGF0ZS9kaXNwYXRjaGVyJztcclxuXHJcbnZhciB0byA9IGZ1bmN0aW9uICh1cmwpIHtcclxuICAgIGRpc3BhdGNoZXIuZGlzcGF0Y2gocHVzaFN0YXRlKG51bGwsIHVybCkpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgeyB0bzogdG8gfSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCBSZWFjdERvbSBmcm9tICdyZWFjdC1kb20nO1xyXG5pbXBvcnQgeyBjb21wb3NlLCBjcmVhdGVTdG9yZSwgYXBwbHlNaWRkbGV3YXJlIH0gZnJvbSAncmVkdXgnO1xyXG5pbXBvcnQgeyBQcm92aWRlciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHsgZGV2VG9vbHMsIHBlcnNpc3RTdGF0ZSB9IGZyb20gJ3JlZHV4LWRldnRvb2xzJztcclxuaW1wb3J0IHRodW5rIGZyb20gJ3JlZHV4LXRodW5rJztcclxuaW1wb3J0IHsgRGV2VG9vbHMsIERlYnVnUGFuZWwsIExvZ01vbml0b3IgfSBmcm9tICdyZWR1eC1kZXZ0b29scy9saWIvcmVhY3QnO1xyXG5pbXBvcnQgeyByZWR1eFJlYWN0Um91dGVyIH0gZnJvbSAncmVkdXgtcm91dGVyJztcclxuaW1wb3J0IHsgY3JlYXRlSGlzdG9yeSB9IGZyb20gJ2hpc3RvcnknO1xyXG5cclxuaW1wb3J0IG1lbWJlcnNoaXAgZnJvbSAnLi9hcGkvbWVtYmVyc2hpcCc7XHJcbmltcG9ydCByZWR1Y2VycyBmcm9tICcuL3N0YXRlL3JlZHVjZXJzJztcclxuaW1wb3J0IGRpc3BhdGNoZXIgZnJvbSAnLi9zdGF0ZS9kaXNwYXRjaGVyJztcclxuXHJcbmltcG9ydCBSb3V0ZXIgZnJvbSAnLi9yb3V0ZXInO1xyXG5cclxuY29uc3Qgc3RvcmVGYWN0b3J5ID0gY29tcG9zZShcclxuICBhcHBseU1pZGRsZXdhcmUodGh1bmspLFxyXG4gIHJlZHV4UmVhY3RSb3V0ZXIoeyBjcmVhdGVIaXN0b3J5IH0pLFxyXG4gIGRldlRvb2xzKCksXHJcbiAgcGVyc2lzdFN0YXRlKHdpbmRvdy5sb2NhdGlvbi5ocmVmLm1hdGNoKC9bPyZdZGVidWdfc2Vzc2lvbj0oW14mXSspXFxiLykpXHJcbikoY3JlYXRlU3RvcmUpO1xyXG5cclxuY29uc3Qgc3RvcmUgPSBzdG9yZUZhY3RvcnkocmVkdWNlcnMpO1xyXG5cclxuZGlzcGF0Y2hlci5zZXQoc3RvcmUuZGlzcGF0Y2gpO1xyXG5cclxubGV0IGNvbnRlbnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcGxpY2F0aW9uLWNvbnRlbnQnKTtcclxuXHJcblJlYWN0RG9tLnJlbmRlcigoXHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxQcm92aWRlciBzdG9yZT17c3RvcmV9PlxyXG4gICAgICAgICAgICA8Um91dGVyIC8+XHJcbiAgICAgICAgPC9Qcm92aWRlcj4gICAgIFxyXG4gICAgICAgIDxEZWJ1Z1BhbmVsIHRvcCByaWdodCBib3R0b20+XHJcbiAgICAgICAgICAgIDxEZXZUb29scyBzdG9yZT17c3RvcmV9IG1vbml0b3I9e0xvZ01vbml0b3J9IC8+XHJcbiAgICAgICAgPC9EZWJ1Z1BhbmVsPlxyXG4gICAgPC9kaXY+XHJcbiksIGNvbnRlbnRFbGVtZW50KTtcclxuXHJcbm1lbWJlcnNoaXAuaW5pdGlhbGl6ZSgpO1xyXG5cclxuIiwibGV0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcclxuXHJcbmxldCBBYm91dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuICg8ZGl2PkFib3V0IHVzITwvZGl2Pik7XHJcbiAgICB9LFxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWJvdXQ7IiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgSW5wdXQsIEJ1dHRvbiwgUGFuZWwsIEdyaWQsIFJvdywgQ29sLCBKdW1ib3Ryb24gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5cclxuaW1wb3J0IHsgYWN0aW9ucyBhcyB1c2VyQWN0aW9ucywgdXNlclN0YXR1cyB9IGZyb20gJy4uLy4uL3N0YXRlL3VzZXInXHJcblxyXG5jbGFzcyBIb21lUGFnZSBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIHZhciB0aXRsZSA9ICggPGgyPkFjdGl2aXR5PC9oMj4gKTtcclxuICAgICAgICB2YXIgbG9hZGVyID0gdGhpcy5wcm9wcy5sb2dvblBlbmRpbmdcclxuICAgICAgICAgICAgPyAoIDxkaXY+TG9hZGluZzwvZGl2PiApXHJcbiAgICAgICAgICAgIDogbnVsbDtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPEdyaWQ+XHJcbiAgICAgICAgICAgICAgICA8Um93IGNsYXNzTmFtZT1cInNob3ctZ3JpZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxDb2wgeHM9ezEyfSBtZD17OH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxKdW1ib3Ryb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDI+SG9tZSBzd2VldCBob21lPC9oMj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9KdW1ib3Ryb24+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICAgICAgPENvbCB4cz17MTJ9IG1kPXs0fT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFBhbmVsIGhlYWRlcj17dGl0bGV9IGJzU3R5bGU9XCJpbmZvXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvUGFuZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICA8L1Jvdz5cclxuICAgICAgICAgICAgPC9HcmlkPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkhvbWVQYWdlLnByb3BUeXBlcyA9IHtcclxuICAgIGFsbG93ZWQ6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXHJcbn07XHJcblxyXG5mdW5jdGlvbiBzZWxlY3Qoc3RhdGUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYWxsb3dlZDogc3RhdGUudXNlci5zdGF0dXMgPT09IHVzZXJTdGF0dXMuYXV0aGVudGljYXRlZFxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29ubmVjdChzZWxlY3QpKEhvbWVQYWdlKTtcclxuIiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgSW5wdXQsIEJ1dHRvbiwgUGFuZWwsIEdyaWQsIFJvdywgQ29sLCBKdW1ib3Ryb24gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5cclxuaW1wb3J0IHsgYWN0aW9ucyBhcyB1c2VyQWN0aW9ucywgdXNlclN0YXR1cyB9IGZyb20gJy4uLy4uL3N0YXRlL3VzZXInXHJcbmltcG9ydCBtZW1iZXJzaGlwIGZyb20gJy4uLy4uL2FwaS9tZW1iZXJzaGlwJ1xyXG5cclxuY2xhc3MgTG9nb25QYWdlIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIG9uQ2xpY2soKSB7XHJcbiAgICAgICAgY29uc3QgeyB1c2VyTmFtZUlucHV0LCBwYXNzd29yZElucHV0IH0gPSB0aGlzLnJlZnM7XHJcbiAgICAgICAgY29uc3QgdXNlck5hbWUgPSB1c2VyTmFtZUlucHV0LmdldFZhbHVlKCk7XHJcbiAgICAgICAgY29uc3QgcGFzc3dvcmQgPSBwYXNzd29yZElucHV0LmdldFZhbHVlKCk7XHJcbiAgICAgICAgbWVtYmVyc2hpcC5sb2dpbih1c2VyTmFtZSwgcGFzc3dvcmQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBmYWNlYm9vaygpIHtcclxuICAgICAgICB0aGlzLmF1dGhFeHRlcm5hbFByb3ZpZGVyKCdGYWNlYm9vaycpO1xyXG4gICAgfVxyXG5cclxuICAgIGdvb2dsZSgpIHtcclxuICAgICAgICB0aGlzLmF1dGhFeHRlcm5hbFByb3ZpZGVyKCdHb29nbGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBhdXRoRXh0ZXJuYWxQcm92aWRlcihwcm92aWRlcikge1xyXG4gICAgICAgIGNvbnN0IGV4dGVybmFsUHJvdmlkZXJVcmwgPSBtZW1iZXJzaGlwLmV4dGVybmFsUHJvdmlkZXJVcmwocHJvdmlkZXIpO1xyXG4gICAgICAgIHdpbmRvdy5hdXRoZW50aWNhdGlvblNjb3BlID0geyBjb21wbGV0ZTogbWVtYmVyc2hpcC5leHRlcm5hbFByb3ZpZGVyQ29tcGxldGVkIH07XHJcbiAgICAgICAgd2luZG93Lm9wZW4oZXh0ZXJuYWxQcm92aWRlclVybCwgXCJBdXRoZW50aWNhdGUgQWNjb3VudFwiLCBcImxvY2F0aW9uPTAsc3RhdHVzPTAsd2lkdGg9NjAwLGhlaWdodD03NTBcIik7XHJcbiAgICB9XHJcblxyXG4gICAgYXNzb2NpYXRlRXh0ZXJuYWwoKSB7XHJcbiAgICAgICAgY29uc3QgdXNlck5hbWUgPSB0aGlzLnJlZnMudXNlck5hbWVJbnB1dC5nZXRWYWx1ZSgpO1xyXG4gICAgICAgIGNvbnN0IHsgcHJvdmlkZXIsIGV4dGVybmFsQWNjZXNzVG9rZW4sIGV4dGVybmFsVXNlck5hbWUgfSA9IHRoaXMucHJvcHM7XHJcblxyXG4gICAgICAgIG1lbWJlcnNoaXAucmVnaXN0ZXJFeHRlcm5hbCh1c2VyTmFtZSwgcHJvdmlkZXIsIGV4dGVybmFsQWNjZXNzVG9rZW4sIGV4dGVybmFsVXNlck5hbWUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgdmFyIHRpdGxlID0gKCA8aDI+TG9nIE9uPC9oMj4gKTtcclxuICAgICAgICB2YXIgbG9hZGVyID0gdGhpcy5wcm9wcy5wcm9jZXNzaW5nXHJcbiAgICAgICAgICAgID8gKCA8ZGl2PkxvYWRpbmc8L2Rpdj4gKVxyXG4gICAgICAgICAgICA6IG51bGw7XHJcblxyXG4gICAgICAgIHZhciBjb250ZW50ID0gdGhpcy5wcm9wcy5hc3NvY2lhdGVFeHRlcm5hbFxyXG4gICAgICAgICAgICA/ICggICAgICAgIFxyXG4gICAgICAgICAgICAgICAgPFBhbmVsIGhlYWRlcj17dGl0bGV9IGJzU3R5bGU9XCJpbmZvXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+PHN0cm9uZz5Zb3UgaGF2ZSBzdWNjZXNzZnVsbHkgYXV0aGVudGljYXRlZCB3aXRoIHt0aGlzLnByb3BzLnByb3ZpZGVyfSA8L3N0cm9uZz4uPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5QbGVhc2UgZW50ZXIgYSB1c2VyIG5hbWUgYmVsb3cgZm9yIHRoaXMgc2l0ZSBhbmQgY2xpY2sgdGhlIFJlZ2lzdGVyIGJ1dHRvbiB0byBsb2cgaW4uPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxJbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiVXNlciBuYW1lXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGFzRmVlZGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmPVwidXNlck5hbWVJbnB1dFwiLz5cclxuICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGJzU3R5bGU9XCJzdWNjZXNzXCIgYnpTaXplPVwibGFyZ2VcIiBjbGFzc05hbWU9XCJidG4tYmxvY2tcIiBvbkNsaWNrPXt0aGlzLmFzc29jaWF0ZUV4dGVybmFsLmJpbmQodGhpcyl9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgQnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAge2xvYWRlcn1cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2Pnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L1BhbmVsPlxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgOiAoIFxyXG4gICAgICAgICAgICAgICAgICAgIDxQYW5lbCBoZWFkZXI9e3RpdGxlfSBic1N0eWxlPVwiaW5mb1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SW5wdXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRW1haWwgb3IgdXNlcm5hbWVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRmVlZGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cInVzZXJOYW1lSW5wdXRcIi8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiUGFzc3dvcmRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRmVlZGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cInBhc3N3b3JkSW5wdXRcIi8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gYnNTdHlsZT1cInN1Y2Nlc3NcIiBielNpemU9XCJsYXJnZVwiIGNsYXNzTmFtZT1cImJ0bi1ibG9ja1wiIG9uQ2xpY2s9e3RoaXMub25DbGljay5iaW5kKHRoaXMpfSA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMb2cgT25cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bG9hZGVyfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2Pnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gYnNTdHlsZT1cImZhY2Vib29rXCIgYnNTaXplPVwibGFyZ2VcIiBjbGFzc05hbWU9XCJidG4tYmxvY2tcIiBvbkNsaWNrPXt0aGlzLmZhY2Vib29rLmJpbmQodGhpcyl9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwiZmEgZmEtZmFjZWJvb2tcIj48L2k+IHwgQ29ubmVjdCB3aXRoIEZhY2Vib29rXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGJzU3R5bGU9XCJnb29nbGUtcGx1c1wiIGJzU2l6ZT1cImxhcmdlXCIgY2xhc3NOYW1lPVwiYnRuLWJsb2NrXCIgb25DbGljaz17dGhpcy5nb29nbGUuYmluZCh0aGlzKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJmYSBmYS1nb29nbGUtcGx1c1wiPjwvaT4gfCBDb25uZWN0IHdpdGggR29vZ2xlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj4gXHJcbiAgICAgICAgICAgICAgICAgICAgPC9QYW5lbD5cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxHcmlkPlxyXG4gICAgICAgICAgICAgICAgPFJvdyBjbGFzc05hbWU9XCJzaG93LWdyaWRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8Q29sIHhzPXsxMn0gbWQ9ezh9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SnVtYm90cm9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgyPldlIHdvdWxkIGxpa2UgdG8ga25vdyB5b3U8L2gyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0p1bWJvdHJvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L0NvbD5cclxuICAgICAgICAgICAgICAgICAgICA8Q29sIHhzPXsxMn0gbWQ9ezR9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2NvbnRlbnR9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICA8L1Jvdz5cclxuICAgICAgICAgICAgPC9HcmlkPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkxvZ29uUGFnZS5wcm9wVHlwZXMgPSB7XHJcbiAgICBhc3NvY2lhdGVFeHRlcm5hbDogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcclxuICAgIHByb2Nlc3Npbmc6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXHJcbiAgICBtZXNzYWdlOiBQcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgcHJvdmlkZXI6IFByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICBleHRlcm5hbEFjY2Vzc1Rva2VuOiBQcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgZXh0ZXJuYWxVc2VyTmFtZTogUHJvcFR5cGVzLnN0cmluZ1xyXG59O1xyXG5cclxuZnVuY3Rpb24gc2VsZWN0KHN0YXRlKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHByb2Nlc3Npbmc6IHN0YXRlLnVzZXIucHJvY2Vzc2luZyxcclxuICAgICAgICBhc3NvY2lhdGVFeHRlcm5hbDogc3RhdGUudXNlci5zdGF0dXMgPT09IHVzZXJTdGF0dXMuYXNzb2NpYXRlRXh0ZXJuYWwgfHwgc3RhdGUudXNlci5zdGF0dXMgPT09IHVzZXJTdGF0dXMuYWNjb2NpYXRlRXh0ZXJuYWxQZW5kaW5nLFxyXG4gICAgICAgIG1lc3NhZ2U6IHN0YXRlLnVzZXIubWVzc2FnZSxcclxuICAgICAgICBwcm92aWRlcjogc3RhdGUudXNlci5wcm92aWRlcixcclxuICAgICAgICBleHRlcm5hbEFjY2Vzc1Rva2VuOiBzdGF0ZS51c2VyLmV4dGVybmFsQWNjZXNzVG9rZW4sXHJcbiAgICAgICAgZXh0ZXJuYWxVc2VyTmFtZTogc3RhdGUudXNlci5leHRlcm5hbFVzZXJOYW1lXHJcbiAgICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb25uZWN0KHNlbGVjdCkoTG9nb25QYWdlKTtcclxuIiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgQnV0dG9uLCBQYW5lbCwgSnVtYm90cm9uIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwLWdyaWQnO1xyXG5cclxuaW1wb3J0IHsgYWN0aW9ucyBhcyB1c2VyQWN0aW9ucywgdXNlclN0YXR1cyB9IGZyb20gJy4uLy4uL3N0YXRlL3VzZXInXHJcbmltcG9ydCBIZWFkZXIgZnJvbSAnLi9oZWFkZXInO1xyXG5pbXBvcnQgRm9vdGVyIGZyb20gJy4vZm9vdGVyJztcclxuXHJcbmNsYXNzIEFwcGxpY2F0aW9uIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICBjb25zdCB7IGRpc3BhdGNoLCB1c2VyIH0gPSB0aGlzLnByb3BzO1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8SGVhZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgdXNlckF1dGhlbnRpY2F0ZWQ9e3VzZXIuc3RhdHVzID09IHVzZXJTdGF0dXMuYXV0aGVudGljYXRlZH1cclxuICAgICAgICAgICAgICAgICAgICB1c2VyTmFtZT17dXNlci5uYW1lfSAvPlxyXG4gICAgICAgICAgICAgICAge3RoaXMucHJvcHMuY2hpbGRyZW59XHJcbiAgICAgICAgICAgICAgICA8Q29udGFpbmVyPlxyXG4gICAgICAgICAgICAgICAgICAgIDxGb290ZXIgLz5cclxuICAgICAgICAgICAgICAgIDwvQ29udGFpbmVyPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5BcHBsaWNhdGlvbi5wcm9wVHlwZXMgPSB7XHJcbiAgICB1c2VyOiBQcm9wVHlwZXMuc2hhcGUoe1xyXG4gICAgICAgIHN0YXR1czogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKHVzZXJTdGF0dXMudmFsdWVzKSxcclxuICAgICAgICBuYW1lOiBQcm9wVHlwZXMuc3RyaW5nXHJcbiAgICB9KS5pc1JlcXVpcmVkXHJcbn07XHJcblxyXG5mdW5jdGlvbiBzZWxlY3Qoc3RhdGUpIHtcclxuICAgIHJldHVybiB7IHVzZXI6IHN0YXRlLnVzZXIgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29ubmVjdChzZWxlY3QpKEFwcGxpY2F0aW9uKTsiLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzLCBDb21wb25lbnQgfSBmcm9tICdyZWFjdCc7XHJcblxyXG52YXIgc2VwYXJhdG9yU3R5bGUgPSB7XHJcbiAgICBib3JkZXJCb3R0b206ICcxcHggc29saWQgI2NjYycsXHJcbiAgICBmb250U2l6ZTogJzFweCcsXHJcbiAgICBoZWlnaHQ6ICc4cHgnLFxyXG4gICAgbWFyZ2luQm90dG9tOiAnOHB4J1xyXG59O1xyXG5cclxuY2xhc3MgRm9vdGVyIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17c2VwYXJhdG9yU3R5bGV9Lz5cclxuICAgICAgICAgICAgICAgIDxkaXY+wqkgMjAxNSBTb2xvY288L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb290ZXI7IiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBSb3V0ZXIsIFJvdXRlLCBMaW5rIH0gZnJvbSAncmVhY3Qtcm91dGVyJ1xyXG5cclxuaW1wb3J0IHsgTmF2YmFyLCBOYXZCcmFuZCwgTmF2LCBOYXZJdGVtLCBOYXZEcm9wZG93biwgTWVudUl0ZW0gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tICdyZWFjdC1ib290c3RyYXAtZ3JpZCc7XHJcbmltcG9ydCBuYXZpZ2F0ZSBmcm9tICcuLy4uLy4uL2FwaS9uYXZpZ2F0ZSc7XHJcbmltcG9ydCBtZW1iZXJzaGlwIGZyb20gJy4vLi4vLi4vYXBpL21lbWJlcnNoaXAnO1xyXG5cclxuY2xhc3MgSGVhZGVyIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIFxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIGNvbnN0IHsgdXNlckF1dGhlbnRpY2F0ZWQsIHVzZXJOYW1lIH0gPSB0aGlzLnByb3BzO1xyXG5cclxuICAgICAgICB2YXIgaXRlbXMgPSB1c2VyQXV0aGVudGljYXRlZFxyXG4gICAgICAgICAgICA/IFsgKFxyXG4gICAgICAgICAgICAgICAgPE5hdiBvblNlbGVjdD17KGtleSwgaHJlZikgPT5uYXZpZ2F0ZS50byhocmVmKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj0nL2hvbWUnPkhvbWU8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj0nL2RldmljZXMnPkRldmljZXM8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj0nL2Fib3V0Jz5BYm91dDwvTmF2SXRlbT5cclxuICAgICAgICAgICAgICAgIDwvTmF2PlxyXG4gICAgICAgICAgICAgICAgKSwgKFxyXG4gICAgICAgICAgICAgICAgPE5hdiByaWdodD17dHJ1ZX0gb25TZWxlY3Q9eyhrZXksIGhyZWYpID0+bmF2aWdhdGUudG8oaHJlZil9PlxyXG4gICAgICAgICAgICAgICAgICAgIDxOYXZJdGVtIGhyZWY9Jy9wcm9maWxlJz57IHVzZXJOYW1lIH08L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gb25TZWxlY3Q9eygpID0+IG1lbWJlcnNoaXAubG9nT2ZmKCl9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBMb2cgT2ZmXHJcbiAgICAgICAgICAgICAgICAgICAgPC9OYXZJdGVtPlxyXG4gICAgICAgICAgICAgICAgPC9OYXY+XHJcbiAgICAgICAgICAgICAgICApIF1cclxuICAgICAgICAgICAgOiAgWyAoXHJcbiAgICAgICAgICAgICAgICA8TmF2IG9uU2VsZWN0PXsoa2V5LCBocmVmKSA9Pm5hdmlnYXRlLnRvKGhyZWYpfT5cclxuICAgICAgICAgICAgICAgICAgICA8TmF2SXRlbSBocmVmPScvYWJvdXQnPkFib3V0PC9OYXZJdGVtPlxyXG4gICAgICAgICAgICAgICAgPC9OYXY+XHJcbiAgICAgICAgICAgICAgICApLCAoXHJcbiAgICAgICAgICAgICAgICA8TmF2IHJpZ2h0PXt0cnVlfT5cclxuICAgICAgICAgICAgICAgICAgICA8TmF2SXRlbSBvblNlbGVjdD17KCkgPT4gbmF2aWdhdGUudG8oJy9sb2dvbicpfT5cclxuICAgICAgICAgICAgICAgICAgICBMb2cgT25cclxuICAgICAgICAgICAgICAgICAgICA8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICA8L05hdj5cclxuICAgICAgICAgICAgICAgICkgXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPE5hdmJhcj5cclxuICAgICAgICAgICAgICAgIDxOYXZCcmFuZD5Tb2xvY28gLSBSZWFjdGl2ZSBTdGFydGVyIEtpdDwvTmF2QnJhbmQ+XHJcbiAgICAgICAgICAgICAgICB7aXRlbXN9XHJcbiAgICAgICAgICAgIDwvTmF2YmFyPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkhlYWRlci5wcm9wVHlwZXMgPSB7XHJcbiAgICB1c2VyQXV0aGVudGljYXRlZDogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcclxuICAgIHVzZXJOYW1lOiBQcm9wVHlwZXMuc3RyaW5nXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBIZWFkZXI7XHJcbiIsImltcG9ydCBSZWFjdCwgeyBQcm9wVHlwZXMsIENvbXBvbmVudCB9IGZyb20gJ3JlYWN0JztcclxuXHJcblxyXG5cclxuY2xhc3MgTm90Rm91bmRQYWdlIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgIDxoMT5QYWdlIG5vdCBmb3VuZDwvaDE+XHJcbiAgICAgICAgICAgICAgICA8cD5Tb3JyeSwgYnV0IHRoZSBwYWdlIHlvdSB3ZXJlIHRyeWluZyB0byB2aWV3IGRvZXMgbm90IGV4aXN0LjwvcD5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IE5vdEZvdW5kUGFnZTtcclxuIiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBSb3V0ZXIsIFJvdXRlLCBMaW5rLCBJbmRleFJvdXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyJztcclxuaW1wb3J0IHsgUmVkdXhSb3V0ZXIgfSBmcm9tICdyZWR1eC1yb3V0ZXInO1xyXG5cclxuaW1wb3J0IE1haW5QYWdlIGZyb20gJy4vY29tcG9uZW50cy9NYWluUGFnZSc7XHJcbmltcG9ydCBIb21lVmlldyBmcm9tICcuL2NvbXBvbmVudHMvSG9tZVZpZXcnO1xyXG5pbXBvcnQgQWJvdXRWaWV3IGZyb20gJy4vY29tcG9uZW50cy9BYm91dFZpZXcnO1xyXG5pbXBvcnQgTG9nb25WaWV3IGZyb20gJy4vY29tcG9uZW50cy9Mb2dvblZpZXcnO1xyXG5cclxuaW1wb3J0IE5vdEZvdW5kUGFnZSBmcm9tICcuL2NvbXBvbmVudHMvTm90Rm91bmRQYWdlJztcclxuXHJcbmNsYXNzIEFwcGxpY2F0aW9uUm91dGVyIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8UmVkdXhSb3V0ZXI+XHJcbiAgICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9cIiBjb21wb25lbnQ9e01haW5QYWdlfT5cclxuICAgICAgICAgICAgICAgICAgICA8SW5kZXhSb3V0ZSBjb21wb25lbnQ9e0xvZ29uVmlld30vPi5cclxuICAgICAgICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cImhvbWVcIiBjb21wb25lbnQ9e0hvbWVWaWV3fSAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiYWJvdXRcIiBjb21wb25lbnQ9e0Fib3V0Vmlld30gLz5cclxuICAgICAgICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cImxvZ29uXCIgY29tcG9uZW50PXtMb2dvblZpZXd9IC8+XHJcbiAgICAgICAgICAgICAgICA8L1JvdXRlPlxyXG4gICAgICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIqXCIgY29tcG9uZW50PXtOb3RGb3VuZFBhZ2V9Lz5cclxuICAgICAgICAgICAgPC9SZWR1eFJvdXRlcj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBBcHBsaWNhdGlvblJvdXRlcjtcclxuIiwidmFyIGRpc3BhdGNoZXI7XHJcblxyXG5mdW5jdGlvbiBzZXQodmFsdWUpIHtcclxuICAgIGRpc3BhdGNoZXIgPSB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGlzcGF0Y2goYWN0aW9uKSB7XHJcbiAgICByZXR1cm4gZGlzcGF0Y2hlcihhY3Rpb24pO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgICBzZXQ6IHNldCxcclxuICAgIGRpc3BhdGNoOiBkaXNwYXRjaFxyXG59IiwiaW1wb3J0IHsgY29tYmluZVJlZHVjZXJzIH0gZnJvbSAncmVkdXgnO1xyXG5pbXBvcnQgeyByb3V0ZXJTdGF0ZVJlZHVjZXIgfSBmcm9tICdyZWR1eC1yb3V0ZXInO1xyXG5pbXBvcnQgeyByZWR1Y2VyIGFzIHVzZXJSZWR1Y2VyIH0gZnJvbSAnLi91c2VyJztcclxuXHJcbmNvbnN0IHJlZHVjZXJzID0gY29tYmluZVJlZHVjZXJzKHtcclxuICAgIHJvdXRlcjogcm91dGVyU3RhdGVSZWR1Y2VyLFxyXG4gICAgdXNlcjogdXNlclJlZHVjZXJcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCByZWR1Y2VyczsiLCJpbXBvcnQgZGlzcGF0Y2hlciBmcm9tICcuL2Rpc3BhdGNoZXInO1xyXG52YXIgZGlzcGF0Y2ggPSBkaXNwYXRjaGVyLmRpc3BhdGNoO1xyXG5cclxuZXhwb3J0IGNvbnN0IHVzZXJTdGF0dXMgPSB7XHJcbiAgICBub3RBdXRoZW50aWNhdGVkOiAnbm90QXV0aGVudGljYXRlZCcsXHJcbiAgICBhdXRoZW50aWNhdGVkOiAnYXV0aGVudGljYXRlZCcsXHJcbiAgICBhc3NvY2lhdGVFeHRlcm5hbDogJ2Fzc29jaWF0ZUV4dGVybmFsJyxcclxuICAgIHZhbHVlczogWydub3RBdXRoZW50aWNhdGVkJywgJ2F1dGhlbnRpY2F0ZWQnLCAnYXNzb2NpYXRlRXh0ZXJuYWwnXVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGFjdGlvbnNEZWZpbml0aW9ucyA9IHtcclxuICAgIExPR19PRkY6ICdMT0dfT0ZGJyxcclxuICAgIFxyXG4gICAgTE9HX09OOiAnTE9HX09OJyxcclxuICAgIExPR19PTl9QRU5ESU5HOiAnTE9HX09OX1BFTkRJTkcnLFxyXG4gICAgTE9HX09OX0ZBSUxFRDogJ0xPR19PTl9GQUlMRUQnLFxyXG5cclxuICAgIEFTU09DSUFURV9FWFRFUk5BTDogJ0FTU09DSUFURV9FWFRFUk5BTCcsXHJcbiAgICBBU1NPQ0lBVEVfRVhURVJOQUxfUEVORElORzogJ0FTU09DSUFURV9FWFRFUk5BTF9QRU5ESU5HJyxcclxuICAgIEFTU09DSUFURV9FWFRFUk5BTF9GQUlMRUQ6ICdBU1NPQ0lBVEVfRVhURVJOQUxfRkFJTEVEJ1xyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGFjdGlvbnMgPSB7XHJcbiAgICBsb2dvbjogZnVuY3Rpb24obmFtZSwgcmVmcmVzaFRva2Vucykge1xyXG4gICAgICAgIHJldHVybiBkaXNwYXRjaCh7XHJcbiAgICAgICAgICAgIHR5cGU6IGFjdGlvbnNEZWZpbml0aW9ucy5MT0dfT04sXHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgIHJlZnJlc2hUb2tlbnM6IHJlZnJlc2hUb2tlbnNcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9nb25QZW5kaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gZGlzcGF0Y2goe1xyXG4gICAgICAgICAgICB0eXBlOiBhY3Rpb25zRGVmaW5pdGlvbnMuTE9HX09OX1BFTkRJTkdcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9nb25GYWlsZWQ6IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgICAgICByZXR1cm4gZGlzcGF0Y2goe1xyXG4gICAgICAgICAgICB0eXBlOiBhY3Rpb25zRGVmaW5pdGlvbnMuTE9HX09OX0ZBSUxFRCxcclxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2dvZmY6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBkaXNwYXRjaCh7XHJcbiAgICAgICAgICAgIHR5cGU6IGFjdGlvbnNEZWZpbml0aW9ucy5MT0dfT0ZGXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFzc29jaWF0ZUV4dGVybmFsOiBmdW5jdGlvbihwcm92aWRlciwgZXh0ZXJuYWxBY2Nlc3NUb2tlbiwgZXh0ZXJuYWxVc2VyTmFtZSkge1xyXG4gICAgICAgIHJldHVybiBkaXNwYXRjaCh7XHJcbiAgICAgICAgICAgIHR5cGU6IGFjdGlvbnNEZWZpbml0aW9ucy5BU1NPQ0lBVEVfRVhURVJOQUwsXHJcbiAgICAgICAgICAgIHByb3ZpZGVyOiBwcm92aWRlcixcclxuICAgICAgICAgICAgZXh0ZXJuYWxBY2Nlc3NUb2tlbjogZXh0ZXJuYWxBY2Nlc3NUb2tlbixcclxuICAgICAgICAgICAgZXh0ZXJuYWxVc2VyTmFtZTogZXh0ZXJuYWxVc2VyTmFtZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgYXNzb2NpYXRlRXh0ZXJuYWxQZW5kaW5nOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKHtcclxuICAgICAgICAgICAgdHlwZTogYWN0aW9uc0RlZmluaXRpb25zLkFTU09DSUFURV9FWFRFUk5BTF9QRU5ESU5HXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFzc29jaWF0ZUV4dGVybmFsRmFpbGVkOiBmdW5jdGlvbiAobWVzc2FnZSkge1xyXG4gICAgICAgIHJldHVybiBkaXNwYXRjaCh7XHJcbiAgICAgICAgICAgIHR5cGU6IGFjdGlvbnNEZWZpbml0aW9ucy5BU1NPQ0lBVEVfRVhURVJOQUxfRkFJTEVELCBcclxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3Qgbm90QXV0aGVudGljYXRlZCA9IHsgc3RhdHVzOiB1c2VyU3RhdHVzLm5vdEF1dGhlbnRpY2F0ZWQgfTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VyKHN0YXRlID0gbm90QXV0aGVudGljYXRlZCwgYWN0aW9uKSB7XHJcbiAgICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XHJcbiAgICAgICAgY2FzZSBhY3Rpb25zRGVmaW5pdGlvbnMuTE9HX09OOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiB1c2VyU3RhdHVzLmF1dGhlbnRpY2F0ZWQsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBhY3Rpb24ubmFtZSxcclxuICAgICAgICAgICAgICAgIHByb2Nlc3Npbmc6IGZhbHNlXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGNhc2UgYWN0aW9uc0RlZmluaXRpb25zLkxPR19PTl9QRU5ESUc6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHVzZXJTdGF0dXMubm90QXV0aGVudGljYXRlZCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IHN0YXRlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzaW5nOiB0cnVlXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGNhc2UgYWN0aW9uc0RlZmluaXRpb25zLkxPR19PTl9GQUlMRUQ6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHVzZXJTdGF0dXMubm90QXV0aGVudGljYXRlZCwgXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBhY3Rpb24ubWVzc2FnZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBjYXNlIGFjdGlvbnNEZWZpbml0aW9ucy5MT0dfT0ZGOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiB1c2VyU3RhdHVzLm5vdEF1dGhlbnRpY2F0ZWRcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY2FzZSBhY3Rpb25zRGVmaW5pdGlvbnMuQVNTT0NJQVRFX0VYVEVSTkFMOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiB1c2VyU3RhdHVzLmFzc29jaWF0ZUV4dGVybmFsLFxyXG4gICAgICAgICAgICAgICAgcHJvdmlkZXI6IGFjdGlvbi5wcm92aWRlcixcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsQWNjZXNzVG9rZW46IGFjdGlvbi5leHRlcm5hbEFjY2Vzc1Rva2VuLFxyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxVc2VyTmFtZTogYWN0aW9uLmV4dGVybmFsVXNlck5hbWUsXHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzaW5nOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBjYXNlIGFjdGlvbnNEZWZpbml0aW9ucy5BU1NPQ0lBVEVfRVhURVJOQUxfUEVORElORzpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogdXNlclN0YXR1cy5hc3NvY2lhdGVFeHRlcm5hbCxcclxuICAgICAgICAgICAgICAgIHByb3ZpZGVyOiBzdGF0ZS5wcm92aWRlcixcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsQWNjZXNzVG9rZW46IHN0YXRlLmV4dGVybmFsQWNjZXNzVG9rZW4sXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbFVzZXJOYW1lOiBzdGF0ZS5leHRlcm5hbFVzZXJOYW1lLFxyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc2luZzogdHJ1ZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBjYXNlIGFjdGlvbnNEZWZpbml0aW9ucy5BU1NPQ0lBVEVfRVhURVJOQUxfRkFJTEVEOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiB1c2VyU3RhdHVzLmFzc29jaWF0ZUV4dGVybmFsLCBcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGFjdGlvbi5tZXNzYWdlLFxyXG4gICAgICAgICAgICAgICAgcHJvdmlkZXI6IHN0YXRlLnByb3ZpZGVyLFxyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxBY2Nlc3NUb2tlbjogc3RhdGUuZXh0ZXJuYWxBY2Nlc3NUb2tlbixcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsVXNlck5hbWU6IHN0YXRlLmV4dGVybmFsVXNlck5hbWVcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgfVxyXG59OyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBjcmVhdGVEZXZUb29scztcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF9yZWFjdFJlZHV4TGliQ29tcG9uZW50c0NyZWF0ZUFsbCA9IHJlcXVpcmUoJ3JlYWN0LXJlZHV4L2xpYi9jb21wb25lbnRzL2NyZWF0ZUFsbCcpO1xuXG52YXIgX3JlYWN0UmVkdXhMaWJDb21wb25lbnRzQ3JlYXRlQWxsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0UmVkdXhMaWJDb21wb25lbnRzQ3JlYXRlQWxsKTtcblxudmFyIF9kZXZUb29scyA9IHJlcXVpcmUoJy4vZGV2VG9vbHMnKTtcblxuZnVuY3Rpb24gY3JlYXRlRGV2VG9vbHMoUmVhY3QpIHtcbiAgdmFyIFByb3BUeXBlcyA9IFJlYWN0LlByb3BUeXBlcztcbiAgdmFyIENvbXBvbmVudCA9IFJlYWN0LkNvbXBvbmVudDtcblxuICB2YXIgX2NyZWF0ZUFsbCA9IF9yZWFjdFJlZHV4TGliQ29tcG9uZW50c0NyZWF0ZUFsbDJbJ2RlZmF1bHQnXShSZWFjdCk7XG5cbiAgdmFyIGNvbm5lY3QgPSBfY3JlYXRlQWxsLmNvbm5lY3Q7XG5cbiAgdmFyIERldlRvb2xzID0gKGZ1bmN0aW9uIChfQ29tcG9uZW50KSB7XG4gICAgX2luaGVyaXRzKERldlRvb2xzLCBfQ29tcG9uZW50KTtcblxuICAgIGZ1bmN0aW9uIERldlRvb2xzKCkge1xuICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIF9EZXZUb29scyk7XG5cbiAgICAgIF9Db21wb25lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBEZXZUb29scy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgdmFyIE1vbml0b3IgPSB0aGlzLnByb3BzLm1vbml0b3I7XG5cbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1vbml0b3IsIHRoaXMucHJvcHMpO1xuICAgIH07XG5cbiAgICB2YXIgX0RldlRvb2xzID0gRGV2VG9vbHM7XG4gICAgRGV2VG9vbHMgPSBjb25uZWN0KGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0sIF9kZXZUb29scy5BY3Rpb25DcmVhdG9ycykoRGV2VG9vbHMpIHx8IERldlRvb2xzO1xuICAgIHJldHVybiBEZXZUb29scztcbiAgfSkoQ29tcG9uZW50KTtcblxuICByZXR1cm4gKGZ1bmN0aW9uIChfQ29tcG9uZW50Mikge1xuICAgIF9pbmhlcml0cyhEZXZUb29sc1dyYXBwZXIsIF9Db21wb25lbnQyKTtcblxuICAgIF9jcmVhdGVDbGFzcyhEZXZUb29sc1dyYXBwZXIsIG51bGwsIFt7XG4gICAgICBrZXk6ICdwcm9wVHlwZXMnLFxuICAgICAgdmFsdWU6IHtcbiAgICAgICAgbW9uaXRvcjogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgICAgc3RvcmU6IFByb3BUeXBlcy5zaGFwZSh7XG4gICAgICAgICAgZGV2VG9vbHNTdG9yZTogUHJvcFR5cGVzLnNoYXBlKHtcbiAgICAgICAgICAgIGRpc3BhdGNoOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXG4gICAgICAgICAgfSkuaXNSZXF1aXJlZFxuICAgICAgICB9KS5pc1JlcXVpcmVkXG4gICAgICB9LFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIH1dKTtcblxuICAgIGZ1bmN0aW9uIERldlRvb2xzV3JhcHBlcihwcm9wcywgY29udGV4dCkge1xuICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIERldlRvb2xzV3JhcHBlcik7XG5cbiAgICAgIGlmIChwcm9wcy5zdG9yZSAmJiAhcHJvcHMuc3RvcmUuZGV2VG9vbHNTdG9yZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb3VsZCBub3QgZmluZCB0aGUgZGV2VG9vbHMgc3RvcmUgaW5zaWRlIHlvdXIgc3RvcmUuICcgKyAnSGF2ZSB5b3UgYXBwbGllZCBkZXZUb29scygpIHN0b3JlIGVuaGFuY2VyPycpO1xuICAgICAgfVxuICAgICAgX0NvbXBvbmVudDIuY2FsbCh0aGlzLCBwcm9wcywgY29udGV4dCk7XG4gICAgfVxuXG4gICAgRGV2VG9vbHNXcmFwcGVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChEZXZUb29scywgX2V4dGVuZHMoe30sIHRoaXMucHJvcHMsIHtcbiAgICAgICAgc3RvcmU6IHRoaXMucHJvcHMuc3RvcmUuZGV2VG9vbHNTdG9yZSB9KSk7XG4gICAgfTtcblxuICAgIHJldHVybiBEZXZUb29sc1dyYXBwZXI7XG4gIH0pKENvbXBvbmVudCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gZGV2VG9vbHM7XG52YXIgQWN0aW9uVHlwZXMgPSB7XG4gIFBFUkZPUk1fQUNUSU9OOiAnUEVSRk9STV9BQ1RJT04nLFxuICBSRVNFVDogJ1JFU0VUJyxcbiAgUk9MTEJBQ0s6ICdST0xMQkFDSycsXG4gIENPTU1JVDogJ0NPTU1JVCcsXG4gIFNXRUVQOiAnU1dFRVAnLFxuICBUT0dHTEVfQUNUSU9OOiAnVE9HR0xFX0FDVElPTicsXG4gIEpVTVBfVE9fU1RBVEU6ICdKVU1QX1RPX1NUQVRFJyxcbiAgU0VUX01PTklUT1JfU1RBVEU6ICdTRVRfTU9OSVRPUl9TVEFURScsXG4gIFJFQ09NUFVURV9TVEFURVM6ICdSRUNPTVBVVEVfU1RBVEVTJ1xufTtcblxudmFyIElOSVRfQUNUSU9OID0ge1xuICB0eXBlOiAnQEBJTklUJ1xufTtcblxuZnVuY3Rpb24gdG9nZ2xlKG9iaiwga2V5KSB7XG4gIHZhciBjbG9uZSA9IF9leHRlbmRzKHt9LCBvYmopO1xuICBpZiAoY2xvbmVba2V5XSkge1xuICAgIGRlbGV0ZSBjbG9uZVtrZXldO1xuICB9IGVsc2Uge1xuICAgIGNsb25lW2tleV0gPSB0cnVlO1xuICB9XG4gIHJldHVybiBjbG9uZTtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgbmV4dCBlbnRyeSBpbiB0aGUgbG9nIGJ5IGFwcGx5aW5nIGFuIGFjdGlvbi5cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZU5leHRFbnRyeShyZWR1Y2VyLCBhY3Rpb24sIHN0YXRlLCBlcnJvcikge1xuICBpZiAoZXJyb3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgZXJyb3I6ICdJbnRlcnJ1cHRlZCBieSBhbiBlcnJvciB1cCB0aGUgY2hhaW4nXG4gICAgfTtcbiAgfVxuXG4gIHZhciBuZXh0U3RhdGUgPSBzdGF0ZTtcbiAgdmFyIG5leHRFcnJvciA9IHVuZGVmaW5lZDtcbiAgdHJ5IHtcbiAgICBuZXh0U3RhdGUgPSByZWR1Y2VyKHN0YXRlLCBhY3Rpb24pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBuZXh0RXJyb3IgPSBlcnIudG9TdHJpbmcoKTtcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayB8fCBlcnIpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdGF0ZTogbmV4dFN0YXRlLFxuICAgIGVycm9yOiBuZXh0RXJyb3JcbiAgfTtcbn1cblxuLyoqXG4gKiBSdW5zIHRoZSByZWR1Y2VyIG9uIGFsbCBhY3Rpb25zIHRvIGdldCBhIGZyZXNoIGNvbXB1dGF0aW9uIGxvZy5cbiAqIEl0J3MgcHJvYmFibHkgYSBnb29kIGlkZWEgdG8gZG8gdGhpcyBvbmx5IGlmIHRoZSBjb2RlIGhhcyBjaGFuZ2VkLFxuICogYnV0IHVudGlsIHdlIGhhdmUgc29tZSB0ZXN0cyB3ZSdsbCBqdXN0IGRvIGl0IGV2ZXJ5IHRpbWUgYW4gYWN0aW9uIGZpcmVzLlxuICovXG5mdW5jdGlvbiByZWNvbXB1dGVTdGF0ZXMocmVkdWNlciwgY29tbWl0dGVkU3RhdGUsIHN0YWdlZEFjdGlvbnMsIHNraXBwZWRBY3Rpb25zKSB7XG4gIHZhciBjb21wdXRlZFN0YXRlcyA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhZ2VkQWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBhY3Rpb24gPSBzdGFnZWRBY3Rpb25zW2ldO1xuXG4gICAgdmFyIHByZXZpb3VzRW50cnkgPSBjb21wdXRlZFN0YXRlc1tpIC0gMV07XG4gICAgdmFyIHByZXZpb3VzU3RhdGUgPSBwcmV2aW91c0VudHJ5ID8gcHJldmlvdXNFbnRyeS5zdGF0ZSA6IGNvbW1pdHRlZFN0YXRlO1xuICAgIHZhciBwcmV2aW91c0Vycm9yID0gcHJldmlvdXNFbnRyeSA/IHByZXZpb3VzRW50cnkuZXJyb3IgOiB1bmRlZmluZWQ7XG5cbiAgICB2YXIgc2hvdWxkU2tpcCA9IEJvb2xlYW4oc2tpcHBlZEFjdGlvbnNbaV0pO1xuICAgIHZhciBlbnRyeSA9IHNob3VsZFNraXAgPyBwcmV2aW91c0VudHJ5IDogY29tcHV0ZU5leHRFbnRyeShyZWR1Y2VyLCBhY3Rpb24sIHByZXZpb3VzU3RhdGUsIHByZXZpb3VzRXJyb3IpO1xuXG4gICAgY29tcHV0ZWRTdGF0ZXMucHVzaChlbnRyeSk7XG4gIH1cblxuICByZXR1cm4gY29tcHV0ZWRTdGF0ZXM7XG59XG5cbi8qKlxuICogTGlmdHMgdGhlIGFwcCBzdGF0ZSByZWR1Y2VyIGludG8gYSBEZXZUb29scyBzdGF0ZSByZWR1Y2VyLlxuICovXG5mdW5jdGlvbiBsaWZ0UmVkdWNlcihyZWR1Y2VyLCBpbml0aWFsU3RhdGUpIHtcbiAgdmFyIGluaXRpYWxMaWZ0ZWRTdGF0ZSA9IHtcbiAgICBjb21taXR0ZWRTdGF0ZTogaW5pdGlhbFN0YXRlLFxuICAgIHN0YWdlZEFjdGlvbnM6IFtJTklUX0FDVElPTl0sXG4gICAgc2tpcHBlZEFjdGlvbnM6IHt9LFxuICAgIGN1cnJlbnRTdGF0ZUluZGV4OiAwLFxuICAgIG1vbml0b3JTdGF0ZToge1xuICAgICAgaXNWaXNpYmxlOiB0cnVlXG4gICAgfSxcbiAgICB0aW1lc3RhbXBzOiBbRGF0ZS5ub3coKV1cbiAgfTtcblxuICAvKipcbiAgICogTWFuYWdlcyBob3cgdGhlIERldlRvb2xzIGFjdGlvbnMgbW9kaWZ5IHRoZSBEZXZUb29scyBzdGF0ZS5cbiAgICovXG4gIHJldHVybiBmdW5jdGlvbiBsaWZ0ZWRSZWR1Y2VyKGxpZnRlZFN0YXRlLCBsaWZ0ZWRBY3Rpb24pIHtcbiAgICBpZiAobGlmdGVkU3RhdGUgPT09IHVuZGVmaW5lZCkgbGlmdGVkU3RhdGUgPSBpbml0aWFsTGlmdGVkU3RhdGU7XG5cbiAgICB2YXIgc2hvdWxkUmVjb21wdXRlU3RhdGVzID0gdHJ1ZTtcbiAgICB2YXIgY29tbWl0dGVkU3RhdGUgPSBsaWZ0ZWRTdGF0ZS5jb21taXR0ZWRTdGF0ZTtcbiAgICB2YXIgc3RhZ2VkQWN0aW9ucyA9IGxpZnRlZFN0YXRlLnN0YWdlZEFjdGlvbnM7XG4gICAgdmFyIHNraXBwZWRBY3Rpb25zID0gbGlmdGVkU3RhdGUuc2tpcHBlZEFjdGlvbnM7XG4gICAgdmFyIGNvbXB1dGVkU3RhdGVzID0gbGlmdGVkU3RhdGUuY29tcHV0ZWRTdGF0ZXM7XG4gICAgdmFyIGN1cnJlbnRTdGF0ZUluZGV4ID0gbGlmdGVkU3RhdGUuY3VycmVudFN0YXRlSW5kZXg7XG4gICAgdmFyIG1vbml0b3JTdGF0ZSA9IGxpZnRlZFN0YXRlLm1vbml0b3JTdGF0ZTtcbiAgICB2YXIgdGltZXN0YW1wcyA9IGxpZnRlZFN0YXRlLnRpbWVzdGFtcHM7XG5cbiAgICBzd2l0Y2ggKGxpZnRlZEFjdGlvbi50eXBlKSB7XG4gICAgICBjYXNlIEFjdGlvblR5cGVzLlJFU0VUOlxuICAgICAgICBjb21taXR0ZWRTdGF0ZSA9IGluaXRpYWxTdGF0ZTtcbiAgICAgICAgc3RhZ2VkQWN0aW9ucyA9IFtJTklUX0FDVElPTl07XG4gICAgICAgIHNraXBwZWRBY3Rpb25zID0ge307XG4gICAgICAgIGN1cnJlbnRTdGF0ZUluZGV4ID0gMDtcbiAgICAgICAgdGltZXN0YW1wcyA9IFtsaWZ0ZWRBY3Rpb24udGltZXN0YW1wXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEFjdGlvblR5cGVzLkNPTU1JVDpcbiAgICAgICAgY29tbWl0dGVkU3RhdGUgPSBjb21wdXRlZFN0YXRlc1tjdXJyZW50U3RhdGVJbmRleF0uc3RhdGU7XG4gICAgICAgIHN0YWdlZEFjdGlvbnMgPSBbSU5JVF9BQ1RJT05dO1xuICAgICAgICBza2lwcGVkQWN0aW9ucyA9IHt9O1xuICAgICAgICBjdXJyZW50U3RhdGVJbmRleCA9IDA7XG4gICAgICAgIHRpbWVzdGFtcHMgPSBbbGlmdGVkQWN0aW9uLnRpbWVzdGFtcF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBY3Rpb25UeXBlcy5ST0xMQkFDSzpcbiAgICAgICAgc3RhZ2VkQWN0aW9ucyA9IFtJTklUX0FDVElPTl07XG4gICAgICAgIHNraXBwZWRBY3Rpb25zID0ge307XG4gICAgICAgIGN1cnJlbnRTdGF0ZUluZGV4ID0gMDtcbiAgICAgICAgdGltZXN0YW1wcyA9IFtsaWZ0ZWRBY3Rpb24udGltZXN0YW1wXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEFjdGlvblR5cGVzLlRPR0dMRV9BQ1RJT046XG4gICAgICAgIHNraXBwZWRBY3Rpb25zID0gdG9nZ2xlKHNraXBwZWRBY3Rpb25zLCBsaWZ0ZWRBY3Rpb24uaW5kZXgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQWN0aW9uVHlwZXMuSlVNUF9UT19TVEFURTpcbiAgICAgICAgY3VycmVudFN0YXRlSW5kZXggPSBsaWZ0ZWRBY3Rpb24uaW5kZXg7XG4gICAgICAgIC8vIE9wdGltaXphdGlvbjogd2Uga25vdyB0aGUgaGlzdG9yeSBoYXMgbm90IGNoYW5nZWQuXG4gICAgICAgIHNob3VsZFJlY29tcHV0ZVN0YXRlcyA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQWN0aW9uVHlwZXMuU1dFRVA6XG4gICAgICAgIHN0YWdlZEFjdGlvbnMgPSBzdGFnZWRBY3Rpb25zLmZpbHRlcihmdW5jdGlvbiAoXywgaSkge1xuICAgICAgICAgIHJldHVybiAhc2tpcHBlZEFjdGlvbnNbaV07XG4gICAgICAgIH0pO1xuICAgICAgICB0aW1lc3RhbXBzID0gdGltZXN0YW1wcy5maWx0ZXIoZnVuY3Rpb24gKF8sIGkpIHtcbiAgICAgICAgICByZXR1cm4gIXNraXBwZWRBY3Rpb25zW2ldO1xuICAgICAgICB9KTtcbiAgICAgICAgc2tpcHBlZEFjdGlvbnMgPSB7fTtcbiAgICAgICAgY3VycmVudFN0YXRlSW5kZXggPSBNYXRoLm1pbihjdXJyZW50U3RhdGVJbmRleCwgc3RhZ2VkQWN0aW9ucy5sZW5ndGggLSAxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEFjdGlvblR5cGVzLlBFUkZPUk1fQUNUSU9OOlxuICAgICAgICBpZiAoY3VycmVudFN0YXRlSW5kZXggPT09IHN0YWdlZEFjdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIGN1cnJlbnRTdGF0ZUluZGV4Kys7XG4gICAgICAgIH1cblxuICAgICAgICBzdGFnZWRBY3Rpb25zID0gW10uY29uY2F0KHN0YWdlZEFjdGlvbnMsIFtsaWZ0ZWRBY3Rpb24uYWN0aW9uXSk7XG4gICAgICAgIHRpbWVzdGFtcHMgPSBbXS5jb25jYXQodGltZXN0YW1wcywgW2xpZnRlZEFjdGlvbi50aW1lc3RhbXBdKTtcblxuICAgICAgICAvLyBPcHRpbWl6YXRpb246IHdlIGtub3cgdGhhdCB0aGUgcGFzdCBoYXMgbm90IGNoYW5nZWQuXG4gICAgICAgIHNob3VsZFJlY29tcHV0ZVN0YXRlcyA9IGZhbHNlO1xuICAgICAgICAvLyBJbnN0ZWFkIG9mIHJlY29tcHV0aW5nIHRoZSBzdGF0ZXMsIGFwcGVuZCB0aGUgbmV4dCBvbmUuXG4gICAgICAgIHZhciBwcmV2aW91c0VudHJ5ID0gY29tcHV0ZWRTdGF0ZXNbY29tcHV0ZWRTdGF0ZXMubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBuZXh0RW50cnkgPSBjb21wdXRlTmV4dEVudHJ5KHJlZHVjZXIsIGxpZnRlZEFjdGlvbi5hY3Rpb24sIHByZXZpb3VzRW50cnkuc3RhdGUsIHByZXZpb3VzRW50cnkuZXJyb3IpO1xuICAgICAgICBjb21wdXRlZFN0YXRlcyA9IFtdLmNvbmNhdChjb21wdXRlZFN0YXRlcywgW25leHRFbnRyeV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQWN0aW9uVHlwZXMuU0VUX01PTklUT1JfU1RBVEU6XG4gICAgICAgIG1vbml0b3JTdGF0ZSA9IGxpZnRlZEFjdGlvbi5tb25pdG9yU3RhdGU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBY3Rpb25UeXBlcy5SRUNPTVBVVEVfU1RBVEVTOlxuICAgICAgICBzdGFnZWRBY3Rpb25zID0gbGlmdGVkQWN0aW9uLnN0YWdlZEFjdGlvbnM7XG4gICAgICAgIHRpbWVzdGFtcHMgPSBsaWZ0ZWRBY3Rpb24udGltZXN0YW1wcztcbiAgICAgICAgY29tbWl0dGVkU3RhdGUgPSBsaWZ0ZWRBY3Rpb24uY29tbWl0dGVkU3RhdGU7XG4gICAgICAgIGN1cnJlbnRTdGF0ZUluZGV4ID0gc3RhZ2VkQWN0aW9ucy5sZW5ndGggLSAxO1xuICAgICAgICBza2lwcGVkQWN0aW9ucyA9IHt9O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzaG91bGRSZWNvbXB1dGVTdGF0ZXMpIHtcbiAgICAgIGNvbXB1dGVkU3RhdGVzID0gcmVjb21wdXRlU3RhdGVzKHJlZHVjZXIsIGNvbW1pdHRlZFN0YXRlLCBzdGFnZWRBY3Rpb25zLCBza2lwcGVkQWN0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbW1pdHRlZFN0YXRlOiBjb21taXR0ZWRTdGF0ZSxcbiAgICAgIHN0YWdlZEFjdGlvbnM6IHN0YWdlZEFjdGlvbnMsXG4gICAgICBza2lwcGVkQWN0aW9uczogc2tpcHBlZEFjdGlvbnMsXG4gICAgICBjb21wdXRlZFN0YXRlczogY29tcHV0ZWRTdGF0ZXMsXG4gICAgICBjdXJyZW50U3RhdGVJbmRleDogY3VycmVudFN0YXRlSW5kZXgsXG4gICAgICBtb25pdG9yU3RhdGU6IG1vbml0b3JTdGF0ZSxcbiAgICAgIHRpbWVzdGFtcHM6IHRpbWVzdGFtcHNcbiAgICB9O1xuICB9O1xufVxuXG4vKipcbiAqIExpZnRzIGFuIGFwcCBhY3Rpb24gdG8gYSBEZXZUb29scyBhY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGxpZnRBY3Rpb24oYWN0aW9uKSB7XG4gIHZhciBsaWZ0ZWRBY3Rpb24gPSB7XG4gICAgdHlwZTogQWN0aW9uVHlwZXMuUEVSRk9STV9BQ1RJT04sXG4gICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gIH07XG4gIHJldHVybiBsaWZ0ZWRBY3Rpb247XG59XG5cbi8qKlxuICogVW5saWZ0cyB0aGUgRGV2VG9vbHMgc3RhdGUgdG8gdGhlIGFwcCBzdGF0ZS5cbiAqL1xuZnVuY3Rpb24gdW5saWZ0U3RhdGUobGlmdGVkU3RhdGUpIHtcbiAgdmFyIGNvbXB1dGVkU3RhdGVzID0gbGlmdGVkU3RhdGUuY29tcHV0ZWRTdGF0ZXM7XG4gIHZhciBjdXJyZW50U3RhdGVJbmRleCA9IGxpZnRlZFN0YXRlLmN1cnJlbnRTdGF0ZUluZGV4O1xuICB2YXIgc3RhdGUgPSBjb21wdXRlZFN0YXRlc1tjdXJyZW50U3RhdGVJbmRleF0uc3RhdGU7XG5cbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vKipcbiAqIFVubGlmdHMgdGhlIERldlRvb2xzIHN0b3JlIHRvIGFjdCBsaWtlIHRoZSBhcHAncyBzdG9yZS5cbiAqL1xuZnVuY3Rpb24gdW5saWZ0U3RvcmUobGlmdGVkU3RvcmUsIHJlZHVjZXIpIHtcbiAgdmFyIGxhc3REZWZpbmVkU3RhdGUgPSB1bmRlZmluZWQ7XG4gIHJldHVybiBfZXh0ZW5kcyh7fSwgbGlmdGVkU3RvcmUsIHtcbiAgICBkZXZUb29sc1N0b3JlOiBsaWZ0ZWRTdG9yZSxcbiAgICBkaXNwYXRjaDogZnVuY3Rpb24gZGlzcGF0Y2goYWN0aW9uKSB7XG4gICAgICBsaWZ0ZWRTdG9yZS5kaXNwYXRjaChsaWZ0QWN0aW9uKGFjdGlvbikpO1xuICAgICAgcmV0dXJuIGFjdGlvbjtcbiAgICB9LFxuICAgIGdldFN0YXRlOiBmdW5jdGlvbiBnZXRTdGF0ZSgpIHtcbiAgICAgIHZhciBzdGF0ZSA9IHVubGlmdFN0YXRlKGxpZnRlZFN0b3JlLmdldFN0YXRlKCkpO1xuICAgICAgaWYgKHN0YXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbGFzdERlZmluZWRTdGF0ZSA9IHN0YXRlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxhc3REZWZpbmVkU3RhdGU7XG4gICAgfSxcbiAgICBnZXRSZWR1Y2VyOiBmdW5jdGlvbiBnZXRSZWR1Y2VyKCkge1xuICAgICAgcmV0dXJuIHJlZHVjZXI7XG4gICAgfSxcbiAgICByZXBsYWNlUmVkdWNlcjogZnVuY3Rpb24gcmVwbGFjZVJlZHVjZXIobmV4dFJlZHVjZXIpIHtcbiAgICAgIGxpZnRlZFN0b3JlLnJlcGxhY2VSZWR1Y2VyKGxpZnRSZWR1Y2VyKG5leHRSZWR1Y2VyKSk7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBBY3Rpb24gY3JlYXRvcnMgdG8gY2hhbmdlIHRoZSBEZXZUb29scyBzdGF0ZS5cbiAqL1xudmFyIEFjdGlvbkNyZWF0b3JzID0ge1xuICByZXNldDogZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogQWN0aW9uVHlwZXMuUkVTRVQsIHRpbWVzdGFtcDogRGF0ZS5ub3coKSB9O1xuICB9LFxuICByb2xsYmFjazogZnVuY3Rpb24gcm9sbGJhY2soKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogQWN0aW9uVHlwZXMuUk9MTEJBQ0ssIHRpbWVzdGFtcDogRGF0ZS5ub3coKSB9O1xuICB9LFxuICBjb21taXQ6IGZ1bmN0aW9uIGNvbW1pdCgpIHtcbiAgICByZXR1cm4geyB0eXBlOiBBY3Rpb25UeXBlcy5DT01NSVQsIHRpbWVzdGFtcDogRGF0ZS5ub3coKSB9O1xuICB9LFxuICBzd2VlcDogZnVuY3Rpb24gc3dlZXAoKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogQWN0aW9uVHlwZXMuU1dFRVAgfTtcbiAgfSxcbiAgdG9nZ2xlQWN0aW9uOiBmdW5jdGlvbiB0b2dnbGVBY3Rpb24oaW5kZXgpIHtcbiAgICByZXR1cm4geyB0eXBlOiBBY3Rpb25UeXBlcy5UT0dHTEVfQUNUSU9OLCBpbmRleDogaW5kZXggfTtcbiAgfSxcbiAganVtcFRvU3RhdGU6IGZ1bmN0aW9uIGp1bXBUb1N0YXRlKGluZGV4KSB7XG4gICAgcmV0dXJuIHsgdHlwZTogQWN0aW9uVHlwZXMuSlVNUF9UT19TVEFURSwgaW5kZXg6IGluZGV4IH07XG4gIH0sXG4gIHNldE1vbml0b3JTdGF0ZTogZnVuY3Rpb24gc2V0TW9uaXRvclN0YXRlKG1vbml0b3JTdGF0ZSkge1xuICAgIHJldHVybiB7IHR5cGU6IEFjdGlvblR5cGVzLlNFVF9NT05JVE9SX1NUQVRFLCBtb25pdG9yU3RhdGU6IG1vbml0b3JTdGF0ZSB9O1xuICB9LFxuICByZWNvbXB1dGVTdGF0ZXM6IGZ1bmN0aW9uIHJlY29tcHV0ZVN0YXRlcyhjb21taXR0ZWRTdGF0ZSwgc3RhZ2VkQWN0aW9ucykge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBBY3Rpb25UeXBlcy5SRUNPTVBVVEVfU1RBVEVTLFxuICAgICAgY29tbWl0dGVkU3RhdGU6IGNvbW1pdHRlZFN0YXRlLFxuICAgICAgc3RhZ2VkQWN0aW9uczogc3RhZ2VkQWN0aW9uc1xuICAgIH07XG4gIH1cbn07XG5cbmV4cG9ydHMuQWN0aW9uQ3JlYXRvcnMgPSBBY3Rpb25DcmVhdG9ycztcbi8qKlxuICogUmVkdXggRGV2VG9vbHMgbWlkZGxld2FyZS5cbiAqL1xuXG5mdW5jdGlvbiBkZXZUb29scygpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChuZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChyZWR1Y2VyLCBpbml0aWFsU3RhdGUpIHtcbiAgICAgIHZhciBsaWZ0ZWRSZWR1Y2VyID0gbGlmdFJlZHVjZXIocmVkdWNlciwgaW5pdGlhbFN0YXRlKTtcbiAgICAgIHZhciBsaWZ0ZWRTdG9yZSA9IG5leHQobGlmdGVkUmVkdWNlcik7XG4gICAgICB2YXIgc3RvcmUgPSB1bmxpZnRTdG9yZShsaWZ0ZWRTdG9yZSwgcmVkdWNlcik7XG4gICAgICByZXR1cm4gc3RvcmU7XG4gICAgfTtcbiAgfTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZShvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9ialsnZGVmYXVsdCddIDogb2JqOyB9XG5cbnZhciBfZGV2VG9vbHMgPSByZXF1aXJlKCcuL2RldlRvb2xzJyk7XG5cbmV4cG9ydHMuZGV2VG9vbHMgPSBfaW50ZXJvcFJlcXVpcmUoX2RldlRvb2xzKTtcblxudmFyIF9wZXJzaXN0U3RhdGUgPSByZXF1aXJlKCcuL3BlcnNpc3RTdGF0ZScpO1xuXG5leHBvcnRzLnBlcnNpc3RTdGF0ZSA9IF9pbnRlcm9wUmVxdWlyZShfcGVyc2lzdFN0YXRlKTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHBlcnNpc3RTdGF0ZTtcblxuZnVuY3Rpb24gcGVyc2lzdFN0YXRlKHNlc3Npb25JZCkge1xuICB2YXIgc3RhdGVEZXNlcmlhbGl6ZXIgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyBudWxsIDogYXJndW1lbnRzWzFdO1xuICB2YXIgYWN0aW9uRGVzZXJpYWxpemVyID0gYXJndW1lbnRzLmxlbmd0aCA8PSAyIHx8IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGFyZ3VtZW50c1syXTtcblxuICBpZiAoIXNlc3Npb25JZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAobmV4dCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5leHQuYXBwbHkodW5kZWZpbmVkLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzZXJpYWxpemVTdGF0ZShmdWxsU3RhdGUpIHtcbiAgICByZXR1cm4gX2V4dGVuZHMoe30sIGZ1bGxTdGF0ZSwge1xuICAgICAgY29tbWl0dGVkU3RhdGU6IHN0YXRlRGVzZXJpYWxpemVyKGZ1bGxTdGF0ZS5jb21taXR0ZWRTdGF0ZSksXG4gICAgICBjb21wdXRlZFN0YXRlczogZnVsbFN0YXRlLmNvbXB1dGVkU3RhdGVzLm1hcChmdW5jdGlvbiAoY29tcHV0ZWRTdGF0ZSkge1xuICAgICAgICByZXR1cm4gX2V4dGVuZHMoe30sIGNvbXB1dGVkU3RhdGUsIHtcbiAgICAgICAgICBzdGF0ZTogc3RhdGVEZXNlcmlhbGl6ZXIoY29tcHV0ZWRTdGF0ZS5zdGF0ZSlcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzZXJpYWxpemVBY3Rpb25zKGZ1bGxTdGF0ZSkge1xuICAgIHJldHVybiBfZXh0ZW5kcyh7fSwgZnVsbFN0YXRlLCB7XG4gICAgICBzdGFnZWRBY3Rpb25zOiBmdWxsU3RhdGUuc3RhZ2VkQWN0aW9ucy5tYXAoZnVuY3Rpb24gKGFjdGlvbikge1xuICAgICAgICByZXR1cm4gYWN0aW9uRGVzZXJpYWxpemVyKGFjdGlvbik7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVzZXJpYWxpemUoZnVsbFN0YXRlKSB7XG4gICAgaWYgKCFmdWxsU3RhdGUpIHtcbiAgICAgIHJldHVybiBmdWxsU3RhdGU7XG4gICAgfVxuICAgIHZhciBkZXNlcmlhbGl6ZWRTdGF0ZSA9IGZ1bGxTdGF0ZTtcbiAgICBpZiAodHlwZW9mIHN0YXRlRGVzZXJpYWxpemVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBkZXNlcmlhbGl6ZWRTdGF0ZSA9IGRlc2VyaWFsaXplU3RhdGUoZGVzZXJpYWxpemVkU3RhdGUpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGFjdGlvbkRlc2VyaWFsaXplciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZGVzZXJpYWxpemVkU3RhdGUgPSBkZXNlcmlhbGl6ZUFjdGlvbnMoZGVzZXJpYWxpemVkU3RhdGUpO1xuICAgIH1cbiAgICByZXR1cm4gZGVzZXJpYWxpemVkU3RhdGU7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKG5leHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHJlZHVjZXIsIGluaXRpYWxTdGF0ZSkge1xuICAgICAgdmFyIGtleSA9ICdyZWR1eC1kZXYtc2Vzc2lvbi0nICsgc2Vzc2lvbklkO1xuXG4gICAgICB2YXIgZmluYWxJbml0aWFsU3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgICB0cnkge1xuICAgICAgICBmaW5hbEluaXRpYWxTdGF0ZSA9IGRlc2VyaWFsaXplKEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSkpIHx8IGluaXRpYWxTdGF0ZTtcbiAgICAgICAgbmV4dChyZWR1Y2VyLCBpbml0aWFsU3RhdGUpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0NvdWxkIG5vdCByZWFkIGRlYnVnIHNlc3Npb24gZnJvbSBsb2NhbFN0b3JhZ2U6JywgZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBmaW5hbEluaXRpYWxTdGF0ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgc3RvcmUgPSBuZXh0KHJlZHVjZXIsIGZpbmFsSW5pdGlhbFN0YXRlKTtcblxuICAgICAgcmV0dXJuIF9leHRlbmRzKHt9LCBzdG9yZSwge1xuICAgICAgICBkaXNwYXRjaDogZnVuY3Rpb24gZGlzcGF0Y2goYWN0aW9uKSB7XG4gICAgICAgICAgc3RvcmUuZGlzcGF0Y2goYWN0aW9uKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KHN0b3JlLmdldFN0YXRlKCkpKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0NvdWxkIG5vdCB3cml0ZSBkZWJ1ZyBzZXNzaW9uIHRvIGxvY2FsU3RvcmFnZTonLCBlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gYWN0aW9uO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmV4cG9ydHMuZ2V0RGVmYXVsdFN0eWxlID0gZ2V0RGVmYXVsdFN0eWxlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRTdHlsZShwcm9wcykge1xuICB2YXIgbGVmdCA9IHByb3BzLmxlZnQ7XG4gIHZhciByaWdodCA9IHByb3BzLnJpZ2h0O1xuICB2YXIgYm90dG9tID0gcHJvcHMuYm90dG9tO1xuICB2YXIgdG9wID0gcHJvcHMudG9wO1xuXG4gIGlmICh0eXBlb2YgbGVmdCA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHJpZ2h0ID09PSAndW5kZWZpbmVkJykge1xuICAgIHJpZ2h0ID0gdHJ1ZTtcbiAgfVxuICBpZiAodHlwZW9mIHRvcCA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGJvdHRvbSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBib3R0b20gPSB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICB6SW5kZXg6IDEwMDAwLFxuICAgIGZvbnRTaXplOiAxNyxcbiAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgb3BhY2l0eTogMSxcbiAgICBjb2xvcjogJ3doaXRlJyxcbiAgICBsZWZ0OiBsZWZ0ID8gMCA6IHVuZGVmaW5lZCxcbiAgICByaWdodDogcmlnaHQgPyAwIDogdW5kZWZpbmVkLFxuICAgIHRvcDogdG9wID8gMCA6IHVuZGVmaW5lZCxcbiAgICBib3R0b206IGJvdHRvbSA/IDAgOiB1bmRlZmluZWQsXG4gICAgbWF4SGVpZ2h0OiBib3R0b20gJiYgdG9wID8gJzEwMCUnIDogJzMwJScsXG4gICAgbWF4V2lkdGg6IGxlZnQgJiYgcmlnaHQgPyAnMTAwJScgOiAnMzAlJyxcbiAgICB3b3JkV3JhcDogJ2JyZWFrLXdvcmQnLFxuICAgIGJveFNpemluZzogJ2JvcmRlci1ib3gnLFxuICAgIGJveFNoYWRvdzogJy0ycHggMCA3cHggMCByZ2JhKDAsIDAsIDAsIDAuNSknXG4gIH07XG59XG5cbnZhciBEZWJ1Z1BhbmVsID0gKGZ1bmN0aW9uIChfQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhEZWJ1Z1BhbmVsLCBfQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBEZWJ1Z1BhbmVsKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBEZWJ1Z1BhbmVsKTtcblxuICAgIF9Db21wb25lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIERlYnVnUGFuZWwucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnZGl2JyxcbiAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCB0aGlzLnByb3BzLmdldFN0eWxlKHRoaXMucHJvcHMpLCB0aGlzLnByb3BzLnN0eWxlKSB9LFxuICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICk7XG4gIH07XG5cbiAgX2NyZWF0ZUNsYXNzKERlYnVnUGFuZWwsIG51bGwsIFt7XG4gICAga2V5OiAncHJvcFR5cGVzJyxcbiAgICB2YWx1ZToge1xuICAgICAgbGVmdDogX3JlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgICAgcmlnaHQ6IF9yZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICAgIGJvdHRvbTogX3JlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgICAgdG9wOiBfcmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgICBnZXRTdHlsZTogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfSwge1xuICAgIGtleTogJ2RlZmF1bHRQcm9wcycsXG4gICAgdmFsdWU6IHtcbiAgICAgIGdldFN0eWxlOiBnZXREZWZhdWx0U3R5bGVcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfV0pO1xuXG4gIHJldHVybiBEZWJ1Z1BhbmVsO1xufSkoX3JlYWN0LkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IERlYnVnUGFuZWw7IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gbmV3T2JqWydkZWZhdWx0J10gPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfTG9nTW9uaXRvckVudHJ5ID0gcmVxdWlyZSgnLi9Mb2dNb25pdG9yRW50cnknKTtcblxudmFyIF9Mb2dNb25pdG9yRW50cnkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTG9nTW9uaXRvckVudHJ5KTtcblxudmFyIF9Mb2dNb25pdG9yQnV0dG9uID0gcmVxdWlyZSgnLi9Mb2dNb25pdG9yQnV0dG9uJyk7XG5cbnZhciBfTG9nTW9uaXRvckJ1dHRvbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Mb2dNb25pdG9yQnV0dG9uKTtcblxudmFyIF90aGVtZXMgPSByZXF1aXJlKCcuL3RoZW1lcycpO1xuXG52YXIgdGhlbWVzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX3RoZW1lcyk7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGZvbnRGYW1pbHk6ICdtb25hY28sIENvbnNvbGFzLCBMdWNpZGEgQ29uc29sZSwgbW9ub3NwYWNlJyxcbiAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICBvdmVyZmxvd1k6ICdoaWRkZW4nLFxuICAgIHdpZHRoOiAnMTAwJScsXG4gICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgbWluV2lkdGg6IDMwMFxuICB9LFxuICBidXR0b25CYXI6IHtcbiAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxuICAgIGJvcmRlckJvdHRvbVdpZHRoOiAxLFxuICAgIGJvcmRlckJvdHRvbVN0eWxlOiAnc29saWQnLFxuICAgIGJvcmRlckNvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgIHpJbmRleDogMSxcbiAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgZmxleERpcmVjdGlvbjogJ3JvdydcbiAgfSxcbiAgZWxlbWVudHM6IHtcbiAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICBsZWZ0OiAwLFxuICAgIHJpZ2h0OiAwLFxuICAgIHRvcDogMzgsXG4gICAgYm90dG9tOiAwLFxuICAgIG92ZXJmbG93WDogJ2hpZGRlbicsXG4gICAgb3ZlcmZsb3dZOiAnYXV0bydcbiAgfVxufTtcblxudmFyIExvZ01vbml0b3IgPSAoZnVuY3Rpb24gKF9Db21wb25lbnQpIHtcbiAgX2luaGVyaXRzKExvZ01vbml0b3IsIF9Db21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIExvZ01vbml0b3IocHJvcHMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTG9nTW9uaXRvcik7XG5cbiAgICBfQ29tcG9uZW50LmNhbGwodGhpcywgcHJvcHMpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUtleVByZXNzLmJpbmQodGhpcykpO1xuICAgIH1cbiAgfVxuXG4gIExvZ01vbml0b3IucHJvdG90eXBlLmNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMgPSBmdW5jdGlvbiBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wcykge1xuICAgIHZhciBub2RlID0gX3JlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5lbGVtZW50cyk7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICB0aGlzLnNjcm9sbERvd24gPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5zdGFnZWRBY3Rpb25zLmxlbmd0aCA8IG5leHRQcm9wcy5zdGFnZWRBY3Rpb25zLmxlbmd0aCkge1xuICAgICAgdmFyIHNjcm9sbFRvcCA9IG5vZGUuc2Nyb2xsVG9wO1xuICAgICAgdmFyIG9mZnNldEhlaWdodCA9IG5vZGUub2Zmc2V0SGVpZ2h0O1xuICAgICAgdmFyIHNjcm9sbEhlaWdodCA9IG5vZGUuc2Nyb2xsSGVpZ2h0O1xuXG4gICAgICB0aGlzLnNjcm9sbERvd24gPSBNYXRoLmFicyhzY3JvbGxIZWlnaHQgLSAoc2Nyb2xsVG9wICsgb2Zmc2V0SGVpZ2h0KSkgPCAyMDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zY3JvbGxEb3duID0gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIExvZ01vbml0b3IucHJvdG90eXBlLmNvbXBvbmVudERpZFVwZGF0ZSA9IGZ1bmN0aW9uIGNvbXBvbmVudERpZFVwZGF0ZSgpIHtcbiAgICB2YXIgbm9kZSA9IF9yZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZWxlbWVudHMpO1xuICAgIGlmICghbm9kZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5zY3JvbGxEb3duKSB7XG4gICAgICB2YXIgb2Zmc2V0SGVpZ2h0ID0gbm9kZS5vZmZzZXRIZWlnaHQ7XG4gICAgICB2YXIgc2Nyb2xsSGVpZ2h0ID0gbm9kZS5zY3JvbGxIZWlnaHQ7XG5cbiAgICAgIG5vZGUuc2Nyb2xsVG9wID0gc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0SGVpZ2h0O1xuICAgICAgdGhpcy5zY3JvbGxEb3duID0gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIExvZ01vbml0b3IucHJvdG90eXBlLmNvbXBvbmVudFdpbGxNb3VudCA9IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICB2YXIgdmlzaWJsZU9uTG9hZCA9IHRoaXMucHJvcHMudmlzaWJsZU9uTG9hZDtcbiAgICB2YXIgbW9uaXRvclN0YXRlID0gdGhpcy5wcm9wcy5tb25pdG9yU3RhdGU7XG5cbiAgICB0aGlzLnByb3BzLnNldE1vbml0b3JTdGF0ZShfZXh0ZW5kcyh7fSwgbW9uaXRvclN0YXRlLCB7XG4gICAgICBpc1Zpc2libGU6IHZpc2libGVPbkxvYWRcbiAgICB9KSk7XG4gIH07XG5cbiAgTG9nTW9uaXRvci5wcm90b3R5cGUuaGFuZGxlUm9sbGJhY2sgPSBmdW5jdGlvbiBoYW5kbGVSb2xsYmFjaygpIHtcbiAgICB0aGlzLnByb3BzLnJvbGxiYWNrKCk7XG4gIH07XG5cbiAgTG9nTW9uaXRvci5wcm90b3R5cGUuaGFuZGxlU3dlZXAgPSBmdW5jdGlvbiBoYW5kbGVTd2VlcCgpIHtcbiAgICB0aGlzLnByb3BzLnN3ZWVwKCk7XG4gIH07XG5cbiAgTG9nTW9uaXRvci5wcm90b3R5cGUuaGFuZGxlQ29tbWl0ID0gZnVuY3Rpb24gaGFuZGxlQ29tbWl0KCkge1xuICAgIHRoaXMucHJvcHMuY29tbWl0KCk7XG4gIH07XG5cbiAgTG9nTW9uaXRvci5wcm90b3R5cGUuaGFuZGxlVG9nZ2xlQWN0aW9uID0gZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQWN0aW9uKGluZGV4KSB7XG4gICAgdGhpcy5wcm9wcy50b2dnbGVBY3Rpb24oaW5kZXgpO1xuICB9O1xuXG4gIExvZ01vbml0b3IucHJvdG90eXBlLmhhbmRsZVJlc2V0ID0gZnVuY3Rpb24gaGFuZGxlUmVzZXQoKSB7XG4gICAgdGhpcy5wcm9wcy5yZXNldCgpO1xuICB9O1xuXG4gIExvZ01vbml0b3IucHJvdG90eXBlLmhhbmRsZUtleVByZXNzID0gZnVuY3Rpb24gaGFuZGxlS2V5UHJlc3MoZXZlbnQpIHtcbiAgICB2YXIgbW9uaXRvclN0YXRlID0gdGhpcy5wcm9wcy5tb25pdG9yU3RhdGU7XG5cbiAgICBpZiAoZXZlbnQuY3RybEtleSAmJiBldmVudC5rZXlDb2RlID09PSA3Mikge1xuICAgICAgLy8gQ3RybCtIXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5wcm9wcy5zZXRNb25pdG9yU3RhdGUoX2V4dGVuZHMoe30sIG1vbml0b3JTdGF0ZSwge1xuICAgICAgICBpc1Zpc2libGU6ICFtb25pdG9yU3RhdGUuaXNWaXNpYmxlXG4gICAgICB9KSk7XG4gICAgfVxuICB9O1xuXG4gIExvZ01vbml0b3IucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgZWxlbWVudHMgPSBbXTtcbiAgICB2YXIgX3Byb3BzID0gdGhpcy5wcm9wcztcbiAgICB2YXIgbW9uaXRvclN0YXRlID0gX3Byb3BzLm1vbml0b3JTdGF0ZTtcbiAgICB2YXIgc2tpcHBlZEFjdGlvbnMgPSBfcHJvcHMuc2tpcHBlZEFjdGlvbnM7XG4gICAgdmFyIHN0YWdlZEFjdGlvbnMgPSBfcHJvcHMuc3RhZ2VkQWN0aW9ucztcbiAgICB2YXIgY29tcHV0ZWRTdGF0ZXMgPSBfcHJvcHMuY29tcHV0ZWRTdGF0ZXM7XG4gICAgdmFyIHNlbGVjdCA9IF9wcm9wcy5zZWxlY3Q7XG5cbiAgICB2YXIgdGhlbWUgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnByb3BzLnRoZW1lID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKHR5cGVvZiB0aGVtZXNbdGhpcy5wcm9wcy50aGVtZV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoZW1lID0gdGhlbWVzW3RoaXMucHJvcHMudGhlbWVdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdEZXZUb29scyB0aGVtZSAnICsgdGhpcy5wcm9wcy50aGVtZSArICcgbm90IGZvdW5kLCBkZWZhdWx0aW5nIHRvIG5pY2luYWJveCcpO1xuICAgICAgICB0aGVtZSA9IHRoZW1lcy5uaWNpbmFib3g7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoZW1lID0gdGhpcy5wcm9wcy50aGVtZTtcbiAgICB9XG4gICAgaWYgKCFtb25pdG9yU3RhdGUuaXNWaXNpYmxlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWdlZEFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBhY3Rpb24gPSBzdGFnZWRBY3Rpb25zW2ldO1xuICAgICAgdmFyIF9jb21wdXRlZFN0YXRlcyRpID0gY29tcHV0ZWRTdGF0ZXNbaV07XG4gICAgICB2YXIgc3RhdGUgPSBfY29tcHV0ZWRTdGF0ZXMkaS5zdGF0ZTtcbiAgICAgIHZhciBlcnJvciA9IF9jb21wdXRlZFN0YXRlcyRpLmVycm9yO1xuXG4gICAgICB2YXIgcHJldmlvdXNTdGF0ZSA9IHVuZGVmaW5lZDtcbiAgICAgIGlmIChpID4gMCkge1xuICAgICAgICBwcmV2aW91c1N0YXRlID0gY29tcHV0ZWRTdGF0ZXNbaSAtIDFdLnN0YXRlO1xuICAgICAgfVxuICAgICAgZWxlbWVudHMucHVzaChfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfTG9nTW9uaXRvckVudHJ5MlsnZGVmYXVsdCddLCB7IGtleTogaSxcbiAgICAgICAgaW5kZXg6IGksXG4gICAgICAgIHRoZW1lOiB0aGVtZSxcbiAgICAgICAgc2VsZWN0OiBzZWxlY3QsXG4gICAgICAgIGFjdGlvbjogYWN0aW9uLFxuICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgIHByZXZpb3VzU3RhdGU6IHByZXZpb3VzU3RhdGUsXG4gICAgICAgIGNvbGxhcHNlZDogc2tpcHBlZEFjdGlvbnNbaV0sXG4gICAgICAgIGVycm9yOiBlcnJvcixcbiAgICAgICAgb25BY3Rpb25DbGljazogdGhpcy5oYW5kbGVUb2dnbGVBY3Rpb24uYmluZCh0aGlzKSB9KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2RpdicsXG4gICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmNvbnRhaW5lciwgeyBiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLmJhc2UwMCB9KSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdkaXYnLFxuICAgICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJ1dHRvbkJhciwgeyBib3JkZXJDb2xvcjogdGhlbWUuYmFzZTAyIH0pIH0sXG4gICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgIF9Mb2dNb25pdG9yQnV0dG9uMlsnZGVmYXVsdCddLFxuICAgICAgICAgIHsgdGhlbWU6IHRoZW1lLCBvbkNsaWNrOiB0aGlzLmhhbmRsZVJlc2V0LmJpbmQodGhpcykgfSxcbiAgICAgICAgICAnUmVzZXQnXG4gICAgICAgICksXG4gICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgIF9Mb2dNb25pdG9yQnV0dG9uMlsnZGVmYXVsdCddLFxuICAgICAgICAgIHsgdGhlbWU6IHRoZW1lLCBvbkNsaWNrOiB0aGlzLmhhbmRsZVJvbGxiYWNrLmJpbmQodGhpcyksIGVuYWJsZWQ6IGNvbXB1dGVkU3RhdGVzLmxlbmd0aCB9LFxuICAgICAgICAgICdSZXZlcnQnXG4gICAgICAgICksXG4gICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgIF9Mb2dNb25pdG9yQnV0dG9uMlsnZGVmYXVsdCddLFxuICAgICAgICAgIHsgdGhlbWU6IHRoZW1lLCBvbkNsaWNrOiB0aGlzLmhhbmRsZVN3ZWVwLmJpbmQodGhpcyksIGVuYWJsZWQ6IE9iamVjdC5rZXlzKHNraXBwZWRBY3Rpb25zKS5zb21lKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNraXBwZWRBY3Rpb25zW2tleV07XG4gICAgICAgICAgICB9KSB9LFxuICAgICAgICAgICdTd2VlcCdcbiAgICAgICAgKSxcbiAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgX0xvZ01vbml0b3JCdXR0b24yWydkZWZhdWx0J10sXG4gICAgICAgICAgeyB0aGVtZTogdGhlbWUsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ29tbWl0LmJpbmQodGhpcyksIGVuYWJsZWQ6IGNvbXB1dGVkU3RhdGVzLmxlbmd0aCA+IDEgfSxcbiAgICAgICAgICAnQ29tbWl0J1xuICAgICAgICApXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdkaXYnLFxuICAgICAgICB7IHN0eWxlOiBzdHlsZXMuZWxlbWVudHMsIHJlZjogJ2VsZW1lbnRzJyB9LFxuICAgICAgICBlbGVtZW50c1xuICAgICAgKVxuICAgICk7XG4gIH07XG5cbiAgX2NyZWF0ZUNsYXNzKExvZ01vbml0b3IsIG51bGwsIFt7XG4gICAga2V5OiAncHJvcFR5cGVzJyxcbiAgICB2YWx1ZToge1xuICAgICAgY29tcHV0ZWRTdGF0ZXM6IF9yZWFjdC5Qcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZCxcbiAgICAgIGN1cnJlbnRTdGF0ZUluZGV4OiBfcmVhY3QuUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICAgICAgbW9uaXRvclN0YXRlOiBfcmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgc3RhZ2VkQWN0aW9uczogX3JlYWN0LlByb3BUeXBlcy5hcnJheS5pc1JlcXVpcmVkLFxuICAgICAgc2tpcHBlZEFjdGlvbnM6IF9yZWFjdC5Qcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgICByZXNldDogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICBjb21taXQ6IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgcm9sbGJhY2s6IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgc3dlZXA6IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgdG9nZ2xlQWN0aW9uOiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgIGp1bXBUb1N0YXRlOiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgIHNldE1vbml0b3JTdGF0ZTogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICBzZWxlY3Q6IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgdmlzaWJsZU9uTG9hZDogX3JlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgICAgdGhlbWU6IF9yZWFjdC5Qcm9wVHlwZXMub25lT2ZUeXBlKFtfcmVhY3QuUHJvcFR5cGVzLm9iamVjdCwgX3JlYWN0LlByb3BUeXBlcy5zdHJpbmddKVxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9LCB7XG4gICAga2V5OiAnZGVmYXVsdFByb3BzJyxcbiAgICB2YWx1ZToge1xuICAgICAgc2VsZWN0OiBmdW5jdGlvbiBzZWxlY3Qoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgfSxcbiAgICAgIG1vbml0b3JTdGF0ZTogeyBpc1Zpc2libGU6IHRydWUgfSxcbiAgICAgIHRoZW1lOiAnbmljaW5hYm94JyxcbiAgICAgIHZpc2libGVPbkxvYWQ6IHRydWVcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfV0pO1xuXG4gIHJldHVybiBMb2dNb25pdG9yO1xufSkoX3JlYWN0LkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IExvZ01vbml0b3I7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF91dGlsc0JyaWdodGVuID0gcmVxdWlyZSgnLi4vdXRpbHMvYnJpZ2h0ZW4nKTtcblxudmFyIF91dGlsc0JyaWdodGVuMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzQnJpZ2h0ZW4pO1xuXG52YXIgc3R5bGVzID0ge1xuICBiYXNlOiB7XG4gICAgY3Vyc29yOiAncG9pbnRlcicsXG4gICAgZm9udFdlaWdodDogJ2JvbGQnLFxuICAgIGJvcmRlclJhZGl1czogMyxcbiAgICBwYWRkaW5nOiA0LFxuICAgIG1hcmdpbkxlZnQ6IDMsXG4gICAgbWFyZ2luUmlnaHQ6IDMsXG4gICAgbWFyZ2luVG9wOiA1LFxuICAgIG1hcmdpbkJvdHRvbTogNSxcbiAgICBmbGV4R3JvdzogMSxcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICBmb250U2l6ZTogJzAuOGVtJyxcbiAgICBjb2xvcjogJ3doaXRlJyxcbiAgICB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnXG4gIH1cbn07XG5cbnZhciBMb2dNb25pdG9yQnV0dG9uID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhMb2dNb25pdG9yQnV0dG9uLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBMb2dNb25pdG9yQnV0dG9uKHByb3BzKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExvZ01vbml0b3JCdXR0b24pO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5jYWxsKHRoaXMsIHByb3BzKTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgaG92ZXJlZDogZmFsc2UsXG4gICAgICBhY3RpdmU6IGZhbHNlXG4gICAgfTtcbiAgfVxuXG4gIExvZ01vbml0b3JCdXR0b24ucHJvdG90eXBlLmhhbmRsZU1vdXNlRW50ZXIgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZUVudGVyKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoeyBob3ZlcmVkOiB0cnVlIH0pO1xuICB9O1xuXG4gIExvZ01vbml0b3JCdXR0b24ucHJvdG90eXBlLmhhbmRsZU1vdXNlTGVhdmUgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZUxlYXZlKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoeyBob3ZlcmVkOiBmYWxzZSB9KTtcbiAgfTtcblxuICBMb2dNb25pdG9yQnV0dG9uLnByb3RvdHlwZS5oYW5kbGVNb3VzZURvd24gPSBmdW5jdGlvbiBoYW5kbGVNb3VzZURvd24oKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7IGFjdGl2ZTogdHJ1ZSB9KTtcbiAgfTtcblxuICBMb2dNb25pdG9yQnV0dG9uLnByb3RvdHlwZS5oYW5kbGVNb3VzZVVwID0gZnVuY3Rpb24gaGFuZGxlTW91c2VVcCgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHsgYWN0aXZlOiBmYWxzZSB9KTtcbiAgfTtcblxuICBMb2dNb25pdG9yQnV0dG9uLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24gb25DbGljaygpIHtcbiAgICBpZiAoIXRoaXMucHJvcHMuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wcy5vbkNsaWNrKSB7XG4gICAgICB0aGlzLnByb3BzLm9uQ2xpY2soKTtcbiAgICB9XG4gIH07XG5cbiAgTG9nTW9uaXRvckJ1dHRvbi5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBzdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZXMuYmFzZSwge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwMlxuICAgIH0pO1xuICAgIGlmICh0aGlzLnByb3BzLmVuYWJsZWQgJiYgdGhpcy5zdGF0ZS5ob3ZlcmVkKSB7XG4gICAgICBzdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZSwge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IF91dGlsc0JyaWdodGVuMlsnZGVmYXVsdCddKHRoaXMucHJvcHMudGhlbWUuYmFzZTAyLCAwLjIpXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnByb3BzLmVuYWJsZWQpIHtcbiAgICAgIHN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlLCB7XG4gICAgICAgIG9wYWNpdHk6IDAuMixcbiAgICAgICAgY3Vyc29yOiAndGV4dCcsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50J1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdhJyxcbiAgICAgIHsgb25Nb3VzZUVudGVyOiB0aGlzLmhhbmRsZU1vdXNlRW50ZXIuYmluZCh0aGlzKSxcbiAgICAgICAgb25Nb3VzZUxlYXZlOiB0aGlzLmhhbmRsZU1vdXNlTGVhdmUuYmluZCh0aGlzKSxcbiAgICAgICAgb25Nb3VzZURvd246IHRoaXMuaGFuZGxlTW91c2VEb3duLmJpbmQodGhpcyksXG4gICAgICAgIG9uTW91c2VVcDogdGhpcy5oYW5kbGVNb3VzZVVwLmJpbmQodGhpcyksXG4gICAgICAgIHN0eWxlOiBzdHlsZSwgb25DbGljazogdGhpcy5vbkNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICApO1xuICB9O1xuXG4gIHJldHVybiBMb2dNb25pdG9yQnV0dG9uO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IExvZ01vbml0b3JCdXR0b247XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdEpzb25UcmVlID0gcmVxdWlyZSgncmVhY3QtanNvbi10cmVlJyk7XG5cbnZhciBfcmVhY3RKc29uVHJlZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdEpzb25UcmVlKTtcblxudmFyIF9Mb2dNb25pdG9yRW50cnlBY3Rpb24gPSByZXF1aXJlKCcuL0xvZ01vbml0b3JFbnRyeUFjdGlvbicpO1xuXG52YXIgX0xvZ01vbml0b3JFbnRyeUFjdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Mb2dNb25pdG9yRW50cnlBY3Rpb24pO1xuXG52YXIgc3R5bGVzID0ge1xuICBlbnRyeToge1xuICAgIGRpc3BsYXk6ICdibG9jaycsXG4gICAgV2Via2l0VXNlclNlbGVjdDogJ25vbmUnXG4gIH0sXG4gIHRyZWU6IHtcbiAgICBwYWRkaW5nTGVmdDogMFxuICB9XG59O1xuXG52YXIgTG9nTW9uaXRvckVudHJ5ID0gKGZ1bmN0aW9uIChfQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhMb2dNb25pdG9yRW50cnksIF9Db21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIExvZ01vbml0b3JFbnRyeSgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTG9nTW9uaXRvckVudHJ5KTtcblxuICAgIF9Db21wb25lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIExvZ01vbml0b3JFbnRyeS5wcm90b3R5cGUucHJpbnRTdGF0ZSA9IGZ1bmN0aW9uIHByaW50U3RhdGUoc3RhdGUsIGVycm9yKSB7XG4gICAgdmFyIGVycm9yVGV4dCA9IGVycm9yO1xuICAgIGlmICghZXJyb3JUZXh0KSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX3JlYWN0SnNvblRyZWUyWydkZWZhdWx0J10sIHtcbiAgICAgICAgICB0aGVtZTogdGhpcy5wcm9wcy50aGVtZSxcbiAgICAgICAgICBrZXlOYW1lOiAnc3RhdGUnLFxuICAgICAgICAgIGRhdGE6IHRoaXMucHJvcHMuc2VsZWN0KHN0YXRlKSxcbiAgICAgICAgICBwcmV2aW91c0RhdGE6IHRoaXMucHJvcHMuc2VsZWN0KHRoaXMucHJvcHMucHJldmlvdXNTdGF0ZSksXG4gICAgICAgICAgc3R5bGU6IHN0eWxlcy50cmVlIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGVycm9yVGV4dCA9ICdFcnJvciBzZWxlY3Rpbmcgc3RhdGUuJztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2RpdicsXG4gICAgICB7IHN0eWxlOiB7XG4gICAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTA4LFxuICAgICAgICAgIHBhZGRpbmdUb3A6IDIwLFxuICAgICAgICAgIHBhZGRpbmdMZWZ0OiAzMCxcbiAgICAgICAgICBwYWRkaW5nUmlnaHQ6IDMwLFxuICAgICAgICAgIHBhZGRpbmdCb3R0b206IDM1XG4gICAgICAgIH0gfSxcbiAgICAgIGVycm9yVGV4dFxuICAgICk7XG4gIH07XG5cbiAgTG9nTW9uaXRvckVudHJ5LnByb3RvdHlwZS5oYW5kbGVBY3Rpb25DbGljayA9IGZ1bmN0aW9uIGhhbmRsZUFjdGlvbkNsaWNrKCkge1xuICAgIHZhciBfcHJvcHMgPSB0aGlzLnByb3BzO1xuICAgIHZhciBpbmRleCA9IF9wcm9wcy5pbmRleDtcbiAgICB2YXIgb25BY3Rpb25DbGljayA9IF9wcm9wcy5vbkFjdGlvbkNsaWNrO1xuXG4gICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgb25BY3Rpb25DbGljayhpbmRleCk7XG4gICAgfVxuICB9O1xuXG4gIExvZ01vbml0b3JFbnRyeS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBfcHJvcHMyID0gdGhpcy5wcm9wcztcbiAgICB2YXIgaW5kZXggPSBfcHJvcHMyLmluZGV4O1xuICAgIHZhciBlcnJvciA9IF9wcm9wczIuZXJyb3I7XG4gICAgdmFyIGFjdGlvbiA9IF9wcm9wczIuYWN0aW9uO1xuICAgIHZhciBzdGF0ZSA9IF9wcm9wczIuc3RhdGU7XG4gICAgdmFyIGNvbGxhcHNlZCA9IF9wcm9wczIuY29sbGFwc2VkO1xuXG4gICAgdmFyIHN0eWxlRW50cnkgPSB7XG4gICAgICBvcGFjaXR5OiBjb2xsYXBzZWQgPyAwLjUgOiAxLFxuICAgICAgY3Vyc29yOiBpbmRleCA+IDAgPyAncG9pbnRlcicgOiAnZGVmYXVsdCdcbiAgICB9O1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdkaXYnLFxuICAgICAgeyBzdHlsZTogeyB0ZXh0RGVjb3JhdGlvbjogY29sbGFwc2VkID8gJ2xpbmUtdGhyb3VnaCcgOiAnbm9uZScgfSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0xvZ01vbml0b3JFbnRyeUFjdGlvbjJbJ2RlZmF1bHQnXSwge1xuICAgICAgICB0aGVtZTogdGhpcy5wcm9wcy50aGVtZSxcbiAgICAgICAgY29sbGFwc2VkOiBjb2xsYXBzZWQsXG4gICAgICAgIGFjdGlvbjogYWN0aW9uLFxuICAgICAgICBvbkNsaWNrOiB0aGlzLmhhbmRsZUFjdGlvbkNsaWNrLmJpbmQodGhpcyksXG4gICAgICAgIHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmVudHJ5LCBzdHlsZUVudHJ5KSB9KSxcbiAgICAgICFjb2xsYXBzZWQgJiYgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdkaXYnLFxuICAgICAgICBudWxsLFxuICAgICAgICB0aGlzLnByaW50U3RhdGUoc3RhdGUsIGVycm9yKVxuICAgICAgKVxuICAgICk7XG4gIH07XG5cbiAgX2NyZWF0ZUNsYXNzKExvZ01vbml0b3JFbnRyeSwgbnVsbCwgW3tcbiAgICBrZXk6ICdwcm9wVHlwZXMnLFxuICAgIHZhbHVlOiB7XG4gICAgICBpbmRleDogX3JlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcbiAgICAgIHN0YXRlOiBfcmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgYWN0aW9uOiBfcmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgc2VsZWN0OiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgIGVycm9yOiBfcmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICAgIG9uQWN0aW9uQ2xpY2s6IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgY29sbGFwc2VkOiBfcmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfV0pO1xuXG4gIHJldHVybiBMb2dNb25pdG9yRW50cnk7XG59KShfcmVhY3QuQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gTG9nTW9uaXRvckVudHJ5O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhvYmosIGtleXMpIHsgdmFyIHRhcmdldCA9IHt9OyBmb3IgKHZhciBpIGluIG9iaikgeyBpZiAoa2V5cy5pbmRleE9mKGkpID49IDApIGNvbnRpbnVlOyBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGkpKSBjb250aW51ZTsgdGFyZ2V0W2ldID0gb2JqW2ldOyB9IHJldHVybiB0YXJnZXQ7IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdEpzb25UcmVlID0gcmVxdWlyZSgncmVhY3QtanNvbi10cmVlJyk7XG5cbnZhciBfcmVhY3RKc29uVHJlZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdEpzb25UcmVlKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYWN0aW9uQmFyOiB7XG4gICAgcGFkZGluZ1RvcDogOCxcbiAgICBwYWRkaW5nQm90dG9tOiA3LFxuICAgIHBhZGRpbmdMZWZ0OiAxNlxuICB9LFxuICBwYXlsb2FkOiB7XG4gICAgbWFyZ2luOiAwLFxuICAgIG92ZXJmbG93OiAnYXV0bydcbiAgfVxufTtcblxudmFyIExvZ01vbml0b3JBY3Rpb24gPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKExvZ01vbml0b3JBY3Rpb24sIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIExvZ01vbml0b3JBY3Rpb24oKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExvZ01vbml0b3JBY3Rpb24pO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgTG9nTW9uaXRvckFjdGlvbi5wcm90b3R5cGUucmVuZGVyUGF5bG9hZCA9IGZ1bmN0aW9uIHJlbmRlclBheWxvYWQocGF5bG9hZCkge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdkaXYnLFxuICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5wYXlsb2FkLCB7XG4gICAgICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwMFxuICAgICAgICB9KSB9LFxuICAgICAgT2JqZWN0LmtleXMocGF5bG9hZCkubGVuZ3RoID4gMCA/IF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9yZWFjdEpzb25UcmVlMlsnZGVmYXVsdCddLCB7IHRoZW1lOiB0aGlzLnByb3BzLnRoZW1lLCBrZXlOYW1lOiAnYWN0aW9uJywgZGF0YTogcGF5bG9hZCB9KSA6ICcnXG4gICAgKTtcbiAgfTtcblxuICBMb2dNb25pdG9yQWN0aW9uLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIF9wcm9wcyRhY3Rpb24gPSB0aGlzLnByb3BzLmFjdGlvbjtcbiAgICB2YXIgdHlwZSA9IF9wcm9wcyRhY3Rpb24udHlwZTtcblxuICAgIHZhciBwYXlsb2FkID0gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKF9wcm9wcyRhY3Rpb24sIFsndHlwZSddKTtcblxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdkaXYnLFxuICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe1xuICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDIsXG4gICAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTA2XG4gICAgICAgIH0sIHRoaXMucHJvcHMuc3R5bGUpIH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2RpdicsXG4gICAgICAgIHsgc3R5bGU6IHN0eWxlcy5hY3Rpb25CYXIsXG4gICAgICAgICAgb25DbGljazogdGhpcy5wcm9wcy5vbkNsaWNrIH0sXG4gICAgICAgIHR5cGVcbiAgICAgICksXG4gICAgICAhdGhpcy5wcm9wcy5jb2xsYXBzZWQgPyB0aGlzLnJlbmRlclBheWxvYWQocGF5bG9hZCkgOiAnJ1xuICAgICk7XG4gIH07XG5cbiAgcmV0dXJuIExvZ01vbml0b3JBY3Rpb247XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gTG9nTW9uaXRvckFjdGlvbjtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlKG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqWydkZWZhdWx0J10gOiBvYmo7IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfY3JlYXRlRGV2VG9vbHMgPSByZXF1aXJlKCcuLi9jcmVhdGVEZXZUb29scycpO1xuXG52YXIgX2NyZWF0ZURldlRvb2xzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NyZWF0ZURldlRvb2xzKTtcblxudmFyIERldlRvb2xzID0gX2NyZWF0ZURldlRvb2xzMlsnZGVmYXVsdCddKF9yZWFjdDJbJ2RlZmF1bHQnXSk7XG5leHBvcnRzLkRldlRvb2xzID0gRGV2VG9vbHM7XG5cbnZhciBfTG9nTW9uaXRvciA9IHJlcXVpcmUoJy4vTG9nTW9uaXRvcicpO1xuXG5leHBvcnRzLkxvZ01vbml0b3IgPSBfaW50ZXJvcFJlcXVpcmUoX0xvZ01vbml0b3IpO1xuXG52YXIgX0RlYnVnUGFuZWwgPSByZXF1aXJlKCcuL0RlYnVnUGFuZWwnKTtcblxuZXhwb3J0cy5EZWJ1Z1BhbmVsID0gX2ludGVyb3BSZXF1aXJlKF9EZWJ1Z1BhbmVsKTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2FwYXRoeScsXG4gIGF1dGhvcjogJ2phbm5payBzaWViZXJ0IChodHRwczovL2dpdGh1Yi5jb20vamFubmlrcyknLFxuICBiYXNlMDA6ICcjMDMxQTE2JyxcbiAgYmFzZTAxOiAnIzBCMzQyRCcsXG4gIGJhc2UwMjogJyMxODRFNDUnLFxuICBiYXNlMDM6ICcjMkI2ODVFJyxcbiAgYmFzZTA0OiAnIzVGOUM5MicsXG4gIGJhc2UwNTogJyM4MUI1QUMnLFxuICBiYXNlMDY6ICcjQTdDRUM4JyxcbiAgYmFzZTA3OiAnI0QyRTdFNCcsXG4gIGJhc2UwODogJyMzRTk2ODgnLFxuICBiYXNlMDk6ICcjM0U3OTk2JyxcbiAgYmFzZTBBOiAnIzNFNEM5NicsXG4gIGJhc2UwQjogJyM4ODNFOTYnLFxuICBiYXNlMEM6ICcjOTYzRTRDJyxcbiAgYmFzZTBEOiAnIzk2ODgzRScsXG4gIGJhc2UwRTogJyM0Qzk2M0UnLFxuICBiYXNlMEY6ICcjM0U5NjVCJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnYXNoZXMnLFxuICBhdXRob3I6ICdqYW5uaWsgc2llYmVydCAoaHR0cHM6Ly9naXRodWIuY29tL2phbm5pa3MpJyxcbiAgYmFzZTAwOiAnIzFDMjAyMycsXG4gIGJhc2UwMTogJyMzOTNGNDUnLFxuICBiYXNlMDI6ICcjNTY1RTY1JyxcbiAgYmFzZTAzOiAnIzc0N0M4NCcsXG4gIGJhc2UwNDogJyNBREIzQkEnLFxuICBiYXNlMDU6ICcjQzdDQ0QxJyxcbiAgYmFzZTA2OiAnI0RGRTJFNScsXG4gIGJhc2UwNzogJyNGM0Y0RjUnLFxuICBiYXNlMDg6ICcjQzdBRTk1JyxcbiAgYmFzZTA5OiAnI0M3Qzc5NScsXG4gIGJhc2UwQTogJyNBRUM3OTUnLFxuICBiYXNlMEI6ICcjOTVDN0FFJyxcbiAgYmFzZTBDOiAnIzk1QUVDNycsXG4gIGJhc2UwRDogJyNBRTk1QzcnLFxuICBiYXNlMEU6ICcjQzc5NUFFJyxcbiAgYmFzZTBGOiAnI0M3OTU5NSdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2F0ZWxpZXIgZHVuZScsXG4gIGF1dGhvcjogJ2JyYW0gZGUgaGFhbiAoaHR0cDovL2F0ZWxpZXJicmFtLmdpdGh1Yi5pby9zeW50YXgtaGlnaGxpZ2h0aW5nL2F0ZWxpZXItc2NoZW1lcy9kdW5lKScsXG4gIGJhc2UwMDogJyMyMDIwMWQnLFxuICBiYXNlMDE6ICcjMjkyODI0JyxcbiAgYmFzZTAyOiAnIzZlNmI1ZScsXG4gIGJhc2UwMzogJyM3ZDdhNjgnLFxuICBiYXNlMDQ6ICcjOTk5NTgwJyxcbiAgYmFzZTA1OiAnI2E2YTI4YycsXG4gIGJhc2UwNjogJyNlOGU0Y2YnLFxuICBiYXNlMDc6ICcjZmVmYmVjJyxcbiAgYmFzZTA4OiAnI2Q3MzczNycsXG4gIGJhc2UwOTogJyNiNjU2MTEnLFxuICBiYXNlMEE6ICcjY2ZiMDE3JyxcbiAgYmFzZTBCOiAnIzYwYWMzOScsXG4gIGJhc2UwQzogJyMxZmFkODMnLFxuICBiYXNlMEQ6ICcjNjY4NGUxJyxcbiAgYmFzZTBFOiAnI2I4NTRkNCcsXG4gIGJhc2UwRjogJyNkNDM1NTInXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdhdGVsaWVyIGZvcmVzdCcsXG4gIGF1dGhvcjogJ2JyYW0gZGUgaGFhbiAoaHR0cDovL2F0ZWxpZXJicmFtLmdpdGh1Yi5pby9zeW50YXgtaGlnaGxpZ2h0aW5nL2F0ZWxpZXItc2NoZW1lcy9mb3Jlc3QpJyxcbiAgYmFzZTAwOiAnIzFiMTkxOCcsXG4gIGJhc2UwMTogJyMyYzI0MjEnLFxuICBiYXNlMDI6ICcjNjg2MTVlJyxcbiAgYmFzZTAzOiAnIzc2NmU2YicsXG4gIGJhc2UwNDogJyM5Yzk0OTEnLFxuICBiYXNlMDU6ICcjYThhMTlmJyxcbiAgYmFzZTA2OiAnI2U2ZTJlMCcsXG4gIGJhc2UwNzogJyNmMWVmZWUnLFxuICBiYXNlMDg6ICcjZjIyYzQwJyxcbiAgYmFzZTA5OiAnI2RmNTMyMCcsXG4gIGJhc2UwQTogJyNkNTkxMWEnLFxuICBiYXNlMEI6ICcjNWFiNzM4JyxcbiAgYmFzZTBDOiAnIzAwYWQ5YycsXG4gIGJhc2UwRDogJyM0MDdlZTcnLFxuICBiYXNlMEU6ICcjNjY2NmVhJyxcbiAgYmFzZTBGOiAnI2MzM2ZmMydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2F0ZWxpZXIgaGVhdGgnLFxuICBhdXRob3I6ICdicmFtIGRlIGhhYW4gKGh0dHA6Ly9hdGVsaWVyYnJhbS5naXRodWIuaW8vc3ludGF4LWhpZ2hsaWdodGluZy9hdGVsaWVyLXNjaGVtZXMvaGVhdGgpJyxcbiAgYmFzZTAwOiAnIzFiMTgxYicsXG4gIGJhc2UwMTogJyMyOTIzMjknLFxuICBiYXNlMDI6ICcjNjk1ZDY5JyxcbiAgYmFzZTAzOiAnIzc3Njk3NycsXG4gIGJhc2UwNDogJyM5ZThmOWUnLFxuICBiYXNlMDU6ICcjYWI5YmFiJyxcbiAgYmFzZTA2OiAnI2Q4Y2FkOCcsXG4gIGJhc2UwNzogJyNmN2YzZjcnLFxuICBiYXNlMDg6ICcjY2E0MDJiJyxcbiAgYmFzZTA5OiAnI2E2NTkyNicsXG4gIGJhc2UwQTogJyNiYjhhMzUnLFxuICBiYXNlMEI6ICcjMzc5YTM3JyxcbiAgYmFzZTBDOiAnIzE1OTM5MycsXG4gIGJhc2UwRDogJyM1MTZhZWMnLFxuICBiYXNlMEU6ICcjN2I1OWMwJyxcbiAgYmFzZTBGOiAnI2NjMzNjYydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2F0ZWxpZXIgbGFrZXNpZGUnLFxuICBhdXRob3I6ICdicmFtIGRlIGhhYW4gKGh0dHA6Ly9hdGVsaWVyYnJhbS5naXRodWIuaW8vc3ludGF4LWhpZ2hsaWdodGluZy9hdGVsaWVyLXNjaGVtZXMvbGFrZXNpZGUvKScsXG4gIGJhc2UwMDogJyMxNjFiMWQnLFxuICBiYXNlMDE6ICcjMWYyOTJlJyxcbiAgYmFzZTAyOiAnIzUxNmQ3YicsXG4gIGJhc2UwMzogJyM1YTdiOGMnLFxuICBiYXNlMDQ6ICcjNzE5NWE4JyxcbiAgYmFzZTA1OiAnIzdlYTJiNCcsXG4gIGJhc2UwNjogJyNjMWU0ZjYnLFxuICBiYXNlMDc6ICcjZWJmOGZmJyxcbiAgYmFzZTA4OiAnI2QyMmQ3MicsXG4gIGJhc2UwOTogJyM5MzVjMjUnLFxuICBiYXNlMEE6ICcjOGE4YTBmJyxcbiAgYmFzZTBCOiAnIzU2OGMzYicsXG4gIGJhc2UwQzogJyMyZDhmNmYnLFxuICBiYXNlMEQ6ICcjMjU3ZmFkJyxcbiAgYmFzZTBFOiAnIzVkNWRiMScsXG4gIGJhc2UwRjogJyNiNzJkZDInXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdhdGVsaWVyIHNlYXNpZGUnLFxuICBhdXRob3I6ICdicmFtIGRlIGhhYW4gKGh0dHA6Ly9hdGVsaWVyYnJhbS5naXRodWIuaW8vc3ludGF4LWhpZ2hsaWdodGluZy9hdGVsaWVyLXNjaGVtZXMvc2Vhc2lkZS8pJyxcbiAgYmFzZTAwOiAnIzEzMTUxMycsXG4gIGJhc2UwMTogJyMyNDI5MjQnLFxuICBiYXNlMDI6ICcjNWU2ZTVlJyxcbiAgYmFzZTAzOiAnIzY4N2Q2OCcsXG4gIGJhc2UwNDogJyM4MDk5ODAnLFxuICBiYXNlMDU6ICcjOGNhNjhjJyxcbiAgYmFzZTA2OiAnI2NmZThjZicsXG4gIGJhc2UwNzogJyNmMGZmZjAnLFxuICBiYXNlMDg6ICcjZTYxOTNjJyxcbiAgYmFzZTA5OiAnIzg3NzExZCcsXG4gIGJhc2UwQTogJyNjM2MzMjInLFxuICBiYXNlMEI6ICcjMjlhMzI5JyxcbiAgYmFzZTBDOiAnIzE5OTliMycsXG4gIGJhc2UwRDogJyMzZDYyZjUnLFxuICBiYXNlMEU6ICcjYWQyYmVlJyxcbiAgYmFzZTBGOiAnI2U2MTljMydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2Jlc3BpbicsXG4gIGF1dGhvcjogJ2phbiB0LiBzb3R0JyxcbiAgYmFzZTAwOiAnIzI4MjExYycsXG4gIGJhc2UwMTogJyMzNjMxMmUnLFxuICBiYXNlMDI6ICcjNWU1ZDVjJyxcbiAgYmFzZTAzOiAnIzY2NjY2NicsXG4gIGJhc2UwNDogJyM3OTc5NzcnLFxuICBiYXNlMDU6ICcjOGE4OTg2JyxcbiAgYmFzZTA2OiAnIzlkOWI5NycsXG4gIGJhc2UwNzogJyNiYWFlOWUnLFxuICBiYXNlMDg6ICcjY2Y2YTRjJyxcbiAgYmFzZTA5OiAnI2NmN2QzNCcsXG4gIGJhc2UwQTogJyNmOWVlOTgnLFxuICBiYXNlMEI6ICcjNTRiZTBkJyxcbiAgYmFzZTBDOiAnI2FmYzRkYicsXG4gIGJhc2UwRDogJyM1ZWE2ZWEnLFxuICBiYXNlMEU6ICcjOWI4NTlkJyxcbiAgYmFzZTBGOiAnIzkzNzEyMSdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2JyZXdlcicsXG4gIGF1dGhvcjogJ3RpbW90aMOpZSBwb2lzb3QgKGh0dHA6Ly9naXRodWIuY29tL3Rwb2lzb3QpJyxcbiAgYmFzZTAwOiAnIzBjMGQwZScsXG4gIGJhc2UwMTogJyMyZTJmMzAnLFxuICBiYXNlMDI6ICcjNTE1MjUzJyxcbiAgYmFzZTAzOiAnIzczNzQ3NScsXG4gIGJhc2UwNDogJyM5NTk2OTcnLFxuICBiYXNlMDU6ICcjYjdiOGI5JyxcbiAgYmFzZTA2OiAnI2RhZGJkYycsXG4gIGJhc2UwNzogJyNmY2ZkZmUnLFxuICBiYXNlMDg6ICcjZTMxYTFjJyxcbiAgYmFzZTA5OiAnI2U2NTUwZCcsXG4gIGJhc2UwQTogJyNkY2EwNjAnLFxuICBiYXNlMEI6ICcjMzFhMzU0JyxcbiAgYmFzZTBDOiAnIzgwYjFkMycsXG4gIGJhc2UwRDogJyMzMTgyYmQnLFxuICBiYXNlMEU6ICcjNzU2YmIxJyxcbiAgYmFzZTBGOiAnI2IxNTkyOCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2JyaWdodCcsXG4gIGF1dGhvcjogJ2NocmlzIGtlbXBzb24gKGh0dHA6Ly9jaHJpc2tlbXBzb24uY29tKScsXG4gIGJhc2UwMDogJyMwMDAwMDAnLFxuICBiYXNlMDE6ICcjMzAzMDMwJyxcbiAgYmFzZTAyOiAnIzUwNTA1MCcsXG4gIGJhc2UwMzogJyNiMGIwYjAnLFxuICBiYXNlMDQ6ICcjZDBkMGQwJyxcbiAgYmFzZTA1OiAnI2UwZTBlMCcsXG4gIGJhc2UwNjogJyNmNWY1ZjUnLFxuICBiYXNlMDc6ICcjZmZmZmZmJyxcbiAgYmFzZTA4OiAnI2ZiMDEyMCcsXG4gIGJhc2UwOTogJyNmYzZkMjQnLFxuICBiYXNlMEE6ICcjZmRhMzMxJyxcbiAgYmFzZTBCOiAnI2ExYzY1OScsXG4gIGJhc2UwQzogJyM3NmM3YjcnLFxuICBiYXNlMEQ6ICcjNmZiM2QyJyxcbiAgYmFzZTBFOiAnI2QzODFjMycsXG4gIGJhc2UwRjogJyNiZTY0M2MnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdjaGFsaycsXG4gIGF1dGhvcjogJ2NocmlzIGtlbXBzb24gKGh0dHA6Ly9jaHJpc2tlbXBzb24uY29tKScsXG4gIGJhc2UwMDogJyMxNTE1MTUnLFxuICBiYXNlMDE6ICcjMjAyMDIwJyxcbiAgYmFzZTAyOiAnIzMwMzAzMCcsXG4gIGJhc2UwMzogJyM1MDUwNTAnLFxuICBiYXNlMDQ6ICcjYjBiMGIwJyxcbiAgYmFzZTA1OiAnI2QwZDBkMCcsXG4gIGJhc2UwNjogJyNlMGUwZTAnLFxuICBiYXNlMDc6ICcjZjVmNWY1JyxcbiAgYmFzZTA4OiAnI2ZiOWZiMScsXG4gIGJhc2UwOTogJyNlZGE5ODcnLFxuICBiYXNlMEE6ICcjZGRiMjZmJyxcbiAgYmFzZTBCOiAnI2FjYzI2NycsXG4gIGJhc2UwQzogJyMxMmNmYzAnLFxuICBiYXNlMEQ6ICcjNmZjMmVmJyxcbiAgYmFzZTBFOiAnI2UxYTNlZScsXG4gIGJhc2UwRjogJyNkZWFmOGYnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdjb2Rlc2Nob29sJyxcbiAgYXV0aG9yOiAnYnJldHRvZjg2JyxcbiAgYmFzZTAwOiAnIzIzMmMzMScsXG4gIGJhc2UwMTogJyMxYzM2NTcnLFxuICBiYXNlMDI6ICcjMmEzNDNhJyxcbiAgYmFzZTAzOiAnIzNmNDk0NCcsXG4gIGJhc2UwNDogJyM4NDg5OGMnLFxuICBiYXNlMDU6ICcjOWVhN2E2JyxcbiAgYmFzZTA2OiAnI2E3Y2ZhMycsXG4gIGJhc2UwNzogJyNiNWQ4ZjYnLFxuICBiYXNlMDg6ICcjMmE1NDkxJyxcbiAgYmFzZTA5OiAnIzQzODIwZCcsXG4gIGJhc2UwQTogJyNhMDNiMWUnLFxuICBiYXNlMEI6ICcjMjM3OTg2JyxcbiAgYmFzZTBDOiAnI2IwMmYzMCcsXG4gIGJhc2UwRDogJyM0ODRkNzknLFxuICBiYXNlMEU6ICcjYzU5ODIwJyxcbiAgYmFzZTBGOiAnI2M5ODM0NCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2NvbG9ycycsXG4gIGF1dGhvcjogJ21ybXJzIChodHRwOi8vY2xycy5jYyknLFxuICBiYXNlMDA6ICcjMTExMTExJyxcbiAgYmFzZTAxOiAnIzMzMzMzMycsXG4gIGJhc2UwMjogJyM1NTU1NTUnLFxuICBiYXNlMDM6ICcjNzc3Nzc3JyxcbiAgYmFzZTA0OiAnIzk5OTk5OScsXG4gIGJhc2UwNTogJyNiYmJiYmInLFxuICBiYXNlMDY6ICcjZGRkZGRkJyxcbiAgYmFzZTA3OiAnI2ZmZmZmZicsXG4gIGJhc2UwODogJyNmZjQxMzYnLFxuICBiYXNlMDk6ICcjZmY4NTFiJyxcbiAgYmFzZTBBOiAnI2ZmZGMwMCcsXG4gIGJhc2UwQjogJyMyZWNjNDAnLFxuICBiYXNlMEM6ICcjN2ZkYmZmJyxcbiAgYmFzZTBEOiAnIzAwNzRkOScsXG4gIGJhc2UwRTogJyNiMTBkYzknLFxuICBiYXNlMEY6ICcjODUxNDRiJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnZGVmYXVsdCcsXG4gIGF1dGhvcjogJ2NocmlzIGtlbXBzb24gKGh0dHA6Ly9jaHJpc2tlbXBzb24uY29tKScsXG4gIGJhc2UwMDogJyMxODE4MTgnLFxuICBiYXNlMDE6ICcjMjgyODI4JyxcbiAgYmFzZTAyOiAnIzM4MzgzOCcsXG4gIGJhc2UwMzogJyM1ODU4NTgnLFxuICBiYXNlMDQ6ICcjYjhiOGI4JyxcbiAgYmFzZTA1OiAnI2Q4ZDhkOCcsXG4gIGJhc2UwNjogJyNlOGU4ZTgnLFxuICBiYXNlMDc6ICcjZjhmOGY4JyxcbiAgYmFzZTA4OiAnI2FiNDY0MicsXG4gIGJhc2UwOTogJyNkYzk2NTYnLFxuICBiYXNlMEE6ICcjZjdjYTg4JyxcbiAgYmFzZTBCOiAnI2ExYjU2YycsXG4gIGJhc2UwQzogJyM4NmMxYjknLFxuICBiYXNlMEQ6ICcjN2NhZmMyJyxcbiAgYmFzZTBFOiAnI2JhOGJhZicsXG4gIGJhc2UwRjogJyNhMTY5NDYnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdlaWdodGllcycsXG4gIGF1dGhvcjogJ2NocmlzIGtlbXBzb24gKGh0dHA6Ly9jaHJpc2tlbXBzb24uY29tKScsXG4gIGJhc2UwMDogJyMyZDJkMmQnLFxuICBiYXNlMDE6ICcjMzkzOTM5JyxcbiAgYmFzZTAyOiAnIzUxNTE1MScsXG4gIGJhc2UwMzogJyM3NDczNjknLFxuICBiYXNlMDQ6ICcjYTA5ZjkzJyxcbiAgYmFzZTA1OiAnI2QzZDBjOCcsXG4gIGJhc2UwNjogJyNlOGU2ZGYnLFxuICBiYXNlMDc6ICcjZjJmMGVjJyxcbiAgYmFzZTA4OiAnI2YyNzc3YScsXG4gIGJhc2UwOTogJyNmOTkxNTcnLFxuICBiYXNlMEE6ICcjZmZjYzY2JyxcbiAgYmFzZTBCOiAnIzk5Y2M5OScsXG4gIGJhc2UwQzogJyM2NmNjY2MnLFxuICBiYXNlMEQ6ICcjNjY5OWNjJyxcbiAgYmFzZTBFOiAnI2NjOTljYycsXG4gIGJhc2UwRjogJyNkMjdiNTMnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdlbWJlcnMnLFxuICBhdXRob3I6ICdqYW5uaWsgc2llYmVydCAoaHR0cHM6Ly9naXRodWIuY29tL2phbm5pa3MpJyxcbiAgYmFzZTAwOiAnIzE2MTMwRicsXG4gIGJhc2UwMTogJyMyQzI2MjAnLFxuICBiYXNlMDI6ICcjNDMzQjMyJyxcbiAgYmFzZTAzOiAnIzVBNTA0NycsXG4gIGJhc2UwNDogJyM4QTgwNzUnLFxuICBiYXNlMDU6ICcjQTM5QTkwJyxcbiAgYmFzZTA2OiAnI0JFQjZBRScsXG4gIGJhc2UwNzogJyNEQkQ2RDEnLFxuICBiYXNlMDg6ICcjODI2RDU3JyxcbiAgYmFzZTA5OiAnIzgyODI1NycsXG4gIGJhc2UwQTogJyM2RDgyNTcnLFxuICBiYXNlMEI6ICcjNTc4MjZEJyxcbiAgYmFzZTBDOiAnIzU3NkQ4MicsXG4gIGJhc2UwRDogJyM2RDU3ODInLFxuICBiYXNlMEU6ICcjODI1NzZEJyxcbiAgYmFzZTBGOiAnIzgyNTc1Nydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2ZsYXQnLFxuICBhdXRob3I6ICdjaHJpcyBrZW1wc29uIChodHRwOi8vY2hyaXNrZW1wc29uLmNvbSknLFxuICBiYXNlMDA6ICcjMkMzRTUwJyxcbiAgYmFzZTAxOiAnIzM0NDk1RScsXG4gIGJhc2UwMjogJyM3RjhDOEQnLFxuICBiYXNlMDM6ICcjOTVBNUE2JyxcbiAgYmFzZTA0OiAnI0JEQzNDNycsXG4gIGJhc2UwNTogJyNlMGUwZTAnLFxuICBiYXNlMDY6ICcjZjVmNWY1JyxcbiAgYmFzZTA3OiAnI0VDRjBGMScsXG4gIGJhc2UwODogJyNFNzRDM0MnLFxuICBiYXNlMDk6ICcjRTY3RTIyJyxcbiAgYmFzZTBBOiAnI0YxQzQwRicsXG4gIGJhc2UwQjogJyMyRUNDNzEnLFxuICBiYXNlMEM6ICcjMUFCQzlDJyxcbiAgYmFzZTBEOiAnIzM0OThEQicsXG4gIGJhc2UwRTogJyM5QjU5QjYnLFxuICBiYXNlMEY6ICcjYmU2NDNjJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnZ29vZ2xlJyxcbiAgYXV0aG9yOiAnc2V0aCB3cmlnaHQgKGh0dHA6Ly9zZXRoYXdyaWdodC5jb20pJyxcbiAgYmFzZTAwOiAnIzFkMWYyMScsXG4gIGJhc2UwMTogJyMyODJhMmUnLFxuICBiYXNlMDI6ICcjMzczYjQxJyxcbiAgYmFzZTAzOiAnIzk2OTg5NicsXG4gIGJhc2UwNDogJyNiNGI3YjQnLFxuICBiYXNlMDU6ICcjYzVjOGM2JyxcbiAgYmFzZTA2OiAnI2UwZTBlMCcsXG4gIGJhc2UwNzogJyNmZmZmZmYnLFxuICBiYXNlMDg6ICcjQ0MzNDJCJyxcbiAgYmFzZTA5OiAnI0Y5NkEzOCcsXG4gIGJhc2UwQTogJyNGQkE5MjInLFxuICBiYXNlMEI6ICcjMTk4ODQ0JyxcbiAgYmFzZTBDOiAnIzM5NzFFRCcsXG4gIGJhc2UwRDogJyMzOTcxRUQnLFxuICBiYXNlMEU6ICcjQTM2QUM3JyxcbiAgYmFzZTBGOiAnIzM5NzFFRCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2dyYXlzY2FsZScsXG4gIGF1dGhvcjogJ2FsZXhhbmRyZSBnYXZpb2xpIChodHRwczovL2dpdGh1Yi5jb20vYWxleHgyLyknLFxuICBiYXNlMDA6ICcjMTAxMDEwJyxcbiAgYmFzZTAxOiAnIzI1MjUyNScsXG4gIGJhc2UwMjogJyM0NjQ2NDYnLFxuICBiYXNlMDM6ICcjNTI1MjUyJyxcbiAgYmFzZTA0OiAnI2FiYWJhYicsXG4gIGJhc2UwNTogJyNiOWI5YjknLFxuICBiYXNlMDY6ICcjZTNlM2UzJyxcbiAgYmFzZTA3OiAnI2Y3ZjdmNycsXG4gIGJhc2UwODogJyM3YzdjN2MnLFxuICBiYXNlMDk6ICcjOTk5OTk5JyxcbiAgYmFzZTBBOiAnI2EwYTBhMCcsXG4gIGJhc2UwQjogJyM4ZThlOGUnLFxuICBiYXNlMEM6ICcjODY4Njg2JyxcbiAgYmFzZTBEOiAnIzY4Njg2OCcsXG4gIGJhc2UwRTogJyM3NDc0NzQnLFxuICBiYXNlMEY6ICcjNWU1ZTVlJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnZ3JlZW4gc2NyZWVuJyxcbiAgYXV0aG9yOiAnY2hyaXMga2VtcHNvbiAoaHR0cDovL2Nocmlza2VtcHNvbi5jb20pJyxcbiAgYmFzZTAwOiAnIzAwMTEwMCcsXG4gIGJhc2UwMTogJyMwMDMzMDAnLFxuICBiYXNlMDI6ICcjMDA1NTAwJyxcbiAgYmFzZTAzOiAnIzAwNzcwMCcsXG4gIGJhc2UwNDogJyMwMDk5MDAnLFxuICBiYXNlMDU6ICcjMDBiYjAwJyxcbiAgYmFzZTA2OiAnIzAwZGQwMCcsXG4gIGJhc2UwNzogJyMwMGZmMDAnLFxuICBiYXNlMDg6ICcjMDA3NzAwJyxcbiAgYmFzZTA5OiAnIzAwOTkwMCcsXG4gIGJhc2UwQTogJyMwMDc3MDAnLFxuICBiYXNlMEI6ICcjMDBiYjAwJyxcbiAgYmFzZTBDOiAnIzAwNTUwMCcsXG4gIGJhc2UwRDogJyMwMDk5MDAnLFxuICBiYXNlMEU6ICcjMDBiYjAwJyxcbiAgYmFzZTBGOiAnIzAwNTUwMCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2hhcm1vbmljMTYnLFxuICBhdXRob3I6ICdqYW5uaWsgc2llYmVydCAoaHR0cHM6Ly9naXRodWIuY29tL2phbm5pa3MpJyxcbiAgYmFzZTAwOiAnIzBiMWMyYycsXG4gIGJhc2UwMTogJyMyMjNiNTQnLFxuICBiYXNlMDI6ICcjNDA1Yzc5JyxcbiAgYmFzZTAzOiAnIzYyN2U5OScsXG4gIGJhc2UwNDogJyNhYWJjY2UnLFxuICBiYXNlMDU6ICcjY2JkNmUyJyxcbiAgYmFzZTA2OiAnI2U1ZWJmMScsXG4gIGJhc2UwNzogJyNmN2Y5ZmInLFxuICBiYXNlMDg6ICcjYmY4YjU2JyxcbiAgYmFzZTA5OiAnI2JmYmY1NicsXG4gIGJhc2UwQTogJyM4YmJmNTYnLFxuICBiYXNlMEI6ICcjNTZiZjhiJyxcbiAgYmFzZTBDOiAnIzU2OGJiZicsXG4gIGJhc2UwRDogJyM4YjU2YmYnLFxuICBiYXNlMEU6ICcjYmY1NjhiJyxcbiAgYmFzZTBGOiAnI2JmNTY1Nidcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2hvcHNjb3RjaCcsXG4gIGF1dGhvcjogJ2phbiB0LiBzb3R0JyxcbiAgYmFzZTAwOiAnIzMyMjkzMScsXG4gIGJhc2UwMTogJyM0MzNiNDInLFxuICBiYXNlMDI6ICcjNWM1NDViJyxcbiAgYmFzZTAzOiAnIzc5NzM3OScsXG4gIGJhc2UwNDogJyM5ODk0OTgnLFxuICBiYXNlMDU6ICcjYjliNWI4JyxcbiAgYmFzZTA2OiAnI2Q1ZDNkNScsXG4gIGJhc2UwNzogJyNmZmZmZmYnLFxuICBiYXNlMDg6ICcjZGQ0NjRjJyxcbiAgYmFzZTA5OiAnI2ZkOGIxOScsXG4gIGJhc2UwQTogJyNmZGNjNTknLFxuICBiYXNlMEI6ICcjOGZjMTNlJyxcbiAgYmFzZTBDOiAnIzE0OWI5MycsXG4gIGJhc2UwRDogJyMxMjkwYmYnLFxuICBiYXNlMEU6ICcjYzg1ZTdjJyxcbiAgYmFzZTBGOiAnI2IzMzUwOCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZShvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9ialsnZGVmYXVsdCddIDogb2JqOyB9XG5cbnZhciBfdGhyZWV6ZXJvdHdvZm91ciA9IHJlcXVpcmUoJy4vdGhyZWV6ZXJvdHdvZm91cicpO1xuXG5leHBvcnRzLnRocmVlemVyb3R3b2ZvdXIgPSBfaW50ZXJvcFJlcXVpcmUoX3RocmVlemVyb3R3b2ZvdXIpO1xuXG52YXIgX2FwYXRoeSA9IHJlcXVpcmUoJy4vYXBhdGh5Jyk7XG5cbmV4cG9ydHMuYXBhdGh5ID0gX2ludGVyb3BSZXF1aXJlKF9hcGF0aHkpO1xuXG52YXIgX2FzaGVzID0gcmVxdWlyZSgnLi9hc2hlcycpO1xuXG5leHBvcnRzLmFzaGVzID0gX2ludGVyb3BSZXF1aXJlKF9hc2hlcyk7XG5cbnZhciBfYXRlbGllckR1bmUgPSByZXF1aXJlKCcuL2F0ZWxpZXItZHVuZScpO1xuXG5leHBvcnRzLmF0ZWxpZXJEdW5lID0gX2ludGVyb3BSZXF1aXJlKF9hdGVsaWVyRHVuZSk7XG5cbnZhciBfYXRlbGllckZvcmVzdCA9IHJlcXVpcmUoJy4vYXRlbGllci1mb3Jlc3QnKTtcblxuZXhwb3J0cy5hdGVsaWVyRm9yZXN0ID0gX2ludGVyb3BSZXF1aXJlKF9hdGVsaWVyRm9yZXN0KTtcblxudmFyIF9hdGVsaWVySGVhdGggPSByZXF1aXJlKCcuL2F0ZWxpZXItaGVhdGgnKTtcblxuZXhwb3J0cy5hdGVsaWVySGVhdGggPSBfaW50ZXJvcFJlcXVpcmUoX2F0ZWxpZXJIZWF0aCk7XG5cbnZhciBfYXRlbGllckxha2VzaWRlID0gcmVxdWlyZSgnLi9hdGVsaWVyLWxha2VzaWRlJyk7XG5cbmV4cG9ydHMuYXRlbGllckxha2VzaWRlID0gX2ludGVyb3BSZXF1aXJlKF9hdGVsaWVyTGFrZXNpZGUpO1xuXG52YXIgX2F0ZWxpZXJTZWFzaWRlID0gcmVxdWlyZSgnLi9hdGVsaWVyLXNlYXNpZGUnKTtcblxuZXhwb3J0cy5hdGVsaWVyU2Vhc2lkZSA9IF9pbnRlcm9wUmVxdWlyZShfYXRlbGllclNlYXNpZGUpO1xuXG52YXIgX2Jlc3BpbiA9IHJlcXVpcmUoJy4vYmVzcGluJyk7XG5cbmV4cG9ydHMuYmVzcGluID0gX2ludGVyb3BSZXF1aXJlKF9iZXNwaW4pO1xuXG52YXIgX2JyZXdlciA9IHJlcXVpcmUoJy4vYnJld2VyJyk7XG5cbmV4cG9ydHMuYnJld2VyID0gX2ludGVyb3BSZXF1aXJlKF9icmV3ZXIpO1xuXG52YXIgX2JyaWdodCA9IHJlcXVpcmUoJy4vYnJpZ2h0Jyk7XG5cbmV4cG9ydHMuYnJpZ2h0ID0gX2ludGVyb3BSZXF1aXJlKF9icmlnaHQpO1xuXG52YXIgX2NoYWxrID0gcmVxdWlyZSgnLi9jaGFsaycpO1xuXG5leHBvcnRzLmNoYWxrID0gX2ludGVyb3BSZXF1aXJlKF9jaGFsayk7XG5cbnZhciBfY29kZXNjaG9vbCA9IHJlcXVpcmUoJy4vY29kZXNjaG9vbCcpO1xuXG5leHBvcnRzLmNvZGVzY2hvb2wgPSBfaW50ZXJvcFJlcXVpcmUoX2NvZGVzY2hvb2wpO1xuXG52YXIgX2NvbG9ycyA9IHJlcXVpcmUoJy4vY29sb3JzJyk7XG5cbmV4cG9ydHMuY29sb3JzID0gX2ludGVyb3BSZXF1aXJlKF9jb2xvcnMpO1xuXG52YXIgX2RlZmF1bHQgPSByZXF1aXJlKCcuL2RlZmF1bHQnKTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gX2ludGVyb3BSZXF1aXJlKF9kZWZhdWx0KTtcblxudmFyIF9laWdodGllcyA9IHJlcXVpcmUoJy4vZWlnaHRpZXMnKTtcblxuZXhwb3J0cy5laWdodGllcyA9IF9pbnRlcm9wUmVxdWlyZShfZWlnaHRpZXMpO1xuXG52YXIgX2VtYmVycyA9IHJlcXVpcmUoJy4vZW1iZXJzJyk7XG5cbmV4cG9ydHMuZW1iZXJzID0gX2ludGVyb3BSZXF1aXJlKF9lbWJlcnMpO1xuXG52YXIgX2ZsYXQgPSByZXF1aXJlKCcuL2ZsYXQnKTtcblxuZXhwb3J0cy5mbGF0ID0gX2ludGVyb3BSZXF1aXJlKF9mbGF0KTtcblxudmFyIF9nb29nbGUgPSByZXF1aXJlKCcuL2dvb2dsZScpO1xuXG5leHBvcnRzLmdvb2dsZSA9IF9pbnRlcm9wUmVxdWlyZShfZ29vZ2xlKTtcblxudmFyIF9ncmF5c2NhbGUgPSByZXF1aXJlKCcuL2dyYXlzY2FsZScpO1xuXG5leHBvcnRzLmdyYXlzY2FsZSA9IF9pbnRlcm9wUmVxdWlyZShfZ3JheXNjYWxlKTtcblxudmFyIF9ncmVlbnNjcmVlbiA9IHJlcXVpcmUoJy4vZ3JlZW5zY3JlZW4nKTtcblxuZXhwb3J0cy5ncmVlbnNjcmVlbiA9IF9pbnRlcm9wUmVxdWlyZShfZ3JlZW5zY3JlZW4pO1xuXG52YXIgX2hhcm1vbmljID0gcmVxdWlyZSgnLi9oYXJtb25pYycpO1xuXG5leHBvcnRzLmhhcm1vbmljID0gX2ludGVyb3BSZXF1aXJlKF9oYXJtb25pYyk7XG5cbnZhciBfaG9wc2NvdGNoID0gcmVxdWlyZSgnLi9ob3BzY290Y2gnKTtcblxuZXhwb3J0cy5ob3BzY290Y2ggPSBfaW50ZXJvcFJlcXVpcmUoX2hvcHNjb3RjaCk7XG5cbnZhciBfaXNvdG9wZSA9IHJlcXVpcmUoJy4vaXNvdG9wZScpO1xuXG5leHBvcnRzLmlzb3RvcGUgPSBfaW50ZXJvcFJlcXVpcmUoX2lzb3RvcGUpO1xuXG52YXIgX21hcnJha2VzaCA9IHJlcXVpcmUoJy4vbWFycmFrZXNoJyk7XG5cbmV4cG9ydHMubWFycmFrZXNoID0gX2ludGVyb3BSZXF1aXJlKF9tYXJyYWtlc2gpO1xuXG52YXIgX21vY2hhID0gcmVxdWlyZSgnLi9tb2NoYScpO1xuXG5leHBvcnRzLm1vY2hhID0gX2ludGVyb3BSZXF1aXJlKF9tb2NoYSk7XG5cbnZhciBfbW9ub2thaSA9IHJlcXVpcmUoJy4vbW9ub2thaScpO1xuXG5leHBvcnRzLm1vbm9rYWkgPSBfaW50ZXJvcFJlcXVpcmUoX21vbm9rYWkpO1xuXG52YXIgX29jZWFuID0gcmVxdWlyZSgnLi9vY2VhbicpO1xuXG5leHBvcnRzLm9jZWFuID0gX2ludGVyb3BSZXF1aXJlKF9vY2Vhbik7XG5cbnZhciBfcGFyYWlzbyA9IHJlcXVpcmUoJy4vcGFyYWlzbycpO1xuXG5leHBvcnRzLnBhcmFpc28gPSBfaW50ZXJvcFJlcXVpcmUoX3BhcmFpc28pO1xuXG52YXIgX3BvcCA9IHJlcXVpcmUoJy4vcG9wJyk7XG5cbmV4cG9ydHMucG9wID0gX2ludGVyb3BSZXF1aXJlKF9wb3ApO1xuXG52YXIgX3JhaWxzY2FzdHMgPSByZXF1aXJlKCcuL3JhaWxzY2FzdHMnKTtcblxuZXhwb3J0cy5yYWlsc2Nhc3RzID0gX2ludGVyb3BSZXF1aXJlKF9yYWlsc2Nhc3RzKTtcblxudmFyIF9zaGFwZXNoaWZ0ZXIgPSByZXF1aXJlKCcuL3NoYXBlc2hpZnRlcicpO1xuXG5leHBvcnRzLnNoYXBlc2hpZnRlciA9IF9pbnRlcm9wUmVxdWlyZShfc2hhcGVzaGlmdGVyKTtcblxudmFyIF9zb2xhcml6ZWQgPSByZXF1aXJlKCcuL3NvbGFyaXplZCcpO1xuXG5leHBvcnRzLnNvbGFyaXplZCA9IF9pbnRlcm9wUmVxdWlyZShfc29sYXJpemVkKTtcblxudmFyIF9zdW1tZXJmcnVpdCA9IHJlcXVpcmUoJy4vc3VtbWVyZnJ1aXQnKTtcblxuZXhwb3J0cy5zdW1tZXJmcnVpdCA9IF9pbnRlcm9wUmVxdWlyZShfc3VtbWVyZnJ1aXQpO1xuXG52YXIgX3RvbW9ycm93ID0gcmVxdWlyZSgnLi90b21vcnJvdycpO1xuXG5leHBvcnRzLnRvbW9ycm93ID0gX2ludGVyb3BSZXF1aXJlKF90b21vcnJvdyk7XG5cbnZhciBfdHViZSA9IHJlcXVpcmUoJy4vdHViZScpO1xuXG5leHBvcnRzLnR1YmUgPSBfaW50ZXJvcFJlcXVpcmUoX3R1YmUpO1xuXG52YXIgX3R3aWxpZ2h0ID0gcmVxdWlyZSgnLi90d2lsaWdodCcpO1xuXG5leHBvcnRzLnR3aWxpZ2h0ID0gX2ludGVyb3BSZXF1aXJlKF90d2lsaWdodCk7XG5cbnZhciBfbmljaW5hYm94ID0gcmVxdWlyZSgnLi9uaWNpbmFib3gnKTtcblxuZXhwb3J0cy5uaWNpbmFib3ggPSBfaW50ZXJvcFJlcXVpcmUoX25pY2luYWJveCk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdpc290b3BlJyxcbiAgYXV0aG9yOiAnamFuIHQuIHNvdHQnLFxuICBiYXNlMDA6ICcjMDAwMDAwJyxcbiAgYmFzZTAxOiAnIzQwNDA0MCcsXG4gIGJhc2UwMjogJyM2MDYwNjAnLFxuICBiYXNlMDM6ICcjODA4MDgwJyxcbiAgYmFzZTA0OiAnI2MwYzBjMCcsXG4gIGJhc2UwNTogJyNkMGQwZDAnLFxuICBiYXNlMDY6ICcjZTBlMGUwJyxcbiAgYmFzZTA3OiAnI2ZmZmZmZicsXG4gIGJhc2UwODogJyNmZjAwMDAnLFxuICBiYXNlMDk6ICcjZmY5OTAwJyxcbiAgYmFzZTBBOiAnI2ZmMDA5OScsXG4gIGJhc2UwQjogJyMzM2ZmMDAnLFxuICBiYXNlMEM6ICcjMDBmZmZmJyxcbiAgYmFzZTBEOiAnIzAwNjZmZicsXG4gIGJhc2UwRTogJyNjYzAwZmYnLFxuICBiYXNlMEY6ICcjMzMwMGZmJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnbWFycmFrZXNoJyxcbiAgYXV0aG9yOiAnYWxleGFuZHJlIGdhdmlvbGkgKGh0dHA6Ly9naXRodWIuY29tL2FsZXh4Mi8pJyxcbiAgYmFzZTAwOiAnIzIwMTYwMicsXG4gIGJhc2UwMTogJyMzMDJlMDAnLFxuICBiYXNlMDI6ICcjNWY1YjE3JyxcbiAgYmFzZTAzOiAnIzZjNjgyMycsXG4gIGJhc2UwNDogJyM4NjgxM2InLFxuICBiYXNlMDU6ICcjOTQ4ZTQ4JyxcbiAgYmFzZTA2OiAnI2NjYzM3YScsXG4gIGJhc2UwNzogJyNmYWYwYTUnLFxuICBiYXNlMDg6ICcjYzM1MzU5JyxcbiAgYmFzZTA5OiAnI2IzNjE0NCcsXG4gIGJhc2UwQTogJyNhODgzMzknLFxuICBiYXNlMEI6ICcjMTg5NzRlJyxcbiAgYmFzZTBDOiAnIzc1YTczOCcsXG4gIGJhc2UwRDogJyM0NzdjYTEnLFxuICBiYXNlMEU6ICcjODg2OGIzJyxcbiAgYmFzZTBGOiAnI2IzNTg4ZSdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ21vY2hhJyxcbiAgYXV0aG9yOiAnY2hyaXMga2VtcHNvbiAoaHR0cDovL2Nocmlza2VtcHNvbi5jb20pJyxcbiAgYmFzZTAwOiAnIzNCMzIyOCcsXG4gIGJhc2UwMTogJyM1MzQ2MzYnLFxuICBiYXNlMDI6ICcjNjQ1MjQwJyxcbiAgYmFzZTAzOiAnIzdlNzA1YScsXG4gIGJhc2UwNDogJyNiOGFmYWQnLFxuICBiYXNlMDU6ICcjZDBjOGM2JyxcbiAgYmFzZTA2OiAnI2U5ZTFkZCcsXG4gIGJhc2UwNzogJyNmNWVlZWInLFxuICBiYXNlMDg6ICcjY2I2MDc3JyxcbiAgYmFzZTA5OiAnI2QyOGI3MScsXG4gIGJhc2UwQTogJyNmNGJjODcnLFxuICBiYXNlMEI6ICcjYmViNTViJyxcbiAgYmFzZTBDOiAnIzdiYmRhNCcsXG4gIGJhc2UwRDogJyM4YWIzYjUnLFxuICBiYXNlMEU6ICcjYTg5YmI5JyxcbiAgYmFzZTBGOiAnI2JiOTU4NCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ21vbm9rYWknLFxuICBhdXRob3I6ICd3aW1lciBoYXplbmJlcmcgKGh0dHA6Ly93d3cubW9ub2thaS5ubCknLFxuICBiYXNlMDA6ICcjMjcyODIyJyxcbiAgYmFzZTAxOiAnIzM4MzgzMCcsXG4gIGJhc2UwMjogJyM0OTQ4M2UnLFxuICBiYXNlMDM6ICcjNzU3MTVlJyxcbiAgYmFzZTA0OiAnI2E1OWY4NScsXG4gIGJhc2UwNTogJyNmOGY4ZjInLFxuICBiYXNlMDY6ICcjZjVmNGYxJyxcbiAgYmFzZTA3OiAnI2Y5ZjhmNScsXG4gIGJhc2UwODogJyNmOTI2NzInLFxuICBiYXNlMDk6ICcjZmQ5NzFmJyxcbiAgYmFzZTBBOiAnI2Y0YmY3NScsXG4gIGJhc2UwQjogJyNhNmUyMmUnLFxuICBiYXNlMEM6ICcjYTFlZmU0JyxcbiAgYmFzZTBEOiAnIzY2ZDllZicsXG4gIGJhc2UwRTogJyNhZTgxZmYnLFxuICBiYXNlMEY6ICcjY2M2NjMzJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnbmljaW5hYm94JyxcbiAgYXV0aG9yOiAnbmljaW5hYm94IChodHRwOi8vZ2l0aHViLmNvbS9uaWNpbmFib3gpJyxcbiAgYmFzZTAwOiAnIzJBMkYzQScsXG4gIGJhc2UwMTogJyMzQzQ0NEYnLFxuICBiYXNlMDI6ICcjNEY1QTY1JyxcbiAgYmFzZTAzOiAnI0JFQkVCRScsXG4gIGJhc2UwNDogJyNiMGIwYjAnLCAvLyB1bm1vZGlmaWVkXG4gIGJhc2UwNTogJyNkMGQwZDAnLCAvLyB1bm1vZGlmaWVkXG4gIGJhc2UwNjogJyNGRkZGRkYnLFxuICBiYXNlMDc6ICcjZjVmNWY1JywgLy8gdW5tb2RpZmllZFxuICBiYXNlMDg6ICcjZmI5ZmIxJywgLy8gdW5tb2RpZmllZFxuICBiYXNlMDk6ICcjRkM2RDI0JyxcbiAgYmFzZTBBOiAnI2RkYjI2ZicsIC8vIHVubW9kaWZpZWRcbiAgYmFzZTBCOiAnI0ExQzY1OScsXG4gIGJhc2UwQzogJyMxMmNmYzAnLCAvLyB1bm1vZGlmaWVkXG4gIGJhc2UwRDogJyM2RkIzRDInLFxuICBiYXNlMEU6ICcjRDM4MUMzJyxcbiAgYmFzZTBGOiAnI2RlYWY4ZicgLy8gdW5tb2RpZmllZFxufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnb2NlYW4nLFxuICBhdXRob3I6ICdjaHJpcyBrZW1wc29uIChodHRwOi8vY2hyaXNrZW1wc29uLmNvbSknLFxuICBiYXNlMDA6ICcjMmIzMDNiJyxcbiAgYmFzZTAxOiAnIzM0M2Q0NicsXG4gIGJhc2UwMjogJyM0ZjViNjYnLFxuICBiYXNlMDM6ICcjNjU3MzdlJyxcbiAgYmFzZTA0OiAnI2E3YWRiYScsXG4gIGJhc2UwNTogJyNjMGM1Y2UnLFxuICBiYXNlMDY6ICcjZGZlMWU4JyxcbiAgYmFzZTA3OiAnI2VmZjFmNScsXG4gIGJhc2UwODogJyNiZjYxNmEnLFxuICBiYXNlMDk6ICcjZDA4NzcwJyxcbiAgYmFzZTBBOiAnI2ViY2I4YicsXG4gIGJhc2UwQjogJyNhM2JlOGMnLFxuICBiYXNlMEM6ICcjOTZiNWI0JyxcbiAgYmFzZTBEOiAnIzhmYTFiMycsXG4gIGJhc2UwRTogJyNiNDhlYWQnLFxuICBiYXNlMEY6ICcjYWI3OTY3J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAncGFyYWlzbycsXG4gIGF1dGhvcjogJ2phbiB0LiBzb3R0JyxcbiAgYmFzZTAwOiAnIzJmMWUyZScsXG4gIGJhc2UwMTogJyM0MTMyM2YnLFxuICBiYXNlMDI6ICcjNGY0MjRjJyxcbiAgYmFzZTAzOiAnIzc3NmU3MScsXG4gIGJhc2UwNDogJyM4ZDg2ODcnLFxuICBiYXNlMDU6ICcjYTM5ZTliJyxcbiAgYmFzZTA2OiAnI2I5YjZiMCcsXG4gIGJhc2UwNzogJyNlN2U5ZGInLFxuICBiYXNlMDg6ICcjZWY2MTU1JyxcbiAgYmFzZTA5OiAnI2Y5OWIxNScsXG4gIGJhc2UwQTogJyNmZWM0MTgnLFxuICBiYXNlMEI6ICcjNDhiNjg1JyxcbiAgYmFzZTBDOiAnIzViYzRiZicsXG4gIGJhc2UwRDogJyMwNmI2ZWYnLFxuICBiYXNlMEU6ICcjODE1YmE0JyxcbiAgYmFzZTBGOiAnI2U5NmJhOCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ3BvcCcsXG4gIGF1dGhvcjogJ2NocmlzIGtlbXBzb24gKGh0dHA6Ly9jaHJpc2tlbXBzb24uY29tKScsXG4gIGJhc2UwMDogJyMwMDAwMDAnLFxuICBiYXNlMDE6ICcjMjAyMDIwJyxcbiAgYmFzZTAyOiAnIzMwMzAzMCcsXG4gIGJhc2UwMzogJyM1MDUwNTAnLFxuICBiYXNlMDQ6ICcjYjBiMGIwJyxcbiAgYmFzZTA1OiAnI2QwZDBkMCcsXG4gIGJhc2UwNjogJyNlMGUwZTAnLFxuICBiYXNlMDc6ICcjZmZmZmZmJyxcbiAgYmFzZTA4OiAnI2ViMDA4YScsXG4gIGJhc2UwOTogJyNmMjkzMzMnLFxuICBiYXNlMEE6ICcjZjhjYTEyJyxcbiAgYmFzZTBCOiAnIzM3YjM0OScsXG4gIGJhc2UwQzogJyMwMGFhYmInLFxuICBiYXNlMEQ6ICcjMGU1YTk0JyxcbiAgYmFzZTBFOiAnI2IzMWU4ZCcsXG4gIGJhc2UwRjogJyM3YTJkMDAnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdyYWlsc2Nhc3RzJyxcbiAgYXV0aG9yOiAncnlhbiBiYXRlcyAoaHR0cDovL3JhaWxzY2FzdHMuY29tKScsXG4gIGJhc2UwMDogJyMyYjJiMmInLFxuICBiYXNlMDE6ICcjMjcyOTM1JyxcbiAgYmFzZTAyOiAnIzNhNDA1NScsXG4gIGJhc2UwMzogJyM1YTY0N2UnLFxuICBiYXNlMDQ6ICcjZDRjZmM5JyxcbiAgYmFzZTA1OiAnI2U2ZTFkYycsXG4gIGJhc2UwNjogJyNmNGYxZWQnLFxuICBiYXNlMDc6ICcjZjlmN2YzJyxcbiAgYmFzZTA4OiAnI2RhNDkzOScsXG4gIGJhc2UwOTogJyNjYzc4MzMnLFxuICBiYXNlMEE6ICcjZmZjNjZkJyxcbiAgYmFzZTBCOiAnI2E1YzI2MScsXG4gIGJhc2UwQzogJyM1MTlmNTAnLFxuICBiYXNlMEQ6ICcjNmQ5Y2JlJyxcbiAgYmFzZTBFOiAnI2I2YjNlYicsXG4gIGJhc2UwRjogJyNiYzk0NTgnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdzaGFwZXNoaWZ0ZXInLFxuICBhdXRob3I6ICd0eWxlciBiZW56aWdlciAoaHR0cDovL3R5YmVuei5jb20pJyxcbiAgYmFzZTAwOiAnIzAwMDAwMCcsXG4gIGJhc2UwMTogJyMwNDA0MDQnLFxuICBiYXNlMDI6ICcjMTAyMDE1JyxcbiAgYmFzZTAzOiAnIzM0MzQzNCcsXG4gIGJhc2UwNDogJyM1NTU1NTUnLFxuICBiYXNlMDU6ICcjYWJhYmFiJyxcbiAgYmFzZTA2OiAnI2UwZTBlMCcsXG4gIGJhc2UwNzogJyNmOWY5ZjknLFxuICBiYXNlMDg6ICcjZTkyZjJmJyxcbiAgYmFzZTA5OiAnI2UwOTQ0OCcsXG4gIGJhc2UwQTogJyNkZGRkMTMnLFxuICBiYXNlMEI6ICcjMGVkODM5JyxcbiAgYmFzZTBDOiAnIzIzZWRkYScsXG4gIGJhc2UwRDogJyMzYjQ4ZTMnLFxuICBiYXNlMEU6ICcjZjk5NmUyJyxcbiAgYmFzZTBGOiAnIzY5NTQyZCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ3NvbGFyaXplZCcsXG4gIGF1dGhvcjogJ2V0aGFuIHNjaG9vbm92ZXIgKGh0dHA6Ly9ldGhhbnNjaG9vbm92ZXIuY29tL3NvbGFyaXplZCknLFxuICBiYXNlMDA6ICcjMDAyYjM2JyxcbiAgYmFzZTAxOiAnIzA3MzY0MicsXG4gIGJhc2UwMjogJyM1ODZlNzUnLFxuICBiYXNlMDM6ICcjNjU3YjgzJyxcbiAgYmFzZTA0OiAnIzgzOTQ5NicsXG4gIGJhc2UwNTogJyM5M2ExYTEnLFxuICBiYXNlMDY6ICcjZWVlOGQ1JyxcbiAgYmFzZTA3OiAnI2ZkZjZlMycsXG4gIGJhc2UwODogJyNkYzMyMmYnLFxuICBiYXNlMDk6ICcjY2I0YjE2JyxcbiAgYmFzZTBBOiAnI2I1ODkwMCcsXG4gIGJhc2UwQjogJyM4NTk5MDAnLFxuICBiYXNlMEM6ICcjMmFhMTk4JyxcbiAgYmFzZTBEOiAnIzI2OGJkMicsXG4gIGJhc2UwRTogJyM2YzcxYzQnLFxuICBiYXNlMEY6ICcjZDMzNjgyJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnc3VtbWVyZnJ1aXQnLFxuICBhdXRob3I6ICdjaHJpc3RvcGhlciBjb3JsZXkgKGh0dHA6Ly9jc2NvcmxleS5naXRodWIuaW8vKScsXG4gIGJhc2UwMDogJyMxNTE1MTUnLFxuICBiYXNlMDE6ICcjMjAyMDIwJyxcbiAgYmFzZTAyOiAnIzMwMzAzMCcsXG4gIGJhc2UwMzogJyM1MDUwNTAnLFxuICBiYXNlMDQ6ICcjQjBCMEIwJyxcbiAgYmFzZTA1OiAnI0QwRDBEMCcsXG4gIGJhc2UwNjogJyNFMEUwRTAnLFxuICBiYXNlMDc6ICcjRkZGRkZGJyxcbiAgYmFzZTA4OiAnI0ZGMDA4NicsXG4gIGJhc2UwOTogJyNGRDg5MDAnLFxuICBiYXNlMEE6ICcjQUJBODAwJyxcbiAgYmFzZTBCOiAnIzAwQzkxOCcsXG4gIGJhc2UwQzogJyMxZmFhYWEnLFxuICBiYXNlMEQ6ICcjMzc3N0U2JyxcbiAgYmFzZTBFOiAnI0FEMDBBMScsXG4gIGJhc2UwRjogJyNjYzY2MzMnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICd0aHJlZXplcm90d29mb3VyJyxcbiAgYXV0aG9yOiAnamFuIHQuIHNvdHQgKGh0dHA6Ly9naXRodWIuY29tL2lkbGViZXJnKScsXG4gIGJhc2UwMDogJyMwOTAzMDAnLFxuICBiYXNlMDE6ICcjM2EzNDMyJyxcbiAgYmFzZTAyOiAnIzRhNDU0MycsXG4gIGJhc2UwMzogJyM1YzU4NTUnLFxuICBiYXNlMDQ6ICcjODA3ZDdjJyxcbiAgYmFzZTA1OiAnI2E1YTJhMicsXG4gIGJhc2UwNjogJyNkNmQ1ZDQnLFxuICBiYXNlMDc6ICcjZjdmN2Y3JyxcbiAgYmFzZTA4OiAnI2RiMmQyMCcsXG4gIGJhc2UwOTogJyNlOGJiZDAnLFxuICBiYXNlMEE6ICcjZmRlZDAyJyxcbiAgYmFzZTBCOiAnIzAxYTI1MicsXG4gIGJhc2UwQzogJyNiNWU0ZjQnLFxuICBiYXNlMEQ6ICcjMDFhMGU0JyxcbiAgYmFzZTBFOiAnI2ExNmE5NCcsXG4gIGJhc2UwRjogJyNjZGFiNTMnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICd0b21vcnJvdycsXG4gIGF1dGhvcjogJ2NocmlzIGtlbXBzb24gKGh0dHA6Ly9jaHJpc2tlbXBzb24uY29tKScsXG4gIGJhc2UwMDogJyMxZDFmMjEnLFxuICBiYXNlMDE6ICcjMjgyYTJlJyxcbiAgYmFzZTAyOiAnIzM3M2I0MScsXG4gIGJhc2UwMzogJyM5Njk4OTYnLFxuICBiYXNlMDQ6ICcjYjRiN2I0JyxcbiAgYmFzZTA1OiAnI2M1YzhjNicsXG4gIGJhc2UwNjogJyNlMGUwZTAnLFxuICBiYXNlMDc6ICcjZmZmZmZmJyxcbiAgYmFzZTA4OiAnI2NjNjY2NicsXG4gIGJhc2UwOTogJyNkZTkzNWYnLFxuICBiYXNlMEE6ICcjZjBjNjc0JyxcbiAgYmFzZTBCOiAnI2I1YmQ2OCcsXG4gIGJhc2UwQzogJyM4YWJlYjcnLFxuICBiYXNlMEQ6ICcjODFhMmJlJyxcbiAgYmFzZTBFOiAnI2IyOTRiYicsXG4gIGJhc2UwRjogJyNhMzY4NWEnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdsb25kb24gdHViZScsXG4gIGF1dGhvcjogJ2phbiB0LiBzb3R0JyxcbiAgYmFzZTAwOiAnIzIzMWYyMCcsXG4gIGJhc2UwMTogJyMxYzNmOTUnLFxuICBiYXNlMDI6ICcjNWE1NzU4JyxcbiAgYmFzZTAzOiAnIzczNzE3MScsXG4gIGJhc2UwNDogJyM5NTljYTEnLFxuICBiYXNlMDU6ICcjZDlkOGQ4JyxcbiAgYmFzZTA2OiAnI2U3ZTdlOCcsXG4gIGJhc2UwNzogJyNmZmZmZmYnLFxuICBiYXNlMDg6ICcjZWUyZTI0JyxcbiAgYmFzZTA5OiAnI2YzODZhMScsXG4gIGJhc2UwQTogJyNmZmQyMDQnLFxuICBiYXNlMEI6ICcjMDA4NTNlJyxcbiAgYmFzZTBDOiAnIzg1Y2ViYycsXG4gIGJhc2UwRDogJyMwMDlkZGMnLFxuICBiYXNlMEU6ICcjOTgwMDVkJyxcbiAgYmFzZTBGOiAnI2IwNjExMCdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ3R3aWxpZ2h0JyxcbiAgYXV0aG9yOiAnZGF2aWQgaGFydCAoaHR0cDovL2hhcnQtZGV2LmNvbSknLFxuICBiYXNlMDA6ICcjMWUxZTFlJyxcbiAgYmFzZTAxOiAnIzMyMzUzNycsXG4gIGJhc2UwMjogJyM0NjRiNTAnLFxuICBiYXNlMDM6ICcjNWY1YTYwJyxcbiAgYmFzZTA0OiAnIzgzODE4NCcsXG4gIGJhc2UwNTogJyNhN2E3YTcnLFxuICBiYXNlMDY6ICcjYzNjM2MzJyxcbiAgYmFzZTA3OiAnI2ZmZmZmZicsXG4gIGJhc2UwODogJyNjZjZhNGMnLFxuICBiYXNlMDk6ICcjY2RhODY5JyxcbiAgYmFzZTBBOiAnI2Y5ZWU5OCcsXG4gIGJhc2UwQjogJyM4ZjlkNmEnLFxuICBiYXNlMEM6ICcjYWZjNGRiJyxcbiAgYmFzZTBEOiAnIzc1ODdhNicsXG4gIGJhc2UwRTogJyM5Yjg1OWQnLFxuICBiYXNlMEY6ICcjOWI3MDNmJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gZnVuY3Rpb24gKGhleENvbG9yLCBsaWdodG5lc3MpIHtcbiAgdmFyIGhleCA9IFN0cmluZyhoZXhDb2xvcikucmVwbGFjZSgvW14wLTlhLWZdL2dpLCAnJyk7XG4gIGlmIChoZXgubGVuZ3RoIDwgNikge1xuICAgIGhleCA9IGhleC5yZXBsYWNlKC8oLikvZywgJyQxJDEnKTtcbiAgfVxuICB2YXIgbHVtID0gbGlnaHRuZXNzIHx8IDA7XG5cbiAgdmFyIHJnYiA9ICcjJztcbiAgdmFyIGMgPSB1bmRlZmluZWQ7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgKytpKSB7XG4gICAgYyA9IHBhcnNlSW50KGhleC5zdWJzdHIoaSAqIDIsIDIpLCAxNik7XG4gICAgYyA9IE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCwgYyArIGMgKiBsdW0pLCAyNTUpKS50b1N0cmluZygxNik7XG4gICAgcmdiICs9ICgnMDAnICsgYykuc3Vic3RyKGMubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gcmdiO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2luaGVyaXRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrJylbJ2RlZmF1bHQnXTtcblxudmFyIF9leHRlbmRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdE1peGluID0gcmVxdWlyZSgncmVhY3QtbWl4aW4nKTtcblxudmFyIF9yZWFjdE1peGluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0TWl4aW4pO1xuXG52YXIgX21peGlucyA9IHJlcXVpcmUoJy4vbWl4aW5zJyk7XG5cbnZhciBfSlNPTkFycm93ID0gcmVxdWlyZSgnLi9KU09OQXJyb3cnKTtcblxudmFyIF9KU09OQXJyb3cyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTkFycm93KTtcblxudmFyIF9ncmFiTm9kZSA9IHJlcXVpcmUoJy4vZ3JhYi1ub2RlJyk7XG5cbnZhciBfZ3JhYk5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ3JhYk5vZGUpO1xuXG52YXIgc3R5bGVzID0ge1xuICBiYXNlOiB7XG4gICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgcGFkZGluZ1RvcDogMyxcbiAgICBwYWRkaW5nQm90dG9tOiAzLFxuICAgIHBhZGRpbmdSaWdodDogMCxcbiAgICBtYXJnaW5MZWZ0OiAxNFxuICB9LFxuICBsYWJlbDoge1xuICAgIG1hcmdpbjogMCxcbiAgICBwYWRkaW5nOiAwLFxuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXG4gIH0sXG4gIHNwYW46IHtcbiAgICBjdXJzb3I6ICdkZWZhdWx0J1xuICB9LFxuICBzcGFuVHlwZToge1xuICAgIG1hcmdpbkxlZnQ6IDUsXG4gICAgbWFyZ2luUmlnaHQ6IDVcbiAgfVxufTtcblxudmFyIEpTT05BcnJheU5vZGUgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKEpTT05BcnJheU5vZGUsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIEpTT05BcnJheU5vZGUocHJvcHMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX0pTT05BcnJheU5vZGUpO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5jYWxsKHRoaXMsIHByb3BzKTtcbiAgICB0aGlzLmRlZmF1bHRQcm9wcyA9IHtcbiAgICAgIGRhdGE6IFtdLFxuICAgICAgaW5pdGlhbEV4cGFuZGVkOiBmYWxzZVxuICAgIH07XG4gICAgdGhpcy5uZWVkc0NoaWxkTm9kZXMgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyZWRDaGlsZHJlbiA9IFtdO1xuICAgIHRoaXMuaXRlbVN0cmluZyA9IGZhbHNlO1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBleHBhbmRlZDogdGhpcy5wcm9wcy5pbml0aWFsRXhwYW5kZWQsXG4gICAgICBjcmVhdGVkQ2hpbGROb2RlczogZmFsc2VcbiAgICB9O1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgY2hpbGQgbm9kZXMgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgYXJyYXkuIElmIHdlIGhhdmVcbiAgLy8gZ2VuZXJhdGVkIHRoZW0gcHJldmlvdXNseSwgd2UgcmV0dXJuIGZyb20gY2FjaGUsIG90aGVyd2lzZSB3ZSBjcmVhdGVcbiAgLy8gdGhlbS5cblxuICBKU09OQXJyYXlOb2RlLnByb3RvdHlwZS5nZXRDaGlsZE5vZGVzID0gZnVuY3Rpb24gZ2V0Q2hpbGROb2RlcygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgaWYgKHRoaXMuc3RhdGUuZXhwYW5kZWQgJiYgdGhpcy5uZWVkc0NoaWxkTm9kZXMpIHtcbiAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaGlsZE5vZGVzID0gW107XG4gICAgICAgIF90aGlzLnByb3BzLmRhdGEuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCwgaWR4KSB7XG4gICAgICAgICAgdmFyIHByZXZEYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmICh0eXBlb2YgX3RoaXMucHJvcHMucHJldmlvdXNEYXRhICE9PSAndW5kZWZpbmVkJyAmJiBfdGhpcy5wcm9wcy5wcmV2aW91c0RhdGEgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHByZXZEYXRhID0gX3RoaXMucHJvcHMucHJldmlvdXNEYXRhW2lkeF07XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBub2RlID0gX2dyYWJOb2RlMlsnZGVmYXVsdCddKGlkeCwgZWxlbWVudCwgcHJldkRhdGEsIF90aGlzLnByb3BzLnRoZW1lKTtcbiAgICAgICAgICBpZiAobm9kZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGNoaWxkTm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBfdGhpcy5uZWVkc0NoaWxkTm9kZXMgPSBmYWxzZTtcbiAgICAgICAgX3RoaXMucmVuZGVyZWRDaGlsZHJlbiA9IGNoaWxkTm9kZXM7XG4gICAgICB9KSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlZENoaWxkcmVuO1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIFwibiBJdGVtc1wiIHN0cmluZyBmb3IgdGhpcyBub2RlLCBnZW5lcmF0aW5nIGFuZFxuICAvLyBjYWNoaW5nIGl0IGlmIGl0IGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LlxuXG4gIEpTT05BcnJheU5vZGUucHJvdG90eXBlLmdldEl0ZW1TdHJpbmcgPSBmdW5jdGlvbiBnZXRJdGVtU3RyaW5nKCkge1xuICAgIGlmICghdGhpcy5pdGVtU3RyaW5nKSB7XG4gICAgICB0aGlzLml0ZW1TdHJpbmcgPSB0aGlzLnByb3BzLmRhdGEubGVuZ3RoICsgJyBpdGVtJyArICh0aGlzLnByb3BzLmRhdGEubGVuZ3RoICE9PSAxID8gJ3MnIDogJycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pdGVtU3RyaW5nO1xuICB9O1xuXG4gIEpTT05BcnJheU5vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgY2hpbGROb2RlcyA9IHRoaXMuZ2V0Q2hpbGROb2RlcygpO1xuICAgIHZhciBjaGlsZExpc3RTdHlsZSA9IHtcbiAgICAgIHBhZGRpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBsaXN0U3R5bGU6ICdub25lJyxcbiAgICAgIGRpc3BsYXk6IHRoaXMuc3RhdGUuZXhwYW5kZWQgPyAnYmxvY2snIDogJ25vbmUnXG4gICAgfTtcbiAgICB2YXIgY29udGFpbmVyU3R5bGUgPSB1bmRlZmluZWQ7XG4gICAgdmFyIHNwYW5TdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZXMuc3Bhbiwge1xuICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBFXG4gICAgfSk7XG4gICAgY29udGFpbmVyU3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJhc2UpO1xuICAgIGlmICh0aGlzLnN0YXRlLmV4cGFuZGVkKSB7XG4gICAgICBzcGFuU3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3BhblN0eWxlLCB7XG4gICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwM1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdsaScsXG4gICAgICB7IHN0eWxlOiBjb250YWluZXJTdHlsZSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05BcnJvdzJbJ2RlZmF1bHQnXSwgeyB0aGVtZTogdGhpcy5wcm9wcy50aGVtZSwgb3BlbjogdGhpcy5zdGF0ZS5leHBhbmRlZCwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0pLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdsYWJlbCcsXG4gICAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMubGFiZWwsIHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRFxuICAgICAgICAgIH0pLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgICAgdGhpcy5wcm9wcy5rZXlOYW1lLFxuICAgICAgICAnOidcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ3NwYW4nLFxuICAgICAgICB7IHN0eWxlOiBzcGFuU3R5bGUsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAnc3BhbicsXG4gICAgICAgICAgeyBzdHlsZTogc3R5bGVzLnNwYW5UeXBlIH0sXG4gICAgICAgICAgJ1tdJ1xuICAgICAgICApLFxuICAgICAgICB0aGlzLmdldEl0ZW1TdHJpbmcoKVxuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnb2wnLFxuICAgICAgICB7IHN0eWxlOiBjaGlsZExpc3RTdHlsZSB9LFxuICAgICAgICBjaGlsZE5vZGVzXG4gICAgICApXG4gICAgKTtcbiAgfTtcblxuICB2YXIgX0pTT05BcnJheU5vZGUgPSBKU09OQXJyYXlOb2RlO1xuICBKU09OQXJyYXlOb2RlID0gX3JlYWN0TWl4aW4yWydkZWZhdWx0J10uZGVjb3JhdGUoX21peGlucy5FeHBhbmRlZFN0YXRlSGFuZGxlck1peGluKShKU09OQXJyYXlOb2RlKSB8fCBKU09OQXJyYXlOb2RlO1xuICByZXR1cm4gSlNPTkFycmF5Tm9kZTtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBKU09OQXJyYXlOb2RlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbi8vIGZsYWcgdG8gc2VlIGlmIHdlIHN0aWxsIG5lZWQgdG8gcmVuZGVyIG91ciBjaGlsZCBub2Rlc1xuXG4vLyBjYWNoZSBzdG9yZSBmb3Igb3VyIGNoaWxkIG5vZGVzXG5cbi8vIGNhY2hlIHN0b3JlIGZvciB0aGUgbnVtYmVyIG9mIGl0ZW1zIHN0cmluZyB3ZSBkaXNwbGF5IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2luaGVyaXRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrJylbJ2RlZmF1bHQnXTtcblxudmFyIF9leHRlbmRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYmFzZToge1xuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgIG1hcmdpbkxlZnQ6IDAsXG4gICAgbWFyZ2luVG9wOiA4LFxuICAgIG1hcmdpblJpZ2h0OiA1LFxuICAgICdmbG9hdCc6ICdsZWZ0JyxcbiAgICB0cmFuc2l0aW9uOiAnMTUwbXMnLFxuICAgIFdlYmtpdFRyYW5zaXRpb246ICcxNTBtcycsXG4gICAgTW96VHJhbnNpdGlvbjogJzE1MG1zJyxcbiAgICBib3JkZXJMZWZ0OiAnNXB4IHNvbGlkIHRyYW5zcGFyZW50JyxcbiAgICBib3JkZXJSaWdodDogJzVweCBzb2xpZCB0cmFuc3BhcmVudCcsXG4gICAgYm9yZGVyVG9wV2lkdGg6IDUsXG4gICAgYm9yZGVyVG9wU3R5bGU6ICdzb2xpZCcsXG4gICAgV2Via2l0VHJhbnNmb3JtOiAncm90YXRlWigtOTBkZWcpJyxcbiAgICBNb3pUcmFuc2Zvcm06ICdyb3RhdGVaKC05MGRlZyknLFxuICAgIHRyYW5zZm9ybTogJ3JvdGF0ZVooLTkwZGVnKSdcbiAgfSxcbiAgb3Blbjoge1xuICAgIFdlYmtpdFRyYW5zZm9ybTogJ3JvdGF0ZVooMGRlZyknLFxuICAgIE1velRyYW5zZm9ybTogJ3JvdGF0ZVooMGRlZyknLFxuICAgIHRyYW5zZm9ybTogJ3JvdGF0ZVooMGRlZyknXG4gIH1cbn07XG5cbnZhciBKU09OQXJyb3cgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKEpTT05BcnJvdywgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gSlNPTkFycm93KCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBKU09OQXJyb3cpO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgSlNPTkFycm93LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIHN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlcy5iYXNlLCB7XG4gICAgICBib3JkZXJUb3BDb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMERcbiAgICB9KTtcbiAgICBpZiAodGhpcy5wcm9wcy5vcGVuKSB7XG4gICAgICBzdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZSwgc3R5bGVzLm9wZW4pO1xuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgc3R5bGU6IHN0eWxlLCBvbkNsaWNrOiB0aGlzLnByb3BzLm9uQ2xpY2sgfSk7XG4gIH07XG5cbiAgcmV0dXJuIEpTT05BcnJvdztcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBKU09OQXJyb3c7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW5oZXJpdHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2snKVsnZGVmYXVsdCddO1xuXG52YXIgX2V4dGVuZHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcycpWydkZWZhdWx0J107XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0TWl4aW4gPSByZXF1aXJlKCdyZWFjdC1taXhpbicpO1xuXG52YXIgX3JlYWN0TWl4aW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RNaXhpbik7XG5cbnZhciBfbWl4aW5zID0gcmVxdWlyZSgnLi9taXhpbnMnKTtcblxudmFyIF91dGlsc0hleFRvUmdiID0gcmVxdWlyZSgnLi91dGlscy9oZXhUb1JnYicpO1xuXG52YXIgX3V0aWxzSGV4VG9SZ2IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNIZXhUb1JnYik7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGJhc2U6IHtcbiAgICBwYWRkaW5nVG9wOiAzLFxuICAgIHBhZGRpbmdCb3R0b206IDMsXG4gICAgcGFkZGluZ1JpZ2h0OiAwLFxuICAgIG1hcmdpbkxlZnQ6IDE0XG4gIH0sXG4gIGxhYmVsOiB7XG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgbWFyZ2luUmlnaHQ6IDVcbiAgfVxufTtcblxudmFyIEpTT05Cb29sZWFuTm9kZSA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoSlNPTkJvb2xlYW5Ob2RlLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBKU09OQm9vbGVhbk5vZGUoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIF9KU09OQm9vbGVhbk5vZGUpO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgSlNPTkJvb2xlYW5Ob2RlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIHRydXRoU3RyaW5nID0gdGhpcy5wcm9wcy52YWx1ZSA/ICd0cnVlJyA6ICdmYWxzZSc7XG4gICAgdmFyIGJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgaWYgKHRoaXMucHJvcHMucHJldmlvdXNWYWx1ZSAhPT0gdGhpcy5wcm9wcy52YWx1ZSkge1xuICAgICAgdmFyIGJnQ29sb3IgPSBfdXRpbHNIZXhUb1JnYjJbJ2RlZmF1bHQnXSh0aGlzLnByb3BzLnRoZW1lLmJhc2UwNik7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgnICsgYmdDb2xvci5yICsgJywgJyArIGJnQ29sb3IuZyArICcsICcgKyBiZ0NvbG9yLmIgKyAnLCAwLjEpJztcbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2xpJyxcbiAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMuYmFzZSwgeyBiYWNrZ3JvdW5kQ29sb3I6IGJhY2tncm91bmRDb2xvciB9KSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2xhYmVsJyxcbiAgICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5sYWJlbCwge1xuICAgICAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBEXG4gICAgICAgICAgfSkgfSxcbiAgICAgICAgdGhpcy5wcm9wcy5rZXlOYW1lLFxuICAgICAgICAnOidcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ3NwYW4nLFxuICAgICAgICB7IHN0eWxlOiB7IGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwOSB9IH0sXG4gICAgICAgIHRydXRoU3RyaW5nXG4gICAgICApXG4gICAgKTtcbiAgfTtcblxuICB2YXIgX0pTT05Cb29sZWFuTm9kZSA9IEpTT05Cb29sZWFuTm9kZTtcbiAgSlNPTkJvb2xlYW5Ob2RlID0gX3JlYWN0TWl4aW4yWydkZWZhdWx0J10uZGVjb3JhdGUoX21peGlucy5TcXVhc2hDbGlja0V2ZW50TWl4aW4pKEpTT05Cb29sZWFuTm9kZSkgfHwgSlNPTkJvb2xlYW5Ob2RlO1xuICByZXR1cm4gSlNPTkJvb2xlYW5Ob2RlO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEpTT05Cb29sZWFuTm9kZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbmhlcml0cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cycpWydkZWZhdWx0J107XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3MtY2FsbC1jaGVjaycpWydkZWZhdWx0J107XG5cbnZhciBfZXh0ZW5kcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9leHRlbmRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RNaXhpbiA9IHJlcXVpcmUoJ3JlYWN0LW1peGluJyk7XG5cbnZhciBfcmVhY3RNaXhpbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdE1peGluKTtcblxudmFyIF9taXhpbnMgPSByZXF1aXJlKCcuL21peGlucycpO1xuXG52YXIgX3V0aWxzSGV4VG9SZ2IgPSByZXF1aXJlKCcuL3V0aWxzL2hleFRvUmdiJyk7XG5cbnZhciBfdXRpbHNIZXhUb1JnYjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc0hleFRvUmdiKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYmFzZToge1xuICAgIHBhZGRpbmdUb3A6IDMsXG4gICAgcGFkZGluZ0JvdHRvbTogMyxcbiAgICBwYWRkaW5nUmlnaHQ6IDAsXG4gICAgbWFyZ2luTGVmdDogMTRcbiAgfSxcbiAgbGFiZWw6IHtcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICBtYXJnaW5SaWdodDogNVxuICB9XG59O1xuXG52YXIgSlNPTkRhdGVOb2RlID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhKU09ORGF0ZU5vZGUsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIEpTT05EYXRlTm9kZSgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX0pTT05EYXRlTm9kZSk7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBKU09ORGF0ZU5vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICBpZiAodGhpcy5wcm9wcy5wcmV2aW91c1ZhbHVlICE9PSB0aGlzLnByb3BzLnZhbHVlKSB7XG4gICAgICB2YXIgYmdDb2xvciA9IF91dGlsc0hleFRvUmdiMlsnZGVmYXVsdCddKHRoaXMucHJvcHMudGhlbWUuYmFzZTA2KTtcbiAgICAgIGJhY2tncm91bmRDb2xvciA9ICdyZ2JhKCcgKyBiZ0NvbG9yLnIgKyAnLCAnICsgYmdDb2xvci5nICsgJywgJyArIGJnQ29sb3IuYiArICcsIDAuMSknO1xuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnbGknLFxuICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5iYXNlLCB7IGJhY2tncm91bmRDb2xvcjogYmFja2dyb3VuZENvbG9yIH0pLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnbGFiZWwnLFxuICAgICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmxhYmVsLCB7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMERcbiAgICAgICAgICB9KSB9LFxuICAgICAgICB0aGlzLnByb3BzLmtleU5hbWUsXG4gICAgICAgICc6J1xuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnc3BhbicsXG4gICAgICAgIHsgc3R5bGU6IHsgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBCIH0gfSxcbiAgICAgICAgdGhpcy5wcm9wcy52YWx1ZS50b0lTT1N0cmluZygpXG4gICAgICApXG4gICAgKTtcbiAgfTtcblxuICB2YXIgX0pTT05EYXRlTm9kZSA9IEpTT05EYXRlTm9kZTtcbiAgSlNPTkRhdGVOb2RlID0gX3JlYWN0TWl4aW4yWydkZWZhdWx0J10uZGVjb3JhdGUoX21peGlucy5TcXVhc2hDbGlja0V2ZW50TWl4aW4pKEpTT05EYXRlTm9kZSkgfHwgSlNPTkRhdGVOb2RlO1xuICByZXR1cm4gSlNPTkRhdGVOb2RlO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEpTT05EYXRlTm9kZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbmhlcml0cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cycpWydkZWZhdWx0J107XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3MtY2FsbC1jaGVjaycpWydkZWZhdWx0J107XG5cbnZhciBfZXh0ZW5kcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9leHRlbmRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9nZXRJdGVyYXRvciA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9nZXQtaXRlcmF0b3InKVsnZGVmYXVsdCddO1xuXG52YXIgX051bWJlciRpc1NhZmVJbnRlZ2VyID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9jb3JlLWpzL251bWJlci9pcy1zYWZlLWludGVnZXInKVsnZGVmYXVsdCddO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdE1peGluID0gcmVxdWlyZSgncmVhY3QtbWl4aW4nKTtcblxudmFyIF9yZWFjdE1peGluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0TWl4aW4pO1xuXG52YXIgX21peGlucyA9IHJlcXVpcmUoJy4vbWl4aW5zJyk7XG5cbnZhciBfSlNPTkFycm93ID0gcmVxdWlyZSgnLi9KU09OQXJyb3cnKTtcblxudmFyIF9KU09OQXJyb3cyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTkFycm93KTtcblxudmFyIF9ncmFiTm9kZSA9IHJlcXVpcmUoJy4vZ3JhYi1ub2RlJyk7XG5cbnZhciBfZ3JhYk5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ3JhYk5vZGUpO1xuXG52YXIgc3R5bGVzID0ge1xuICBiYXNlOiB7XG4gICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgcGFkZGluZ1RvcDogMyxcbiAgICBwYWRkaW5nQm90dG9tOiAzLFxuICAgIHBhZGRpbmdSaWdodDogMCxcbiAgICBtYXJnaW5MZWZ0OiAxNFxuICB9LFxuICBsYWJlbDoge1xuICAgIG1hcmdpbjogMCxcbiAgICBwYWRkaW5nOiAwLFxuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXG4gIH0sXG4gIHNwYW46IHtcbiAgICBjdXJzb3I6ICdkZWZhdWx0J1xuICB9LFxuICBzcGFuVHlwZToge1xuICAgIG1hcmdpbkxlZnQ6IDUsXG4gICAgbWFyZ2luUmlnaHQ6IDVcbiAgfVxufTtcblxudmFyIEpTT05JdGVyYWJsZU5vZGUgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKEpTT05JdGVyYWJsZU5vZGUsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIEpTT05JdGVyYWJsZU5vZGUocHJvcHMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX0pTT05JdGVyYWJsZU5vZGUpO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5jYWxsKHRoaXMsIHByb3BzKTtcbiAgICB0aGlzLmRlZmF1bHRQcm9wcyA9IHtcbiAgICAgIGRhdGE6IFtdLFxuICAgICAgaW5pdGlhbEV4cGFuZGVkOiBmYWxzZVxuICAgIH07XG4gICAgdGhpcy5uZWVkc0NoaWxkTm9kZXMgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyZWRDaGlsZHJlbiA9IFtdO1xuICAgIHRoaXMuaXRlbVN0cmluZyA9IGZhbHNlO1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBleHBhbmRlZDogdGhpcy5wcm9wcy5pbml0aWFsRXhwYW5kZWQsXG4gICAgICBjcmVhdGVkQ2hpbGROb2RlczogZmFsc2VcbiAgICB9O1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgY2hpbGQgbm9kZXMgZm9yIGVhY2ggZW50cnkgaW4gaXRlcmFibGUuIElmIHdlIGhhdmVcbiAgLy8gZ2VuZXJhdGVkIHRoZW0gcHJldmlvdXNseSwgd2UgcmV0dXJuIGZyb20gY2FjaGUsIG90aGVyd2lzZSB3ZSBjcmVhdGVcbiAgLy8gdGhlbS5cblxuICBKU09OSXRlcmFibGVOb2RlLnByb3RvdHlwZS5nZXRDaGlsZE5vZGVzID0gZnVuY3Rpb24gZ2V0Q2hpbGROb2RlcygpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5leHBhbmRlZCAmJiB0aGlzLm5lZWRzQ2hpbGROb2Rlcykge1xuICAgICAgdmFyIGNoaWxkTm9kZXMgPSBbXTtcbiAgICAgIGZvciAodmFyIF9pdGVyYXRvciA9IHRoaXMucHJvcHMuZGF0YSwgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5KF9pdGVyYXRvciksIF9pID0gMCwgX2l0ZXJhdG9yID0gX2lzQXJyYXkgPyBfaXRlcmF0b3IgOiBfZ2V0SXRlcmF0b3IoX2l0ZXJhdG9yKTs7KSB7XG4gICAgICAgIHZhciBfcmVmO1xuXG4gICAgICAgIGlmIChfaXNBcnJheSkge1xuICAgICAgICAgIGlmIChfaSA+PSBfaXRlcmF0b3IubGVuZ3RoKSBicmVhaztcbiAgICAgICAgICBfcmVmID0gX2l0ZXJhdG9yW19pKytdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9pID0gX2l0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoX2kuZG9uZSkgYnJlYWs7XG4gICAgICAgICAgX3JlZiA9IF9pLnZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVudHJ5ID0gX3JlZjtcblxuICAgICAgICB2YXIga2V5ID0gbnVsbDtcbiAgICAgICAgdmFyIHZhbHVlID0gbnVsbDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZW50cnkpKSB7XG4gICAgICAgICAga2V5ID0gZW50cnlbMF07XG4gICAgICAgICAgdmFsdWUgPSBlbnRyeVsxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBrZXkgPSBjaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgICB2YWx1ZSA9IGVudHJ5O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByZXZEYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMucHJldmlvdXNEYXRhICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLnByb3BzLnByZXZpb3VzRGF0YSAhPT0gbnVsbCkge1xuICAgICAgICAgIHByZXZEYXRhID0gdGhpcy5wcm9wcy5wcmV2aW91c0RhdGFba2V5XTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbm9kZSA9IF9ncmFiTm9kZTJbJ2RlZmF1bHQnXShrZXksIHZhbHVlLCBwcmV2RGF0YSwgdGhpcy5wcm9wcy50aGVtZSk7XG4gICAgICAgIGlmIChub2RlICE9PSBmYWxzZSkge1xuICAgICAgICAgIGNoaWxkTm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5uZWVkc0NoaWxkTm9kZXMgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVuZGVyZWRDaGlsZHJlbiA9IGNoaWxkTm9kZXM7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlbmRlcmVkQ2hpbGRyZW47XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgXCJuIGVudHJpZXNcIiBzdHJpbmcgZm9yIHRoaXMgbm9kZSwgZ2VuZXJhdGluZyBhbmRcbiAgLy8gY2FjaGluZyBpdCBpZiBpdCBoYXNuJ3QgYmVlbiBjcmVhdGVkIHlldC5cblxuICBKU09OSXRlcmFibGVOb2RlLnByb3RvdHlwZS5nZXRJdGVtU3RyaW5nID0gZnVuY3Rpb24gZ2V0SXRlbVN0cmluZygpIHtcbiAgICBpZiAoIXRoaXMuaXRlbVN0cmluZykge1xuICAgICAgdmFyIGRhdGEgPSB0aGlzLnByb3BzLmRhdGE7XG5cbiAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICBpZiAoX051bWJlciRpc1NhZmVJbnRlZ2VyKGRhdGEuc2l6ZSkpIHtcbiAgICAgICAgY291bnQgPSBkYXRhLnNpemU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBfaXRlcmF0b3IyID0gZGF0YSwgX2lzQXJyYXkyID0gQXJyYXkuaXNBcnJheShfaXRlcmF0b3IyKSwgX2kyID0gMCwgX2l0ZXJhdG9yMiA9IF9pc0FycmF5MiA/IF9pdGVyYXRvcjIgOiBfZ2V0SXRlcmF0b3IoX2l0ZXJhdG9yMik7Oykge1xuICAgICAgICAgIHZhciBfcmVmMjtcblxuICAgICAgICAgIGlmIChfaXNBcnJheTIpIHtcbiAgICAgICAgICAgIGlmIChfaTIgPj0gX2l0ZXJhdG9yMi5sZW5ndGgpIGJyZWFrO1xuICAgICAgICAgICAgX3JlZjIgPSBfaXRlcmF0b3IyW19pMisrXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2kyID0gX2l0ZXJhdG9yMi5uZXh0KCk7XG4gICAgICAgICAgICBpZiAoX2kyLmRvbmUpIGJyZWFrO1xuICAgICAgICAgICAgX3JlZjIgPSBfaTIudmFsdWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGVudHJ5ID0gX3JlZjI7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgICAgICAgIGNvdW50ICs9IDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuaXRlbVN0cmluZyA9IGNvdW50ICsgJyBlbnRyJyArIChjb3VudCAhPT0gMSA/ICdpZXMnIDogJ3knKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaXRlbVN0cmluZztcbiAgfTtcblxuICBKU09OSXRlcmFibGVOb2RlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIGNoaWxkTm9kZXMgPSB0aGlzLmdldENoaWxkTm9kZXMoKTtcbiAgICB2YXIgY2hpbGRMaXN0U3R5bGUgPSB7XG4gICAgICBwYWRkaW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgbGlzdFN0eWxlOiAnbm9uZScsXG4gICAgICBkaXNwbGF5OiB0aGlzLnN0YXRlLmV4cGFuZGVkID8gJ2Jsb2NrJyA6ICdub25lJ1xuICAgIH07XG4gICAgdmFyIGNvbnRhaW5lclN0eWxlID0gdW5kZWZpbmVkO1xuICAgIHZhciBzcGFuU3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGVzLnNwYW4sIHtcbiAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRVxuICAgIH0pO1xuICAgIGNvbnRhaW5lclN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlcy5iYXNlKTtcbiAgICBpZiAodGhpcy5zdGF0ZS5leHBhbmRlZCkge1xuICAgICAgc3BhblN0eWxlID0gX2V4dGVuZHMoe30sIHNwYW5TdHlsZSwge1xuICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDNcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnbGknLFxuICAgICAgeyBzdHlsZTogY29udGFpbmVyU3R5bGUgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09OQXJyb3cyWydkZWZhdWx0J10sIHsgdGhlbWU6IHRoaXMucHJvcHMudGhlbWUsIG9wZW46IHRoaXMuc3RhdGUuZXhwYW5kZWQsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9KSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnbGFiZWwnLFxuICAgICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmxhYmVsLCB7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMERcbiAgICAgICAgICB9KSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICAgIHRoaXMucHJvcHMua2V5TmFtZSxcbiAgICAgICAgJzonXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdzcGFuJyxcbiAgICAgICAgeyBzdHlsZTogc3BhblN0eWxlLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgJ3NwYW4nLFxuICAgICAgICAgIHsgc3R5bGU6IHN0eWxlcy5zcGFuVHlwZSB9LFxuICAgICAgICAgICcoKSdcbiAgICAgICAgKSxcbiAgICAgICAgdGhpcy5nZXRJdGVtU3RyaW5nKClcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ29sJyxcbiAgICAgICAgeyBzdHlsZTogY2hpbGRMaXN0U3R5bGUgfSxcbiAgICAgICAgY2hpbGROb2Rlc1xuICAgICAgKVxuICAgICk7XG4gIH07XG5cbiAgdmFyIF9KU09OSXRlcmFibGVOb2RlID0gSlNPTkl0ZXJhYmxlTm9kZTtcbiAgSlNPTkl0ZXJhYmxlTm9kZSA9IF9yZWFjdE1peGluMlsnZGVmYXVsdCddLmRlY29yYXRlKF9taXhpbnMuRXhwYW5kZWRTdGF0ZUhhbmRsZXJNaXhpbikoSlNPTkl0ZXJhYmxlTm9kZSkgfHwgSlNPTkl0ZXJhYmxlTm9kZTtcbiAgcmV0dXJuIEpTT05JdGVyYWJsZU5vZGU7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gSlNPTkl0ZXJhYmxlTm9kZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG4vLyBmbGFnIHRvIHNlZSBpZiB3ZSBzdGlsbCBuZWVkIHRvIHJlbmRlciBvdXIgY2hpbGQgbm9kZXNcblxuLy8gY2FjaGUgc3RvcmUgZm9yIG91ciBjaGlsZCBub2Rlc1xuXG4vLyBjYWNoZSBzdG9yZSBmb3IgdGhlIG51bWJlciBvZiBpdGVtcyBzdHJpbmcgd2UgZGlzcGxheSIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbmhlcml0cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cycpWydkZWZhdWx0J107XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3MtY2FsbC1jaGVjaycpWydkZWZhdWx0J107XG5cbnZhciBfZXh0ZW5kcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9leHRlbmRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RNaXhpbiA9IHJlcXVpcmUoJ3JlYWN0LW1peGluJyk7XG5cbnZhciBfcmVhY3RNaXhpbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdE1peGluKTtcblxudmFyIF9taXhpbnMgPSByZXF1aXJlKCcuL21peGlucycpO1xuXG52YXIgX3V0aWxzSGV4VG9SZ2IgPSByZXF1aXJlKCcuL3V0aWxzL2hleFRvUmdiJyk7XG5cbnZhciBfdXRpbHNIZXhUb1JnYjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc0hleFRvUmdiKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYmFzZToge1xuICAgIHBhZGRpbmdUb3A6IDMsXG4gICAgcGFkZGluZ0JvdHRvbTogMyxcbiAgICBwYWRkaW5nUmlnaHQ6IDAsXG4gICAgbWFyZ2luTGVmdDogMTRcbiAgfSxcbiAgbGFiZWw6IHtcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICBtYXJnaW5SaWdodDogNVxuICB9XG59O1xuXG52YXIgSlNPTk51bGxOb2RlID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhKU09OTnVsbE5vZGUsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIEpTT05OdWxsTm9kZSgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX0pTT05OdWxsTm9kZSk7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBKU09OTnVsbE5vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICBpZiAodGhpcy5wcm9wcy5wcmV2aW91c1ZhbHVlICE9PSB0aGlzLnByb3BzLnZhbHVlKSB7XG4gICAgICB2YXIgYmdDb2xvciA9IF91dGlsc0hleFRvUmdiMlsnZGVmYXVsdCddKHRoaXMucHJvcHMudGhlbWUuYmFzZTA2KTtcbiAgICAgIGJhY2tncm91bmRDb2xvciA9ICdyZ2JhKCcgKyBiZ0NvbG9yLnIgKyAnLCAnICsgYmdDb2xvci5nICsgJywgJyArIGJnQ29sb3IuYiArICcsIDAuMSknO1xuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnbGknLFxuICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5iYXNlLCB7IGJhY2tncm91bmRDb2xvcjogYmFja2dyb3VuZENvbG9yIH0pLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnbGFiZWwnLFxuICAgICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmxhYmVsLCB7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMERcbiAgICAgICAgICB9KSB9LFxuICAgICAgICB0aGlzLnByb3BzLmtleU5hbWUsXG4gICAgICAgICc6J1xuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnc3BhbicsXG4gICAgICAgIHsgc3R5bGU6IHsgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTA4IH0gfSxcbiAgICAgICAgJ251bGwnXG4gICAgICApXG4gICAgKTtcbiAgfTtcblxuICB2YXIgX0pTT05OdWxsTm9kZSA9IEpTT05OdWxsTm9kZTtcbiAgSlNPTk51bGxOb2RlID0gX3JlYWN0TWl4aW4yWydkZWZhdWx0J10uZGVjb3JhdGUoX21peGlucy5TcXVhc2hDbGlja0V2ZW50TWl4aW4pKEpTT05OdWxsTm9kZSkgfHwgSlNPTk51bGxOb2RlO1xuICByZXR1cm4gSlNPTk51bGxOb2RlO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEpTT05OdWxsTm9kZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbmhlcml0cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cycpWydkZWZhdWx0J107XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3MtY2FsbC1jaGVjaycpWydkZWZhdWx0J107XG5cbnZhciBfZXh0ZW5kcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9leHRlbmRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RNaXhpbiA9IHJlcXVpcmUoJ3JlYWN0LW1peGluJyk7XG5cbnZhciBfcmVhY3RNaXhpbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdE1peGluKTtcblxudmFyIF9taXhpbnMgPSByZXF1aXJlKCcuL21peGlucycpO1xuXG52YXIgX3V0aWxzSGV4VG9SZ2IgPSByZXF1aXJlKCcuL3V0aWxzL2hleFRvUmdiJyk7XG5cbnZhciBfdXRpbHNIZXhUb1JnYjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc0hleFRvUmdiKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYmFzZToge1xuICAgIHBhZGRpbmdUb3A6IDMsXG4gICAgcGFkZGluZ0JvdHRvbTogMyxcbiAgICBwYWRkaW5nUmlnaHQ6IDAsXG4gICAgbWFyZ2luTGVmdDogMTRcbiAgfSxcbiAgbGFiZWw6IHtcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICBtYXJnaW5SaWdodDogNVxuICB9XG59O1xuXG52YXIgSlNPTk51bWJlck5vZGUgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKEpTT05OdW1iZXJOb2RlLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBKU09OTnVtYmVyTm9kZSgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX0pTT05OdW1iZXJOb2RlKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIEpTT05OdW1iZXJOb2RlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIGJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgaWYgKHRoaXMucHJvcHMucHJldmlvdXNWYWx1ZSAhPT0gdGhpcy5wcm9wcy52YWx1ZSkge1xuICAgICAgdmFyIGJnQ29sb3IgPSBfdXRpbHNIZXhUb1JnYjJbJ2RlZmF1bHQnXSh0aGlzLnByb3BzLnRoZW1lLmJhc2UwNik7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgnICsgYmdDb2xvci5yICsgJywgJyArIGJnQ29sb3IuZyArICcsICcgKyBiZ0NvbG9yLmIgKyAnLCAwLjEpJztcbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2xpJyxcbiAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMuYmFzZSwgeyBiYWNrZ3JvdW5kQ29sb3I6IGJhY2tncm91bmRDb2xvciB9KSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2xhYmVsJyxcbiAgICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5sYWJlbCwge1xuICAgICAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBEXG4gICAgICAgICAgfSkgfSxcbiAgICAgICAgdGhpcy5wcm9wcy5rZXlOYW1lLFxuICAgICAgICAnOidcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ3NwYW4nLFxuICAgICAgICB7IHN0eWxlOiB7IGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwOSB9IH0sXG4gICAgICAgIHRoaXMucHJvcHMudmFsdWVcbiAgICAgIClcbiAgICApO1xuICB9O1xuXG4gIHZhciBfSlNPTk51bWJlck5vZGUgPSBKU09OTnVtYmVyTm9kZTtcbiAgSlNPTk51bWJlck5vZGUgPSBfcmVhY3RNaXhpbjJbJ2RlZmF1bHQnXS5kZWNvcmF0ZShfbWl4aW5zLlNxdWFzaENsaWNrRXZlbnRNaXhpbikoSlNPTk51bWJlck5vZGUpIHx8IEpTT05OdW1iZXJOb2RlO1xuICByZXR1cm4gSlNPTk51bWJlck5vZGU7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gSlNPTk51bWJlck5vZGU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW5oZXJpdHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2snKVsnZGVmYXVsdCddO1xuXG52YXIgX2V4dGVuZHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcycpWydkZWZhdWx0J107XG5cbnZhciBfT2JqZWN0JGtleXMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2tleXMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdE1peGluID0gcmVxdWlyZSgncmVhY3QtbWl4aW4nKTtcblxudmFyIF9yZWFjdE1peGluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0TWl4aW4pO1xuXG52YXIgX21peGlucyA9IHJlcXVpcmUoJy4vbWl4aW5zJyk7XG5cbnZhciBfSlNPTkFycm93ID0gcmVxdWlyZSgnLi9KU09OQXJyb3cnKTtcblxudmFyIF9KU09OQXJyb3cyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTkFycm93KTtcblxudmFyIF9ncmFiTm9kZSA9IHJlcXVpcmUoJy4vZ3JhYi1ub2RlJyk7XG5cbnZhciBfZ3JhYk5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ3JhYk5vZGUpO1xuXG52YXIgc3R5bGVzID0ge1xuICBiYXNlOiB7XG4gICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgcGFkZGluZ1RvcDogMyxcbiAgICBwYWRkaW5nQm90dG9tOiAzLFxuICAgIG1hcmdpbkxlZnQ6IDE0XG4gIH0sXG4gIGxhYmVsOiB7XG4gICAgbWFyZ2luOiAwLFxuICAgIHBhZGRpbmc6IDAsXG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaydcbiAgfSxcbiAgc3Bhbjoge1xuICAgIGN1cnNvcjogJ2RlZmF1bHQnXG4gIH0sXG4gIHNwYW5UeXBlOiB7XG4gICAgbWFyZ2luTGVmdDogNSxcbiAgICBtYXJnaW5SaWdodDogNVxuICB9XG59O1xuXG52YXIgSlNPTk9iamVjdE5vZGUgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKEpTT05PYmplY3ROb2RlLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBKU09OT2JqZWN0Tm9kZShwcm9wcykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfSlNPTk9iamVjdE5vZGUpO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5jYWxsKHRoaXMsIHByb3BzKTtcbiAgICB0aGlzLmRlZmF1bHRQcm9wcyA9IHtcbiAgICAgIGRhdGE6IFtdLFxuICAgICAgaW5pdGlhbEV4cGFuZGVkOiBmYWxzZVxuICAgIH07XG4gICAgdGhpcy5pdGVtU3RyaW5nID0gZmFsc2U7XG4gICAgdGhpcy5uZWVkc0NoaWxkTm9kZXMgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyZWRDaGlsZHJlbiA9IFtdO1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBleHBhbmRlZDogdGhpcy5wcm9wcy5pbml0aWFsRXhwYW5kZWQsXG4gICAgICBjcmVhdGVkQ2hpbGROb2RlczogZmFsc2VcbiAgICB9O1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgY2hpbGQgbm9kZXMgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgb2JqZWN0LiBJZiB3ZSBoYXZlXG4gIC8vIGdlbmVyYXRlZCB0aGVtIHByZXZpb3VzbHksIHdlIHJldHVybiBmcm9tIGNhY2hlLCBvdGhlcndpc2Ugd2UgY3JlYXRlXG4gIC8vIHRoZW0uXG5cbiAgSlNPTk9iamVjdE5vZGUucHJvdG90eXBlLmdldENoaWxkTm9kZXMgPSBmdW5jdGlvbiBnZXRDaGlsZE5vZGVzKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmV4cGFuZGVkICYmIHRoaXMubmVlZHNDaGlsZE5vZGVzKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5wcm9wcy5kYXRhO1xuICAgICAgdmFyIGNoaWxkTm9kZXMgPSBbXTtcbiAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICB2YXIgcHJldkRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnByb3BzLnByZXZpb3VzRGF0YSAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5wcm9wcy5wcmV2aW91c0RhdGEgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHByZXZEYXRhID0gdGhpcy5wcm9wcy5wcmV2aW91c0RhdGFba107XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBub2RlID0gX2dyYWJOb2RlMlsnZGVmYXVsdCddKGssIG9ialtrXSwgcHJldkRhdGEsIHRoaXMucHJvcHMudGhlbWUpO1xuICAgICAgICAgIGlmIChub2RlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgY2hpbGROb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5uZWVkc0NoaWxkTm9kZXMgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVuZGVyZWRDaGlsZHJlbiA9IGNoaWxkTm9kZXM7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlbmRlcmVkQ2hpbGRyZW47XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgXCJuIEl0ZW1zXCIgc3RyaW5nIGZvciB0aGlzIG5vZGUsIGdlbmVyYXRpbmcgYW5kXG4gIC8vIGNhY2hpbmcgaXQgaWYgaXQgaGFzbid0IGJlZW4gY3JlYXRlZCB5ZXQuXG5cbiAgSlNPTk9iamVjdE5vZGUucHJvdG90eXBlLmdldEl0ZW1TdHJpbmcgPSBmdW5jdGlvbiBnZXRJdGVtU3RyaW5nKCkge1xuICAgIGlmICghdGhpcy5pdGVtU3RyaW5nKSB7XG4gICAgICB2YXIgbGVuID0gX09iamVjdCRrZXlzKHRoaXMucHJvcHMuZGF0YSkubGVuZ3RoO1xuICAgICAgdGhpcy5pdGVtU3RyaW5nID0gbGVuICsgJyBrZXknICsgKGxlbiAhPT0gMSA/ICdzJyA6ICcnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaXRlbVN0cmluZztcbiAgfTtcblxuICBKU09OT2JqZWN0Tm9kZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBjaGlsZExpc3RTdHlsZSA9IHtcbiAgICAgIHBhZGRpbmc6IDAsXG4gICAgICBtYXJnaW46IDAsXG4gICAgICBsaXN0U3R5bGU6ICdub25lJyxcbiAgICAgIGRpc3BsYXk6IHRoaXMuc3RhdGUuZXhwYW5kZWQgPyAnYmxvY2snIDogJ25vbmUnXG4gICAgfTtcbiAgICB2YXIgY29udGFpbmVyU3R5bGUgPSB1bmRlZmluZWQ7XG4gICAgdmFyIHNwYW5TdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZXMuc3Bhbiwge1xuICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBCXG4gICAgfSk7XG4gICAgY29udGFpbmVyU3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJhc2UpO1xuICAgIGlmICh0aGlzLnN0YXRlLmV4cGFuZGVkKSB7XG4gICAgICBzcGFuU3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3BhblN0eWxlLCB7XG4gICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwM1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdsaScsXG4gICAgICB7IHN0eWxlOiBjb250YWluZXJTdHlsZSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05BcnJvdzJbJ2RlZmF1bHQnXSwgeyB0aGVtZTogdGhpcy5wcm9wcy50aGVtZSwgb3BlbjogdGhpcy5zdGF0ZS5leHBhbmRlZCwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0pLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdsYWJlbCcsXG4gICAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMubGFiZWwsIHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRFxuICAgICAgICAgIH0pLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgICAgdGhpcy5wcm9wcy5rZXlOYW1lLFxuICAgICAgICAnOidcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ3NwYW4nLFxuICAgICAgICB7IHN0eWxlOiBzcGFuU3R5bGUsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAnc3BhbicsXG4gICAgICAgICAgeyBzdHlsZTogc3R5bGVzLnNwYW5UeXBlIH0sXG4gICAgICAgICAgJ3t9J1xuICAgICAgICApLFxuICAgICAgICB0aGlzLmdldEl0ZW1TdHJpbmcoKVxuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAndWwnLFxuICAgICAgICB7IHN0eWxlOiBjaGlsZExpc3RTdHlsZSB9LFxuICAgICAgICB0aGlzLmdldENoaWxkTm9kZXMoKVxuICAgICAgKVxuICAgICk7XG4gIH07XG5cbiAgdmFyIF9KU09OT2JqZWN0Tm9kZSA9IEpTT05PYmplY3ROb2RlO1xuICBKU09OT2JqZWN0Tm9kZSA9IF9yZWFjdE1peGluMlsnZGVmYXVsdCddLmRlY29yYXRlKF9taXhpbnMuRXhwYW5kZWRTdGF0ZUhhbmRsZXJNaXhpbikoSlNPTk9iamVjdE5vZGUpIHx8IEpTT05PYmplY3ROb2RlO1xuICByZXR1cm4gSlNPTk9iamVjdE5vZGU7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gSlNPTk9iamVjdE5vZGU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLy8gY2FjaGUgc3RvcmUgZm9yIHRoZSBudW1iZXIgb2YgaXRlbXMgc3RyaW5nIHdlIGRpc3BsYXlcblxuLy8gZmxhZyB0byBzZWUgaWYgd2Ugc3RpbGwgbmVlZCB0byByZW5kZXIgb3VyIGNoaWxkIG5vZGVzXG5cbi8vIGNhY2hlIHN0b3JlIGZvciBvdXIgY2hpbGQgbm9kZXMiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW5oZXJpdHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2snKVsnZGVmYXVsdCddO1xuXG52YXIgX2V4dGVuZHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcycpWydkZWZhdWx0J107XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0TWl4aW4gPSByZXF1aXJlKCdyZWFjdC1taXhpbicpO1xuXG52YXIgX3JlYWN0TWl4aW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RNaXhpbik7XG5cbnZhciBfbWl4aW5zID0gcmVxdWlyZSgnLi9taXhpbnMnKTtcblxudmFyIF91dGlsc0hleFRvUmdiID0gcmVxdWlyZSgnLi91dGlscy9oZXhUb1JnYicpO1xuXG52YXIgX3V0aWxzSGV4VG9SZ2IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNIZXhUb1JnYik7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGJhc2U6IHtcbiAgICBwYWRkaW5nVG9wOiAzLFxuICAgIHBhZGRpbmdCb3R0b206IDMsXG4gICAgcGFkZGluZ1JpZ2h0OiAwLFxuICAgIG1hcmdpbkxlZnQ6IDE0XG4gIH0sXG4gIGxhYmVsOiB7XG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgbWFyZ2luUmlnaHQ6IDVcbiAgfVxufTtcblxudmFyIEpTT05TdHJpbmdOb2RlID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhKU09OU3RyaW5nTm9kZSwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gSlNPTlN0cmluZ05vZGUoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIF9KU09OU3RyaW5nTm9kZSk7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBKU09OU3RyaW5nTm9kZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBiYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIGlmICh0aGlzLnByb3BzLnByZXZpb3VzVmFsdWUgIT09IHRoaXMucHJvcHMudmFsdWUpIHtcbiAgICAgIHZhciBiZ0NvbG9yID0gX3V0aWxzSGV4VG9SZ2IyWydkZWZhdWx0J10odGhpcy5wcm9wcy50aGVtZS5iYXNlMDYpO1xuICAgICAgYmFja2dyb3VuZENvbG9yID0gJ3JnYmEoJyArIGJnQ29sb3IuciArICcsICcgKyBiZ0NvbG9yLmcgKyAnLCAnICsgYmdDb2xvci5iICsgJywgMC4xKSc7XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdsaScsXG4gICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJhc2UsIHsgYmFja2dyb3VuZENvbG9yOiBiYWNrZ3JvdW5kQ29sb3IgfSksIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdsYWJlbCcsXG4gICAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMubGFiZWwsIHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRFxuICAgICAgICAgIH0pIH0sXG4gICAgICAgIHRoaXMucHJvcHMua2V5TmFtZSxcbiAgICAgICAgJzonXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdzcGFuJyxcbiAgICAgICAgeyBzdHlsZTogeyBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMEIgfSB9LFxuICAgICAgICAnXCInLFxuICAgICAgICB0aGlzLnByb3BzLnZhbHVlLFxuICAgICAgICAnXCInXG4gICAgICApXG4gICAgKTtcbiAgfTtcblxuICB2YXIgX0pTT05TdHJpbmdOb2RlID0gSlNPTlN0cmluZ05vZGU7XG4gIEpTT05TdHJpbmdOb2RlID0gX3JlYWN0TWl4aW4yWydkZWZhdWx0J10uZGVjb3JhdGUoX21peGlucy5TcXVhc2hDbGlja0V2ZW50TWl4aW4pKEpTT05TdHJpbmdOb2RlKSB8fCBKU09OU3RyaW5nTm9kZTtcbiAgcmV0dXJuIEpTT05TdHJpbmdOb2RlO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEpTT05TdHJpbmdOb2RlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9vYmpUeXBlID0gcmVxdWlyZSgnLi9vYmotdHlwZScpO1xuXG52YXIgX29ialR5cGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfb2JqVHlwZSk7XG5cbnZhciBfSlNPTk9iamVjdE5vZGUgPSByZXF1aXJlKCcuL0pTT05PYmplY3ROb2RlJyk7XG5cbnZhciBfSlNPTk9iamVjdE5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTk9iamVjdE5vZGUpO1xuXG52YXIgX0pTT05BcnJheU5vZGUgPSByZXF1aXJlKCcuL0pTT05BcnJheU5vZGUnKTtcblxudmFyIF9KU09OQXJyYXlOb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05BcnJheU5vZGUpO1xuXG52YXIgX0pTT05JdGVyYWJsZU5vZGUgPSByZXF1aXJlKCcuL0pTT05JdGVyYWJsZU5vZGUnKTtcblxudmFyIF9KU09OSXRlcmFibGVOb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05JdGVyYWJsZU5vZGUpO1xuXG52YXIgX0pTT05TdHJpbmdOb2RlID0gcmVxdWlyZSgnLi9KU09OU3RyaW5nTm9kZScpO1xuXG52YXIgX0pTT05TdHJpbmdOb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05TdHJpbmdOb2RlKTtcblxudmFyIF9KU09OTnVtYmVyTm9kZSA9IHJlcXVpcmUoJy4vSlNPTk51bWJlck5vZGUnKTtcblxudmFyIF9KU09OTnVtYmVyTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09OTnVtYmVyTm9kZSk7XG5cbnZhciBfSlNPTkJvb2xlYW5Ob2RlID0gcmVxdWlyZSgnLi9KU09OQm9vbGVhbk5vZGUnKTtcblxudmFyIF9KU09OQm9vbGVhbk5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTkJvb2xlYW5Ob2RlKTtcblxudmFyIF9KU09OTnVsbE5vZGUgPSByZXF1aXJlKCcuL0pTT05OdWxsTm9kZScpO1xuXG52YXIgX0pTT05OdWxsTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09OTnVsbE5vZGUpO1xuXG52YXIgX0pTT05EYXRlTm9kZSA9IHJlcXVpcmUoJy4vSlNPTkRhdGVOb2RlJyk7XG5cbnZhciBfSlNPTkRhdGVOb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05EYXRlTm9kZSk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBwcmV2VmFsdWUsIHRoZW1lKSB7XG4gIHZhciBpbml0aWFsRXhwYW5kZWQgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDQgfHwgYXJndW1lbnRzWzRdID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGFyZ3VtZW50c1s0XTtcblxuICB2YXIgbm9kZVR5cGUgPSBfb2JqVHlwZTJbJ2RlZmF1bHQnXSh2YWx1ZSk7XG4gIGlmIChub2RlVHlwZSA9PT0gJ09iamVjdCcpIHtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05PYmplY3ROb2RlMlsnZGVmYXVsdCddLCB7IGRhdGE6IHZhbHVlLCBwcmV2aW91c0RhdGE6IHByZXZWYWx1ZSwgdGhlbWU6IHRoZW1lLCBpbml0aWFsRXhwYW5kZWQ6IGluaXRpYWxFeHBhbmRlZCwga2V5TmFtZToga2V5LCBrZXk6IGtleSB9KTtcbiAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gJ0FycmF5Jykge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTkFycmF5Tm9kZTJbJ2RlZmF1bHQnXSwgeyBkYXRhOiB2YWx1ZSwgcHJldmlvdXNEYXRhOiBwcmV2VmFsdWUsIHRoZW1lOiB0aGVtZSwgaW5pdGlhbEV4cGFuZGVkOiBpbml0aWFsRXhwYW5kZWQsIGtleU5hbWU6IGtleSwga2V5OiBrZXkgfSk7XG4gIH0gZWxzZSBpZiAobm9kZVR5cGUgPT09ICdJdGVyYWJsZScpIHtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05JdGVyYWJsZU5vZGUyWydkZWZhdWx0J10sIHsgZGF0YTogdmFsdWUsIHByZXZpb3VzRGF0YTogcHJldlZhbHVlLCB0aGVtZTogdGhlbWUsIGluaXRpYWxFeHBhbmRlZDogaW5pdGlhbEV4cGFuZGVkLCBrZXlOYW1lOiBrZXksIGtleToga2V5IH0pO1xuICB9IGVsc2UgaWYgKG5vZGVUeXBlID09PSAnU3RyaW5nJykge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTlN0cmluZ05vZGUyWydkZWZhdWx0J10sIHsga2V5TmFtZToga2V5LCBwcmV2aW91c1ZhbHVlOiBwcmV2VmFsdWUsIHRoZW1lOiB0aGVtZSwgdmFsdWU6IHZhbHVlLCBrZXk6IGtleSB9KTtcbiAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gJ051bWJlcicpIHtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05OdW1iZXJOb2RlMlsnZGVmYXVsdCddLCB7IGtleU5hbWU6IGtleSwgcHJldmlvdXNWYWx1ZTogcHJldlZhbHVlLCB0aGVtZTogdGhlbWUsIHZhbHVlOiB2YWx1ZSwga2V5OiBrZXkgfSk7XG4gIH0gZWxzZSBpZiAobm9kZVR5cGUgPT09ICdCb29sZWFuJykge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTkJvb2xlYW5Ob2RlMlsnZGVmYXVsdCddLCB7IGtleU5hbWU6IGtleSwgcHJldmlvdXNWYWx1ZTogcHJldlZhbHVlLCB0aGVtZTogdGhlbWUsIHZhbHVlOiB2YWx1ZSwga2V5OiBrZXkgfSk7XG4gIH0gZWxzZSBpZiAobm9kZVR5cGUgPT09ICdEYXRlJykge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTkRhdGVOb2RlMlsnZGVmYXVsdCddLCB7IGtleU5hbWU6IGtleSwgcHJldmlvdXNWYWx1ZTogcHJldlZhbHVlLCB0aGVtZTogdGhlbWUsIHZhbHVlOiB2YWx1ZSwga2V5OiBrZXkgfSk7XG4gIH0gZWxzZSBpZiAobm9kZVR5cGUgPT09ICdOdWxsJykge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTk51bGxOb2RlMlsnZGVmYXVsdCddLCB7IGtleU5hbWU6IGtleSwgcHJldmlvdXNWYWx1ZTogcHJldlZhbHVlLCB0aGVtZTogdGhlbWUsIHZhbHVlOiB2YWx1ZSwga2V5OiBrZXkgfSk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiLy8gRVM2ICsgaW5saW5lIHN0eWxlIHBvcnQgb2YgSlNPTlZpZXdlciBodHRwczovL2JpdGJ1Y2tldC5vcmcvZGF2ZXZlZGRlci9yZWFjdC1qc29uLXZpZXdlci9cbi8vIGFsbCBjcmVkaXRzIGFuZCBvcmlnaW5hbCBjb2RlIHRvIHRoZSBhdXRob3Jcbi8vIERhdmUgVmVkZGVyIDx2ZWRkZXJtYXRpY0BnbWFpbC5jb20+IGh0dHA6Ly93d3cuZXNraW1vc3B5LmNvbS9cbi8vIHBvcnQgYnkgRGFuaWVsZSBaYW5ub3R0aSBodHRwOi8vd3d3LmdpdGh1Yi5jb20vZHphbm5vdHRpIDxkemFubm90dGlAbWUuY29tPlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfaW5oZXJpdHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NyZWF0ZS1jbGFzcycpWydkZWZhdWx0J107XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3MtY2FsbC1jaGVjaycpWydkZWZhdWx0J107XG5cbnZhciBfZXh0ZW5kcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9leHRlbmRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfZ3JhYk5vZGUgPSByZXF1aXJlKCcuL2dyYWItbm9kZScpO1xuXG52YXIgX2dyYWJOb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2dyYWJOb2RlKTtcblxudmFyIF90aGVtZXNTb2xhcml6ZWQgPSByZXF1aXJlKCcuL3RoZW1lcy9zb2xhcml6ZWQnKTtcblxudmFyIF90aGVtZXNTb2xhcml6ZWQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdGhlbWVzU29sYXJpemVkKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgdHJlZToge1xuICAgIGJvcmRlcjogMCxcbiAgICBwYWRkaW5nOiAwLFxuICAgIG1hcmdpblRvcDogOCxcbiAgICBtYXJnaW5Cb3R0b206IDgsXG4gICAgbWFyZ2luTGVmdDogMixcbiAgICBtYXJnaW5SaWdodDogMCxcbiAgICBmb250U2l6ZTogJzAuOTBlbScsXG4gICAgbGlzdFN0eWxlOiAnbm9uZScsXG4gICAgTW96VXNlclNlbGVjdDogJ25vbmUnLFxuICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJ1xuICB9XG59O1xuXG52YXIgSlNPTlRyZWUgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKEpTT05UcmVlLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBfY3JlYXRlQ2xhc3MoSlNPTlRyZWUsIG51bGwsIFt7XG4gICAga2V5OiAncHJvcFR5cGVzJyxcbiAgICB2YWx1ZToge1xuICAgICAgZGF0YTogX3JlYWN0MlsnZGVmYXVsdCddLlByb3BUeXBlcy5vbmVPZlR5cGUoW19yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMuYXJyYXksIF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMub2JqZWN0XSkuaXNSZXF1aXJlZFxuICAgIH0sXG4gICAgZW51bWVyYWJsZTogdHJ1ZVxuICB9LCB7XG4gICAga2V5OiAnZGVmYXVsdFByb3BzJyxcbiAgICB2YWx1ZToge1xuICAgICAgdGhlbWU6IF90aGVtZXNTb2xhcml6ZWQyWydkZWZhdWx0J11cbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfV0pO1xuXG4gIGZ1bmN0aW9uIEpTT05UcmVlKHByb3BzKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEpTT05UcmVlKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuY2FsbCh0aGlzLCBwcm9wcyk7XG4gIH1cblxuICBKU09OVHJlZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBrZXlOYW1lID0gdGhpcy5wcm9wcy5rZXlOYW1lIHx8ICdyb290JztcbiAgICB2YXIgcm9vdE5vZGUgPSBfZ3JhYk5vZGUyWydkZWZhdWx0J10oa2V5TmFtZSwgdGhpcy5wcm9wcy5kYXRhLCB0aGlzLnByb3BzLnByZXZpb3VzRGF0YSwgdGhpcy5wcm9wcy50aGVtZSwgdHJ1ZSk7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ3VsJyxcbiAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMudHJlZSwgdGhpcy5wcm9wcy5zdHlsZSkgfSxcbiAgICAgIHJvb3ROb2RlXG4gICAgKTtcbiAgfTtcblxuICByZXR1cm4gSlNPTlRyZWU7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gSlNPTlRyZWU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0ge1xuICBoYW5kbGVDbGljazogZnVuY3Rpb24gaGFuZGxlQ2xpY2soZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBleHBhbmRlZDogIXRoaXMuc3RhdGUuZXhwYW5kZWRcbiAgICB9KTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKCkge1xuICAgIC8vIHJlc2V0cyBvdXIgY2FjaGVzIGFuZCBmbGFncyB3ZSBuZWVkIHRvIGJ1aWxkIGNoaWxkIG5vZGVzIGFnYWluXG4gICAgdGhpcy5yZW5kZXJlZENoaWxkcmVuID0gW107XG4gICAgdGhpcy5pdGVtU3RyaW5nID0gZmFsc2U7XG4gICAgdGhpcy5uZWVkc0NoaWxkTm9kZXMgPSB0cnVlO1xuICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzW1wiZGVmYXVsdFwiXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW50ZXJvcFJlcXVpcmUgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlJylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9zcXVhc2hDbGlja0V2ZW50ID0gcmVxdWlyZSgnLi9zcXVhc2gtY2xpY2stZXZlbnQnKTtcblxuZXhwb3J0cy5TcXVhc2hDbGlja0V2ZW50TWl4aW4gPSBfaW50ZXJvcFJlcXVpcmUoX3NxdWFzaENsaWNrRXZlbnQpO1xuXG52YXIgX2V4cGFuZGVkU3RhdGVIYW5kbGVyID0gcmVxdWlyZSgnLi9leHBhbmRlZC1zdGF0ZS1oYW5kbGVyJyk7XG5cbmV4cG9ydHMuRXhwYW5kZWRTdGF0ZUhhbmRsZXJNaXhpbiA9IF9pbnRlcm9wUmVxdWlyZShfZXhwYW5kZWRTdGF0ZUhhbmRsZXIpOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSB7XG4gIGhhbmRsZUNsaWNrOiBmdW5jdGlvbiBoYW5kbGVDbGljayhlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1tcImRlZmF1bHRcIl07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX1N5bWJvbCRpdGVyYXRvciA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9zeW1ib2wvaXRlcmF0b3InKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmIChvYmogIT09IG51bGwgJiYgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkob2JqKSAmJiB0eXBlb2Ygb2JqW19TeW1ib2wkaXRlcmF0b3JdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuICdJdGVyYWJsZSc7XG4gIH1cbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopLnNsaWNlKDgsIC0xKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZ1bmN0aW9uIChoZXgpIHtcbiAgdmFyIHJlc3VsdCA9IC9eIz8oW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkkL2kuZXhlYyhoZXgpO1xuICByZXR1cm4gcmVzdWx0ID8ge1xuICAgIHI6IHBhcnNlSW50KHJlc3VsdFsxXSwgMTYpLFxuICAgIGc6IHBhcnNlSW50KHJlc3VsdFsyXSwgMTYpLFxuICAgIGI6IHBhcnNlSW50KHJlc3VsdFszXSwgMTYpXG4gIH0gOiBudWxsO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzW1wiZGVmYXVsdFwiXTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vZ2V0LWl0ZXJhdG9yXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL251bWJlci9pcy1zYWZlLWludGVnZXJcIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2Fzc2lnblwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvY3JlYXRlXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9kZWZpbmUtcHJvcGVydHlcIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2tleXNcIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L3NldC1wcm90b3R5cGUtb2ZcIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vc3ltYm9sL2l0ZXJhdG9yXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3Rvcikge1xuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG4gIH1cbn07XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfT2JqZWN0JGRlZmluZVByb3BlcnR5ID0gcmVxdWlyZShcImJhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3QvZGVmaW5lLXByb3BlcnR5XCIpW1wiZGVmYXVsdFwiXTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldO1xuICAgICAgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlO1xuICAgICAgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlO1xuICAgICAgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTtcblxuICAgICAgX09iamVjdCRkZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7XG4gICAgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gICAgcmV0dXJuIENvbnN0cnVjdG9yO1xuICB9O1xufSkoKTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9PYmplY3QkYXNzaWduID0gcmVxdWlyZShcImJhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3QvYXNzaWduXCIpW1wiZGVmYXVsdFwiXTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBfT2JqZWN0JGFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7XG4gICAgICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn07XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfT2JqZWN0JGNyZWF0ZSA9IHJlcXVpcmUoXCJiYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2NyZWF0ZVwiKVtcImRlZmF1bHRcIl07XG5cbnZhciBfT2JqZWN0JHNldFByb3RvdHlwZU9mID0gcmVxdWlyZShcImJhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZlwiKVtcImRlZmF1bHRcIl07XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7XG4gIGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTtcbiAgfVxuXG4gIHN1YkNsYXNzLnByb3RvdHlwZSA9IF9PYmplY3QkY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgdmFsdWU6IHN1YkNsYXNzLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG4gIGlmIChzdXBlckNsYXNzKSBfT2JqZWN0JHNldFByb3RvdHlwZU9mID8gX09iamVjdCRzZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzO1xufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7XG4gICAgXCJkZWZhdWx0XCI6IG9ialxuICB9O1xufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmpbXCJkZWZhdWx0XCJdIDogb2JqO1xufTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJyZXF1aXJlKCcuLi9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUnKTtcbnJlcXVpcmUoJy4uL21vZHVsZXMvZXM2LnN0cmluZy5pdGVyYXRvcicpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi9tb2R1bGVzL2NvcmUuZ2V0LWl0ZXJhdG9yJyk7IiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYubnVtYmVyLmlzLXNhZmUtaW50ZWdlcicpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzLyQuY29yZScpLk51bWJlci5pc1NhZmVJbnRlZ2VyOyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2Lm9iamVjdC5hc3NpZ24nKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kLmNvcmUnKS5PYmplY3QuYXNzaWduOyIsInZhciAkID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZShQLCBEKXtcbiAgcmV0dXJuICQuY3JlYXRlKFAsIEQpO1xufTsiLCJ2YXIgJCA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0eShpdCwga2V5LCBkZXNjKXtcbiAgcmV0dXJuICQuc2V0RGVzYyhpdCwga2V5LCBkZXNjKTtcbn07IiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYub2JqZWN0LmtleXMnKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kLmNvcmUnKS5PYmplY3Qua2V5czsiLCJyZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5vYmplY3Quc2V0LXByb3RvdHlwZS1vZicpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzLyQuY29yZScpLk9iamVjdC5zZXRQcm90b3R5cGVPZjsiLCJyZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5zdHJpbmcuaXRlcmF0b3InKTtcbnJlcXVpcmUoJy4uLy4uL21vZHVsZXMvd2ViLmRvbS5pdGVyYWJsZScpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzLyQud2tzJykoJ2l0ZXJhdG9yJyk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIGlmKHR5cGVvZiBpdCAhPSAnZnVuY3Rpb24nKXRocm93IFR5cGVFcnJvcihpdCArICcgaXMgbm90IGEgZnVuY3Rpb24hJyk7XG4gIHJldHVybiBpdDtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpeyAvKiBlbXB0eSAqLyB9OyIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vJC5pcy1vYmplY3QnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICBpZighaXNPYmplY3QoaXQpKXRocm93IFR5cGVFcnJvcihpdCArICcgaXMgbm90IGFuIG9iamVjdCEnKTtcbiAgcmV0dXJuIGl0O1xufTsiLCIvLyBnZXR0aW5nIHRhZyBmcm9tIDE5LjEuMy42IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcoKVxudmFyIGNvZiA9IHJlcXVpcmUoJy4vJC5jb2YnKVxuICAsIFRBRyA9IHJlcXVpcmUoJy4vJC53a3MnKSgndG9TdHJpbmdUYWcnKVxuICAvLyBFUzMgd3JvbmcgaGVyZVxuICAsIEFSRyA9IGNvZihmdW5jdGlvbigpeyByZXR1cm4gYXJndW1lbnRzOyB9KCkpID09ICdBcmd1bWVudHMnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgdmFyIE8sIFQsIEI7XG4gIHJldHVybiBpdCA9PT0gdW5kZWZpbmVkID8gJ1VuZGVmaW5lZCcgOiBpdCA9PT0gbnVsbCA/ICdOdWxsJ1xuICAgIC8vIEBAdG9TdHJpbmdUYWcgY2FzZVxuICAgIDogdHlwZW9mIChUID0gKE8gPSBPYmplY3QoaXQpKVtUQUddKSA9PSAnc3RyaW5nJyA/IFRcbiAgICAvLyBidWlsdGluVGFnIGNhc2VcbiAgICA6IEFSRyA/IGNvZihPKVxuICAgIC8vIEVTMyBhcmd1bWVudHMgZmFsbGJhY2tcbiAgICA6IChCID0gY29mKE8pKSA9PSAnT2JqZWN0JyAmJiB0eXBlb2YgTy5jYWxsZWUgPT0gJ2Z1bmN0aW9uJyA/ICdBcmd1bWVudHMnIDogQjtcbn07IiwidmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChpdCkuc2xpY2UoOCwgLTEpO1xufTsiLCJ2YXIgY29yZSA9IG1vZHVsZS5leHBvcnRzID0ge3ZlcnNpb246ICcxLjIuNid9O1xuaWYodHlwZW9mIF9fZSA9PSAnbnVtYmVyJylfX2UgPSBjb3JlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmIiwiLy8gb3B0aW9uYWwgLyBzaW1wbGUgY29udGV4dCBiaW5kaW5nXG52YXIgYUZ1bmN0aW9uID0gcmVxdWlyZSgnLi8kLmEtZnVuY3Rpb24nKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZm4sIHRoYXQsIGxlbmd0aCl7XG4gIGFGdW5jdGlvbihmbik7XG4gIGlmKHRoYXQgPT09IHVuZGVmaW5lZClyZXR1cm4gZm47XG4gIHN3aXRjaChsZW5ndGgpe1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKGEpe1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSk7XG4gICAgfTtcbiAgICBjYXNlIDI6IHJldHVybiBmdW5jdGlvbihhLCBiKXtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoYXQsIGEsIGIpO1xuICAgIH07XG4gICAgY2FzZSAzOiByZXR1cm4gZnVuY3Rpb24oYSwgYiwgYyl7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhLCBiLCBjKTtcbiAgICB9O1xuICB9XG4gIHJldHVybiBmdW5jdGlvbigvKiAuLi5hcmdzICovKXtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcbiAgfTtcbn07IiwiLy8gNy4yLjEgUmVxdWlyZU9iamVjdENvZXJjaWJsZShhcmd1bWVudClcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICBpZihpdCA9PSB1bmRlZmluZWQpdGhyb3cgVHlwZUVycm9yKFwiQ2FuJ3QgY2FsbCBtZXRob2Qgb24gIFwiICsgaXQpO1xuICByZXR1cm4gaXQ7XG59OyIsIi8vIFRoYW5rJ3MgSUU4IGZvciBoaXMgZnVubnkgZGVmaW5lUHJvcGVydHlcbm1vZHVsZS5leHBvcnRzID0gIXJlcXVpcmUoJy4vJC5mYWlscycpKGZ1bmN0aW9uKCl7XG4gIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoe30sICdhJywge2dldDogZnVuY3Rpb24oKXsgcmV0dXJuIDc7IH19KS5hICE9IDc7XG59KTsiLCJ2YXIgZ2xvYmFsICAgID0gcmVxdWlyZSgnLi8kLmdsb2JhbCcpXG4gICwgY29yZSAgICAgID0gcmVxdWlyZSgnLi8kLmNvcmUnKVxuICAsIGN0eCAgICAgICA9IHJlcXVpcmUoJy4vJC5jdHgnKVxuICAsIFBST1RPVFlQRSA9ICdwcm90b3R5cGUnO1xuXG52YXIgJGV4cG9ydCA9IGZ1bmN0aW9uKHR5cGUsIG5hbWUsIHNvdXJjZSl7XG4gIHZhciBJU19GT1JDRUQgPSB0eXBlICYgJGV4cG9ydC5GXG4gICAgLCBJU19HTE9CQUwgPSB0eXBlICYgJGV4cG9ydC5HXG4gICAgLCBJU19TVEFUSUMgPSB0eXBlICYgJGV4cG9ydC5TXG4gICAgLCBJU19QUk9UTyAgPSB0eXBlICYgJGV4cG9ydC5QXG4gICAgLCBJU19CSU5EICAgPSB0eXBlICYgJGV4cG9ydC5CXG4gICAgLCBJU19XUkFQICAgPSB0eXBlICYgJGV4cG9ydC5XXG4gICAgLCBleHBvcnRzICAgPSBJU19HTE9CQUwgPyBjb3JlIDogY29yZVtuYW1lXSB8fCAoY29yZVtuYW1lXSA9IHt9KVxuICAgICwgdGFyZ2V0ICAgID0gSVNfR0xPQkFMID8gZ2xvYmFsIDogSVNfU1RBVElDID8gZ2xvYmFsW25hbWVdIDogKGdsb2JhbFtuYW1lXSB8fCB7fSlbUFJPVE9UWVBFXVxuICAgICwga2V5LCBvd24sIG91dDtcbiAgaWYoSVNfR0xPQkFMKXNvdXJjZSA9IG5hbWU7XG4gIGZvcihrZXkgaW4gc291cmNlKXtcbiAgICAvLyBjb250YWlucyBpbiBuYXRpdmVcbiAgICBvd24gPSAhSVNfRk9SQ0VEICYmIHRhcmdldCAmJiBrZXkgaW4gdGFyZ2V0O1xuICAgIGlmKG93biAmJiBrZXkgaW4gZXhwb3J0cyljb250aW51ZTtcbiAgICAvLyBleHBvcnQgbmF0aXZlIG9yIHBhc3NlZFxuICAgIG91dCA9IG93biA/IHRhcmdldFtrZXldIDogc291cmNlW2tleV07XG4gICAgLy8gcHJldmVudCBnbG9iYWwgcG9sbHV0aW9uIGZvciBuYW1lc3BhY2VzXG4gICAgZXhwb3J0c1trZXldID0gSVNfR0xPQkFMICYmIHR5cGVvZiB0YXJnZXRba2V5XSAhPSAnZnVuY3Rpb24nID8gc291cmNlW2tleV1cbiAgICAvLyBiaW5kIHRpbWVycyB0byBnbG9iYWwgZm9yIGNhbGwgZnJvbSBleHBvcnQgY29udGV4dFxuICAgIDogSVNfQklORCAmJiBvd24gPyBjdHgob3V0LCBnbG9iYWwpXG4gICAgLy8gd3JhcCBnbG9iYWwgY29uc3RydWN0b3JzIGZvciBwcmV2ZW50IGNoYW5nZSB0aGVtIGluIGxpYnJhcnlcbiAgICA6IElTX1dSQVAgJiYgdGFyZ2V0W2tleV0gPT0gb3V0ID8gKGZ1bmN0aW9uKEMpe1xuICAgICAgdmFyIEYgPSBmdW5jdGlvbihwYXJhbSl7XG4gICAgICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgQyA/IG5ldyBDKHBhcmFtKSA6IEMocGFyYW0pO1xuICAgICAgfTtcbiAgICAgIEZbUFJPVE9UWVBFXSA9IENbUFJPVE9UWVBFXTtcbiAgICAgIHJldHVybiBGO1xuICAgIC8vIG1ha2Ugc3RhdGljIHZlcnNpb25zIGZvciBwcm90b3R5cGUgbWV0aG9kc1xuICAgIH0pKG91dCkgOiBJU19QUk9UTyAmJiB0eXBlb2Ygb3V0ID09ICdmdW5jdGlvbicgPyBjdHgoRnVuY3Rpb24uY2FsbCwgb3V0KSA6IG91dDtcbiAgICBpZihJU19QUk9UTykoZXhwb3J0c1tQUk9UT1RZUEVdIHx8IChleHBvcnRzW1BST1RPVFlQRV0gPSB7fSkpW2tleV0gPSBvdXQ7XG4gIH1cbn07XG4vLyB0eXBlIGJpdG1hcFxuJGV4cG9ydC5GID0gMTsgIC8vIGZvcmNlZFxuJGV4cG9ydC5HID0gMjsgIC8vIGdsb2JhbFxuJGV4cG9ydC5TID0gNDsgIC8vIHN0YXRpY1xuJGV4cG9ydC5QID0gODsgIC8vIHByb3RvXG4kZXhwb3J0LkIgPSAxNjsgLy8gYmluZFxuJGV4cG9ydC5XID0gMzI7IC8vIHdyYXBcbm1vZHVsZS5leHBvcnRzID0gJGV4cG9ydDsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGV4ZWMpe1xuICB0cnkge1xuICAgIHJldHVybiAhIWV4ZWMoKTtcbiAgfSBjYXRjaChlKXtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTsiLCIvLyBodHRwczovL2dpdGh1Yi5jb20vemxvaXJvY2svY29yZS1qcy9pc3N1ZXMvODYjaXNzdWVjb21tZW50LTExNTc1OTAyOFxudmFyIGdsb2JhbCA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuTWF0aCA9PSBNYXRoXG4gID8gd2luZG93IDogdHlwZW9mIHNlbGYgIT0gJ3VuZGVmaW5lZCcgJiYgc2VsZi5NYXRoID09IE1hdGggPyBzZWxmIDogRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbmlmKHR5cGVvZiBfX2cgPT0gJ251bWJlcicpX19nID0gZ2xvYmFsOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmIiwidmFyIGhhc093blByb3BlcnR5ID0ge30uaGFzT3duUHJvcGVydHk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0LCBrZXkpe1xuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChpdCwga2V5KTtcbn07IiwidmFyICQgICAgICAgICAgPSByZXF1aXJlKCcuLyQnKVxuICAsIGNyZWF0ZURlc2MgPSByZXF1aXJlKCcuLyQucHJvcGVydHktZGVzYycpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLyQuZGVzY3JpcHRvcnMnKSA/IGZ1bmN0aW9uKG9iamVjdCwga2V5LCB2YWx1ZSl7XG4gIHJldHVybiAkLnNldERlc2Mob2JqZWN0LCBrZXksIGNyZWF0ZURlc2MoMSwgdmFsdWUpKTtcbn0gOiBmdW5jdGlvbihvYmplY3QsIGtleSwgdmFsdWUpe1xuICBvYmplY3Rba2V5XSA9IHZhbHVlO1xuICByZXR1cm4gb2JqZWN0O1xufTsiLCIvLyBmYWxsYmFjayBmb3Igbm9uLWFycmF5LWxpa2UgRVMzIGFuZCBub24tZW51bWVyYWJsZSBvbGQgVjggc3RyaW5nc1xudmFyIGNvZiA9IHJlcXVpcmUoJy4vJC5jb2YnKTtcbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0KCd6JykucHJvcGVydHlJc0VudW1lcmFibGUoMCkgPyBPYmplY3QgOiBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBjb2YoaXQpID09ICdTdHJpbmcnID8gaXQuc3BsaXQoJycpIDogT2JqZWN0KGl0KTtcbn07IiwiLy8gMjAuMS4yLjMgTnVtYmVyLmlzSW50ZWdlcihudW1iZXIpXG52YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuLyQuaXMtb2JqZWN0JylcbiAgLCBmbG9vciAgICA9IE1hdGguZmxvb3I7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzSW50ZWdlcihpdCl7XG4gIHJldHVybiAhaXNPYmplY3QoaXQpICYmIGlzRmluaXRlKGl0KSAmJiBmbG9vcihpdCkgPT09IGl0O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIHR5cGVvZiBpdCA9PT0gJ29iamVjdCcgPyBpdCAhPT0gbnVsbCA6IHR5cGVvZiBpdCA9PT0gJ2Z1bmN0aW9uJztcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyICQgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi8kJylcbiAgLCBkZXNjcmlwdG9yICAgICA9IHJlcXVpcmUoJy4vJC5wcm9wZXJ0eS1kZXNjJylcbiAgLCBzZXRUb1N0cmluZ1RhZyA9IHJlcXVpcmUoJy4vJC5zZXQtdG8tc3RyaW5nLXRhZycpXG4gICwgSXRlcmF0b3JQcm90b3R5cGUgPSB7fTtcblxuLy8gMjUuMS4yLjEuMSAlSXRlcmF0b3JQcm90b3R5cGUlW0BAaXRlcmF0b3JdKClcbnJlcXVpcmUoJy4vJC5oaWRlJykoSXRlcmF0b3JQcm90b3R5cGUsIHJlcXVpcmUoJy4vJC53a3MnKSgnaXRlcmF0b3InKSwgZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXM7IH0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKENvbnN0cnVjdG9yLCBOQU1FLCBuZXh0KXtcbiAgQ29uc3RydWN0b3IucHJvdG90eXBlID0gJC5jcmVhdGUoSXRlcmF0b3JQcm90b3R5cGUsIHtuZXh0OiBkZXNjcmlwdG9yKDEsIG5leHQpfSk7XG4gIHNldFRvU3RyaW5nVGFnKENvbnN0cnVjdG9yLCBOQU1FICsgJyBJdGVyYXRvcicpO1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgTElCUkFSWSAgICAgICAgPSByZXF1aXJlKCcuLyQubGlicmFyeScpXG4gICwgJGV4cG9ydCAgICAgICAgPSByZXF1aXJlKCcuLyQuZXhwb3J0JylcbiAgLCByZWRlZmluZSAgICAgICA9IHJlcXVpcmUoJy4vJC5yZWRlZmluZScpXG4gICwgaGlkZSAgICAgICAgICAgPSByZXF1aXJlKCcuLyQuaGlkZScpXG4gICwgaGFzICAgICAgICAgICAgPSByZXF1aXJlKCcuLyQuaGFzJylcbiAgLCBJdGVyYXRvcnMgICAgICA9IHJlcXVpcmUoJy4vJC5pdGVyYXRvcnMnKVxuICAsICRpdGVyQ3JlYXRlICAgID0gcmVxdWlyZSgnLi8kLml0ZXItY3JlYXRlJylcbiAgLCBzZXRUb1N0cmluZ1RhZyA9IHJlcXVpcmUoJy4vJC5zZXQtdG8tc3RyaW5nLXRhZycpXG4gICwgZ2V0UHJvdG8gICAgICAgPSByZXF1aXJlKCcuLyQnKS5nZXRQcm90b1xuICAsIElURVJBVE9SICAgICAgID0gcmVxdWlyZSgnLi8kLndrcycpKCdpdGVyYXRvcicpXG4gICwgQlVHR1kgICAgICAgICAgPSAhKFtdLmtleXMgJiYgJ25leHQnIGluIFtdLmtleXMoKSkgLy8gU2FmYXJpIGhhcyBidWdneSBpdGVyYXRvcnMgdy9vIGBuZXh0YFxuICAsIEZGX0lURVJBVE9SICAgID0gJ0BAaXRlcmF0b3InXG4gICwgS0VZUyAgICAgICAgICAgPSAna2V5cydcbiAgLCBWQUxVRVMgICAgICAgICA9ICd2YWx1ZXMnO1xuXG52YXIgcmV0dXJuVGhpcyA9IGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzOyB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKEJhc2UsIE5BTUUsIENvbnN0cnVjdG9yLCBuZXh0LCBERUZBVUxULCBJU19TRVQsIEZPUkNFRCl7XG4gICRpdGVyQ3JlYXRlKENvbnN0cnVjdG9yLCBOQU1FLCBuZXh0KTtcbiAgdmFyIGdldE1ldGhvZCA9IGZ1bmN0aW9uKGtpbmQpe1xuICAgIGlmKCFCVUdHWSAmJiBraW5kIGluIHByb3RvKXJldHVybiBwcm90b1traW5kXTtcbiAgICBzd2l0Y2goa2luZCl7XG4gICAgICBjYXNlIEtFWVM6IHJldHVybiBmdW5jdGlvbiBrZXlzKCl7IHJldHVybiBuZXcgQ29uc3RydWN0b3IodGhpcywga2luZCk7IH07XG4gICAgICBjYXNlIFZBTFVFUzogcmV0dXJuIGZ1bmN0aW9uIHZhbHVlcygpeyByZXR1cm4gbmV3IENvbnN0cnVjdG9yKHRoaXMsIGtpbmQpOyB9O1xuICAgIH0gcmV0dXJuIGZ1bmN0aW9uIGVudHJpZXMoKXsgcmV0dXJuIG5ldyBDb25zdHJ1Y3Rvcih0aGlzLCBraW5kKTsgfTtcbiAgfTtcbiAgdmFyIFRBRyAgICAgICAgPSBOQU1FICsgJyBJdGVyYXRvcidcbiAgICAsIERFRl9WQUxVRVMgPSBERUZBVUxUID09IFZBTFVFU1xuICAgICwgVkFMVUVTX0JVRyA9IGZhbHNlXG4gICAgLCBwcm90byAgICAgID0gQmFzZS5wcm90b3R5cGVcbiAgICAsICRuYXRpdmUgICAgPSBwcm90b1tJVEVSQVRPUl0gfHwgcHJvdG9bRkZfSVRFUkFUT1JdIHx8IERFRkFVTFQgJiYgcHJvdG9bREVGQVVMVF1cbiAgICAsICRkZWZhdWx0ICAgPSAkbmF0aXZlIHx8IGdldE1ldGhvZChERUZBVUxUKVxuICAgICwgbWV0aG9kcywga2V5O1xuICAvLyBGaXggbmF0aXZlXG4gIGlmKCRuYXRpdmUpe1xuICAgIHZhciBJdGVyYXRvclByb3RvdHlwZSA9IGdldFByb3RvKCRkZWZhdWx0LmNhbGwobmV3IEJhc2UpKTtcbiAgICAvLyBTZXQgQEB0b1N0cmluZ1RhZyB0byBuYXRpdmUgaXRlcmF0b3JzXG4gICAgc2V0VG9TdHJpbmdUYWcoSXRlcmF0b3JQcm90b3R5cGUsIFRBRywgdHJ1ZSk7XG4gICAgLy8gRkYgZml4XG4gICAgaWYoIUxJQlJBUlkgJiYgaGFzKHByb3RvLCBGRl9JVEVSQVRPUikpaGlkZShJdGVyYXRvclByb3RvdHlwZSwgSVRFUkFUT1IsIHJldHVyblRoaXMpO1xuICAgIC8vIGZpeCBBcnJheSN7dmFsdWVzLCBAQGl0ZXJhdG9yfS5uYW1lIGluIFY4IC8gRkZcbiAgICBpZihERUZfVkFMVUVTICYmICRuYXRpdmUubmFtZSAhPT0gVkFMVUVTKXtcbiAgICAgIFZBTFVFU19CVUcgPSB0cnVlO1xuICAgICAgJGRlZmF1bHQgPSBmdW5jdGlvbiB2YWx1ZXMoKXsgcmV0dXJuICRuYXRpdmUuY2FsbCh0aGlzKTsgfTtcbiAgICB9XG4gIH1cbiAgLy8gRGVmaW5lIGl0ZXJhdG9yXG4gIGlmKCghTElCUkFSWSB8fCBGT1JDRUQpICYmIChCVUdHWSB8fCBWQUxVRVNfQlVHIHx8ICFwcm90b1tJVEVSQVRPUl0pKXtcbiAgICBoaWRlKHByb3RvLCBJVEVSQVRPUiwgJGRlZmF1bHQpO1xuICB9XG4gIC8vIFBsdWcgZm9yIGxpYnJhcnlcbiAgSXRlcmF0b3JzW05BTUVdID0gJGRlZmF1bHQ7XG4gIEl0ZXJhdG9yc1tUQUddICA9IHJldHVyblRoaXM7XG4gIGlmKERFRkFVTFQpe1xuICAgIG1ldGhvZHMgPSB7XG4gICAgICB2YWx1ZXM6ICBERUZfVkFMVUVTICA/ICRkZWZhdWx0IDogZ2V0TWV0aG9kKFZBTFVFUyksXG4gICAgICBrZXlzOiAgICBJU19TRVQgICAgICA/ICRkZWZhdWx0IDogZ2V0TWV0aG9kKEtFWVMpLFxuICAgICAgZW50cmllczogIURFRl9WQUxVRVMgPyAkZGVmYXVsdCA6IGdldE1ldGhvZCgnZW50cmllcycpXG4gICAgfTtcbiAgICBpZihGT1JDRUQpZm9yKGtleSBpbiBtZXRob2RzKXtcbiAgICAgIGlmKCEoa2V5IGluIHByb3RvKSlyZWRlZmluZShwcm90bywga2V5LCBtZXRob2RzW2tleV0pO1xuICAgIH0gZWxzZSAkZXhwb3J0KCRleHBvcnQuUCArICRleHBvcnQuRiAqIChCVUdHWSB8fCBWQUxVRVNfQlVHKSwgTkFNRSwgbWV0aG9kcyk7XG4gIH1cbiAgcmV0dXJuIG1ldGhvZHM7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZG9uZSwgdmFsdWUpe1xuICByZXR1cm4ge3ZhbHVlOiB2YWx1ZSwgZG9uZTogISFkb25lfTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSB7fTsiLCJ2YXIgJE9iamVjdCA9IE9iamVjdDtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6ICAgICAkT2JqZWN0LmNyZWF0ZSxcbiAgZ2V0UHJvdG86ICAgJE9iamVjdC5nZXRQcm90b3R5cGVPZixcbiAgaXNFbnVtOiAgICAge30ucHJvcGVydHlJc0VudW1lcmFibGUsXG4gIGdldERlc2M6ICAgICRPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICBzZXREZXNjOiAgICAkT2JqZWN0LmRlZmluZVByb3BlcnR5LFxuICBzZXREZXNjczogICAkT2JqZWN0LmRlZmluZVByb3BlcnRpZXMsXG4gIGdldEtleXM6ICAgICRPYmplY3Qua2V5cyxcbiAgZ2V0TmFtZXM6ICAgJE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzLFxuICBnZXRTeW1ib2xzOiAkT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyxcbiAgZWFjaDogICAgICAgW10uZm9yRWFjaFxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHRydWU7IiwiLy8gMTkuMS4yLjEgT2JqZWN0LmFzc2lnbih0YXJnZXQsIHNvdXJjZSwgLi4uKVxudmFyICQgICAgICAgID0gcmVxdWlyZSgnLi8kJylcbiAgLCB0b09iamVjdCA9IHJlcXVpcmUoJy4vJC50by1vYmplY3QnKVxuICAsIElPYmplY3QgID0gcmVxdWlyZSgnLi8kLmlvYmplY3QnKTtcblxuLy8gc2hvdWxkIHdvcmsgd2l0aCBzeW1ib2xzIGFuZCBzaG91bGQgaGF2ZSBkZXRlcm1pbmlzdGljIHByb3BlcnR5IG9yZGVyIChWOCBidWcpXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vJC5mYWlscycpKGZ1bmN0aW9uKCl7XG4gIHZhciBhID0gT2JqZWN0LmFzc2lnblxuICAgICwgQSA9IHt9XG4gICAgLCBCID0ge31cbiAgICAsIFMgPSBTeW1ib2woKVxuICAgICwgSyA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdCc7XG4gIEFbU10gPSA3O1xuICBLLnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uKGspeyBCW2tdID0gazsgfSk7XG4gIHJldHVybiBhKHt9LCBBKVtTXSAhPSA3IHx8IE9iamVjdC5rZXlzKGEoe30sIEIpKS5qb2luKCcnKSAhPSBLO1xufSkgPyBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCBzb3VyY2UpeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIHZhciBUICAgICA9IHRvT2JqZWN0KHRhcmdldClcbiAgICAsICQkICAgID0gYXJndW1lbnRzXG4gICAgLCAkJGxlbiA9ICQkLmxlbmd0aFxuICAgICwgaW5kZXggPSAxXG4gICAgLCBnZXRLZXlzICAgID0gJC5nZXRLZXlzXG4gICAgLCBnZXRTeW1ib2xzID0gJC5nZXRTeW1ib2xzXG4gICAgLCBpc0VudW0gICAgID0gJC5pc0VudW07XG4gIHdoaWxlKCQkbGVuID4gaW5kZXgpe1xuICAgIHZhciBTICAgICAgPSBJT2JqZWN0KCQkW2luZGV4KytdKVxuICAgICAgLCBrZXlzICAgPSBnZXRTeW1ib2xzID8gZ2V0S2V5cyhTKS5jb25jYXQoZ2V0U3ltYm9scyhTKSkgOiBnZXRLZXlzKFMpXG4gICAgICAsIGxlbmd0aCA9IGtleXMubGVuZ3RoXG4gICAgICAsIGogICAgICA9IDBcbiAgICAgICwga2V5O1xuICAgIHdoaWxlKGxlbmd0aCA+IGopaWYoaXNFbnVtLmNhbGwoUywga2V5ID0ga2V5c1tqKytdKSlUW2tleV0gPSBTW2tleV07XG4gIH1cbiAgcmV0dXJuIFQ7XG59IDogT2JqZWN0LmFzc2lnbjsiLCIvLyBtb3N0IE9iamVjdCBtZXRob2RzIGJ5IEVTNiBzaG91bGQgYWNjZXB0IHByaW1pdGl2ZXNcbnZhciAkZXhwb3J0ID0gcmVxdWlyZSgnLi8kLmV4cG9ydCcpXG4gICwgY29yZSAgICA9IHJlcXVpcmUoJy4vJC5jb3JlJylcbiAgLCBmYWlscyAgID0gcmVxdWlyZSgnLi8kLmZhaWxzJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKEtFWSwgZXhlYyl7XG4gIHZhciBmbiAgPSAoY29yZS5PYmplY3QgfHwge30pW0tFWV0gfHwgT2JqZWN0W0tFWV1cbiAgICAsIGV4cCA9IHt9O1xuICBleHBbS0VZXSA9IGV4ZWMoZm4pO1xuICAkZXhwb3J0KCRleHBvcnQuUyArICRleHBvcnQuRiAqIGZhaWxzKGZ1bmN0aW9uKCl7IGZuKDEpOyB9KSwgJ09iamVjdCcsIGV4cCk7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYml0bWFwLCB2YWx1ZSl7XG4gIHJldHVybiB7XG4gICAgZW51bWVyYWJsZSAgOiAhKGJpdG1hcCAmIDEpLFxuICAgIGNvbmZpZ3VyYWJsZTogIShiaXRtYXAgJiAyKSxcbiAgICB3cml0YWJsZSAgICA6ICEoYml0bWFwICYgNCksXG4gICAgdmFsdWUgICAgICAgOiB2YWx1ZVxuICB9O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vJC5oaWRlJyk7IiwiLy8gV29ya3Mgd2l0aCBfX3Byb3RvX18gb25seS4gT2xkIHY4IGNhbid0IHdvcmsgd2l0aCBudWxsIHByb3RvIG9iamVjdHMuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xudmFyIGdldERlc2MgID0gcmVxdWlyZSgnLi8kJykuZ2V0RGVzY1xuICAsIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi8kLmlzLW9iamVjdCcpXG4gICwgYW5PYmplY3QgPSByZXF1aXJlKCcuLyQuYW4tb2JqZWN0Jyk7XG52YXIgY2hlY2sgPSBmdW5jdGlvbihPLCBwcm90byl7XG4gIGFuT2JqZWN0KE8pO1xuICBpZighaXNPYmplY3QocHJvdG8pICYmIHByb3RvICE9PSBudWxsKXRocm93IFR5cGVFcnJvcihwcm90byArIFwiOiBjYW4ndCBzZXQgYXMgcHJvdG90eXBlIVwiKTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2V0OiBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHwgKCdfX3Byb3RvX18nIGluIHt9ID8gLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgIGZ1bmN0aW9uKHRlc3QsIGJ1Z2d5LCBzZXQpe1xuICAgICAgdHJ5IHtcbiAgICAgICAgc2V0ID0gcmVxdWlyZSgnLi8kLmN0eCcpKEZ1bmN0aW9uLmNhbGwsIGdldERlc2MoT2JqZWN0LnByb3RvdHlwZSwgJ19fcHJvdG9fXycpLnNldCwgMik7XG4gICAgICAgIHNldCh0ZXN0LCBbXSk7XG4gICAgICAgIGJ1Z2d5ID0gISh0ZXN0IGluc3RhbmNlb2YgQXJyYXkpO1xuICAgICAgfSBjYXRjaChlKXsgYnVnZ3kgPSB0cnVlOyB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24gc2V0UHJvdG90eXBlT2YoTywgcHJvdG8pe1xuICAgICAgICBjaGVjayhPLCBwcm90byk7XG4gICAgICAgIGlmKGJ1Z2d5KU8uX19wcm90b19fID0gcHJvdG87XG4gICAgICAgIGVsc2Ugc2V0KE8sIHByb3RvKTtcbiAgICAgICAgcmV0dXJuIE87XG4gICAgICB9O1xuICAgIH0oe30sIGZhbHNlKSA6IHVuZGVmaW5lZCksXG4gIGNoZWNrOiBjaGVja1xufTsiLCJ2YXIgZGVmID0gcmVxdWlyZSgnLi8kJykuc2V0RGVzY1xuICAsIGhhcyA9IHJlcXVpcmUoJy4vJC5oYXMnKVxuICAsIFRBRyA9IHJlcXVpcmUoJy4vJC53a3MnKSgndG9TdHJpbmdUYWcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCwgdGFnLCBzdGF0KXtcbiAgaWYoaXQgJiYgIWhhcyhpdCA9IHN0YXQgPyBpdCA6IGl0LnByb3RvdHlwZSwgVEFHKSlkZWYoaXQsIFRBRywge2NvbmZpZ3VyYWJsZTogdHJ1ZSwgdmFsdWU6IHRhZ30pO1xufTsiLCJ2YXIgZ2xvYmFsID0gcmVxdWlyZSgnLi8kLmdsb2JhbCcpXG4gICwgU0hBUkVEID0gJ19fY29yZS1qc19zaGFyZWRfXydcbiAgLCBzdG9yZSAgPSBnbG9iYWxbU0hBUkVEXSB8fCAoZ2xvYmFsW1NIQVJFRF0gPSB7fSk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGtleSl7XG4gIHJldHVybiBzdG9yZVtrZXldIHx8IChzdG9yZVtrZXldID0ge30pO1xufTsiLCJ2YXIgdG9JbnRlZ2VyID0gcmVxdWlyZSgnLi8kLnRvLWludGVnZXInKVxuICAsIGRlZmluZWQgICA9IHJlcXVpcmUoJy4vJC5kZWZpbmVkJyk7XG4vLyB0cnVlICAtPiBTdHJpbmcjYXRcbi8vIGZhbHNlIC0+IFN0cmluZyNjb2RlUG9pbnRBdFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihUT19TVFJJTkcpe1xuICByZXR1cm4gZnVuY3Rpb24odGhhdCwgcG9zKXtcbiAgICB2YXIgcyA9IFN0cmluZyhkZWZpbmVkKHRoYXQpKVxuICAgICAgLCBpID0gdG9JbnRlZ2VyKHBvcylcbiAgICAgICwgbCA9IHMubGVuZ3RoXG4gICAgICAsIGEsIGI7XG4gICAgaWYoaSA8IDAgfHwgaSA+PSBsKXJldHVybiBUT19TVFJJTkcgPyAnJyA6IHVuZGVmaW5lZDtcbiAgICBhID0gcy5jaGFyQ29kZUF0KGkpO1xuICAgIHJldHVybiBhIDwgMHhkODAwIHx8IGEgPiAweGRiZmYgfHwgaSArIDEgPT09IGwgfHwgKGIgPSBzLmNoYXJDb2RlQXQoaSArIDEpKSA8IDB4ZGMwMCB8fCBiID4gMHhkZmZmXG4gICAgICA/IFRPX1NUUklORyA/IHMuY2hhckF0KGkpIDogYVxuICAgICAgOiBUT19TVFJJTkcgPyBzLnNsaWNlKGksIGkgKyAyKSA6IChhIC0gMHhkODAwIDw8IDEwKSArIChiIC0gMHhkYzAwKSArIDB4MTAwMDA7XG4gIH07XG59OyIsIi8vIDcuMS40IFRvSW50ZWdlclxudmFyIGNlaWwgID0gTWF0aC5jZWlsXG4gICwgZmxvb3IgPSBNYXRoLmZsb29yO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBpc05hTihpdCA9ICtpdCkgPyAwIDogKGl0ID4gMCA/IGZsb29yIDogY2VpbCkoaXQpO1xufTsiLCIvLyB0byBpbmRleGVkIG9iamVjdCwgdG9PYmplY3Qgd2l0aCBmYWxsYmFjayBmb3Igbm9uLWFycmF5LWxpa2UgRVMzIHN0cmluZ3NcbnZhciBJT2JqZWN0ID0gcmVxdWlyZSgnLi8kLmlvYmplY3QnKVxuICAsIGRlZmluZWQgPSByZXF1aXJlKCcuLyQuZGVmaW5lZCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBJT2JqZWN0KGRlZmluZWQoaXQpKTtcbn07IiwiLy8gNy4xLjEzIFRvT2JqZWN0KGFyZ3VtZW50KVxudmFyIGRlZmluZWQgPSByZXF1aXJlKCcuLyQuZGVmaW5lZCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBPYmplY3QoZGVmaW5lZChpdCkpO1xufTsiLCJ2YXIgaWQgPSAwXG4gICwgcHggPSBNYXRoLnJhbmRvbSgpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihrZXkpe1xuICByZXR1cm4gJ1N5bWJvbCgnLmNvbmNhdChrZXkgPT09IHVuZGVmaW5lZCA/ICcnIDoga2V5LCAnKV8nLCAoKytpZCArIHB4KS50b1N0cmluZygzNikpO1xufTsiLCJ2YXIgc3RvcmUgID0gcmVxdWlyZSgnLi8kLnNoYXJlZCcpKCd3a3MnKVxuICAsIHVpZCAgICA9IHJlcXVpcmUoJy4vJC51aWQnKVxuICAsIFN5bWJvbCA9IHJlcXVpcmUoJy4vJC5nbG9iYWwnKS5TeW1ib2w7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUpe1xuICByZXR1cm4gc3RvcmVbbmFtZV0gfHwgKHN0b3JlW25hbWVdID1cbiAgICBTeW1ib2wgJiYgU3ltYm9sW25hbWVdIHx8IChTeW1ib2wgfHwgdWlkKSgnU3ltYm9sLicgKyBuYW1lKSk7XG59OyIsInZhciBjbGFzc29mICAgPSByZXF1aXJlKCcuLyQuY2xhc3NvZicpXG4gICwgSVRFUkFUT1IgID0gcmVxdWlyZSgnLi8kLndrcycpKCdpdGVyYXRvcicpXG4gICwgSXRlcmF0b3JzID0gcmVxdWlyZSgnLi8kLml0ZXJhdG9ycycpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLyQuY29yZScpLmdldEl0ZXJhdG9yTWV0aG9kID0gZnVuY3Rpb24oaXQpe1xuICBpZihpdCAhPSB1bmRlZmluZWQpcmV0dXJuIGl0W0lURVJBVE9SXVxuICAgIHx8IGl0WydAQGl0ZXJhdG9yJ11cbiAgICB8fCBJdGVyYXRvcnNbY2xhc3NvZihpdCldO1xufTsiLCJ2YXIgYW5PYmplY3QgPSByZXF1aXJlKCcuLyQuYW4tb2JqZWN0JylcbiAgLCBnZXQgICAgICA9IHJlcXVpcmUoJy4vY29yZS5nZXQtaXRlcmF0b3ItbWV0aG9kJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vJC5jb3JlJykuZ2V0SXRlcmF0b3IgPSBmdW5jdGlvbihpdCl7XG4gIHZhciBpdGVyRm4gPSBnZXQoaXQpO1xuICBpZih0eXBlb2YgaXRlckZuICE9ICdmdW5jdGlvbicpdGhyb3cgVHlwZUVycm9yKGl0ICsgJyBpcyBub3QgaXRlcmFibGUhJyk7XG4gIHJldHVybiBhbk9iamVjdChpdGVyRm4uY2FsbChpdCkpO1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgYWRkVG9VbnNjb3BhYmxlcyA9IHJlcXVpcmUoJy4vJC5hZGQtdG8tdW5zY29wYWJsZXMnKVxuICAsIHN0ZXAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLyQuaXRlci1zdGVwJylcbiAgLCBJdGVyYXRvcnMgICAgICAgID0gcmVxdWlyZSgnLi8kLml0ZXJhdG9ycycpXG4gICwgdG9JT2JqZWN0ICAgICAgICA9IHJlcXVpcmUoJy4vJC50by1pb2JqZWN0Jyk7XG5cbi8vIDIyLjEuMy40IEFycmF5LnByb3RvdHlwZS5lbnRyaWVzKClcbi8vIDIyLjEuMy4xMyBBcnJheS5wcm90b3R5cGUua2V5cygpXG4vLyAyMi4xLjMuMjkgQXJyYXkucHJvdG90eXBlLnZhbHVlcygpXG4vLyAyMi4xLjMuMzAgQXJyYXkucHJvdG90eXBlW0BAaXRlcmF0b3JdKClcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi8kLml0ZXItZGVmaW5lJykoQXJyYXksICdBcnJheScsIGZ1bmN0aW9uKGl0ZXJhdGVkLCBraW5kKXtcbiAgdGhpcy5fdCA9IHRvSU9iamVjdChpdGVyYXRlZCk7IC8vIHRhcmdldFxuICB0aGlzLl9pID0gMDsgICAgICAgICAgICAgICAgICAgLy8gbmV4dCBpbmRleFxuICB0aGlzLl9rID0ga2luZDsgICAgICAgICAgICAgICAgLy8ga2luZFxuLy8gMjIuMS41LjIuMSAlQXJyYXlJdGVyYXRvclByb3RvdHlwZSUubmV4dCgpXG59LCBmdW5jdGlvbigpe1xuICB2YXIgTyAgICAgPSB0aGlzLl90XG4gICAgLCBraW5kICA9IHRoaXMuX2tcbiAgICAsIGluZGV4ID0gdGhpcy5faSsrO1xuICBpZighTyB8fCBpbmRleCA+PSBPLmxlbmd0aCl7XG4gICAgdGhpcy5fdCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gc3RlcCgxKTtcbiAgfVxuICBpZihraW5kID09ICdrZXlzJyAgKXJldHVybiBzdGVwKDAsIGluZGV4KTtcbiAgaWYoa2luZCA9PSAndmFsdWVzJylyZXR1cm4gc3RlcCgwLCBPW2luZGV4XSk7XG4gIHJldHVybiBzdGVwKDAsIFtpbmRleCwgT1tpbmRleF1dKTtcbn0sICd2YWx1ZXMnKTtcblxuLy8gYXJndW1lbnRzTGlzdFtAQGl0ZXJhdG9yXSBpcyAlQXJyYXlQcm90b192YWx1ZXMlICg5LjQuNC42LCA5LjQuNC43KVxuSXRlcmF0b3JzLkFyZ3VtZW50cyA9IEl0ZXJhdG9ycy5BcnJheTtcblxuYWRkVG9VbnNjb3BhYmxlcygna2V5cycpO1xuYWRkVG9VbnNjb3BhYmxlcygndmFsdWVzJyk7XG5hZGRUb1Vuc2NvcGFibGVzKCdlbnRyaWVzJyk7IiwiLy8gMjAuMS4yLjUgTnVtYmVyLmlzU2FmZUludGVnZXIobnVtYmVyKVxudmFyICRleHBvcnQgICA9IHJlcXVpcmUoJy4vJC5leHBvcnQnKVxuICAsIGlzSW50ZWdlciA9IHJlcXVpcmUoJy4vJC5pcy1pbnRlZ2VyJylcbiAgLCBhYnMgICAgICAgPSBNYXRoLmFicztcblxuJGV4cG9ydCgkZXhwb3J0LlMsICdOdW1iZXInLCB7XG4gIGlzU2FmZUludGVnZXI6IGZ1bmN0aW9uIGlzU2FmZUludGVnZXIobnVtYmVyKXtcbiAgICByZXR1cm4gaXNJbnRlZ2VyKG51bWJlcikgJiYgYWJzKG51bWJlcikgPD0gMHgxZmZmZmZmZmZmZmZmZjtcbiAgfVxufSk7IiwiLy8gMTkuMS4zLjEgT2JqZWN0LmFzc2lnbih0YXJnZXQsIHNvdXJjZSlcbnZhciAkZXhwb3J0ID0gcmVxdWlyZSgnLi8kLmV4cG9ydCcpO1xuXG4kZXhwb3J0KCRleHBvcnQuUyArICRleHBvcnQuRiwgJ09iamVjdCcsIHthc3NpZ246IHJlcXVpcmUoJy4vJC5vYmplY3QtYXNzaWduJyl9KTsiLCIvLyAxOS4xLjIuMTQgT2JqZWN0LmtleXMoTylcbnZhciB0b09iamVjdCA9IHJlcXVpcmUoJy4vJC50by1vYmplY3QnKTtcblxucmVxdWlyZSgnLi8kLm9iamVjdC1zYXAnKSgna2V5cycsIGZ1bmN0aW9uKCRrZXlzKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIGtleXMoaXQpe1xuICAgIHJldHVybiAka2V5cyh0b09iamVjdChpdCkpO1xuICB9O1xufSk7IiwiLy8gMTkuMS4zLjE5IE9iamVjdC5zZXRQcm90b3R5cGVPZihPLCBwcm90bylcbnZhciAkZXhwb3J0ID0gcmVxdWlyZSgnLi8kLmV4cG9ydCcpO1xuJGV4cG9ydCgkZXhwb3J0LlMsICdPYmplY3QnLCB7c2V0UHJvdG90eXBlT2Y6IHJlcXVpcmUoJy4vJC5zZXQtcHJvdG8nKS5zZXR9KTsiLCIndXNlIHN0cmljdCc7XG52YXIgJGF0ICA9IHJlcXVpcmUoJy4vJC5zdHJpbmctYXQnKSh0cnVlKTtcblxuLy8gMjEuMS4zLjI3IFN0cmluZy5wcm90b3R5cGVbQEBpdGVyYXRvcl0oKVxucmVxdWlyZSgnLi8kLml0ZXItZGVmaW5lJykoU3RyaW5nLCAnU3RyaW5nJywgZnVuY3Rpb24oaXRlcmF0ZWQpe1xuICB0aGlzLl90ID0gU3RyaW5nKGl0ZXJhdGVkKTsgLy8gdGFyZ2V0XG4gIHRoaXMuX2kgPSAwOyAgICAgICAgICAgICAgICAvLyBuZXh0IGluZGV4XG4vLyAyMS4xLjUuMi4xICVTdHJpbmdJdGVyYXRvclByb3RvdHlwZSUubmV4dCgpXG59LCBmdW5jdGlvbigpe1xuICB2YXIgTyAgICAgPSB0aGlzLl90XG4gICAgLCBpbmRleCA9IHRoaXMuX2lcbiAgICAsIHBvaW50O1xuICBpZihpbmRleCA+PSBPLmxlbmd0aClyZXR1cm4ge3ZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWV9O1xuICBwb2ludCA9ICRhdChPLCBpbmRleCk7XG4gIHRoaXMuX2kgKz0gcG9pbnQubGVuZ3RoO1xuICByZXR1cm4ge3ZhbHVlOiBwb2ludCwgZG9uZTogZmFsc2V9O1xufSk7IiwicmVxdWlyZSgnLi9lczYuYXJyYXkuaXRlcmF0b3InKTtcbnZhciBJdGVyYXRvcnMgPSByZXF1aXJlKCcuLyQuaXRlcmF0b3JzJyk7XG5JdGVyYXRvcnMuTm9kZUxpc3QgPSBJdGVyYXRvcnMuSFRNTENvbGxlY3Rpb24gPSBJdGVyYXRvcnMuQXJyYXk7IiwidmFyIG1peGluID0gcmVxdWlyZSgnc21hcnQtbWl4aW4nKTtcbnZhciBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbnZhciBtaXhpblByb3RvID0gbWl4aW4oe1xuICAvLyBsaWZlY3ljbGUgc3R1ZmYgaXMgYXMgeW91J2QgZXhwZWN0XG4gIGNvbXBvbmVudERpZE1vdW50OiBtaXhpbi5NQU5ZLFxuICBjb21wb25lbnRXaWxsTW91bnQ6IG1peGluLk1BTlksXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IG1peGluLk1BTlksXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogbWl4aW4uT05DRSxcbiAgY29tcG9uZW50V2lsbFVwZGF0ZTogbWl4aW4uTUFOWSxcbiAgY29tcG9uZW50RGlkVXBkYXRlOiBtaXhpbi5NQU5ZLFxuICBjb21wb25lbnRXaWxsVW5tb3VudDogbWl4aW4uTUFOWSxcbiAgZ2V0Q2hpbGRDb250ZXh0OiBtaXhpbi5NQU5ZX01FUkdFRFxufSk7XG5cbmZ1bmN0aW9uIHNldERlZmF1bHRQcm9wcyhyZWFjdE1peGluKSB7XG4gIHZhciBnZXREZWZhdWx0UHJvcHMgPSByZWFjdE1peGluLmdldERlZmF1bHRQcm9wcztcblxuICBpZiAoZ2V0RGVmYXVsdFByb3BzKSB7XG4gICAgcmVhY3RNaXhpbi5kZWZhdWx0UHJvcHMgPSBnZXREZWZhdWx0UHJvcHMoKTtcblxuICAgIGRlbGV0ZSByZWFjdE1peGluLmdldERlZmF1bHRQcm9wcztcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRJbml0aWFsU3RhdGUocmVhY3RNaXhpbikge1xuICB2YXIgZ2V0SW5pdGlhbFN0YXRlID0gcmVhY3RNaXhpbi5nZXRJbml0aWFsU3RhdGU7XG4gIHZhciBjb21wb25lbnRXaWxsTW91bnQgPSByZWFjdE1peGluLmNvbXBvbmVudFdpbGxNb3VudDtcblxuICBmdW5jdGlvbiBhcHBseUluaXRpYWxTdGF0ZShpbnN0YW5jZSkge1xuICAgIHZhciBzdGF0ZSA9IGluc3RhbmNlLnN0YXRlIHx8IHt9O1xuICAgIGFzc2lnbihzdGF0ZSwgZ2V0SW5pdGlhbFN0YXRlLmNhbGwoaW5zdGFuY2UpKTtcbiAgICBpbnN0YW5jZS5zdGF0ZSA9IHN0YXRlO1xuICB9XG5cbiAgaWYgKGdldEluaXRpYWxTdGF0ZSkge1xuICAgIGlmICghY29tcG9uZW50V2lsbE1vdW50KSB7XG4gICAgICByZWFjdE1peGluLmNvbXBvbmVudFdpbGxNb3VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcHBseUluaXRpYWxTdGF0ZSh0aGlzKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlYWN0TWl4aW4uY29tcG9uZW50V2lsbE1vdW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGFwcGx5SW5pdGlhbFN0YXRlKHRoaXMpO1xuICAgICAgICBjb21wb25lbnRXaWxsTW91bnQuY2FsbCh0aGlzKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZGVsZXRlIHJlYWN0TWl4aW4uZ2V0SW5pdGlhbFN0YXRlO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1peGluQ2xhc3MocmVhY3RDbGFzcywgcmVhY3RNaXhpbikge1xuICBzZXREZWZhdWx0UHJvcHMocmVhY3RNaXhpbik7XG4gIHNldEluaXRpYWxTdGF0ZShyZWFjdE1peGluKTtcblxuICB2YXIgcHJvdG90eXBlTWV0aG9kcyA9IHt9O1xuICB2YXIgc3RhdGljUHJvcHMgPSB7fTtcblxuICBPYmplY3Qua2V5cyhyZWFjdE1peGluKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmIChrZXkgPT09ICdtaXhpbnMnKSB7XG4gICAgICByZXR1cm47IC8vIEhhbmRsZWQgYmVsb3cgdG8gZW5zdXJlIHByb3BlciBvcmRlciByZWdhcmRsZXNzIG9mIHByb3BlcnR5IGl0ZXJhdGlvbiBvcmRlclxuICAgIH1cbiAgICBpZiAoa2V5ID09PSAnc3RhdGljcycpIHtcbiAgICAgIHJldHVybjsgLy8gZ2V0cyBzcGVjaWFsIGhhbmRsaW5nXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcmVhY3RNaXhpbltrZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBwcm90b3R5cGVNZXRob2RzW2tleV0gPSByZWFjdE1peGluW2tleV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRpY1Byb3BzW2tleV0gPSByZWFjdE1peGluW2tleV07XG4gICAgfVxuICB9KTtcblxuICBtaXhpblByb3RvKHJlYWN0Q2xhc3MucHJvdG90eXBlLCBwcm90b3R5cGVNZXRob2RzKTtcblxuICB2YXIgbWVyZ2VQcm9wVHlwZXMgPSBmdW5jdGlvbihsZWZ0LCByaWdodCwga2V5KSB7XG4gICAgaWYgKCFsZWZ0KSByZXR1cm4gcmlnaHQ7XG4gICAgaWYgKCFyaWdodCkgcmV0dXJuIGxlZnQ7XG5cbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgT2JqZWN0LmtleXMobGVmdCkuZm9yRWFjaChmdW5jdGlvbihsZWZ0S2V5KSB7XG4gICAgICBpZiAoIXJpZ2h0W2xlZnRLZXldKSB7XG4gICAgICAgIHJlc3VsdFtsZWZ0S2V5XSA9IGxlZnRbbGVmdEtleV07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBPYmplY3Qua2V5cyhyaWdodCkuZm9yRWFjaChmdW5jdGlvbihyaWdodEtleSkge1xuICAgICAgaWYgKGxlZnRbcmlnaHRLZXldKSB7XG4gICAgICAgIHJlc3VsdFtyaWdodEtleV0gPSBmdW5jdGlvbiBjaGVja0JvdGhDb250ZXh0VHlwZXMoKSB7XG4gICAgICAgICAgcmV0dXJuIHJpZ2h0W3JpZ2h0S2V5XS5hcHBseSh0aGlzLCBhcmd1bWVudHMpICYmIGxlZnRbcmlnaHRLZXldLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbcmlnaHRLZXldID0gcmlnaHRbcmlnaHRLZXldO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICBtaXhpbih7XG4gICAgY2hpbGRDb250ZXh0VHlwZXM6IG1lcmdlUHJvcFR5cGVzLFxuICAgIGNvbnRleHRUeXBlczogbWVyZ2VQcm9wVHlwZXMsXG4gICAgcHJvcFR5cGVzOiBtaXhpbi5NQU5ZX01FUkdFRF9MT09TRSxcbiAgICBkZWZhdWx0UHJvcHM6IG1peGluLk1BTllfTUVSR0VEX0xPT1NFXG4gIH0pKHJlYWN0Q2xhc3MsIHN0YXRpY1Byb3BzKTtcblxuICAvLyBzdGF0aWNzIGlzIGEgc3BlY2lhbCBjYXNlIGJlY2F1c2UgaXQgbWVyZ2VzIGRpcmVjdGx5IG9udG8gdGhlIGNsYXNzXG4gIGlmIChyZWFjdE1peGluLnN0YXRpY3MpIHtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhyZWFjdE1peGluLnN0YXRpY3MpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgbGVmdCA9IHJlYWN0Q2xhc3Nba2V5XTtcbiAgICAgIHZhciByaWdodCA9IHJlYWN0TWl4aW4uc3RhdGljc1trZXldO1xuXG4gICAgICBpZiAobGVmdCAhPT0gdW5kZWZpbmVkICYmIHJpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IG1peGluIHN0YXRpY3MgYmVjYXVzZSBzdGF0aWNzLicgKyBrZXkgKyAnIGFuZCBDb21wb25lbnQuJyArIGtleSArICcgYXJlIGRlZmluZWQuJyk7XG4gICAgICB9XG5cbiAgICAgIHJlYWN0Q2xhc3Nba2V5XSA9IGxlZnQgIT09IHVuZGVmaW5lZCA/IGxlZnQgOiByaWdodDtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIElmIG1vcmUgbWl4aW5zIGFyZSBkZWZpbmVkLCB0aGV5IG5lZWQgdG8gcnVuLiBUaGlzIGVtdWxhdGUncyByZWFjdCdzIGJlaGF2aW9yLlxuICAvLyBTZWUgYmVoYXZpb3IgaW4gY29kZSBhdDpcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvNDFhYTM0OTZhYTYzMjYzNGY2NTBlZGJlMTBkNjE3Nzk5OTIyZDI2NS9zcmMvaXNvbW9ycGhpYy9jbGFzc2ljL2NsYXNzL1JlYWN0Q2xhc3MuanMjTDQ2OFxuICAvLyBOb3RlIHRoZSAucmV2ZXJzZSgpLiBJbiBSZWFjdCwgYSBmcmVzaCBjb25zdHJ1Y3RvciBpcyBjcmVhdGVkLCB0aGVuIGFsbCBtaXhpbnMgYXJlIG1peGVkIGluIHJlY3Vyc2l2ZWx5LFxuICAvLyB0aGVuIHRoZSBhY3R1YWwgc3BlYyBpcyBtaXhlZCBpbiBsYXN0LlxuICAvL1xuICAvLyBXaXRoIEVTNiBjbGFzc2VzLCB0aGUgcHJvcGVydGllcyBhcmUgYWxyZWFkeSB0aGVyZSwgc28gc21hcnQtbWl4aW4gbWl4ZXMgZnVuY3Rpb25zIChhLCBiKSAtPiBiKClhKCksIHdoaWNoIGlzXG4gIC8vIHRoZSBvcHBvc2l0ZSBvZiBob3cgUmVhY3QgZG9lcyBpdC4gSWYgd2UgcmV2ZXJzZSB0aGlzIGFycmF5LCB3ZSBiYXNpY2FsbHkgZG8gdGhlIHdob2xlIGxvZ2ljIGluIHJldmVyc2UsXG4gIC8vIHdoaWNoIG1ha2VzIHRoZSByZXN1bHQgdGhlIHNhbWUuIFNlZSB0aGUgdGVzdCBmb3IgbW9yZS5cbiAgLy8gU2VlIGFsc286XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzQxYWEzNDk2YWE2MzI2MzRmNjUwZWRiZTEwZDYxNzc5OTkyMmQyNjUvc3JjL2lzb21vcnBoaWMvY2xhc3NpYy9jbGFzcy9SZWFjdENsYXNzLmpzI0w4NTNcbiAgaWYgKHJlYWN0TWl4aW4ubWl4aW5zKSB7XG4gICAgcmVhY3RNaXhpbi5taXhpbnMucmV2ZXJzZSgpLmZvckVhY2gobWl4aW5DbGFzcy5iaW5kKG51bGwsIHJlYWN0Q2xhc3MpKTtcbiAgfVxuXG4gIHJldHVybiByZWFjdENsYXNzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHJlYWN0TWl4aW4gPSBtaXhpblByb3RvO1xuXG4gIHJlYWN0TWl4aW4ub25DbGFzcyA9IGZ1bmN0aW9uKHJlYWN0Q2xhc3MsIG1peGluKSB7XG4gICAgcmV0dXJuIG1peGluQ2xhc3MocmVhY3RDbGFzcywgbWl4aW4pO1xuICB9O1xuXG4gIHJlYWN0TWl4aW4uZGVjb3JhdGUgPSBmdW5jdGlvbihtaXhpbikge1xuICAgIHJldHVybiBmdW5jdGlvbihyZWFjdENsYXNzKSB7XG4gICAgICByZXR1cm4gcmVhY3RNaXhpbi5vbkNsYXNzKHJlYWN0Q2xhc3MsIG1peGluKTtcbiAgICB9O1xuICB9O1xuXG4gIHJldHVybiByZWFjdE1peGluO1xufSkoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gVG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciBrZXlzO1xuXHR2YXIgdG8gPSBUb09iamVjdCh0YXJnZXQpO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IGFyZ3VtZW50c1tzXTtcblx0XHRrZXlzID0gT2JqZWN0LmtleXMoT2JqZWN0KGZyb20pKTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dG9ba2V5c1tpXV0gPSBmcm9tW2tleXNbaV1dO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCJ2YXIgb2JqVG9TdHIgPSBmdW5jdGlvbih4KXsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KTsgfTtcblxudmFyIHRocm93ZXIgPSBmdW5jdGlvbihlcnJvcil7XG4gICAgdGhyb3cgZXJyb3I7XG59O1xuXG52YXIgbWl4aW5zID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtYWtlTWl4aW5GdW5jdGlvbihydWxlcywgX29wdHMpe1xuICAgIHZhciBvcHRzID0gX29wdHMgfHwge307XG4gICAgaWYgKCFvcHRzLnVua25vd25GdW5jdGlvbikge1xuICAgICAgICBvcHRzLnVua25vd25GdW5jdGlvbiA9IG1peGlucy5PTkNFO1xuICAgIH1cblxuICAgIGlmICghb3B0cy5ub25GdW5jdGlvblByb3BlcnR5KSB7XG4gICAgICAgIG9wdHMubm9uRnVuY3Rpb25Qcm9wZXJ0eSA9IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0LCBrZXkpe1xuICAgICAgICAgICAgaWYgKGxlZnQgIT09IHVuZGVmaW5lZCAmJiByaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGdldFR5cGVOYW1lID0gZnVuY3Rpb24ob2JqKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iaiAmJiBvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmouY29uc3RydWN0b3IubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmpUb1N0cihvYmopLnNsaWNlKDgsIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IG1peGluIGtleSAnICsga2V5ICsgJyBiZWNhdXNlIGl0IGlzIHByb3ZpZGVkIGJ5IG11bHRpcGxlIHNvdXJjZXMsICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsgJ2FuZCB0aGUgdHlwZXMgYXJlICcgKyBnZXRUeXBlTmFtZShsZWZ0KSArICcgYW5kICcgKyBnZXRUeXBlTmFtZShyaWdodCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGxlZnQgPT09IHVuZGVmaW5lZCA/IHJpZ2h0IDogbGVmdDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXROb25FbnVtZXJhYmxlKHRhcmdldCwga2V5LCB2YWx1ZSl7XG4gICAgICAgIGlmIChrZXkgaW4gdGFyZ2V0KXtcbiAgICAgICAgICAgIHRhcmdldFtrZXldID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBhcHBseU1peGluKHNvdXJjZSwgbWl4aW4pe1xuICAgICAgICBPYmplY3Qua2V5cyhtaXhpbikuZm9yRWFjaChmdW5jdGlvbihrZXkpe1xuICAgICAgICAgICAgdmFyIGxlZnQgPSBzb3VyY2Vba2V5XSwgcmlnaHQgPSBtaXhpbltrZXldLCBydWxlID0gcnVsZXNba2V5XTtcblxuICAgICAgICAgICAgLy8gdGhpcyBpcyBqdXN0IGEgd2VpcmQgY2FzZSB3aGVyZSB0aGUga2V5IHdhcyBkZWZpbmVkLCBidXQgdGhlcmUncyBubyB2YWx1ZVxuICAgICAgICAgICAgLy8gYmVoYXZlIGxpa2UgdGhlIGtleSB3YXNuJ3QgZGVmaW5lZFxuICAgICAgICAgICAgaWYgKGxlZnQgPT09IHVuZGVmaW5lZCAmJiByaWdodCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciB3cmFwSWZGdW5jdGlvbiA9IGZ1bmN0aW9uKHRoaW5nKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHRoaW5nICE9PSBcImZ1bmN0aW9uXCIgPyB0aGluZ1xuICAgICAgICAgICAgICAgIDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaW5nLmNhbGwodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gZG8gd2UgaGF2ZSBhIHJ1bGUgZm9yIHRoaXMga2V5P1xuICAgICAgICAgICAgaWYgKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICAvLyBtYXkgdGhyb3cgaGVyZVxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHJ1bGUobGVmdCwgcmlnaHQsIGtleSk7XG4gICAgICAgICAgICAgICAgc2V0Tm9uRW51bWVyYWJsZShzb3VyY2UsIGtleSwgd3JhcElmRnVuY3Rpb24oZm4pKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBsZWZ0SXNGbiA9IHR5cGVvZiBsZWZ0ID09PSBcImZ1bmN0aW9uXCI7XG4gICAgICAgICAgICB2YXIgcmlnaHRJc0ZuID0gdHlwZW9mIHJpZ2h0ID09PSBcImZ1bmN0aW9uXCI7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIHRvIHNlZSBpZiB0aGV5J3JlIHNvbWUgY29tYmluYXRpb24gb2YgZnVuY3Rpb25zIG9yIHVuZGVmaW5lZFxuICAgICAgICAgICAgLy8gd2UgYWxyZWFkeSBrbm93IHRoZXJlJ3Mgbm8gcnVsZSwgc28gdXNlIHRoZSB1bmtub3duIGZ1bmN0aW9uIGJlaGF2aW9yXG4gICAgICAgICAgICBpZiAobGVmdElzRm4gJiYgcmlnaHQgPT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgIHx8IHJpZ2h0SXNGbiAmJiBsZWZ0ID09PSB1bmRlZmluZWRcbiAgICAgICAgICAgICB8fCBsZWZ0SXNGbiAmJiByaWdodElzRm4pIHtcbiAgICAgICAgICAgICAgICAvLyBtYXkgdGhyb3csIHRoZSBkZWZhdWx0IGlzIE9OQ0Ugc28gaWYgYm90aCBhcmUgZnVuY3Rpb25zXG4gICAgICAgICAgICAgICAgLy8gdGhlIGRlZmF1bHQgaXMgdG8gdGhyb3dcbiAgICAgICAgICAgICAgICBzZXROb25FbnVtZXJhYmxlKHNvdXJjZSwga2V5LCB3cmFwSWZGdW5jdGlvbihvcHRzLnVua25vd25GdW5jdGlvbihsZWZ0LCByaWdodCwga2V5KSkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gd2UgaGF2ZSBubyBydWxlIGZvciB0aGVtLCBvbmUgbWF5IGJlIGEgZnVuY3Rpb24gYnV0IG9uZSBvciBib3RoIGFyZW4ndFxuICAgICAgICAgICAgLy8gb3VyIGRlZmF1bHQgaXMgTUFOWV9NRVJHRURfTE9PU0Ugd2hpY2ggd2lsbCBtZXJnZSBvYmplY3RzLCBjb25jYXQgYXJyYXlzXG4gICAgICAgICAgICAvLyBhbmQgdGhyb3cgaWYgdGhlcmUncyBhIHR5cGUgbWlzbWF0Y2ggb3IgYm90aCBhcmUgcHJpbWl0aXZlcyAoaG93IGRvIHlvdSBtZXJnZSAzLCBhbmQgXCJmb29cIj8pXG4gICAgICAgICAgICBzb3VyY2Vba2V5XSA9IG9wdHMubm9uRnVuY3Rpb25Qcm9wZXJ0eShsZWZ0LCByaWdodCwga2V5KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn07XG5cbm1peGlucy5fbWVyZ2VPYmplY3RzID0gZnVuY3Rpb24ob2JqMSwgb2JqMikge1xuICAgIHZhciBhc3NlcnRPYmplY3QgPSBmdW5jdGlvbihvYmosIG9iajIpe1xuICAgICAgICB2YXIgdHlwZSA9IG9ialRvU3RyKG9iaik7XG4gICAgICAgIGlmICh0eXBlICE9PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgdmFyIGRpc3BsYXlUeXBlID0gb2JqLmNvbnN0cnVjdG9yID8gb2JqLmNvbnN0cnVjdG9yLm5hbWUgOiAnVW5rbm93bic7XG4gICAgICAgICAgICB2YXIgZGlzcGxheVR5cGUyID0gb2JqMi5jb25zdHJ1Y3RvciA/IG9iajIuY29uc3RydWN0b3IubmFtZSA6ICdVbmtub3duJztcbiAgICAgICAgICAgIHRocm93ZXIoJ2Nhbm5vdCBtZXJnZSByZXR1cm5lZCB2YWx1ZSBvZiB0eXBlICcgKyBkaXNwbGF5VHlwZSArICcgd2l0aCBhbiAnICsgZGlzcGxheVR5cGUyKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmoxKSAmJiBBcnJheS5pc0FycmF5KG9iajIpKSB7XG4gICAgICAgIHJldHVybiBvYmoxLmNvbmNhdChvYmoyKTtcbiAgICB9XG5cbiAgICBhc3NlcnRPYmplY3Qob2JqMSwgb2JqMik7XG4gICAgYXNzZXJ0T2JqZWN0KG9iajIsIG9iajEpO1xuXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIE9iamVjdC5rZXlzKG9iajEpLmZvckVhY2goZnVuY3Rpb24oayl7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqMiwgaykpIHtcbiAgICAgICAgICAgIHRocm93ZXIoJ2Nhbm5vdCBtZXJnZSByZXR1cm5zIGJlY2F1c2UgYm90aCBoYXZlIHRoZSAnICsgSlNPTi5zdHJpbmdpZnkoaykgKyAnIGtleScpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdFtrXSA9IG9iajFba107XG4gICAgfSk7XG5cbiAgICBPYmplY3Qua2V5cyhvYmoyKS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICAvLyB3ZSBjYW4gc2tpcCB0aGUgY29uZmxpY3QgY2hlY2sgYmVjYXVzZSBhbGwgY29uZmxpY3RzIHdvdWxkIGFscmVhZHkgYmUgZm91bmRcbiAgICAgICAgcmVzdWx0W2tdID0gb2JqMltrXTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuXG59XG5cbi8vIGRlZmluZSBvdXIgYnVpbHQtaW4gbWl4aW4gdHlwZXNcbm1peGlucy5PTkNFID0gZnVuY3Rpb24obGVmdCwgcmlnaHQsIGtleSl7XG4gICAgaWYgKGxlZnQgJiYgcmlnaHQpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IG1peGluICcgKyBrZXkgKyAnIGJlY2F1c2UgaXQgaGFzIGEgdW5pcXVlIGNvbnN0cmFpbnQuJyk7XG4gICAgfVxuXG4gICAgdmFyIGZuID0gbGVmdCB8fCByaWdodDtcblxuICAgIHJldHVybiBmdW5jdGlvbihhcmdzKXtcbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG59O1xuXG5taXhpbnMuTUFOWSA9IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0LCBrZXkpe1xuICAgIHJldHVybiBmdW5jdGlvbihhcmdzKXtcbiAgICAgICAgaWYgKHJpZ2h0KSByaWdodC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIGxlZnQgPyBsZWZ0LmFwcGx5KHRoaXMsIGFyZ3MpIDogdW5kZWZpbmVkO1xuICAgIH07XG59O1xuXG5taXhpbnMuTUFOWV9NRVJHRURfTE9PU0UgPSBmdW5jdGlvbihsZWZ0LCByaWdodCwga2V5KSB7XG4gICAgaWYobGVmdCAmJiByaWdodCkge1xuICAgICAgICByZXR1cm4gbWl4aW5zLl9tZXJnZU9iamVjdHMobGVmdCwgcmlnaHQpO1xuICAgIH1cblxuICAgIHJldHVybiBsZWZ0IHx8IHJpZ2h0O1xufVxuXG5taXhpbnMuTUFOWV9NRVJHRUQgPSBmdW5jdGlvbihsZWZ0LCByaWdodCwga2V5KXtcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJncyl7XG4gICAgICAgIHZhciByZXMxID0gcmlnaHQgJiYgcmlnaHQuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIHZhciByZXMyID0gbGVmdCAmJiBsZWZ0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICBpZiAocmVzMSAmJiByZXMyKSB7XG4gICAgICAgICAgICByZXR1cm4gbWl4aW5zLl9tZXJnZU9iamVjdHMocmVzMSwgcmVzMilcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzMiB8fCByZXMxO1xuICAgIH07XG59O1xuXG5cbm1peGlucy5SRURVQ0VfTEVGVCA9IGZ1bmN0aW9uKF9sZWZ0LCBfcmlnaHQsIGtleSl7XG4gICAgdmFyIGxlZnQgPSBfbGVmdCB8fCBmdW5jdGlvbih4KXsgcmV0dXJuIHggfTtcbiAgICB2YXIgcmlnaHQgPSBfcmlnaHQgfHwgZnVuY3Rpb24oeCl7IHJldHVybiB4IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFyZ3Mpe1xuICAgICAgICByZXR1cm4gcmlnaHQuY2FsbCh0aGlzLCBsZWZ0LmFwcGx5KHRoaXMsIGFyZ3MpKTtcbiAgICB9O1xufTtcblxubWl4aW5zLlJFRFVDRV9SSUdIVCA9IGZ1bmN0aW9uKF9sZWZ0LCBfcmlnaHQsIGtleSl7XG4gICAgdmFyIGxlZnQgPSBfbGVmdCB8fCBmdW5jdGlvbih4KXsgcmV0dXJuIHggfTtcbiAgICB2YXIgcmlnaHQgPSBfcmlnaHQgfHwgZnVuY3Rpb24oeCl7IHJldHVybiB4IH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFyZ3Mpe1xuICAgICAgICByZXR1cm4gbGVmdC5jYWxsKHRoaXMsIHJpZ2h0LmFwcGx5KHRoaXMsIGFyZ3MpKTtcbiAgICB9O1xufTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0gY3JlYXRlQWxsO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfY3JlYXRlUHJvdmlkZXIgPSByZXF1aXJlKCcuL2NyZWF0ZVByb3ZpZGVyJyk7XG5cbnZhciBfY3JlYXRlUHJvdmlkZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY3JlYXRlUHJvdmlkZXIpO1xuXG52YXIgX2NyZWF0ZUNvbm5lY3QgPSByZXF1aXJlKCcuL2NyZWF0ZUNvbm5lY3QnKTtcblxudmFyIF9jcmVhdGVDb25uZWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NyZWF0ZUNvbm5lY3QpO1xuXG5mdW5jdGlvbiBjcmVhdGVBbGwoUmVhY3QpIHtcbiAgdmFyIFByb3ZpZGVyID0gX2NyZWF0ZVByb3ZpZGVyMlsnZGVmYXVsdCddKFJlYWN0KTtcbiAgdmFyIGNvbm5lY3QgPSBfY3JlYXRlQ29ubmVjdDJbJ2RlZmF1bHQnXShSZWFjdCk7XG5cbiAgcmV0dXJuIHsgUHJvdmlkZXI6IFByb3ZpZGVyLCBjb25uZWN0OiBjb25uZWN0IH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gY3JlYXRlQ29ubmVjdDtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF91dGlsc0NyZWF0ZVN0b3JlU2hhcGUgPSByZXF1aXJlKCcuLi91dGlscy9jcmVhdGVTdG9yZVNoYXBlJyk7XG5cbnZhciBfdXRpbHNDcmVhdGVTdG9yZVNoYXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzQ3JlYXRlU3RvcmVTaGFwZSk7XG5cbnZhciBfdXRpbHNTaGFsbG93RXF1YWwgPSByZXF1aXJlKCcuLi91dGlscy9zaGFsbG93RXF1YWwnKTtcblxudmFyIF91dGlsc1NoYWxsb3dFcXVhbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc1NoYWxsb3dFcXVhbCk7XG5cbnZhciBfdXRpbHNJc1BsYWluT2JqZWN0ID0gcmVxdWlyZSgnLi4vdXRpbHMvaXNQbGFpbk9iamVjdCcpO1xuXG52YXIgX3V0aWxzSXNQbGFpbk9iamVjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc0lzUGxhaW5PYmplY3QpO1xuXG52YXIgX3V0aWxzV3JhcEFjdGlvbkNyZWF0b3JzID0gcmVxdWlyZSgnLi4vdXRpbHMvd3JhcEFjdGlvbkNyZWF0b3JzJyk7XG5cbnZhciBfdXRpbHNXcmFwQWN0aW9uQ3JlYXRvcnMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNXcmFwQWN0aW9uQ3JlYXRvcnMpO1xuXG52YXIgX2hvaXN0Tm9uUmVhY3RTdGF0aWNzID0gcmVxdWlyZSgnaG9pc3Qtbm9uLXJlYWN0LXN0YXRpY3MnKTtcblxudmFyIF9ob2lzdE5vblJlYWN0U3RhdGljczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ob2lzdE5vblJlYWN0U3RhdGljcyk7XG5cbnZhciBfaW52YXJpYW50ID0gcmVxdWlyZSgnaW52YXJpYW50Jyk7XG5cbnZhciBfaW52YXJpYW50MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ludmFyaWFudCk7XG5cbnZhciBkZWZhdWx0TWFwU3RhdGVUb1Byb3BzID0gZnVuY3Rpb24gZGVmYXVsdE1hcFN0YXRlVG9Qcm9wcygpIHtcbiAgcmV0dXJuIHt9O1xufTtcbnZhciBkZWZhdWx0TWFwRGlzcGF0Y2hUb1Byb3BzID0gZnVuY3Rpb24gZGVmYXVsdE1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCkge1xuICByZXR1cm4geyBkaXNwYXRjaDogZGlzcGF0Y2ggfTtcbn07XG52YXIgZGVmYXVsdE1lcmdlUHJvcHMgPSBmdW5jdGlvbiBkZWZhdWx0TWVyZ2VQcm9wcyhzdGF0ZVByb3BzLCBkaXNwYXRjaFByb3BzLCBwYXJlbnRQcm9wcykge1xuICByZXR1cm4gX2V4dGVuZHMoe30sIHBhcmVudFByb3BzLCBzdGF0ZVByb3BzLCBkaXNwYXRjaFByb3BzKTtcbn07XG5cbmZ1bmN0aW9uIGdldERpc3BsYXlOYW1lKENvbXBvbmVudCkge1xuICByZXR1cm4gQ29tcG9uZW50LmRpc3BsYXlOYW1lIHx8IENvbXBvbmVudC5uYW1lIHx8ICdDb21wb25lbnQnO1xufVxuXG4vLyBIZWxwcyB0cmFjayBob3QgcmVsb2FkaW5nLlxudmFyIG5leHRWZXJzaW9uID0gMDtcblxuZnVuY3Rpb24gY3JlYXRlQ29ubmVjdChSZWFjdCkge1xuICB2YXIgQ29tcG9uZW50ID0gUmVhY3QuQ29tcG9uZW50O1xuICB2YXIgUHJvcFR5cGVzID0gUmVhY3QuUHJvcFR5cGVzO1xuXG4gIHZhciBzdG9yZVNoYXBlID0gX3V0aWxzQ3JlYXRlU3RvcmVTaGFwZTJbJ2RlZmF1bHQnXShQcm9wVHlwZXMpO1xuXG4gIHJldHVybiBmdW5jdGlvbiBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzLCBtZXJnZVByb3BzKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDMgfHwgYXJndW1lbnRzWzNdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1szXTtcblxuICAgIHZhciBzaG91bGRTdWJzY3JpYmUgPSBCb29sZWFuKG1hcFN0YXRlVG9Qcm9wcyk7XG4gICAgdmFyIGZpbmFsTWFwU3RhdGVUb1Byb3BzID0gbWFwU3RhdGVUb1Byb3BzIHx8IGRlZmF1bHRNYXBTdGF0ZVRvUHJvcHM7XG4gICAgdmFyIGZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzID0gX3V0aWxzSXNQbGFpbk9iamVjdDJbJ2RlZmF1bHQnXShtYXBEaXNwYXRjaFRvUHJvcHMpID8gX3V0aWxzV3JhcEFjdGlvbkNyZWF0b3JzMlsnZGVmYXVsdCddKG1hcERpc3BhdGNoVG9Qcm9wcykgOiBtYXBEaXNwYXRjaFRvUHJvcHMgfHwgZGVmYXVsdE1hcERpc3BhdGNoVG9Qcm9wcztcbiAgICB2YXIgZmluYWxNZXJnZVByb3BzID0gbWVyZ2VQcm9wcyB8fCBkZWZhdWx0TWVyZ2VQcm9wcztcbiAgICB2YXIgc2hvdWxkVXBkYXRlU3RhdGVQcm9wcyA9IGZpbmFsTWFwU3RhdGVUb1Byb3BzLmxlbmd0aCA+IDE7XG4gICAgdmFyIHNob3VsZFVwZGF0ZURpc3BhdGNoUHJvcHMgPSBmaW5hbE1hcERpc3BhdGNoVG9Qcm9wcy5sZW5ndGggPiAxO1xuICAgIHZhciBfb3B0aW9ucyRwdXJlID0gb3B0aW9ucy5wdXJlO1xuICAgIHZhciBwdXJlID0gX29wdGlvbnMkcHVyZSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IF9vcHRpb25zJHB1cmU7XG5cbiAgICAvLyBIZWxwcyB0cmFjayBob3QgcmVsb2FkaW5nLlxuICAgIHZhciB2ZXJzaW9uID0gbmV4dFZlcnNpb24rKztcblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVTdGF0ZVByb3BzKHN0b3JlLCBwcm9wcykge1xuICAgICAgdmFyIHN0YXRlID0gc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICAgIHZhciBzdGF0ZVByb3BzID0gc2hvdWxkVXBkYXRlU3RhdGVQcm9wcyA/IGZpbmFsTWFwU3RhdGVUb1Byb3BzKHN0YXRlLCBwcm9wcykgOiBmaW5hbE1hcFN0YXRlVG9Qcm9wcyhzdGF0ZSk7XG5cbiAgICAgIF9pbnZhcmlhbnQyWydkZWZhdWx0J10oX3V0aWxzSXNQbGFpbk9iamVjdDJbJ2RlZmF1bHQnXShzdGF0ZVByb3BzKSwgJ2BtYXBTdGF0ZVRvUHJvcHNgIG11c3QgcmV0dXJuIGFuIG9iamVjdC4gSW5zdGVhZCByZWNlaXZlZCAlcy4nLCBzdGF0ZVByb3BzKTtcbiAgICAgIHJldHVybiBzdGF0ZVByb3BzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVEaXNwYXRjaFByb3BzKHN0b3JlLCBwcm9wcykge1xuICAgICAgdmFyIGRpc3BhdGNoID0gc3RvcmUuZGlzcGF0Y2g7XG5cbiAgICAgIHZhciBkaXNwYXRjaFByb3BzID0gc2hvdWxkVXBkYXRlRGlzcGF0Y2hQcm9wcyA/IGZpbmFsTWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoLCBwcm9wcykgOiBmaW5hbE1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCk7XG5cbiAgICAgIF9pbnZhcmlhbnQyWydkZWZhdWx0J10oX3V0aWxzSXNQbGFpbk9iamVjdDJbJ2RlZmF1bHQnXShkaXNwYXRjaFByb3BzKSwgJ2BtYXBEaXNwYXRjaFRvUHJvcHNgIG11c3QgcmV0dXJuIGFuIG9iamVjdC4gSW5zdGVhZCByZWNlaXZlZCAlcy4nLCBkaXNwYXRjaFByb3BzKTtcbiAgICAgIHJldHVybiBkaXNwYXRjaFByb3BzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9jb21wdXRlTmV4dFN0YXRlKHN0YXRlUHJvcHMsIGRpc3BhdGNoUHJvcHMsIHBhcmVudFByb3BzKSB7XG4gICAgICB2YXIgbWVyZ2VkUHJvcHMgPSBmaW5hbE1lcmdlUHJvcHMoc3RhdGVQcm9wcywgZGlzcGF0Y2hQcm9wcywgcGFyZW50UHJvcHMpO1xuICAgICAgX2ludmFyaWFudDJbJ2RlZmF1bHQnXShfdXRpbHNJc1BsYWluT2JqZWN0MlsnZGVmYXVsdCddKG1lcmdlZFByb3BzKSwgJ2BtZXJnZVByb3BzYCBtdXN0IHJldHVybiBhbiBvYmplY3QuIEluc3RlYWQgcmVjZWl2ZWQgJXMuJywgbWVyZ2VkUHJvcHMpO1xuICAgICAgcmV0dXJuIG1lcmdlZFByb3BzO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiB3cmFwV2l0aENvbm5lY3QoV3JhcHBlZENvbXBvbmVudCkge1xuICAgICAgdmFyIENvbm5lY3QgPSAoZnVuY3Rpb24gKF9Db21wb25lbnQpIHtcbiAgICAgICAgX2luaGVyaXRzKENvbm5lY3QsIF9Db21wb25lbnQpO1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLnNob3VsZENvbXBvbmVudFVwZGF0ZSA9IGZ1bmN0aW9uIHNob3VsZENvbXBvbmVudFVwZGF0ZShuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgICAgICAgIGlmICghcHVyZSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdGF0ZVByb3BzKG5leHRQcm9wcyk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZURpc3BhdGNoUHJvcHMobmV4dFByb3BzKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdGUobmV4dFByb3BzKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBzdG9yZUNoYW5nZWQgPSBuZXh0U3RhdGUuc3RvcmVTdGF0ZSAhPT0gdGhpcy5zdGF0ZS5zdG9yZVN0YXRlO1xuICAgICAgICAgIHZhciBwcm9wc0NoYW5nZWQgPSAhX3V0aWxzU2hhbGxvd0VxdWFsMlsnZGVmYXVsdCddKG5leHRQcm9wcywgdGhpcy5wcm9wcyk7XG4gICAgICAgICAgdmFyIG1hcFN0YXRlUHJvZHVjZWRDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgICB2YXIgZGlzcGF0Y2hQcm9wc0NoYW5nZWQgPSBmYWxzZTtcblxuICAgICAgICAgIGlmIChzdG9yZUNoYW5nZWQgfHwgcHJvcHNDaGFuZ2VkICYmIHNob3VsZFVwZGF0ZVN0YXRlUHJvcHMpIHtcbiAgICAgICAgICAgIG1hcFN0YXRlUHJvZHVjZWRDaGFuZ2UgPSB0aGlzLnVwZGF0ZVN0YXRlUHJvcHMobmV4dFByb3BzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocHJvcHNDaGFuZ2VkICYmIHNob3VsZFVwZGF0ZURpc3BhdGNoUHJvcHMpIHtcbiAgICAgICAgICAgIGRpc3BhdGNoUHJvcHNDaGFuZ2VkID0gdGhpcy51cGRhdGVEaXNwYXRjaFByb3BzKG5leHRQcm9wcyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHByb3BzQ2hhbmdlZCB8fCBtYXBTdGF0ZVByb2R1Y2VkQ2hhbmdlIHx8IGRpc3BhdGNoUHJvcHNDaGFuZ2VkKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKG5leHRQcm9wcyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gQ29ubmVjdChwcm9wcywgY29udGV4dCkge1xuICAgICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBDb25uZWN0KTtcblxuICAgICAgICAgIF9Db21wb25lbnQuY2FsbCh0aGlzLCBwcm9wcywgY29udGV4dCk7XG4gICAgICAgICAgdGhpcy52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICB0aGlzLnN0b3JlID0gcHJvcHMuc3RvcmUgfHwgY29udGV4dC5zdG9yZTtcblxuICAgICAgICAgIF9pbnZhcmlhbnQyWydkZWZhdWx0J10odGhpcy5zdG9yZSwgJ0NvdWxkIG5vdCBmaW5kIFwic3RvcmVcIiBpbiBlaXRoZXIgdGhlIGNvbnRleHQgb3IgJyArICgncHJvcHMgb2YgXCInICsgdGhpcy5jb25zdHJ1Y3Rvci5kaXNwbGF5TmFtZSArICdcIi4gJykgKyAnRWl0aGVyIHdyYXAgdGhlIHJvb3QgY29tcG9uZW50IGluIGEgPFByb3ZpZGVyPiwgJyArICgnb3IgZXhwbGljaXRseSBwYXNzIFwic3RvcmVcIiBhcyBhIHByb3AgdG8gXCInICsgdGhpcy5jb25zdHJ1Y3Rvci5kaXNwbGF5TmFtZSArICdcIi4nKSk7XG5cbiAgICAgICAgICB0aGlzLnN0YXRlUHJvcHMgPSBjb21wdXRlU3RhdGVQcm9wcyh0aGlzLnN0b3JlLCBwcm9wcyk7XG4gICAgICAgICAgdGhpcy5kaXNwYXRjaFByb3BzID0gY29tcHV0ZURpc3BhdGNoUHJvcHModGhpcy5zdG9yZSwgcHJvcHMpO1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSB7IHN0b3JlU3RhdGU6IG51bGwgfTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS5jb21wdXRlTmV4dFN0YXRlID0gZnVuY3Rpb24gY29tcHV0ZU5leHRTdGF0ZSgpIHtcbiAgICAgICAgICB2YXIgcHJvcHMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0aGlzLnByb3BzIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAgICAgcmV0dXJuIF9jb21wdXRlTmV4dFN0YXRlKHRoaXMuc3RhdGVQcm9wcywgdGhpcy5kaXNwYXRjaFByb3BzLCBwcm9wcyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUudXBkYXRlU3RhdGVQcm9wcyA9IGZ1bmN0aW9uIHVwZGF0ZVN0YXRlUHJvcHMoKSB7XG4gICAgICAgICAgdmFyIHByb3BzID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdGhpcy5wcm9wcyA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgICAgIHZhciBuZXh0U3RhdGVQcm9wcyA9IGNvbXB1dGVTdGF0ZVByb3BzKHRoaXMuc3RvcmUsIHByb3BzKTtcbiAgICAgICAgICBpZiAoX3V0aWxzU2hhbGxvd0VxdWFsMlsnZGVmYXVsdCddKG5leHRTdGF0ZVByb3BzLCB0aGlzLnN0YXRlUHJvcHMpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5zdGF0ZVByb3BzID0gbmV4dFN0YXRlUHJvcHM7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUudXBkYXRlRGlzcGF0Y2hQcm9wcyA9IGZ1bmN0aW9uIHVwZGF0ZURpc3BhdGNoUHJvcHMoKSB7XG4gICAgICAgICAgdmFyIHByb3BzID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdGhpcy5wcm9wcyA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgICAgIHZhciBuZXh0RGlzcGF0Y2hQcm9wcyA9IGNvbXB1dGVEaXNwYXRjaFByb3BzKHRoaXMuc3RvcmUsIHByb3BzKTtcbiAgICAgICAgICBpZiAoX3V0aWxzU2hhbGxvd0VxdWFsMlsnZGVmYXVsdCddKG5leHREaXNwYXRjaFByb3BzLCB0aGlzLmRpc3BhdGNoUHJvcHMpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5kaXNwYXRjaFByb3BzID0gbmV4dERpc3BhdGNoUHJvcHM7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUudXBkYXRlU3RhdGUgPSBmdW5jdGlvbiB1cGRhdGVTdGF0ZSgpIHtcbiAgICAgICAgICB2YXIgcHJvcHMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0aGlzLnByb3BzIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAgICAgdGhpcy5uZXh0U3RhdGUgPSB0aGlzLmNvbXB1dGVOZXh0U3RhdGUocHJvcHMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLmlzU3Vic2NyaWJlZCA9IGZ1bmN0aW9uIGlzU3Vic2NyaWJlZCgpIHtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIHRoaXMudW5zdWJzY3JpYmUgPT09ICdmdW5jdGlvbic7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUudHJ5U3Vic2NyaWJlID0gZnVuY3Rpb24gdHJ5U3Vic2NyaWJlKCkge1xuICAgICAgICAgIGlmIChzaG91bGRTdWJzY3JpYmUgJiYgIXRoaXMudW5zdWJzY3JpYmUpIHtcbiAgICAgICAgICAgIHRoaXMudW5zdWJzY3JpYmUgPSB0aGlzLnN0b3JlLnN1YnNjcmliZSh0aGlzLmhhbmRsZUNoYW5nZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlQ2hhbmdlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLnRyeVVuc3Vic2NyaWJlID0gZnVuY3Rpb24gdHJ5VW5zdWJzY3JpYmUoKSB7XG4gICAgICAgICAgaWYgKHRoaXMudW5zdWJzY3JpYmUpIHtcbiAgICAgICAgICAgIHRoaXMudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMudW5zdWJzY3JpYmUgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS5jb21wb25lbnREaWRNb3VudCA9IGZ1bmN0aW9uIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgICAgICAgIHRoaXMudHJ5U3Vic2NyaWJlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUuY29tcG9uZW50V2lsbFVubW91bnQgPSBmdW5jdGlvbiBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICAgICAgICB0aGlzLnRyeVVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUuaGFuZGxlQ2hhbmdlID0gZnVuY3Rpb24gaGFuZGxlQ2hhbmdlKCkge1xuICAgICAgICAgIGlmICghdGhpcy51bnN1YnNjcmliZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RvcmVTdGF0ZTogdGhpcy5zdG9yZS5nZXRTdGF0ZSgpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUuZ2V0V3JhcHBlZEluc3RhbmNlID0gZnVuY3Rpb24gZ2V0V3JhcHBlZEluc3RhbmNlKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlZnMud3JhcHBlZEluc3RhbmNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChXcmFwcGVkQ29tcG9uZW50LCBfZXh0ZW5kcyh7IHJlZjogJ3dyYXBwZWRJbnN0YW5jZSdcbiAgICAgICAgICB9LCB0aGlzLm5leHRTdGF0ZSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBDb25uZWN0O1xuICAgICAgfSkoQ29tcG9uZW50KTtcblxuICAgICAgQ29ubmVjdC5kaXNwbGF5TmFtZSA9ICdDb25uZWN0KCcgKyBnZXREaXNwbGF5TmFtZShXcmFwcGVkQ29tcG9uZW50KSArICcpJztcbiAgICAgIENvbm5lY3QuV3JhcHBlZENvbXBvbmVudCA9IFdyYXBwZWRDb21wb25lbnQ7XG4gICAgICBDb25uZWN0LmNvbnRleHRUeXBlcyA9IHtcbiAgICAgICAgc3RvcmU6IHN0b3JlU2hhcGVcbiAgICAgIH07XG4gICAgICBDb25uZWN0LnByb3BUeXBlcyA9IHtcbiAgICAgICAgc3RvcmU6IHN0b3JlU2hhcGVcbiAgICAgIH07XG5cbiAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLmNvbXBvbmVudFdpbGxVcGRhdGUgPSBmdW5jdGlvbiBjb21wb25lbnRXaWxsVXBkYXRlKCkge1xuICAgICAgICAgIGlmICh0aGlzLnZlcnNpb24gPT09IHZlcnNpb24pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBXZSBhcmUgaG90IHJlbG9hZGluZyFcbiAgICAgICAgICB0aGlzLnZlcnNpb24gPSB2ZXJzaW9uO1xuXG4gICAgICAgICAgLy8gVXBkYXRlIHRoZSBzdGF0ZSBhbmQgYmluZGluZ3MuXG4gICAgICAgICAgdGhpcy50cnlTdWJzY3JpYmUoKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlUHJvcHMoKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZURpc3BhdGNoUHJvcHMoKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKCk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBfaG9pc3ROb25SZWFjdFN0YXRpY3MyWydkZWZhdWx0J10oQ29ubmVjdCwgV3JhcHBlZENvbXBvbmVudCk7XG4gICAgfTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0gY3JlYXRlUHJvdmlkZXI7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBfdXRpbHNDcmVhdGVTdG9yZVNoYXBlID0gcmVxdWlyZSgnLi4vdXRpbHMvY3JlYXRlU3RvcmVTaGFwZScpO1xuXG52YXIgX3V0aWxzQ3JlYXRlU3RvcmVTaGFwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc0NyZWF0ZVN0b3JlU2hhcGUpO1xuXG5mdW5jdGlvbiBpc1VzaW5nT3duZXJDb250ZXh0KFJlYWN0KSB7XG4gIHZhciB2ZXJzaW9uID0gUmVhY3QudmVyc2lvbjtcblxuICBpZiAodHlwZW9mIHZlcnNpb24gIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICB2YXIgc2VjdGlvbnMgPSB2ZXJzaW9uLnNwbGl0KCcuJyk7XG4gIHZhciBtYWpvciA9IHBhcnNlSW50KHNlY3Rpb25zWzBdLCAxMCk7XG4gIHZhciBtaW5vciA9IHBhcnNlSW50KHNlY3Rpb25zWzFdLCAxMCk7XG5cbiAgcmV0dXJuIG1ham9yID09PSAwICYmIG1pbm9yID09PSAxMztcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJvdmlkZXIoUmVhY3QpIHtcbiAgdmFyIENvbXBvbmVudCA9IFJlYWN0LkNvbXBvbmVudDtcbiAgdmFyIFByb3BUeXBlcyA9IFJlYWN0LlByb3BUeXBlcztcbiAgdmFyIENoaWxkcmVuID0gUmVhY3QuQ2hpbGRyZW47XG5cbiAgdmFyIHN0b3JlU2hhcGUgPSBfdXRpbHNDcmVhdGVTdG9yZVNoYXBlMlsnZGVmYXVsdCddKFByb3BUeXBlcyk7XG4gIHZhciByZXF1aXJlRnVuY3Rpb25DaGlsZCA9IGlzVXNpbmdPd25lckNvbnRleHQoUmVhY3QpO1xuXG4gIHZhciBkaWRXYXJuQWJvdXRDaGlsZCA9IGZhbHNlO1xuICBmdW5jdGlvbiB3YXJuQWJvdXRGdW5jdGlvbkNoaWxkKCkge1xuICAgIGlmIChkaWRXYXJuQWJvdXRDaGlsZCB8fCByZXF1aXJlRnVuY3Rpb25DaGlsZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRpZFdhcm5BYm91dENoaWxkID0gdHJ1ZTtcbiAgICBjb25zb2xlLmVycm9yKCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAnV2l0aCBSZWFjdCAwLjE0IGFuZCBsYXRlciB2ZXJzaW9ucywgeW91IG5vIGxvbmdlciBuZWVkIHRvICcgKyAnd3JhcCA8UHJvdmlkZXI+IGNoaWxkIGludG8gYSBmdW5jdGlvbi4nKTtcbiAgfVxuICBmdW5jdGlvbiB3YXJuQWJvdXRFbGVtZW50Q2hpbGQoKSB7XG4gICAgaWYgKGRpZFdhcm5BYm91dENoaWxkIHx8ICFyZXF1aXJlRnVuY3Rpb25DaGlsZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRpZFdhcm5BYm91dENoaWxkID0gdHJ1ZTtcbiAgICBjb25zb2xlLmVycm9yKCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAnV2l0aCBSZWFjdCAwLjEzLCB5b3UgbmVlZCB0byAnICsgJ3dyYXAgPFByb3ZpZGVyPiBjaGlsZCBpbnRvIGEgZnVuY3Rpb24uICcgKyAnVGhpcyByZXN0cmljdGlvbiB3aWxsIGJlIHJlbW92ZWQgd2l0aCBSZWFjdCAwLjE0LicpO1xuICB9XG5cbiAgdmFyIGRpZFdhcm5BYm91dFJlY2VpdmluZ1N0b3JlID0gZmFsc2U7XG4gIGZ1bmN0aW9uIHdhcm5BYm91dFJlY2VpdmluZ1N0b3JlKCkge1xuICAgIGlmIChkaWRXYXJuQWJvdXRSZWNlaXZpbmdTdG9yZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRpZFdhcm5BYm91dFJlY2VpdmluZ1N0b3JlID0gdHJ1ZTtcbiAgICBjb25zb2xlLmVycm9yKCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAnPFByb3ZpZGVyPiBkb2VzIG5vdCBzdXBwb3J0IGNoYW5naW5nIGBzdG9yZWAgb24gdGhlIGZseS4gJyArICdJdCBpcyBtb3N0IGxpa2VseSB0aGF0IHlvdSBzZWUgdGhpcyBlcnJvciBiZWNhdXNlIHlvdSB1cGRhdGVkIHRvICcgKyAnUmVkdXggMi54IGFuZCBSZWFjdCBSZWR1eCAyLnggd2hpY2ggbm8gbG9uZ2VyIGhvdCByZWxvYWQgcmVkdWNlcnMgJyArICdhdXRvbWF0aWNhbGx5LiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3JhY2t0L3JlYWN0LXJlZHV4L3JlbGVhc2VzLycgKyAndGFnL3YyLjAuMCBmb3IgdGhlIG1pZ3JhdGlvbiBpbnN0cnVjdGlvbnMuJyk7XG4gIH1cblxuICB2YXIgUHJvdmlkZXIgPSAoZnVuY3Rpb24gKF9Db21wb25lbnQpIHtcbiAgICBfaW5oZXJpdHMoUHJvdmlkZXIsIF9Db21wb25lbnQpO1xuXG4gICAgUHJvdmlkZXIucHJvdG90eXBlLmdldENoaWxkQ29udGV4dCA9IGZ1bmN0aW9uIGdldENoaWxkQ29udGV4dCgpIHtcbiAgICAgIHJldHVybiB7IHN0b3JlOiB0aGlzLnN0b3JlIH07XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIFByb3ZpZGVyKHByb3BzLCBjb250ZXh0KSB7XG4gICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgUHJvdmlkZXIpO1xuXG4gICAgICBfQ29tcG9uZW50LmNhbGwodGhpcywgcHJvcHMsIGNvbnRleHQpO1xuICAgICAgdGhpcy5zdG9yZSA9IHByb3BzLnN0b3JlO1xuICAgIH1cblxuICAgIFByb3ZpZGVyLnByb3RvdHlwZS5jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzID0gZnVuY3Rpb24gY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXh0UHJvcHMpIHtcbiAgICAgIHZhciBzdG9yZSA9IHRoaXMuc3RvcmU7XG4gICAgICB2YXIgbmV4dFN0b3JlID0gbmV4dFByb3BzLnN0b3JlO1xuXG4gICAgICBpZiAoc3RvcmUgIT09IG5leHRTdG9yZSkge1xuICAgICAgICB3YXJuQWJvdXRSZWNlaXZpbmdTdG9yZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBQcm92aWRlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5wcm9wcy5jaGlsZHJlbjtcblxuICAgICAgaWYgKHR5cGVvZiBjaGlsZHJlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB3YXJuQWJvdXRGdW5jdGlvbkNoaWxkKCk7XG4gICAgICAgIGNoaWxkcmVuID0gY2hpbGRyZW4oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdhcm5BYm91dEVsZW1lbnRDaGlsZCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gQ2hpbGRyZW4ub25seShjaGlsZHJlbik7XG4gICAgfTtcblxuICAgIHJldHVybiBQcm92aWRlcjtcbiAgfSkoQ29tcG9uZW50KTtcblxuICBQcm92aWRlci5jaGlsZENvbnRleHRUeXBlcyA9IHtcbiAgICBzdG9yZTogc3RvcmVTaGFwZS5pc1JlcXVpcmVkXG4gIH07XG4gIFByb3ZpZGVyLnByb3BUeXBlcyA9IHtcbiAgICBzdG9yZTogc3RvcmVTaGFwZS5pc1JlcXVpcmVkLFxuICAgIGNoaWxkcmVuOiAocmVxdWlyZUZ1bmN0aW9uQ2hpbGQgPyBQcm9wVHlwZXMuZnVuYyA6IFByb3BUeXBlcy5lbGVtZW50KS5pc1JlcXVpcmVkXG4gIH07XG5cbiAgcmV0dXJuIFByb3ZpZGVyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gY3JlYXRlU3RvcmVTaGFwZTtcblxuZnVuY3Rpb24gY3JlYXRlU3RvcmVTaGFwZShQcm9wVHlwZXMpIHtcbiAgcmV0dXJuIFByb3BUeXBlcy5zaGFwZSh7XG4gICAgc3Vic2NyaWJlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIGRpc3BhdGNoOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIGdldFN0YXRlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGlzUGxhaW5PYmplY3Q7XG52YXIgZm5Ub1N0cmluZyA9IGZ1bmN0aW9uIGZuVG9TdHJpbmcoZm4pIHtcbiAgcmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGZuKTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IG9iaiBUaGUgb2JqZWN0IHRvIGluc3BlY3QuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgYXJndW1lbnQgYXBwZWFycyB0byBiZSBhIHBsYWluIG9iamVjdC5cbiAqL1xuXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iaikge1xuICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHZhciBwcm90byA9IHR5cGVvZiBvYmouY29uc3RydWN0b3IgPT09ICdmdW5jdGlvbicgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSA6IE9iamVjdC5wcm90b3R5cGU7XG5cbiAgaWYgKHByb3RvID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICB2YXIgY29uc3RydWN0b3IgPSBwcm90by5jb25zdHJ1Y3RvcjtcblxuICByZXR1cm4gdHlwZW9mIGNvbnN0cnVjdG9yID09PSAnZnVuY3Rpb24nICYmIGNvbnN0cnVjdG9yIGluc3RhbmNlb2YgY29uc3RydWN0b3IgJiYgZm5Ub1N0cmluZyhjb25zdHJ1Y3RvcikgPT09IGZuVG9TdHJpbmcoT2JqZWN0KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHNoYWxsb3dFcXVhbDtcblxuZnVuY3Rpb24gc2hhbGxvd0VxdWFsKG9iakEsIG9iakIpIHtcbiAgaWYgKG9iakEgPT09IG9iakIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHZhciBrZXlzQSA9IE9iamVjdC5rZXlzKG9iakEpO1xuICB2YXIga2V5c0IgPSBPYmplY3Qua2V5cyhvYmpCKTtcblxuICBpZiAoa2V5c0EubGVuZ3RoICE9PSBrZXlzQi5sZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBUZXN0IGZvciBBJ3Mga2V5cyBkaWZmZXJlbnQgZnJvbSBCLlxuICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzQS5sZW5ndGg7IGkrKykge1xuICAgIGlmICghaGFzT3duLmNhbGwob2JqQiwga2V5c0FbaV0pIHx8IG9iakFba2V5c0FbaV1dICE9PSBvYmpCW2tleXNBW2ldXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHdyYXBBY3Rpb25DcmVhdG9ycztcblxudmFyIF9yZWR1eCA9IHJlcXVpcmUoJ3JlZHV4Jyk7XG5cbmZ1bmN0aW9uIHdyYXBBY3Rpb25DcmVhdG9ycyhhY3Rpb25DcmVhdG9ycykge1xuICByZXR1cm4gZnVuY3Rpb24gKGRpc3BhdGNoKSB7XG4gICAgcmV0dXJuIF9yZWR1eC5iaW5kQWN0aW9uQ3JlYXRvcnMoYWN0aW9uQ3JlYXRvcnMsIGRpc3BhdGNoKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNSwgWWFob28hIEluYy5cbiAqIENvcHlyaWdodHMgbGljZW5zZWQgdW5kZXIgdGhlIE5ldyBCU0QgTGljZW5zZS4gU2VlIHRoZSBhY2NvbXBhbnlpbmcgTElDRU5TRSBmaWxlIGZvciB0ZXJtcy5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUkVBQ1RfU1RBVElDUyA9IHtcbiAgICBjaGlsZENvbnRleHRUeXBlczogdHJ1ZSxcbiAgICBjb250ZXh0VHlwZXM6IHRydWUsXG4gICAgZGVmYXVsdFByb3BzOiB0cnVlLFxuICAgIGRpc3BsYXlOYW1lOiB0cnVlLFxuICAgIGdldERlZmF1bHRQcm9wczogdHJ1ZSxcbiAgICBtaXhpbnM6IHRydWUsXG4gICAgcHJvcFR5cGVzOiB0cnVlLFxuICAgIHR5cGU6IHRydWVcbn07XG5cbnZhciBLTk9XTl9TVEFUSUNTID0ge1xuICAgIG5hbWU6IHRydWUsXG4gICAgbGVuZ3RoOiB0cnVlLFxuICAgIHByb3RvdHlwZTogdHJ1ZSxcbiAgICBjYWxsZXI6IHRydWUsXG4gICAgYXJndW1lbnRzOiB0cnVlLFxuICAgIGFyaXR5OiB0cnVlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGhvaXN0Tm9uUmVhY3RTdGF0aWNzKHRhcmdldENvbXBvbmVudCwgc291cmNlQ29tcG9uZW50KSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhzb3VyY2VDb21wb25lbnQpO1xuICAgIGZvciAodmFyIGk9MDsgaTxrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmICghUkVBQ1RfU1RBVElDU1trZXlzW2ldXSAmJiAhS05PV05fU1RBVElDU1trZXlzW2ldXSkge1xuICAgICAgICAgICAgdGFyZ2V0Q29tcG9uZW50W2tleXNbaV1dID0gc291cmNlQ29tcG9uZW50W2tleXNbaV1dO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldENvbXBvbmVudDtcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDEzLTIwMTUsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRC1zdHlsZSBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVXNlIGludmFyaWFudCgpIHRvIGFzc2VydCBzdGF0ZSB3aGljaCB5b3VyIHByb2dyYW0gYXNzdW1lcyB0byBiZSB0cnVlLlxuICpcbiAqIFByb3ZpZGUgc3ByaW50Zi1zdHlsZSBmb3JtYXQgKG9ubHkgJXMgaXMgc3VwcG9ydGVkKSBhbmQgYXJndW1lbnRzXG4gKiB0byBwcm92aWRlIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgYnJva2UgYW5kIHdoYXQgeW91IHdlcmVcbiAqIGV4cGVjdGluZy5cbiAqXG4gKiBUaGUgaW52YXJpYW50IG1lc3NhZ2Ugd2lsbCBiZSBzdHJpcHBlZCBpbiBwcm9kdWN0aW9uLCBidXQgdGhlIGludmFyaWFudFxuICogd2lsbCByZW1haW4gdG8gZW5zdXJlIGxvZ2ljIGRvZXMgbm90IGRpZmZlciBpbiBwcm9kdWN0aW9uLlxuICovXG5cbnZhciBpbnZhcmlhbnQgPSBmdW5jdGlvbihjb25kaXRpb24sIGZvcm1hdCwgYSwgYiwgYywgZCwgZSwgZikge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhcmlhbnQgcmVxdWlyZXMgYW4gZXJyb3IgbWVzc2FnZSBhcmd1bWVudCcpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29uZGl0aW9uKSB7XG4gICAgdmFyIGVycm9yO1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoXG4gICAgICAgICdNaW5pZmllZCBleGNlcHRpb24gb2NjdXJyZWQ7IHVzZSB0aGUgbm9uLW1pbmlmaWVkIGRldiBlbnZpcm9ubWVudCAnICtcbiAgICAgICAgJ2ZvciB0aGUgZnVsbCBlcnJvciBtZXNzYWdlIGFuZCBhZGRpdGlvbmFsIGhlbHBmdWwgd2FybmluZ3MuJ1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFyZ3MgPSBbYSwgYiwgYywgZCwgZSwgZl07XG4gICAgICB2YXIgYXJnSW5kZXggPSAwO1xuICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoXG4gICAgICAgIGZvcm1hdC5yZXBsYWNlKC8lcy9nLCBmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3NbYXJnSW5kZXgrK107IH0pXG4gICAgICApO1xuICAgICAgZXJyb3IubmFtZSA9ICdJbnZhcmlhbnQgVmlvbGF0aW9uJztcbiAgICB9XG5cbiAgICBlcnJvci5mcmFtZXNUb1BvcCA9IDE7IC8vIHdlIGRvbid0IGNhcmUgYWJvdXQgaW52YXJpYW50J3Mgb3duIGZyYW1lXG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaW52YXJpYW50O1xuIl19
