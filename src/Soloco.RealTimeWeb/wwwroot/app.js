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
arguments[4][7][0].apply(exports,arguments)
},{"../../api/membership":2,"../../state/user":16,"dup":7,"react":"react","react-bootstrap":"react-bootstrap","react-redux":"react-redux"}],13:[function(require,module,exports){
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
                    _react2.default.createElement(_reactRouter.Route, { path: 'logon', component: _RegisterView2.default }),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDbGllbnRcXFNvdXJjZVxcYXBpXFxJbmRleC5qcyIsIkNsaWVudFxcU291cmNlXFxhcGlcXG1lbWJlcnNoaXAuanMiLCJDbGllbnRcXFNvdXJjZVxcYXBpXFxuYXZpZ2F0ZS5qcyIsIkNsaWVudFxcU291cmNlXFxhcHAuanMiLCJDbGllbnRcXFNvdXJjZVxcY29tcG9uZW50c1xcQWJvdXRWaWV3XFxBYm91dC5qcyIsIkNsaWVudFxcU291cmNlXFxjb21wb25lbnRzXFxIb21lVmlld1xcSW5kZXguanMiLCJDbGllbnRcXFNvdXJjZVxcY29tcG9uZW50c1xcTG9nb25WaWV3XFxJbmRleC5qcyIsIkNsaWVudFxcU291cmNlXFxjb21wb25lbnRzXFxNYWluUGFnZVxcSW5kZXguanMiLCJDbGllbnRcXFNvdXJjZVxcY29tcG9uZW50c1xcTWFpblBhZ2VcXGZvb3Rlci5qcyIsIkNsaWVudFxcU291cmNlXFxjb21wb25lbnRzXFxNYWluUGFnZVxcaGVhZGVyLmpzIiwiQ2xpZW50XFxTb3VyY2VcXGNvbXBvbmVudHNcXE5vdEZvdW5kUGFnZVxcaW5kZXguanMiLCJDbGllbnRcXFNvdXJjZVxccm91dGVyLmpzIiwiQ2xpZW50XFxTb3VyY2VcXHN0YXRlXFxkaXNwYXRjaGVyLmpzIiwiQ2xpZW50XFxTb3VyY2VcXHN0YXRlXFxyZWR1Y2Vycy5qcyIsIkNsaWVudFxcU291cmNlXFxzdGF0ZVxcdXNlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL2NyZWF0ZURldlRvb2xzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9kZXZUb29scy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3BlcnNpc3RTdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvRGVidWdQYW5lbC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvTG9nTW9uaXRvci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvTG9nTW9uaXRvckJ1dHRvbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvTG9nTW9uaXRvckVudHJ5LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC9Mb2dNb25pdG9yRW50cnlBY3Rpb24uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYXBhdGh5LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYXNoZXMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9hdGVsaWVyLWR1bmUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9hdGVsaWVyLWZvcmVzdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2F0ZWxpZXItaGVhdGguanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9hdGVsaWVyLWxha2VzaWRlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYXRlbGllci1zZWFzaWRlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYmVzcGluLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYnJld2VyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvYnJpZ2h0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvY2hhbGsuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9jb2Rlc2Nob29sLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvY29sb3JzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvZGVmYXVsdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2VpZ2h0aWVzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvZW1iZXJzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvZmxhdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2dvb2dsZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2dyYXlzY2FsZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2dyZWVuc2NyZWVuLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvaGFybW9uaWMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9ob3BzY290Y2guanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL2lzb3RvcGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9tYXJyYWtlc2guanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9tb2NoYS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL21vbm9rYWkuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9uaWNpbmFib3guanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9vY2Vhbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9saWIvcmVhY3QvdGhlbWVzL3BhcmFpc28uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9wb3AuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy9yYWlsc2Nhc3RzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvc2hhcGVzaGlmdGVyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvc29sYXJpemVkLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvc3VtbWVyZnJ1aXQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy90aHJlZXplcm90d29mb3VyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvdG9tb3Jyb3cuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3JlYWN0L3RoZW1lcy90dWJlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL2xpYi9yZWFjdC90aGVtZXMvdHdpbGlnaHQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbGliL3V0aWxzL2JyaWdodGVuLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL0pTT05BcnJheU5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTkFycm93LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL0pTT05Cb29sZWFuTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9KU09ORGF0ZU5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTkl0ZXJhYmxlTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9KU09OTnVsbE5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTk51bWJlck5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTk9iamVjdE5vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvSlNPTlN0cmluZ05vZGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9saWIvZ3JhYi1ub2RlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL21peGlucy9leHBhbmRlZC1zdGF0ZS1oYW5kbGVyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL21peGlucy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL2xpYi9taXhpbnMvc3F1YXNoLWNsaWNrLWV2ZW50LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL29iai10eXBlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbGliL3V0aWxzL2hleFRvUmdiLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9nZXQtaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL251bWJlci9pcy1zYWZlLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9kZWZpbmUtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2NvcmUtanMvc3ltYm9sL2l0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jcmVhdGUtY2xhc3MuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9mbi9nZXQtaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL251bWJlci9pcy1zYWZlLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9kZWZpbmUtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9mbi9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vc3ltYm9sL2l0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuYS1mdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmFkZC10by11bnNjb3BhYmxlcy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmFuLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmNsYXNzb2YuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jb2YuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jb3JlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuY3R4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZGVmaW5lZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmRlc2NyaXB0b3JzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZXhwb3J0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZmFpbHMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5nbG9iYWwuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5oYXMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5oaWRlLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmlzLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5pcy1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5pdGVyLWNyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLml0ZXItZGVmaW5lLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlci1zdGVwLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuaXRlcmF0b3JzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5saWJyYXJ5LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQub2JqZWN0LWFzc2lnbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLm9iamVjdC1zYXAuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5wcm9wZXJ0eS1kZXNjLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQucmVkZWZpbmUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5zZXQtcHJvdG8uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5zZXQtdG8tc3RyaW5nLXRhZy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnNoYXJlZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnN0cmluZy1hdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLnRvLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC50by1pb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudG8tb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudWlkLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQud2tzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2NvcmUuZ2V0LWl0ZXJhdG9yLW1ldGhvZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9jb3JlLmdldC1pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuYXJyYXkuaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm51bWJlci5pcy1zYWZlLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm9iamVjdC5hc3NpZ24uanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LWpzb24tdHJlZS9ub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2Lm9iamVjdC5rZXlzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3Quc2V0LXByb3RvdHlwZS1vZi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtanNvbi10cmVlL25vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1qc29uLXRyZWUvbm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LW1peGluL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1taXhpbi9ub2RlX21vZHVsZXMvb2JqZWN0LWFzc2lnbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtbWl4aW4vbm9kZV9tb2R1bGVzL3NtYXJ0LW1peGluL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1yZWR1eC9saWIvY29tcG9uZW50cy9jcmVhdGVBbGwuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L2xpYi9jb21wb25lbnRzL2NyZWF0ZUNvbm5lY3QuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L2xpYi9jb21wb25lbnRzL2NyZWF0ZVByb3ZpZGVyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHV4LWRldnRvb2xzL25vZGVfbW9kdWxlcy9yZWFjdC1yZWR1eC9saWIvdXRpbHMvY3JlYXRlU3RvcmVTaGFwZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtcmVkdXgvbGliL3V0aWxzL2lzUGxhaW5PYmplY3QuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L2xpYi91dGlscy9zaGFsbG93RXF1YWwuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L2xpYi91dGlscy93cmFwQWN0aW9uQ3JlYXRvcnMuanMiLCJub2RlX21vZHVsZXMvcmVkdXgtZGV2dG9vbHMvbm9kZV9tb2R1bGVzL3JlYWN0LXJlZHV4L25vZGVfbW9kdWxlcy9ob2lzdC1ub24tcmVhY3Qtc3RhdGljcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1eC1kZXZ0b29scy9ub2RlX21vZHVsZXMvcmVhY3QtcmVkdXgvbm9kZV9tb2R1bGVzL2ludmFyaWFudC9icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O0FDRUEsSUFBTSxXQUFXLEdBQUcsRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztBQUNyRCxJQUFNLFdBQVcsR0FBRyx3QkFBd0IsQ0FBQztBQUM3QyxJQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQzs7QUFFckMsU0FBUyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUU7O0FBRXZFLGFBQVMsV0FBVyxDQUFDLE9BQU8sRUFBRTtBQUMxQixlQUFPLFVBQVMsT0FBTyxFQUFFO0FBQ3JCLGdCQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMxQyxtQkFBTyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN4QyxDQUFBO0tBQ0o7O0FBRUQsMkJBQVE7QUFDSixXQUFHLEVBQUUsV0FBVyxHQUFHLEdBQUc7QUFDdEIsY0FBTSxFQUFFLElBQUk7O0FBRVosbUJBQVcsRUFBRSxXQUFXO0FBQ3hCLFlBQUksRUFBRSxJQUFJO0FBQ1YsZUFBTyxFQUFFLFdBQVc7QUFDcEIsZUFBTyxFQUFFLGVBQWU7QUFDeEIsYUFBSyxFQUFFLFdBQVcsQ0FBQyxZQUFZLENBQUM7S0FDbkMsQ0FBQyxDQUFDO0NBQ047O0FBRUQsU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFO0FBQ25ELFFBQUksQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7Q0FDN0U7O0FBRUQsU0FBUyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFO0FBQ3BELFFBQUksQ0FBQyxNQUFNLEVBQUUsbUNBQW1DLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7Q0FDL0Y7O2tCQUVjO0FBQ1gsZUFBVyxFQUFFLFdBQVc7QUFDeEIsWUFBUSxFQUFFLFFBQVE7QUFDbEIsUUFBSSxFQUFFLElBQUk7QUFDVixPQUFHLEVBQUUsR0FBRztDQUNYOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2xDRCxJQUFNLFVBQVUsR0FBRyxtQkFBbUI7Ozs7Ozs7Ozs7QUFBQyxBQVV2QyxTQUFTLEtBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFOztBQUVqRCxhQUFTLGNBQWMsQ0FBQyxRQUFRLEVBQUU7QUFDOUIsZ0JBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0tBQy9EOztBQUVELGFBQVMsV0FBVyxDQUFDLE9BQU8sRUFBRTtBQUMxQixZQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMxQyxjQXRCQyxPQUFPLENBc0JTLFdBQVcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUN4RDs7QUFFRCxRQUFJLElBQUksR0FBRywrQkFBK0IsR0FBRyxRQUFRLEdBQUcsWUFBWSxHQUFHLFFBQVEsQ0FBQztBQUNoRixRQUFJLGdCQUFnQixFQUFFO0FBQ2xCLFlBQUksR0FBRyxJQUFJLEdBQUcsYUFBYSxHQUFHLFdBQUksUUFBUSxDQUFDO0tBQzlDOztBQUVELFVBOUJLLE9BQU8sQ0E4QkssWUFBWSxFQUFFLENBQUM7O0FBRWhDLGVBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0NBQ3hEOztBQUVELFNBQVMsTUFBTSxHQUFHOztBQUVkLG9CQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFekIsVUF2Q0ssT0FBTyxDQXVDSyxNQUFNLEVBQUUsQ0FBQzs7QUFFMUIsdUJBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3BCOztBQUVELFNBQVMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFOztBQUU3QyxRQUFNLElBQUksR0FBRztBQUNULGFBQUssRUFBRSxLQUFLO0FBQ1osZ0JBQVEsRUFBRSxRQUFRO0FBQ2xCLHdCQUFnQixFQUFFLFlBQVksR0FBRyxJQUFJLEdBQUcsS0FBSztBQUM3QyxvQkFBWSxFQUFFLFlBQVk7S0FDN0IsQ0FBQzs7QUFFRixvQkFBTSxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUU1QixVQXZESyxPQUFPLENBdURLLEtBQUssQ0FBQyxRQUFRLEVBQUUsWUFBWSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQzs7QUFFOUQsdUJBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0NBQ3hCOztBQUVELFNBQVMsbUJBQW1CLENBQUMsUUFBUSxFQUFFO0FBQ25DLFFBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUM7O0FBRWpGLFdBQU8sV0FBSSxXQUFXLEdBQUcscUNBQXFDLEdBQUcsUUFBUSxHQUNuRSxpQ0FBaUMsR0FBRyxXQUFJLFFBQVEsR0FDaEQsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO0NBQ3hDOztBQUVELFNBQVMseUJBQXlCLENBQUMsUUFBUSxFQUFFOztBQUV6QyxhQUFTLGNBQWMsQ0FBQyxRQUFRLEVBQUU7QUFDOUIsZ0JBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDNUQ7O0FBRUQsYUFBUyxXQUFXLENBQUMsT0FBTyxFQUFFO0FBQzFCLFlBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzFDLGNBNUVDLE9BQU8sQ0E0RVMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDcEU7O0FBRUQsUUFBSSxRQUFRLENBQUMsZUFBZSxLQUFLLE9BQU8sRUFBRTtBQUN0QyxlQUFPLE1BaEZOLE9BQU8sQ0FnRmdCLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLHFCQUFxQixFQUFFLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0tBQzdIOztBQUVELFFBQU0sSUFBSSxHQUFHLFdBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxHQUFHLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQzs7QUFFeEcsZUFBSSxHQUFHLENBQUMsb0NBQW9DLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztDQUNwRjs7QUFFRCxTQUFTLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUU7O0FBRS9ELGFBQVMsY0FBYyxDQUFDLFFBQVEsRUFBRTtBQUM5QixnQkFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztLQUM1RDs7QUFFRCxhQUFTLFdBQVcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQ2xDLGNBL0ZDLE9BQU8sQ0ErRlMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkQ7O0FBRUQsUUFBTSxJQUFJLEdBQUc7QUFDVCxnQkFBUSxFQUFFLFFBQVE7QUFDbEIsZ0JBQVEsRUFBRSxRQUFRO0FBQ2xCLDJCQUFtQixFQUFFLG1CQUFtQjtLQUMzQyxDQUFDOztBQUVGLFVBeEdLLE9BQU8sQ0F3R0ssd0JBQXdCLEVBQUUsQ0FBQzs7QUFFNUMsZUFBSSxJQUFJLENBQUMsOEJBQThCLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztDQUMvRTs7QUFFRCxTQUFTLFVBQVUsR0FBRztBQUNsQixRQUFNLElBQUksR0FBRyxnQkFBTSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbkMsUUFBSSxJQUFJLEVBQUU7QUFDTixnQkFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDMUQ7Q0FDSjs7Ozs7O0FBQUEsa0JBTWM7QUFDWCxTQUFLLEVBQUUsS0FBSztBQUNaLFVBQU0sRUFBRSxNQUFNO0FBQ2QsY0FBVSxFQUFFLFVBQVU7QUFDdEIsdUJBQW1CLEVBQUUsbUJBQW1CO0FBQ3hDLDZCQUF5QixFQUFFLHlCQUF5QjtBQUNwRCxvQkFBZ0IsRUFBRSxnQkFBZ0I7Q0FDckM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDOUhELElBQUksRUFBRSxHQUFHLFNBQUwsRUFBRSxDQUFhLEdBQUcsRUFBRTtBQUNwQix5QkFBVyxRQUFRLENBQUMsaUJBSmYsU0FBUyxFQUlnQixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztDQUM3QyxDQUFDOztrQkFFYSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7OztBQ1B6QixZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JiLElBQU0sWUFBWSxHQUFHLFdBZFosT0FBTyxFQWVkLFdBZjZCLGVBQWUsdUJBZXRCLEVBQ3RCLGlCQVhPLGdCQUFnQixFQVdOLEVBQUUsYUFBYSxXQVZ6QixhQUFhLEFBVVksRUFBRSxDQUFDLEVBQ25DLG1CQWZPLFFBQVEsR0FlTCxFQUNWLG1CQWhCaUIsWUFBWSxFQWdCaEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FDeEUsUUFuQmlCLFdBQVcsQ0FtQmYsQ0FBQzs7QUFFZixJQUFNLEtBQUssR0FBRyxZQUFZLG9CQUFVLENBQUM7O0FBRXJDLHFCQUFXLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRS9CLElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQzs7QUFFcEUsbUJBQVMsTUFBTSxDQUNYOzs7SUFDSTtvQkE1QkMsUUFBUTtVQTRCQyxLQUFLLEVBQUUsS0FBSyxBQUFDO1FBQ25CLHFEQUFVO0tBQ0g7SUFDWDtnQkE1QlcsVUFBVTtVQTRCVCxHQUFHLE1BQUEsRUFBQyxLQUFLLE1BQUEsRUFBQyxNQUFNLE1BQUE7UUFDeEIsc0NBN0JILFFBQVEsSUE2QkssS0FBSyxFQUFFLEtBQUssQUFBQyxFQUFDLE9BQU8sVUE3QlosVUFBVSxBQTZCZSxHQUFHO0tBQ3RDO0NBQ1gsRUFDUCxjQUFjLENBQUMsQ0FBQzs7QUFFbkIscUJBQVcsVUFBVSxFQUFFLENBQUM7Ozs7O0FDMUN4QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRTdCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7O0FBRTFCLFVBQU0sb0JBQUc7QUFDTCxlQUFROzs7O1NBQW9CLENBQUU7S0FDakM7Q0FDSixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDRmpCLFFBQVE7Y0FBUixRQUFROzthQUFSLFFBQVE7OEJBQVIsUUFBUTs7c0VBQVIsUUFBUTs7O2lCQUFSLFFBQVE7O2lDQUVEO0FBQ0wsZ0JBQUksS0FBSyxHQUFLOzs7O2FBQWlCLEFBQUUsQ0FBQztBQUNsQyxnQkFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQzVCOzs7O2FBQWtCLEdBQ3BCLElBQUksQ0FBQzs7QUFFWCxtQkFDSTtnQ0FibUIsSUFBSTs7Z0JBY25CO29DQWRxQixHQUFHO3NCQWNuQixTQUFTLEVBQUMsV0FBVztvQkFDdEI7d0NBZnNCLEdBQUc7MEJBZXBCLEVBQUUsRUFBRSxFQUFFLEFBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxBQUFDO3dCQUNmOzRDQWhCdUIsU0FBUzs7NEJBaUI1Qjs7Ozs2QkFBd0I7eUJBQ2hCO3FCQUNWO29CQUNOO3dDQXBCc0IsR0FBRzswQkFvQnBCLEVBQUUsRUFBRSxFQUFFLEFBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxBQUFDO3dCQUNmLDhDQXJCQSxLQUFLLElBcUJFLE1BQU0sRUFBRSxLQUFLLEFBQUMsRUFBQyxPQUFPLEVBQUMsTUFBTSxHQUM1QjtxQkFDTjtpQkFDSjthQUNILENBQ1Q7U0FDTDs7O1dBdkJDLFFBQVE7VUFQYSxTQUFTOztBQWlDcEMsUUFBUSxDQUFDLFNBQVMsR0FBRztBQUNqQixXQUFPLEVBQUUsT0FsQ0csU0FBUyxDQWtDRixJQUFJLENBQUMsVUFBVTtDQUNyQyxDQUFDOztBQUVGLFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUNuQixXQUFPO0FBQ0gsZUFBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLE1BbENOLFVBQVUsQ0FrQ08sYUFBYTtLQUMxRCxDQUFDO0NBQ0w7O2tCQUVjLGdCQTFDTixPQUFPLEVBMENPLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDbkNsQyxTQUFTO2NBQVQsU0FBUzs7YUFBVCxTQUFTOzhCQUFULFNBQVM7O3NFQUFULFNBQVM7OztpQkFBVCxTQUFTOztrQ0FDRDt3QkFDbUMsSUFBSSxDQUFDLElBQUk7Z0JBQTFDLGFBQWEsU0FBYixhQUFhO2dCQUFFLGFBQWEsU0FBYixhQUFhOztBQUNwQyxnQkFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzFDLGdCQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDMUMsaUNBQVcsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUN4Qzs7O21DQUVVO0FBQ1AsZ0JBQUksQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUN6Qzs7O2lDQUVRO0FBQ0wsZ0JBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN2Qzs7OzZDQUVvQixRQUFRLEVBQUU7QUFDM0IsZ0JBQU0sbUJBQW1CLEdBQUcscUJBQVcsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckUsa0JBQU0sQ0FBQyxtQkFBbUIsR0FBRyxFQUFFLFFBQVEsRUFBRSxxQkFBVyx5QkFBeUIsRUFBRSxDQUFDO0FBQ2hGLGtCQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLDBDQUEwQyxDQUFDLENBQUM7U0FDeEc7Ozs0Q0FFbUI7QUFDaEIsZ0JBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO3lCQUNRLElBQUksQ0FBQyxLQUFLO2dCQUE5RCxRQUFRLFVBQVIsUUFBUTtnQkFBRSxtQkFBbUIsVUFBbkIsbUJBQW1CO2dCQUFFLGdCQUFnQixVQUFoQixnQkFBZ0I7O0FBRXZELGlDQUFXLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztTQUMxRjs7O2lDQUVRO0FBQ0wsZ0JBQUksS0FBSyxHQUFLOzs7O2FBQWUsQUFBRSxDQUFDO0FBQ2hDLGdCQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FDMUI7Ozs7YUFBa0IsR0FDcEIsSUFBSSxDQUFDOztBQUVYLGdCQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixHQUVsQztnQ0ExQ1EsS0FBSztrQkEwQ04sTUFBTSxFQUFFLEtBQUssQUFBQyxFQUFDLE9BQU8sRUFBQyxNQUFNO2dCQUNoQzs7O29CQUNJOzs7d0JBQUc7Ozs7NEJBQWtELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUTs7eUJBQVc7O3FCQUFLO29CQUN4Rjs7OztxQkFBNEY7aUJBQzFGO2dCQUNOLDhDQS9DWCxLQUFLO0FBZ0RVLHdCQUFJLEVBQUMsTUFBTTtBQUNYLCtCQUFXLEVBQUMsV0FBVztBQUN2QiwrQkFBVyxNQUFBO0FBQ1gsdUJBQUcsRUFBQyxlQUFlLEdBQUU7Z0JBQ3pCO29DQXBESixNQUFNO3NCQW9ETSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sRUFBQyxPQUFPLEVBQUMsU0FBUyxFQUFDLFdBQVcsRUFBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQUFBQzs7aUJBRWpHO2dCQUNSLE1BQU07Z0JBQ1A7OztvQkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU87aUJBQU87YUFDM0IsR0FHSjtnQ0E1REksS0FBSztrQkE0REYsTUFBTSxFQUFFLEtBQUssQUFBQyxFQUFDLE9BQU8sRUFBQyxNQUFNO2dCQUNoQyw4Q0E3RGYsS0FBSztBQThEYyx3QkFBSSxFQUFDLE1BQU07QUFDWCwrQkFBVyxFQUFDLG1CQUFtQjtBQUMvQiwrQkFBVyxNQUFBO0FBQ1gsdUJBQUcsRUFBQyxlQUFlLEdBQUU7Z0JBQ3pCLDhDQWxFZixLQUFLO0FBbUVjLHdCQUFJLEVBQUMsVUFBVTtBQUNmLCtCQUFXLEVBQUMsVUFBVTtBQUN0QiwrQkFBVyxNQUFBO0FBQ1gsdUJBQUcsRUFBQyxlQUFlLEdBQUU7Z0JBQ3pCO29DQXZFUixNQUFNO3NCQXVFVSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sRUFBQyxPQUFPLEVBQUMsU0FBUyxFQUFDLFdBQVcsRUFBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEFBQUM7O2lCQUV2RjtnQkFDSixNQUFNO2dCQUNYOzs7b0JBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPO2lCQUFPO2dCQUMvQjtvQ0E1RVIsTUFBTTtzQkE0RVUsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLEVBQUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxXQUFXLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxBQUFDO29CQUM5RixxQ0FBRyxTQUFTLEVBQUMsZ0JBQWdCLEdBQUs7O2lCQUM3QjtnQkFDVDtvQ0EvRVIsTUFBTTtzQkErRVUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLEVBQUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxXQUFXLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxBQUFDO29CQUMvRixxQ0FBRyxTQUFTLEVBQUMsbUJBQW1CLEdBQUs7O2lCQUNoQzthQUNMLEFBQ1gsQ0FBQzs7QUFFVixtQkFDSTtnQ0F0Rm1CLElBQUk7O2dCQXVGbkI7b0NBdkZxQixHQUFHO3NCQXVGbkIsU0FBUyxFQUFDLFdBQVc7b0JBQ3RCO3dDQXhGc0IsR0FBRzswQkF3RnBCLEVBQUUsRUFBRSxFQUFFLEFBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxBQUFDO3dCQUNmOzRDQXpGdUIsU0FBUzs7NEJBMEY1Qjs7Ozs2QkFBa0M7eUJBQzFCO3FCQUNWO29CQUNOO3dDQTdGc0IsR0FBRzswQkE2RnBCLEVBQUUsRUFBRSxFQUFFLEFBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxBQUFDO3dCQUNWLE9BQU87cUJBQ1Y7aUJBQ0o7YUFDSCxDQUNUO1NBQ0w7OztXQTlGQyxTQUFTO1VBUlksU0FBUzs7QUF5R3BDLFNBQVMsQ0FBQyxTQUFTLEdBQUc7QUFDbEIscUJBQWlCLEVBQUUsT0ExR1AsU0FBUyxDQTBHUSxJQUFJLENBQUMsVUFBVTtBQUM1QyxjQUFVLEVBQUUsT0EzR0EsU0FBUyxDQTJHQyxJQUFJLENBQUMsVUFBVTtBQUNyQyxXQUFPLEVBQUUsT0E1R0csU0FBUyxDQTRHRixNQUFNO0FBQ3pCLFlBQVEsRUFBRSxPQTdHRSxTQUFTLENBNkdELE1BQU07QUFDMUIsdUJBQW1CLEVBQUUsT0E5R1QsU0FBUyxDQThHVSxNQUFNO0FBQ3JDLG9CQUFnQixFQUFFLE9BL0dOLFNBQVMsQ0ErR08sTUFBTTtDQUNyQyxDQUFDOztBQUVGLFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUNuQixXQUFPO0FBQ0gsa0JBQVUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVU7QUFDakMseUJBQWlCLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssTUFoSGhCLFVBQVUsQ0FnSGlCLGlCQUFpQixJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLE1BaEh0RSxVQUFVLENBZ0h1RSx3QkFBd0I7QUFDbEksZUFBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTztBQUMzQixnQkFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUTtBQUM3QiwyQkFBbUIsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLG1CQUFtQjtBQUNuRCx3QkFBZ0IsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQjtLQUNoRCxDQUFDO0NBQ0w7O2tCQUVjLGdCQTVITixPQUFPLEVBNEhPLE1BQU0sQ0FBQyxDQUFDLFNBQVMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDbkhuQyxXQUFXO2NBQVgsV0FBVzs7YUFBWCxXQUFXOzhCQUFYLFdBQVc7O3NFQUFYLFdBQVc7OztpQkFBWCxXQUFXOztpQ0FDSjt5QkFDc0IsSUFBSSxDQUFDLEtBQUs7Z0JBQTdCLFFBQVEsVUFBUixRQUFRO2dCQUFFLElBQUksVUFBSixJQUFJOztBQUN0QixtQkFDSTs7O2dCQUNJO0FBQ0kscUNBQWlCLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQVZyQixVQUFVLENBVXNCLGFBQWEsQUFBQztBQUMzRCw0QkFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLEFBQUMsR0FBRztnQkFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRO2dCQUNwQjt3Q0FmUCxTQUFTOztvQkFnQkUscURBQVU7aUJBQ0Y7YUFDVixDQUNSO1NBQ0w7OztXQWRDLFdBQVc7VUFWVSxTQUFTOztBQTJCcEMsV0FBVyxDQUFDLFNBQVMsR0FBRztBQUNwQixRQUFJLEVBQUUsT0E1Qk0sU0FBUyxDQTRCTCxLQUFLLENBQUM7QUFDbEIsY0FBTSxFQUFFLGdCQUFNLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUF2QkwsVUFBVSxDQXVCTSxNQUFNLENBQUM7QUFDaEQsWUFBSSxFQUFFLE9BOUJFLFNBQVMsQ0E4QkQsTUFBTTtLQUN6QixDQUFDLENBQUMsVUFBVTtDQUNoQixDQUFDOztBQUVGLFNBQVMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUNuQixXQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUMvQjs7a0JBRWMsZ0JBckNOLE9BQU8sRUFxQ08sTUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDcEMzQyxJQUFJLGNBQWMsR0FBRztBQUNqQixnQkFBWSxFQUFFLGdCQUFnQjtBQUM5QixZQUFRLEVBQUUsS0FBSztBQUNmLFVBQU0sRUFBRSxLQUFLO0FBQ2IsZ0JBQVksRUFBRSxLQUFLO0NBQ3RCLENBQUM7O0lBRUksTUFBTTtjQUFOLE1BQU07O2FBQU4sTUFBTTs4QkFBTixNQUFNOztzRUFBTixNQUFNOzs7aUJBQU4sTUFBTTs7aUNBQ0M7QUFDTCxtQkFDSTs7O2dCQUNJLHVDQUFLLEtBQUssRUFBRSxjQUFjLEFBQUMsR0FBRTtnQkFDN0I7Ozs7aUJBQXdCO2FBQ3RCLENBQ1I7U0FDTDs7O1dBUkMsTUFBTTtVQVRlLFNBQVM7O0FBb0JwQyxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ1psQixNQUFNO2NBQU4sTUFBTTs7YUFBTixNQUFNOzhCQUFOLE1BQU07O3NFQUFOLE1BQU07OztpQkFBTixNQUFNOztpQ0FFQzt5QkFDbUMsSUFBSSxDQUFDLEtBQUs7Z0JBQTFDLGlCQUFpQixVQUFqQixpQkFBaUI7Z0JBQUUsUUFBUSxVQUFSLFFBQVE7O0FBRW5DLGdCQUFJLEtBQUssR0FBRyxpQkFBaUIsR0FDdkIsQ0FDRTtnQ0FaVyxHQUFHO2tCQVlULFFBQVEsRUFBRSxrQkFBQyxHQUFHLEVBQUUsSUFBSTsrQkFBSSxtQkFBUyxFQUFFLENBQUMsSUFBSSxDQUFDO3FCQUFBLEFBQUM7Z0JBQzNDO29DQWJZLE9BQU87c0JBYVYsSUFBSSxFQUFDLE9BQU87O2lCQUFlO2dCQUNwQztvQ0FkWSxPQUFPO3NCQWNWLElBQUksRUFBQyxVQUFVOztpQkFBa0I7Z0JBQzFDO29DQWZZLE9BQU87c0JBZVYsSUFBSSxFQUFDLFFBQVE7O2lCQUFnQjthQUNwQyxFQUVOO2dDQWxCVyxHQUFHO2tCQWtCVCxLQUFLLEVBQUUsSUFBSSxBQUFDLEVBQUMsUUFBUSxFQUFFLGtCQUFDLEdBQUcsRUFBRSxJQUFJOytCQUFJLG1CQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUM7cUJBQUEsQUFBQztnQkFDeEQ7b0NBbkJZLE9BQU87c0JBbUJWLElBQUksRUFBQyxVQUFVO29CQUFHLFFBQVE7aUJBQVk7Z0JBQy9DO29DQXBCWSxPQUFPO3NCQW9CVixRQUFRLEVBQUU7bUNBQU0scUJBQVcsTUFBTSxFQUFFO3lCQUFBLEFBQUM7O2lCQUVuQzthQUNSLENBQ0gsR0FDSixDQUNDO2dDQTFCVyxHQUFHO2tCQTBCVCxRQUFRLEVBQUUsa0JBQUMsR0FBRyxFQUFFLElBQUk7K0JBQUksbUJBQVMsRUFBRSxDQUFDLElBQUksQ0FBQztxQkFBQSxBQUFDO2dCQUMzQztvQ0EzQlksT0FBTztzQkEyQlYsSUFBSSxFQUFDLFFBQVE7O2lCQUFnQjthQUNwQyxFQUVOO2dDQTlCVyxHQUFHO2tCQThCVCxLQUFLLEVBQUUsSUFBSSxBQUFDO2dCQUNiO29DQS9CWSxPQUFPO3NCQStCVixRQUFRLEVBQUU7bUNBQU0sbUJBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQzt5QkFBQSxBQUFDOztpQkFFckM7YUFDUixDQUNILENBQUM7O0FBRVosbUJBQ0k7Z0NBdENILE1BQU07O2dCQXVDQztvQ0F2Q0MsUUFBUTs7O2lCQXVDeUM7Z0JBQ2pELEtBQUs7YUFDRCxDQUNYO1NBQ0w7OztXQXRDQyxNQUFNO1VBUmUsU0FBUzs7QUFpRHBDLE1BQU0sQ0FBQyxTQUFTLEdBQUc7QUFDZixxQkFBaUIsRUFBRSxPQWxEUCxTQUFTLENBa0RRLElBQUksQ0FBQyxVQUFVO0FBQzVDLFlBQVEsRUFBRSxPQW5ERSxTQUFTLENBbURELE1BQU07Q0FDN0IsQ0FBQzs7a0JBRWEsTUFBTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNsRGYsWUFBWTtjQUFaLFlBQVk7O2FBQVosWUFBWTs4QkFBWixZQUFZOztzRUFBWixZQUFZOzs7aUJBQVosWUFBWTs7aUNBRUw7QUFDTCxtQkFDSTs7O2dCQUNJOzs7O2lCQUF1QjtnQkFDdkI7Ozs7aUJBQWtFO2FBQ2hFLENBQ1A7U0FDTjs7O1dBVEMsWUFBWTtVQUpTLFNBQVM7O2tCQWdCckIsWUFBWTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNKckIsaUJBQWlCO2NBQWpCLGlCQUFpQjs7YUFBakIsaUJBQWlCOzhCQUFqQixpQkFBaUI7O3NFQUFqQixpQkFBaUI7OztpQkFBakIsaUJBQWlCOztpQ0FDVjtBQUNMLG1CQUNJOzZCQWJILFdBQVc7O2dCQWNKO2lDQWZDLEtBQUs7c0JBZUMsSUFBSSxFQUFDLEdBQUcsRUFBQyxTQUFTLG9CQUFXO29CQUNoQywyQ0FoQlUsVUFBVSxJQWdCUixTQUFTLHFCQUFZLEdBQUU7O29CQUNuQywyQ0FqQkgsS0FBSyxJQWlCSyxJQUFJLEVBQUMsTUFBTSxFQUFDLFNBQVMsb0JBQVcsR0FBRztvQkFDMUMsMkNBbEJILEtBQUssSUFrQkssSUFBSSxFQUFDLE9BQU8sRUFBQyxTQUFTLHFCQUFZLEdBQUc7b0JBQzVDLDJDQW5CSCxLQUFLLElBbUJLLElBQUksRUFBQyxPQUFPLEVBQUMsU0FBUyx3QkFBZSxHQUFHO29CQUMvQywyQ0FwQkgsS0FBSyxJQW9CSyxJQUFJLEVBQUMsT0FBTyxFQUFDLFNBQVMscUJBQVksR0FBRztpQkFDeEM7Z0JBQ1IsMkNBdEJDLEtBQUssSUFzQkMsSUFBSSxFQUFDLEdBQUcsRUFBQyxTQUFTLHdCQUFlLEdBQUU7YUFDaEMsQ0FDaEI7U0FDTDs7O1dBZEMsaUJBQWlCO1VBWkksU0FBUzs7a0JBNkJyQixpQkFBaUI7Ozs7Ozs7O0FDN0JoQyxJQUFJLFVBQVUsQ0FBQzs7QUFFZixTQUFTLEdBQUcsQ0FBQyxLQUFLLEVBQUU7QUFDaEIsY0FBVSxHQUFHLEtBQUssQ0FBQztDQUN0Qjs7QUFFRCxTQUFTLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDdEIsV0FBTyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Q0FDN0I7O2tCQUVjO0FBQ1gsT0FBRyxFQUFFLEdBQUc7QUFDUixZQUFRLEVBQUUsUUFBUTtDQUNyQjs7Ozs7Ozs7Ozs7Ozs7O0FDVEQsSUFBTSxRQUFRLEdBQUcsV0FKUixlQUFlLEVBSVM7QUFDN0IsVUFBTSxlQUpELGtCQUFrQixBQUlHO0FBQzFCLFFBQUksUUFKQyxPQUFPLEFBSUs7Q0FDcEIsQ0FBQyxDQUFDOztrQkFFWSxRQUFROzs7Ozs7Ozs7UUNrRVAsT0FBTyxHQUFQLE9BQU87Ozs7Ozs7O0FBMUV2QixJQUFJLFFBQVEsR0FBRyxxQkFBVyxRQUFRLENBQUM7O0FBRTVCLElBQU0sVUFBVSxXQUFWLFVBQVUsR0FBRztBQUN0QixvQkFBZ0IsRUFBRSxrQkFBa0I7QUFDcEMsaUJBQWEsRUFBRSxlQUFlO0FBQzlCLHFCQUFpQixFQUFFLG1CQUFtQjtBQUN0QyxVQUFNLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsbUJBQW1CLENBQUM7Q0FDckUsQ0FBQzs7QUFFSyxJQUFNLGtCQUFrQixXQUFsQixrQkFBa0IsR0FBRztBQUM5QixXQUFPLEVBQUUsU0FBUzs7QUFFbEIsVUFBTSxFQUFFLFFBQVE7QUFDaEIsa0JBQWMsRUFBRSxnQkFBZ0I7QUFDaEMsaUJBQWEsRUFBRSxlQUFlOztBQUU5QixzQkFBa0IsRUFBRSxvQkFBb0I7QUFDeEMsOEJBQTBCLEVBQUUsNEJBQTRCO0FBQ3hELDZCQUF5QixFQUFFLDJCQUEyQjtDQUN6RCxDQUFDOztBQUVLLElBQU0sT0FBTyxXQUFQLE9BQU8sR0FBRztBQUNuQixTQUFLLEVBQUUsZUFBUyxJQUFJLEVBQUUsYUFBYSxFQUFFO0FBQ2pDLGVBQU8sUUFBUSxDQUFDO0FBQ1osZ0JBQUksRUFBRSxrQkFBa0IsQ0FBQyxNQUFNO0FBQy9CLGdCQUFJLEVBQUUsSUFBSTtBQUNWLHlCQUFhLEVBQUUsYUFBYTtTQUMvQixDQUFDLENBQUM7S0FDTjs7QUFFRCxnQkFBWSxFQUFFLHdCQUFXO0FBQ3JCLGVBQU8sUUFBUSxDQUFDO0FBQ1osZ0JBQUksRUFBRSxrQkFBa0IsQ0FBQyxjQUFjO1NBQzFDLENBQUMsQ0FBQztLQUNOOztBQUVELGVBQVcsRUFBRSxxQkFBUyxPQUFPLEVBQUU7QUFDM0IsZUFBTyxRQUFRLENBQUM7QUFDWixnQkFBSSxFQUFFLGtCQUFrQixDQUFDLGFBQWE7QUFDdEMsbUJBQU8sRUFBRSxPQUFPO1NBQ25CLENBQUMsQ0FBQztLQUNOOztBQUVELFVBQU0sRUFBRSxrQkFBVztBQUNmLGVBQU8sUUFBUSxDQUFDO0FBQ1osZ0JBQUksRUFBRSxrQkFBa0IsQ0FBQyxPQUFPO1NBQ25DLENBQUMsQ0FBQztLQUNOOztBQUVELHFCQUFpQixFQUFFLDJCQUFTLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxnQkFBZ0IsRUFBRTtBQUN6RSxlQUFPLFFBQVEsQ0FBQztBQUNaLGdCQUFJLEVBQUUsa0JBQWtCLENBQUMsa0JBQWtCO0FBQzNDLG9CQUFRLEVBQUUsUUFBUTtBQUNsQiwrQkFBbUIsRUFBRSxtQkFBbUI7QUFDeEMsNEJBQWdCLEVBQUUsZ0JBQWdCO1NBQ3JDLENBQUMsQ0FBQztLQUNOOztBQUVELDRCQUF3QixFQUFFLG9DQUFZO0FBQ2xDLGVBQU8sUUFBUSxDQUFDO0FBQ1osZ0JBQUksRUFBRSxrQkFBa0IsQ0FBQywwQkFBMEI7U0FDdEQsQ0FBQyxDQUFDO0tBQ047O0FBRUQsMkJBQXVCLEVBQUUsaUNBQVUsT0FBTyxFQUFFO0FBQ3hDLGVBQU8sUUFBUSxDQUFDO0FBQ1osZ0JBQUksRUFBRSxrQkFBa0IsQ0FBQyx5QkFBeUI7QUFDbEQsbUJBQU8sRUFBRSxPQUFPO1NBQ25CLENBQUMsQ0FBQztLQUNOO0NBQ0osQ0FBQzs7QUFFRixJQUFNLGdCQUFnQixHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOztBQUUxRCxTQUFTLE9BQU8sR0FBbUM7UUFBbEMsS0FBSyx5REFBRyxnQkFBZ0I7UUFBRSxNQUFNOztBQUNwRCxZQUFRLE1BQU0sQ0FBQyxJQUFJO0FBQ2YsYUFBSyxrQkFBa0IsQ0FBQyxNQUFNO0FBQzFCLG1CQUFPO0FBQ0gsc0JBQU0sRUFBRSxVQUFVLENBQUMsYUFBYTtBQUNoQyxvQkFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO0FBQ2pCLDBCQUFVLEVBQUUsS0FBSzthQUNwQixDQUFDOztBQUFBLEFBRU4sYUFBSyxrQkFBa0IsQ0FBQyxhQUFhO0FBQ2pDLG1CQUFPO0FBQ0gsc0JBQU0sRUFBRSxVQUFVLENBQUMsZ0JBQWdCO0FBQ25DLG9CQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7QUFDaEIsMEJBQVUsRUFBRSxJQUFJO2FBQ25CLENBQUM7O0FBQUEsQUFFTixhQUFLLGtCQUFrQixDQUFDLGFBQWE7QUFDakMsbUJBQU87QUFDSCxzQkFBTSxFQUFFLFVBQVUsQ0FBQyxnQkFBZ0I7QUFDbkMsdUJBQU8sRUFBRSxNQUFNLENBQUMsT0FBTzthQUMxQixDQUFDOztBQUFBLEFBRU4sYUFBSyxrQkFBa0IsQ0FBQyxPQUFPO0FBQzNCLG1CQUFPO0FBQ0gsc0JBQU0sRUFBRSxVQUFVLENBQUMsZ0JBQWdCO2FBQ3RDLENBQUM7O0FBQUEsQUFFTixhQUFLLGtCQUFrQixDQUFDLGtCQUFrQjtBQUN0QyxtQkFBTztBQUNILHNCQUFNLEVBQUUsVUFBVSxDQUFDLGlCQUFpQjtBQUNwQyx3QkFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO0FBQ3pCLG1DQUFtQixFQUFFLE1BQU0sQ0FBQyxtQkFBbUI7QUFDL0MsZ0NBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjtBQUN6QywwQkFBVSxFQUFFLEtBQUs7YUFDcEIsQ0FBQzs7QUFBQSxBQUVOLGFBQUssa0JBQWtCLENBQUMsMEJBQTBCO0FBQzlDLG1CQUFPO0FBQ0gsc0JBQU0sRUFBRSxVQUFVLENBQUMsaUJBQWlCO0FBQ3BDLHdCQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVE7QUFDeEIsbUNBQW1CLEVBQUUsS0FBSyxDQUFDLG1CQUFtQjtBQUM5QyxnQ0FBZ0IsRUFBRSxLQUFLLENBQUMsZ0JBQWdCO0FBQ3hDLDBCQUFVLEVBQUUsSUFBSTthQUNuQixDQUFDOztBQUFBLEFBRU4sYUFBSyxrQkFBa0IsQ0FBQyx5QkFBeUI7QUFDN0MsbUJBQU87QUFDSCxzQkFBTSxFQUFFLFVBQVUsQ0FBQyxpQkFBaUI7QUFDcEMsdUJBQU8sRUFBRSxNQUFNLENBQUMsT0FBTztBQUN2Qix3QkFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO0FBQ3hCLG1DQUFtQixFQUFFLEtBQUssQ0FBQyxtQkFBbUI7QUFDOUMsZ0NBQWdCLEVBQUUsS0FBSyxDQUFDLGdCQUFnQjthQUMzQyxDQUFDOztBQUFBLEFBRU47QUFDSSxtQkFBTyxLQUFLLENBQUM7QUFBQSxLQUNwQjtDQUNKLENBQUM7OztBQ3BJRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7O0FDREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7O0FDRkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgcmVxd2VzdCBmcm9tICdyZXF3ZXN0JztcclxuXHJcbmNvbnN0IGpzb25IZWFkZXJzID0geyAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nIH07XHJcbmNvbnN0IHNlcnZpY2VCYXNlID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAxMC8nO1xyXG5jb25zdCBjbGllbnRJZCA9ICdyZWFsVGltZVdlYkNsaWVudCc7XHJcblxyXG5mdW5jdGlvbiBjYWxsKHZlcmIsIGNvbnRlbnRUeXBlLCB1cmwsIGRhdGEsIHJlc3BvbnNlSGFuZGxlciwgZXJyb3JIYW5kbGVyKSB7XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIHBhcnNlRXJyb3JzKGhhbmRsZXIpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24ocmVxdWVzdCkge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShyZXF1ZXN0LnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIoZGF0YS5lcnJvcnMsIHJlcXVlc3QpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXF3ZXN0KHtcclxuICAgICAgICB1cmw6IHNlcnZpY2VCYXNlICsgdXJsLFxyXG4gICAgICAgIG1ldGhvZDogdmVyYixcclxuICAgICAgICAvL3R5cGU6ICdqc29uJyxcclxuICAgICAgICBjb250ZW50VHlwZTogY29udGVudFR5cGUsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBoZWFkZXJzOiBqc29uSGVhZGVycyxcclxuICAgICAgICBzdWNjZXNzOiByZXNwb25zZUhhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IHBhcnNlRXJyb3JzKGVycm9ySGFuZGxlcilcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXQodXJsLCBkYXRhLCByZXNwb25zZUhhbmRsZXIsIGVycm9ySGFuZGxlcikge1xyXG4gICAgY2FsbCgnZ2V0JywgJ2FwcGxpY2F0aW9uL2pzb24nLCB1cmwsIGRhdGEsIHJlc3BvbnNlSGFuZGxlciwgZXJyb3JIYW5kbGVyKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcG9zdCh1cmwsIGRhdGEsIHJlc3BvbnNlSGFuZGxlciwgZXJyb3JIYW5kbGVyKSB7XHJcbiAgICBjYWxsKCdwb3N0JywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcsIHVybCwgZGF0YSwgcmVzcG9uc2VIYW5kbGVyLCBlcnJvckhhbmRsZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgICBzZXJ2aWNlQmFzZTogc2VydmljZUJhc2UsXHJcbiAgICBjbGllbnRJZDogY2xpZW50SWQsXHJcbiAgICBwb3N0OiBwb3N0LFxyXG4gICAgZ2V0OiBnZXRcclxufSIsImltcG9ydCBhcGkgZnJvbSAnLi8nO1xyXG5pbXBvcnQgbmF2aWdhdGUgZnJvbSAnLi9uYXZpZ2F0ZSc7XHJcbmltcG9ydCB7IGFjdGlvbnMgYXMgdXNlclN0YXRlQWN0aW9ucyB9IGZyb20gJy4uL3N0YXRlL3VzZXInO1xyXG5pbXBvcnQgc3RvcmUgZnJvbSAnc3RvcmUnO1xyXG5cclxuLy9jb25zdCBwcm94eSA9ICQuY29ubmVjdGlvbi5tZW1iZXJzaGlwO1xyXG5jb25zdCBzdG9yYWdlS2V5ID0gJ2F1dGhvcml6YXRpb25EYXRhJztcclxuXHJcbi8vcHJveHkuY2xpZW50LkxvZ2luU3VjY2Vzc2Z1bCA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbi8vICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb24obmFtZSk7XHJcbi8vfTtcclxuXHJcbi8vZnVuY3Rpb24gbG9naW4odXNlck5hbWUsIHBhc3N3b3JkKSB7XHJcbi8vICAgIHByb3h5LnNlcnZlci5sb2dpbih1c2VyTmFtZSwgcGFzc3dvcmQpO1xyXG4vL31cclxuXHJcbmZ1bmN0aW9uIGxvZ2luKHVzZXJOYW1lLCBwYXNzd29yZCwgdXNlUmVmcmVzaFRva2Vucykge1xyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgbG9nZ2VkT24odXNlck5hbWUsIHJlc3BvbnNlLmFjY2Vzc190b2tlbiwgdXNlUmVmcmVzaFRva2Vucyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGFuZGxlRXJyb3IocmVxdWVzdCkge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gICAgICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb25GYWlsZWQoZGF0YS5lcnJvcl9kZXNjcmlwdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGRhdGEgPSAnZ3JhbnRfdHlwZT1wYXNzd29yZCZ1c2VybmFtZT0nICsgdXNlck5hbWUgKyAnJnBhc3N3b3JkPScgKyBwYXNzd29yZDtcclxuICAgIGlmICh1c2VSZWZyZXNoVG9rZW5zKSB7XHJcbiAgICAgICAgZGF0YSA9IGRhdGEgKyAnJmNsaWVudF9pZD0nICsgYXBpLmNsaWVudElkO1xyXG4gICAgfVxyXG5cclxuICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb25QZW5kaW5nKCk7XHJcblxyXG4gICAgYXBpLnBvc3QoJ3Rva2VuJywgZGF0YSwgaGFuZGxlUmVzcG9uc2UsIGhhbmRsZUVycm9yKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9nT2ZmKCkge1xyXG5cclxuICAgIHN0b3JlLnJlbW92ZShzdG9yYWdlS2V5KTtcclxuXHJcbiAgICB1c2VyU3RhdGVBY3Rpb25zLmxvZ29mZigpO1xyXG4gICAgXHJcbiAgICBuYXZpZ2F0ZS50bygnLycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2dnZWRPbih1c2VyTmFtZSwgdG9rZW4sIHJlZnJlc2hUb2tlbikge1xyXG4gICAgICAgICBcclxuICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgdG9rZW46IHRva2VuLCBcclxuICAgICAgICB1c2VyTmFtZTogdXNlck5hbWUsXHJcbiAgICAgICAgdXNlUmVmcmVzaFRva2VuczogcmVmcmVzaFRva2VuID8gdHJ1ZSA6IGZhbHNlLFxyXG4gICAgICAgIHJlZnJlc2hUb2tlbjogcmVmcmVzaFRva2VuXHJcbiAgICB9O1xyXG5cclxuICAgIHN0b3JlLnNldChzdG9yYWdlS2V5LCBkYXRhKTtcclxuICAgICAgICBcclxuICAgIHVzZXJTdGF0ZUFjdGlvbnMubG9nb24odXNlck5hbWUsIHJlZnJlc2hUb2tlbiA/IHRydWUgOiBmYWxzZSk7XHJcbiAgICBcclxuICAgIG5hdmlnYXRlLnRvKCcvaG9tZScpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBleHRlcm5hbFByb3ZpZGVyVXJsKHByb3ZpZGVyKSB7XHJcbiAgICB2YXIgcmVkaXJlY3RVcmkgPSBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0ICsgJy9BY2NvdW50L0NvbXBsZXRlJztcclxuXHJcbiAgICByZXR1cm4gYXBpLnNlcnZpY2VCYXNlICsgXCJhcGkvQWNjb3VudC9FeHRlcm5hbExvZ2luP3Byb3ZpZGVyPVwiICsgcHJvdmlkZXJcclxuICAgICAgICArIFwiJnJlc3BvbnNlX3R5cGU9dG9rZW4mY2xpZW50X2lkPVwiICsgYXBpLmNsaWVudElkXHJcbiAgICAgICAgKyBcIiZyZWRpcmVjdF91cmk9XCIgKyByZWRpcmVjdFVyaTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXh0ZXJuYWxQcm92aWRlckNvbXBsZXRlZChmcmFnbWVudCkge1xyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgbG9nZ2VkT24ocmVzcG9uc2UudXNlck5hbWUsIHJlc3BvbnNlLmFjY2Vzc190b2tlbiwgbnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGFuZGxlRXJyb3IocmVxdWVzdCkge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gICAgICAgIHVzZXJTdGF0ZUFjdGlvbnMuYXNzb2NpYXRlRXh0ZXJuYWxGYWlsZWQoZGF0YS5lcnJvcl9kZXNjcmlwdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGZyYWdtZW50Lmhhc2xvY2FsYWNjb3VudCA9PT0gJ0ZhbHNlJykge1xyXG4gICAgICAgIHJldHVybiB1c2VyU3RhdGVBY3Rpb25zLmFzc29jaWF0ZUV4dGVybmFsKGZyYWdtZW50LnByb3ZpZGVyLCBmcmFnbWVudC5leHRlcm5hbF9hY2Nlc3NfdG9rZW4sIGZyYWdtZW50LmV4dGVybmFsX3VzZXJfbmFtZSk7ICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkYXRhID0gJ3Byb3ZpZGVyPScgKyBmcmFnbWVudC5wcm92aWRlciArICcmZXh0ZXJuYWxBY2Nlc3NUb2tlbj0nICsgZnJhZ21lbnQuZXh0ZXJuYWxfYWNjZXNzX3Rva2VuO1xyXG5cclxuICAgIGFwaS5nZXQoJ2FwaS9hY2NvdW50L09idGFpbkxvY2FsQWNjZXNzVG9rZW4nLCBkYXRhLCBoYW5kbGVSZXNwb25zZSwgaGFuZGxlRXJyb3IpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWdpc3RlckV4dGVybmFsKHVzZXJOYW1lLCBwcm92aWRlciwgZXh0ZXJuYWxBY2Nlc3NUb2tlbikge1xyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVSZXNwb25zZShyZXNwb25zZSkge1xyXG4gICAgICAgIGxvZ2dlZE9uKHJlc3BvbnNlLnVzZXJOYW1lLCByZXNwb25zZS5hY2Nlc3NfdG9rZW4sIG51bGwpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGhhbmRsZUVycm9yKGVycm9ycywgcmVxdWVzdCkge1xyXG4gICAgICAgIHVzZXJTdGF0ZUFjdGlvbnMuYXNzb2NpYXRlRXh0ZXJuYWxGYWlsZWQoZXJyb3JzWzBdKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICAgIHVzZXJOYW1lOiB1c2VyTmFtZSxcclxuICAgICAgICBwcm92aWRlcjogcHJvdmlkZXIsXHJcbiAgICAgICAgZXh0ZXJuYWxBY2Nlc3NUb2tlbjogZXh0ZXJuYWxBY2Nlc3NUb2tlblxyXG4gICAgfTtcclxuXHJcbiAgICB1c2VyU3RhdGVBY3Rpb25zLmFzc29jaWF0ZUV4dGVybmFsUGVuZGluZygpO1xyXG5cclxuICAgIGFwaS5wb3N0KCdhcGkvYWNjb3VudC9yZWdpc3RlcmV4dGVybmFsJywgZGF0YSwgaGFuZGxlUmVzcG9uc2UsIGhhbmRsZUVycm9yKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcclxuICAgIGNvbnN0IGRhdGEgPSBzdG9yZS5nZXQoc3RvcmFnZUtleSk7XHJcbiAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIGxvZ2dlZE9uKGRhdGEudXNlck5hbWUsIGRhdGEudG9rZW4sIGRhdGEucmVmcmVzaFRva2VuKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8kLmNvbm5lY3Rpb24uaHViLnN0YXJ0KClcclxuLy8gICAgLmRvbmUoZnVuY3Rpb24oKXsgY29uc29sZS5sb2coJ05vdyBjb25uZWN0ZWQsIGNvbm5lY3Rpb24gSUQ9JyArICQuY29ubmVjdGlvbi5odWIuaWQpOyB9KVxyXG4vLyAgICAuZmFpbChmdW5jdGlvbigpeyBjb25zb2xlLmxvZygnQ291bGQgbm90IENvbm5lY3QhJyk7IH0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG4gICAgbG9naW46IGxvZ2luLFxyXG4gICAgbG9nT2ZmOiBsb2dPZmYsXHJcbiAgICBpbml0aWFsaXplOiBpbml0aWFsaXplLFxyXG4gICAgZXh0ZXJuYWxQcm92aWRlclVybDogZXh0ZXJuYWxQcm92aWRlclVybCxcclxuICAgIGV4dGVybmFsUHJvdmlkZXJDb21wbGV0ZWQ6IGV4dGVybmFsUHJvdmlkZXJDb21wbGV0ZWQsXHJcbiAgICByZWdpc3RlckV4dGVybmFsOiByZWdpc3RlckV4dGVybmFsXHJcbn0iLCJpbXBvcnQgeyBwdXNoU3RhdGUgfSBmcm9tICdyZWR1eC1yb3V0ZXInO1xyXG5pbXBvcnQgZGlzcGF0Y2hlciBmcm9tICcuLi9zdGF0ZS9kaXNwYXRjaGVyJztcclxuXHJcbnZhciB0byA9IGZ1bmN0aW9uICh1cmwpIHtcclxuICAgIGRpc3BhdGNoZXIuZGlzcGF0Y2gocHVzaFN0YXRlKG51bGwsIHVybCkpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgeyB0bzogdG8gfSIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCBSZWFjdERvbSBmcm9tICdyZWFjdC1kb20nO1xyXG5pbXBvcnQgeyBjb21wb3NlLCBjcmVhdGVTdG9yZSwgYXBwbHlNaWRkbGV3YXJlIH0gZnJvbSAncmVkdXgnO1xyXG5pbXBvcnQgeyBQcm92aWRlciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHsgZGV2VG9vbHMsIHBlcnNpc3RTdGF0ZSB9IGZyb20gJ3JlZHV4LWRldnRvb2xzJztcclxuaW1wb3J0IHRodW5rIGZyb20gJ3JlZHV4LXRodW5rJztcclxuaW1wb3J0IHsgRGV2VG9vbHMsIERlYnVnUGFuZWwsIExvZ01vbml0b3IgfSBmcm9tICdyZWR1eC1kZXZ0b29scy9saWIvcmVhY3QnO1xyXG5pbXBvcnQgeyByZWR1eFJlYWN0Um91dGVyIH0gZnJvbSAncmVkdXgtcm91dGVyJztcclxuaW1wb3J0IHsgY3JlYXRlSGlzdG9yeSB9IGZyb20gJ2hpc3RvcnknO1xyXG5cclxuaW1wb3J0IG1lbWJlcnNoaXAgZnJvbSAnLi9hcGkvbWVtYmVyc2hpcCc7XHJcbmltcG9ydCByZWR1Y2VycyBmcm9tICcuL3N0YXRlL3JlZHVjZXJzJztcclxuaW1wb3J0IGRpc3BhdGNoZXIgZnJvbSAnLi9zdGF0ZS9kaXNwYXRjaGVyJztcclxuXHJcbmltcG9ydCBSb3V0ZXIgZnJvbSAnLi9yb3V0ZXInO1xyXG5cclxuY29uc3Qgc3RvcmVGYWN0b3J5ID0gY29tcG9zZShcclxuICBhcHBseU1pZGRsZXdhcmUodGh1bmspLFxyXG4gIHJlZHV4UmVhY3RSb3V0ZXIoeyBjcmVhdGVIaXN0b3J5IH0pLFxyXG4gIGRldlRvb2xzKCksXHJcbiAgcGVyc2lzdFN0YXRlKHdpbmRvdy5sb2NhdGlvbi5ocmVmLm1hdGNoKC9bPyZdZGVidWdfc2Vzc2lvbj0oW14mXSspXFxiLykpXHJcbikoY3JlYXRlU3RvcmUpO1xyXG5cclxuY29uc3Qgc3RvcmUgPSBzdG9yZUZhY3RvcnkocmVkdWNlcnMpO1xyXG5cclxuZGlzcGF0Y2hlci5zZXQoc3RvcmUuZGlzcGF0Y2gpO1xyXG5cclxubGV0IGNvbnRlbnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcGxpY2F0aW9uLWNvbnRlbnQnKTtcclxuXHJcblJlYWN0RG9tLnJlbmRlcigoXHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxQcm92aWRlciBzdG9yZT17c3RvcmV9PlxyXG4gICAgICAgICAgICA8Um91dGVyIC8+XHJcbiAgICAgICAgPC9Qcm92aWRlcj4gICAgIFxyXG4gICAgICAgIDxEZWJ1Z1BhbmVsIHRvcCByaWdodCBib3R0b20+XHJcbiAgICAgICAgICAgIDxEZXZUb29scyBzdG9yZT17c3RvcmV9IG1vbml0b3I9e0xvZ01vbml0b3J9IC8+XHJcbiAgICAgICAgPC9EZWJ1Z1BhbmVsPlxyXG4gICAgPC9kaXY+XHJcbiksIGNvbnRlbnRFbGVtZW50KTtcclxuXHJcbm1lbWJlcnNoaXAuaW5pdGlhbGl6ZSgpO1xyXG5cclxuIiwibGV0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcclxuXHJcbmxldCBBYm91dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuICg8ZGl2PkFib3V0IHVzITwvZGl2Pik7XHJcbiAgICB9LFxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWJvdXQ7IiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgSW5wdXQsIEJ1dHRvbiwgUGFuZWwsIEdyaWQsIFJvdywgQ29sLCBKdW1ib3Ryb24gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5cclxuaW1wb3J0IHsgYWN0aW9ucyBhcyB1c2VyQWN0aW9ucywgdXNlclN0YXR1cyB9IGZyb20gJy4uLy4uL3N0YXRlL3VzZXInXHJcblxyXG5jbGFzcyBIb21lUGFnZSBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIHZhciB0aXRsZSA9ICggPGgyPkFjdGl2aXR5PC9oMj4gKTtcclxuICAgICAgICB2YXIgbG9hZGVyID0gdGhpcy5wcm9wcy5sb2dvblBlbmRpbmdcclxuICAgICAgICAgICAgPyAoIDxkaXY+TG9hZGluZzwvZGl2PiApXHJcbiAgICAgICAgICAgIDogbnVsbDtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPEdyaWQ+XHJcbiAgICAgICAgICAgICAgICA8Um93IGNsYXNzTmFtZT1cInNob3ctZ3JpZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxDb2wgeHM9ezEyfSBtZD17OH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxKdW1ib3Ryb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDI+SG9tZSBzd2VldCBob21lPC9oMj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9KdW1ib3Ryb24+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICAgICAgPENvbCB4cz17MTJ9IG1kPXs0fT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFBhbmVsIGhlYWRlcj17dGl0bGV9IGJzU3R5bGU9XCJpbmZvXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvUGFuZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICA8L1Jvdz5cclxuICAgICAgICAgICAgPC9HcmlkPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkhvbWVQYWdlLnByb3BUeXBlcyA9IHtcclxuICAgIGFsbG93ZWQ6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXHJcbn07XHJcblxyXG5mdW5jdGlvbiBzZWxlY3Qoc3RhdGUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYWxsb3dlZDogc3RhdGUudXNlci5zdGF0dXMgPT09IHVzZXJTdGF0dXMuYXV0aGVudGljYXRlZFxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29ubmVjdChzZWxlY3QpKEhvbWVQYWdlKTtcclxuIiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgSW5wdXQsIEJ1dHRvbiwgUGFuZWwsIEdyaWQsIFJvdywgQ29sLCBKdW1ib3Ryb24gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5cclxuaW1wb3J0IHsgYWN0aW9ucyBhcyB1c2VyQWN0aW9ucywgdXNlclN0YXR1cyB9IGZyb20gJy4uLy4uL3N0YXRlL3VzZXInXHJcbmltcG9ydCBtZW1iZXJzaGlwIGZyb20gJy4uLy4uL2FwaS9tZW1iZXJzaGlwJ1xyXG5cclxuY2xhc3MgTG9nb25QYWdlIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIG9uQ2xpY2soKSB7XHJcbiAgICAgICAgY29uc3QgeyB1c2VyTmFtZUlucHV0LCBwYXNzd29yZElucHV0IH0gPSB0aGlzLnJlZnM7XHJcbiAgICAgICAgY29uc3QgdXNlck5hbWUgPSB1c2VyTmFtZUlucHV0LmdldFZhbHVlKCk7XHJcbiAgICAgICAgY29uc3QgcGFzc3dvcmQgPSBwYXNzd29yZElucHV0LmdldFZhbHVlKCk7XHJcbiAgICAgICAgbWVtYmVyc2hpcC5sb2dpbih1c2VyTmFtZSwgcGFzc3dvcmQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBmYWNlYm9vaygpIHtcclxuICAgICAgICB0aGlzLmF1dGhFeHRlcm5hbFByb3ZpZGVyKCdGYWNlYm9vaycpO1xyXG4gICAgfVxyXG5cclxuICAgIGdvb2dsZSgpIHtcclxuICAgICAgICB0aGlzLmF1dGhFeHRlcm5hbFByb3ZpZGVyKCdHb29nbGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBhdXRoRXh0ZXJuYWxQcm92aWRlcihwcm92aWRlcikge1xyXG4gICAgICAgIGNvbnN0IGV4dGVybmFsUHJvdmlkZXJVcmwgPSBtZW1iZXJzaGlwLmV4dGVybmFsUHJvdmlkZXJVcmwocHJvdmlkZXIpO1xyXG4gICAgICAgIHdpbmRvdy5hdXRoZW50aWNhdGlvblNjb3BlID0geyBjb21wbGV0ZTogbWVtYmVyc2hpcC5leHRlcm5hbFByb3ZpZGVyQ29tcGxldGVkIH07XHJcbiAgICAgICAgd2luZG93Lm9wZW4oZXh0ZXJuYWxQcm92aWRlclVybCwgXCJBdXRoZW50aWNhdGUgQWNjb3VudFwiLCBcImxvY2F0aW9uPTAsc3RhdHVzPTAsd2lkdGg9NjAwLGhlaWdodD03NTBcIik7XHJcbiAgICB9XHJcblxyXG4gICAgYXNzb2NpYXRlRXh0ZXJuYWwoKSB7XHJcbiAgICAgICAgY29uc3QgdXNlck5hbWUgPSB0aGlzLnJlZnMudXNlck5hbWVJbnB1dC5nZXRWYWx1ZSgpO1xyXG4gICAgICAgIGNvbnN0IHsgcHJvdmlkZXIsIGV4dGVybmFsQWNjZXNzVG9rZW4sIGV4dGVybmFsVXNlck5hbWUgfSA9IHRoaXMucHJvcHM7XHJcblxyXG4gICAgICAgIG1lbWJlcnNoaXAucmVnaXN0ZXJFeHRlcm5hbCh1c2VyTmFtZSwgcHJvdmlkZXIsIGV4dGVybmFsQWNjZXNzVG9rZW4sIGV4dGVybmFsVXNlck5hbWUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgdmFyIHRpdGxlID0gKCA8aDI+TG9nIE9uPC9oMj4gKTtcclxuICAgICAgICB2YXIgbG9hZGVyID0gdGhpcy5wcm9wcy5wcm9jZXNzaW5nXHJcbiAgICAgICAgICAgID8gKCA8ZGl2PkxvYWRpbmc8L2Rpdj4gKVxyXG4gICAgICAgICAgICA6IG51bGw7XHJcblxyXG4gICAgICAgIHZhciBjb250ZW50ID0gdGhpcy5wcm9wcy5hc3NvY2lhdGVFeHRlcm5hbFxyXG4gICAgICAgICAgICA/ICggICAgICAgIFxyXG4gICAgICAgICAgICAgICAgPFBhbmVsIGhlYWRlcj17dGl0bGV9IGJzU3R5bGU9XCJpbmZvXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+PHN0cm9uZz5Zb3UgaGF2ZSBzdWNjZXNzZnVsbHkgYXV0aGVudGljYXRlZCB3aXRoIHt0aGlzLnByb3BzLnByb3ZpZGVyfSA8L3N0cm9uZz4uPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5QbGVhc2UgZW50ZXIgYSB1c2VyIG5hbWUgYmVsb3cgZm9yIHRoaXMgc2l0ZSBhbmQgY2xpY2sgdGhlIFJlZ2lzdGVyIGJ1dHRvbiB0byBsb2cgaW4uPC9wPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxJbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiVXNlciBuYW1lXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGFzRmVlZGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmPVwidXNlck5hbWVJbnB1dFwiLz5cclxuICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGJzU3R5bGU9XCJzdWNjZXNzXCIgYnpTaXplPVwibGFyZ2VcIiBjbGFzc05hbWU9XCJidG4tYmxvY2tcIiBvbkNsaWNrPXt0aGlzLmFzc29jaWF0ZUV4dGVybmFsLmJpbmQodGhpcyl9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgQnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAge2xvYWRlcn1cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2Pnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L1BhbmVsPlxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgOiAoIFxyXG4gICAgICAgICAgICAgICAgICAgIDxQYW5lbCBoZWFkZXI9e3RpdGxlfSBic1N0eWxlPVwiaW5mb1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SW5wdXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRW1haWwgb3IgdXNlcm5hbWVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRmVlZGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cInVzZXJOYW1lSW5wdXRcIi8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiUGFzc3dvcmRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRmVlZGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZj1cInBhc3N3b3JkSW5wdXRcIi8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gYnNTdHlsZT1cInN1Y2Nlc3NcIiBielNpemU9XCJsYXJnZVwiIGNsYXNzTmFtZT1cImJ0bi1ibG9ja1wiIG9uQ2xpY2s9e3RoaXMub25DbGljay5iaW5kKHRoaXMpfSA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMb2cgT25cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bG9hZGVyfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2Pnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gYnNTdHlsZT1cImZhY2Vib29rXCIgYnNTaXplPVwibGFyZ2VcIiBjbGFzc05hbWU9XCJidG4tYmxvY2tcIiBvbkNsaWNrPXt0aGlzLmZhY2Vib29rLmJpbmQodGhpcyl9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwiZmEgZmEtZmFjZWJvb2tcIj48L2k+IHwgQ29ubmVjdCB3aXRoIEZhY2Vib29rXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIGJzU3R5bGU9XCJnb29nbGUtcGx1c1wiIGJzU2l6ZT1cImxhcmdlXCIgY2xhc3NOYW1lPVwiYnRuLWJsb2NrXCIgb25DbGljaz17dGhpcy5nb29nbGUuYmluZCh0aGlzKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJmYSBmYS1nb29nbGUtcGx1c1wiPjwvaT4gfCBDb25uZWN0IHdpdGggR29vZ2xlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj4gXHJcbiAgICAgICAgICAgICAgICAgICAgPC9QYW5lbD5cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxHcmlkPlxyXG4gICAgICAgICAgICAgICAgPFJvdyBjbGFzc05hbWU9XCJzaG93LWdyaWRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8Q29sIHhzPXsxMn0gbWQ9ezh9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SnVtYm90cm9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgyPldlIHdvdWxkIGxpa2UgdG8ga25vdyB5b3U8L2gyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0p1bWJvdHJvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L0NvbD5cclxuICAgICAgICAgICAgICAgICAgICA8Q29sIHhzPXsxMn0gbWQ9ezR9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2NvbnRlbnR9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9Db2w+XHJcbiAgICAgICAgICAgICAgICA8L1Jvdz5cclxuICAgICAgICAgICAgPC9HcmlkPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkxvZ29uUGFnZS5wcm9wVHlwZXMgPSB7XHJcbiAgICBhc3NvY2lhdGVFeHRlcm5hbDogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcclxuICAgIHByb2Nlc3Npbmc6IFByb3BUeXBlcy5ib29sLmlzUmVxdWlyZWQsXHJcbiAgICBtZXNzYWdlOiBQcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgcHJvdmlkZXI6IFByb3BUeXBlcy5zdHJpbmcsXHJcbiAgICBleHRlcm5hbEFjY2Vzc1Rva2VuOiBQcm9wVHlwZXMuc3RyaW5nLFxyXG4gICAgZXh0ZXJuYWxVc2VyTmFtZTogUHJvcFR5cGVzLnN0cmluZ1xyXG59O1xyXG5cclxuZnVuY3Rpb24gc2VsZWN0KHN0YXRlKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHByb2Nlc3Npbmc6IHN0YXRlLnVzZXIucHJvY2Vzc2luZyxcclxuICAgICAgICBhc3NvY2lhdGVFeHRlcm5hbDogc3RhdGUudXNlci5zdGF0dXMgPT09IHVzZXJTdGF0dXMuYXNzb2NpYXRlRXh0ZXJuYWwgfHwgc3RhdGUudXNlci5zdGF0dXMgPT09IHVzZXJTdGF0dXMuYWNjb2NpYXRlRXh0ZXJuYWxQZW5kaW5nLFxyXG4gICAgICAgIG1lc3NhZ2U6IHN0YXRlLnVzZXIubWVzc2FnZSxcclxuICAgICAgICBwcm92aWRlcjogc3RhdGUudXNlci5wcm92aWRlcixcclxuICAgICAgICBleHRlcm5hbEFjY2Vzc1Rva2VuOiBzdGF0ZS51c2VyLmV4dGVybmFsQWNjZXNzVG9rZW4sXHJcbiAgICAgICAgZXh0ZXJuYWxVc2VyTmFtZTogc3RhdGUudXNlci5leHRlcm5hbFVzZXJOYW1lXHJcbiAgICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjb25uZWN0KHNlbGVjdCkoTG9nb25QYWdlKTtcclxuIiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBjb25uZWN0IH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5cclxuaW1wb3J0IHsgQnV0dG9uLCBQYW5lbCwgSnVtYm90cm9uIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwLWdyaWQnO1xyXG5cclxuaW1wb3J0IHsgYWN0aW9ucyBhcyB1c2VyQWN0aW9ucywgdXNlclN0YXR1cyB9IGZyb20gJy4uLy4uL3N0YXRlL3VzZXInXHJcbmltcG9ydCBIZWFkZXIgZnJvbSAnLi9oZWFkZXInO1xyXG5pbXBvcnQgRm9vdGVyIGZyb20gJy4vZm9vdGVyJztcclxuXHJcbmNsYXNzIEFwcGxpY2F0aW9uIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICBjb25zdCB7IGRpc3BhdGNoLCB1c2VyIH0gPSB0aGlzLnByb3BzO1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8SGVhZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgdXNlckF1dGhlbnRpY2F0ZWQ9e3VzZXIuc3RhdHVzID09IHVzZXJTdGF0dXMuYXV0aGVudGljYXRlZH1cclxuICAgICAgICAgICAgICAgICAgICB1c2VyTmFtZT17dXNlci5uYW1lfSAvPlxyXG4gICAgICAgICAgICAgICAge3RoaXMucHJvcHMuY2hpbGRyZW59XHJcbiAgICAgICAgICAgICAgICA8Q29udGFpbmVyPlxyXG4gICAgICAgICAgICAgICAgICAgIDxGb290ZXIgLz5cclxuICAgICAgICAgICAgICAgIDwvQ29udGFpbmVyPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5BcHBsaWNhdGlvbi5wcm9wVHlwZXMgPSB7XHJcbiAgICB1c2VyOiBQcm9wVHlwZXMuc2hhcGUoe1xyXG4gICAgICAgIHN0YXR1czogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKHVzZXJTdGF0dXMudmFsdWVzKSxcclxuICAgICAgICBuYW1lOiBQcm9wVHlwZXMuc3RyaW5nXHJcbiAgICB9KS5pc1JlcXVpcmVkXHJcbn07XHJcblxyXG5mdW5jdGlvbiBzZWxlY3Qoc3RhdGUpIHtcclxuICAgIHJldHVybiB7IHVzZXI6IHN0YXRlLnVzZXIgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY29ubmVjdChzZWxlY3QpKEFwcGxpY2F0aW9uKTsiLCJpbXBvcnQgUmVhY3QsIHsgUHJvcFR5cGVzLCBDb21wb25lbnQgfSBmcm9tICdyZWFjdCc7XHJcblxyXG52YXIgc2VwYXJhdG9yU3R5bGUgPSB7XHJcbiAgICBib3JkZXJCb3R0b206ICcxcHggc29saWQgI2NjYycsXHJcbiAgICBmb250U2l6ZTogJzFweCcsXHJcbiAgICBoZWlnaHQ6ICc4cHgnLFxyXG4gICAgbWFyZ2luQm90dG9tOiAnOHB4J1xyXG59O1xyXG5cclxuY2xhc3MgRm9vdGVyIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17c2VwYXJhdG9yU3R5bGV9Lz5cclxuICAgICAgICAgICAgICAgIDxkaXY+wqkgMjAxNSBTb2xvY288L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb290ZXI7IiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBSb3V0ZXIsIFJvdXRlLCBMaW5rIH0gZnJvbSAncmVhY3Qtcm91dGVyJ1xyXG5cclxuaW1wb3J0IHsgTmF2YmFyLCBOYXZCcmFuZCwgTmF2LCBOYXZJdGVtLCBOYXZEcm9wZG93biwgTWVudUl0ZW0gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xyXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tICdyZWFjdC1ib290c3RyYXAtZ3JpZCc7XHJcbmltcG9ydCBuYXZpZ2F0ZSBmcm9tICcuLy4uLy4uL2FwaS9uYXZpZ2F0ZSc7XHJcbmltcG9ydCBtZW1iZXJzaGlwIGZyb20gJy4vLi4vLi4vYXBpL21lbWJlcnNoaXAnO1xyXG5cclxuY2xhc3MgSGVhZGVyIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIFxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIGNvbnN0IHsgdXNlckF1dGhlbnRpY2F0ZWQsIHVzZXJOYW1lIH0gPSB0aGlzLnByb3BzO1xyXG5cclxuICAgICAgICB2YXIgaXRlbXMgPSB1c2VyQXV0aGVudGljYXRlZFxyXG4gICAgICAgICAgICA/IFsgKFxyXG4gICAgICAgICAgICAgICAgPE5hdiBvblNlbGVjdD17KGtleSwgaHJlZikgPT5uYXZpZ2F0ZS50byhocmVmKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj0nL2hvbWUnPkhvbWU8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj0nL2RldmljZXMnPkRldmljZXM8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gaHJlZj0nL2Fib3V0Jz5BYm91dDwvTmF2SXRlbT5cclxuICAgICAgICAgICAgICAgIDwvTmF2PlxyXG4gICAgICAgICAgICAgICAgKSwgKFxyXG4gICAgICAgICAgICAgICAgPE5hdiByaWdodD17dHJ1ZX0gb25TZWxlY3Q9eyhrZXksIGhyZWYpID0+bmF2aWdhdGUudG8oaHJlZil9PlxyXG4gICAgICAgICAgICAgICAgICAgIDxOYXZJdGVtIGhyZWY9Jy9wcm9maWxlJz57IHVzZXJOYW1lIH08L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICAgICAgPE5hdkl0ZW0gb25TZWxlY3Q9eygpID0+IG1lbWJlcnNoaXAubG9nT2ZmKCl9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBMb2cgT2ZmXHJcbiAgICAgICAgICAgICAgICAgICAgPC9OYXZJdGVtPlxyXG4gICAgICAgICAgICAgICAgPC9OYXY+XHJcbiAgICAgICAgICAgICAgICApIF1cclxuICAgICAgICAgICAgOiAgWyAoXHJcbiAgICAgICAgICAgICAgICA8TmF2IG9uU2VsZWN0PXsoa2V5LCBocmVmKSA9Pm5hdmlnYXRlLnRvKGhyZWYpfT5cclxuICAgICAgICAgICAgICAgICAgICA8TmF2SXRlbSBocmVmPScvYWJvdXQnPkFib3V0PC9OYXZJdGVtPlxyXG4gICAgICAgICAgICAgICAgPC9OYXY+XHJcbiAgICAgICAgICAgICAgICApLCAoXHJcbiAgICAgICAgICAgICAgICA8TmF2IHJpZ2h0PXt0cnVlfT5cclxuICAgICAgICAgICAgICAgICAgICA8TmF2SXRlbSBvblNlbGVjdD17KCkgPT4gbmF2aWdhdGUudG8oJy9sb2dvbicpfT5cclxuICAgICAgICAgICAgICAgICAgICBMb2cgT25cclxuICAgICAgICAgICAgICAgICAgICA8L05hdkl0ZW0+XHJcbiAgICAgICAgICAgICAgICA8L05hdj5cclxuICAgICAgICAgICAgICAgICkgXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPE5hdmJhcj5cclxuICAgICAgICAgICAgICAgIDxOYXZCcmFuZD5Tb2xvY28gLSBSZWFjdGl2ZSBTdGFydGVyIEtpdDwvTmF2QnJhbmQ+XHJcbiAgICAgICAgICAgICAgICB7aXRlbXN9XHJcbiAgICAgICAgICAgIDwvTmF2YmFyPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkhlYWRlci5wcm9wVHlwZXMgPSB7XHJcbiAgICB1c2VyQXV0aGVudGljYXRlZDogUHJvcFR5cGVzLmJvb2wuaXNSZXF1aXJlZCxcclxuICAgIHVzZXJOYW1lOiBQcm9wVHlwZXMuc3RyaW5nXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBIZWFkZXI7XHJcbiIsImltcG9ydCBSZWFjdCwgeyBQcm9wVHlwZXMsIENvbXBvbmVudCB9IGZyb20gJ3JlYWN0JztcclxuXHJcblxyXG5cclxuY2xhc3MgTm90Rm91bmRQYWdlIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgIDxoMT5QYWdlIG5vdCBmb3VuZDwvaDE+XHJcbiAgICAgICAgICAgICAgICA8cD5Tb3JyeSwgYnV0IHRoZSBwYWdlIHlvdSB3ZXJlIHRyeWluZyB0byB2aWV3IGRvZXMgbm90IGV4aXN0LjwvcD5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IE5vdEZvdW5kUGFnZTtcclxuIiwiaW1wb3J0IFJlYWN0LCB7IFByb3BUeXBlcywgQ29tcG9uZW50IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgeyBSb3V0ZXIsIFJvdXRlLCBMaW5rLCBJbmRleFJvdXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyJztcclxuaW1wb3J0IHsgUmVkdXhSb3V0ZXIgfSBmcm9tICdyZWR1eC1yb3V0ZXInO1xyXG5cclxuaW1wb3J0IE1haW5QYWdlIGZyb20gJy4vY29tcG9uZW50cy9NYWluUGFnZSc7XHJcbmltcG9ydCBIb21lVmlldyBmcm9tICcuL2NvbXBvbmVudHMvSG9tZVZpZXcnO1xyXG5pbXBvcnQgQWJvdXRWaWV3IGZyb20gJy4vY29tcG9uZW50cy9BYm91dFZpZXcnO1xyXG5pbXBvcnQgTG9nb25WaWV3IGZyb20gJy4vY29tcG9uZW50cy9Mb2dvblZpZXcnO1xyXG5pbXBvcnQgUmVnaXN0ZXJWaWV3IGZyb20gJy4vY29tcG9uZW50cy9SZWdpc3RlclZpZXcnO1xyXG5cclxuaW1wb3J0IE5vdEZvdW5kUGFnZSBmcm9tICcuL2NvbXBvbmVudHMvTm90Rm91bmRQYWdlJztcclxuXHJcbmNsYXNzIEFwcGxpY2F0aW9uUm91dGVyIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8UmVkdXhSb3V0ZXI+XHJcbiAgICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9cIiBjb21wb25lbnQ9e01haW5QYWdlfT5cclxuICAgICAgICAgICAgICAgICAgICA8SW5kZXhSb3V0ZSBjb21wb25lbnQ9e0xvZ29uVmlld30vPi5cclxuICAgICAgICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cImhvbWVcIiBjb21wb25lbnQ9e0hvbWVWaWV3fSAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiYWJvdXRcIiBjb21wb25lbnQ9e0Fib3V0Vmlld30gLz5cclxuICAgICAgICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cImxvZ29uXCIgY29tcG9uZW50PXtSZWdpc3RlclZpZXd9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCJsb2dvblwiIGNvbXBvbmVudD17TG9nb25WaWV3fSAvPlxyXG4gICAgICAgICAgICAgICAgPC9Sb3V0ZT5cclxuICAgICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiKlwiIGNvbXBvbmVudD17Tm90Rm91bmRQYWdlfS8+XHJcbiAgICAgICAgICAgIDwvUmVkdXhSb3V0ZXI+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQXBwbGljYXRpb25Sb3V0ZXI7XHJcbiIsInZhciBkaXNwYXRjaGVyO1xyXG5cclxuZnVuY3Rpb24gc2V0KHZhbHVlKSB7XHJcbiAgICBkaXNwYXRjaGVyID0gdmFsdWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpc3BhdGNoKGFjdGlvbikge1xyXG4gICAgcmV0dXJuIGRpc3BhdGNoZXIoYWN0aW9uKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG4gICAgc2V0OiBzZXQsXHJcbiAgICBkaXNwYXRjaDogZGlzcGF0Y2hcclxufSIsImltcG9ydCB7IGNvbWJpbmVSZWR1Y2VycyB9IGZyb20gJ3JlZHV4JztcclxuaW1wb3J0IHsgcm91dGVyU3RhdGVSZWR1Y2VyIH0gZnJvbSAncmVkdXgtcm91dGVyJztcclxuaW1wb3J0IHsgcmVkdWNlciBhcyB1c2VyUmVkdWNlciB9IGZyb20gJy4vdXNlcic7XHJcblxyXG5jb25zdCByZWR1Y2VycyA9IGNvbWJpbmVSZWR1Y2Vycyh7XHJcbiAgICByb3V0ZXI6IHJvdXRlclN0YXRlUmVkdWNlcixcclxuICAgIHVzZXI6IHVzZXJSZWR1Y2VyXHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgcmVkdWNlcnM7IiwiaW1wb3J0IGRpc3BhdGNoZXIgZnJvbSAnLi9kaXNwYXRjaGVyJztcclxudmFyIGRpc3BhdGNoID0gZGlzcGF0Y2hlci5kaXNwYXRjaDtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VyU3RhdHVzID0ge1xyXG4gICAgbm90QXV0aGVudGljYXRlZDogJ25vdEF1dGhlbnRpY2F0ZWQnLFxyXG4gICAgYXV0aGVudGljYXRlZDogJ2F1dGhlbnRpY2F0ZWQnLFxyXG4gICAgYXNzb2NpYXRlRXh0ZXJuYWw6ICdhc3NvY2lhdGVFeHRlcm5hbCcsXHJcbiAgICB2YWx1ZXM6IFsnbm90QXV0aGVudGljYXRlZCcsICdhdXRoZW50aWNhdGVkJywgJ2Fzc29jaWF0ZUV4dGVybmFsJ11cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBhY3Rpb25zRGVmaW5pdGlvbnMgPSB7XHJcbiAgICBMT0dfT0ZGOiAnTE9HX09GRicsXHJcbiAgICBcclxuICAgIExPR19PTjogJ0xPR19PTicsXHJcbiAgICBMT0dfT05fUEVORElORzogJ0xPR19PTl9QRU5ESU5HJyxcclxuICAgIExPR19PTl9GQUlMRUQ6ICdMT0dfT05fRkFJTEVEJyxcclxuXHJcbiAgICBBU1NPQ0lBVEVfRVhURVJOQUw6ICdBU1NPQ0lBVEVfRVhURVJOQUwnLFxyXG4gICAgQVNTT0NJQVRFX0VYVEVSTkFMX1BFTkRJTkc6ICdBU1NPQ0lBVEVfRVhURVJOQUxfUEVORElORycsXHJcbiAgICBBU1NPQ0lBVEVfRVhURVJOQUxfRkFJTEVEOiAnQVNTT0NJQVRFX0VYVEVSTkFMX0ZBSUxFRCdcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBhY3Rpb25zID0ge1xyXG4gICAgbG9nb246IGZ1bmN0aW9uKG5hbWUsIHJlZnJlc2hUb2tlbnMpIHtcclxuICAgICAgICByZXR1cm4gZGlzcGF0Y2goe1xyXG4gICAgICAgICAgICB0eXBlOiBhY3Rpb25zRGVmaW5pdGlvbnMuTE9HX09OLFxyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICByZWZyZXNoVG9rZW5zOiByZWZyZXNoVG9rZW5zXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvZ29uUGVuZGluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKHtcclxuICAgICAgICAgICAgdHlwZTogYWN0aW9uc0RlZmluaXRpb25zLkxPR19PTl9QRU5ESU5HXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvZ29uRmFpbGVkOiBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKHtcclxuICAgICAgICAgICAgdHlwZTogYWN0aW9uc0RlZmluaXRpb25zLkxPR19PTl9GQUlMRUQsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9nb2ZmOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gZGlzcGF0Y2goe1xyXG4gICAgICAgICAgICB0eXBlOiBhY3Rpb25zRGVmaW5pdGlvbnMuTE9HX09GRlxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBhc3NvY2lhdGVFeHRlcm5hbDogZnVuY3Rpb24ocHJvdmlkZXIsIGV4dGVybmFsQWNjZXNzVG9rZW4sIGV4dGVybmFsVXNlck5hbWUpIHtcclxuICAgICAgICByZXR1cm4gZGlzcGF0Y2goe1xyXG4gICAgICAgICAgICB0eXBlOiBhY3Rpb25zRGVmaW5pdGlvbnMuQVNTT0NJQVRFX0VYVEVSTkFMLFxyXG4gICAgICAgICAgICBwcm92aWRlcjogcHJvdmlkZXIsXHJcbiAgICAgICAgICAgIGV4dGVybmFsQWNjZXNzVG9rZW46IGV4dGVybmFsQWNjZXNzVG9rZW4sXHJcbiAgICAgICAgICAgIGV4dGVybmFsVXNlck5hbWU6IGV4dGVybmFsVXNlck5hbWVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGFzc29jaWF0ZUV4dGVybmFsUGVuZGluZzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBkaXNwYXRjaCh7XHJcbiAgICAgICAgICAgIHR5cGU6IGFjdGlvbnNEZWZpbml0aW9ucy5BU1NPQ0lBVEVfRVhURVJOQUxfUEVORElOR1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBhc3NvY2lhdGVFeHRlcm5hbEZhaWxlZDogZnVuY3Rpb24gKG1lc3NhZ2UpIHtcclxuICAgICAgICByZXR1cm4gZGlzcGF0Y2goe1xyXG4gICAgICAgICAgICB0eXBlOiBhY3Rpb25zRGVmaW5pdGlvbnMuQVNTT0NJQVRFX0VYVEVSTkFMX0ZBSUxFRCwgXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IG5vdEF1dGhlbnRpY2F0ZWQgPSB7IHN0YXR1czogdXNlclN0YXR1cy5ub3RBdXRoZW50aWNhdGVkIH07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlcihzdGF0ZSA9IG5vdEF1dGhlbnRpY2F0ZWQsIGFjdGlvbikge1xyXG4gICAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xyXG4gICAgICAgIGNhc2UgYWN0aW9uc0RlZmluaXRpb25zLkxPR19PTjpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogdXNlclN0YXR1cy5hdXRoZW50aWNhdGVkLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogYWN0aW9uLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzaW5nOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBjYXNlIGFjdGlvbnNEZWZpbml0aW9ucy5MT0dfT05fUEVORElHOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiB1c2VyU3RhdHVzLm5vdEF1dGhlbnRpY2F0ZWQsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBzdGF0ZS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc2luZzogdHJ1ZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBjYXNlIGFjdGlvbnNEZWZpbml0aW9ucy5MT0dfT05fRkFJTEVEOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiB1c2VyU3RhdHVzLm5vdEF1dGhlbnRpY2F0ZWQsIFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYWN0aW9uLm1lc3NhZ2VcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY2FzZSBhY3Rpb25zRGVmaW5pdGlvbnMuTE9HX09GRjpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogdXNlclN0YXR1cy5ub3RBdXRoZW50aWNhdGVkXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGNhc2UgYWN0aW9uc0RlZmluaXRpb25zLkFTU09DSUFURV9FWFRFUk5BTDpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogdXNlclN0YXR1cy5hc3NvY2lhdGVFeHRlcm5hbCxcclxuICAgICAgICAgICAgICAgIHByb3ZpZGVyOiBhY3Rpb24ucHJvdmlkZXIsXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbEFjY2Vzc1Rva2VuOiBhY3Rpb24uZXh0ZXJuYWxBY2Nlc3NUb2tlbixcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsVXNlck5hbWU6IGFjdGlvbi5leHRlcm5hbFVzZXJOYW1lLFxyXG4gICAgICAgICAgICAgICAgcHJvY2Vzc2luZzogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY2FzZSBhY3Rpb25zRGVmaW5pdGlvbnMuQVNTT0NJQVRFX0VYVEVSTkFMX1BFTkRJTkc6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHVzZXJTdGF0dXMuYXNzb2NpYXRlRXh0ZXJuYWwsXHJcbiAgICAgICAgICAgICAgICBwcm92aWRlcjogc3RhdGUucHJvdmlkZXIsXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbEFjY2Vzc1Rva2VuOiBzdGF0ZS5leHRlcm5hbEFjY2Vzc1Rva2VuLFxyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxVc2VyTmFtZTogc3RhdGUuZXh0ZXJuYWxVc2VyTmFtZSxcclxuICAgICAgICAgICAgICAgIHByb2Nlc3Npbmc6IHRydWVcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY2FzZSBhY3Rpb25zRGVmaW5pdGlvbnMuQVNTT0NJQVRFX0VYVEVSTkFMX0ZBSUxFRDpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogdXNlclN0YXR1cy5hc3NvY2lhdGVFeHRlcm5hbCwgXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBhY3Rpb24ubWVzc2FnZSxcclxuICAgICAgICAgICAgICAgIHByb3ZpZGVyOiBzdGF0ZS5wcm92aWRlcixcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsQWNjZXNzVG9rZW46IHN0YXRlLmV4dGVybmFsQWNjZXNzVG9rZW4sXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbFVzZXJOYW1lOiBzdGF0ZS5leHRlcm5hbFVzZXJOYW1lXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgIH1cclxufTsiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gY3JlYXRlRGV2VG9vbHM7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBfcmVhY3RSZWR1eExpYkNvbXBvbmVudHNDcmVhdGVBbGwgPSByZXF1aXJlKCdyZWFjdC1yZWR1eC9saWIvY29tcG9uZW50cy9jcmVhdGVBbGwnKTtcblxudmFyIF9yZWFjdFJlZHV4TGliQ29tcG9uZW50c0NyZWF0ZUFsbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdFJlZHV4TGliQ29tcG9uZW50c0NyZWF0ZUFsbCk7XG5cbnZhciBfZGV2VG9vbHMgPSByZXF1aXJlKCcuL2RldlRvb2xzJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZURldlRvb2xzKFJlYWN0KSB7XG4gIHZhciBQcm9wVHlwZXMgPSBSZWFjdC5Qcm9wVHlwZXM7XG4gIHZhciBDb21wb25lbnQgPSBSZWFjdC5Db21wb25lbnQ7XG5cbiAgdmFyIF9jcmVhdGVBbGwgPSBfcmVhY3RSZWR1eExpYkNvbXBvbmVudHNDcmVhdGVBbGwyWydkZWZhdWx0J10oUmVhY3QpO1xuXG4gIHZhciBjb25uZWN0ID0gX2NyZWF0ZUFsbC5jb25uZWN0O1xuXG4gIHZhciBEZXZUb29scyA9IChmdW5jdGlvbiAoX0NvbXBvbmVudCkge1xuICAgIF9pbmhlcml0cyhEZXZUb29scywgX0NvbXBvbmVudCk7XG5cbiAgICBmdW5jdGlvbiBEZXZUb29scygpIHtcbiAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfRGV2VG9vbHMpO1xuXG4gICAgICBfQ29tcG9uZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgRGV2VG9vbHMucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgIHZhciBNb25pdG9yID0gdGhpcy5wcm9wcy5tb25pdG9yO1xuXG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChNb25pdG9yLCB0aGlzLnByb3BzKTtcbiAgICB9O1xuXG4gICAgdmFyIF9EZXZUb29scyA9IERldlRvb2xzO1xuICAgIERldlRvb2xzID0gY29ubmVjdChmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9LCBfZGV2VG9vbHMuQWN0aW9uQ3JlYXRvcnMpKERldlRvb2xzKSB8fCBEZXZUb29scztcbiAgICByZXR1cm4gRGV2VG9vbHM7XG4gIH0pKENvbXBvbmVudCk7XG5cbiAgcmV0dXJuIChmdW5jdGlvbiAoX0NvbXBvbmVudDIpIHtcbiAgICBfaW5oZXJpdHMoRGV2VG9vbHNXcmFwcGVyLCBfQ29tcG9uZW50Mik7XG5cbiAgICBfY3JlYXRlQ2xhc3MoRGV2VG9vbHNXcmFwcGVyLCBudWxsLCBbe1xuICAgICAga2V5OiAncHJvcFR5cGVzJyxcbiAgICAgIHZhbHVlOiB7XG4gICAgICAgIG1vbml0b3I6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICAgIHN0b3JlOiBQcm9wVHlwZXMuc2hhcGUoe1xuICAgICAgICAgIGRldlRvb2xzU3RvcmU6IFByb3BUeXBlcy5zaGFwZSh7XG4gICAgICAgICAgICBkaXNwYXRjaDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxuICAgICAgICAgIH0pLmlzUmVxdWlyZWRcbiAgICAgICAgfSkuaXNSZXF1aXJlZFxuICAgICAgfSxcbiAgICAgIGVudW1lcmFibGU6IHRydWVcbiAgICB9XSk7XG5cbiAgICBmdW5jdGlvbiBEZXZUb29sc1dyYXBwZXIocHJvcHMsIGNvbnRleHQpIHtcbiAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBEZXZUb29sc1dyYXBwZXIpO1xuXG4gICAgICBpZiAocHJvcHMuc3RvcmUgJiYgIXByb3BzLnN0b3JlLmRldlRvb2xzU3RvcmUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQ291bGQgbm90IGZpbmQgdGhlIGRldlRvb2xzIHN0b3JlIGluc2lkZSB5b3VyIHN0b3JlLiAnICsgJ0hhdmUgeW91IGFwcGxpZWQgZGV2VG9vbHMoKSBzdG9yZSBlbmhhbmNlcj8nKTtcbiAgICAgIH1cbiAgICAgIF9Db21wb25lbnQyLmNhbGwodGhpcywgcHJvcHMsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIERldlRvb2xzV3JhcHBlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRGV2VG9vbHMsIF9leHRlbmRzKHt9LCB0aGlzLnByb3BzLCB7XG4gICAgICAgIHN0b3JlOiB0aGlzLnByb3BzLnN0b3JlLmRldlRvb2xzU3RvcmUgfSkpO1xuICAgIH07XG5cbiAgICByZXR1cm4gRGV2VG9vbHNXcmFwcGVyO1xuICB9KShDb21wb25lbnQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGRldlRvb2xzO1xudmFyIEFjdGlvblR5cGVzID0ge1xuICBQRVJGT1JNX0FDVElPTjogJ1BFUkZPUk1fQUNUSU9OJyxcbiAgUkVTRVQ6ICdSRVNFVCcsXG4gIFJPTExCQUNLOiAnUk9MTEJBQ0snLFxuICBDT01NSVQ6ICdDT01NSVQnLFxuICBTV0VFUDogJ1NXRUVQJyxcbiAgVE9HR0xFX0FDVElPTjogJ1RPR0dMRV9BQ1RJT04nLFxuICBKVU1QX1RPX1NUQVRFOiAnSlVNUF9UT19TVEFURScsXG4gIFNFVF9NT05JVE9SX1NUQVRFOiAnU0VUX01PTklUT1JfU1RBVEUnLFxuICBSRUNPTVBVVEVfU1RBVEVTOiAnUkVDT01QVVRFX1NUQVRFUydcbn07XG5cbnZhciBJTklUX0FDVElPTiA9IHtcbiAgdHlwZTogJ0BASU5JVCdcbn07XG5cbmZ1bmN0aW9uIHRvZ2dsZShvYmosIGtleSkge1xuICB2YXIgY2xvbmUgPSBfZXh0ZW5kcyh7fSwgb2JqKTtcbiAgaWYgKGNsb25lW2tleV0pIHtcbiAgICBkZWxldGUgY2xvbmVba2V5XTtcbiAgfSBlbHNlIHtcbiAgICBjbG9uZVtrZXldID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gY2xvbmU7XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIG5leHQgZW50cnkgaW4gdGhlIGxvZyBieSBhcHBseWluZyBhbiBhY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVOZXh0RW50cnkocmVkdWNlciwgYWN0aW9uLCBzdGF0ZSwgZXJyb3IpIHtcbiAgaWYgKGVycm9yKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgIGVycm9yOiAnSW50ZXJydXB0ZWQgYnkgYW4gZXJyb3IgdXAgdGhlIGNoYWluJ1xuICAgIH07XG4gIH1cblxuICB2YXIgbmV4dFN0YXRlID0gc3RhdGU7XG4gIHZhciBuZXh0RXJyb3IgPSB1bmRlZmluZWQ7XG4gIHRyeSB7XG4gICAgbmV4dFN0YXRlID0gcmVkdWNlcihzdGF0ZSwgYWN0aW9uKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbmV4dEVycm9yID0gZXJyLnRvU3RyaW5nKCk7XG4gICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2sgfHwgZXJyKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3RhdGU6IG5leHRTdGF0ZSxcbiAgICBlcnJvcjogbmV4dEVycm9yXG4gIH07XG59XG5cbi8qKlxuICogUnVucyB0aGUgcmVkdWNlciBvbiBhbGwgYWN0aW9ucyB0byBnZXQgYSBmcmVzaCBjb21wdXRhdGlvbiBsb2cuXG4gKiBJdCdzIHByb2JhYmx5IGEgZ29vZCBpZGVhIHRvIGRvIHRoaXMgb25seSBpZiB0aGUgY29kZSBoYXMgY2hhbmdlZCxcbiAqIGJ1dCB1bnRpbCB3ZSBoYXZlIHNvbWUgdGVzdHMgd2UnbGwganVzdCBkbyBpdCBldmVyeSB0aW1lIGFuIGFjdGlvbiBmaXJlcy5cbiAqL1xuZnVuY3Rpb24gcmVjb21wdXRlU3RhdGVzKHJlZHVjZXIsIGNvbW1pdHRlZFN0YXRlLCBzdGFnZWRBY3Rpb25zLCBza2lwcGVkQWN0aW9ucykge1xuICB2YXIgY29tcHV0ZWRTdGF0ZXMgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWdlZEFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYWN0aW9uID0gc3RhZ2VkQWN0aW9uc1tpXTtcblxuICAgIHZhciBwcmV2aW91c0VudHJ5ID0gY29tcHV0ZWRTdGF0ZXNbaSAtIDFdO1xuICAgIHZhciBwcmV2aW91c1N0YXRlID0gcHJldmlvdXNFbnRyeSA/IHByZXZpb3VzRW50cnkuc3RhdGUgOiBjb21taXR0ZWRTdGF0ZTtcbiAgICB2YXIgcHJldmlvdXNFcnJvciA9IHByZXZpb3VzRW50cnkgPyBwcmV2aW91c0VudHJ5LmVycm9yIDogdW5kZWZpbmVkO1xuXG4gICAgdmFyIHNob3VsZFNraXAgPSBCb29sZWFuKHNraXBwZWRBY3Rpb25zW2ldKTtcbiAgICB2YXIgZW50cnkgPSBzaG91bGRTa2lwID8gcHJldmlvdXNFbnRyeSA6IGNvbXB1dGVOZXh0RW50cnkocmVkdWNlciwgYWN0aW9uLCBwcmV2aW91c1N0YXRlLCBwcmV2aW91c0Vycm9yKTtcblxuICAgIGNvbXB1dGVkU3RhdGVzLnB1c2goZW50cnkpO1xuICB9XG5cbiAgcmV0dXJuIGNvbXB1dGVkU3RhdGVzO1xufVxuXG4vKipcbiAqIExpZnRzIHRoZSBhcHAgc3RhdGUgcmVkdWNlciBpbnRvIGEgRGV2VG9vbHMgc3RhdGUgcmVkdWNlci5cbiAqL1xuZnVuY3Rpb24gbGlmdFJlZHVjZXIocmVkdWNlciwgaW5pdGlhbFN0YXRlKSB7XG4gIHZhciBpbml0aWFsTGlmdGVkU3RhdGUgPSB7XG4gICAgY29tbWl0dGVkU3RhdGU6IGluaXRpYWxTdGF0ZSxcbiAgICBzdGFnZWRBY3Rpb25zOiBbSU5JVF9BQ1RJT05dLFxuICAgIHNraXBwZWRBY3Rpb25zOiB7fSxcbiAgICBjdXJyZW50U3RhdGVJbmRleDogMCxcbiAgICBtb25pdG9yU3RhdGU6IHtcbiAgICAgIGlzVmlzaWJsZTogdHJ1ZVxuICAgIH0sXG4gICAgdGltZXN0YW1wczogW0RhdGUubm93KCldXG4gIH07XG5cbiAgLyoqXG4gICAqIE1hbmFnZXMgaG93IHRoZSBEZXZUb29scyBhY3Rpb25zIG1vZGlmeSB0aGUgRGV2VG9vbHMgc3RhdGUuXG4gICAqL1xuICByZXR1cm4gZnVuY3Rpb24gbGlmdGVkUmVkdWNlcihsaWZ0ZWRTdGF0ZSwgbGlmdGVkQWN0aW9uKSB7XG4gICAgaWYgKGxpZnRlZFN0YXRlID09PSB1bmRlZmluZWQpIGxpZnRlZFN0YXRlID0gaW5pdGlhbExpZnRlZFN0YXRlO1xuXG4gICAgdmFyIHNob3VsZFJlY29tcHV0ZVN0YXRlcyA9IHRydWU7XG4gICAgdmFyIGNvbW1pdHRlZFN0YXRlID0gbGlmdGVkU3RhdGUuY29tbWl0dGVkU3RhdGU7XG4gICAgdmFyIHN0YWdlZEFjdGlvbnMgPSBsaWZ0ZWRTdGF0ZS5zdGFnZWRBY3Rpb25zO1xuICAgIHZhciBza2lwcGVkQWN0aW9ucyA9IGxpZnRlZFN0YXRlLnNraXBwZWRBY3Rpb25zO1xuICAgIHZhciBjb21wdXRlZFN0YXRlcyA9IGxpZnRlZFN0YXRlLmNvbXB1dGVkU3RhdGVzO1xuICAgIHZhciBjdXJyZW50U3RhdGVJbmRleCA9IGxpZnRlZFN0YXRlLmN1cnJlbnRTdGF0ZUluZGV4O1xuICAgIHZhciBtb25pdG9yU3RhdGUgPSBsaWZ0ZWRTdGF0ZS5tb25pdG9yU3RhdGU7XG4gICAgdmFyIHRpbWVzdGFtcHMgPSBsaWZ0ZWRTdGF0ZS50aW1lc3RhbXBzO1xuXG4gICAgc3dpdGNoIChsaWZ0ZWRBY3Rpb24udHlwZSkge1xuICAgICAgY2FzZSBBY3Rpb25UeXBlcy5SRVNFVDpcbiAgICAgICAgY29tbWl0dGVkU3RhdGUgPSBpbml0aWFsU3RhdGU7XG4gICAgICAgIHN0YWdlZEFjdGlvbnMgPSBbSU5JVF9BQ1RJT05dO1xuICAgICAgICBza2lwcGVkQWN0aW9ucyA9IHt9O1xuICAgICAgICBjdXJyZW50U3RhdGVJbmRleCA9IDA7XG4gICAgICAgIHRpbWVzdGFtcHMgPSBbbGlmdGVkQWN0aW9uLnRpbWVzdGFtcF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBY3Rpb25UeXBlcy5DT01NSVQ6XG4gICAgICAgIGNvbW1pdHRlZFN0YXRlID0gY29tcHV0ZWRTdGF0ZXNbY3VycmVudFN0YXRlSW5kZXhdLnN0YXRlO1xuICAgICAgICBzdGFnZWRBY3Rpb25zID0gW0lOSVRfQUNUSU9OXTtcbiAgICAgICAgc2tpcHBlZEFjdGlvbnMgPSB7fTtcbiAgICAgICAgY3VycmVudFN0YXRlSW5kZXggPSAwO1xuICAgICAgICB0aW1lc3RhbXBzID0gW2xpZnRlZEFjdGlvbi50aW1lc3RhbXBdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQWN0aW9uVHlwZXMuUk9MTEJBQ0s6XG4gICAgICAgIHN0YWdlZEFjdGlvbnMgPSBbSU5JVF9BQ1RJT05dO1xuICAgICAgICBza2lwcGVkQWN0aW9ucyA9IHt9O1xuICAgICAgICBjdXJyZW50U3RhdGVJbmRleCA9IDA7XG4gICAgICAgIHRpbWVzdGFtcHMgPSBbbGlmdGVkQWN0aW9uLnRpbWVzdGFtcF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBY3Rpb25UeXBlcy5UT0dHTEVfQUNUSU9OOlxuICAgICAgICBza2lwcGVkQWN0aW9ucyA9IHRvZ2dsZShza2lwcGVkQWN0aW9ucywgbGlmdGVkQWN0aW9uLmluZGV4KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEFjdGlvblR5cGVzLkpVTVBfVE9fU1RBVEU6XG4gICAgICAgIGN1cnJlbnRTdGF0ZUluZGV4ID0gbGlmdGVkQWN0aW9uLmluZGV4O1xuICAgICAgICAvLyBPcHRpbWl6YXRpb246IHdlIGtub3cgdGhlIGhpc3RvcnkgaGFzIG5vdCBjaGFuZ2VkLlxuICAgICAgICBzaG91bGRSZWNvbXB1dGVTdGF0ZXMgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEFjdGlvblR5cGVzLlNXRUVQOlxuICAgICAgICBzdGFnZWRBY3Rpb25zID0gc3RhZ2VkQWN0aW9ucy5maWx0ZXIoZnVuY3Rpb24gKF8sIGkpIHtcbiAgICAgICAgICByZXR1cm4gIXNraXBwZWRBY3Rpb25zW2ldO1xuICAgICAgICB9KTtcbiAgICAgICAgdGltZXN0YW1wcyA9IHRpbWVzdGFtcHMuZmlsdGVyKGZ1bmN0aW9uIChfLCBpKSB7XG4gICAgICAgICAgcmV0dXJuICFza2lwcGVkQWN0aW9uc1tpXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNraXBwZWRBY3Rpb25zID0ge307XG4gICAgICAgIGN1cnJlbnRTdGF0ZUluZGV4ID0gTWF0aC5taW4oY3VycmVudFN0YXRlSW5kZXgsIHN0YWdlZEFjdGlvbnMubGVuZ3RoIC0gMSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBY3Rpb25UeXBlcy5QRVJGT1JNX0FDVElPTjpcbiAgICAgICAgaWYgKGN1cnJlbnRTdGF0ZUluZGV4ID09PSBzdGFnZWRBY3Rpb25zLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICBjdXJyZW50U3RhdGVJbmRleCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhZ2VkQWN0aW9ucyA9IFtdLmNvbmNhdChzdGFnZWRBY3Rpb25zLCBbbGlmdGVkQWN0aW9uLmFjdGlvbl0pO1xuICAgICAgICB0aW1lc3RhbXBzID0gW10uY29uY2F0KHRpbWVzdGFtcHMsIFtsaWZ0ZWRBY3Rpb24udGltZXN0YW1wXSk7XG5cbiAgICAgICAgLy8gT3B0aW1pemF0aW9uOiB3ZSBrbm93IHRoYXQgdGhlIHBhc3QgaGFzIG5vdCBjaGFuZ2VkLlxuICAgICAgICBzaG91bGRSZWNvbXB1dGVTdGF0ZXMgPSBmYWxzZTtcbiAgICAgICAgLy8gSW5zdGVhZCBvZiByZWNvbXB1dGluZyB0aGUgc3RhdGVzLCBhcHBlbmQgdGhlIG5leHQgb25lLlxuICAgICAgICB2YXIgcHJldmlvdXNFbnRyeSA9IGNvbXB1dGVkU3RhdGVzW2NvbXB1dGVkU3RhdGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgbmV4dEVudHJ5ID0gY29tcHV0ZU5leHRFbnRyeShyZWR1Y2VyLCBsaWZ0ZWRBY3Rpb24uYWN0aW9uLCBwcmV2aW91c0VudHJ5LnN0YXRlLCBwcmV2aW91c0VudHJ5LmVycm9yKTtcbiAgICAgICAgY29tcHV0ZWRTdGF0ZXMgPSBbXS5jb25jYXQoY29tcHV0ZWRTdGF0ZXMsIFtuZXh0RW50cnldKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEFjdGlvblR5cGVzLlNFVF9NT05JVE9SX1NUQVRFOlxuICAgICAgICBtb25pdG9yU3RhdGUgPSBsaWZ0ZWRBY3Rpb24ubW9uaXRvclN0YXRlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQWN0aW9uVHlwZXMuUkVDT01QVVRFX1NUQVRFUzpcbiAgICAgICAgc3RhZ2VkQWN0aW9ucyA9IGxpZnRlZEFjdGlvbi5zdGFnZWRBY3Rpb25zO1xuICAgICAgICB0aW1lc3RhbXBzID0gbGlmdGVkQWN0aW9uLnRpbWVzdGFtcHM7XG4gICAgICAgIGNvbW1pdHRlZFN0YXRlID0gbGlmdGVkQWN0aW9uLmNvbW1pdHRlZFN0YXRlO1xuICAgICAgICBjdXJyZW50U3RhdGVJbmRleCA9IHN0YWdlZEFjdGlvbnMubGVuZ3RoIC0gMTtcbiAgICAgICAgc2tpcHBlZEFjdGlvbnMgPSB7fTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkUmVjb21wdXRlU3RhdGVzKSB7XG4gICAgICBjb21wdXRlZFN0YXRlcyA9IHJlY29tcHV0ZVN0YXRlcyhyZWR1Y2VyLCBjb21taXR0ZWRTdGF0ZSwgc3RhZ2VkQWN0aW9ucywgc2tpcHBlZEFjdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb21taXR0ZWRTdGF0ZTogY29tbWl0dGVkU3RhdGUsXG4gICAgICBzdGFnZWRBY3Rpb25zOiBzdGFnZWRBY3Rpb25zLFxuICAgICAgc2tpcHBlZEFjdGlvbnM6IHNraXBwZWRBY3Rpb25zLFxuICAgICAgY29tcHV0ZWRTdGF0ZXM6IGNvbXB1dGVkU3RhdGVzLFxuICAgICAgY3VycmVudFN0YXRlSW5kZXg6IGN1cnJlbnRTdGF0ZUluZGV4LFxuICAgICAgbW9uaXRvclN0YXRlOiBtb25pdG9yU3RhdGUsXG4gICAgICB0aW1lc3RhbXBzOiB0aW1lc3RhbXBzXG4gICAgfTtcbiAgfTtcbn1cblxuLyoqXG4gKiBMaWZ0cyBhbiBhcHAgYWN0aW9uIHRvIGEgRGV2VG9vbHMgYWN0aW9uLlxuICovXG5mdW5jdGlvbiBsaWZ0QWN0aW9uKGFjdGlvbikge1xuICB2YXIgbGlmdGVkQWN0aW9uID0ge1xuICAgIHR5cGU6IEFjdGlvblR5cGVzLlBFUkZPUk1fQUNUSU9OLFxuICAgIGFjdGlvbjogYWN0aW9uLFxuICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICB9O1xuICByZXR1cm4gbGlmdGVkQWN0aW9uO1xufVxuXG4vKipcbiAqIFVubGlmdHMgdGhlIERldlRvb2xzIHN0YXRlIHRvIHRoZSBhcHAgc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIHVubGlmdFN0YXRlKGxpZnRlZFN0YXRlKSB7XG4gIHZhciBjb21wdXRlZFN0YXRlcyA9IGxpZnRlZFN0YXRlLmNvbXB1dGVkU3RhdGVzO1xuICB2YXIgY3VycmVudFN0YXRlSW5kZXggPSBsaWZ0ZWRTdGF0ZS5jdXJyZW50U3RhdGVJbmRleDtcbiAgdmFyIHN0YXRlID0gY29tcHV0ZWRTdGF0ZXNbY3VycmVudFN0YXRlSW5kZXhdLnN0YXRlO1xuXG4gIHJldHVybiBzdGF0ZTtcbn1cblxuLyoqXG4gKiBVbmxpZnRzIHRoZSBEZXZUb29scyBzdG9yZSB0byBhY3QgbGlrZSB0aGUgYXBwJ3Mgc3RvcmUuXG4gKi9cbmZ1bmN0aW9uIHVubGlmdFN0b3JlKGxpZnRlZFN0b3JlLCByZWR1Y2VyKSB7XG4gIHZhciBsYXN0RGVmaW5lZFN0YXRlID0gdW5kZWZpbmVkO1xuICByZXR1cm4gX2V4dGVuZHMoe30sIGxpZnRlZFN0b3JlLCB7XG4gICAgZGV2VG9vbHNTdG9yZTogbGlmdGVkU3RvcmUsXG4gICAgZGlzcGF0Y2g6IGZ1bmN0aW9uIGRpc3BhdGNoKGFjdGlvbikge1xuICAgICAgbGlmdGVkU3RvcmUuZGlzcGF0Y2gobGlmdEFjdGlvbihhY3Rpb24pKTtcbiAgICAgIHJldHVybiBhY3Rpb247XG4gICAgfSxcbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24gZ2V0U3RhdGUoKSB7XG4gICAgICB2YXIgc3RhdGUgPSB1bmxpZnRTdGF0ZShsaWZ0ZWRTdG9yZS5nZXRTdGF0ZSgpKTtcbiAgICAgIGlmIChzdGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGxhc3REZWZpbmVkU3RhdGUgPSBzdGF0ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsYXN0RGVmaW5lZFN0YXRlO1xuICAgIH0sXG4gICAgZ2V0UmVkdWNlcjogZnVuY3Rpb24gZ2V0UmVkdWNlcigpIHtcbiAgICAgIHJldHVybiByZWR1Y2VyO1xuICAgIH0sXG4gICAgcmVwbGFjZVJlZHVjZXI6IGZ1bmN0aW9uIHJlcGxhY2VSZWR1Y2VyKG5leHRSZWR1Y2VyKSB7XG4gICAgICBsaWZ0ZWRTdG9yZS5yZXBsYWNlUmVkdWNlcihsaWZ0UmVkdWNlcihuZXh0UmVkdWNlcikpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICogQWN0aW9uIGNyZWF0b3JzIHRvIGNoYW5nZSB0aGUgRGV2VG9vbHMgc3RhdGUuXG4gKi9cbnZhciBBY3Rpb25DcmVhdG9ycyA9IHtcbiAgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIHJldHVybiB7IHR5cGU6IEFjdGlvblR5cGVzLlJFU0VULCB0aW1lc3RhbXA6IERhdGUubm93KCkgfTtcbiAgfSxcbiAgcm9sbGJhY2s6IGZ1bmN0aW9uIHJvbGxiYWNrKCkge1xuICAgIHJldHVybiB7IHR5cGU6IEFjdGlvblR5cGVzLlJPTExCQUNLLCB0aW1lc3RhbXA6IERhdGUubm93KCkgfTtcbiAgfSxcbiAgY29tbWl0OiBmdW5jdGlvbiBjb21taXQoKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogQWN0aW9uVHlwZXMuQ09NTUlULCB0aW1lc3RhbXA6IERhdGUubm93KCkgfTtcbiAgfSxcbiAgc3dlZXA6IGZ1bmN0aW9uIHN3ZWVwKCkge1xuICAgIHJldHVybiB7IHR5cGU6IEFjdGlvblR5cGVzLlNXRUVQIH07XG4gIH0sXG4gIHRvZ2dsZUFjdGlvbjogZnVuY3Rpb24gdG9nZ2xlQWN0aW9uKGluZGV4KSB7XG4gICAgcmV0dXJuIHsgdHlwZTogQWN0aW9uVHlwZXMuVE9HR0xFX0FDVElPTiwgaW5kZXg6IGluZGV4IH07XG4gIH0sXG4gIGp1bXBUb1N0YXRlOiBmdW5jdGlvbiBqdW1wVG9TdGF0ZShpbmRleCkge1xuICAgIHJldHVybiB7IHR5cGU6IEFjdGlvblR5cGVzLkpVTVBfVE9fU1RBVEUsIGluZGV4OiBpbmRleCB9O1xuICB9LFxuICBzZXRNb25pdG9yU3RhdGU6IGZ1bmN0aW9uIHNldE1vbml0b3JTdGF0ZShtb25pdG9yU3RhdGUpIHtcbiAgICByZXR1cm4geyB0eXBlOiBBY3Rpb25UeXBlcy5TRVRfTU9OSVRPUl9TVEFURSwgbW9uaXRvclN0YXRlOiBtb25pdG9yU3RhdGUgfTtcbiAgfSxcbiAgcmVjb21wdXRlU3RhdGVzOiBmdW5jdGlvbiByZWNvbXB1dGVTdGF0ZXMoY29tbWl0dGVkU3RhdGUsIHN0YWdlZEFjdGlvbnMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogQWN0aW9uVHlwZXMuUkVDT01QVVRFX1NUQVRFUyxcbiAgICAgIGNvbW1pdHRlZFN0YXRlOiBjb21taXR0ZWRTdGF0ZSxcbiAgICAgIHN0YWdlZEFjdGlvbnM6IHN0YWdlZEFjdGlvbnNcbiAgICB9O1xuICB9XG59O1xuXG5leHBvcnRzLkFjdGlvbkNyZWF0b3JzID0gQWN0aW9uQ3JlYXRvcnM7XG4vKipcbiAqIFJlZHV4IERldlRvb2xzIG1pZGRsZXdhcmUuXG4gKi9cblxuZnVuY3Rpb24gZGV2VG9vbHMoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAobmV4dCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAocmVkdWNlciwgaW5pdGlhbFN0YXRlKSB7XG4gICAgICB2YXIgbGlmdGVkUmVkdWNlciA9IGxpZnRSZWR1Y2VyKHJlZHVjZXIsIGluaXRpYWxTdGF0ZSk7XG4gICAgICB2YXIgbGlmdGVkU3RvcmUgPSBuZXh0KGxpZnRlZFJlZHVjZXIpO1xuICAgICAgdmFyIHN0b3JlID0gdW5saWZ0U3RvcmUobGlmdGVkU3RvcmUsIHJlZHVjZXIpO1xuICAgICAgcmV0dXJuIHN0b3JlO1xuICAgIH07XG4gIH07XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmUob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmpbJ2RlZmF1bHQnXSA6IG9iajsgfVxuXG52YXIgX2RldlRvb2xzID0gcmVxdWlyZSgnLi9kZXZUb29scycpO1xuXG5leHBvcnRzLmRldlRvb2xzID0gX2ludGVyb3BSZXF1aXJlKF9kZXZUb29scyk7XG5cbnZhciBfcGVyc2lzdFN0YXRlID0gcmVxdWlyZSgnLi9wZXJzaXN0U3RhdGUnKTtcblxuZXhwb3J0cy5wZXJzaXN0U3RhdGUgPSBfaW50ZXJvcFJlcXVpcmUoX3BlcnNpc3RTdGF0ZSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBwZXJzaXN0U3RhdGU7XG5cbmZ1bmN0aW9uIHBlcnNpc3RTdGF0ZShzZXNzaW9uSWQpIHtcbiAgdmFyIHN0YXRlRGVzZXJpYWxpemVyID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcbiAgdmFyIGFjdGlvbkRlc2VyaWFsaXplciA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMiB8fCBhcmd1bWVudHNbMl0gPT09IHVuZGVmaW5lZCA/IG51bGwgOiBhcmd1bWVudHNbMl07XG5cbiAgaWYgKCFzZXNzaW9uSWQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXh0LmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc2VyaWFsaXplU3RhdGUoZnVsbFN0YXRlKSB7XG4gICAgcmV0dXJuIF9leHRlbmRzKHt9LCBmdWxsU3RhdGUsIHtcbiAgICAgIGNvbW1pdHRlZFN0YXRlOiBzdGF0ZURlc2VyaWFsaXplcihmdWxsU3RhdGUuY29tbWl0dGVkU3RhdGUpLFxuICAgICAgY29tcHV0ZWRTdGF0ZXM6IGZ1bGxTdGF0ZS5jb21wdXRlZFN0YXRlcy5tYXAoZnVuY3Rpb24gKGNvbXB1dGVkU3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIF9leHRlbmRzKHt9LCBjb21wdXRlZFN0YXRlLCB7XG4gICAgICAgICAgc3RhdGU6IHN0YXRlRGVzZXJpYWxpemVyKGNvbXB1dGVkU3RhdGUuc3RhdGUpXG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc2VyaWFsaXplQWN0aW9ucyhmdWxsU3RhdGUpIHtcbiAgICByZXR1cm4gX2V4dGVuZHMoe30sIGZ1bGxTdGF0ZSwge1xuICAgICAgc3RhZ2VkQWN0aW9uczogZnVsbFN0YXRlLnN0YWdlZEFjdGlvbnMubWFwKGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGFjdGlvbkRlc2VyaWFsaXplcihhY3Rpb24pO1xuICAgICAgfSlcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlc2VyaWFsaXplKGZ1bGxTdGF0ZSkge1xuICAgIGlmICghZnVsbFN0YXRlKSB7XG4gICAgICByZXR1cm4gZnVsbFN0YXRlO1xuICAgIH1cbiAgICB2YXIgZGVzZXJpYWxpemVkU3RhdGUgPSBmdWxsU3RhdGU7XG4gICAgaWYgKHR5cGVvZiBzdGF0ZURlc2VyaWFsaXplciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZGVzZXJpYWxpemVkU3RhdGUgPSBkZXNlcmlhbGl6ZVN0YXRlKGRlc2VyaWFsaXplZFN0YXRlKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhY3Rpb25EZXNlcmlhbGl6ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGRlc2VyaWFsaXplZFN0YXRlID0gZGVzZXJpYWxpemVBY3Rpb25zKGRlc2VyaWFsaXplZFN0YXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZFN0YXRlO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChuZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChyZWR1Y2VyLCBpbml0aWFsU3RhdGUpIHtcbiAgICAgIHZhciBrZXkgPSAncmVkdXgtZGV2LXNlc3Npb24tJyArIHNlc3Npb25JZDtcblxuICAgICAgdmFyIGZpbmFsSW5pdGlhbFN0YXRlID0gdW5kZWZpbmVkO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZmluYWxJbml0aWFsU3RhdGUgPSBkZXNlcmlhbGl6ZShKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkpKSB8fCBpbml0aWFsU3RhdGU7XG4gICAgICAgIG5leHQocmVkdWNlciwgaW5pdGlhbFN0YXRlKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdDb3VsZCBub3QgcmVhZCBkZWJ1ZyBzZXNzaW9uIGZyb20gbG9jYWxTdG9yYWdlOicsIGUpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgZmluYWxJbml0aWFsU3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHN0b3JlID0gbmV4dChyZWR1Y2VyLCBmaW5hbEluaXRpYWxTdGF0ZSk7XG5cbiAgICAgIHJldHVybiBfZXh0ZW5kcyh7fSwgc3RvcmUsIHtcbiAgICAgICAgZGlzcGF0Y2g6IGZ1bmN0aW9uIGRpc3BhdGNoKGFjdGlvbikge1xuICAgICAgICAgIHN0b3JlLmRpc3BhdGNoKGFjdGlvbik7XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShzdG9yZS5nZXRTdGF0ZSgpKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdDb3VsZCBub3Qgd3JpdGUgZGVidWcgc2Vzc2lvbiB0byBsb2NhbFN0b3JhZ2U6JywgZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGFjdGlvbjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5leHBvcnRzLmdldERlZmF1bHRTdHlsZSA9IGdldERlZmF1bHRTdHlsZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG5mdW5jdGlvbiBnZXREZWZhdWx0U3R5bGUocHJvcHMpIHtcbiAgdmFyIGxlZnQgPSBwcm9wcy5sZWZ0O1xuICB2YXIgcmlnaHQgPSBwcm9wcy5yaWdodDtcbiAgdmFyIGJvdHRvbSA9IHByb3BzLmJvdHRvbTtcbiAgdmFyIHRvcCA9IHByb3BzLnRvcDtcblxuICBpZiAodHlwZW9mIGxlZnQgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiByaWdodCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByaWdodCA9IHRydWU7XG4gIH1cbiAgaWYgKHR5cGVvZiB0b3AgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBib3R0b20gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgYm90dG9tID0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgekluZGV4OiAxMDAwMCxcbiAgICBmb250U2l6ZTogMTcsXG4gICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgIG9wYWNpdHk6IDEsXG4gICAgY29sb3I6ICd3aGl0ZScsXG4gICAgbGVmdDogbGVmdCA/IDAgOiB1bmRlZmluZWQsXG4gICAgcmlnaHQ6IHJpZ2h0ID8gMCA6IHVuZGVmaW5lZCxcbiAgICB0b3A6IHRvcCA/IDAgOiB1bmRlZmluZWQsXG4gICAgYm90dG9tOiBib3R0b20gPyAwIDogdW5kZWZpbmVkLFxuICAgIG1heEhlaWdodDogYm90dG9tICYmIHRvcCA/ICcxMDAlJyA6ICczMCUnLFxuICAgIG1heFdpZHRoOiBsZWZ0ICYmIHJpZ2h0ID8gJzEwMCUnIDogJzMwJScsXG4gICAgd29yZFdyYXA6ICdicmVhay13b3JkJyxcbiAgICBib3hTaXppbmc6ICdib3JkZXItYm94JyxcbiAgICBib3hTaGFkb3c6ICctMnB4IDAgN3B4IDAgcmdiYSgwLCAwLCAwLCAwLjUpJ1xuICB9O1xufVxuXG52YXIgRGVidWdQYW5lbCA9IChmdW5jdGlvbiAoX0NvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoRGVidWdQYW5lbCwgX0NvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gRGVidWdQYW5lbCgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRGVidWdQYW5lbCk7XG5cbiAgICBfQ29tcG9uZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBEZWJ1Z1BhbmVsLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2RpdicsXG4gICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgdGhpcy5wcm9wcy5nZXRTdHlsZSh0aGlzLnByb3BzKSwgdGhpcy5wcm9wcy5zdHlsZSkgfSxcbiAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICApO1xuICB9O1xuXG4gIF9jcmVhdGVDbGFzcyhEZWJ1Z1BhbmVsLCBudWxsLCBbe1xuICAgIGtleTogJ3Byb3BUeXBlcycsXG4gICAgdmFsdWU6IHtcbiAgICAgIGxlZnQ6IF9yZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICAgIHJpZ2h0OiBfcmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgICBib3R0b206IF9yZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICAgIHRvcDogX3JlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgICAgZ2V0U3R5bGU6IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH0sIHtcbiAgICBrZXk6ICdkZWZhdWx0UHJvcHMnLFxuICAgIHZhbHVlOiB7XG4gICAgICBnZXRTdHlsZTogZ2V0RGVmYXVsdFN0eWxlXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH1dKTtcblxuICByZXR1cm4gRGVidWdQYW5lbDtcbn0pKF9yZWFjdC5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBEZWJ1Z1BhbmVsOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IG5ld09ialsnZGVmYXVsdCddID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX0xvZ01vbml0b3JFbnRyeSA9IHJlcXVpcmUoJy4vTG9nTW9uaXRvckVudHJ5Jyk7XG5cbnZhciBfTG9nTW9uaXRvckVudHJ5MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0xvZ01vbml0b3JFbnRyeSk7XG5cbnZhciBfTG9nTW9uaXRvckJ1dHRvbiA9IHJlcXVpcmUoJy4vTG9nTW9uaXRvckJ1dHRvbicpO1xuXG52YXIgX0xvZ01vbml0b3JCdXR0b24yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTG9nTW9uaXRvckJ1dHRvbik7XG5cbnZhciBfdGhlbWVzID0gcmVxdWlyZSgnLi90aGVtZXMnKTtcblxudmFyIHRoZW1lcyA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF90aGVtZXMpO1xuXG52YXIgc3R5bGVzID0ge1xuICBjb250YWluZXI6IHtcbiAgICBmb250RmFtaWx5OiAnbW9uYWNvLCBDb25zb2xhcywgTHVjaWRhIENvbnNvbGUsIG1vbm9zcGFjZScsXG4gICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgb3ZlcmZsb3dZOiAnaGlkZGVuJyxcbiAgICB3aWR0aDogJzEwMCUnLFxuICAgIGhlaWdodDogJzEwMCUnLFxuICAgIG1pbldpZHRoOiAzMDBcbiAgfSxcbiAgYnV0dG9uQmFyOiB7XG4gICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICBib3JkZXJCb3R0b21XaWR0aDogMSxcbiAgICBib3JkZXJCb3R0b21TdHlsZTogJ3NvbGlkJyxcbiAgICBib3JkZXJDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICB6SW5kZXg6IDEsXG4gICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgIGZsZXhEaXJlY3Rpb246ICdyb3cnXG4gIH0sXG4gIGVsZW1lbnRzOiB7XG4gICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgbGVmdDogMCxcbiAgICByaWdodDogMCxcbiAgICB0b3A6IDM4LFxuICAgIGJvdHRvbTogMCxcbiAgICBvdmVyZmxvd1g6ICdoaWRkZW4nLFxuICAgIG92ZXJmbG93WTogJ2F1dG8nXG4gIH1cbn07XG5cbnZhciBMb2dNb25pdG9yID0gKGZ1bmN0aW9uIChfQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhMb2dNb25pdG9yLCBfQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBMb2dNb25pdG9yKHByb3BzKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExvZ01vbml0b3IpO1xuXG4gICAgX0NvbXBvbmVudC5jYWxsKHRoaXMsIHByb3BzKTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVLZXlQcmVzcy5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cblxuICBMb2dNb25pdG9yLnByb3RvdHlwZS5jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzID0gZnVuY3Rpb24gY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXh0UHJvcHMpIHtcbiAgICB2YXIgbm9kZSA9IF9yZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZWxlbWVudHMpO1xuICAgIGlmICghbm9kZSkge1xuICAgICAgdGhpcy5zY3JvbGxEb3duID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuc3RhZ2VkQWN0aW9ucy5sZW5ndGggPCBuZXh0UHJvcHMuc3RhZ2VkQWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHZhciBzY3JvbGxUb3AgPSBub2RlLnNjcm9sbFRvcDtcbiAgICAgIHZhciBvZmZzZXRIZWlnaHQgPSBub2RlLm9mZnNldEhlaWdodDtcbiAgICAgIHZhciBzY3JvbGxIZWlnaHQgPSBub2RlLnNjcm9sbEhlaWdodDtcblxuICAgICAgdGhpcy5zY3JvbGxEb3duID0gTWF0aC5hYnMoc2Nyb2xsSGVpZ2h0IC0gKHNjcm9sbFRvcCArIG9mZnNldEhlaWdodCkpIDwgMjA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2Nyb2xsRG93biA9IGZhbHNlO1xuICAgIH1cbiAgfTtcblxuICBMb2dNb25pdG9yLnByb3RvdHlwZS5jb21wb25lbnREaWRVcGRhdGUgPSBmdW5jdGlvbiBjb21wb25lbnREaWRVcGRhdGUoKSB7XG4gICAgdmFyIG5vZGUgPSBfcmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLmVsZW1lbnRzKTtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2Nyb2xsRG93bikge1xuICAgICAgdmFyIG9mZnNldEhlaWdodCA9IG5vZGUub2Zmc2V0SGVpZ2h0O1xuICAgICAgdmFyIHNjcm9sbEhlaWdodCA9IG5vZGUuc2Nyb2xsSGVpZ2h0O1xuXG4gICAgICBub2RlLnNjcm9sbFRvcCA9IHNjcm9sbEhlaWdodCAtIG9mZnNldEhlaWdodDtcbiAgICAgIHRoaXMuc2Nyb2xsRG93biA9IGZhbHNlO1xuICAgIH1cbiAgfTtcblxuICBMb2dNb25pdG9yLnByb3RvdHlwZS5jb21wb25lbnRXaWxsTW91bnQgPSBmdW5jdGlvbiBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgdmFyIHZpc2libGVPbkxvYWQgPSB0aGlzLnByb3BzLnZpc2libGVPbkxvYWQ7XG4gICAgdmFyIG1vbml0b3JTdGF0ZSA9IHRoaXMucHJvcHMubW9uaXRvclN0YXRlO1xuXG4gICAgdGhpcy5wcm9wcy5zZXRNb25pdG9yU3RhdGUoX2V4dGVuZHMoe30sIG1vbml0b3JTdGF0ZSwge1xuICAgICAgaXNWaXNpYmxlOiB2aXNpYmxlT25Mb2FkXG4gICAgfSkpO1xuICB9O1xuXG4gIExvZ01vbml0b3IucHJvdG90eXBlLmhhbmRsZVJvbGxiYWNrID0gZnVuY3Rpb24gaGFuZGxlUm9sbGJhY2soKSB7XG4gICAgdGhpcy5wcm9wcy5yb2xsYmFjaygpO1xuICB9O1xuXG4gIExvZ01vbml0b3IucHJvdG90eXBlLmhhbmRsZVN3ZWVwID0gZnVuY3Rpb24gaGFuZGxlU3dlZXAoKSB7XG4gICAgdGhpcy5wcm9wcy5zd2VlcCgpO1xuICB9O1xuXG4gIExvZ01vbml0b3IucHJvdG90eXBlLmhhbmRsZUNvbW1pdCA9IGZ1bmN0aW9uIGhhbmRsZUNvbW1pdCgpIHtcbiAgICB0aGlzLnByb3BzLmNvbW1pdCgpO1xuICB9O1xuXG4gIExvZ01vbml0b3IucHJvdG90eXBlLmhhbmRsZVRvZ2dsZUFjdGlvbiA9IGZ1bmN0aW9uIGhhbmRsZVRvZ2dsZUFjdGlvbihpbmRleCkge1xuICAgIHRoaXMucHJvcHMudG9nZ2xlQWN0aW9uKGluZGV4KTtcbiAgfTtcblxuICBMb2dNb25pdG9yLnByb3RvdHlwZS5oYW5kbGVSZXNldCA9IGZ1bmN0aW9uIGhhbmRsZVJlc2V0KCkge1xuICAgIHRoaXMucHJvcHMucmVzZXQoKTtcbiAgfTtcblxuICBMb2dNb25pdG9yLnByb3RvdHlwZS5oYW5kbGVLZXlQcmVzcyA9IGZ1bmN0aW9uIGhhbmRsZUtleVByZXNzKGV2ZW50KSB7XG4gICAgdmFyIG1vbml0b3JTdGF0ZSA9IHRoaXMucHJvcHMubW9uaXRvclN0YXRlO1xuXG4gICAgaWYgKGV2ZW50LmN0cmxLZXkgJiYgZXZlbnQua2V5Q29kZSA9PT0gNzIpIHtcbiAgICAgIC8vIEN0cmwrSFxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMucHJvcHMuc2V0TW9uaXRvclN0YXRlKF9leHRlbmRzKHt9LCBtb25pdG9yU3RhdGUsIHtcbiAgICAgICAgaXNWaXNpYmxlOiAhbW9uaXRvclN0YXRlLmlzVmlzaWJsZVxuICAgICAgfSkpO1xuICAgIH1cbiAgfTtcblxuICBMb2dNb25pdG9yLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIGVsZW1lbnRzID0gW107XG4gICAgdmFyIF9wcm9wcyA9IHRoaXMucHJvcHM7XG4gICAgdmFyIG1vbml0b3JTdGF0ZSA9IF9wcm9wcy5tb25pdG9yU3RhdGU7XG4gICAgdmFyIHNraXBwZWRBY3Rpb25zID0gX3Byb3BzLnNraXBwZWRBY3Rpb25zO1xuICAgIHZhciBzdGFnZWRBY3Rpb25zID0gX3Byb3BzLnN0YWdlZEFjdGlvbnM7XG4gICAgdmFyIGNvbXB1dGVkU3RhdGVzID0gX3Byb3BzLmNvbXB1dGVkU3RhdGVzO1xuICAgIHZhciBzZWxlY3QgPSBfcHJvcHMuc2VsZWN0O1xuXG4gICAgdmFyIHRoZW1lID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy50aGVtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhlbWVzW3RoaXMucHJvcHMudGhlbWVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGVtZSA9IHRoZW1lc1t0aGlzLnByb3BzLnRoZW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybignRGV2VG9vbHMgdGhlbWUgJyArIHRoaXMucHJvcHMudGhlbWUgKyAnIG5vdCBmb3VuZCwgZGVmYXVsdGluZyB0byBuaWNpbmFib3gnKTtcbiAgICAgICAgdGhlbWUgPSB0aGVtZXMubmljaW5hYm94O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGVtZSA9IHRoaXMucHJvcHMudGhlbWU7XG4gICAgfVxuICAgIGlmICghbW9uaXRvclN0YXRlLmlzVmlzaWJsZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFnZWRBY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYWN0aW9uID0gc3RhZ2VkQWN0aW9uc1tpXTtcbiAgICAgIHZhciBfY29tcHV0ZWRTdGF0ZXMkaSA9IGNvbXB1dGVkU3RhdGVzW2ldO1xuICAgICAgdmFyIHN0YXRlID0gX2NvbXB1dGVkU3RhdGVzJGkuc3RhdGU7XG4gICAgICB2YXIgZXJyb3IgPSBfY29tcHV0ZWRTdGF0ZXMkaS5lcnJvcjtcblxuICAgICAgdmFyIHByZXZpb3VzU3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgcHJldmlvdXNTdGF0ZSA9IGNvbXB1dGVkU3RhdGVzW2kgLSAxXS5zdGF0ZTtcbiAgICAgIH1cbiAgICAgIGVsZW1lbnRzLnB1c2goX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0xvZ01vbml0b3JFbnRyeTJbJ2RlZmF1bHQnXSwgeyBrZXk6IGksXG4gICAgICAgIGluZGV4OiBpLFxuICAgICAgICB0aGVtZTogdGhlbWUsXG4gICAgICAgIHNlbGVjdDogc2VsZWN0LFxuICAgICAgICBhY3Rpb246IGFjdGlvbixcbiAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICBwcmV2aW91c1N0YXRlOiBwcmV2aW91c1N0YXRlLFxuICAgICAgICBjb2xsYXBzZWQ6IHNraXBwZWRBY3Rpb25zW2ldLFxuICAgICAgICBlcnJvcjogZXJyb3IsXG4gICAgICAgIG9uQWN0aW9uQ2xpY2s6IHRoaXMuaGFuZGxlVG9nZ2xlQWN0aW9uLmJpbmQodGhpcykgfSkpO1xuICAgIH1cblxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdkaXYnLFxuICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5jb250YWluZXIsIHsgYmFja2dyb3VuZENvbG9yOiB0aGVtZS5iYXNlMDAgfSkgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnZGl2JyxcbiAgICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5idXR0b25CYXIsIHsgYm9yZGVyQ29sb3I6IHRoZW1lLmJhc2UwMiB9KSB9LFxuICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICBfTG9nTW9uaXRvckJ1dHRvbjJbJ2RlZmF1bHQnXSxcbiAgICAgICAgICB7IHRoZW1lOiB0aGVtZSwgb25DbGljazogdGhpcy5oYW5kbGVSZXNldC5iaW5kKHRoaXMpIH0sXG4gICAgICAgICAgJ1Jlc2V0J1xuICAgICAgICApLFxuICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICBfTG9nTW9uaXRvckJ1dHRvbjJbJ2RlZmF1bHQnXSxcbiAgICAgICAgICB7IHRoZW1lOiB0aGVtZSwgb25DbGljazogdGhpcy5oYW5kbGVSb2xsYmFjay5iaW5kKHRoaXMpLCBlbmFibGVkOiBjb21wdXRlZFN0YXRlcy5sZW5ndGggfSxcbiAgICAgICAgICAnUmV2ZXJ0J1xuICAgICAgICApLFxuICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICBfTG9nTW9uaXRvckJ1dHRvbjJbJ2RlZmF1bHQnXSxcbiAgICAgICAgICB7IHRoZW1lOiB0aGVtZSwgb25DbGljazogdGhpcy5oYW5kbGVTd2VlcC5iaW5kKHRoaXMpLCBlbmFibGVkOiBPYmplY3Qua2V5cyhza2lwcGVkQWN0aW9ucykuc29tZShmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgIHJldHVybiBza2lwcGVkQWN0aW9uc1trZXldO1xuICAgICAgICAgICAgfSkgfSxcbiAgICAgICAgICAnU3dlZXAnXG4gICAgICAgICksXG4gICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgIF9Mb2dNb25pdG9yQnV0dG9uMlsnZGVmYXVsdCddLFxuICAgICAgICAgIHsgdGhlbWU6IHRoZW1lLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNvbW1pdC5iaW5kKHRoaXMpLCBlbmFibGVkOiBjb21wdXRlZFN0YXRlcy5sZW5ndGggPiAxIH0sXG4gICAgICAgICAgJ0NvbW1pdCdcbiAgICAgICAgKVxuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnZGl2JyxcbiAgICAgICAgeyBzdHlsZTogc3R5bGVzLmVsZW1lbnRzLCByZWY6ICdlbGVtZW50cycgfSxcbiAgICAgICAgZWxlbWVudHNcbiAgICAgIClcbiAgICApO1xuICB9O1xuXG4gIF9jcmVhdGVDbGFzcyhMb2dNb25pdG9yLCBudWxsLCBbe1xuICAgIGtleTogJ3Byb3BUeXBlcycsXG4gICAgdmFsdWU6IHtcbiAgICAgIGNvbXB1dGVkU3RhdGVzOiBfcmVhY3QuUHJvcFR5cGVzLmFycmF5LmlzUmVxdWlyZWQsXG4gICAgICBjdXJyZW50U3RhdGVJbmRleDogX3JlYWN0LlByb3BUeXBlcy5udW1iZXIuaXNSZXF1aXJlZCxcbiAgICAgIG1vbml0b3JTdGF0ZTogX3JlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgIHN0YWdlZEFjdGlvbnM6IF9yZWFjdC5Qcm9wVHlwZXMuYXJyYXkuaXNSZXF1aXJlZCxcbiAgICAgIHNraXBwZWRBY3Rpb25zOiBfcmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgICAgcmVzZXQ6IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgY29tbWl0OiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgIHJvbGxiYWNrOiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgIHN3ZWVwOiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgIHRvZ2dsZUFjdGlvbjogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICBqdW1wVG9TdGF0ZTogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICBzZXRNb25pdG9yU3RhdGU6IF9yZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgICAgc2VsZWN0OiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgIHZpc2libGVPbkxvYWQ6IF9yZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICAgIHRoZW1lOiBfcmVhY3QuUHJvcFR5cGVzLm9uZU9mVHlwZShbX3JlYWN0LlByb3BUeXBlcy5vYmplY3QsIF9yZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXSlcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfSwge1xuICAgIGtleTogJ2RlZmF1bHRQcm9wcycsXG4gICAgdmFsdWU6IHtcbiAgICAgIHNlbGVjdDogZnVuY3Rpb24gc2VsZWN0KHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgIH0sXG4gICAgICBtb25pdG9yU3RhdGU6IHsgaXNWaXNpYmxlOiB0cnVlIH0sXG4gICAgICB0aGVtZTogJ25pY2luYWJveCcsXG4gICAgICB2aXNpYmxlT25Mb2FkOiB0cnVlXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH1dKTtcblxuICByZXR1cm4gTG9nTW9uaXRvcjtcbn0pKF9yZWFjdC5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBMb2dNb25pdG9yO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfdXRpbHNCcmlnaHRlbiA9IHJlcXVpcmUoJy4uL3V0aWxzL2JyaWdodGVuJyk7XG5cbnZhciBfdXRpbHNCcmlnaHRlbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc0JyaWdodGVuKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYmFzZToge1xuICAgIGN1cnNvcjogJ3BvaW50ZXInLFxuICAgIGZvbnRXZWlnaHQ6ICdib2xkJyxcbiAgICBib3JkZXJSYWRpdXM6IDMsXG4gICAgcGFkZGluZzogNCxcbiAgICBtYXJnaW5MZWZ0OiAzLFxuICAgIG1hcmdpblJpZ2h0OiAzLFxuICAgIG1hcmdpblRvcDogNSxcbiAgICBtYXJnaW5Cb3R0b206IDUsXG4gICAgZmxleEdyb3c6IDEsXG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgZm9udFNpemU6ICcwLjhlbScsXG4gICAgY29sb3I6ICd3aGl0ZScsXG4gICAgdGV4dERlY29yYXRpb246ICdub25lJ1xuICB9XG59O1xuXG52YXIgTG9nTW9uaXRvckJ1dHRvbiA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoTG9nTW9uaXRvckJ1dHRvbiwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gTG9nTW9uaXRvckJ1dHRvbihwcm9wcykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMb2dNb25pdG9yQnV0dG9uKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGhvdmVyZWQ6IGZhbHNlLFxuICAgICAgYWN0aXZlOiBmYWxzZVxuICAgIH07XG4gIH1cblxuICBMb2dNb25pdG9yQnV0dG9uLnByb3RvdHlwZS5oYW5kbGVNb3VzZUVudGVyID0gZnVuY3Rpb24gaGFuZGxlTW91c2VFbnRlcigpIHtcbiAgICB0aGlzLnNldFN0YXRlKHsgaG92ZXJlZDogdHJ1ZSB9KTtcbiAgfTtcblxuICBMb2dNb25pdG9yQnV0dG9uLnByb3RvdHlwZS5oYW5kbGVNb3VzZUxlYXZlID0gZnVuY3Rpb24gaGFuZGxlTW91c2VMZWF2ZSgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHsgaG92ZXJlZDogZmFsc2UgfSk7XG4gIH07XG5cbiAgTG9nTW9uaXRvckJ1dHRvbi5wcm90b3R5cGUuaGFuZGxlTW91c2VEb3duID0gZnVuY3Rpb24gaGFuZGxlTW91c2VEb3duKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoeyBhY3RpdmU6IHRydWUgfSk7XG4gIH07XG5cbiAgTG9nTW9uaXRvckJ1dHRvbi5wcm90b3R5cGUuaGFuZGxlTW91c2VVcCA9IGZ1bmN0aW9uIGhhbmRsZU1vdXNlVXAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7IGFjdGl2ZTogZmFsc2UgfSk7XG4gIH07XG5cbiAgTG9nTW9uaXRvckJ1dHRvbi5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uIG9uQ2xpY2soKSB7XG4gICAgaWYgKCF0aGlzLnByb3BzLmVuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMub25DbGljaykge1xuICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKCk7XG4gICAgfVxuICB9O1xuXG4gIExvZ01vbml0b3JCdXR0b24ucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgc3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJhc2UsIHtcbiAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDJcbiAgICB9KTtcbiAgICBpZiAodGhpcy5wcm9wcy5lbmFibGVkICYmIHRoaXMuc3RhdGUuaG92ZXJlZCkge1xuICAgICAgc3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGUsIHtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBfdXRpbHNCcmlnaHRlbjJbJ2RlZmF1bHQnXSh0aGlzLnByb3BzLnRoZW1lLmJhc2UwMiwgMC4yKVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICghdGhpcy5wcm9wcy5lbmFibGVkKSB7XG4gICAgICBzdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZSwge1xuICAgICAgICBvcGFjaXR5OiAwLjIsXG4gICAgICAgIGN1cnNvcjogJ3RleHQnLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCdcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnYScsXG4gICAgICB7IG9uTW91c2VFbnRlcjogdGhpcy5oYW5kbGVNb3VzZUVudGVyLmJpbmQodGhpcyksXG4gICAgICAgIG9uTW91c2VMZWF2ZTogdGhpcy5oYW5kbGVNb3VzZUxlYXZlLmJpbmQodGhpcyksXG4gICAgICAgIG9uTW91c2VEb3duOiB0aGlzLmhhbmRsZU1vdXNlRG93bi5iaW5kKHRoaXMpLFxuICAgICAgICBvbk1vdXNlVXA6IHRoaXMuaGFuZGxlTW91c2VVcC5iaW5kKHRoaXMpLFxuICAgICAgICBzdHlsZTogc3R5bGUsIG9uQ2xpY2s6IHRoaXMub25DbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgKTtcbiAgfTtcblxuICByZXR1cm4gTG9nTW9uaXRvckJ1dHRvbjtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBMb2dNb25pdG9yQnV0dG9uO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RKc29uVHJlZSA9IHJlcXVpcmUoJ3JlYWN0LWpzb24tdHJlZScpO1xuXG52YXIgX3JlYWN0SnNvblRyZWUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RKc29uVHJlZSk7XG5cbnZhciBfTG9nTW9uaXRvckVudHJ5QWN0aW9uID0gcmVxdWlyZSgnLi9Mb2dNb25pdG9yRW50cnlBY3Rpb24nKTtcblxudmFyIF9Mb2dNb25pdG9yRW50cnlBY3Rpb24yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTG9nTW9uaXRvckVudHJ5QWN0aW9uKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgZW50cnk6IHtcbiAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgIFdlYmtpdFVzZXJTZWxlY3Q6ICdub25lJ1xuICB9LFxuICB0cmVlOiB7XG4gICAgcGFkZGluZ0xlZnQ6IDBcbiAgfVxufTtcblxudmFyIExvZ01vbml0b3JFbnRyeSA9IChmdW5jdGlvbiAoX0NvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoTG9nTW9uaXRvckVudHJ5LCBfQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBMb2dNb25pdG9yRW50cnkoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIExvZ01vbml0b3JFbnRyeSk7XG5cbiAgICBfQ29tcG9uZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBMb2dNb25pdG9yRW50cnkucHJvdG90eXBlLnByaW50U3RhdGUgPSBmdW5jdGlvbiBwcmludFN0YXRlKHN0YXRlLCBlcnJvcikge1xuICAgIHZhciBlcnJvclRleHQgPSBlcnJvcjtcbiAgICBpZiAoIWVycm9yVGV4dCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9yZWFjdEpzb25UcmVlMlsnZGVmYXVsdCddLCB7XG4gICAgICAgICAgdGhlbWU6IHRoaXMucHJvcHMudGhlbWUsXG4gICAgICAgICAga2V5TmFtZTogJ3N0YXRlJyxcbiAgICAgICAgICBkYXRhOiB0aGlzLnByb3BzLnNlbGVjdChzdGF0ZSksXG4gICAgICAgICAgcHJldmlvdXNEYXRhOiB0aGlzLnByb3BzLnNlbGVjdCh0aGlzLnByb3BzLnByZXZpb3VzU3RhdGUpLFxuICAgICAgICAgIHN0eWxlOiBzdHlsZXMudHJlZSB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBlcnJvclRleHQgPSAnRXJyb3Igc2VsZWN0aW5nIHN0YXRlLic7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdkaXYnLFxuICAgICAgeyBzdHlsZToge1xuICAgICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwOCxcbiAgICAgICAgICBwYWRkaW5nVG9wOiAyMCxcbiAgICAgICAgICBwYWRkaW5nTGVmdDogMzAsXG4gICAgICAgICAgcGFkZGluZ1JpZ2h0OiAzMCxcbiAgICAgICAgICBwYWRkaW5nQm90dG9tOiAzNVxuICAgICAgICB9IH0sXG4gICAgICBlcnJvclRleHRcbiAgICApO1xuICB9O1xuXG4gIExvZ01vbml0b3JFbnRyeS5wcm90b3R5cGUuaGFuZGxlQWN0aW9uQ2xpY2sgPSBmdW5jdGlvbiBoYW5kbGVBY3Rpb25DbGljaygpIHtcbiAgICB2YXIgX3Byb3BzID0gdGhpcy5wcm9wcztcbiAgICB2YXIgaW5kZXggPSBfcHJvcHMuaW5kZXg7XG4gICAgdmFyIG9uQWN0aW9uQ2xpY2sgPSBfcHJvcHMub25BY3Rpb25DbGljaztcblxuICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgIG9uQWN0aW9uQ2xpY2soaW5kZXgpO1xuICAgIH1cbiAgfTtcblxuICBMb2dNb25pdG9yRW50cnkucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgX3Byb3BzMiA9IHRoaXMucHJvcHM7XG4gICAgdmFyIGluZGV4ID0gX3Byb3BzMi5pbmRleDtcbiAgICB2YXIgZXJyb3IgPSBfcHJvcHMyLmVycm9yO1xuICAgIHZhciBhY3Rpb24gPSBfcHJvcHMyLmFjdGlvbjtcbiAgICB2YXIgc3RhdGUgPSBfcHJvcHMyLnN0YXRlO1xuICAgIHZhciBjb2xsYXBzZWQgPSBfcHJvcHMyLmNvbGxhcHNlZDtcblxuICAgIHZhciBzdHlsZUVudHJ5ID0ge1xuICAgICAgb3BhY2l0eTogY29sbGFwc2VkID8gMC41IDogMSxcbiAgICAgIGN1cnNvcjogaW5kZXggPiAwID8gJ3BvaW50ZXInIDogJ2RlZmF1bHQnXG4gICAgfTtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnZGl2JyxcbiAgICAgIHsgc3R5bGU6IHsgdGV4dERlY29yYXRpb246IGNvbGxhcHNlZCA/ICdsaW5lLXRocm91Z2gnIDogJ25vbmUnIH0gfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9Mb2dNb25pdG9yRW50cnlBY3Rpb24yWydkZWZhdWx0J10sIHtcbiAgICAgICAgdGhlbWU6IHRoaXMucHJvcHMudGhlbWUsXG4gICAgICAgIGNvbGxhcHNlZDogY29sbGFwc2VkLFxuICAgICAgICBhY3Rpb246IGFjdGlvbixcbiAgICAgICAgb25DbGljazogdGhpcy5oYW5kbGVBY3Rpb25DbGljay5iaW5kKHRoaXMpLFxuICAgICAgICBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5lbnRyeSwgc3R5bGVFbnRyeSkgfSksXG4gICAgICAhY29sbGFwc2VkICYmIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnZGl2JyxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgdGhpcy5wcmludFN0YXRlKHN0YXRlLCBlcnJvcilcbiAgICAgIClcbiAgICApO1xuICB9O1xuXG4gIF9jcmVhdGVDbGFzcyhMb2dNb25pdG9yRW50cnksIG51bGwsIFt7XG4gICAga2V5OiAncHJvcFR5cGVzJyxcbiAgICB2YWx1ZToge1xuICAgICAgaW5kZXg6IF9yZWFjdC5Qcm9wVHlwZXMubnVtYmVyLmlzUmVxdWlyZWQsXG4gICAgICBzdGF0ZTogX3JlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgIGFjdGlvbjogX3JlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAgIHNlbGVjdDogX3JlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgICBlcnJvcjogX3JlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgICBvbkFjdGlvbkNsaWNrOiBfcmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAgIGNvbGxhcHNlZDogX3JlYWN0LlByb3BUeXBlcy5ib29sXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH1dKTtcblxuICByZXR1cm4gTG9nTW9uaXRvckVudHJ5O1xufSkoX3JlYWN0LkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IExvZ01vbml0b3JFbnRyeTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMob2JqLCBrZXlzKSB7IHZhciB0YXJnZXQgPSB7fTsgZm9yICh2YXIgaSBpbiBvYmopIHsgaWYgKGtleXMuaW5kZXhPZihpKSA+PSAwKSBjb250aW51ZTsgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBpKSkgY29udGludWU7IHRhcmdldFtpXSA9IG9ialtpXTsgfSByZXR1cm4gdGFyZ2V0OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RKc29uVHJlZSA9IHJlcXVpcmUoJ3JlYWN0LWpzb24tdHJlZScpO1xuXG52YXIgX3JlYWN0SnNvblRyZWUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RKc29uVHJlZSk7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGFjdGlvbkJhcjoge1xuICAgIHBhZGRpbmdUb3A6IDgsXG4gICAgcGFkZGluZ0JvdHRvbTogNyxcbiAgICBwYWRkaW5nTGVmdDogMTZcbiAgfSxcbiAgcGF5bG9hZDoge1xuICAgIG1hcmdpbjogMCxcbiAgICBvdmVyZmxvdzogJ2F1dG8nXG4gIH1cbn07XG5cbnZhciBMb2dNb25pdG9yQWN0aW9uID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhMb2dNb25pdG9yQWN0aW9uLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBMb2dNb25pdG9yQWN0aW9uKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMb2dNb25pdG9yQWN0aW9uKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIExvZ01vbml0b3JBY3Rpb24ucHJvdG90eXBlLnJlbmRlclBheWxvYWQgPSBmdW5jdGlvbiByZW5kZXJQYXlsb2FkKHBheWxvYWQpIHtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnZGl2JyxcbiAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMucGF5bG9hZCwge1xuICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDBcbiAgICAgICAgfSkgfSxcbiAgICAgIE9iamVjdC5rZXlzKHBheWxvYWQpLmxlbmd0aCA+IDAgPyBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfcmVhY3RKc29uVHJlZTJbJ2RlZmF1bHQnXSwgeyB0aGVtZTogdGhpcy5wcm9wcy50aGVtZSwga2V5TmFtZTogJ2FjdGlvbicsIGRhdGE6IHBheWxvYWQgfSkgOiAnJ1xuICAgICk7XG4gIH07XG5cbiAgTG9nTW9uaXRvckFjdGlvbi5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBfcHJvcHMkYWN0aW9uID0gdGhpcy5wcm9wcy5hY3Rpb247XG4gICAgdmFyIHR5cGUgPSBfcHJvcHMkYWN0aW9uLnR5cGU7XG5cbiAgICB2YXIgcGF5bG9hZCA9IF9vYmplY3RXaXRob3V0UHJvcGVydGllcyhfcHJvcHMkYWN0aW9uLCBbJ3R5cGUnXSk7XG5cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnZGl2JyxcbiAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHtcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTAyLFxuICAgICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwNlxuICAgICAgICB9LCB0aGlzLnByb3BzLnN0eWxlKSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdkaXYnLFxuICAgICAgICB7IHN0eWxlOiBzdHlsZXMuYWN0aW9uQmFyLFxuICAgICAgICAgIG9uQ2xpY2s6IHRoaXMucHJvcHMub25DbGljayB9LFxuICAgICAgICB0eXBlXG4gICAgICApLFxuICAgICAgIXRoaXMucHJvcHMuY29sbGFwc2VkID8gdGhpcy5yZW5kZXJQYXlsb2FkKHBheWxvYWQpIDogJydcbiAgICApO1xuICB9O1xuXG4gIHJldHVybiBMb2dNb25pdG9yQWN0aW9uO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IExvZ01vbml0b3JBY3Rpb247XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZShvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9ialsnZGVmYXVsdCddIDogb2JqOyB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX2NyZWF0ZURldlRvb2xzID0gcmVxdWlyZSgnLi4vY3JlYXRlRGV2VG9vbHMnKTtcblxudmFyIF9jcmVhdGVEZXZUb29sczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jcmVhdGVEZXZUb29scyk7XG5cbnZhciBEZXZUb29scyA9IF9jcmVhdGVEZXZUb29sczJbJ2RlZmF1bHQnXShfcmVhY3QyWydkZWZhdWx0J10pO1xuZXhwb3J0cy5EZXZUb29scyA9IERldlRvb2xzO1xuXG52YXIgX0xvZ01vbml0b3IgPSByZXF1aXJlKCcuL0xvZ01vbml0b3InKTtcblxuZXhwb3J0cy5Mb2dNb25pdG9yID0gX2ludGVyb3BSZXF1aXJlKF9Mb2dNb25pdG9yKTtcblxudmFyIF9EZWJ1Z1BhbmVsID0gcmVxdWlyZSgnLi9EZWJ1Z1BhbmVsJyk7XG5cbmV4cG9ydHMuRGVidWdQYW5lbCA9IF9pbnRlcm9wUmVxdWlyZShfRGVidWdQYW5lbCk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdhcGF0aHknLFxuICBhdXRob3I6ICdqYW5uaWsgc2llYmVydCAoaHR0cHM6Ly9naXRodWIuY29tL2phbm5pa3MpJyxcbiAgYmFzZTAwOiAnIzAzMUExNicsXG4gIGJhc2UwMTogJyMwQjM0MkQnLFxuICBiYXNlMDI6ICcjMTg0RTQ1JyxcbiAgYmFzZTAzOiAnIzJCNjg1RScsXG4gIGJhc2UwNDogJyM1RjlDOTInLFxuICBiYXNlMDU6ICcjODFCNUFDJyxcbiAgYmFzZTA2OiAnI0E3Q0VDOCcsXG4gIGJhc2UwNzogJyNEMkU3RTQnLFxuICBiYXNlMDg6ICcjM0U5Njg4JyxcbiAgYmFzZTA5OiAnIzNFNzk5NicsXG4gIGJhc2UwQTogJyMzRTRDOTYnLFxuICBiYXNlMEI6ICcjODgzRTk2JyxcbiAgYmFzZTBDOiAnIzk2M0U0QycsXG4gIGJhc2UwRDogJyM5Njg4M0UnLFxuICBiYXNlMEU6ICcjNEM5NjNFJyxcbiAgYmFzZTBGOiAnIzNFOTY1Qidcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2FzaGVzJyxcbiAgYXV0aG9yOiAnamFubmlrIHNpZWJlcnQgKGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5uaWtzKScsXG4gIGJhc2UwMDogJyMxQzIwMjMnLFxuICBiYXNlMDE6ICcjMzkzRjQ1JyxcbiAgYmFzZTAyOiAnIzU2NUU2NScsXG4gIGJhc2UwMzogJyM3NDdDODQnLFxuICBiYXNlMDQ6ICcjQURCM0JBJyxcbiAgYmFzZTA1OiAnI0M3Q0NEMScsXG4gIGJhc2UwNjogJyNERkUyRTUnLFxuICBiYXNlMDc6ICcjRjNGNEY1JyxcbiAgYmFzZTA4OiAnI0M3QUU5NScsXG4gIGJhc2UwOTogJyNDN0M3OTUnLFxuICBiYXNlMEE6ICcjQUVDNzk1JyxcbiAgYmFzZTBCOiAnIzk1QzdBRScsXG4gIGJhc2UwQzogJyM5NUFFQzcnLFxuICBiYXNlMEQ6ICcjQUU5NUM3JyxcbiAgYmFzZTBFOiAnI0M3OTVBRScsXG4gIGJhc2UwRjogJyNDNzk1OTUnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdhdGVsaWVyIGR1bmUnLFxuICBhdXRob3I6ICdicmFtIGRlIGhhYW4gKGh0dHA6Ly9hdGVsaWVyYnJhbS5naXRodWIuaW8vc3ludGF4LWhpZ2hsaWdodGluZy9hdGVsaWVyLXNjaGVtZXMvZHVuZSknLFxuICBiYXNlMDA6ICcjMjAyMDFkJyxcbiAgYmFzZTAxOiAnIzI5MjgyNCcsXG4gIGJhc2UwMjogJyM2ZTZiNWUnLFxuICBiYXNlMDM6ICcjN2Q3YTY4JyxcbiAgYmFzZTA0OiAnIzk5OTU4MCcsXG4gIGJhc2UwNTogJyNhNmEyOGMnLFxuICBiYXNlMDY6ICcjZThlNGNmJyxcbiAgYmFzZTA3OiAnI2ZlZmJlYycsXG4gIGJhc2UwODogJyNkNzM3MzcnLFxuICBiYXNlMDk6ICcjYjY1NjExJyxcbiAgYmFzZTBBOiAnI2NmYjAxNycsXG4gIGJhc2UwQjogJyM2MGFjMzknLFxuICBiYXNlMEM6ICcjMWZhZDgzJyxcbiAgYmFzZTBEOiAnIzY2ODRlMScsXG4gIGJhc2UwRTogJyNiODU0ZDQnLFxuICBiYXNlMEY6ICcjZDQzNTUyJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnYXRlbGllciBmb3Jlc3QnLFxuICBhdXRob3I6ICdicmFtIGRlIGhhYW4gKGh0dHA6Ly9hdGVsaWVyYnJhbS5naXRodWIuaW8vc3ludGF4LWhpZ2hsaWdodGluZy9hdGVsaWVyLXNjaGVtZXMvZm9yZXN0KScsXG4gIGJhc2UwMDogJyMxYjE5MTgnLFxuICBiYXNlMDE6ICcjMmMyNDIxJyxcbiAgYmFzZTAyOiAnIzY4NjE1ZScsXG4gIGJhc2UwMzogJyM3NjZlNmInLFxuICBiYXNlMDQ6ICcjOWM5NDkxJyxcbiAgYmFzZTA1OiAnI2E4YTE5ZicsXG4gIGJhc2UwNjogJyNlNmUyZTAnLFxuICBiYXNlMDc6ICcjZjFlZmVlJyxcbiAgYmFzZTA4OiAnI2YyMmM0MCcsXG4gIGJhc2UwOTogJyNkZjUzMjAnLFxuICBiYXNlMEE6ICcjZDU5MTFhJyxcbiAgYmFzZTBCOiAnIzVhYjczOCcsXG4gIGJhc2UwQzogJyMwMGFkOWMnLFxuICBiYXNlMEQ6ICcjNDA3ZWU3JyxcbiAgYmFzZTBFOiAnIzY2NjZlYScsXG4gIGJhc2UwRjogJyNjMzNmZjMnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdhdGVsaWVyIGhlYXRoJyxcbiAgYXV0aG9yOiAnYnJhbSBkZSBoYWFuIChodHRwOi8vYXRlbGllcmJyYW0uZ2l0aHViLmlvL3N5bnRheC1oaWdobGlnaHRpbmcvYXRlbGllci1zY2hlbWVzL2hlYXRoKScsXG4gIGJhc2UwMDogJyMxYjE4MWInLFxuICBiYXNlMDE6ICcjMjkyMzI5JyxcbiAgYmFzZTAyOiAnIzY5NWQ2OScsXG4gIGJhc2UwMzogJyM3NzY5NzcnLFxuICBiYXNlMDQ6ICcjOWU4ZjllJyxcbiAgYmFzZTA1OiAnI2FiOWJhYicsXG4gIGJhc2UwNjogJyNkOGNhZDgnLFxuICBiYXNlMDc6ICcjZjdmM2Y3JyxcbiAgYmFzZTA4OiAnI2NhNDAyYicsXG4gIGJhc2UwOTogJyNhNjU5MjYnLFxuICBiYXNlMEE6ICcjYmI4YTM1JyxcbiAgYmFzZTBCOiAnIzM3OWEzNycsXG4gIGJhc2UwQzogJyMxNTkzOTMnLFxuICBiYXNlMEQ6ICcjNTE2YWVjJyxcbiAgYmFzZTBFOiAnIzdiNTljMCcsXG4gIGJhc2UwRjogJyNjYzMzY2MnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdhdGVsaWVyIGxha2VzaWRlJyxcbiAgYXV0aG9yOiAnYnJhbSBkZSBoYWFuIChodHRwOi8vYXRlbGllcmJyYW0uZ2l0aHViLmlvL3N5bnRheC1oaWdobGlnaHRpbmcvYXRlbGllci1zY2hlbWVzL2xha2VzaWRlLyknLFxuICBiYXNlMDA6ICcjMTYxYjFkJyxcbiAgYmFzZTAxOiAnIzFmMjkyZScsXG4gIGJhc2UwMjogJyM1MTZkN2InLFxuICBiYXNlMDM6ICcjNWE3YjhjJyxcbiAgYmFzZTA0OiAnIzcxOTVhOCcsXG4gIGJhc2UwNTogJyM3ZWEyYjQnLFxuICBiYXNlMDY6ICcjYzFlNGY2JyxcbiAgYmFzZTA3OiAnI2ViZjhmZicsXG4gIGJhc2UwODogJyNkMjJkNzInLFxuICBiYXNlMDk6ICcjOTM1YzI1JyxcbiAgYmFzZTBBOiAnIzhhOGEwZicsXG4gIGJhc2UwQjogJyM1NjhjM2InLFxuICBiYXNlMEM6ICcjMmQ4ZjZmJyxcbiAgYmFzZTBEOiAnIzI1N2ZhZCcsXG4gIGJhc2UwRTogJyM1ZDVkYjEnLFxuICBiYXNlMEY6ICcjYjcyZGQyJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnYXRlbGllciBzZWFzaWRlJyxcbiAgYXV0aG9yOiAnYnJhbSBkZSBoYWFuIChodHRwOi8vYXRlbGllcmJyYW0uZ2l0aHViLmlvL3N5bnRheC1oaWdobGlnaHRpbmcvYXRlbGllci1zY2hlbWVzL3NlYXNpZGUvKScsXG4gIGJhc2UwMDogJyMxMzE1MTMnLFxuICBiYXNlMDE6ICcjMjQyOTI0JyxcbiAgYmFzZTAyOiAnIzVlNmU1ZScsXG4gIGJhc2UwMzogJyM2ODdkNjgnLFxuICBiYXNlMDQ6ICcjODA5OTgwJyxcbiAgYmFzZTA1OiAnIzhjYTY4YycsXG4gIGJhc2UwNjogJyNjZmU4Y2YnLFxuICBiYXNlMDc6ICcjZjBmZmYwJyxcbiAgYmFzZTA4OiAnI2U2MTkzYycsXG4gIGJhc2UwOTogJyM4NzcxMWQnLFxuICBiYXNlMEE6ICcjYzNjMzIyJyxcbiAgYmFzZTBCOiAnIzI5YTMyOScsXG4gIGJhc2UwQzogJyMxOTk5YjMnLFxuICBiYXNlMEQ6ICcjM2Q2MmY1JyxcbiAgYmFzZTBFOiAnI2FkMmJlZScsXG4gIGJhc2UwRjogJyNlNjE5YzMnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdiZXNwaW4nLFxuICBhdXRob3I6ICdqYW4gdC4gc290dCcsXG4gIGJhc2UwMDogJyMyODIxMWMnLFxuICBiYXNlMDE6ICcjMzYzMTJlJyxcbiAgYmFzZTAyOiAnIzVlNWQ1YycsXG4gIGJhc2UwMzogJyM2NjY2NjYnLFxuICBiYXNlMDQ6ICcjNzk3OTc3JyxcbiAgYmFzZTA1OiAnIzhhODk4NicsXG4gIGJhc2UwNjogJyM5ZDliOTcnLFxuICBiYXNlMDc6ICcjYmFhZTllJyxcbiAgYmFzZTA4OiAnI2NmNmE0YycsXG4gIGJhc2UwOTogJyNjZjdkMzQnLFxuICBiYXNlMEE6ICcjZjllZTk4JyxcbiAgYmFzZTBCOiAnIzU0YmUwZCcsXG4gIGJhc2UwQzogJyNhZmM0ZGInLFxuICBiYXNlMEQ6ICcjNWVhNmVhJyxcbiAgYmFzZTBFOiAnIzliODU5ZCcsXG4gIGJhc2UwRjogJyM5MzcxMjEnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdicmV3ZXInLFxuICBhdXRob3I6ICd0aW1vdGjDqWUgcG9pc290IChodHRwOi8vZ2l0aHViLmNvbS90cG9pc290KScsXG4gIGJhc2UwMDogJyMwYzBkMGUnLFxuICBiYXNlMDE6ICcjMmUyZjMwJyxcbiAgYmFzZTAyOiAnIzUxNTI1MycsXG4gIGJhc2UwMzogJyM3Mzc0NzUnLFxuICBiYXNlMDQ6ICcjOTU5Njk3JyxcbiAgYmFzZTA1OiAnI2I3YjhiOScsXG4gIGJhc2UwNjogJyNkYWRiZGMnLFxuICBiYXNlMDc6ICcjZmNmZGZlJyxcbiAgYmFzZTA4OiAnI2UzMWExYycsXG4gIGJhc2UwOTogJyNlNjU1MGQnLFxuICBiYXNlMEE6ICcjZGNhMDYwJyxcbiAgYmFzZTBCOiAnIzMxYTM1NCcsXG4gIGJhc2UwQzogJyM4MGIxZDMnLFxuICBiYXNlMEQ6ICcjMzE4MmJkJyxcbiAgYmFzZTBFOiAnIzc1NmJiMScsXG4gIGJhc2UwRjogJyNiMTU5MjgnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdicmlnaHQnLFxuICBhdXRob3I6ICdjaHJpcyBrZW1wc29uIChodHRwOi8vY2hyaXNrZW1wc29uLmNvbSknLFxuICBiYXNlMDA6ICcjMDAwMDAwJyxcbiAgYmFzZTAxOiAnIzMwMzAzMCcsXG4gIGJhc2UwMjogJyM1MDUwNTAnLFxuICBiYXNlMDM6ICcjYjBiMGIwJyxcbiAgYmFzZTA0OiAnI2QwZDBkMCcsXG4gIGJhc2UwNTogJyNlMGUwZTAnLFxuICBiYXNlMDY6ICcjZjVmNWY1JyxcbiAgYmFzZTA3OiAnI2ZmZmZmZicsXG4gIGJhc2UwODogJyNmYjAxMjAnLFxuICBiYXNlMDk6ICcjZmM2ZDI0JyxcbiAgYmFzZTBBOiAnI2ZkYTMzMScsXG4gIGJhc2UwQjogJyNhMWM2NTknLFxuICBiYXNlMEM6ICcjNzZjN2I3JyxcbiAgYmFzZTBEOiAnIzZmYjNkMicsXG4gIGJhc2UwRTogJyNkMzgxYzMnLFxuICBiYXNlMEY6ICcjYmU2NDNjJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnY2hhbGsnLFxuICBhdXRob3I6ICdjaHJpcyBrZW1wc29uIChodHRwOi8vY2hyaXNrZW1wc29uLmNvbSknLFxuICBiYXNlMDA6ICcjMTUxNTE1JyxcbiAgYmFzZTAxOiAnIzIwMjAyMCcsXG4gIGJhc2UwMjogJyMzMDMwMzAnLFxuICBiYXNlMDM6ICcjNTA1MDUwJyxcbiAgYmFzZTA0OiAnI2IwYjBiMCcsXG4gIGJhc2UwNTogJyNkMGQwZDAnLFxuICBiYXNlMDY6ICcjZTBlMGUwJyxcbiAgYmFzZTA3OiAnI2Y1ZjVmNScsXG4gIGJhc2UwODogJyNmYjlmYjEnLFxuICBiYXNlMDk6ICcjZWRhOTg3JyxcbiAgYmFzZTBBOiAnI2RkYjI2ZicsXG4gIGJhc2UwQjogJyNhY2MyNjcnLFxuICBiYXNlMEM6ICcjMTJjZmMwJyxcbiAgYmFzZTBEOiAnIzZmYzJlZicsXG4gIGJhc2UwRTogJyNlMWEzZWUnLFxuICBiYXNlMEY6ICcjZGVhZjhmJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnY29kZXNjaG9vbCcsXG4gIGF1dGhvcjogJ2JyZXR0b2Y4NicsXG4gIGJhc2UwMDogJyMyMzJjMzEnLFxuICBiYXNlMDE6ICcjMWMzNjU3JyxcbiAgYmFzZTAyOiAnIzJhMzQzYScsXG4gIGJhc2UwMzogJyMzZjQ5NDQnLFxuICBiYXNlMDQ6ICcjODQ4OThjJyxcbiAgYmFzZTA1OiAnIzllYTdhNicsXG4gIGJhc2UwNjogJyNhN2NmYTMnLFxuICBiYXNlMDc6ICcjYjVkOGY2JyxcbiAgYmFzZTA4OiAnIzJhNTQ5MScsXG4gIGJhc2UwOTogJyM0MzgyMGQnLFxuICBiYXNlMEE6ICcjYTAzYjFlJyxcbiAgYmFzZTBCOiAnIzIzNzk4NicsXG4gIGJhc2UwQzogJyNiMDJmMzAnLFxuICBiYXNlMEQ6ICcjNDg0ZDc5JyxcbiAgYmFzZTBFOiAnI2M1OTgyMCcsXG4gIGJhc2UwRjogJyNjOTgzNDQnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdjb2xvcnMnLFxuICBhdXRob3I6ICdtcm1ycyAoaHR0cDovL2NscnMuY2MpJyxcbiAgYmFzZTAwOiAnIzExMTExMScsXG4gIGJhc2UwMTogJyMzMzMzMzMnLFxuICBiYXNlMDI6ICcjNTU1NTU1JyxcbiAgYmFzZTAzOiAnIzc3Nzc3NycsXG4gIGJhc2UwNDogJyM5OTk5OTknLFxuICBiYXNlMDU6ICcjYmJiYmJiJyxcbiAgYmFzZTA2OiAnI2RkZGRkZCcsXG4gIGJhc2UwNzogJyNmZmZmZmYnLFxuICBiYXNlMDg6ICcjZmY0MTM2JyxcbiAgYmFzZTA5OiAnI2ZmODUxYicsXG4gIGJhc2UwQTogJyNmZmRjMDAnLFxuICBiYXNlMEI6ICcjMmVjYzQwJyxcbiAgYmFzZTBDOiAnIzdmZGJmZicsXG4gIGJhc2UwRDogJyMwMDc0ZDknLFxuICBiYXNlMEU6ICcjYjEwZGM5JyxcbiAgYmFzZTBGOiAnIzg1MTQ0Yidcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2RlZmF1bHQnLFxuICBhdXRob3I6ICdjaHJpcyBrZW1wc29uIChodHRwOi8vY2hyaXNrZW1wc29uLmNvbSknLFxuICBiYXNlMDA6ICcjMTgxODE4JyxcbiAgYmFzZTAxOiAnIzI4MjgyOCcsXG4gIGJhc2UwMjogJyMzODM4MzgnLFxuICBiYXNlMDM6ICcjNTg1ODU4JyxcbiAgYmFzZTA0OiAnI2I4YjhiOCcsXG4gIGJhc2UwNTogJyNkOGQ4ZDgnLFxuICBiYXNlMDY6ICcjZThlOGU4JyxcbiAgYmFzZTA3OiAnI2Y4ZjhmOCcsXG4gIGJhc2UwODogJyNhYjQ2NDInLFxuICBiYXNlMDk6ICcjZGM5NjU2JyxcbiAgYmFzZTBBOiAnI2Y3Y2E4OCcsXG4gIGJhc2UwQjogJyNhMWI1NmMnLFxuICBiYXNlMEM6ICcjODZjMWI5JyxcbiAgYmFzZTBEOiAnIzdjYWZjMicsXG4gIGJhc2UwRTogJyNiYThiYWYnLFxuICBiYXNlMEY6ICcjYTE2OTQ2J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnZWlnaHRpZXMnLFxuICBhdXRob3I6ICdjaHJpcyBrZW1wc29uIChodHRwOi8vY2hyaXNrZW1wc29uLmNvbSknLFxuICBiYXNlMDA6ICcjMmQyZDJkJyxcbiAgYmFzZTAxOiAnIzM5MzkzOScsXG4gIGJhc2UwMjogJyM1MTUxNTEnLFxuICBiYXNlMDM6ICcjNzQ3MzY5JyxcbiAgYmFzZTA0OiAnI2EwOWY5MycsXG4gIGJhc2UwNTogJyNkM2QwYzgnLFxuICBiYXNlMDY6ICcjZThlNmRmJyxcbiAgYmFzZTA3OiAnI2YyZjBlYycsXG4gIGJhc2UwODogJyNmMjc3N2EnLFxuICBiYXNlMDk6ICcjZjk5MTU3JyxcbiAgYmFzZTBBOiAnI2ZmY2M2NicsXG4gIGJhc2UwQjogJyM5OWNjOTknLFxuICBiYXNlMEM6ICcjNjZjY2NjJyxcbiAgYmFzZTBEOiAnIzY2OTljYycsXG4gIGJhc2UwRTogJyNjYzk5Y2MnLFxuICBiYXNlMEY6ICcjZDI3YjUzJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnZW1iZXJzJyxcbiAgYXV0aG9yOiAnamFubmlrIHNpZWJlcnQgKGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5uaWtzKScsXG4gIGJhc2UwMDogJyMxNjEzMEYnLFxuICBiYXNlMDE6ICcjMkMyNjIwJyxcbiAgYmFzZTAyOiAnIzQzM0IzMicsXG4gIGJhc2UwMzogJyM1QTUwNDcnLFxuICBiYXNlMDQ6ICcjOEE4MDc1JyxcbiAgYmFzZTA1OiAnI0EzOUE5MCcsXG4gIGJhc2UwNjogJyNCRUI2QUUnLFxuICBiYXNlMDc6ICcjREJENkQxJyxcbiAgYmFzZTA4OiAnIzgyNkQ1NycsXG4gIGJhc2UwOTogJyM4MjgyNTcnLFxuICBiYXNlMEE6ICcjNkQ4MjU3JyxcbiAgYmFzZTBCOiAnIzU3ODI2RCcsXG4gIGJhc2UwQzogJyM1NzZEODInLFxuICBiYXNlMEQ6ICcjNkQ1NzgyJyxcbiAgYmFzZTBFOiAnIzgyNTc2RCcsXG4gIGJhc2UwRjogJyM4MjU3NTcnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdmbGF0JyxcbiAgYXV0aG9yOiAnY2hyaXMga2VtcHNvbiAoaHR0cDovL2Nocmlza2VtcHNvbi5jb20pJyxcbiAgYmFzZTAwOiAnIzJDM0U1MCcsXG4gIGJhc2UwMTogJyMzNDQ5NUUnLFxuICBiYXNlMDI6ICcjN0Y4QzhEJyxcbiAgYmFzZTAzOiAnIzk1QTVBNicsXG4gIGJhc2UwNDogJyNCREMzQzcnLFxuICBiYXNlMDU6ICcjZTBlMGUwJyxcbiAgYmFzZTA2OiAnI2Y1ZjVmNScsXG4gIGJhc2UwNzogJyNFQ0YwRjEnLFxuICBiYXNlMDg6ICcjRTc0QzNDJyxcbiAgYmFzZTA5OiAnI0U2N0UyMicsXG4gIGJhc2UwQTogJyNGMUM0MEYnLFxuICBiYXNlMEI6ICcjMkVDQzcxJyxcbiAgYmFzZTBDOiAnIzFBQkM5QycsXG4gIGJhc2UwRDogJyMzNDk4REInLFxuICBiYXNlMEU6ICcjOUI1OUI2JyxcbiAgYmFzZTBGOiAnI2JlNjQzYydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2dvb2dsZScsXG4gIGF1dGhvcjogJ3NldGggd3JpZ2h0IChodHRwOi8vc2V0aGF3cmlnaHQuY29tKScsXG4gIGJhc2UwMDogJyMxZDFmMjEnLFxuICBiYXNlMDE6ICcjMjgyYTJlJyxcbiAgYmFzZTAyOiAnIzM3M2I0MScsXG4gIGJhc2UwMzogJyM5Njk4OTYnLFxuICBiYXNlMDQ6ICcjYjRiN2I0JyxcbiAgYmFzZTA1OiAnI2M1YzhjNicsXG4gIGJhc2UwNjogJyNlMGUwZTAnLFxuICBiYXNlMDc6ICcjZmZmZmZmJyxcbiAgYmFzZTA4OiAnI0NDMzQyQicsXG4gIGJhc2UwOTogJyNGOTZBMzgnLFxuICBiYXNlMEE6ICcjRkJBOTIyJyxcbiAgYmFzZTBCOiAnIzE5ODg0NCcsXG4gIGJhc2UwQzogJyMzOTcxRUQnLFxuICBiYXNlMEQ6ICcjMzk3MUVEJyxcbiAgYmFzZTBFOiAnI0EzNkFDNycsXG4gIGJhc2UwRjogJyMzOTcxRUQnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdncmF5c2NhbGUnLFxuICBhdXRob3I6ICdhbGV4YW5kcmUgZ2F2aW9saSAoaHR0cHM6Ly9naXRodWIuY29tL2FsZXh4Mi8pJyxcbiAgYmFzZTAwOiAnIzEwMTAxMCcsXG4gIGJhc2UwMTogJyMyNTI1MjUnLFxuICBiYXNlMDI6ICcjNDY0NjQ2JyxcbiAgYmFzZTAzOiAnIzUyNTI1MicsXG4gIGJhc2UwNDogJyNhYmFiYWInLFxuICBiYXNlMDU6ICcjYjliOWI5JyxcbiAgYmFzZTA2OiAnI2UzZTNlMycsXG4gIGJhc2UwNzogJyNmN2Y3ZjcnLFxuICBiYXNlMDg6ICcjN2M3YzdjJyxcbiAgYmFzZTA5OiAnIzk5OTk5OScsXG4gIGJhc2UwQTogJyNhMGEwYTAnLFxuICBiYXNlMEI6ICcjOGU4ZThlJyxcbiAgYmFzZTBDOiAnIzg2ODY4NicsXG4gIGJhc2UwRDogJyM2ODY4NjgnLFxuICBiYXNlMEU6ICcjNzQ3NDc0JyxcbiAgYmFzZTBGOiAnIzVlNWU1ZSdcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ2dyZWVuIHNjcmVlbicsXG4gIGF1dGhvcjogJ2NocmlzIGtlbXBzb24gKGh0dHA6Ly9jaHJpc2tlbXBzb24uY29tKScsXG4gIGJhc2UwMDogJyMwMDExMDAnLFxuICBiYXNlMDE6ICcjMDAzMzAwJyxcbiAgYmFzZTAyOiAnIzAwNTUwMCcsXG4gIGJhc2UwMzogJyMwMDc3MDAnLFxuICBiYXNlMDQ6ICcjMDA5OTAwJyxcbiAgYmFzZTA1OiAnIzAwYmIwMCcsXG4gIGJhc2UwNjogJyMwMGRkMDAnLFxuICBiYXNlMDc6ICcjMDBmZjAwJyxcbiAgYmFzZTA4OiAnIzAwNzcwMCcsXG4gIGJhc2UwOTogJyMwMDk5MDAnLFxuICBiYXNlMEE6ICcjMDA3NzAwJyxcbiAgYmFzZTBCOiAnIzAwYmIwMCcsXG4gIGJhc2UwQzogJyMwMDU1MDAnLFxuICBiYXNlMEQ6ICcjMDA5OTAwJyxcbiAgYmFzZTBFOiAnIzAwYmIwMCcsXG4gIGJhc2UwRjogJyMwMDU1MDAnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdoYXJtb25pYzE2JyxcbiAgYXV0aG9yOiAnamFubmlrIHNpZWJlcnQgKGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5uaWtzKScsXG4gIGJhc2UwMDogJyMwYjFjMmMnLFxuICBiYXNlMDE6ICcjMjIzYjU0JyxcbiAgYmFzZTAyOiAnIzQwNWM3OScsXG4gIGJhc2UwMzogJyM2MjdlOTknLFxuICBiYXNlMDQ6ICcjYWFiY2NlJyxcbiAgYmFzZTA1OiAnI2NiZDZlMicsXG4gIGJhc2UwNjogJyNlNWViZjEnLFxuICBiYXNlMDc6ICcjZjdmOWZiJyxcbiAgYmFzZTA4OiAnI2JmOGI1NicsXG4gIGJhc2UwOTogJyNiZmJmNTYnLFxuICBiYXNlMEE6ICcjOGJiZjU2JyxcbiAgYmFzZTBCOiAnIzU2YmY4YicsXG4gIGJhc2UwQzogJyM1NjhiYmYnLFxuICBiYXNlMEQ6ICcjOGI1NmJmJyxcbiAgYmFzZTBFOiAnI2JmNTY4YicsXG4gIGJhc2UwRjogJyNiZjU2NTYnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdob3BzY290Y2gnLFxuICBhdXRob3I6ICdqYW4gdC4gc290dCcsXG4gIGJhc2UwMDogJyMzMjI5MzEnLFxuICBiYXNlMDE6ICcjNDMzYjQyJyxcbiAgYmFzZTAyOiAnIzVjNTQ1YicsXG4gIGJhc2UwMzogJyM3OTczNzknLFxuICBiYXNlMDQ6ICcjOTg5NDk4JyxcbiAgYmFzZTA1OiAnI2I5YjViOCcsXG4gIGJhc2UwNjogJyNkNWQzZDUnLFxuICBiYXNlMDc6ICcjZmZmZmZmJyxcbiAgYmFzZTA4OiAnI2RkNDY0YycsXG4gIGJhc2UwOTogJyNmZDhiMTknLFxuICBiYXNlMEE6ICcjZmRjYzU5JyxcbiAgYmFzZTBCOiAnIzhmYzEzZScsXG4gIGJhc2UwQzogJyMxNDliOTMnLFxuICBiYXNlMEQ6ICcjMTI5MGJmJyxcbiAgYmFzZTBFOiAnI2M4NWU3YycsXG4gIGJhc2UwRjogJyNiMzM1MDgnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmUob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmpbJ2RlZmF1bHQnXSA6IG9iajsgfVxuXG52YXIgX3RocmVlemVyb3R3b2ZvdXIgPSByZXF1aXJlKCcuL3RocmVlemVyb3R3b2ZvdXInKTtcblxuZXhwb3J0cy50aHJlZXplcm90d29mb3VyID0gX2ludGVyb3BSZXF1aXJlKF90aHJlZXplcm90d29mb3VyKTtcblxudmFyIF9hcGF0aHkgPSByZXF1aXJlKCcuL2FwYXRoeScpO1xuXG5leHBvcnRzLmFwYXRoeSA9IF9pbnRlcm9wUmVxdWlyZShfYXBhdGh5KTtcblxudmFyIF9hc2hlcyA9IHJlcXVpcmUoJy4vYXNoZXMnKTtcblxuZXhwb3J0cy5hc2hlcyA9IF9pbnRlcm9wUmVxdWlyZShfYXNoZXMpO1xuXG52YXIgX2F0ZWxpZXJEdW5lID0gcmVxdWlyZSgnLi9hdGVsaWVyLWR1bmUnKTtcblxuZXhwb3J0cy5hdGVsaWVyRHVuZSA9IF9pbnRlcm9wUmVxdWlyZShfYXRlbGllckR1bmUpO1xuXG52YXIgX2F0ZWxpZXJGb3Jlc3QgPSByZXF1aXJlKCcuL2F0ZWxpZXItZm9yZXN0Jyk7XG5cbmV4cG9ydHMuYXRlbGllckZvcmVzdCA9IF9pbnRlcm9wUmVxdWlyZShfYXRlbGllckZvcmVzdCk7XG5cbnZhciBfYXRlbGllckhlYXRoID0gcmVxdWlyZSgnLi9hdGVsaWVyLWhlYXRoJyk7XG5cbmV4cG9ydHMuYXRlbGllckhlYXRoID0gX2ludGVyb3BSZXF1aXJlKF9hdGVsaWVySGVhdGgpO1xuXG52YXIgX2F0ZWxpZXJMYWtlc2lkZSA9IHJlcXVpcmUoJy4vYXRlbGllci1sYWtlc2lkZScpO1xuXG5leHBvcnRzLmF0ZWxpZXJMYWtlc2lkZSA9IF9pbnRlcm9wUmVxdWlyZShfYXRlbGllckxha2VzaWRlKTtcblxudmFyIF9hdGVsaWVyU2Vhc2lkZSA9IHJlcXVpcmUoJy4vYXRlbGllci1zZWFzaWRlJyk7XG5cbmV4cG9ydHMuYXRlbGllclNlYXNpZGUgPSBfaW50ZXJvcFJlcXVpcmUoX2F0ZWxpZXJTZWFzaWRlKTtcblxudmFyIF9iZXNwaW4gPSByZXF1aXJlKCcuL2Jlc3BpbicpO1xuXG5leHBvcnRzLmJlc3BpbiA9IF9pbnRlcm9wUmVxdWlyZShfYmVzcGluKTtcblxudmFyIF9icmV3ZXIgPSByZXF1aXJlKCcuL2JyZXdlcicpO1xuXG5leHBvcnRzLmJyZXdlciA9IF9pbnRlcm9wUmVxdWlyZShfYnJld2VyKTtcblxudmFyIF9icmlnaHQgPSByZXF1aXJlKCcuL2JyaWdodCcpO1xuXG5leHBvcnRzLmJyaWdodCA9IF9pbnRlcm9wUmVxdWlyZShfYnJpZ2h0KTtcblxudmFyIF9jaGFsayA9IHJlcXVpcmUoJy4vY2hhbGsnKTtcblxuZXhwb3J0cy5jaGFsayA9IF9pbnRlcm9wUmVxdWlyZShfY2hhbGspO1xuXG52YXIgX2NvZGVzY2hvb2wgPSByZXF1aXJlKCcuL2NvZGVzY2hvb2wnKTtcblxuZXhwb3J0cy5jb2Rlc2Nob29sID0gX2ludGVyb3BSZXF1aXJlKF9jb2Rlc2Nob29sKTtcblxudmFyIF9jb2xvcnMgPSByZXF1aXJlKCcuL2NvbG9ycycpO1xuXG5leHBvcnRzLmNvbG9ycyA9IF9pbnRlcm9wUmVxdWlyZShfY29sb3JzKTtcblxudmFyIF9kZWZhdWx0ID0gcmVxdWlyZSgnLi9kZWZhdWx0Jyk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF9pbnRlcm9wUmVxdWlyZShfZGVmYXVsdCk7XG5cbnZhciBfZWlnaHRpZXMgPSByZXF1aXJlKCcuL2VpZ2h0aWVzJyk7XG5cbmV4cG9ydHMuZWlnaHRpZXMgPSBfaW50ZXJvcFJlcXVpcmUoX2VpZ2h0aWVzKTtcblxudmFyIF9lbWJlcnMgPSByZXF1aXJlKCcuL2VtYmVycycpO1xuXG5leHBvcnRzLmVtYmVycyA9IF9pbnRlcm9wUmVxdWlyZShfZW1iZXJzKTtcblxudmFyIF9mbGF0ID0gcmVxdWlyZSgnLi9mbGF0Jyk7XG5cbmV4cG9ydHMuZmxhdCA9IF9pbnRlcm9wUmVxdWlyZShfZmxhdCk7XG5cbnZhciBfZ29vZ2xlID0gcmVxdWlyZSgnLi9nb29nbGUnKTtcblxuZXhwb3J0cy5nb29nbGUgPSBfaW50ZXJvcFJlcXVpcmUoX2dvb2dsZSk7XG5cbnZhciBfZ3JheXNjYWxlID0gcmVxdWlyZSgnLi9ncmF5c2NhbGUnKTtcblxuZXhwb3J0cy5ncmF5c2NhbGUgPSBfaW50ZXJvcFJlcXVpcmUoX2dyYXlzY2FsZSk7XG5cbnZhciBfZ3JlZW5zY3JlZW4gPSByZXF1aXJlKCcuL2dyZWVuc2NyZWVuJyk7XG5cbmV4cG9ydHMuZ3JlZW5zY3JlZW4gPSBfaW50ZXJvcFJlcXVpcmUoX2dyZWVuc2NyZWVuKTtcblxudmFyIF9oYXJtb25pYyA9IHJlcXVpcmUoJy4vaGFybW9uaWMnKTtcblxuZXhwb3J0cy5oYXJtb25pYyA9IF9pbnRlcm9wUmVxdWlyZShfaGFybW9uaWMpO1xuXG52YXIgX2hvcHNjb3RjaCA9IHJlcXVpcmUoJy4vaG9wc2NvdGNoJyk7XG5cbmV4cG9ydHMuaG9wc2NvdGNoID0gX2ludGVyb3BSZXF1aXJlKF9ob3BzY290Y2gpO1xuXG52YXIgX2lzb3RvcGUgPSByZXF1aXJlKCcuL2lzb3RvcGUnKTtcblxuZXhwb3J0cy5pc290b3BlID0gX2ludGVyb3BSZXF1aXJlKF9pc290b3BlKTtcblxudmFyIF9tYXJyYWtlc2ggPSByZXF1aXJlKCcuL21hcnJha2VzaCcpO1xuXG5leHBvcnRzLm1hcnJha2VzaCA9IF9pbnRlcm9wUmVxdWlyZShfbWFycmFrZXNoKTtcblxudmFyIF9tb2NoYSA9IHJlcXVpcmUoJy4vbW9jaGEnKTtcblxuZXhwb3J0cy5tb2NoYSA9IF9pbnRlcm9wUmVxdWlyZShfbW9jaGEpO1xuXG52YXIgX21vbm9rYWkgPSByZXF1aXJlKCcuL21vbm9rYWknKTtcblxuZXhwb3J0cy5tb25va2FpID0gX2ludGVyb3BSZXF1aXJlKF9tb25va2FpKTtcblxudmFyIF9vY2VhbiA9IHJlcXVpcmUoJy4vb2NlYW4nKTtcblxuZXhwb3J0cy5vY2VhbiA9IF9pbnRlcm9wUmVxdWlyZShfb2NlYW4pO1xuXG52YXIgX3BhcmFpc28gPSByZXF1aXJlKCcuL3BhcmFpc28nKTtcblxuZXhwb3J0cy5wYXJhaXNvID0gX2ludGVyb3BSZXF1aXJlKF9wYXJhaXNvKTtcblxudmFyIF9wb3AgPSByZXF1aXJlKCcuL3BvcCcpO1xuXG5leHBvcnRzLnBvcCA9IF9pbnRlcm9wUmVxdWlyZShfcG9wKTtcblxudmFyIF9yYWlsc2Nhc3RzID0gcmVxdWlyZSgnLi9yYWlsc2Nhc3RzJyk7XG5cbmV4cG9ydHMucmFpbHNjYXN0cyA9IF9pbnRlcm9wUmVxdWlyZShfcmFpbHNjYXN0cyk7XG5cbnZhciBfc2hhcGVzaGlmdGVyID0gcmVxdWlyZSgnLi9zaGFwZXNoaWZ0ZXInKTtcblxuZXhwb3J0cy5zaGFwZXNoaWZ0ZXIgPSBfaW50ZXJvcFJlcXVpcmUoX3NoYXBlc2hpZnRlcik7XG5cbnZhciBfc29sYXJpemVkID0gcmVxdWlyZSgnLi9zb2xhcml6ZWQnKTtcblxuZXhwb3J0cy5zb2xhcml6ZWQgPSBfaW50ZXJvcFJlcXVpcmUoX3NvbGFyaXplZCk7XG5cbnZhciBfc3VtbWVyZnJ1aXQgPSByZXF1aXJlKCcuL3N1bW1lcmZydWl0Jyk7XG5cbmV4cG9ydHMuc3VtbWVyZnJ1aXQgPSBfaW50ZXJvcFJlcXVpcmUoX3N1bW1lcmZydWl0KTtcblxudmFyIF90b21vcnJvdyA9IHJlcXVpcmUoJy4vdG9tb3Jyb3cnKTtcblxuZXhwb3J0cy50b21vcnJvdyA9IF9pbnRlcm9wUmVxdWlyZShfdG9tb3Jyb3cpO1xuXG52YXIgX3R1YmUgPSByZXF1aXJlKCcuL3R1YmUnKTtcblxuZXhwb3J0cy50dWJlID0gX2ludGVyb3BSZXF1aXJlKF90dWJlKTtcblxudmFyIF90d2lsaWdodCA9IHJlcXVpcmUoJy4vdHdpbGlnaHQnKTtcblxuZXhwb3J0cy50d2lsaWdodCA9IF9pbnRlcm9wUmVxdWlyZShfdHdpbGlnaHQpO1xuXG52YXIgX25pY2luYWJveCA9IHJlcXVpcmUoJy4vbmljaW5hYm94Jyk7XG5cbmV4cG9ydHMubmljaW5hYm94ID0gX2ludGVyb3BSZXF1aXJlKF9uaWNpbmFib3gpOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnaXNvdG9wZScsXG4gIGF1dGhvcjogJ2phbiB0LiBzb3R0JyxcbiAgYmFzZTAwOiAnIzAwMDAwMCcsXG4gIGJhc2UwMTogJyM0MDQwNDAnLFxuICBiYXNlMDI6ICcjNjA2MDYwJyxcbiAgYmFzZTAzOiAnIzgwODA4MCcsXG4gIGJhc2UwNDogJyNjMGMwYzAnLFxuICBiYXNlMDU6ICcjZDBkMGQwJyxcbiAgYmFzZTA2OiAnI2UwZTBlMCcsXG4gIGJhc2UwNzogJyNmZmZmZmYnLFxuICBiYXNlMDg6ICcjZmYwMDAwJyxcbiAgYmFzZTA5OiAnI2ZmOTkwMCcsXG4gIGJhc2UwQTogJyNmZjAwOTknLFxuICBiYXNlMEI6ICcjMzNmZjAwJyxcbiAgYmFzZTBDOiAnIzAwZmZmZicsXG4gIGJhc2UwRDogJyMwMDY2ZmYnLFxuICBiYXNlMEU6ICcjY2MwMGZmJyxcbiAgYmFzZTBGOiAnIzMzMDBmZidcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ21hcnJha2VzaCcsXG4gIGF1dGhvcjogJ2FsZXhhbmRyZSBnYXZpb2xpIChodHRwOi8vZ2l0aHViLmNvbS9hbGV4eDIvKScsXG4gIGJhc2UwMDogJyMyMDE2MDInLFxuICBiYXNlMDE6ICcjMzAyZTAwJyxcbiAgYmFzZTAyOiAnIzVmNWIxNycsXG4gIGJhc2UwMzogJyM2YzY4MjMnLFxuICBiYXNlMDQ6ICcjODY4MTNiJyxcbiAgYmFzZTA1OiAnIzk0OGU0OCcsXG4gIGJhc2UwNjogJyNjY2MzN2EnLFxuICBiYXNlMDc6ICcjZmFmMGE1JyxcbiAgYmFzZTA4OiAnI2MzNTM1OScsXG4gIGJhc2UwOTogJyNiMzYxNDQnLFxuICBiYXNlMEE6ICcjYTg4MzM5JyxcbiAgYmFzZTBCOiAnIzE4OTc0ZScsXG4gIGJhc2UwQzogJyM3NWE3MzgnLFxuICBiYXNlMEQ6ICcjNDc3Y2ExJyxcbiAgYmFzZTBFOiAnIzg4NjhiMycsXG4gIGJhc2UwRjogJyNiMzU4OGUnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdtb2NoYScsXG4gIGF1dGhvcjogJ2NocmlzIGtlbXBzb24gKGh0dHA6Ly9jaHJpc2tlbXBzb24uY29tKScsXG4gIGJhc2UwMDogJyMzQjMyMjgnLFxuICBiYXNlMDE6ICcjNTM0NjM2JyxcbiAgYmFzZTAyOiAnIzY0NTI0MCcsXG4gIGJhc2UwMzogJyM3ZTcwNWEnLFxuICBiYXNlMDQ6ICcjYjhhZmFkJyxcbiAgYmFzZTA1OiAnI2QwYzhjNicsXG4gIGJhc2UwNjogJyNlOWUxZGQnLFxuICBiYXNlMDc6ICcjZjVlZWViJyxcbiAgYmFzZTA4OiAnI2NiNjA3NycsXG4gIGJhc2UwOTogJyNkMjhiNzEnLFxuICBiYXNlMEE6ICcjZjRiYzg3JyxcbiAgYmFzZTBCOiAnI2JlYjU1YicsXG4gIGJhc2UwQzogJyM3YmJkYTQnLFxuICBiYXNlMEQ6ICcjOGFiM2I1JyxcbiAgYmFzZTBFOiAnI2E4OWJiOScsXG4gIGJhc2UwRjogJyNiYjk1ODQnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdtb25va2FpJyxcbiAgYXV0aG9yOiAnd2ltZXIgaGF6ZW5iZXJnIChodHRwOi8vd3d3Lm1vbm9rYWkubmwpJyxcbiAgYmFzZTAwOiAnIzI3MjgyMicsXG4gIGJhc2UwMTogJyMzODM4MzAnLFxuICBiYXNlMDI6ICcjNDk0ODNlJyxcbiAgYmFzZTAzOiAnIzc1NzE1ZScsXG4gIGJhc2UwNDogJyNhNTlmODUnLFxuICBiYXNlMDU6ICcjZjhmOGYyJyxcbiAgYmFzZTA2OiAnI2Y1ZjRmMScsXG4gIGJhc2UwNzogJyNmOWY4ZjUnLFxuICBiYXNlMDg6ICcjZjkyNjcyJyxcbiAgYmFzZTA5OiAnI2ZkOTcxZicsXG4gIGJhc2UwQTogJyNmNGJmNzUnLFxuICBiYXNlMEI6ICcjYTZlMjJlJyxcbiAgYmFzZTBDOiAnI2ExZWZlNCcsXG4gIGJhc2UwRDogJyM2NmQ5ZWYnLFxuICBiYXNlMEU6ICcjYWU4MWZmJyxcbiAgYmFzZTBGOiAnI2NjNjYzMydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ25pY2luYWJveCcsXG4gIGF1dGhvcjogJ25pY2luYWJveCAoaHR0cDovL2dpdGh1Yi5jb20vbmljaW5hYm94KScsXG4gIGJhc2UwMDogJyMyQTJGM0EnLFxuICBiYXNlMDE6ICcjM0M0NDRGJyxcbiAgYmFzZTAyOiAnIzRGNUE2NScsXG4gIGJhc2UwMzogJyNCRUJFQkUnLFxuICBiYXNlMDQ6ICcjYjBiMGIwJywgLy8gdW5tb2RpZmllZFxuICBiYXNlMDU6ICcjZDBkMGQwJywgLy8gdW5tb2RpZmllZFxuICBiYXNlMDY6ICcjRkZGRkZGJyxcbiAgYmFzZTA3OiAnI2Y1ZjVmNScsIC8vIHVubW9kaWZpZWRcbiAgYmFzZTA4OiAnI2ZiOWZiMScsIC8vIHVubW9kaWZpZWRcbiAgYmFzZTA5OiAnI0ZDNkQyNCcsXG4gIGJhc2UwQTogJyNkZGIyNmYnLCAvLyB1bm1vZGlmaWVkXG4gIGJhc2UwQjogJyNBMUM2NTknLFxuICBiYXNlMEM6ICcjMTJjZmMwJywgLy8gdW5tb2RpZmllZFxuICBiYXNlMEQ6ICcjNkZCM0QyJyxcbiAgYmFzZTBFOiAnI0QzODFDMycsXG4gIGJhc2UwRjogJyNkZWFmOGYnIC8vIHVubW9kaWZpZWRcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ29jZWFuJyxcbiAgYXV0aG9yOiAnY2hyaXMga2VtcHNvbiAoaHR0cDovL2Nocmlza2VtcHNvbi5jb20pJyxcbiAgYmFzZTAwOiAnIzJiMzAzYicsXG4gIGJhc2UwMTogJyMzNDNkNDYnLFxuICBiYXNlMDI6ICcjNGY1YjY2JyxcbiAgYmFzZTAzOiAnIzY1NzM3ZScsXG4gIGJhc2UwNDogJyNhN2FkYmEnLFxuICBiYXNlMDU6ICcjYzBjNWNlJyxcbiAgYmFzZTA2OiAnI2RmZTFlOCcsXG4gIGJhc2UwNzogJyNlZmYxZjUnLFxuICBiYXNlMDg6ICcjYmY2MTZhJyxcbiAgYmFzZTA5OiAnI2QwODc3MCcsXG4gIGJhc2UwQTogJyNlYmNiOGInLFxuICBiYXNlMEI6ICcjYTNiZThjJyxcbiAgYmFzZTBDOiAnIzk2YjViNCcsXG4gIGJhc2UwRDogJyM4ZmExYjMnLFxuICBiYXNlMEU6ICcjYjQ4ZWFkJyxcbiAgYmFzZTBGOiAnI2FiNzk2Nydcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ3BhcmFpc28nLFxuICBhdXRob3I6ICdqYW4gdC4gc290dCcsXG4gIGJhc2UwMDogJyMyZjFlMmUnLFxuICBiYXNlMDE6ICcjNDEzMjNmJyxcbiAgYmFzZTAyOiAnIzRmNDI0YycsXG4gIGJhc2UwMzogJyM3NzZlNzEnLFxuICBiYXNlMDQ6ICcjOGQ4Njg3JyxcbiAgYmFzZTA1OiAnI2EzOWU5YicsXG4gIGJhc2UwNjogJyNiOWI2YjAnLFxuICBiYXNlMDc6ICcjZTdlOWRiJyxcbiAgYmFzZTA4OiAnI2VmNjE1NScsXG4gIGJhc2UwOTogJyNmOTliMTUnLFxuICBiYXNlMEE6ICcjZmVjNDE4JyxcbiAgYmFzZTBCOiAnIzQ4YjY4NScsXG4gIGJhc2UwQzogJyM1YmM0YmYnLFxuICBiYXNlMEQ6ICcjMDZiNmVmJyxcbiAgYmFzZTBFOiAnIzgxNWJhNCcsXG4gIGJhc2UwRjogJyNlOTZiYTgnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdwb3AnLFxuICBhdXRob3I6ICdjaHJpcyBrZW1wc29uIChodHRwOi8vY2hyaXNrZW1wc29uLmNvbSknLFxuICBiYXNlMDA6ICcjMDAwMDAwJyxcbiAgYmFzZTAxOiAnIzIwMjAyMCcsXG4gIGJhc2UwMjogJyMzMDMwMzAnLFxuICBiYXNlMDM6ICcjNTA1MDUwJyxcbiAgYmFzZTA0OiAnI2IwYjBiMCcsXG4gIGJhc2UwNTogJyNkMGQwZDAnLFxuICBiYXNlMDY6ICcjZTBlMGUwJyxcbiAgYmFzZTA3OiAnI2ZmZmZmZicsXG4gIGJhc2UwODogJyNlYjAwOGEnLFxuICBiYXNlMDk6ICcjZjI5MzMzJyxcbiAgYmFzZTBBOiAnI2Y4Y2ExMicsXG4gIGJhc2UwQjogJyMzN2IzNDknLFxuICBiYXNlMEM6ICcjMDBhYWJiJyxcbiAgYmFzZTBEOiAnIzBlNWE5NCcsXG4gIGJhc2UwRTogJyNiMzFlOGQnLFxuICBiYXNlMEY6ICcjN2EyZDAwJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAncmFpbHNjYXN0cycsXG4gIGF1dGhvcjogJ3J5YW4gYmF0ZXMgKGh0dHA6Ly9yYWlsc2Nhc3RzLmNvbSknLFxuICBiYXNlMDA6ICcjMmIyYjJiJyxcbiAgYmFzZTAxOiAnIzI3MjkzNScsXG4gIGJhc2UwMjogJyMzYTQwNTUnLFxuICBiYXNlMDM6ICcjNWE2NDdlJyxcbiAgYmFzZTA0OiAnI2Q0Y2ZjOScsXG4gIGJhc2UwNTogJyNlNmUxZGMnLFxuICBiYXNlMDY6ICcjZjRmMWVkJyxcbiAgYmFzZTA3OiAnI2Y5ZjdmMycsXG4gIGJhc2UwODogJyNkYTQ5MzknLFxuICBiYXNlMDk6ICcjY2M3ODMzJyxcbiAgYmFzZTBBOiAnI2ZmYzY2ZCcsXG4gIGJhc2UwQjogJyNhNWMyNjEnLFxuICBiYXNlMEM6ICcjNTE5ZjUwJyxcbiAgYmFzZTBEOiAnIzZkOWNiZScsXG4gIGJhc2UwRTogJyNiNmIzZWInLFxuICBiYXNlMEY6ICcjYmM5NDU4J1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnc2hhcGVzaGlmdGVyJyxcbiAgYXV0aG9yOiAndHlsZXIgYmVuemlnZXIgKGh0dHA6Ly90eWJlbnouY29tKScsXG4gIGJhc2UwMDogJyMwMDAwMDAnLFxuICBiYXNlMDE6ICcjMDQwNDA0JyxcbiAgYmFzZTAyOiAnIzEwMjAxNScsXG4gIGJhc2UwMzogJyMzNDM0MzQnLFxuICBiYXNlMDQ6ICcjNTU1NTU1JyxcbiAgYmFzZTA1OiAnI2FiYWJhYicsXG4gIGJhc2UwNjogJyNlMGUwZTAnLFxuICBiYXNlMDc6ICcjZjlmOWY5JyxcbiAgYmFzZTA4OiAnI2U5MmYyZicsXG4gIGJhc2UwOTogJyNlMDk0NDgnLFxuICBiYXNlMEE6ICcjZGRkZDEzJyxcbiAgYmFzZTBCOiAnIzBlZDgzOScsXG4gIGJhc2UwQzogJyMyM2VkZGEnLFxuICBiYXNlMEQ6ICcjM2I0OGUzJyxcbiAgYmFzZTBFOiAnI2Y5OTZlMicsXG4gIGJhc2UwRjogJyM2OTU0MmQnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICdzb2xhcml6ZWQnLFxuICBhdXRob3I6ICdldGhhbiBzY2hvb25vdmVyIChodHRwOi8vZXRoYW5zY2hvb25vdmVyLmNvbS9zb2xhcml6ZWQpJyxcbiAgYmFzZTAwOiAnIzAwMmIzNicsXG4gIGJhc2UwMTogJyMwNzM2NDInLFxuICBiYXNlMDI6ICcjNTg2ZTc1JyxcbiAgYmFzZTAzOiAnIzY1N2I4MycsXG4gIGJhc2UwNDogJyM4Mzk0OTYnLFxuICBiYXNlMDU6ICcjOTNhMWExJyxcbiAgYmFzZTA2OiAnI2VlZThkNScsXG4gIGJhc2UwNzogJyNmZGY2ZTMnLFxuICBiYXNlMDg6ICcjZGMzMjJmJyxcbiAgYmFzZTA5OiAnI2NiNGIxNicsXG4gIGJhc2UwQTogJyNiNTg5MDAnLFxuICBiYXNlMEI6ICcjODU5OTAwJyxcbiAgYmFzZTBDOiAnIzJhYTE5OCcsXG4gIGJhc2UwRDogJyMyNjhiZDInLFxuICBiYXNlMEU6ICcjNmM3MWM0JyxcbiAgYmFzZTBGOiAnI2QzMzY4Midcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIHNjaGVtZTogJ3N1bW1lcmZydWl0JyxcbiAgYXV0aG9yOiAnY2hyaXN0b3BoZXIgY29ybGV5IChodHRwOi8vY3Njb3JsZXkuZ2l0aHViLmlvLyknLFxuICBiYXNlMDA6ICcjMTUxNTE1JyxcbiAgYmFzZTAxOiAnIzIwMjAyMCcsXG4gIGJhc2UwMjogJyMzMDMwMzAnLFxuICBiYXNlMDM6ICcjNTA1MDUwJyxcbiAgYmFzZTA0OiAnI0IwQjBCMCcsXG4gIGJhc2UwNTogJyNEMEQwRDAnLFxuICBiYXNlMDY6ICcjRTBFMEUwJyxcbiAgYmFzZTA3OiAnI0ZGRkZGRicsXG4gIGJhc2UwODogJyNGRjAwODYnLFxuICBiYXNlMDk6ICcjRkQ4OTAwJyxcbiAgYmFzZTBBOiAnI0FCQTgwMCcsXG4gIGJhc2UwQjogJyMwMEM5MTgnLFxuICBiYXNlMEM6ICcjMWZhYWFhJyxcbiAgYmFzZTBEOiAnIzM3NzdFNicsXG4gIGJhc2UwRTogJyNBRDAwQTEnLFxuICBiYXNlMEY6ICcjY2M2NjMzJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAndGhyZWV6ZXJvdHdvZm91cicsXG4gIGF1dGhvcjogJ2phbiB0LiBzb3R0IChodHRwOi8vZ2l0aHViLmNvbS9pZGxlYmVyZyknLFxuICBiYXNlMDA6ICcjMDkwMzAwJyxcbiAgYmFzZTAxOiAnIzNhMzQzMicsXG4gIGJhc2UwMjogJyM0YTQ1NDMnLFxuICBiYXNlMDM6ICcjNWM1ODU1JyxcbiAgYmFzZTA0OiAnIzgwN2Q3YycsXG4gIGJhc2UwNTogJyNhNWEyYTInLFxuICBiYXNlMDY6ICcjZDZkNWQ0JyxcbiAgYmFzZTA3OiAnI2Y3ZjdmNycsXG4gIGJhc2UwODogJyNkYjJkMjAnLFxuICBiYXNlMDk6ICcjZThiYmQwJyxcbiAgYmFzZTBBOiAnI2ZkZWQwMicsXG4gIGJhc2UwQjogJyMwMWEyNTInLFxuICBiYXNlMEM6ICcjYjVlNGY0JyxcbiAgYmFzZTBEOiAnIzAxYTBlNCcsXG4gIGJhc2UwRTogJyNhMTZhOTQnLFxuICBiYXNlMEY6ICcjY2RhYjUzJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAndG9tb3Jyb3cnLFxuICBhdXRob3I6ICdjaHJpcyBrZW1wc29uIChodHRwOi8vY2hyaXNrZW1wc29uLmNvbSknLFxuICBiYXNlMDA6ICcjMWQxZjIxJyxcbiAgYmFzZTAxOiAnIzI4MmEyZScsXG4gIGJhc2UwMjogJyMzNzNiNDEnLFxuICBiYXNlMDM6ICcjOTY5ODk2JyxcbiAgYmFzZTA0OiAnI2I0YjdiNCcsXG4gIGJhc2UwNTogJyNjNWM4YzYnLFxuICBiYXNlMDY6ICcjZTBlMGUwJyxcbiAgYmFzZTA3OiAnI2ZmZmZmZicsXG4gIGJhc2UwODogJyNjYzY2NjYnLFxuICBiYXNlMDk6ICcjZGU5MzVmJyxcbiAgYmFzZTBBOiAnI2YwYzY3NCcsXG4gIGJhc2UwQjogJyNiNWJkNjgnLFxuICBiYXNlMEM6ICcjOGFiZWI3JyxcbiAgYmFzZTBEOiAnIzgxYTJiZScsXG4gIGJhc2UwRTogJyNiMjk0YmInLFxuICBiYXNlMEY6ICcjYTM2ODVhJ1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgc2NoZW1lOiAnbG9uZG9uIHR1YmUnLFxuICBhdXRob3I6ICdqYW4gdC4gc290dCcsXG4gIGJhc2UwMDogJyMyMzFmMjAnLFxuICBiYXNlMDE6ICcjMWMzZjk1JyxcbiAgYmFzZTAyOiAnIzVhNTc1OCcsXG4gIGJhc2UwMzogJyM3MzcxNzEnLFxuICBiYXNlMDQ6ICcjOTU5Y2ExJyxcbiAgYmFzZTA1OiAnI2Q5ZDhkOCcsXG4gIGJhc2UwNjogJyNlN2U3ZTgnLFxuICBiYXNlMDc6ICcjZmZmZmZmJyxcbiAgYmFzZTA4OiAnI2VlMmUyNCcsXG4gIGJhc2UwOTogJyNmMzg2YTEnLFxuICBiYXNlMEE6ICcjZmZkMjA0JyxcbiAgYmFzZTBCOiAnIzAwODUzZScsXG4gIGJhc2UwQzogJyM4NWNlYmMnLFxuICBiYXNlMEQ6ICcjMDA5ZGRjJyxcbiAgYmFzZTBFOiAnIzk4MDA1ZCcsXG4gIGJhc2UwRjogJyNiMDYxMTAnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBzY2hlbWU6ICd0d2lsaWdodCcsXG4gIGF1dGhvcjogJ2RhdmlkIGhhcnQgKGh0dHA6Ly9oYXJ0LWRldi5jb20pJyxcbiAgYmFzZTAwOiAnIzFlMWUxZScsXG4gIGJhc2UwMTogJyMzMjM1MzcnLFxuICBiYXNlMDI6ICcjNDY0YjUwJyxcbiAgYmFzZTAzOiAnIzVmNWE2MCcsXG4gIGJhc2UwNDogJyM4MzgxODQnLFxuICBiYXNlMDU6ICcjYTdhN2E3JyxcbiAgYmFzZTA2OiAnI2MzYzNjMycsXG4gIGJhc2UwNzogJyNmZmZmZmYnLFxuICBiYXNlMDg6ICcjY2Y2YTRjJyxcbiAgYmFzZTA5OiAnI2NkYTg2OScsXG4gIGJhc2UwQTogJyNmOWVlOTgnLFxuICBiYXNlMEI6ICcjOGY5ZDZhJyxcbiAgYmFzZTBDOiAnI2FmYzRkYicsXG4gIGJhc2UwRDogJyM3NTg3YTYnLFxuICBiYXNlMEU6ICcjOWI4NTlkJyxcbiAgYmFzZTBGOiAnIzliNzAzZidcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGZ1bmN0aW9uIChoZXhDb2xvciwgbGlnaHRuZXNzKSB7XG4gIHZhciBoZXggPSBTdHJpbmcoaGV4Q29sb3IpLnJlcGxhY2UoL1teMC05YS1mXS9naSwgJycpO1xuICBpZiAoaGV4Lmxlbmd0aCA8IDYpIHtcbiAgICBoZXggPSBoZXgucmVwbGFjZSgvKC4pL2csICckMSQxJyk7XG4gIH1cbiAgdmFyIGx1bSA9IGxpZ2h0bmVzcyB8fCAwO1xuXG4gIHZhciByZ2IgPSAnIyc7XG4gIHZhciBjID0gdW5kZWZpbmVkO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDM7ICsraSkge1xuICAgIGMgPSBwYXJzZUludChoZXguc3Vic3RyKGkgKiAyLCAyKSwgMTYpO1xuICAgIGMgPSBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsIGMgKyBjICogbHVtKSwgMjU1KSkudG9TdHJpbmcoMTYpO1xuICAgIHJnYiArPSAoJzAwJyArIGMpLnN1YnN0cihjLmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIHJnYjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbmhlcml0cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cycpWydkZWZhdWx0J107XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3MtY2FsbC1jaGVjaycpWydkZWZhdWx0J107XG5cbnZhciBfZXh0ZW5kcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9leHRlbmRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RNaXhpbiA9IHJlcXVpcmUoJ3JlYWN0LW1peGluJyk7XG5cbnZhciBfcmVhY3RNaXhpbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdE1peGluKTtcblxudmFyIF9taXhpbnMgPSByZXF1aXJlKCcuL21peGlucycpO1xuXG52YXIgX0pTT05BcnJvdyA9IHJlcXVpcmUoJy4vSlNPTkFycm93Jyk7XG5cbnZhciBfSlNPTkFycm93MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05BcnJvdyk7XG5cbnZhciBfZ3JhYk5vZGUgPSByZXF1aXJlKCcuL2dyYWItbm9kZScpO1xuXG52YXIgX2dyYWJOb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2dyYWJOb2RlKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYmFzZToge1xuICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgIHBhZGRpbmdUb3A6IDMsXG4gICAgcGFkZGluZ0JvdHRvbTogMyxcbiAgICBwYWRkaW5nUmlnaHQ6IDAsXG4gICAgbWFyZ2luTGVmdDogMTRcbiAgfSxcbiAgbGFiZWw6IHtcbiAgICBtYXJnaW46IDAsXG4gICAgcGFkZGluZzogMCxcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ1xuICB9LFxuICBzcGFuOiB7XG4gICAgY3Vyc29yOiAnZGVmYXVsdCdcbiAgfSxcbiAgc3BhblR5cGU6IHtcbiAgICBtYXJnaW5MZWZ0OiA1LFxuICAgIG1hcmdpblJpZ2h0OiA1XG4gIH1cbn07XG5cbnZhciBKU09OQXJyYXlOb2RlID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhKU09OQXJyYXlOb2RlLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBKU09OQXJyYXlOb2RlKHByb3BzKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIF9KU09OQXJyYXlOb2RlKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgdGhpcy5kZWZhdWx0UHJvcHMgPSB7XG4gICAgICBkYXRhOiBbXSxcbiAgICAgIGluaXRpYWxFeHBhbmRlZDogZmFsc2VcbiAgICB9O1xuICAgIHRoaXMubmVlZHNDaGlsZE5vZGVzID0gdHJ1ZTtcbiAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBbXTtcbiAgICB0aGlzLml0ZW1TdHJpbmcgPSBmYWxzZTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgZXhwYW5kZWQ6IHRoaXMucHJvcHMuaW5pdGlhbEV4cGFuZGVkLFxuICAgICAgY3JlYXRlZENoaWxkTm9kZXM6IGZhbHNlXG4gICAgfTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIGNoaWxkIG5vZGVzIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIGFycmF5LiBJZiB3ZSBoYXZlXG4gIC8vIGdlbmVyYXRlZCB0aGVtIHByZXZpb3VzbHksIHdlIHJldHVybiBmcm9tIGNhY2hlLCBvdGhlcndpc2Ugd2UgY3JlYXRlXG4gIC8vIHRoZW0uXG5cbiAgSlNPTkFycmF5Tm9kZS5wcm90b3R5cGUuZ2V0Q2hpbGROb2RlcyA9IGZ1bmN0aW9uIGdldENoaWxkTm9kZXMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGlmICh0aGlzLnN0YXRlLmV4cGFuZGVkICYmIHRoaXMubmVlZHNDaGlsZE5vZGVzKSB7XG4gICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2hpbGROb2RlcyA9IFtdO1xuICAgICAgICBfdGhpcy5wcm9wcy5kYXRhLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQsIGlkeCkge1xuICAgICAgICAgIHZhciBwcmV2RGF0YSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAodHlwZW9mIF90aGlzLnByb3BzLnByZXZpb3VzRGF0YSAhPT0gJ3VuZGVmaW5lZCcgJiYgX3RoaXMucHJvcHMucHJldmlvdXNEYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgICBwcmV2RGF0YSA9IF90aGlzLnByb3BzLnByZXZpb3VzRGF0YVtpZHhdO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgbm9kZSA9IF9ncmFiTm9kZTJbJ2RlZmF1bHQnXShpZHgsIGVsZW1lbnQsIHByZXZEYXRhLCBfdGhpcy5wcm9wcy50aGVtZSk7XG4gICAgICAgICAgaWYgKG5vZGUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICBjaGlsZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgX3RoaXMubmVlZHNDaGlsZE5vZGVzID0gZmFsc2U7XG4gICAgICAgIF90aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBjaGlsZE5vZGVzO1xuICAgICAgfSkoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVuZGVyZWRDaGlsZHJlbjtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBcIm4gSXRlbXNcIiBzdHJpbmcgZm9yIHRoaXMgbm9kZSwgZ2VuZXJhdGluZyBhbmRcbiAgLy8gY2FjaGluZyBpdCBpZiBpdCBoYXNuJ3QgYmVlbiBjcmVhdGVkIHlldC5cblxuICBKU09OQXJyYXlOb2RlLnByb3RvdHlwZS5nZXRJdGVtU3RyaW5nID0gZnVuY3Rpb24gZ2V0SXRlbVN0cmluZygpIHtcbiAgICBpZiAoIXRoaXMuaXRlbVN0cmluZykge1xuICAgICAgdGhpcy5pdGVtU3RyaW5nID0gdGhpcy5wcm9wcy5kYXRhLmxlbmd0aCArICcgaXRlbScgKyAodGhpcy5wcm9wcy5kYXRhLmxlbmd0aCAhPT0gMSA/ICdzJyA6ICcnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaXRlbVN0cmluZztcbiAgfTtcblxuICBKU09OQXJyYXlOb2RlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIGNoaWxkTm9kZXMgPSB0aGlzLmdldENoaWxkTm9kZXMoKTtcbiAgICB2YXIgY2hpbGRMaXN0U3R5bGUgPSB7XG4gICAgICBwYWRkaW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgbGlzdFN0eWxlOiAnbm9uZScsXG4gICAgICBkaXNwbGF5OiB0aGlzLnN0YXRlLmV4cGFuZGVkID8gJ2Jsb2NrJyA6ICdub25lJ1xuICAgIH07XG4gICAgdmFyIGNvbnRhaW5lclN0eWxlID0gdW5kZWZpbmVkO1xuICAgIHZhciBzcGFuU3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGVzLnNwYW4sIHtcbiAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRVxuICAgIH0pO1xuICAgIGNvbnRhaW5lclN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlcy5iYXNlKTtcbiAgICBpZiAodGhpcy5zdGF0ZS5leHBhbmRlZCkge1xuICAgICAgc3BhblN0eWxlID0gX2V4dGVuZHMoe30sIHNwYW5TdHlsZSwge1xuICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDNcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnbGknLFxuICAgICAgeyBzdHlsZTogY29udGFpbmVyU3R5bGUgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09OQXJyb3cyWydkZWZhdWx0J10sIHsgdGhlbWU6IHRoaXMucHJvcHMudGhlbWUsIG9wZW46IHRoaXMuc3RhdGUuZXhwYW5kZWQsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9KSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnbGFiZWwnLFxuICAgICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmxhYmVsLCB7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMERcbiAgICAgICAgICB9KSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICAgIHRoaXMucHJvcHMua2V5TmFtZSxcbiAgICAgICAgJzonXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdzcGFuJyxcbiAgICAgICAgeyBzdHlsZTogc3BhblN0eWxlLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgJ3NwYW4nLFxuICAgICAgICAgIHsgc3R5bGU6IHN0eWxlcy5zcGFuVHlwZSB9LFxuICAgICAgICAgICdbXSdcbiAgICAgICAgKSxcbiAgICAgICAgdGhpcy5nZXRJdGVtU3RyaW5nKClcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ29sJyxcbiAgICAgICAgeyBzdHlsZTogY2hpbGRMaXN0U3R5bGUgfSxcbiAgICAgICAgY2hpbGROb2Rlc1xuICAgICAgKVxuICAgICk7XG4gIH07XG5cbiAgdmFyIF9KU09OQXJyYXlOb2RlID0gSlNPTkFycmF5Tm9kZTtcbiAgSlNPTkFycmF5Tm9kZSA9IF9yZWFjdE1peGluMlsnZGVmYXVsdCddLmRlY29yYXRlKF9taXhpbnMuRXhwYW5kZWRTdGF0ZUhhbmRsZXJNaXhpbikoSlNPTkFycmF5Tm9kZSkgfHwgSlNPTkFycmF5Tm9kZTtcbiAgcmV0dXJuIEpTT05BcnJheU5vZGU7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gSlNPTkFycmF5Tm9kZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG4vLyBmbGFnIHRvIHNlZSBpZiB3ZSBzdGlsbCBuZWVkIHRvIHJlbmRlciBvdXIgY2hpbGQgbm9kZXNcblxuLy8gY2FjaGUgc3RvcmUgZm9yIG91ciBjaGlsZCBub2Rlc1xuXG4vLyBjYWNoZSBzdG9yZSBmb3IgdGhlIG51bWJlciBvZiBpdGVtcyBzdHJpbmcgd2UgZGlzcGxheSIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbmhlcml0cyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbmhlcml0cycpWydkZWZhdWx0J107XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3MtY2FsbC1jaGVjaycpWydkZWZhdWx0J107XG5cbnZhciBfZXh0ZW5kcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9leHRlbmRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGJhc2U6IHtcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICBtYXJnaW5MZWZ0OiAwLFxuICAgIG1hcmdpblRvcDogOCxcbiAgICBtYXJnaW5SaWdodDogNSxcbiAgICAnZmxvYXQnOiAnbGVmdCcsXG4gICAgdHJhbnNpdGlvbjogJzE1MG1zJyxcbiAgICBXZWJraXRUcmFuc2l0aW9uOiAnMTUwbXMnLFxuICAgIE1velRyYW5zaXRpb246ICcxNTBtcycsXG4gICAgYm9yZGVyTGVmdDogJzVweCBzb2xpZCB0cmFuc3BhcmVudCcsXG4gICAgYm9yZGVyUmlnaHQ6ICc1cHggc29saWQgdHJhbnNwYXJlbnQnLFxuICAgIGJvcmRlclRvcFdpZHRoOiA1LFxuICAgIGJvcmRlclRvcFN0eWxlOiAnc29saWQnLFxuICAgIFdlYmtpdFRyYW5zZm9ybTogJ3JvdGF0ZVooLTkwZGVnKScsXG4gICAgTW96VHJhbnNmb3JtOiAncm90YXRlWigtOTBkZWcpJyxcbiAgICB0cmFuc2Zvcm06ICdyb3RhdGVaKC05MGRlZyknXG4gIH0sXG4gIG9wZW46IHtcbiAgICBXZWJraXRUcmFuc2Zvcm06ICdyb3RhdGVaKDBkZWcpJyxcbiAgICBNb3pUcmFuc2Zvcm06ICdyb3RhdGVaKDBkZWcpJyxcbiAgICB0cmFuc2Zvcm06ICdyb3RhdGVaKDBkZWcpJ1xuICB9XG59O1xuXG52YXIgSlNPTkFycm93ID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhKU09OQXJyb3csIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIEpTT05BcnJvdygpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSlNPTkFycm93KTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIEpTT05BcnJvdy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBzdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZXMuYmFzZSwge1xuICAgICAgYm9yZGVyVG9wQ29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBEXG4gICAgfSk7XG4gICAgaWYgKHRoaXMucHJvcHMub3Blbikge1xuICAgICAgc3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGUsIHN0eWxlcy5vcGVuKTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IHN0eWxlOiBzdHlsZSwgb25DbGljazogdGhpcy5wcm9wcy5vbkNsaWNrIH0pO1xuICB9O1xuXG4gIHJldHVybiBKU09OQXJyb3c7XG59KShfcmVhY3QyWydkZWZhdWx0J10uQ29tcG9uZW50KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gSlNPTkFycm93O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2luaGVyaXRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrJylbJ2RlZmF1bHQnXTtcblxudmFyIF9leHRlbmRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdE1peGluID0gcmVxdWlyZSgncmVhY3QtbWl4aW4nKTtcblxudmFyIF9yZWFjdE1peGluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0TWl4aW4pO1xuXG52YXIgX21peGlucyA9IHJlcXVpcmUoJy4vbWl4aW5zJyk7XG5cbnZhciBfdXRpbHNIZXhUb1JnYiA9IHJlcXVpcmUoJy4vdXRpbHMvaGV4VG9SZ2InKTtcblxudmFyIF91dGlsc0hleFRvUmdiMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzSGV4VG9SZ2IpO1xuXG52YXIgc3R5bGVzID0ge1xuICBiYXNlOiB7XG4gICAgcGFkZGluZ1RvcDogMyxcbiAgICBwYWRkaW5nQm90dG9tOiAzLFxuICAgIHBhZGRpbmdSaWdodDogMCxcbiAgICBtYXJnaW5MZWZ0OiAxNFxuICB9LFxuICBsYWJlbDoge1xuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgIG1hcmdpblJpZ2h0OiA1XG4gIH1cbn07XG5cbnZhciBKU09OQm9vbGVhbk5vZGUgPSAoZnVuY3Rpb24gKF9SZWFjdCRDb21wb25lbnQpIHtcbiAgX2luaGVyaXRzKEpTT05Cb29sZWFuTm9kZSwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gSlNPTkJvb2xlYW5Ob2RlKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfSlNPTkJvb2xlYW5Ob2RlKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIEpTT05Cb29sZWFuTm9kZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciB0cnV0aFN0cmluZyA9IHRoaXMucHJvcHMudmFsdWUgPyAndHJ1ZScgOiAnZmFsc2UnO1xuICAgIHZhciBiYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIGlmICh0aGlzLnByb3BzLnByZXZpb3VzVmFsdWUgIT09IHRoaXMucHJvcHMudmFsdWUpIHtcbiAgICAgIHZhciBiZ0NvbG9yID0gX3V0aWxzSGV4VG9SZ2IyWydkZWZhdWx0J10odGhpcy5wcm9wcy50aGVtZS5iYXNlMDYpO1xuICAgICAgYmFja2dyb3VuZENvbG9yID0gJ3JnYmEoJyArIGJnQ29sb3IuciArICcsICcgKyBiZ0NvbG9yLmcgKyAnLCAnICsgYmdDb2xvci5iICsgJywgMC4xKSc7XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdsaScsXG4gICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJhc2UsIHsgYmFja2dyb3VuZENvbG9yOiBiYWNrZ3JvdW5kQ29sb3IgfSksIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdsYWJlbCcsXG4gICAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMubGFiZWwsIHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRFxuICAgICAgICAgIH0pIH0sXG4gICAgICAgIHRoaXMucHJvcHMua2V5TmFtZSxcbiAgICAgICAgJzonXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdzcGFuJyxcbiAgICAgICAgeyBzdHlsZTogeyBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDkgfSB9LFxuICAgICAgICB0cnV0aFN0cmluZ1xuICAgICAgKVxuICAgICk7XG4gIH07XG5cbiAgdmFyIF9KU09OQm9vbGVhbk5vZGUgPSBKU09OQm9vbGVhbk5vZGU7XG4gIEpTT05Cb29sZWFuTm9kZSA9IF9yZWFjdE1peGluMlsnZGVmYXVsdCddLmRlY29yYXRlKF9taXhpbnMuU3F1YXNoQ2xpY2tFdmVudE1peGluKShKU09OQm9vbGVhbk5vZGUpIHx8IEpTT05Cb29sZWFuTm9kZTtcbiAgcmV0dXJuIEpTT05Cb29sZWFuTm9kZTtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBKU09OQm9vbGVhbk5vZGU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW5oZXJpdHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2snKVsnZGVmYXVsdCddO1xuXG52YXIgX2V4dGVuZHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcycpWydkZWZhdWx0J107XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0TWl4aW4gPSByZXF1aXJlKCdyZWFjdC1taXhpbicpO1xuXG52YXIgX3JlYWN0TWl4aW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RNaXhpbik7XG5cbnZhciBfbWl4aW5zID0gcmVxdWlyZSgnLi9taXhpbnMnKTtcblxudmFyIF91dGlsc0hleFRvUmdiID0gcmVxdWlyZSgnLi91dGlscy9oZXhUb1JnYicpO1xuXG52YXIgX3V0aWxzSGV4VG9SZ2IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNIZXhUb1JnYik7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGJhc2U6IHtcbiAgICBwYWRkaW5nVG9wOiAzLFxuICAgIHBhZGRpbmdCb3R0b206IDMsXG4gICAgcGFkZGluZ1JpZ2h0OiAwLFxuICAgIG1hcmdpbkxlZnQ6IDE0XG4gIH0sXG4gIGxhYmVsOiB7XG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgbWFyZ2luUmlnaHQ6IDVcbiAgfVxufTtcblxudmFyIEpTT05EYXRlTm9kZSA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoSlNPTkRhdGVOb2RlLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBKU09ORGF0ZU5vZGUoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIF9KU09ORGF0ZU5vZGUpO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgSlNPTkRhdGVOb2RlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIGJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgaWYgKHRoaXMucHJvcHMucHJldmlvdXNWYWx1ZSAhPT0gdGhpcy5wcm9wcy52YWx1ZSkge1xuICAgICAgdmFyIGJnQ29sb3IgPSBfdXRpbHNIZXhUb1JnYjJbJ2RlZmF1bHQnXSh0aGlzLnByb3BzLnRoZW1lLmJhc2UwNik7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgnICsgYmdDb2xvci5yICsgJywgJyArIGJnQ29sb3IuZyArICcsICcgKyBiZ0NvbG9yLmIgKyAnLCAwLjEpJztcbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2xpJyxcbiAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMuYmFzZSwgeyBiYWNrZ3JvdW5kQ29sb3I6IGJhY2tncm91bmRDb2xvciB9KSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2xhYmVsJyxcbiAgICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5sYWJlbCwge1xuICAgICAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBEXG4gICAgICAgICAgfSkgfSxcbiAgICAgICAgdGhpcy5wcm9wcy5rZXlOYW1lLFxuICAgICAgICAnOidcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ3NwYW4nLFxuICAgICAgICB7IHN0eWxlOiB7IGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwQiB9IH0sXG4gICAgICAgIHRoaXMucHJvcHMudmFsdWUudG9JU09TdHJpbmcoKVxuICAgICAgKVxuICAgICk7XG4gIH07XG5cbiAgdmFyIF9KU09ORGF0ZU5vZGUgPSBKU09ORGF0ZU5vZGU7XG4gIEpTT05EYXRlTm9kZSA9IF9yZWFjdE1peGluMlsnZGVmYXVsdCddLmRlY29yYXRlKF9taXhpbnMuU3F1YXNoQ2xpY2tFdmVudE1peGluKShKU09ORGF0ZU5vZGUpIHx8IEpTT05EYXRlTm9kZTtcbiAgcmV0dXJuIEpTT05EYXRlTm9kZTtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBKU09ORGF0ZU5vZGU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW5oZXJpdHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2snKVsnZGVmYXVsdCddO1xuXG52YXIgX2V4dGVuZHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcycpWydkZWZhdWx0J107XG5cbnZhciBfZ2V0SXRlcmF0b3IgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2NvcmUtanMvZ2V0LWl0ZXJhdG9yJylbJ2RlZmF1bHQnXTtcblxudmFyIF9OdW1iZXIkaXNTYWZlSW50ZWdlciA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9udW1iZXIvaXMtc2FmZS1pbnRlZ2VyJylbJ2RlZmF1bHQnXTtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RNaXhpbiA9IHJlcXVpcmUoJ3JlYWN0LW1peGluJyk7XG5cbnZhciBfcmVhY3RNaXhpbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdE1peGluKTtcblxudmFyIF9taXhpbnMgPSByZXF1aXJlKCcuL21peGlucycpO1xuXG52YXIgX0pTT05BcnJvdyA9IHJlcXVpcmUoJy4vSlNPTkFycm93Jyk7XG5cbnZhciBfSlNPTkFycm93MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05BcnJvdyk7XG5cbnZhciBfZ3JhYk5vZGUgPSByZXF1aXJlKCcuL2dyYWItbm9kZScpO1xuXG52YXIgX2dyYWJOb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2dyYWJOb2RlKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYmFzZToge1xuICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgIHBhZGRpbmdUb3A6IDMsXG4gICAgcGFkZGluZ0JvdHRvbTogMyxcbiAgICBwYWRkaW5nUmlnaHQ6IDAsXG4gICAgbWFyZ2luTGVmdDogMTRcbiAgfSxcbiAgbGFiZWw6IHtcbiAgICBtYXJnaW46IDAsXG4gICAgcGFkZGluZzogMCxcbiAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ1xuICB9LFxuICBzcGFuOiB7XG4gICAgY3Vyc29yOiAnZGVmYXVsdCdcbiAgfSxcbiAgc3BhblR5cGU6IHtcbiAgICBtYXJnaW5MZWZ0OiA1LFxuICAgIG1hcmdpblJpZ2h0OiA1XG4gIH1cbn07XG5cbnZhciBKU09OSXRlcmFibGVOb2RlID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhKU09OSXRlcmFibGVOb2RlLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBKU09OSXRlcmFibGVOb2RlKHByb3BzKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIF9KU09OSXRlcmFibGVOb2RlKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgdGhpcy5kZWZhdWx0UHJvcHMgPSB7XG4gICAgICBkYXRhOiBbXSxcbiAgICAgIGluaXRpYWxFeHBhbmRlZDogZmFsc2VcbiAgICB9O1xuICAgIHRoaXMubmVlZHNDaGlsZE5vZGVzID0gdHJ1ZTtcbiAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBbXTtcbiAgICB0aGlzLml0ZW1TdHJpbmcgPSBmYWxzZTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgZXhwYW5kZWQ6IHRoaXMucHJvcHMuaW5pdGlhbEV4cGFuZGVkLFxuICAgICAgY3JlYXRlZENoaWxkTm9kZXM6IGZhbHNlXG4gICAgfTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIGNoaWxkIG5vZGVzIGZvciBlYWNoIGVudHJ5IGluIGl0ZXJhYmxlLiBJZiB3ZSBoYXZlXG4gIC8vIGdlbmVyYXRlZCB0aGVtIHByZXZpb3VzbHksIHdlIHJldHVybiBmcm9tIGNhY2hlLCBvdGhlcndpc2Ugd2UgY3JlYXRlXG4gIC8vIHRoZW0uXG5cbiAgSlNPTkl0ZXJhYmxlTm9kZS5wcm90b3R5cGUuZ2V0Q2hpbGROb2RlcyA9IGZ1bmN0aW9uIGdldENoaWxkTm9kZXMoKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuZXhwYW5kZWQgJiYgdGhpcy5uZWVkc0NoaWxkTm9kZXMpIHtcbiAgICAgIHZhciBjaGlsZE5vZGVzID0gW107XG4gICAgICBmb3IgKHZhciBfaXRlcmF0b3IgPSB0aGlzLnByb3BzLmRhdGEsIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheShfaXRlcmF0b3IpLCBfaSA9IDAsIF9pdGVyYXRvciA9IF9pc0FycmF5ID8gX2l0ZXJhdG9yIDogX2dldEl0ZXJhdG9yKF9pdGVyYXRvcik7Oykge1xuICAgICAgICB2YXIgX3JlZjtcblxuICAgICAgICBpZiAoX2lzQXJyYXkpIHtcbiAgICAgICAgICBpZiAoX2kgPj0gX2l0ZXJhdG9yLmxlbmd0aCkgYnJlYWs7XG4gICAgICAgICAgX3JlZiA9IF9pdGVyYXRvcltfaSsrXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfaSA9IF9pdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgaWYgKF9pLmRvbmUpIGJyZWFrO1xuICAgICAgICAgIF9yZWYgPSBfaS52YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlbnRyeSA9IF9yZWY7XG5cbiAgICAgICAgdmFyIGtleSA9IG51bGw7XG4gICAgICAgIHZhciB2YWx1ZSA9IG51bGw7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGVudHJ5KSkge1xuICAgICAgICAgIGtleSA9IGVudHJ5WzBdO1xuICAgICAgICAgIHZhbHVlID0gZW50cnlbMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAga2V5ID0gY2hpbGROb2Rlcy5sZW5ndGg7XG4gICAgICAgICAgdmFsdWUgPSBlbnRyeTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcmV2RGF0YSA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnByb3BzLnByZXZpb3VzRGF0YSAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5wcm9wcy5wcmV2aW91c0RhdGEgIT09IG51bGwpIHtcbiAgICAgICAgICBwcmV2RGF0YSA9IHRoaXMucHJvcHMucHJldmlvdXNEYXRhW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5vZGUgPSBfZ3JhYk5vZGUyWydkZWZhdWx0J10oa2V5LCB2YWx1ZSwgcHJldkRhdGEsIHRoaXMucHJvcHMudGhlbWUpO1xuICAgICAgICBpZiAobm9kZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBjaGlsZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMubmVlZHNDaGlsZE5vZGVzID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBjaGlsZE5vZGVzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlZENoaWxkcmVuO1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIFwibiBlbnRyaWVzXCIgc3RyaW5nIGZvciB0aGlzIG5vZGUsIGdlbmVyYXRpbmcgYW5kXG4gIC8vIGNhY2hpbmcgaXQgaWYgaXQgaGFzbid0IGJlZW4gY3JlYXRlZCB5ZXQuXG5cbiAgSlNPTkl0ZXJhYmxlTm9kZS5wcm90b3R5cGUuZ2V0SXRlbVN0cmluZyA9IGZ1bmN0aW9uIGdldEl0ZW1TdHJpbmcoKSB7XG4gICAgaWYgKCF0aGlzLml0ZW1TdHJpbmcpIHtcbiAgICAgIHZhciBkYXRhID0gdGhpcy5wcm9wcy5kYXRhO1xuXG4gICAgICB2YXIgY291bnQgPSAwO1xuICAgICAgaWYgKF9OdW1iZXIkaXNTYWZlSW50ZWdlcihkYXRhLnNpemUpKSB7XG4gICAgICAgIGNvdW50ID0gZGF0YS5zaXplO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgX2l0ZXJhdG9yMiA9IGRhdGEsIF9pc0FycmF5MiA9IEFycmF5LmlzQXJyYXkoX2l0ZXJhdG9yMiksIF9pMiA9IDAsIF9pdGVyYXRvcjIgPSBfaXNBcnJheTIgPyBfaXRlcmF0b3IyIDogX2dldEl0ZXJhdG9yKF9pdGVyYXRvcjIpOzspIHtcbiAgICAgICAgICB2YXIgX3JlZjI7XG5cbiAgICAgICAgICBpZiAoX2lzQXJyYXkyKSB7XG4gICAgICAgICAgICBpZiAoX2kyID49IF9pdGVyYXRvcjIubGVuZ3RoKSBicmVhaztcbiAgICAgICAgICAgIF9yZWYyID0gX2l0ZXJhdG9yMltfaTIrK107XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9pMiA9IF9pdGVyYXRvcjIubmV4dCgpO1xuICAgICAgICAgICAgaWYgKF9pMi5kb25lKSBicmVhaztcbiAgICAgICAgICAgIF9yZWYyID0gX2kyLnZhbHVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBlbnRyeSA9IF9yZWYyO1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICAgICAgICBjb3VudCArPSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLml0ZW1TdHJpbmcgPSBjb3VudCArICcgZW50cicgKyAoY291bnQgIT09IDEgPyAnaWVzJyA6ICd5Jyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLml0ZW1TdHJpbmc7XG4gIH07XG5cbiAgSlNPTkl0ZXJhYmxlTm9kZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBjaGlsZE5vZGVzID0gdGhpcy5nZXRDaGlsZE5vZGVzKCk7XG4gICAgdmFyIGNoaWxkTGlzdFN0eWxlID0ge1xuICAgICAgcGFkZGluZzogMCxcbiAgICAgIG1hcmdpbjogMCxcbiAgICAgIGxpc3RTdHlsZTogJ25vbmUnLFxuICAgICAgZGlzcGxheTogdGhpcy5zdGF0ZS5leHBhbmRlZCA/ICdibG9jaycgOiAnbm9uZSdcbiAgICB9O1xuICAgIHZhciBjb250YWluZXJTdHlsZSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgc3BhblN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlcy5zcGFuLCB7XG4gICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMEVcbiAgICB9KTtcbiAgICBjb250YWluZXJTdHlsZSA9IF9leHRlbmRzKHt9LCBzdHlsZXMuYmFzZSk7XG4gICAgaWYgKHRoaXMuc3RhdGUuZXhwYW5kZWQpIHtcbiAgICAgIHNwYW5TdHlsZSA9IF9leHRlbmRzKHt9LCBzcGFuU3R5bGUsIHtcbiAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTAzXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2xpJyxcbiAgICAgIHsgc3R5bGU6IGNvbnRhaW5lclN0eWxlIH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChfSlNPTkFycm93MlsnZGVmYXVsdCddLCB7IHRoZW1lOiB0aGlzLnByb3BzLnRoZW1lLCBvcGVuOiB0aGlzLnN0YXRlLmV4cGFuZGVkLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2xhYmVsJyxcbiAgICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5sYWJlbCwge1xuICAgICAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBEXG4gICAgICAgICAgfSksIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgICB0aGlzLnByb3BzLmtleU5hbWUsXG4gICAgICAgICc6J1xuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnc3BhbicsXG4gICAgICAgIHsgc3R5bGU6IHNwYW5TdHlsZSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICdzcGFuJyxcbiAgICAgICAgICB7IHN0eWxlOiBzdHlsZXMuc3BhblR5cGUgfSxcbiAgICAgICAgICAnKCknXG4gICAgICAgICksXG4gICAgICAgIHRoaXMuZ2V0SXRlbVN0cmluZygpXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdvbCcsXG4gICAgICAgIHsgc3R5bGU6IGNoaWxkTGlzdFN0eWxlIH0sXG4gICAgICAgIGNoaWxkTm9kZXNcbiAgICAgIClcbiAgICApO1xuICB9O1xuXG4gIHZhciBfSlNPTkl0ZXJhYmxlTm9kZSA9IEpTT05JdGVyYWJsZU5vZGU7XG4gIEpTT05JdGVyYWJsZU5vZGUgPSBfcmVhY3RNaXhpbjJbJ2RlZmF1bHQnXS5kZWNvcmF0ZShfbWl4aW5zLkV4cGFuZGVkU3RhdGVIYW5kbGVyTWl4aW4pKEpTT05JdGVyYWJsZU5vZGUpIHx8IEpTT05JdGVyYWJsZU5vZGU7XG4gIHJldHVybiBKU09OSXRlcmFibGVOb2RlO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEpTT05JdGVyYWJsZU5vZGU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLy8gZmxhZyB0byBzZWUgaWYgd2Ugc3RpbGwgbmVlZCB0byByZW5kZXIgb3VyIGNoaWxkIG5vZGVzXG5cbi8vIGNhY2hlIHN0b3JlIGZvciBvdXIgY2hpbGQgbm9kZXNcblxuLy8gY2FjaGUgc3RvcmUgZm9yIHRoZSBudW1iZXIgb2YgaXRlbXMgc3RyaW5nIHdlIGRpc3BsYXkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW5oZXJpdHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2snKVsnZGVmYXVsdCddO1xuXG52YXIgX2V4dGVuZHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcycpWydkZWZhdWx0J107XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0TWl4aW4gPSByZXF1aXJlKCdyZWFjdC1taXhpbicpO1xuXG52YXIgX3JlYWN0TWl4aW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RNaXhpbik7XG5cbnZhciBfbWl4aW5zID0gcmVxdWlyZSgnLi9taXhpbnMnKTtcblxudmFyIF91dGlsc0hleFRvUmdiID0gcmVxdWlyZSgnLi91dGlscy9oZXhUb1JnYicpO1xuXG52YXIgX3V0aWxzSGV4VG9SZ2IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNIZXhUb1JnYik7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGJhc2U6IHtcbiAgICBwYWRkaW5nVG9wOiAzLFxuICAgIHBhZGRpbmdCb3R0b206IDMsXG4gICAgcGFkZGluZ1JpZ2h0OiAwLFxuICAgIG1hcmdpbkxlZnQ6IDE0XG4gIH0sXG4gIGxhYmVsOiB7XG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgbWFyZ2luUmlnaHQ6IDVcbiAgfVxufTtcblxudmFyIEpTT05OdWxsTm9kZSA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoSlNPTk51bGxOb2RlLCBfUmVhY3QkQ29tcG9uZW50KTtcblxuICBmdW5jdGlvbiBKU09OTnVsbE5vZGUoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIF9KU09OTnVsbE5vZGUpO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgSlNPTk51bGxOb2RlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIGJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG4gICAgaWYgKHRoaXMucHJvcHMucHJldmlvdXNWYWx1ZSAhPT0gdGhpcy5wcm9wcy52YWx1ZSkge1xuICAgICAgdmFyIGJnQ29sb3IgPSBfdXRpbHNIZXhUb1JnYjJbJ2RlZmF1bHQnXSh0aGlzLnByb3BzLnRoZW1lLmJhc2UwNik7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgnICsgYmdDb2xvci5yICsgJywgJyArIGJnQ29sb3IuZyArICcsICcgKyBiZ0NvbG9yLmIgKyAnLCAwLjEpJztcbiAgICB9XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgJ2xpJyxcbiAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMuYmFzZSwgeyBiYWNrZ3JvdW5kQ29sb3I6IGJhY2tncm91bmRDb2xvciB9KSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2xhYmVsJyxcbiAgICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5sYWJlbCwge1xuICAgICAgICAgICAgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBEXG4gICAgICAgICAgfSkgfSxcbiAgICAgICAgdGhpcy5wcm9wcy5rZXlOYW1lLFxuICAgICAgICAnOidcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ3NwYW4nLFxuICAgICAgICB7IHN0eWxlOiB7IGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwOCB9IH0sXG4gICAgICAgICdudWxsJ1xuICAgICAgKVxuICAgICk7XG4gIH07XG5cbiAgdmFyIF9KU09OTnVsbE5vZGUgPSBKU09OTnVsbE5vZGU7XG4gIEpTT05OdWxsTm9kZSA9IF9yZWFjdE1peGluMlsnZGVmYXVsdCddLmRlY29yYXRlKF9taXhpbnMuU3F1YXNoQ2xpY2tFdmVudE1peGluKShKU09OTnVsbE5vZGUpIHx8IEpTT05OdWxsTm9kZTtcbiAgcmV0dXJuIEpTT05OdWxsTm9kZTtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBKU09OTnVsbE5vZGU7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfaW5oZXJpdHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW5oZXJpdHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2snKVsnZGVmYXVsdCddO1xuXG52YXIgX2V4dGVuZHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcycpWydkZWZhdWx0J107XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0TWl4aW4gPSByZXF1aXJlKCdyZWFjdC1taXhpbicpO1xuXG52YXIgX3JlYWN0TWl4aW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3RNaXhpbik7XG5cbnZhciBfbWl4aW5zID0gcmVxdWlyZSgnLi9taXhpbnMnKTtcblxudmFyIF91dGlsc0hleFRvUmdiID0gcmVxdWlyZSgnLi91dGlscy9oZXhUb1JnYicpO1xuXG52YXIgX3V0aWxzSGV4VG9SZ2IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNIZXhUb1JnYik7XG5cbnZhciBzdHlsZXMgPSB7XG4gIGJhc2U6IHtcbiAgICBwYWRkaW5nVG9wOiAzLFxuICAgIHBhZGRpbmdCb3R0b206IDMsXG4gICAgcGFkZGluZ1JpZ2h0OiAwLFxuICAgIG1hcmdpbkxlZnQ6IDE0XG4gIH0sXG4gIGxhYmVsOiB7XG4gICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgbWFyZ2luUmlnaHQ6IDVcbiAgfVxufTtcblxudmFyIEpTT05OdW1iZXJOb2RlID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhKU09OTnVtYmVyTm9kZSwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gSlNPTk51bWJlck5vZGUoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIF9KU09OTnVtYmVyTm9kZSk7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBKU09OTnVtYmVyTm9kZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHZhciBiYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIGlmICh0aGlzLnByb3BzLnByZXZpb3VzVmFsdWUgIT09IHRoaXMucHJvcHMudmFsdWUpIHtcbiAgICAgIHZhciBiZ0NvbG9yID0gX3V0aWxzSGV4VG9SZ2IyWydkZWZhdWx0J10odGhpcy5wcm9wcy50aGVtZS5iYXNlMDYpO1xuICAgICAgYmFja2dyb3VuZENvbG9yID0gJ3JnYmEoJyArIGJnQ29sb3IuciArICcsICcgKyBiZ0NvbG9yLmcgKyAnLCAnICsgYmdDb2xvci5iICsgJywgMC4xKSc7XG4gICAgfVxuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdsaScsXG4gICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmJhc2UsIHsgYmFja2dyb3VuZENvbG9yOiBiYWNrZ3JvdW5kQ29sb3IgfSksIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdsYWJlbCcsXG4gICAgICAgIHsgc3R5bGU6IF9leHRlbmRzKHt9LCBzdHlsZXMubGFiZWwsIHtcbiAgICAgICAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwRFxuICAgICAgICAgIH0pIH0sXG4gICAgICAgIHRoaXMucHJvcHMua2V5TmFtZSxcbiAgICAgICAgJzonXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdzcGFuJyxcbiAgICAgICAgeyBzdHlsZTogeyBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDkgfSB9LFxuICAgICAgICB0aGlzLnByb3BzLnZhbHVlXG4gICAgICApXG4gICAgKTtcbiAgfTtcblxuICB2YXIgX0pTT05OdW1iZXJOb2RlID0gSlNPTk51bWJlck5vZGU7XG4gIEpTT05OdW1iZXJOb2RlID0gX3JlYWN0TWl4aW4yWydkZWZhdWx0J10uZGVjb3JhdGUoX21peGlucy5TcXVhc2hDbGlja0V2ZW50TWl4aW4pKEpTT05OdW1iZXJOb2RlKSB8fCBKU09OTnVtYmVyTm9kZTtcbiAgcmV0dXJuIEpTT05OdW1iZXJOb2RlO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEpTT05OdW1iZXJOb2RlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2luaGVyaXRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrJylbJ2RlZmF1bHQnXTtcblxudmFyIF9leHRlbmRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX09iamVjdCRrZXlzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9rZXlzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfcmVhY3RNaXhpbiA9IHJlcXVpcmUoJ3JlYWN0LW1peGluJyk7XG5cbnZhciBfcmVhY3RNaXhpbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdE1peGluKTtcblxudmFyIF9taXhpbnMgPSByZXF1aXJlKCcuL21peGlucycpO1xuXG52YXIgX0pTT05BcnJvdyA9IHJlcXVpcmUoJy4vSlNPTkFycm93Jyk7XG5cbnZhciBfSlNPTkFycm93MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05BcnJvdyk7XG5cbnZhciBfZ3JhYk5vZGUgPSByZXF1aXJlKCcuL2dyYWItbm9kZScpO1xuXG52YXIgX2dyYWJOb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2dyYWJOb2RlKTtcblxudmFyIHN0eWxlcyA9IHtcbiAgYmFzZToge1xuICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgIHBhZGRpbmdUb3A6IDMsXG4gICAgcGFkZGluZ0JvdHRvbTogMyxcbiAgICBtYXJnaW5MZWZ0OiAxNFxuICB9LFxuICBsYWJlbDoge1xuICAgIG1hcmdpbjogMCxcbiAgICBwYWRkaW5nOiAwLFxuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXG4gIH0sXG4gIHNwYW46IHtcbiAgICBjdXJzb3I6ICdkZWZhdWx0J1xuICB9LFxuICBzcGFuVHlwZToge1xuICAgIG1hcmdpbkxlZnQ6IDUsXG4gICAgbWFyZ2luUmlnaHQ6IDVcbiAgfVxufTtcblxudmFyIEpTT05PYmplY3ROb2RlID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhKU09OT2JqZWN0Tm9kZSwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgZnVuY3Rpb24gSlNPTk9iamVjdE5vZGUocHJvcHMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgX0pTT05PYmplY3ROb2RlKTtcblxuICAgIF9SZWFjdCRDb21wb25lbnQuY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgdGhpcy5kZWZhdWx0UHJvcHMgPSB7XG4gICAgICBkYXRhOiBbXSxcbiAgICAgIGluaXRpYWxFeHBhbmRlZDogZmFsc2VcbiAgICB9O1xuICAgIHRoaXMuaXRlbVN0cmluZyA9IGZhbHNlO1xuICAgIHRoaXMubmVlZHNDaGlsZE5vZGVzID0gdHJ1ZTtcbiAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBbXTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgZXhwYW5kZWQ6IHRoaXMucHJvcHMuaW5pdGlhbEV4cGFuZGVkLFxuICAgICAgY3JlYXRlZENoaWxkTm9kZXM6IGZhbHNlXG4gICAgfTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIGNoaWxkIG5vZGVzIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIG9iamVjdC4gSWYgd2UgaGF2ZVxuICAvLyBnZW5lcmF0ZWQgdGhlbSBwcmV2aW91c2x5LCB3ZSByZXR1cm4gZnJvbSBjYWNoZSwgb3RoZXJ3aXNlIHdlIGNyZWF0ZVxuICAvLyB0aGVtLlxuXG4gIEpTT05PYmplY3ROb2RlLnByb3RvdHlwZS5nZXRDaGlsZE5vZGVzID0gZnVuY3Rpb24gZ2V0Q2hpbGROb2RlcygpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5leHBhbmRlZCAmJiB0aGlzLm5lZWRzQ2hpbGROb2Rlcykge1xuICAgICAgdmFyIG9iaiA9IHRoaXMucHJvcHMuZGF0YTtcbiAgICAgIHZhciBjaGlsZE5vZGVzID0gW107XG4gICAgICBmb3IgKHZhciBrIGluIG9iaikge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgdmFyIHByZXZEYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy5wcmV2aW91c0RhdGEgIT09ICd1bmRlZmluZWQnICYmIHRoaXMucHJvcHMucHJldmlvdXNEYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgICBwcmV2RGF0YSA9IHRoaXMucHJvcHMucHJldmlvdXNEYXRhW2tdO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgbm9kZSA9IF9ncmFiTm9kZTJbJ2RlZmF1bHQnXShrLCBvYmpba10sIHByZXZEYXRhLCB0aGlzLnByb3BzLnRoZW1lKTtcbiAgICAgICAgICBpZiAobm9kZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGNoaWxkTm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMubmVlZHNDaGlsZE5vZGVzID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlcmVkQ2hpbGRyZW4gPSBjaGlsZE5vZGVzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZW5kZXJlZENoaWxkcmVuO1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIFwibiBJdGVtc1wiIHN0cmluZyBmb3IgdGhpcyBub2RlLCBnZW5lcmF0aW5nIGFuZFxuICAvLyBjYWNoaW5nIGl0IGlmIGl0IGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LlxuXG4gIEpTT05PYmplY3ROb2RlLnByb3RvdHlwZS5nZXRJdGVtU3RyaW5nID0gZnVuY3Rpb24gZ2V0SXRlbVN0cmluZygpIHtcbiAgICBpZiAoIXRoaXMuaXRlbVN0cmluZykge1xuICAgICAgdmFyIGxlbiA9IF9PYmplY3Qka2V5cyh0aGlzLnByb3BzLmRhdGEpLmxlbmd0aDtcbiAgICAgIHRoaXMuaXRlbVN0cmluZyA9IGxlbiArICcga2V5JyArIChsZW4gIT09IDEgPyAncycgOiAnJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLml0ZW1TdHJpbmc7XG4gIH07XG5cbiAgSlNPTk9iamVjdE5vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgY2hpbGRMaXN0U3R5bGUgPSB7XG4gICAgICBwYWRkaW5nOiAwLFxuICAgICAgbWFyZ2luOiAwLFxuICAgICAgbGlzdFN0eWxlOiAnbm9uZScsXG4gICAgICBkaXNwbGF5OiB0aGlzLnN0YXRlLmV4cGFuZGVkID8gJ2Jsb2NrJyA6ICdub25lJ1xuICAgIH07XG4gICAgdmFyIGNvbnRhaW5lclN0eWxlID0gdW5kZWZpbmVkO1xuICAgIHZhciBzcGFuU3R5bGUgPSBfZXh0ZW5kcyh7fSwgc3R5bGVzLnNwYW4sIHtcbiAgICAgIGNvbG9yOiB0aGlzLnByb3BzLnRoZW1lLmJhc2UwQlxuICAgIH0pO1xuICAgIGNvbnRhaW5lclN0eWxlID0gX2V4dGVuZHMoe30sIHN0eWxlcy5iYXNlKTtcbiAgICBpZiAodGhpcy5zdGF0ZS5leHBhbmRlZCkge1xuICAgICAgc3BhblN0eWxlID0gX2V4dGVuZHMoe30sIHNwYW5TdHlsZSwge1xuICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMDNcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnbGknLFxuICAgICAgeyBzdHlsZTogY29udGFpbmVyU3R5bGUgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09OQXJyb3cyWydkZWZhdWx0J10sIHsgdGhlbWU6IHRoaXMucHJvcHMudGhlbWUsIG9wZW46IHRoaXMuc3RhdGUuZXhwYW5kZWQsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSB9KSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnbGFiZWwnLFxuICAgICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmxhYmVsLCB7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMERcbiAgICAgICAgICB9KSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpIH0sXG4gICAgICAgIHRoaXMucHJvcHMua2V5TmFtZSxcbiAgICAgICAgJzonXG4gICAgICApLFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdzcGFuJyxcbiAgICAgICAgeyBzdHlsZTogc3BhblN0eWxlLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgJ3NwYW4nLFxuICAgICAgICAgIHsgc3R5bGU6IHN0eWxlcy5zcGFuVHlwZSB9LFxuICAgICAgICAgICd7fSdcbiAgICAgICAgKSxcbiAgICAgICAgdGhpcy5nZXRJdGVtU3RyaW5nKClcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ3VsJyxcbiAgICAgICAgeyBzdHlsZTogY2hpbGRMaXN0U3R5bGUgfSxcbiAgICAgICAgdGhpcy5nZXRDaGlsZE5vZGVzKClcbiAgICAgIClcbiAgICApO1xuICB9O1xuXG4gIHZhciBfSlNPTk9iamVjdE5vZGUgPSBKU09OT2JqZWN0Tm9kZTtcbiAgSlNPTk9iamVjdE5vZGUgPSBfcmVhY3RNaXhpbjJbJ2RlZmF1bHQnXS5kZWNvcmF0ZShfbWl4aW5zLkV4cGFuZGVkU3RhdGVIYW5kbGVyTWl4aW4pKEpTT05PYmplY3ROb2RlKSB8fCBKU09OT2JqZWN0Tm9kZTtcbiAgcmV0dXJuIEpTT05PYmplY3ROb2RlO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEpTT05PYmplY3ROb2RlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbi8vIGNhY2hlIHN0b3JlIGZvciB0aGUgbnVtYmVyIG9mIGl0ZW1zIHN0cmluZyB3ZSBkaXNwbGF5XG5cbi8vIGZsYWcgdG8gc2VlIGlmIHdlIHN0aWxsIG5lZWQgdG8gcmVuZGVyIG91ciBjaGlsZCBub2Rlc1xuXG4vLyBjYWNoZSBzdG9yZSBmb3Igb3VyIGNoaWxkIG5vZGVzIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2luaGVyaXRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzcy1jYWxsLWNoZWNrJylbJ2RlZmF1bHQnXTtcblxudmFyIF9leHRlbmRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2V4dGVuZHMnKVsnZGVmYXVsdCddO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlRGVmYXVsdCA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9pbnRlcm9wLXJlcXVpcmUtZGVmYXVsdCcpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfcmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuXG52YXIgX3JlYWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0KTtcblxudmFyIF9yZWFjdE1peGluID0gcmVxdWlyZSgncmVhY3QtbWl4aW4nKTtcblxudmFyIF9yZWFjdE1peGluMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3JlYWN0TWl4aW4pO1xuXG52YXIgX21peGlucyA9IHJlcXVpcmUoJy4vbWl4aW5zJyk7XG5cbnZhciBfdXRpbHNIZXhUb1JnYiA9IHJlcXVpcmUoJy4vdXRpbHMvaGV4VG9SZ2InKTtcblxudmFyIF91dGlsc0hleFRvUmdiMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzSGV4VG9SZ2IpO1xuXG52YXIgc3R5bGVzID0ge1xuICBiYXNlOiB7XG4gICAgcGFkZGluZ1RvcDogMyxcbiAgICBwYWRkaW5nQm90dG9tOiAzLFxuICAgIHBhZGRpbmdSaWdodDogMCxcbiAgICBtYXJnaW5MZWZ0OiAxNFxuICB9LFxuICBsYWJlbDoge1xuICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgIG1hcmdpblJpZ2h0OiA1XG4gIH1cbn07XG5cbnZhciBKU09OU3RyaW5nTm9kZSA9IChmdW5jdGlvbiAoX1JlYWN0JENvbXBvbmVudCkge1xuICBfaW5oZXJpdHMoSlNPTlN0cmluZ05vZGUsIF9SZWFjdCRDb21wb25lbnQpO1xuXG4gIGZ1bmN0aW9uIEpTT05TdHJpbmdOb2RlKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBfSlNPTlN0cmluZ05vZGUpO1xuXG4gICAgX1JlYWN0JENvbXBvbmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgSlNPTlN0cmluZ05vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICBpZiAodGhpcy5wcm9wcy5wcmV2aW91c1ZhbHVlICE9PSB0aGlzLnByb3BzLnZhbHVlKSB7XG4gICAgICB2YXIgYmdDb2xvciA9IF91dGlsc0hleFRvUmdiMlsnZGVmYXVsdCddKHRoaXMucHJvcHMudGhlbWUuYmFzZTA2KTtcbiAgICAgIGJhY2tncm91bmRDb2xvciA9ICdyZ2JhKCcgKyBiZ0NvbG9yLnIgKyAnLCAnICsgYmdDb2xvci5nICsgJywgJyArIGJnQ29sb3IuYiArICcsIDAuMSknO1xuICAgIH1cbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAnbGknLFxuICAgICAgeyBzdHlsZTogX2V4dGVuZHMoe30sIHN0eWxlcy5iYXNlLCB7IGJhY2tncm91bmRDb2xvcjogYmFja2dyb3VuZENvbG9yIH0pLCBvbkNsaWNrOiB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykgfSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnbGFiZWwnLFxuICAgICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLmxhYmVsLCB7XG4gICAgICAgICAgICBjb2xvcjogdGhpcy5wcm9wcy50aGVtZS5iYXNlMERcbiAgICAgICAgICB9KSB9LFxuICAgICAgICB0aGlzLnByb3BzLmtleU5hbWUsXG4gICAgICAgICc6J1xuICAgICAgKSxcbiAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAnc3BhbicsXG4gICAgICAgIHsgc3R5bGU6IHsgY29sb3I6IHRoaXMucHJvcHMudGhlbWUuYmFzZTBCIH0gfSxcbiAgICAgICAgJ1wiJyxcbiAgICAgICAgdGhpcy5wcm9wcy52YWx1ZSxcbiAgICAgICAgJ1wiJ1xuICAgICAgKVxuICAgICk7XG4gIH07XG5cbiAgdmFyIF9KU09OU3RyaW5nTm9kZSA9IEpTT05TdHJpbmdOb2RlO1xuICBKU09OU3RyaW5nTm9kZSA9IF9yZWFjdE1peGluMlsnZGVmYXVsdCddLmRlY29yYXRlKF9taXhpbnMuU3F1YXNoQ2xpY2tFdmVudE1peGluKShKU09OU3RyaW5nTm9kZSkgfHwgSlNPTlN0cmluZ05vZGU7XG4gIHJldHVybiBKU09OU3RyaW5nTm9kZTtcbn0pKF9yZWFjdDJbJ2RlZmF1bHQnXS5Db21wb25lbnQpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBKU09OU3RyaW5nTm9kZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvaW50ZXJvcC1yZXF1aXJlLWRlZmF1bHQnKVsnZGVmYXVsdCddO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX3JlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxudmFyIF9yZWFjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWFjdCk7XG5cbnZhciBfb2JqVHlwZSA9IHJlcXVpcmUoJy4vb2JqLXR5cGUnKTtcblxudmFyIF9vYmpUeXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX29ialR5cGUpO1xuXG52YXIgX0pTT05PYmplY3ROb2RlID0gcmVxdWlyZSgnLi9KU09OT2JqZWN0Tm9kZScpO1xuXG52YXIgX0pTT05PYmplY3ROb2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05PYmplY3ROb2RlKTtcblxudmFyIF9KU09OQXJyYXlOb2RlID0gcmVxdWlyZSgnLi9KU09OQXJyYXlOb2RlJyk7XG5cbnZhciBfSlNPTkFycmF5Tm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09OQXJyYXlOb2RlKTtcblxudmFyIF9KU09OSXRlcmFibGVOb2RlID0gcmVxdWlyZSgnLi9KU09OSXRlcmFibGVOb2RlJyk7XG5cbnZhciBfSlNPTkl0ZXJhYmxlTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09OSXRlcmFibGVOb2RlKTtcblxudmFyIF9KU09OU3RyaW5nTm9kZSA9IHJlcXVpcmUoJy4vSlNPTlN0cmluZ05vZGUnKTtcblxudmFyIF9KU09OU3RyaW5nTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09OU3RyaW5nTm9kZSk7XG5cbnZhciBfSlNPTk51bWJlck5vZGUgPSByZXF1aXJlKCcuL0pTT05OdW1iZXJOb2RlJyk7XG5cbnZhciBfSlNPTk51bWJlck5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTk51bWJlck5vZGUpO1xuXG52YXIgX0pTT05Cb29sZWFuTm9kZSA9IHJlcXVpcmUoJy4vSlNPTkJvb2xlYW5Ob2RlJyk7XG5cbnZhciBfSlNPTkJvb2xlYW5Ob2RlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0pTT05Cb29sZWFuTm9kZSk7XG5cbnZhciBfSlNPTk51bGxOb2RlID0gcmVxdWlyZSgnLi9KU09OTnVsbE5vZGUnKTtcblxudmFyIF9KU09OTnVsbE5vZGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSlNPTk51bGxOb2RlKTtcblxudmFyIF9KU09ORGF0ZU5vZGUgPSByZXF1aXJlKCcuL0pTT05EYXRlTm9kZScpO1xuXG52YXIgX0pTT05EYXRlTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9KU09ORGF0ZU5vZGUpO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgcHJldlZhbHVlLCB0aGVtZSkge1xuICB2YXIgaW5pdGlhbEV4cGFuZGVkID0gYXJndW1lbnRzLmxlbmd0aCA8PSA0IHx8IGFyZ3VtZW50c1s0XSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBhcmd1bWVudHNbNF07XG5cbiAgdmFyIG5vZGVUeXBlID0gX29ialR5cGUyWydkZWZhdWx0J10odmFsdWUpO1xuICBpZiAobm9kZVR5cGUgPT09ICdPYmplY3QnKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09OT2JqZWN0Tm9kZTJbJ2RlZmF1bHQnXSwgeyBkYXRhOiB2YWx1ZSwgcHJldmlvdXNEYXRhOiBwcmV2VmFsdWUsIHRoZW1lOiB0aGVtZSwgaW5pdGlhbEV4cGFuZGVkOiBpbml0aWFsRXhwYW5kZWQsIGtleU5hbWU6IGtleSwga2V5OiBrZXkgfSk7XG4gIH0gZWxzZSBpZiAobm9kZVR5cGUgPT09ICdBcnJheScpIHtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05BcnJheU5vZGUyWydkZWZhdWx0J10sIHsgZGF0YTogdmFsdWUsIHByZXZpb3VzRGF0YTogcHJldlZhbHVlLCB0aGVtZTogdGhlbWUsIGluaXRpYWxFeHBhbmRlZDogaW5pdGlhbEV4cGFuZGVkLCBrZXlOYW1lOiBrZXksIGtleToga2V5IH0pO1xuICB9IGVsc2UgaWYgKG5vZGVUeXBlID09PSAnSXRlcmFibGUnKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09OSXRlcmFibGVOb2RlMlsnZGVmYXVsdCddLCB7IGRhdGE6IHZhbHVlLCBwcmV2aW91c0RhdGE6IHByZXZWYWx1ZSwgdGhlbWU6IHRoZW1lLCBpbml0aWFsRXhwYW5kZWQ6IGluaXRpYWxFeHBhbmRlZCwga2V5TmFtZToga2V5LCBrZXk6IGtleSB9KTtcbiAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gJ1N0cmluZycpIHtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05TdHJpbmdOb2RlMlsnZGVmYXVsdCddLCB7IGtleU5hbWU6IGtleSwgcHJldmlvdXNWYWx1ZTogcHJldlZhbHVlLCB0aGVtZTogdGhlbWUsIHZhbHVlOiB2YWx1ZSwga2V5OiBrZXkgfSk7XG4gIH0gZWxzZSBpZiAobm9kZVR5cGUgPT09ICdOdW1iZXInKSB7XG4gICAgcmV0dXJuIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KF9KU09OTnVtYmVyTm9kZTJbJ2RlZmF1bHQnXSwgeyBrZXlOYW1lOiBrZXksIHByZXZpb3VzVmFsdWU6IHByZXZWYWx1ZSwgdGhlbWU6IHRoZW1lLCB2YWx1ZTogdmFsdWUsIGtleToga2V5IH0pO1xuICB9IGVsc2UgaWYgKG5vZGVUeXBlID09PSAnQm9vbGVhbicpIHtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05Cb29sZWFuTm9kZTJbJ2RlZmF1bHQnXSwgeyBrZXlOYW1lOiBrZXksIHByZXZpb3VzVmFsdWU6IHByZXZWYWx1ZSwgdGhlbWU6IHRoZW1lLCB2YWx1ZTogdmFsdWUsIGtleToga2V5IH0pO1xuICB9IGVsc2UgaWYgKG5vZGVUeXBlID09PSAnRGF0ZScpIHtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05EYXRlTm9kZTJbJ2RlZmF1bHQnXSwgeyBrZXlOYW1lOiBrZXksIHByZXZpb3VzVmFsdWU6IHByZXZWYWx1ZSwgdGhlbWU6IHRoZW1lLCB2YWx1ZTogdmFsdWUsIGtleToga2V5IH0pO1xuICB9IGVsc2UgaWYgKG5vZGVUeXBlID09PSAnTnVsbCcpIHtcbiAgICByZXR1cm4gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX0pTT05OdWxsTm9kZTJbJ2RlZmF1bHQnXSwgeyBrZXlOYW1lOiBrZXksIHByZXZpb3VzVmFsdWU6IHByZXZWYWx1ZSwgdGhlbWU6IHRoZW1lLCB2YWx1ZTogdmFsdWUsIGtleToga2V5IH0pO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIi8vIEVTNiArIGlubGluZSBzdHlsZSBwb3J0IG9mIEpTT05WaWV3ZXIgaHR0cHM6Ly9iaXRidWNrZXQub3JnL2RhdmV2ZWRkZXIvcmVhY3QtanNvbi12aWV3ZXIvXG4vLyBhbGwgY3JlZGl0cyBhbmQgb3JpZ2luYWwgY29kZSB0byB0aGUgYXV0aG9yXG4vLyBEYXZlIFZlZGRlciA8dmVkZGVybWF0aWNAZ21haWwuY29tPiBodHRwOi8vd3d3LmVza2ltb3NweS5jb20vXG4vLyBwb3J0IGJ5IERhbmllbGUgWmFubm90dGkgaHR0cDovL3d3dy5naXRodWIuY29tL2R6YW5ub3R0aSA8ZHphbm5vdHRpQG1lLmNvbT5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2luaGVyaXRzID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2luaGVyaXRzJylbJ2RlZmF1bHQnXTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IHJlcXVpcmUoJ2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jcmVhdGUtY2xhc3MnKVsnZGVmYXVsdCddO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2NsYXNzLWNhbGwtY2hlY2snKVsnZGVmYXVsdCddO1xuXG52YXIgX2V4dGVuZHMgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2hlbHBlcnMvZXh0ZW5kcycpWydkZWZhdWx0J107XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZS1kZWZhdWx0JylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX2dyYWJOb2RlID0gcmVxdWlyZSgnLi9ncmFiLW5vZGUnKTtcblxudmFyIF9ncmFiTm9kZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9ncmFiTm9kZSk7XG5cbnZhciBfdGhlbWVzU29sYXJpemVkID0gcmVxdWlyZSgnLi90aGVtZXMvc29sYXJpemVkJyk7XG5cbnZhciBfdGhlbWVzU29sYXJpemVkMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3RoZW1lc1NvbGFyaXplZCk7XG5cbnZhciBzdHlsZXMgPSB7XG4gIHRyZWU6IHtcbiAgICBib3JkZXI6IDAsXG4gICAgcGFkZGluZzogMCxcbiAgICBtYXJnaW5Ub3A6IDgsXG4gICAgbWFyZ2luQm90dG9tOiA4LFxuICAgIG1hcmdpbkxlZnQ6IDIsXG4gICAgbWFyZ2luUmlnaHQ6IDAsXG4gICAgZm9udFNpemU6ICcwLjkwZW0nLFxuICAgIGxpc3RTdHlsZTogJ25vbmUnLFxuICAgIE1velVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICBXZWJraXRVc2VyU2VsZWN0OiAnbm9uZSdcbiAgfVxufTtcblxudmFyIEpTT05UcmVlID0gKGZ1bmN0aW9uIChfUmVhY3QkQ29tcG9uZW50KSB7XG4gIF9pbmhlcml0cyhKU09OVHJlZSwgX1JlYWN0JENvbXBvbmVudCk7XG5cbiAgX2NyZWF0ZUNsYXNzKEpTT05UcmVlLCBudWxsLCBbe1xuICAgIGtleTogJ3Byb3BUeXBlcycsXG4gICAgdmFsdWU6IHtcbiAgICAgIGRhdGE6IF9yZWFjdDJbJ2RlZmF1bHQnXS5Qcm9wVHlwZXMub25lT2ZUeXBlKFtfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLmFycmF5LCBfcmVhY3QyWydkZWZhdWx0J10uUHJvcFR5cGVzLm9iamVjdF0pLmlzUmVxdWlyZWRcbiAgICB9LFxuICAgIGVudW1lcmFibGU6IHRydWVcbiAgfSwge1xuICAgIGtleTogJ2RlZmF1bHRQcm9wcycsXG4gICAgdmFsdWU6IHtcbiAgICAgIHRoZW1lOiBfdGhlbWVzU29sYXJpemVkMlsnZGVmYXVsdCddXG4gICAgfSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH1dKTtcblxuICBmdW5jdGlvbiBKU09OVHJlZShwcm9wcykge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBKU09OVHJlZSk7XG5cbiAgICBfUmVhY3QkQ29tcG9uZW50LmNhbGwodGhpcywgcHJvcHMpO1xuICB9XG5cbiAgSlNPTlRyZWUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIga2V5TmFtZSA9IHRoaXMucHJvcHMua2V5TmFtZSB8fCAncm9vdCc7XG4gICAgdmFyIHJvb3ROb2RlID0gX2dyYWJOb2RlMlsnZGVmYXVsdCddKGtleU5hbWUsIHRoaXMucHJvcHMuZGF0YSwgdGhpcy5wcm9wcy5wcmV2aW91c0RhdGEsIHRoaXMucHJvcHMudGhlbWUsIHRydWUpO1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICd1bCcsXG4gICAgICB7IHN0eWxlOiBfZXh0ZW5kcyh7fSwgc3R5bGVzLnRyZWUsIHRoaXMucHJvcHMuc3R5bGUpIH0sXG4gICAgICByb290Tm9kZVxuICAgICk7XG4gIH07XG5cbiAgcmV0dXJuIEpTT05UcmVlO1xufSkoX3JlYWN0MlsnZGVmYXVsdCddLkNvbXBvbmVudCk7XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IEpTT05UcmVlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHtcbiAgaGFuZGxlQ2xpY2s6IGZ1bmN0aW9uIGhhbmRsZUNsaWNrKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZXhwYW5kZWQ6ICF0aGlzLnN0YXRlLmV4cGFuZGVkXG4gICAgfSk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcygpIHtcbiAgICAvLyByZXNldHMgb3VyIGNhY2hlcyBhbmQgZmxhZ3Mgd2UgbmVlZCB0byBidWlsZCBjaGlsZCBub2RlcyBhZ2FpblxuICAgIHRoaXMucmVuZGVyZWRDaGlsZHJlbiA9IFtdO1xuICAgIHRoaXMuaXRlbVN0cmluZyA9IGZhbHNlO1xuICAgIHRoaXMubmVlZHNDaGlsZE5vZGVzID0gdHJ1ZTtcbiAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1tcImRlZmF1bHRcIl07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2ludGVyb3BSZXF1aXJlID0gcmVxdWlyZSgnYmFiZWwtcnVudGltZS9oZWxwZXJzL2ludGVyb3AtcmVxdWlyZScpWydkZWZhdWx0J107XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfc3F1YXNoQ2xpY2tFdmVudCA9IHJlcXVpcmUoJy4vc3F1YXNoLWNsaWNrLWV2ZW50Jyk7XG5cbmV4cG9ydHMuU3F1YXNoQ2xpY2tFdmVudE1peGluID0gX2ludGVyb3BSZXF1aXJlKF9zcXVhc2hDbGlja0V2ZW50KTtcblxudmFyIF9leHBhbmRlZFN0YXRlSGFuZGxlciA9IHJlcXVpcmUoJy4vZXhwYW5kZWQtc3RhdGUtaGFuZGxlcicpO1xuXG5leHBvcnRzLkV4cGFuZGVkU3RhdGVIYW5kbGVyTWl4aW4gPSBfaW50ZXJvcFJlcXVpcmUoX2V4cGFuZGVkU3RhdGVIYW5kbGVyKTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0ge1xuICBoYW5kbGVDbGljazogZnVuY3Rpb24gaGFuZGxlQ2xpY2soZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbXCJkZWZhdWx0XCJdOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIF9TeW1ib2wkaXRlcmF0b3IgPSByZXF1aXJlKCdiYWJlbC1ydW50aW1lL2NvcmUtanMvc3ltYm9sL2l0ZXJhdG9yJylbJ2RlZmF1bHQnXTtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqICE9PSBudWxsICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmICFBcnJheS5pc0FycmF5KG9iaikgJiYgdHlwZW9mIG9ialtfU3ltYm9sJGl0ZXJhdG9yXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiAnSXRlcmFibGUnO1xuICB9XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKS5zbGljZSg4LCAtMSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAoaGV4KSB7XG4gIHZhciByZXN1bHQgPSAvXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLmV4ZWMoaGV4KTtcbiAgcmV0dXJuIHJlc3VsdCA/IHtcbiAgICByOiBwYXJzZUludChyZXN1bHRbMV0sIDE2KSxcbiAgICBnOiBwYXJzZUludChyZXN1bHRbMl0sIDE2KSxcbiAgICBiOiBwYXJzZUludChyZXN1bHRbM10sIDE2KVxuICB9IDogbnVsbDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1tcImRlZmF1bHRcIl07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL2dldC1pdGVyYXRvclwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9udW1iZXIvaXMtc2FmZS1pbnRlZ2VyXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9hc3NpZ25cIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2NyZWF0ZVwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZGVmaW5lLXByb3BlcnR5XCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9rZXlzXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9zZXQtcHJvdG90eXBlLW9mXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwibW9kdWxlLmV4cG9ydHMgPSB7IFwiZGVmYXVsdFwiOiByZXF1aXJlKFwiY29yZS1qcy9saWJyYXJ5L2ZuL3N5bWJvbC9pdGVyYXRvclwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xuICB9XG59O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX09iamVjdCRkZWZpbmVQcm9wZXJ0eSA9IHJlcXVpcmUoXCJiYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2RlZmluZS1wcm9wZXJ0eVwiKVtcImRlZmF1bHRcIl07XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG5cbiAgICAgIF9PYmplY3QkZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICAgIGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpO1xuICAgIHJldHVybiBDb25zdHJ1Y3RvcjtcbiAgfTtcbn0pKCk7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfT2JqZWN0JGFzc2lnbiA9IHJlcXVpcmUoXCJiYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L2Fzc2lnblwiKVtcImRlZmF1bHRcIl07XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gX09iamVjdCRhc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkge1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkge1xuICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59O1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX09iamVjdCRjcmVhdGUgPSByZXF1aXJlKFwiYmFiZWwtcnVudGltZS9jb3JlLWpzL29iamVjdC9jcmVhdGVcIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgX09iamVjdCRzZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoXCJiYWJlbC1ydW50aW1lL2NvcmUtanMvb2JqZWN0L3NldC1wcm90b3R5cGUtb2ZcIilbXCJkZWZhdWx0XCJdO1xuXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZ1bmN0aW9uIChzdWJDbGFzcywgc3VwZXJDbGFzcykge1xuICBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7XG4gIH1cblxuICBzdWJDbGFzcy5wcm90b3R5cGUgPSBfT2JqZWN0JGNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBzdWJDbGFzcyxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9XG4gIH0pO1xuICBpZiAoc3VwZXJDbGFzcykgX09iamVjdCRzZXRQcm90b3R5cGVPZiA/IF9PYmplY3Qkc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzcztcbn07XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDoge1xuICAgIFwiZGVmYXVsdFwiOiBvYmpcbiAgfTtcbn07XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqW1wiZGVmYXVsdFwiXSA6IG9iajtcbn07XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwicmVxdWlyZSgnLi4vbW9kdWxlcy93ZWIuZG9tLml0ZXJhYmxlJyk7XG5yZXF1aXJlKCcuLi9tb2R1bGVzL2VzNi5zdHJpbmcuaXRlcmF0b3InKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9jb3JlLmdldC1pdGVyYXRvcicpOyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2Lm51bWJlci5pcy1zYWZlLWludGVnZXInKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kLmNvcmUnKS5OdW1iZXIuaXNTYWZlSW50ZWdlcjsiLCJyZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5vYmplY3QuYXNzaWduJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJC5jb3JlJykuT2JqZWN0LmFzc2lnbjsiLCJ2YXIgJCA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGUoUCwgRCl7XG4gIHJldHVybiAkLmNyZWF0ZShQLCBEKTtcbn07IiwidmFyICQgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzLyQnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmaW5lUHJvcGVydHkoaXQsIGtleSwgZGVzYyl7XG4gIHJldHVybiAkLnNldERlc2MoaXQsIGtleSwgZGVzYyk7XG59OyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2Lm9iamVjdC5rZXlzJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJC5jb3JlJykuT2JqZWN0LmtleXM7IiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYub2JqZWN0LnNldC1wcm90b3R5cGUtb2YnKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kLmNvcmUnKS5PYmplY3Quc2V0UHJvdG90eXBlT2Y7IiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYuc3RyaW5nLml0ZXJhdG9yJyk7XG5yZXF1aXJlKCcuLi8uLi9tb2R1bGVzL3dlYi5kb20uaXRlcmFibGUnKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy8kLndrcycpKCdpdGVyYXRvcicpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICBpZih0eXBlb2YgaXQgIT0gJ2Z1bmN0aW9uJyl0aHJvdyBUeXBlRXJyb3IoaXQgKyAnIGlzIG5vdCBhIGZ1bmN0aW9uIScpO1xuICByZXR1cm4gaXQ7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXsgLyogZW1wdHkgKi8gfTsiLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuLyQuaXMtb2JqZWN0Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgaWYoIWlzT2JqZWN0KGl0KSl0aHJvdyBUeXBlRXJyb3IoaXQgKyAnIGlzIG5vdCBhbiBvYmplY3QhJyk7XG4gIHJldHVybiBpdDtcbn07IiwiLy8gZ2V0dGluZyB0YWcgZnJvbSAxOS4xLjMuNiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nKClcbnZhciBjb2YgPSByZXF1aXJlKCcuLyQuY29mJylcbiAgLCBUQUcgPSByZXF1aXJlKCcuLyQud2tzJykoJ3RvU3RyaW5nVGFnJylcbiAgLy8gRVMzIHdyb25nIGhlcmVcbiAgLCBBUkcgPSBjb2YoZnVuY3Rpb24oKXsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKSA9PSAnQXJndW1lbnRzJztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHZhciBPLCBULCBCO1xuICByZXR1cm4gaXQgPT09IHVuZGVmaW5lZCA/ICdVbmRlZmluZWQnIDogaXQgPT09IG51bGwgPyAnTnVsbCdcbiAgICAvLyBAQHRvU3RyaW5nVGFnIGNhc2VcbiAgICA6IHR5cGVvZiAoVCA9IChPID0gT2JqZWN0KGl0KSlbVEFHXSkgPT0gJ3N0cmluZycgPyBUXG4gICAgLy8gYnVpbHRpblRhZyBjYXNlXG4gICAgOiBBUkcgPyBjb2YoTylcbiAgICAvLyBFUzMgYXJndW1lbnRzIGZhbGxiYWNrXG4gICAgOiAoQiA9IGNvZihPKSkgPT0gJ09iamVjdCcgJiYgdHlwZW9mIE8uY2FsbGVlID09ICdmdW5jdGlvbicgPyAnQXJndW1lbnRzJyA6IEI7XG59OyIsInZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoaXQpLnNsaWNlKDgsIC0xKTtcbn07IiwidmFyIGNvcmUgPSBtb2R1bGUuZXhwb3J0cyA9IHt2ZXJzaW9uOiAnMS4yLjYnfTtcbmlmKHR5cGVvZiBfX2UgPT0gJ251bWJlcicpX19lID0gY29yZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZiIsIi8vIG9wdGlvbmFsIC8gc2ltcGxlIGNvbnRleHQgYmluZGluZ1xudmFyIGFGdW5jdGlvbiA9IHJlcXVpcmUoJy4vJC5hLWZ1bmN0aW9uJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGZuLCB0aGF0LCBsZW5ndGgpe1xuICBhRnVuY3Rpb24oZm4pO1xuICBpZih0aGF0ID09PSB1bmRlZmluZWQpcmV0dXJuIGZuO1xuICBzd2l0Y2gobGVuZ3RoKXtcbiAgICBjYXNlIDE6IHJldHVybiBmdW5jdGlvbihhKXtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoYXQsIGEpO1xuICAgIH07XG4gICAgY2FzZSAyOiByZXR1cm4gZnVuY3Rpb24oYSwgYil7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhLCBiKTtcbiAgICB9O1xuICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKGEsIGIsIGMpe1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSwgYiwgYyk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24oLyogLi4uYXJncyAqLyl7XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoYXQsIGFyZ3VtZW50cyk7XG4gIH07XG59OyIsIi8vIDcuMi4xIFJlcXVpcmVPYmplY3RDb2VyY2libGUoYXJndW1lbnQpXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgaWYoaXQgPT0gdW5kZWZpbmVkKXRocm93IFR5cGVFcnJvcihcIkNhbid0IGNhbGwgbWV0aG9kIG9uICBcIiArIGl0KTtcbiAgcmV0dXJuIGl0O1xufTsiLCIvLyBUaGFuaydzIElFOCBmb3IgaGlzIGZ1bm55IGRlZmluZVByb3BlcnR5XG5tb2R1bGUuZXhwb3J0cyA9ICFyZXF1aXJlKCcuLyQuZmFpbHMnKShmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LCAnYScsIHtnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiA3OyB9fSkuYSAhPSA3O1xufSk7IiwidmFyIGdsb2JhbCAgICA9IHJlcXVpcmUoJy4vJC5nbG9iYWwnKVxuICAsIGNvcmUgICAgICA9IHJlcXVpcmUoJy4vJC5jb3JlJylcbiAgLCBjdHggICAgICAgPSByZXF1aXJlKCcuLyQuY3R4JylcbiAgLCBQUk9UT1RZUEUgPSAncHJvdG90eXBlJztcblxudmFyICRleHBvcnQgPSBmdW5jdGlvbih0eXBlLCBuYW1lLCBzb3VyY2Upe1xuICB2YXIgSVNfRk9SQ0VEID0gdHlwZSAmICRleHBvcnQuRlxuICAgICwgSVNfR0xPQkFMID0gdHlwZSAmICRleHBvcnQuR1xuICAgICwgSVNfU1RBVElDID0gdHlwZSAmICRleHBvcnQuU1xuICAgICwgSVNfUFJPVE8gID0gdHlwZSAmICRleHBvcnQuUFxuICAgICwgSVNfQklORCAgID0gdHlwZSAmICRleHBvcnQuQlxuICAgICwgSVNfV1JBUCAgID0gdHlwZSAmICRleHBvcnQuV1xuICAgICwgZXhwb3J0cyAgID0gSVNfR0xPQkFMID8gY29yZSA6IGNvcmVbbmFtZV0gfHwgKGNvcmVbbmFtZV0gPSB7fSlcbiAgICAsIHRhcmdldCAgICA9IElTX0dMT0JBTCA/IGdsb2JhbCA6IElTX1NUQVRJQyA/IGdsb2JhbFtuYW1lXSA6IChnbG9iYWxbbmFtZV0gfHwge30pW1BST1RPVFlQRV1cbiAgICAsIGtleSwgb3duLCBvdXQ7XG4gIGlmKElTX0dMT0JBTClzb3VyY2UgPSBuYW1lO1xuICBmb3Ioa2V5IGluIHNvdXJjZSl7XG4gICAgLy8gY29udGFpbnMgaW4gbmF0aXZlXG4gICAgb3duID0gIUlTX0ZPUkNFRCAmJiB0YXJnZXQgJiYga2V5IGluIHRhcmdldDtcbiAgICBpZihvd24gJiYga2V5IGluIGV4cG9ydHMpY29udGludWU7XG4gICAgLy8gZXhwb3J0IG5hdGl2ZSBvciBwYXNzZWRcbiAgICBvdXQgPSBvd24gPyB0YXJnZXRba2V5XSA6IHNvdXJjZVtrZXldO1xuICAgIC8vIHByZXZlbnQgZ2xvYmFsIHBvbGx1dGlvbiBmb3IgbmFtZXNwYWNlc1xuICAgIGV4cG9ydHNba2V5XSA9IElTX0dMT0JBTCAmJiB0eXBlb2YgdGFyZ2V0W2tleV0gIT0gJ2Z1bmN0aW9uJyA/IHNvdXJjZVtrZXldXG4gICAgLy8gYmluZCB0aW1lcnMgdG8gZ2xvYmFsIGZvciBjYWxsIGZyb20gZXhwb3J0IGNvbnRleHRcbiAgICA6IElTX0JJTkQgJiYgb3duID8gY3R4KG91dCwgZ2xvYmFsKVxuICAgIC8vIHdyYXAgZ2xvYmFsIGNvbnN0cnVjdG9ycyBmb3IgcHJldmVudCBjaGFuZ2UgdGhlbSBpbiBsaWJyYXJ5XG4gICAgOiBJU19XUkFQICYmIHRhcmdldFtrZXldID09IG91dCA/IChmdW5jdGlvbihDKXtcbiAgICAgIHZhciBGID0gZnVuY3Rpb24ocGFyYW0pe1xuICAgICAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIEMgPyBuZXcgQyhwYXJhbSkgOiBDKHBhcmFtKTtcbiAgICAgIH07XG4gICAgICBGW1BST1RPVFlQRV0gPSBDW1BST1RPVFlQRV07XG4gICAgICByZXR1cm4gRjtcbiAgICAvLyBtYWtlIHN0YXRpYyB2ZXJzaW9ucyBmb3IgcHJvdG90eXBlIG1ldGhvZHNcbiAgICB9KShvdXQpIDogSVNfUFJPVE8gJiYgdHlwZW9mIG91dCA9PSAnZnVuY3Rpb24nID8gY3R4KEZ1bmN0aW9uLmNhbGwsIG91dCkgOiBvdXQ7XG4gICAgaWYoSVNfUFJPVE8pKGV4cG9ydHNbUFJPVE9UWVBFXSB8fCAoZXhwb3J0c1tQUk9UT1RZUEVdID0ge30pKVtrZXldID0gb3V0O1xuICB9XG59O1xuLy8gdHlwZSBiaXRtYXBcbiRleHBvcnQuRiA9IDE7ICAvLyBmb3JjZWRcbiRleHBvcnQuRyA9IDI7ICAvLyBnbG9iYWxcbiRleHBvcnQuUyA9IDQ7ICAvLyBzdGF0aWNcbiRleHBvcnQuUCA9IDg7ICAvLyBwcm90b1xuJGV4cG9ydC5CID0gMTY7IC8vIGJpbmRcbiRleHBvcnQuVyA9IDMyOyAvLyB3cmFwXG5tb2R1bGUuZXhwb3J0cyA9ICRleHBvcnQ7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihleGVjKXtcbiAgdHJ5IHtcbiAgICByZXR1cm4gISFleGVjKCk7XG4gIH0gY2F0Y2goZSl7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07IiwiLy8gaHR0cHM6Ly9naXRodWIuY29tL3psb2lyb2NrL2NvcmUtanMvaXNzdWVzLzg2I2lzc3VlY29tbWVudC0xMTU3NTkwMjhcbnZhciBnbG9iYWwgPSBtb2R1bGUuZXhwb3J0cyA9IHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lk1hdGggPT0gTWF0aFxuICA/IHdpbmRvdyA6IHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnICYmIHNlbGYuTWF0aCA9PSBNYXRoID8gc2VsZiA6IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5pZih0eXBlb2YgX19nID09ICdudW1iZXInKV9fZyA9IGdsb2JhbDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZiIsInZhciBoYXNPd25Qcm9wZXJ0eSA9IHt9Lmhhc093blByb3BlcnR5O1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCwga2V5KXtcbiAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwoaXQsIGtleSk7XG59OyIsInZhciAkICAgICAgICAgID0gcmVxdWlyZSgnLi8kJylcbiAgLCBjcmVhdGVEZXNjID0gcmVxdWlyZSgnLi8kLnByb3BlcnR5LWRlc2MnKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi8kLmRlc2NyaXB0b3JzJykgPyBmdW5jdGlvbihvYmplY3QsIGtleSwgdmFsdWUpe1xuICByZXR1cm4gJC5zZXREZXNjKG9iamVjdCwga2V5LCBjcmVhdGVEZXNjKDEsIHZhbHVlKSk7XG59IDogZnVuY3Rpb24ob2JqZWN0LCBrZXksIHZhbHVlKXtcbiAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcbiAgcmV0dXJuIG9iamVjdDtcbn07IiwiLy8gZmFsbGJhY2sgZm9yIG5vbi1hcnJheS1saWtlIEVTMyBhbmQgbm9uLWVudW1lcmFibGUgb2xkIFY4IHN0cmluZ3NcbnZhciBjb2YgPSByZXF1aXJlKCcuLyQuY29mJyk7XG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdCgneicpLnByb3BlcnR5SXNFbnVtZXJhYmxlKDApID8gT2JqZWN0IDogZnVuY3Rpb24oaXQpe1xuICByZXR1cm4gY29mKGl0KSA9PSAnU3RyaW5nJyA/IGl0LnNwbGl0KCcnKSA6IE9iamVjdChpdCk7XG59OyIsIi8vIDIwLjEuMi4zIE51bWJlci5pc0ludGVnZXIobnVtYmVyKVxudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi8kLmlzLW9iamVjdCcpXG4gICwgZmxvb3IgICAgPSBNYXRoLmZsb29yO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0ludGVnZXIoaXQpe1xuICByZXR1cm4gIWlzT2JqZWN0KGl0KSAmJiBpc0Zpbml0ZShpdCkgJiYgZmxvb3IoaXQpID09PSBpdDtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiB0eXBlb2YgaXQgPT09ICdvYmplY3QnID8gaXQgIT09IG51bGwgOiB0eXBlb2YgaXQgPT09ICdmdW5jdGlvbic7XG59OyIsIid1c2Ugc3RyaWN0JztcbnZhciAkICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vJCcpXG4gICwgZGVzY3JpcHRvciAgICAgPSByZXF1aXJlKCcuLyQucHJvcGVydHktZGVzYycpXG4gICwgc2V0VG9TdHJpbmdUYWcgPSByZXF1aXJlKCcuLyQuc2V0LXRvLXN0cmluZy10YWcnKVxuICAsIEl0ZXJhdG9yUHJvdG90eXBlID0ge307XG5cbi8vIDI1LjEuMi4xLjEgJUl0ZXJhdG9yUHJvdG90eXBlJVtAQGl0ZXJhdG9yXSgpXG5yZXF1aXJlKCcuLyQuaGlkZScpKEl0ZXJhdG9yUHJvdG90eXBlLCByZXF1aXJlKCcuLyQud2tzJykoJ2l0ZXJhdG9yJyksIGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzOyB9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihDb25zdHJ1Y3RvciwgTkFNRSwgbmV4dCl7XG4gIENvbnN0cnVjdG9yLnByb3RvdHlwZSA9ICQuY3JlYXRlKEl0ZXJhdG9yUHJvdG90eXBlLCB7bmV4dDogZGVzY3JpcHRvcigxLCBuZXh0KX0pO1xuICBzZXRUb1N0cmluZ1RhZyhDb25zdHJ1Y3RvciwgTkFNRSArICcgSXRlcmF0b3InKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIExJQlJBUlkgICAgICAgID0gcmVxdWlyZSgnLi8kLmxpYnJhcnknKVxuICAsICRleHBvcnQgICAgICAgID0gcmVxdWlyZSgnLi8kLmV4cG9ydCcpXG4gICwgcmVkZWZpbmUgICAgICAgPSByZXF1aXJlKCcuLyQucmVkZWZpbmUnKVxuICAsIGhpZGUgICAgICAgICAgID0gcmVxdWlyZSgnLi8kLmhpZGUnKVxuICAsIGhhcyAgICAgICAgICAgID0gcmVxdWlyZSgnLi8kLmhhcycpXG4gICwgSXRlcmF0b3JzICAgICAgPSByZXF1aXJlKCcuLyQuaXRlcmF0b3JzJylcbiAgLCAkaXRlckNyZWF0ZSAgICA9IHJlcXVpcmUoJy4vJC5pdGVyLWNyZWF0ZScpXG4gICwgc2V0VG9TdHJpbmdUYWcgPSByZXF1aXJlKCcuLyQuc2V0LXRvLXN0cmluZy10YWcnKVxuICAsIGdldFByb3RvICAgICAgID0gcmVxdWlyZSgnLi8kJykuZ2V0UHJvdG9cbiAgLCBJVEVSQVRPUiAgICAgICA9IHJlcXVpcmUoJy4vJC53a3MnKSgnaXRlcmF0b3InKVxuICAsIEJVR0dZICAgICAgICAgID0gIShbXS5rZXlzICYmICduZXh0JyBpbiBbXS5rZXlzKCkpIC8vIFNhZmFyaSBoYXMgYnVnZ3kgaXRlcmF0b3JzIHcvbyBgbmV4dGBcbiAgLCBGRl9JVEVSQVRPUiAgICA9ICdAQGl0ZXJhdG9yJ1xuICAsIEtFWVMgICAgICAgICAgID0gJ2tleXMnXG4gICwgVkFMVUVTICAgICAgICAgPSAndmFsdWVzJztcblxudmFyIHJldHVyblRoaXMgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpczsgfTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihCYXNlLCBOQU1FLCBDb25zdHJ1Y3RvciwgbmV4dCwgREVGQVVMVCwgSVNfU0VULCBGT1JDRUQpe1xuICAkaXRlckNyZWF0ZShDb25zdHJ1Y3RvciwgTkFNRSwgbmV4dCk7XG4gIHZhciBnZXRNZXRob2QgPSBmdW5jdGlvbihraW5kKXtcbiAgICBpZighQlVHR1kgJiYga2luZCBpbiBwcm90bylyZXR1cm4gcHJvdG9ba2luZF07XG4gICAgc3dpdGNoKGtpbmQpe1xuICAgICAgY2FzZSBLRVlTOiByZXR1cm4gZnVuY3Rpb24ga2V5cygpeyByZXR1cm4gbmV3IENvbnN0cnVjdG9yKHRoaXMsIGtpbmQpOyB9O1xuICAgICAgY2FzZSBWQUxVRVM6IHJldHVybiBmdW5jdGlvbiB2YWx1ZXMoKXsgcmV0dXJuIG5ldyBDb25zdHJ1Y3Rvcih0aGlzLCBraW5kKTsgfTtcbiAgICB9IHJldHVybiBmdW5jdGlvbiBlbnRyaWVzKCl7IHJldHVybiBuZXcgQ29uc3RydWN0b3IodGhpcywga2luZCk7IH07XG4gIH07XG4gIHZhciBUQUcgICAgICAgID0gTkFNRSArICcgSXRlcmF0b3InXG4gICAgLCBERUZfVkFMVUVTID0gREVGQVVMVCA9PSBWQUxVRVNcbiAgICAsIFZBTFVFU19CVUcgPSBmYWxzZVxuICAgICwgcHJvdG8gICAgICA9IEJhc2UucHJvdG90eXBlXG4gICAgLCAkbmF0aXZlICAgID0gcHJvdG9bSVRFUkFUT1JdIHx8IHByb3RvW0ZGX0lURVJBVE9SXSB8fCBERUZBVUxUICYmIHByb3RvW0RFRkFVTFRdXG4gICAgLCAkZGVmYXVsdCAgID0gJG5hdGl2ZSB8fCBnZXRNZXRob2QoREVGQVVMVClcbiAgICAsIG1ldGhvZHMsIGtleTtcbiAgLy8gRml4IG5hdGl2ZVxuICBpZigkbmF0aXZlKXtcbiAgICB2YXIgSXRlcmF0b3JQcm90b3R5cGUgPSBnZXRQcm90bygkZGVmYXVsdC5jYWxsKG5ldyBCYXNlKSk7XG4gICAgLy8gU2V0IEBAdG9TdHJpbmdUYWcgdG8gbmF0aXZlIGl0ZXJhdG9yc1xuICAgIHNldFRvU3RyaW5nVGFnKEl0ZXJhdG9yUHJvdG90eXBlLCBUQUcsIHRydWUpO1xuICAgIC8vIEZGIGZpeFxuICAgIGlmKCFMSUJSQVJZICYmIGhhcyhwcm90bywgRkZfSVRFUkFUT1IpKWhpZGUoSXRlcmF0b3JQcm90b3R5cGUsIElURVJBVE9SLCByZXR1cm5UaGlzKTtcbiAgICAvLyBmaXggQXJyYXkje3ZhbHVlcywgQEBpdGVyYXRvcn0ubmFtZSBpbiBWOCAvIEZGXG4gICAgaWYoREVGX1ZBTFVFUyAmJiAkbmF0aXZlLm5hbWUgIT09IFZBTFVFUyl7XG4gICAgICBWQUxVRVNfQlVHID0gdHJ1ZTtcbiAgICAgICRkZWZhdWx0ID0gZnVuY3Rpb24gdmFsdWVzKCl7IHJldHVybiAkbmF0aXZlLmNhbGwodGhpcyk7IH07XG4gICAgfVxuICB9XG4gIC8vIERlZmluZSBpdGVyYXRvclxuICBpZigoIUxJQlJBUlkgfHwgRk9SQ0VEKSAmJiAoQlVHR1kgfHwgVkFMVUVTX0JVRyB8fCAhcHJvdG9bSVRFUkFUT1JdKSl7XG4gICAgaGlkZShwcm90bywgSVRFUkFUT1IsICRkZWZhdWx0KTtcbiAgfVxuICAvLyBQbHVnIGZvciBsaWJyYXJ5XG4gIEl0ZXJhdG9yc1tOQU1FXSA9ICRkZWZhdWx0O1xuICBJdGVyYXRvcnNbVEFHXSAgPSByZXR1cm5UaGlzO1xuICBpZihERUZBVUxUKXtcbiAgICBtZXRob2RzID0ge1xuICAgICAgdmFsdWVzOiAgREVGX1ZBTFVFUyAgPyAkZGVmYXVsdCA6IGdldE1ldGhvZChWQUxVRVMpLFxuICAgICAga2V5czogICAgSVNfU0VUICAgICAgPyAkZGVmYXVsdCA6IGdldE1ldGhvZChLRVlTKSxcbiAgICAgIGVudHJpZXM6ICFERUZfVkFMVUVTID8gJGRlZmF1bHQgOiBnZXRNZXRob2QoJ2VudHJpZXMnKVxuICAgIH07XG4gICAgaWYoRk9SQ0VEKWZvcihrZXkgaW4gbWV0aG9kcyl7XG4gICAgICBpZighKGtleSBpbiBwcm90bykpcmVkZWZpbmUocHJvdG8sIGtleSwgbWV0aG9kc1trZXldKTtcbiAgICB9IGVsc2UgJGV4cG9ydCgkZXhwb3J0LlAgKyAkZXhwb3J0LkYgKiAoQlVHR1kgfHwgVkFMVUVTX0JVRyksIE5BTUUsIG1ldGhvZHMpO1xuICB9XG4gIHJldHVybiBtZXRob2RzO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRvbmUsIHZhbHVlKXtcbiAgcmV0dXJuIHt2YWx1ZTogdmFsdWUsIGRvbmU6ICEhZG9uZX07XG59OyIsIm1vZHVsZS5leHBvcnRzID0ge307IiwidmFyICRPYmplY3QgPSBPYmplY3Q7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlOiAgICAgJE9iamVjdC5jcmVhdGUsXG4gIGdldFByb3RvOiAgICRPYmplY3QuZ2V0UHJvdG90eXBlT2YsXG4gIGlzRW51bTogICAgIHt9LnByb3BlcnR5SXNFbnVtZXJhYmxlLFxuICBnZXREZXNjOiAgICAkT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgc2V0RGVzYzogICAgJE9iamVjdC5kZWZpbmVQcm9wZXJ0eSxcbiAgc2V0RGVzY3M6ICAgJE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzLFxuICBnZXRLZXlzOiAgICAkT2JqZWN0LmtleXMsXG4gIGdldE5hbWVzOiAgICRPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyxcbiAgZ2V0U3ltYm9sczogJE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMsXG4gIGVhY2g6ICAgICAgIFtdLmZvckVhY2hcbn07IiwibW9kdWxlLmV4cG9ydHMgPSB0cnVlOyIsIi8vIDE5LjEuMi4xIE9iamVjdC5hc3NpZ24odGFyZ2V0LCBzb3VyY2UsIC4uLilcbnZhciAkICAgICAgICA9IHJlcXVpcmUoJy4vJCcpXG4gICwgdG9PYmplY3QgPSByZXF1aXJlKCcuLyQudG8tb2JqZWN0JylcbiAgLCBJT2JqZWN0ICA9IHJlcXVpcmUoJy4vJC5pb2JqZWN0Jyk7XG5cbi8vIHNob3VsZCB3b3JrIHdpdGggc3ltYm9scyBhbmQgc2hvdWxkIGhhdmUgZGV0ZXJtaW5pc3RpYyBwcm9wZXJ0eSBvcmRlciAoVjggYnVnKVxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLyQuZmFpbHMnKShmdW5jdGlvbigpe1xuICB2YXIgYSA9IE9iamVjdC5hc3NpZ25cbiAgICAsIEEgPSB7fVxuICAgICwgQiA9IHt9XG4gICAgLCBTID0gU3ltYm9sKClcbiAgICAsIEsgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3QnO1xuICBBW1NdID0gNztcbiAgSy5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbihrKXsgQltrXSA9IGs7IH0pO1xuICByZXR1cm4gYSh7fSwgQSlbU10gIT0gNyB8fCBPYmplY3Qua2V5cyhhKHt9LCBCKSkuam9pbignJykgIT0gSztcbn0pID8gZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgc291cmNlKXsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICB2YXIgVCAgICAgPSB0b09iamVjdCh0YXJnZXQpXG4gICAgLCAkJCAgICA9IGFyZ3VtZW50c1xuICAgICwgJCRsZW4gPSAkJC5sZW5ndGhcbiAgICAsIGluZGV4ID0gMVxuICAgICwgZ2V0S2V5cyAgICA9ICQuZ2V0S2V5c1xuICAgICwgZ2V0U3ltYm9scyA9ICQuZ2V0U3ltYm9sc1xuICAgICwgaXNFbnVtICAgICA9ICQuaXNFbnVtO1xuICB3aGlsZSgkJGxlbiA+IGluZGV4KXtcbiAgICB2YXIgUyAgICAgID0gSU9iamVjdCgkJFtpbmRleCsrXSlcbiAgICAgICwga2V5cyAgID0gZ2V0U3ltYm9scyA/IGdldEtleXMoUykuY29uY2F0KGdldFN5bWJvbHMoUykpIDogZ2V0S2V5cyhTKVxuICAgICAgLCBsZW5ndGggPSBrZXlzLmxlbmd0aFxuICAgICAgLCBqICAgICAgPSAwXG4gICAgICAsIGtleTtcbiAgICB3aGlsZShsZW5ndGggPiBqKWlmKGlzRW51bS5jYWxsKFMsIGtleSA9IGtleXNbaisrXSkpVFtrZXldID0gU1trZXldO1xuICB9XG4gIHJldHVybiBUO1xufSA6IE9iamVjdC5hc3NpZ247IiwiLy8gbW9zdCBPYmplY3QgbWV0aG9kcyBieSBFUzYgc2hvdWxkIGFjY2VwdCBwcmltaXRpdmVzXG52YXIgJGV4cG9ydCA9IHJlcXVpcmUoJy4vJC5leHBvcnQnKVxuICAsIGNvcmUgICAgPSByZXF1aXJlKCcuLyQuY29yZScpXG4gICwgZmFpbHMgICA9IHJlcXVpcmUoJy4vJC5mYWlscycpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihLRVksIGV4ZWMpe1xuICB2YXIgZm4gID0gKGNvcmUuT2JqZWN0IHx8IHt9KVtLRVldIHx8IE9iamVjdFtLRVldXG4gICAgLCBleHAgPSB7fTtcbiAgZXhwW0tFWV0gPSBleGVjKGZuKTtcbiAgJGV4cG9ydCgkZXhwb3J0LlMgKyAkZXhwb3J0LkYgKiBmYWlscyhmdW5jdGlvbigpeyBmbigxKTsgfSksICdPYmplY3QnLCBleHApO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGJpdG1hcCwgdmFsdWUpe1xuICByZXR1cm4ge1xuICAgIGVudW1lcmFibGUgIDogIShiaXRtYXAgJiAxKSxcbiAgICBjb25maWd1cmFibGU6ICEoYml0bWFwICYgMiksXG4gICAgd3JpdGFibGUgICAgOiAhKGJpdG1hcCAmIDQpLFxuICAgIHZhbHVlICAgICAgIDogdmFsdWVcbiAgfTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLyQuaGlkZScpOyIsIi8vIFdvcmtzIHdpdGggX19wcm90b19fIG9ubHkuIE9sZCB2OCBjYW4ndCB3b3JrIHdpdGggbnVsbCBwcm90byBvYmplY3RzLlxuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cbnZhciBnZXREZXNjICA9IHJlcXVpcmUoJy4vJCcpLmdldERlc2NcbiAgLCBpc09iamVjdCA9IHJlcXVpcmUoJy4vJC5pcy1vYmplY3QnKVxuICAsIGFuT2JqZWN0ID0gcmVxdWlyZSgnLi8kLmFuLW9iamVjdCcpO1xudmFyIGNoZWNrID0gZnVuY3Rpb24oTywgcHJvdG8pe1xuICBhbk9iamVjdChPKTtcbiAgaWYoIWlzT2JqZWN0KHByb3RvKSAmJiBwcm90byAhPT0gbnVsbCl0aHJvdyBUeXBlRXJyb3IocHJvdG8gKyBcIjogY2FuJ3Qgc2V0IGFzIHByb3RvdHlwZSFcIik7XG59O1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHNldDogT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8ICgnX19wcm90b19fJyBpbiB7fSA/IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICBmdW5jdGlvbih0ZXN0LCBidWdneSwgc2V0KXtcbiAgICAgIHRyeSB7XG4gICAgICAgIHNldCA9IHJlcXVpcmUoJy4vJC5jdHgnKShGdW5jdGlvbi5jYWxsLCBnZXREZXNjKE9iamVjdC5wcm90b3R5cGUsICdfX3Byb3RvX18nKS5zZXQsIDIpO1xuICAgICAgICBzZXQodGVzdCwgW10pO1xuICAgICAgICBidWdneSA9ICEodGVzdCBpbnN0YW5jZW9mIEFycmF5KTtcbiAgICAgIH0gY2F0Y2goZSl7IGJ1Z2d5ID0gdHJ1ZTsgfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIHNldFByb3RvdHlwZU9mKE8sIHByb3RvKXtcbiAgICAgICAgY2hlY2soTywgcHJvdG8pO1xuICAgICAgICBpZihidWdneSlPLl9fcHJvdG9fXyA9IHByb3RvO1xuICAgICAgICBlbHNlIHNldChPLCBwcm90byk7XG4gICAgICAgIHJldHVybiBPO1xuICAgICAgfTtcbiAgICB9KHt9LCBmYWxzZSkgOiB1bmRlZmluZWQpLFxuICBjaGVjazogY2hlY2tcbn07IiwidmFyIGRlZiA9IHJlcXVpcmUoJy4vJCcpLnNldERlc2NcbiAgLCBoYXMgPSByZXF1aXJlKCcuLyQuaGFzJylcbiAgLCBUQUcgPSByZXF1aXJlKCcuLyQud2tzJykoJ3RvU3RyaW5nVGFnJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQsIHRhZywgc3RhdCl7XG4gIGlmKGl0ICYmICFoYXMoaXQgPSBzdGF0ID8gaXQgOiBpdC5wcm90b3R5cGUsIFRBRykpZGVmKGl0LCBUQUcsIHtjb25maWd1cmFibGU6IHRydWUsIHZhbHVlOiB0YWd9KTtcbn07IiwidmFyIGdsb2JhbCA9IHJlcXVpcmUoJy4vJC5nbG9iYWwnKVxuICAsIFNIQVJFRCA9ICdfX2NvcmUtanNfc2hhcmVkX18nXG4gICwgc3RvcmUgID0gZ2xvYmFsW1NIQVJFRF0gfHwgKGdsb2JhbFtTSEFSRURdID0ge30pO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihrZXkpe1xuICByZXR1cm4gc3RvcmVba2V5XSB8fCAoc3RvcmVba2V5XSA9IHt9KTtcbn07IiwidmFyIHRvSW50ZWdlciA9IHJlcXVpcmUoJy4vJC50by1pbnRlZ2VyJylcbiAgLCBkZWZpbmVkICAgPSByZXF1aXJlKCcuLyQuZGVmaW5lZCcpO1xuLy8gdHJ1ZSAgLT4gU3RyaW5nI2F0XG4vLyBmYWxzZSAtPiBTdHJpbmcjY29kZVBvaW50QXRcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oVE9fU1RSSU5HKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRoYXQsIHBvcyl7XG4gICAgdmFyIHMgPSBTdHJpbmcoZGVmaW5lZCh0aGF0KSlcbiAgICAgICwgaSA9IHRvSW50ZWdlcihwb3MpXG4gICAgICAsIGwgPSBzLmxlbmd0aFxuICAgICAgLCBhLCBiO1xuICAgIGlmKGkgPCAwIHx8IGkgPj0gbClyZXR1cm4gVE9fU1RSSU5HID8gJycgOiB1bmRlZmluZWQ7XG4gICAgYSA9IHMuY2hhckNvZGVBdChpKTtcbiAgICByZXR1cm4gYSA8IDB4ZDgwMCB8fCBhID4gMHhkYmZmIHx8IGkgKyAxID09PSBsIHx8IChiID0gcy5jaGFyQ29kZUF0KGkgKyAxKSkgPCAweGRjMDAgfHwgYiA+IDB4ZGZmZlxuICAgICAgPyBUT19TVFJJTkcgPyBzLmNoYXJBdChpKSA6IGFcbiAgICAgIDogVE9fU1RSSU5HID8gcy5zbGljZShpLCBpICsgMikgOiAoYSAtIDB4ZDgwMCA8PCAxMCkgKyAoYiAtIDB4ZGMwMCkgKyAweDEwMDAwO1xuICB9O1xufTsiLCIvLyA3LjEuNCBUb0ludGVnZXJcbnZhciBjZWlsICA9IE1hdGguY2VpbFxuICAsIGZsb29yID0gTWF0aC5mbG9vcjtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICByZXR1cm4gaXNOYU4oaXQgPSAraXQpID8gMCA6IChpdCA+IDAgPyBmbG9vciA6IGNlaWwpKGl0KTtcbn07IiwiLy8gdG8gaW5kZXhlZCBvYmplY3QsIHRvT2JqZWN0IHdpdGggZmFsbGJhY2sgZm9yIG5vbi1hcnJheS1saWtlIEVTMyBzdHJpbmdzXG52YXIgSU9iamVjdCA9IHJlcXVpcmUoJy4vJC5pb2JqZWN0JylcbiAgLCBkZWZpbmVkID0gcmVxdWlyZSgnLi8kLmRlZmluZWQnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICByZXR1cm4gSU9iamVjdChkZWZpbmVkKGl0KSk7XG59OyIsIi8vIDcuMS4xMyBUb09iamVjdChhcmd1bWVudClcbnZhciBkZWZpbmVkID0gcmVxdWlyZSgnLi8kLmRlZmluZWQnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICByZXR1cm4gT2JqZWN0KGRlZmluZWQoaXQpKTtcbn07IiwidmFyIGlkID0gMFxuICAsIHB4ID0gTWF0aC5yYW5kb20oKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oa2V5KXtcbiAgcmV0dXJuICdTeW1ib2woJy5jb25jYXQoa2V5ID09PSB1bmRlZmluZWQgPyAnJyA6IGtleSwgJylfJywgKCsraWQgKyBweCkudG9TdHJpbmcoMzYpKTtcbn07IiwidmFyIHN0b3JlICA9IHJlcXVpcmUoJy4vJC5zaGFyZWQnKSgnd2tzJylcbiAgLCB1aWQgICAgPSByZXF1aXJlKCcuLyQudWlkJylcbiAgLCBTeW1ib2wgPSByZXF1aXJlKCcuLyQuZ2xvYmFsJykuU3ltYm9sO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihuYW1lKXtcbiAgcmV0dXJuIHN0b3JlW25hbWVdIHx8IChzdG9yZVtuYW1lXSA9XG4gICAgU3ltYm9sICYmIFN5bWJvbFtuYW1lXSB8fCAoU3ltYm9sIHx8IHVpZCkoJ1N5bWJvbC4nICsgbmFtZSkpO1xufTsiLCJ2YXIgY2xhc3NvZiAgID0gcmVxdWlyZSgnLi8kLmNsYXNzb2YnKVxuICAsIElURVJBVE9SICA9IHJlcXVpcmUoJy4vJC53a3MnKSgnaXRlcmF0b3InKVxuICAsIEl0ZXJhdG9ycyA9IHJlcXVpcmUoJy4vJC5pdGVyYXRvcnMnKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi8kLmNvcmUnKS5nZXRJdGVyYXRvck1ldGhvZCA9IGZ1bmN0aW9uKGl0KXtcbiAgaWYoaXQgIT0gdW5kZWZpbmVkKXJldHVybiBpdFtJVEVSQVRPUl1cbiAgICB8fCBpdFsnQEBpdGVyYXRvciddXG4gICAgfHwgSXRlcmF0b3JzW2NsYXNzb2YoaXQpXTtcbn07IiwidmFyIGFuT2JqZWN0ID0gcmVxdWlyZSgnLi8kLmFuLW9iamVjdCcpXG4gICwgZ2V0ICAgICAgPSByZXF1aXJlKCcuL2NvcmUuZ2V0LWl0ZXJhdG9yLW1ldGhvZCcpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLyQuY29yZScpLmdldEl0ZXJhdG9yID0gZnVuY3Rpb24oaXQpe1xuICB2YXIgaXRlckZuID0gZ2V0KGl0KTtcbiAgaWYodHlwZW9mIGl0ZXJGbiAhPSAnZnVuY3Rpb24nKXRocm93IFR5cGVFcnJvcihpdCArICcgaXMgbm90IGl0ZXJhYmxlIScpO1xuICByZXR1cm4gYW5PYmplY3QoaXRlckZuLmNhbGwoaXQpKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xudmFyIGFkZFRvVW5zY29wYWJsZXMgPSByZXF1aXJlKCcuLyQuYWRkLXRvLXVuc2NvcGFibGVzJylcbiAgLCBzdGVwICAgICAgICAgICAgID0gcmVxdWlyZSgnLi8kLml0ZXItc3RlcCcpXG4gICwgSXRlcmF0b3JzICAgICAgICA9IHJlcXVpcmUoJy4vJC5pdGVyYXRvcnMnKVxuICAsIHRvSU9iamVjdCAgICAgICAgPSByZXF1aXJlKCcuLyQudG8taW9iamVjdCcpO1xuXG4vLyAyMi4xLjMuNCBBcnJheS5wcm90b3R5cGUuZW50cmllcygpXG4vLyAyMi4xLjMuMTMgQXJyYXkucHJvdG90eXBlLmtleXMoKVxuLy8gMjIuMS4zLjI5IEFycmF5LnByb3RvdHlwZS52YWx1ZXMoKVxuLy8gMjIuMS4zLjMwIEFycmF5LnByb3RvdHlwZVtAQGl0ZXJhdG9yXSgpXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vJC5pdGVyLWRlZmluZScpKEFycmF5LCAnQXJyYXknLCBmdW5jdGlvbihpdGVyYXRlZCwga2luZCl7XG4gIHRoaXMuX3QgPSB0b0lPYmplY3QoaXRlcmF0ZWQpOyAvLyB0YXJnZXRcbiAgdGhpcy5faSA9IDA7ICAgICAgICAgICAgICAgICAgIC8vIG5leHQgaW5kZXhcbiAgdGhpcy5fayA9IGtpbmQ7ICAgICAgICAgICAgICAgIC8vIGtpbmRcbi8vIDIyLjEuNS4yLjEgJUFycmF5SXRlcmF0b3JQcm90b3R5cGUlLm5leHQoKVxufSwgZnVuY3Rpb24oKXtcbiAgdmFyIE8gICAgID0gdGhpcy5fdFxuICAgICwga2luZCAgPSB0aGlzLl9rXG4gICAgLCBpbmRleCA9IHRoaXMuX2krKztcbiAgaWYoIU8gfHwgaW5kZXggPj0gTy5sZW5ndGgpe1xuICAgIHRoaXMuX3QgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHN0ZXAoMSk7XG4gIH1cbiAgaWYoa2luZCA9PSAna2V5cycgIClyZXR1cm4gc3RlcCgwLCBpbmRleCk7XG4gIGlmKGtpbmQgPT0gJ3ZhbHVlcycpcmV0dXJuIHN0ZXAoMCwgT1tpbmRleF0pO1xuICByZXR1cm4gc3RlcCgwLCBbaW5kZXgsIE9baW5kZXhdXSk7XG59LCAndmFsdWVzJyk7XG5cbi8vIGFyZ3VtZW50c0xpc3RbQEBpdGVyYXRvcl0gaXMgJUFycmF5UHJvdG9fdmFsdWVzJSAoOS40LjQuNiwgOS40LjQuNylcbkl0ZXJhdG9ycy5Bcmd1bWVudHMgPSBJdGVyYXRvcnMuQXJyYXk7XG5cbmFkZFRvVW5zY29wYWJsZXMoJ2tleXMnKTtcbmFkZFRvVW5zY29wYWJsZXMoJ3ZhbHVlcycpO1xuYWRkVG9VbnNjb3BhYmxlcygnZW50cmllcycpOyIsIi8vIDIwLjEuMi41IE51bWJlci5pc1NhZmVJbnRlZ2VyKG51bWJlcilcbnZhciAkZXhwb3J0ICAgPSByZXF1aXJlKCcuLyQuZXhwb3J0JylcbiAgLCBpc0ludGVnZXIgPSByZXF1aXJlKCcuLyQuaXMtaW50ZWdlcicpXG4gICwgYWJzICAgICAgID0gTWF0aC5hYnM7XG5cbiRleHBvcnQoJGV4cG9ydC5TLCAnTnVtYmVyJywge1xuICBpc1NhZmVJbnRlZ2VyOiBmdW5jdGlvbiBpc1NhZmVJbnRlZ2VyKG51bWJlcil7XG4gICAgcmV0dXJuIGlzSW50ZWdlcihudW1iZXIpICYmIGFicyhudW1iZXIpIDw9IDB4MWZmZmZmZmZmZmZmZmY7XG4gIH1cbn0pOyIsIi8vIDE5LjEuMy4xIE9iamVjdC5hc3NpZ24odGFyZ2V0LCBzb3VyY2UpXG52YXIgJGV4cG9ydCA9IHJlcXVpcmUoJy4vJC5leHBvcnQnKTtcblxuJGV4cG9ydCgkZXhwb3J0LlMgKyAkZXhwb3J0LkYsICdPYmplY3QnLCB7YXNzaWduOiByZXF1aXJlKCcuLyQub2JqZWN0LWFzc2lnbicpfSk7IiwiLy8gMTkuMS4yLjE0IE9iamVjdC5rZXlzKE8pXG52YXIgdG9PYmplY3QgPSByZXF1aXJlKCcuLyQudG8tb2JqZWN0Jyk7XG5cbnJlcXVpcmUoJy4vJC5vYmplY3Qtc2FwJykoJ2tleXMnLCBmdW5jdGlvbigka2V5cyl7XG4gIHJldHVybiBmdW5jdGlvbiBrZXlzKGl0KXtcbiAgICByZXR1cm4gJGtleXModG9PYmplY3QoaXQpKTtcbiAgfTtcbn0pOyIsIi8vIDE5LjEuMy4xOSBPYmplY3Quc2V0UHJvdG90eXBlT2YoTywgcHJvdG8pXG52YXIgJGV4cG9ydCA9IHJlcXVpcmUoJy4vJC5leHBvcnQnKTtcbiRleHBvcnQoJGV4cG9ydC5TLCAnT2JqZWN0Jywge3NldFByb3RvdHlwZU9mOiByZXF1aXJlKCcuLyQuc2V0LXByb3RvJykuc2V0fSk7IiwiJ3VzZSBzdHJpY3QnO1xudmFyICRhdCAgPSByZXF1aXJlKCcuLyQuc3RyaW5nLWF0JykodHJ1ZSk7XG5cbi8vIDIxLjEuMy4yNyBTdHJpbmcucHJvdG90eXBlW0BAaXRlcmF0b3JdKClcbnJlcXVpcmUoJy4vJC5pdGVyLWRlZmluZScpKFN0cmluZywgJ1N0cmluZycsIGZ1bmN0aW9uKGl0ZXJhdGVkKXtcbiAgdGhpcy5fdCA9IFN0cmluZyhpdGVyYXRlZCk7IC8vIHRhcmdldFxuICB0aGlzLl9pID0gMDsgICAgICAgICAgICAgICAgLy8gbmV4dCBpbmRleFxuLy8gMjEuMS41LjIuMSAlU3RyaW5nSXRlcmF0b3JQcm90b3R5cGUlLm5leHQoKVxufSwgZnVuY3Rpb24oKXtcbiAgdmFyIE8gICAgID0gdGhpcy5fdFxuICAgICwgaW5kZXggPSB0aGlzLl9pXG4gICAgLCBwb2ludDtcbiAgaWYoaW5kZXggPj0gTy5sZW5ndGgpcmV0dXJuIHt2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlfTtcbiAgcG9pbnQgPSAkYXQoTywgaW5kZXgpO1xuICB0aGlzLl9pICs9IHBvaW50Lmxlbmd0aDtcbiAgcmV0dXJuIHt2YWx1ZTogcG9pbnQsIGRvbmU6IGZhbHNlfTtcbn0pOyIsInJlcXVpcmUoJy4vZXM2LmFycmF5Lml0ZXJhdG9yJyk7XG52YXIgSXRlcmF0b3JzID0gcmVxdWlyZSgnLi8kLml0ZXJhdG9ycycpO1xuSXRlcmF0b3JzLk5vZGVMaXN0ID0gSXRlcmF0b3JzLkhUTUxDb2xsZWN0aW9uID0gSXRlcmF0b3JzLkFycmF5OyIsInZhciBtaXhpbiA9IHJlcXVpcmUoJ3NtYXJ0LW1peGluJyk7XG52YXIgYXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgbWl4aW5Qcm90byA9IG1peGluKHtcbiAgLy8gbGlmZWN5Y2xlIHN0dWZmIGlzIGFzIHlvdSdkIGV4cGVjdFxuICBjb21wb25lbnREaWRNb3VudDogbWl4aW4uTUFOWSxcbiAgY29tcG9uZW50V2lsbE1vdW50OiBtaXhpbi5NQU5ZLFxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBtaXhpbi5NQU5ZLFxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IG1peGluLk9OQ0UsXG4gIGNvbXBvbmVudFdpbGxVcGRhdGU6IG1peGluLk1BTlksXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogbWl4aW4uTUFOWSxcbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IG1peGluLk1BTlksXG4gIGdldENoaWxkQ29udGV4dDogbWl4aW4uTUFOWV9NRVJHRURcbn0pO1xuXG5mdW5jdGlvbiBzZXREZWZhdWx0UHJvcHMocmVhY3RNaXhpbikge1xuICB2YXIgZ2V0RGVmYXVsdFByb3BzID0gcmVhY3RNaXhpbi5nZXREZWZhdWx0UHJvcHM7XG5cbiAgaWYgKGdldERlZmF1bHRQcm9wcykge1xuICAgIHJlYWN0TWl4aW4uZGVmYXVsdFByb3BzID0gZ2V0RGVmYXVsdFByb3BzKCk7XG5cbiAgICBkZWxldGUgcmVhY3RNaXhpbi5nZXREZWZhdWx0UHJvcHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0SW5pdGlhbFN0YXRlKHJlYWN0TWl4aW4pIHtcbiAgdmFyIGdldEluaXRpYWxTdGF0ZSA9IHJlYWN0TWl4aW4uZ2V0SW5pdGlhbFN0YXRlO1xuICB2YXIgY29tcG9uZW50V2lsbE1vdW50ID0gcmVhY3RNaXhpbi5jb21wb25lbnRXaWxsTW91bnQ7XG5cbiAgZnVuY3Rpb24gYXBwbHlJbml0aWFsU3RhdGUoaW5zdGFuY2UpIHtcbiAgICB2YXIgc3RhdGUgPSBpbnN0YW5jZS5zdGF0ZSB8fCB7fTtcbiAgICBhc3NpZ24oc3RhdGUsIGdldEluaXRpYWxTdGF0ZS5jYWxsKGluc3RhbmNlKSk7XG4gICAgaW5zdGFuY2Uuc3RhdGUgPSBzdGF0ZTtcbiAgfVxuXG4gIGlmIChnZXRJbml0aWFsU3RhdGUpIHtcbiAgICBpZiAoIWNvbXBvbmVudFdpbGxNb3VudCkge1xuICAgICAgcmVhY3RNaXhpbi5jb21wb25lbnRXaWxsTW91bnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgYXBwbHlJbml0aWFsU3RhdGUodGhpcyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZWFjdE1peGluLmNvbXBvbmVudFdpbGxNb3VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBhcHBseUluaXRpYWxTdGF0ZSh0aGlzKTtcbiAgICAgICAgY29tcG9uZW50V2lsbE1vdW50LmNhbGwodGhpcyk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGRlbGV0ZSByZWFjdE1peGluLmdldEluaXRpYWxTdGF0ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtaXhpbkNsYXNzKHJlYWN0Q2xhc3MsIHJlYWN0TWl4aW4pIHtcbiAgc2V0RGVmYXVsdFByb3BzKHJlYWN0TWl4aW4pO1xuICBzZXRJbml0aWFsU3RhdGUocmVhY3RNaXhpbik7XG5cbiAgdmFyIHByb3RvdHlwZU1ldGhvZHMgPSB7fTtcbiAgdmFyIHN0YXRpY1Byb3BzID0ge307XG5cbiAgT2JqZWN0LmtleXMocmVhY3RNaXhpbikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoa2V5ID09PSAnbWl4aW5zJykge1xuICAgICAgcmV0dXJuOyAvLyBIYW5kbGVkIGJlbG93IHRvIGVuc3VyZSBwcm9wZXIgb3JkZXIgcmVnYXJkbGVzcyBvZiBwcm9wZXJ0eSBpdGVyYXRpb24gb3JkZXJcbiAgICB9XG4gICAgaWYgKGtleSA9PT0gJ3N0YXRpY3MnKSB7XG4gICAgICByZXR1cm47IC8vIGdldHMgc3BlY2lhbCBoYW5kbGluZ1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlYWN0TWl4aW5ba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcHJvdG90eXBlTWV0aG9kc1trZXldID0gcmVhY3RNaXhpbltrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0aWNQcm9wc1trZXldID0gcmVhY3RNaXhpbltrZXldO1xuICAgIH1cbiAgfSk7XG5cbiAgbWl4aW5Qcm90byhyZWFjdENsYXNzLnByb3RvdHlwZSwgcHJvdG90eXBlTWV0aG9kcyk7XG5cbiAgdmFyIG1lcmdlUHJvcFR5cGVzID0gZnVuY3Rpb24obGVmdCwgcmlnaHQsIGtleSkge1xuICAgIGlmICghbGVmdCkgcmV0dXJuIHJpZ2h0O1xuICAgIGlmICghcmlnaHQpIHJldHVybiBsZWZ0O1xuXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIE9iamVjdC5rZXlzKGxlZnQpLmZvckVhY2goZnVuY3Rpb24obGVmdEtleSkge1xuICAgICAgaWYgKCFyaWdodFtsZWZ0S2V5XSkge1xuICAgICAgICByZXN1bHRbbGVmdEtleV0gPSBsZWZ0W2xlZnRLZXldO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgT2JqZWN0LmtleXMocmlnaHQpLmZvckVhY2goZnVuY3Rpb24ocmlnaHRLZXkpIHtcbiAgICAgIGlmIChsZWZ0W3JpZ2h0S2V5XSkge1xuICAgICAgICByZXN1bHRbcmlnaHRLZXldID0gZnVuY3Rpb24gY2hlY2tCb3RoQ29udGV4dFR5cGVzKCkge1xuICAgICAgICAgIHJldHVybiByaWdodFtyaWdodEtleV0uYXBwbHkodGhpcywgYXJndW1lbnRzKSAmJiBsZWZ0W3JpZ2h0S2V5XS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W3JpZ2h0S2V5XSA9IHJpZ2h0W3JpZ2h0S2V5XTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgbWl4aW4oe1xuICAgIGNoaWxkQ29udGV4dFR5cGVzOiBtZXJnZVByb3BUeXBlcyxcbiAgICBjb250ZXh0VHlwZXM6IG1lcmdlUHJvcFR5cGVzLFxuICAgIHByb3BUeXBlczogbWl4aW4uTUFOWV9NRVJHRURfTE9PU0UsXG4gICAgZGVmYXVsdFByb3BzOiBtaXhpbi5NQU5ZX01FUkdFRF9MT09TRVxuICB9KShyZWFjdENsYXNzLCBzdGF0aWNQcm9wcyk7XG5cbiAgLy8gc3RhdGljcyBpcyBhIHNwZWNpYWwgY2FzZSBiZWNhdXNlIGl0IG1lcmdlcyBkaXJlY3RseSBvbnRvIHRoZSBjbGFzc1xuICBpZiAocmVhY3RNaXhpbi5zdGF0aWNzKSB7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocmVhY3RNaXhpbi5zdGF0aWNzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIGxlZnQgPSByZWFjdENsYXNzW2tleV07XG4gICAgICB2YXIgcmlnaHQgPSByZWFjdE1peGluLnN0YXRpY3Nba2V5XTtcblxuICAgICAgaWYgKGxlZnQgIT09IHVuZGVmaW5lZCAmJiByaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBtaXhpbiBzdGF0aWNzIGJlY2F1c2Ugc3RhdGljcy4nICsga2V5ICsgJyBhbmQgQ29tcG9uZW50LicgKyBrZXkgKyAnIGFyZSBkZWZpbmVkLicpO1xuICAgICAgfVxuXG4gICAgICByZWFjdENsYXNzW2tleV0gPSBsZWZ0ICE9PSB1bmRlZmluZWQgPyBsZWZ0IDogcmlnaHQ7XG4gICAgfSk7XG4gIH1cblxuICAvLyBJZiBtb3JlIG1peGlucyBhcmUgZGVmaW5lZCwgdGhleSBuZWVkIHRvIHJ1bi4gVGhpcyBlbXVsYXRlJ3MgcmVhY3QncyBiZWhhdmlvci5cbiAgLy8gU2VlIGJlaGF2aW9yIGluIGNvZGUgYXQ6XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzQxYWEzNDk2YWE2MzI2MzRmNjUwZWRiZTEwZDYxNzc5OTkyMmQyNjUvc3JjL2lzb21vcnBoaWMvY2xhc3NpYy9jbGFzcy9SZWFjdENsYXNzLmpzI0w0NjhcbiAgLy8gTm90ZSB0aGUgLnJldmVyc2UoKS4gSW4gUmVhY3QsIGEgZnJlc2ggY29uc3RydWN0b3IgaXMgY3JlYXRlZCwgdGhlbiBhbGwgbWl4aW5zIGFyZSBtaXhlZCBpbiByZWN1cnNpdmVseSxcbiAgLy8gdGhlbiB0aGUgYWN0dWFsIHNwZWMgaXMgbWl4ZWQgaW4gbGFzdC5cbiAgLy9cbiAgLy8gV2l0aCBFUzYgY2xhc3NlcywgdGhlIHByb3BlcnRpZXMgYXJlIGFscmVhZHkgdGhlcmUsIHNvIHNtYXJ0LW1peGluIG1peGVzIGZ1bmN0aW9ucyAoYSwgYikgLT4gYigpYSgpLCB3aGljaCBpc1xuICAvLyB0aGUgb3Bwb3NpdGUgb2YgaG93IFJlYWN0IGRvZXMgaXQuIElmIHdlIHJldmVyc2UgdGhpcyBhcnJheSwgd2UgYmFzaWNhbGx5IGRvIHRoZSB3aG9sZSBsb2dpYyBpbiByZXZlcnNlLFxuICAvLyB3aGljaCBtYWtlcyB0aGUgcmVzdWx0IHRoZSBzYW1lLiBTZWUgdGhlIHRlc3QgZm9yIG1vcmUuXG4gIC8vIFNlZSBhbHNvOlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi80MWFhMzQ5NmFhNjMyNjM0ZjY1MGVkYmUxMGQ2MTc3OTk5MjJkMjY1L3NyYy9pc29tb3JwaGljL2NsYXNzaWMvY2xhc3MvUmVhY3RDbGFzcy5qcyNMODUzXG4gIGlmIChyZWFjdE1peGluLm1peGlucykge1xuICAgIHJlYWN0TWl4aW4ubWl4aW5zLnJldmVyc2UoKS5mb3JFYWNoKG1peGluQ2xhc3MuYmluZChudWxsLCByZWFjdENsYXNzKSk7XG4gIH1cblxuICByZXR1cm4gcmVhY3RDbGFzcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciByZWFjdE1peGluID0gbWl4aW5Qcm90bztcblxuICByZWFjdE1peGluLm9uQ2xhc3MgPSBmdW5jdGlvbihyZWFjdENsYXNzLCBtaXhpbikge1xuICAgIHJldHVybiBtaXhpbkNsYXNzKHJlYWN0Q2xhc3MsIG1peGluKTtcbiAgfTtcblxuICByZWFjdE1peGluLmRlY29yYXRlID0gZnVuY3Rpb24obWl4aW4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVhY3RDbGFzcykge1xuICAgICAgcmV0dXJuIHJlYWN0TWl4aW4ub25DbGFzcyhyZWFjdENsYXNzLCBtaXhpbik7XG4gICAgfTtcbiAgfTtcblxuICByZXR1cm4gcmVhY3RNaXhpbjtcbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIFRvT2JqZWN0KHZhbCkge1xuXHRpZiAodmFsID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG5cdHZhciBmcm9tO1xuXHR2YXIga2V5cztcblx0dmFyIHRvID0gVG9PYmplY3QodGFyZ2V0KTtcblxuXHRmb3IgKHZhciBzID0gMTsgcyA8IGFyZ3VtZW50cy5sZW5ndGg7IHMrKykge1xuXHRcdGZyb20gPSBhcmd1bWVudHNbc107XG5cdFx0a2V5cyA9IE9iamVjdC5rZXlzKE9iamVjdChmcm9tKSk7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRvW2tleXNbaV1dID0gZnJvbVtrZXlzW2ldXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwidmFyIG9ialRvU3RyID0gZnVuY3Rpb24oeCl7IHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCk7IH07XG5cbnZhciB0aHJvd2VyID0gZnVuY3Rpb24oZXJyb3Ipe1xuICAgIHRocm93IGVycm9yO1xufTtcblxudmFyIG1peGlucyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWFrZU1peGluRnVuY3Rpb24ocnVsZXMsIF9vcHRzKXtcbiAgICB2YXIgb3B0cyA9IF9vcHRzIHx8IHt9O1xuICAgIGlmICghb3B0cy51bmtub3duRnVuY3Rpb24pIHtcbiAgICAgICAgb3B0cy51bmtub3duRnVuY3Rpb24gPSBtaXhpbnMuT05DRTtcbiAgICB9XG5cbiAgICBpZiAoIW9wdHMubm9uRnVuY3Rpb25Qcm9wZXJ0eSkge1xuICAgICAgICBvcHRzLm5vbkZ1bmN0aW9uUHJvcGVydHkgPSBmdW5jdGlvbihsZWZ0LCByaWdodCwga2V5KXtcbiAgICAgICAgICAgIGlmIChsZWZ0ICE9PSB1bmRlZmluZWQgJiYgcmlnaHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhciBnZXRUeXBlTmFtZSA9IGZ1bmN0aW9uKG9iail7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmogJiYgb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqVG9TdHIob2JqKS5zbGljZSg4LCAtMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBtaXhpbiBrZXkgJyArIGtleSArICcgYmVjYXVzZSBpdCBpcyBwcm92aWRlZCBieSBtdWx0aXBsZSBzb3VyY2VzLCAnXG4gICAgICAgICAgICAgICAgICAgICAgICArICdhbmQgdGhlIHR5cGVzIGFyZSAnICsgZ2V0VHlwZU5hbWUobGVmdCkgKyAnIGFuZCAnICsgZ2V0VHlwZU5hbWUocmlnaHQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsZWZ0ID09PSB1bmRlZmluZWQgPyByaWdodCA6IGxlZnQ7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0Tm9uRW51bWVyYWJsZSh0YXJnZXQsIGtleSwgdmFsdWUpe1xuICAgICAgICBpZiAoa2V5IGluIHRhcmdldCl7XG4gICAgICAgICAgICB0YXJnZXRba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gYXBwbHlNaXhpbihzb3VyY2UsIG1peGluKXtcbiAgICAgICAgT2JqZWN0LmtleXMobWl4aW4pLmZvckVhY2goZnVuY3Rpb24oa2V5KXtcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gc291cmNlW2tleV0sIHJpZ2h0ID0gbWl4aW5ba2V5XSwgcnVsZSA9IHJ1bGVzW2tleV07XG5cbiAgICAgICAgICAgIC8vIHRoaXMgaXMganVzdCBhIHdlaXJkIGNhc2Ugd2hlcmUgdGhlIGtleSB3YXMgZGVmaW5lZCwgYnV0IHRoZXJlJ3Mgbm8gdmFsdWVcbiAgICAgICAgICAgIC8vIGJlaGF2ZSBsaWtlIHRoZSBrZXkgd2Fzbid0IGRlZmluZWRcbiAgICAgICAgICAgIGlmIChsZWZ0ID09PSB1bmRlZmluZWQgJiYgcmlnaHQgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YXIgd3JhcElmRnVuY3Rpb24gPSBmdW5jdGlvbih0aGluZyl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB0aGluZyAhPT0gXCJmdW5jdGlvblwiID8gdGhpbmdcbiAgICAgICAgICAgICAgICA6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGluZy5jYWxsKHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGRvIHdlIGhhdmUgYSBydWxlIGZvciB0aGlzIGtleT9cbiAgICAgICAgICAgIGlmIChydWxlKSB7XG4gICAgICAgICAgICAgICAgLy8gbWF5IHRocm93IGhlcmVcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSBydWxlKGxlZnQsIHJpZ2h0LCBrZXkpO1xuICAgICAgICAgICAgICAgIHNldE5vbkVudW1lcmFibGUoc291cmNlLCBrZXksIHdyYXBJZkZ1bmN0aW9uKGZuKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbGVmdElzRm4gPSB0eXBlb2YgbGVmdCA9PT0gXCJmdW5jdGlvblwiO1xuICAgICAgICAgICAgdmFyIHJpZ2h0SXNGbiA9IHR5cGVvZiByaWdodCA9PT0gXCJmdW5jdGlvblwiO1xuXG4gICAgICAgICAgICAvLyBjaGVjayB0byBzZWUgaWYgdGhleSdyZSBzb21lIGNvbWJpbmF0aW9uIG9mIGZ1bmN0aW9ucyBvciB1bmRlZmluZWRcbiAgICAgICAgICAgIC8vIHdlIGFscmVhZHkga25vdyB0aGVyZSdzIG5vIHJ1bGUsIHNvIHVzZSB0aGUgdW5rbm93biBmdW5jdGlvbiBiZWhhdmlvclxuICAgICAgICAgICAgaWYgKGxlZnRJc0ZuICYmIHJpZ2h0ID09PSB1bmRlZmluZWRcbiAgICAgICAgICAgICB8fCByaWdodElzRm4gJiYgbGVmdCA9PT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgfHwgbGVmdElzRm4gJiYgcmlnaHRJc0ZuKSB7XG4gICAgICAgICAgICAgICAgLy8gbWF5IHRocm93LCB0aGUgZGVmYXVsdCBpcyBPTkNFIHNvIGlmIGJvdGggYXJlIGZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgIC8vIHRoZSBkZWZhdWx0IGlzIHRvIHRocm93XG4gICAgICAgICAgICAgICAgc2V0Tm9uRW51bWVyYWJsZShzb3VyY2UsIGtleSwgd3JhcElmRnVuY3Rpb24ob3B0cy51bmtub3duRnVuY3Rpb24obGVmdCwgcmlnaHQsIGtleSkpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHdlIGhhdmUgbm8gcnVsZSBmb3IgdGhlbSwgb25lIG1heSBiZSBhIGZ1bmN0aW9uIGJ1dCBvbmUgb3IgYm90aCBhcmVuJ3RcbiAgICAgICAgICAgIC8vIG91ciBkZWZhdWx0IGlzIE1BTllfTUVSR0VEX0xPT1NFIHdoaWNoIHdpbGwgbWVyZ2Ugb2JqZWN0cywgY29uY2F0IGFycmF5c1xuICAgICAgICAgICAgLy8gYW5kIHRocm93IGlmIHRoZXJlJ3MgYSB0eXBlIG1pc21hdGNoIG9yIGJvdGggYXJlIHByaW1pdGl2ZXMgKGhvdyBkbyB5b3UgbWVyZ2UgMywgYW5kIFwiZm9vXCI/KVxuICAgICAgICAgICAgc291cmNlW2tleV0gPSBvcHRzLm5vbkZ1bmN0aW9uUHJvcGVydHkobGVmdCwgcmlnaHQsIGtleSk7XG4gICAgICAgIH0pO1xuICAgIH07XG59O1xuXG5taXhpbnMuX21lcmdlT2JqZWN0cyA9IGZ1bmN0aW9uKG9iajEsIG9iajIpIHtcbiAgICB2YXIgYXNzZXJ0T2JqZWN0ID0gZnVuY3Rpb24ob2JqLCBvYmoyKXtcbiAgICAgICAgdmFyIHR5cGUgPSBvYmpUb1N0cihvYmopO1xuICAgICAgICBpZiAodHlwZSAhPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIHZhciBkaXNwbGF5VHlwZSA9IG9iai5jb25zdHJ1Y3RvciA/IG9iai5jb25zdHJ1Y3Rvci5uYW1lIDogJ1Vua25vd24nO1xuICAgICAgICAgICAgdmFyIGRpc3BsYXlUeXBlMiA9IG9iajIuY29uc3RydWN0b3IgPyBvYmoyLmNvbnN0cnVjdG9yLm5hbWUgOiAnVW5rbm93bic7XG4gICAgICAgICAgICB0aHJvd2VyKCdjYW5ub3QgbWVyZ2UgcmV0dXJuZWQgdmFsdWUgb2YgdHlwZSAnICsgZGlzcGxheVR5cGUgKyAnIHdpdGggYW4gJyArIGRpc3BsYXlUeXBlMik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkob2JqMSkgJiYgQXJyYXkuaXNBcnJheShvYmoyKSkge1xuICAgICAgICByZXR1cm4gb2JqMS5jb25jYXQob2JqMik7XG4gICAgfVxuXG4gICAgYXNzZXJ0T2JqZWN0KG9iajEsIG9iajIpO1xuICAgIGFzc2VydE9iamVjdChvYmoyLCBvYmoxKTtcblxuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhvYmoxKS5mb3JFYWNoKGZ1bmN0aW9uKGspe1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iajIsIGspKSB7XG4gICAgICAgICAgICB0aHJvd2VyKCdjYW5ub3QgbWVyZ2UgcmV0dXJucyBiZWNhdXNlIGJvdGggaGF2ZSB0aGUgJyArIEpTT04uc3RyaW5naWZ5KGspICsgJyBrZXknKTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRba10gPSBvYmoxW2tdO1xuICAgIH0pO1xuXG4gICAgT2JqZWN0LmtleXMob2JqMikuZm9yRWFjaChmdW5jdGlvbihrKXtcbiAgICAgICAgLy8gd2UgY2FuIHNraXAgdGhlIGNvbmZsaWN0IGNoZWNrIGJlY2F1c2UgYWxsIGNvbmZsaWN0cyB3b3VsZCBhbHJlYWR5IGJlIGZvdW5kXG4gICAgICAgIHJlc3VsdFtrXSA9IG9iajJba107XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcblxufVxuXG4vLyBkZWZpbmUgb3VyIGJ1aWx0LWluIG1peGluIHR5cGVzXG5taXhpbnMuT05DRSA9IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0LCBrZXkpe1xuICAgIGlmIChsZWZ0ICYmIHJpZ2h0KSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBtaXhpbiAnICsga2V5ICsgJyBiZWNhdXNlIGl0IGhhcyBhIHVuaXF1ZSBjb25zdHJhaW50LicpO1xuICAgIH1cblxuICAgIHZhciBmbiA9IGxlZnQgfHwgcmlnaHQ7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oYXJncyl7XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xufTtcblxubWl4aW5zLk1BTlkgPSBmdW5jdGlvbihsZWZ0LCByaWdodCwga2V5KXtcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJncyl7XG4gICAgICAgIGlmIChyaWdodCkgcmlnaHQuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIHJldHVybiBsZWZ0ID8gbGVmdC5hcHBseSh0aGlzLCBhcmdzKSA6IHVuZGVmaW5lZDtcbiAgICB9O1xufTtcblxubWl4aW5zLk1BTllfTUVSR0VEX0xPT1NFID0gZnVuY3Rpb24obGVmdCwgcmlnaHQsIGtleSkge1xuICAgIGlmKGxlZnQgJiYgcmlnaHQpIHtcbiAgICAgICAgcmV0dXJuIG1peGlucy5fbWVyZ2VPYmplY3RzKGxlZnQsIHJpZ2h0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGVmdCB8fCByaWdodDtcbn1cblxubWl4aW5zLk1BTllfTUVSR0VEID0gZnVuY3Rpb24obGVmdCwgcmlnaHQsIGtleSl7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFyZ3Mpe1xuICAgICAgICB2YXIgcmVzMSA9IHJpZ2h0ICYmIHJpZ2h0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB2YXIgcmVzMiA9IGxlZnQgJiYgbGVmdC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgaWYgKHJlczEgJiYgcmVzMikge1xuICAgICAgICAgICAgcmV0dXJuIG1peGlucy5fbWVyZ2VPYmplY3RzKHJlczEsIHJlczIpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlczIgfHwgcmVzMTtcbiAgICB9O1xufTtcblxuXG5taXhpbnMuUkVEVUNFX0xFRlQgPSBmdW5jdGlvbihfbGVmdCwgX3JpZ2h0LCBrZXkpe1xuICAgIHZhciBsZWZ0ID0gX2xlZnQgfHwgZnVuY3Rpb24oeCl7IHJldHVybiB4IH07XG4gICAgdmFyIHJpZ2h0ID0gX3JpZ2h0IHx8IGZ1bmN0aW9uKHgpeyByZXR1cm4geCB9O1xuICAgIHJldHVybiBmdW5jdGlvbihhcmdzKXtcbiAgICAgICAgcmV0dXJuIHJpZ2h0LmNhbGwodGhpcywgbGVmdC5hcHBseSh0aGlzLCBhcmdzKSk7XG4gICAgfTtcbn07XG5cbm1peGlucy5SRURVQ0VfUklHSFQgPSBmdW5jdGlvbihfbGVmdCwgX3JpZ2h0LCBrZXkpe1xuICAgIHZhciBsZWZ0ID0gX2xlZnQgfHwgZnVuY3Rpb24oeCl7IHJldHVybiB4IH07XG4gICAgdmFyIHJpZ2h0ID0gX3JpZ2h0IHx8IGZ1bmN0aW9uKHgpeyByZXR1cm4geCB9O1xuICAgIHJldHVybiBmdW5jdGlvbihhcmdzKXtcbiAgICAgICAgcmV0dXJuIGxlZnQuY2FsbCh0aGlzLCByaWdodC5hcHBseSh0aGlzLCBhcmdzKSk7XG4gICAgfTtcbn07XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGNyZWF0ZUFsbDtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2NyZWF0ZVByb3ZpZGVyID0gcmVxdWlyZSgnLi9jcmVhdGVQcm92aWRlcicpO1xuXG52YXIgX2NyZWF0ZVByb3ZpZGVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2NyZWF0ZVByb3ZpZGVyKTtcblxudmFyIF9jcmVhdGVDb25uZWN0ID0gcmVxdWlyZSgnLi9jcmVhdGVDb25uZWN0Jyk7XG5cbnZhciBfY3JlYXRlQ29ubmVjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9jcmVhdGVDb25uZWN0KTtcblxuZnVuY3Rpb24gY3JlYXRlQWxsKFJlYWN0KSB7XG4gIHZhciBQcm92aWRlciA9IF9jcmVhdGVQcm92aWRlcjJbJ2RlZmF1bHQnXShSZWFjdCk7XG4gIHZhciBjb25uZWN0ID0gX2NyZWF0ZUNvbm5lY3QyWydkZWZhdWx0J10oUmVhY3QpO1xuXG4gIHJldHVybiB7IFByb3ZpZGVyOiBQcm92aWRlciwgY29ubmVjdDogY29ubmVjdCB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGNyZWF0ZUNvbm5lY3Q7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cbnZhciBfdXRpbHNDcmVhdGVTdG9yZVNoYXBlID0gcmVxdWlyZSgnLi4vdXRpbHMvY3JlYXRlU3RvcmVTaGFwZScpO1xuXG52YXIgX3V0aWxzQ3JlYXRlU3RvcmVTaGFwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsc0NyZWF0ZVN0b3JlU2hhcGUpO1xuXG52YXIgX3V0aWxzU2hhbGxvd0VxdWFsID0gcmVxdWlyZSgnLi4vdXRpbHMvc2hhbGxvd0VxdWFsJyk7XG5cbnZhciBfdXRpbHNTaGFsbG93RXF1YWwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNTaGFsbG93RXF1YWwpO1xuXG52YXIgX3V0aWxzSXNQbGFpbk9iamVjdCA9IHJlcXVpcmUoJy4uL3V0aWxzL2lzUGxhaW5PYmplY3QnKTtcblxudmFyIF91dGlsc0lzUGxhaW5PYmplY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNJc1BsYWluT2JqZWN0KTtcblxudmFyIF91dGlsc1dyYXBBY3Rpb25DcmVhdG9ycyA9IHJlcXVpcmUoJy4uL3V0aWxzL3dyYXBBY3Rpb25DcmVhdG9ycycpO1xuXG52YXIgX3V0aWxzV3JhcEFjdGlvbkNyZWF0b3JzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxzV3JhcEFjdGlvbkNyZWF0b3JzKTtcblxudmFyIF9ob2lzdE5vblJlYWN0U3RhdGljcyA9IHJlcXVpcmUoJ2hvaXN0LW5vbi1yZWFjdC1zdGF0aWNzJyk7XG5cbnZhciBfaG9pc3ROb25SZWFjdFN0YXRpY3MyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaG9pc3ROb25SZWFjdFN0YXRpY3MpO1xuXG52YXIgX2ludmFyaWFudCA9IHJlcXVpcmUoJ2ludmFyaWFudCcpO1xuXG52YXIgX2ludmFyaWFudDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pbnZhcmlhbnQpO1xuXG52YXIgZGVmYXVsdE1hcFN0YXRlVG9Qcm9wcyA9IGZ1bmN0aW9uIGRlZmF1bHRNYXBTdGF0ZVRvUHJvcHMoKSB7XG4gIHJldHVybiB7fTtcbn07XG52YXIgZGVmYXVsdE1hcERpc3BhdGNoVG9Qcm9wcyA9IGZ1bmN0aW9uIGRlZmF1bHRNYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2gpIHtcbiAgcmV0dXJuIHsgZGlzcGF0Y2g6IGRpc3BhdGNoIH07XG59O1xudmFyIGRlZmF1bHRNZXJnZVByb3BzID0gZnVuY3Rpb24gZGVmYXVsdE1lcmdlUHJvcHMoc3RhdGVQcm9wcywgZGlzcGF0Y2hQcm9wcywgcGFyZW50UHJvcHMpIHtcbiAgcmV0dXJuIF9leHRlbmRzKHt9LCBwYXJlbnRQcm9wcywgc3RhdGVQcm9wcywgZGlzcGF0Y2hQcm9wcyk7XG59O1xuXG5mdW5jdGlvbiBnZXREaXNwbGF5TmFtZShDb21wb25lbnQpIHtcbiAgcmV0dXJuIENvbXBvbmVudC5kaXNwbGF5TmFtZSB8fCBDb21wb25lbnQubmFtZSB8fCAnQ29tcG9uZW50Jztcbn1cblxuLy8gSGVscHMgdHJhY2sgaG90IHJlbG9hZGluZy5cbnZhciBuZXh0VmVyc2lvbiA9IDA7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbm5lY3QoUmVhY3QpIHtcbiAgdmFyIENvbXBvbmVudCA9IFJlYWN0LkNvbXBvbmVudDtcbiAgdmFyIFByb3BUeXBlcyA9IFJlYWN0LlByb3BUeXBlcztcblxuICB2YXIgc3RvcmVTaGFwZSA9IF91dGlsc0NyZWF0ZVN0b3JlU2hhcGUyWydkZWZhdWx0J10oUHJvcFR5cGVzKTtcblxuICByZXR1cm4gZnVuY3Rpb24gY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcywgbWVyZ2VQcm9wcykge1xuICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAzIHx8IGFyZ3VtZW50c1szXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbM107XG5cbiAgICB2YXIgc2hvdWxkU3Vic2NyaWJlID0gQm9vbGVhbihtYXBTdGF0ZVRvUHJvcHMpO1xuICAgIHZhciBmaW5hbE1hcFN0YXRlVG9Qcm9wcyA9IG1hcFN0YXRlVG9Qcm9wcyB8fCBkZWZhdWx0TWFwU3RhdGVUb1Byb3BzO1xuICAgIHZhciBmaW5hbE1hcERpc3BhdGNoVG9Qcm9wcyA9IF91dGlsc0lzUGxhaW5PYmplY3QyWydkZWZhdWx0J10obWFwRGlzcGF0Y2hUb1Byb3BzKSA/IF91dGlsc1dyYXBBY3Rpb25DcmVhdG9yczJbJ2RlZmF1bHQnXShtYXBEaXNwYXRjaFRvUHJvcHMpIDogbWFwRGlzcGF0Y2hUb1Byb3BzIHx8IGRlZmF1bHRNYXBEaXNwYXRjaFRvUHJvcHM7XG4gICAgdmFyIGZpbmFsTWVyZ2VQcm9wcyA9IG1lcmdlUHJvcHMgfHwgZGVmYXVsdE1lcmdlUHJvcHM7XG4gICAgdmFyIHNob3VsZFVwZGF0ZVN0YXRlUHJvcHMgPSBmaW5hbE1hcFN0YXRlVG9Qcm9wcy5sZW5ndGggPiAxO1xuICAgIHZhciBzaG91bGRVcGRhdGVEaXNwYXRjaFByb3BzID0gZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMubGVuZ3RoID4gMTtcbiAgICB2YXIgX29wdGlvbnMkcHVyZSA9IG9wdGlvbnMucHVyZTtcbiAgICB2YXIgcHVyZSA9IF9vcHRpb25zJHB1cmUgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBfb3B0aW9ucyRwdXJlO1xuXG4gICAgLy8gSGVscHMgdHJhY2sgaG90IHJlbG9hZGluZy5cbiAgICB2YXIgdmVyc2lvbiA9IG5leHRWZXJzaW9uKys7XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlU3RhdGVQcm9wcyhzdG9yZSwgcHJvcHMpIHtcbiAgICAgIHZhciBzdGF0ZSA9IHN0b3JlLmdldFN0YXRlKCk7XG4gICAgICB2YXIgc3RhdGVQcm9wcyA9IHNob3VsZFVwZGF0ZVN0YXRlUHJvcHMgPyBmaW5hbE1hcFN0YXRlVG9Qcm9wcyhzdGF0ZSwgcHJvcHMpIDogZmluYWxNYXBTdGF0ZVRvUHJvcHMoc3RhdGUpO1xuXG4gICAgICBfaW52YXJpYW50MlsnZGVmYXVsdCddKF91dGlsc0lzUGxhaW5PYmplY3QyWydkZWZhdWx0J10oc3RhdGVQcm9wcyksICdgbWFwU3RhdGVUb1Byb3BzYCBtdXN0IHJldHVybiBhbiBvYmplY3QuIEluc3RlYWQgcmVjZWl2ZWQgJXMuJywgc3RhdGVQcm9wcyk7XG4gICAgICByZXR1cm4gc3RhdGVQcm9wcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlRGlzcGF0Y2hQcm9wcyhzdG9yZSwgcHJvcHMpIHtcbiAgICAgIHZhciBkaXNwYXRjaCA9IHN0b3JlLmRpc3BhdGNoO1xuXG4gICAgICB2YXIgZGlzcGF0Y2hQcm9wcyA9IHNob3VsZFVwZGF0ZURpc3BhdGNoUHJvcHMgPyBmaW5hbE1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCwgcHJvcHMpIDogZmluYWxNYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2gpO1xuXG4gICAgICBfaW52YXJpYW50MlsnZGVmYXVsdCddKF91dGlsc0lzUGxhaW5PYmplY3QyWydkZWZhdWx0J10oZGlzcGF0Y2hQcm9wcyksICdgbWFwRGlzcGF0Y2hUb1Byb3BzYCBtdXN0IHJldHVybiBhbiBvYmplY3QuIEluc3RlYWQgcmVjZWl2ZWQgJXMuJywgZGlzcGF0Y2hQcm9wcyk7XG4gICAgICByZXR1cm4gZGlzcGF0Y2hQcm9wcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfY29tcHV0ZU5leHRTdGF0ZShzdGF0ZVByb3BzLCBkaXNwYXRjaFByb3BzLCBwYXJlbnRQcm9wcykge1xuICAgICAgdmFyIG1lcmdlZFByb3BzID0gZmluYWxNZXJnZVByb3BzKHN0YXRlUHJvcHMsIGRpc3BhdGNoUHJvcHMsIHBhcmVudFByb3BzKTtcbiAgICAgIF9pbnZhcmlhbnQyWydkZWZhdWx0J10oX3V0aWxzSXNQbGFpbk9iamVjdDJbJ2RlZmF1bHQnXShtZXJnZWRQcm9wcyksICdgbWVyZ2VQcm9wc2AgbXVzdCByZXR1cm4gYW4gb2JqZWN0LiBJbnN0ZWFkIHJlY2VpdmVkICVzLicsIG1lcmdlZFByb3BzKTtcbiAgICAgIHJldHVybiBtZXJnZWRQcm9wcztcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gd3JhcFdpdGhDb25uZWN0KFdyYXBwZWRDb21wb25lbnQpIHtcbiAgICAgIHZhciBDb25uZWN0ID0gKGZ1bmN0aW9uIChfQ29tcG9uZW50KSB7XG4gICAgICAgIF9pbmhlcml0cyhDb25uZWN0LCBfQ29tcG9uZW50KTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS5zaG91bGRDb21wb25lbnRVcGRhdGUgPSBmdW5jdGlvbiBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgICBpZiAoIXB1cmUpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdGVQcm9wcyhuZXh0UHJvcHMpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVEaXNwYXRjaFByb3BzKG5leHRQcm9wcyk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKG5leHRQcm9wcyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgc3RvcmVDaGFuZ2VkID0gbmV4dFN0YXRlLnN0b3JlU3RhdGUgIT09IHRoaXMuc3RhdGUuc3RvcmVTdGF0ZTtcbiAgICAgICAgICB2YXIgcHJvcHNDaGFuZ2VkID0gIV91dGlsc1NoYWxsb3dFcXVhbDJbJ2RlZmF1bHQnXShuZXh0UHJvcHMsIHRoaXMucHJvcHMpO1xuICAgICAgICAgIHZhciBtYXBTdGF0ZVByb2R1Y2VkQ2hhbmdlID0gZmFsc2U7XG4gICAgICAgICAgdmFyIGRpc3BhdGNoUHJvcHNDaGFuZ2VkID0gZmFsc2U7XG5cbiAgICAgICAgICBpZiAoc3RvcmVDaGFuZ2VkIHx8IHByb3BzQ2hhbmdlZCAmJiBzaG91bGRVcGRhdGVTdGF0ZVByb3BzKSB7XG4gICAgICAgICAgICBtYXBTdGF0ZVByb2R1Y2VkQ2hhbmdlID0gdGhpcy51cGRhdGVTdGF0ZVByb3BzKG5leHRQcm9wcyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHByb3BzQ2hhbmdlZCAmJiBzaG91bGRVcGRhdGVEaXNwYXRjaFByb3BzKSB7XG4gICAgICAgICAgICBkaXNwYXRjaFByb3BzQ2hhbmdlZCA9IHRoaXMudXBkYXRlRGlzcGF0Y2hQcm9wcyhuZXh0UHJvcHMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChwcm9wc0NoYW5nZWQgfHwgbWFwU3RhdGVQcm9kdWNlZENoYW5nZSB8fCBkaXNwYXRjaFByb3BzQ2hhbmdlZCkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdGF0ZShuZXh0UHJvcHMpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIENvbm5lY3QocHJvcHMsIGNvbnRleHQpIHtcbiAgICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQ29ubmVjdCk7XG5cbiAgICAgICAgICBfQ29tcG9uZW50LmNhbGwodGhpcywgcHJvcHMsIGNvbnRleHQpO1xuICAgICAgICAgIHRoaXMudmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgICAgdGhpcy5zdG9yZSA9IHByb3BzLnN0b3JlIHx8IGNvbnRleHQuc3RvcmU7XG5cbiAgICAgICAgICBfaW52YXJpYW50MlsnZGVmYXVsdCddKHRoaXMuc3RvcmUsICdDb3VsZCBub3QgZmluZCBcInN0b3JlXCIgaW4gZWl0aGVyIHRoZSBjb250ZXh0IG9yICcgKyAoJ3Byb3BzIG9mIFwiJyArIHRoaXMuY29uc3RydWN0b3IuZGlzcGxheU5hbWUgKyAnXCIuICcpICsgJ0VpdGhlciB3cmFwIHRoZSByb290IGNvbXBvbmVudCBpbiBhIDxQcm92aWRlcj4sICcgKyAoJ29yIGV4cGxpY2l0bHkgcGFzcyBcInN0b3JlXCIgYXMgYSBwcm9wIHRvIFwiJyArIHRoaXMuY29uc3RydWN0b3IuZGlzcGxheU5hbWUgKyAnXCIuJykpO1xuXG4gICAgICAgICAgdGhpcy5zdGF0ZVByb3BzID0gY29tcHV0ZVN0YXRlUHJvcHModGhpcy5zdG9yZSwgcHJvcHMpO1xuICAgICAgICAgIHRoaXMuZGlzcGF0Y2hQcm9wcyA9IGNvbXB1dGVEaXNwYXRjaFByb3BzKHRoaXMuc3RvcmUsIHByb3BzKTtcbiAgICAgICAgICB0aGlzLnN0YXRlID0geyBzdG9yZVN0YXRlOiBudWxsIH07XG4gICAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUuY29tcHV0ZU5leHRTdGF0ZSA9IGZ1bmN0aW9uIGNvbXB1dGVOZXh0U3RhdGUoKSB7XG4gICAgICAgICAgdmFyIHByb3BzID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdGhpcy5wcm9wcyA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgICAgIHJldHVybiBfY29tcHV0ZU5leHRTdGF0ZSh0aGlzLnN0YXRlUHJvcHMsIHRoaXMuZGlzcGF0Y2hQcm9wcywgcHJvcHMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLnVwZGF0ZVN0YXRlUHJvcHMgPSBmdW5jdGlvbiB1cGRhdGVTdGF0ZVByb3BzKCkge1xuICAgICAgICAgIHZhciBwcm9wcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRoaXMucHJvcHMgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgICAgICB2YXIgbmV4dFN0YXRlUHJvcHMgPSBjb21wdXRlU3RhdGVQcm9wcyh0aGlzLnN0b3JlLCBwcm9wcyk7XG4gICAgICAgICAgaWYgKF91dGlsc1NoYWxsb3dFcXVhbDJbJ2RlZmF1bHQnXShuZXh0U3RhdGVQcm9wcywgdGhpcy5zdGF0ZVByb3BzKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuc3RhdGVQcm9wcyA9IG5leHRTdGF0ZVByb3BzO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLnVwZGF0ZURpc3BhdGNoUHJvcHMgPSBmdW5jdGlvbiB1cGRhdGVEaXNwYXRjaFByb3BzKCkge1xuICAgICAgICAgIHZhciBwcm9wcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRoaXMucHJvcHMgOiBhcmd1bWVudHNbMF07XG5cbiAgICAgICAgICB2YXIgbmV4dERpc3BhdGNoUHJvcHMgPSBjb21wdXRlRGlzcGF0Y2hQcm9wcyh0aGlzLnN0b3JlLCBwcm9wcyk7XG4gICAgICAgICAgaWYgKF91dGlsc1NoYWxsb3dFcXVhbDJbJ2RlZmF1bHQnXShuZXh0RGlzcGF0Y2hQcm9wcywgdGhpcy5kaXNwYXRjaFByb3BzKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuZGlzcGF0Y2hQcm9wcyA9IG5leHREaXNwYXRjaFByb3BzO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLnVwZGF0ZVN0YXRlID0gZnVuY3Rpb24gdXBkYXRlU3RhdGUoKSB7XG4gICAgICAgICAgdmFyIHByb3BzID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdGhpcy5wcm9wcyA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgICAgIHRoaXMubmV4dFN0YXRlID0gdGhpcy5jb21wdXRlTmV4dFN0YXRlKHByb3BzKTtcbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS5pc1N1YnNjcmliZWQgPSBmdW5jdGlvbiBpc1N1YnNjcmliZWQoKSB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiB0aGlzLnVuc3Vic2NyaWJlID09PSAnZnVuY3Rpb24nO1xuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLnRyeVN1YnNjcmliZSA9IGZ1bmN0aW9uIHRyeVN1YnNjcmliZSgpIHtcbiAgICAgICAgICBpZiAoc2hvdWxkU3Vic2NyaWJlICYmICF0aGlzLnVuc3Vic2NyaWJlKSB7XG4gICAgICAgICAgICB0aGlzLnVuc3Vic2NyaWJlID0gdGhpcy5zdG9yZS5zdWJzY3JpYmUodGhpcy5oYW5kbGVDaGFuZ2UuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNoYW5nZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS50cnlVbnN1YnNjcmliZSA9IGZ1bmN0aW9uIHRyeVVuc3Vic2NyaWJlKCkge1xuICAgICAgICAgIGlmICh0aGlzLnVuc3Vic2NyaWJlKSB7XG4gICAgICAgICAgICB0aGlzLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLnVuc3Vic2NyaWJlID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgQ29ubmVjdC5wcm90b3R5cGUuY29tcG9uZW50RGlkTW91bnQgPSBmdW5jdGlvbiBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgICB0aGlzLnRyeVN1YnNjcmliZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLmNvbXBvbmVudFdpbGxVbm1vdW50ID0gZnVuY3Rpb24gY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgICAgdGhpcy50cnlVbnN1YnNjcmliZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLmhhbmRsZUNoYW5nZSA9IGZ1bmN0aW9uIGhhbmRsZUNoYW5nZSgpIHtcbiAgICAgICAgICBpZiAoIXRoaXMudW5zdWJzY3JpYmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0b3JlU3RhdGU6IHRoaXMuc3RvcmUuZ2V0U3RhdGUoKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIENvbm5lY3QucHJvdG90eXBlLmdldFdyYXBwZWRJbnN0YW5jZSA9IGZ1bmN0aW9uIGdldFdyYXBwZWRJbnN0YW5jZSgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWZzLndyYXBwZWRJbnN0YW5jZTtcbiAgICAgICAgfTtcblxuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoV3JhcHBlZENvbXBvbmVudCwgX2V4dGVuZHMoeyByZWY6ICd3cmFwcGVkSW5zdGFuY2UnXG4gICAgICAgICAgfSwgdGhpcy5uZXh0U3RhdGUpKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gQ29ubmVjdDtcbiAgICAgIH0pKENvbXBvbmVudCk7XG5cbiAgICAgIENvbm5lY3QuZGlzcGxheU5hbWUgPSAnQ29ubmVjdCgnICsgZ2V0RGlzcGxheU5hbWUoV3JhcHBlZENvbXBvbmVudCkgKyAnKSc7XG4gICAgICBDb25uZWN0LldyYXBwZWRDb21wb25lbnQgPSBXcmFwcGVkQ29tcG9uZW50O1xuICAgICAgQ29ubmVjdC5jb250ZXh0VHlwZXMgPSB7XG4gICAgICAgIHN0b3JlOiBzdG9yZVNoYXBlXG4gICAgICB9O1xuICAgICAgQ29ubmVjdC5wcm9wVHlwZXMgPSB7XG4gICAgICAgIHN0b3JlOiBzdG9yZVNoYXBlXG4gICAgICB9O1xuXG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICBDb25uZWN0LnByb3RvdHlwZS5jb21wb25lbnRXaWxsVXBkYXRlID0gZnVuY3Rpb24gY29tcG9uZW50V2lsbFVwZGF0ZSgpIHtcbiAgICAgICAgICBpZiAodGhpcy52ZXJzaW9uID09PSB2ZXJzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gV2UgYXJlIGhvdCByZWxvYWRpbmchXG4gICAgICAgICAgdGhpcy52ZXJzaW9uID0gdmVyc2lvbjtcblxuICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc3RhdGUgYW5kIGJpbmRpbmdzLlxuICAgICAgICAgIHRoaXMudHJ5U3Vic2NyaWJlKCk7XG4gICAgICAgICAgdGhpcy51cGRhdGVTdGF0ZVByb3BzKCk7XG4gICAgICAgICAgdGhpcy51cGRhdGVEaXNwYXRjaFByb3BzKCk7XG4gICAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSgpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gX2hvaXN0Tm9uUmVhY3RTdGF0aWNzMlsnZGVmYXVsdCddKENvbm5lY3QsIFdyYXBwZWRDb21wb25lbnQpO1xuICAgIH07XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGNyZWF0ZVByb3ZpZGVyO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG52YXIgX3V0aWxzQ3JlYXRlU3RvcmVTaGFwZSA9IHJlcXVpcmUoJy4uL3V0aWxzL2NyZWF0ZVN0b3JlU2hhcGUnKTtcblxudmFyIF91dGlsc0NyZWF0ZVN0b3JlU2hhcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbHNDcmVhdGVTdG9yZVNoYXBlKTtcblxuZnVuY3Rpb24gaXNVc2luZ093bmVyQ29udGV4dChSZWFjdCkge1xuICB2YXIgdmVyc2lvbiA9IFJlYWN0LnZlcnNpb247XG5cbiAgaWYgKHR5cGVvZiB2ZXJzaW9uICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgdmFyIHNlY3Rpb25zID0gdmVyc2lvbi5zcGxpdCgnLicpO1xuICB2YXIgbWFqb3IgPSBwYXJzZUludChzZWN0aW9uc1swXSwgMTApO1xuICB2YXIgbWlub3IgPSBwYXJzZUludChzZWN0aW9uc1sxXSwgMTApO1xuXG4gIHJldHVybiBtYWpvciA9PT0gMCAmJiBtaW5vciA9PT0gMTM7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb3ZpZGVyKFJlYWN0KSB7XG4gIHZhciBDb21wb25lbnQgPSBSZWFjdC5Db21wb25lbnQ7XG4gIHZhciBQcm9wVHlwZXMgPSBSZWFjdC5Qcm9wVHlwZXM7XG4gIHZhciBDaGlsZHJlbiA9IFJlYWN0LkNoaWxkcmVuO1xuXG4gIHZhciBzdG9yZVNoYXBlID0gX3V0aWxzQ3JlYXRlU3RvcmVTaGFwZTJbJ2RlZmF1bHQnXShQcm9wVHlwZXMpO1xuICB2YXIgcmVxdWlyZUZ1bmN0aW9uQ2hpbGQgPSBpc1VzaW5nT3duZXJDb250ZXh0KFJlYWN0KTtcblxuICB2YXIgZGlkV2FybkFib3V0Q2hpbGQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gd2FybkFib3V0RnVuY3Rpb25DaGlsZCgpIHtcbiAgICBpZiAoZGlkV2FybkFib3V0Q2hpbGQgfHwgcmVxdWlyZUZ1bmN0aW9uQ2hpbGQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkaWRXYXJuQWJvdXRDaGlsZCA9IHRydWU7XG4gICAgY29uc29sZS5lcnJvciggLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgJ1dpdGggUmVhY3QgMC4xNCBhbmQgbGF0ZXIgdmVyc2lvbnMsIHlvdSBubyBsb25nZXIgbmVlZCB0byAnICsgJ3dyYXAgPFByb3ZpZGVyPiBjaGlsZCBpbnRvIGEgZnVuY3Rpb24uJyk7XG4gIH1cbiAgZnVuY3Rpb24gd2FybkFib3V0RWxlbWVudENoaWxkKCkge1xuICAgIGlmIChkaWRXYXJuQWJvdXRDaGlsZCB8fCAhcmVxdWlyZUZ1bmN0aW9uQ2hpbGQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkaWRXYXJuQWJvdXRDaGlsZCA9IHRydWU7XG4gICAgY29uc29sZS5lcnJvciggLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgJ1dpdGggUmVhY3QgMC4xMywgeW91IG5lZWQgdG8gJyArICd3cmFwIDxQcm92aWRlcj4gY2hpbGQgaW50byBhIGZ1bmN0aW9uLiAnICsgJ1RoaXMgcmVzdHJpY3Rpb24gd2lsbCBiZSByZW1vdmVkIHdpdGggUmVhY3QgMC4xNC4nKTtcbiAgfVxuXG4gIHZhciBkaWRXYXJuQWJvdXRSZWNlaXZpbmdTdG9yZSA9IGZhbHNlO1xuICBmdW5jdGlvbiB3YXJuQWJvdXRSZWNlaXZpbmdTdG9yZSgpIHtcbiAgICBpZiAoZGlkV2FybkFib3V0UmVjZWl2aW5nU3RvcmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkaWRXYXJuQWJvdXRSZWNlaXZpbmdTdG9yZSA9IHRydWU7XG4gICAgY29uc29sZS5lcnJvciggLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgJzxQcm92aWRlcj4gZG9lcyBub3Qgc3VwcG9ydCBjaGFuZ2luZyBgc3RvcmVgIG9uIHRoZSBmbHkuICcgKyAnSXQgaXMgbW9zdCBsaWtlbHkgdGhhdCB5b3Ugc2VlIHRoaXMgZXJyb3IgYmVjYXVzZSB5b3UgdXBkYXRlZCB0byAnICsgJ1JlZHV4IDIueCBhbmQgUmVhY3QgUmVkdXggMi54IHdoaWNoIG5vIGxvbmdlciBob3QgcmVsb2FkIHJlZHVjZXJzICcgKyAnYXV0b21hdGljYWxseS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9yYWNrdC9yZWFjdC1yZWR1eC9yZWxlYXNlcy8nICsgJ3RhZy92Mi4wLjAgZm9yIHRoZSBtaWdyYXRpb24gaW5zdHJ1Y3Rpb25zLicpO1xuICB9XG5cbiAgdmFyIFByb3ZpZGVyID0gKGZ1bmN0aW9uIChfQ29tcG9uZW50KSB7XG4gICAgX2luaGVyaXRzKFByb3ZpZGVyLCBfQ29tcG9uZW50KTtcblxuICAgIFByb3ZpZGVyLnByb3RvdHlwZS5nZXRDaGlsZENvbnRleHQgPSBmdW5jdGlvbiBnZXRDaGlsZENvbnRleHQoKSB7XG4gICAgICByZXR1cm4geyBzdG9yZTogdGhpcy5zdG9yZSB9O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBQcm92aWRlcihwcm9wcywgY29udGV4dCkge1xuICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFByb3ZpZGVyKTtcblxuICAgICAgX0NvbXBvbmVudC5jYWxsKHRoaXMsIHByb3BzLCBjb250ZXh0KTtcbiAgICAgIHRoaXMuc3RvcmUgPSBwcm9wcy5zdG9yZTtcbiAgICB9XG5cbiAgICBQcm92aWRlci5wcm90b3R5cGUuY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyA9IGZ1bmN0aW9uIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG4gICAgICB2YXIgc3RvcmUgPSB0aGlzLnN0b3JlO1xuICAgICAgdmFyIG5leHRTdG9yZSA9IG5leHRQcm9wcy5zdG9yZTtcblxuICAgICAgaWYgKHN0b3JlICE9PSBuZXh0U3RvcmUpIHtcbiAgICAgICAgd2FybkFib3V0UmVjZWl2aW5nU3RvcmUoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgUHJvdmlkZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMucHJvcHMuY2hpbGRyZW47XG5cbiAgICAgIGlmICh0eXBlb2YgY2hpbGRyZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgd2FybkFib3V0RnVuY3Rpb25DaGlsZCgpO1xuICAgICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3YXJuQWJvdXRFbGVtZW50Q2hpbGQoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIENoaWxkcmVuLm9ubHkoY2hpbGRyZW4pO1xuICAgIH07XG5cbiAgICByZXR1cm4gUHJvdmlkZXI7XG4gIH0pKENvbXBvbmVudCk7XG5cbiAgUHJvdmlkZXIuY2hpbGRDb250ZXh0VHlwZXMgPSB7XG4gICAgc3RvcmU6IHN0b3JlU2hhcGUuaXNSZXF1aXJlZFxuICB9O1xuICBQcm92aWRlci5wcm9wVHlwZXMgPSB7XG4gICAgc3RvcmU6IHN0b3JlU2hhcGUuaXNSZXF1aXJlZCxcbiAgICBjaGlsZHJlbjogKHJlcXVpcmVGdW5jdGlvbkNoaWxkID8gUHJvcFR5cGVzLmZ1bmMgOiBQcm9wVHlwZXMuZWxlbWVudCkuaXNSZXF1aXJlZFxuICB9O1xuXG4gIHJldHVybiBQcm92aWRlcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IGNyZWF0ZVN0b3JlU2hhcGU7XG5cbmZ1bmN0aW9uIGNyZWF0ZVN0b3JlU2hhcGUoUHJvcFR5cGVzKSB7XG4gIHJldHVybiBQcm9wVHlwZXMuc2hhcGUoe1xuICAgIHN1YnNjcmliZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBkaXNwYXRjaDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBnZXRTdGF0ZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzW1wiZGVmYXVsdFwiXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSBpc1BsYWluT2JqZWN0O1xudmFyIGZuVG9TdHJpbmcgPSBmdW5jdGlvbiBmblRvU3RyaW5nKGZuKSB7XG4gIHJldHVybiBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChmbik7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7YW55fSBvYmogVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIGFyZ3VtZW50IGFwcGVhcnMgdG8gYmUgYSBwbGFpbiBvYmplY3QuXG4gKi9cblxuZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvYmopIHtcbiAgaWYgKCFvYmogfHwgdHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICB2YXIgcHJvdG8gPSB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yID09PSAnZnVuY3Rpb24nID8gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikgOiBPYmplY3QucHJvdG90eXBlO1xuXG4gIGlmIChwcm90byA9PT0gbnVsbCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgdmFyIGNvbnN0cnVjdG9yID0gcHJvdG8uY29uc3RydWN0b3I7XG5cbiAgcmV0dXJuIHR5cGVvZiBjb25zdHJ1Y3RvciA9PT0gJ2Z1bmN0aW9uJyAmJiBjb25zdHJ1Y3RvciBpbnN0YW5jZW9mIGNvbnN0cnVjdG9yICYmIGZuVG9TdHJpbmcoY29uc3RydWN0b3IpID09PSBmblRvU3RyaW5nKE9iamVjdCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBzaGFsbG93RXF1YWw7XG5cbmZ1bmN0aW9uIHNoYWxsb3dFcXVhbChvYmpBLCBvYmpCKSB7XG4gIGlmIChvYmpBID09PSBvYmpCKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICB2YXIga2V5c0EgPSBPYmplY3Qua2V5cyhvYmpBKTtcbiAgdmFyIGtleXNCID0gT2JqZWN0LmtleXMob2JqQik7XG5cbiAgaWYgKGtleXNBLmxlbmd0aCAhPT0ga2V5c0IubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gVGVzdCBmb3IgQSdzIGtleXMgZGlmZmVyZW50IGZyb20gQi5cbiAgdmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5c0EubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIWhhc093bi5jYWxsKG9iakIsIGtleXNBW2ldKSB8fCBvYmpBW2tleXNBW2ldXSAhPT0gb2JqQltrZXlzQVtpXV0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzW1wiZGVmYXVsdFwiXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSB3cmFwQWN0aW9uQ3JlYXRvcnM7XG5cbnZhciBfcmVkdXggPSByZXF1aXJlKCdyZWR1eCcpO1xuXG5mdW5jdGlvbiB3cmFwQWN0aW9uQ3JlYXRvcnMoYWN0aW9uQ3JlYXRvcnMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChkaXNwYXRjaCkge1xuICAgIHJldHVybiBfcmVkdXguYmluZEFjdGlvbkNyZWF0b3JzKGFjdGlvbkNyZWF0b3JzLCBkaXNwYXRjaCk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIi8qKlxuICogQ29weXJpZ2h0IDIwMTUsIFlhaG9vISBJbmMuXG4gKiBDb3B5cmlnaHRzIGxpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIExpY2Vuc2UuIFNlZSB0aGUgYWNjb21wYW55aW5nIExJQ0VOU0UgZmlsZSBmb3IgdGVybXMuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIFJFQUNUX1NUQVRJQ1MgPSB7XG4gICAgY2hpbGRDb250ZXh0VHlwZXM6IHRydWUsXG4gICAgY29udGV4dFR5cGVzOiB0cnVlLFxuICAgIGRlZmF1bHRQcm9wczogdHJ1ZSxcbiAgICBkaXNwbGF5TmFtZTogdHJ1ZSxcbiAgICBnZXREZWZhdWx0UHJvcHM6IHRydWUsXG4gICAgbWl4aW5zOiB0cnVlLFxuICAgIHByb3BUeXBlczogdHJ1ZSxcbiAgICB0eXBlOiB0cnVlXG59O1xuXG52YXIgS05PV05fU1RBVElDUyA9IHtcbiAgICBuYW1lOiB0cnVlLFxuICAgIGxlbmd0aDogdHJ1ZSxcbiAgICBwcm90b3R5cGU6IHRydWUsXG4gICAgY2FsbGVyOiB0cnVlLFxuICAgIGFyZ3VtZW50czogdHJ1ZSxcbiAgICBhcml0eTogdHJ1ZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBob2lzdE5vblJlYWN0U3RhdGljcyh0YXJnZXRDb21wb25lbnQsIHNvdXJjZUNvbXBvbmVudCkge1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoc291cmNlQ29tcG9uZW50KTtcbiAgICBmb3IgKHZhciBpPTA7IGk8a2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoIVJFQUNUX1NUQVRJQ1Nba2V5c1tpXV0gJiYgIUtOT1dOX1NUQVRJQ1Nba2V5c1tpXV0pIHtcbiAgICAgICAgICAgIHRhcmdldENvbXBvbmVudFtrZXlzW2ldXSA9IHNvdXJjZUNvbXBvbmVudFtrZXlzW2ldXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXRDb21wb25lbnQ7XG59O1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE1LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFVzZSBpbnZhcmlhbnQoKSB0byBhc3NlcnQgc3RhdGUgd2hpY2ggeW91ciBwcm9ncmFtIGFzc3VtZXMgdG8gYmUgdHJ1ZS5cbiAqXG4gKiBQcm92aWRlIHNwcmludGYtc3R5bGUgZm9ybWF0IChvbmx5ICVzIGlzIHN1cHBvcnRlZCkgYW5kIGFyZ3VtZW50c1xuICogdG8gcHJvdmlkZSBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IGJyb2tlIGFuZCB3aGF0IHlvdSB3ZXJlXG4gKiBleHBlY3RpbmcuXG4gKlxuICogVGhlIGludmFyaWFudCBtZXNzYWdlIHdpbGwgYmUgc3RyaXBwZWQgaW4gcHJvZHVjdGlvbiwgYnV0IHRoZSBpbnZhcmlhbnRcbiAqIHdpbGwgcmVtYWluIHRvIGVuc3VyZSBsb2dpYyBkb2VzIG5vdCBkaWZmZXIgaW4gcHJvZHVjdGlvbi5cbiAqL1xuXG52YXIgaW52YXJpYW50ID0gZnVuY3Rpb24oY29uZGl0aW9uLCBmb3JtYXQsIGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YXJpYW50IHJlcXVpcmVzIGFuIGVycm9yIG1lc3NhZ2UgYXJndW1lbnQnKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNvbmRpdGlvbikge1xuICAgIHZhciBlcnJvcjtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgICAnTWluaWZpZWQgZXhjZXB0aW9uIG9jY3VycmVkOyB1c2UgdGhlIG5vbi1taW5pZmllZCBkZXYgZW52aXJvbm1lbnQgJyArXG4gICAgICAgICdmb3IgdGhlIGZ1bGwgZXJyb3IgbWVzc2FnZSBhbmQgYWRkaXRpb25hbCBoZWxwZnVsIHdhcm5pbmdzLidcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhcmdzID0gW2EsIGIsIGMsIGQsIGUsIGZdO1xuICAgICAgdmFyIGFyZ0luZGV4ID0gMDtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgICBmb3JtYXQucmVwbGFjZSgvJXMvZywgZnVuY3Rpb24oKSB7IHJldHVybiBhcmdzW2FyZ0luZGV4KytdOyB9KVxuICAgICAgKTtcbiAgICAgIGVycm9yLm5hbWUgPSAnSW52YXJpYW50IFZpb2xhdGlvbic7XG4gICAgfVxuXG4gICAgZXJyb3IuZnJhbWVzVG9Qb3AgPSAxOyAvLyB3ZSBkb24ndCBjYXJlIGFib3V0IGludmFyaWFudCdzIG93biBmcmFtZVxuICAgIHRocm93IGVycm9yO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGludmFyaWFudDtcbiJdfQ==
