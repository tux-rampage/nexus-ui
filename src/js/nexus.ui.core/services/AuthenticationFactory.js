/**
 * Copyright (c) 2016 Axel Helmert
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author    Axel Helmert
 * @copyright Copyright (c) 2016 Axel Helmert
 * @license   http://www.gnu.org/licenses/gpl-3.0.txt GNU General Public License
 */

'use strict';

var JwtDecode = require('jwt-decode');

function Authentication(OAuth, OAuthToken)
{
    var _self = this;

    this.$resolved = false;
    this.$promise = null;

    function debug()
    {
        var accessToken = OAuthToken.getAccessToken();

        if (!accessToken) {
            return true;
        }

        var token = JwtDecode(accessToken);

        console.debug({exp: token.exp});
        return false;
    }

    this.isAuthenticated = function()
    {
        return OAuth.isAuthenticated();
    };

    this.clear = function()
    {
        this.$resolved = false;
        this.$promise = OAuth.revokeToken();

        this.$promise['finally'](function() {
            _self.$resolved = true;
        });

        return this.$promise;
    },

    /**
     * Authenticate by the given credentials
     */
    this.authenticate = function(credentials)
    {
        this.$promise = OAuth.getAccessToken(credentials);
        this.$promise['finally'](function() {
            _self.$resolved = true;
        });

        return this;
    };
};

Authentication.Factory = function(OAuth, OAuthToken) {
    return new Authentication(OAuth, OAuthToken);
};

Authentication.Factory.$inject = ['OAuth', 'OAuthToken'];
module.exports = Authentication.Factory;