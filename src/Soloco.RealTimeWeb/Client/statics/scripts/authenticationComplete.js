(function () {

    function getFragment() {
        if (window.location.search.indexOf('?') === 0) {
            return parseQueryString(window.location.search.substr(1));
        } else {
            return {};
        }
    };

    function parseQueryString(queryString) {
        var data = {};

        if (!queryString) {
            return data;
        }

        var pairs = queryString.split('&');

        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            var separatorIndex = pair.indexOf('=');
            var escapedKey, escapedValue;

            if (separatorIndex === -1) {
                escapedKey = pair;
                escapedValue = null;
            } else {
                escapedKey = pair.substr(0, separatorIndex);
                escapedValue = pair.substr(separatorIndex + 1);
            }

            var key = decodeURIComponent(escapedKey);
            var value = decodeURIComponent(escapedValue);

            data[key] = value;
        }

        return data;
    }

    const fragment = getFragment();
    window.opener.authenticationScope.complete(fragment);
    window.close();
})();
