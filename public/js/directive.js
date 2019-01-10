angular.module("MyApp").factory("sharedService", function() {
    var shared = {};
    shared.hightlight = {};
    shared.hightlight.search = "";
    shared.hightlight.favorite = "";


    shared.sethightlight_search = function(event_id) {
        shared.hightlight.search = event_id;
    };
    shared.sethightlight_favorite = function(event_id) {
        shared.hightlight.favorite = event_id;
    };



    return shared;
});
angular.module("MyApp").directive("hightligh", function(sharedService) {
    return {
        restrict: "A",
        controller: function($scope, $element) {

            sleep(300).then(() => {

                if (sharedService.hightlight.search.toString() != ""){
                    var div = angular.element(document.querySelector(sharedService.hightlight.search));
                    div.addClass('bg-hightlight');
                } 
                if (sharedService.hightlight.favorite != "") {
                    var div = angular.element(document.querySelector(sharedService.hightlight.favorite));
                    div.addClass('bg-hightlight');
                }

            });

            function sleep (time) {
                return new Promise((resolve) => setTimeout(resolve, time));
            }
            
        }
    };
});