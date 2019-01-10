Autocomplete_control = "";

(function () {
    'use strict';
    angular
        .module('MyApp', ['ngMaterial', 'ngMessages', 'material.svgAssetsCache', 'angular-svg-round-progressbar', 'ngAnimate'])
        .controller('DemoCtrl', DemoCtrl);


    function DemoCtrl ($timeout, $q, $log, $http) {
        var self = this;
        Autocomplete_control = this;

        self.simulateQuery = false;
        self.isDisabled    = false;

        // list of `state` value/display objects
        self.searchTextChange   = searchTextChange;
        self.selectedItemChange = selectedItemChange;
        self.states = "";
        self.querySearch = querySearch;

        function querySearch (keyword) {
            if (keyword == undefined) {
                var rObj = [];
                return rObj;
            }
            var deferred = $q.defer();
            setTimeout(function() {
                $http.get('/autocomplete', {params: {keyword: keyword}}).
                    then(function(response) {
                        // console.log("autocomplete success " + typeof response.data);
                        var data = response.data;
                        self.states = data.map(key => {
                            var rObj = {};
                            rObj['value'] = key.toLowerCase();
                            rObj['display'] = key;
                            return rObj;
                        });
                        deferred.resolve(self.states);
                    }).catch(function(response) {
                        // console.error("autocomplete error");
                    });
            }, 1000);
            // console.log(self.states);
            return deferred.promise;
        }

        function searchTextChange(keyword) {
            $log.info('Text changed to ' + keyword);
        }

        function selectedItemChange(item) {
            $log.info('Item changed to ' + JSON.stringify(item));
        }
    }
})();