$('#event_detail_tab a').on('click', function (e) {
    e.preventDefault()
    $(this).tab('show')
})
angular.module('MyApp').controller('InputController', ['$scope', '$http', 'sharedService', '$timeout', function($scope, $http, sharedService, $timeout) {
    // reset all angularjs data
    $scope.detail_result_searchpage = "";
    $scope.detail_result_favoritepage = "";
    $scope.view = "";
    $scope.error = "";
    $scope.animate_rightslide_search = false;
    $scope.animate_rightslide_favorite = false;
    $scope.animate_show_moreless = false;

    // page management
    $scope.page = {};
    $scope.page.search = false;
    $scope.page.detail = false;
    $scope.page.favorite = false;

    $scope.btn_result_click = function () {
        var button = angular.element(document.querySelector('#btn_result'));
        button.removeClass('btn-link');
        button.addClass('btn-primary');
        var button = angular.element(document.querySelector('#btn_favorite'));
        button.removeClass('btn-primary');
        button.addClass('btn-link');
        active_page_search();
    }
    $scope.btn_favorite_click = function () {
        var button = angular.element(document.querySelector('#btn_result'));
        button.removeClass('btn-primary');
        button.addClass('btn-link');
        var button = angular.element(document.querySelector('#btn_favorite'));
        button.removeClass('btn-link');
        button.addClass('btn-primary');
        active_page_favorite();
    }

    $scope.btn_detail_click = function () {
        // check whether click from search or favorite page
        if ($scope.page.search == true) {
            $scope.detail_result = JSON.parse(JSON.stringify($scope.detail_result_searchpage));
        }
        if ($scope.page.favorite == true) {
            $scope.detail_result = JSON.parse(JSON.stringify($scope.detail_result_favoritepage));
        }
        active_page_detail();
    }

    $scope.btn_list_click = function (event_id) {
        if ($scope.detail_result.from_page == 'search') {
            active_page_search();
            $scope.animate_rightslide_search = true; 
        }
        if ($scope.detail_result.from_page == 'favorite') {
            active_page_favorite();
            $scope.animate_rightslide_favorite = true;
        }
    }

    function active_page_search() {
        $scope.animate_rightslide_search = false; 
        $scope.page.search = true;
        $scope.page.detail = false;
        $scope.page.favorite = false;
        $scope.view = "search";
    }

    function active_page_detail() {
        $scope.page.search = false;
        $scope.page.detail = true;
        $scope.page.favorite = false;
        $scope.animate_rightslide = true;
        $scope.view = "detail";
    }

    function active_page_favorite() {
        // $scope.animate_leftslide = true;
        $scope.page.search = false;
        $scope.page.detail = false;
        $scope.page.favorite = true;
        $scope.view = "favorite";
        $scope.animate_rightslide_favorite = false;
    }

    // input form
    $scope.category = [
        {value: '', name: 'All'},
        {value: 'KZFzniwnSyZfZ7v7nJ', name: 'Music'},
        {value: 'KZFzniwnSyZfZ7v7nE', name: 'Sports'},
        {value: 'KZFzniwnSyZfZ7v7na', name: 'Arts & Theatre'},
        {value: 'KZFzniwnSyZfZ7v7nn', name: 'Film'},
        {value: 'KZFzniwnSyZfZ7v7n1', name: 'Miscellaneous'},
    ];
    $scope.unit = [
        {value: 'miles', name: 'Miles'},
        {value: 'kilometers', name: 'Kilometers'}
    ];
    $scope.form = {};
    $scope.form.category = $scope.category[0];
    $scope.form.dis_unit = $scope.unit[0];
    $scope.form.distance = "";
    $scope.form.where = 'loc_curr';
    location();
    function location () {
        $http.get('http://ip-api.com/json',).
            then(function(response) {
                $scope.form.lat = response.data.lat;
                $scope.form.lon = response.data.lon;
                console.log("ip:", response.data);
            }).catch(function(response) {
                console.error("ip-api error ", response);
            });
    };
    $scope.location_other = function () {
        if ($scope.form.where == 'loc_current') {
            $scope.form.location = "";
        }
        console.log($scope.form);
    };

    $scope.submit = function(form) {
        $scope.form.keyword = $scope.myform.form_keyword.$viewValue;
        var real_distance = $scope.form.distance;
        if ($scope.form.distance == "") {
            real_distance = 10;
        }
        // reset all result value
        $scope.search_result = "";
        $scope.detail_result = "";
        $scope.team_result = "";
        $scope.venue_result = "";
        $scope.upcoming_result = "";
        $scope.btn_result_click();
        console.log("form", $scope.form);
        console.log("$scope", $scope);
        $("#spinner").show();
        $http.get('/searchResult', {
            params: {
                form_keyword: form.keyword,
                form_category: form.category.value,
                form_distance: real_distance,
                form_dis_unit: form.dis_unit.value,
                form_where: form.where,
                form_location: form.location,
                form_lat: form.lat,
                form_lon: form.lon
            }}).
            then(function(response) {
                $("#spinner").hide();
                response.data.sort(sortByDate);
                function sortByDate(a, b) {
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                }
                $scope.search_result = response.data;
                if ($scope.search_result == undefined || $scope.search_result.length == 0) {
                    $scope.view = "none";
                    return;
                }
                active_page_search();
                console.log("search_result:", response.data);
            }).catch(function(response) {
                console.error('searchResult error ', response);
                $("#spinner").hide();
                $scope.view = "error_search";
            });
    };
    $scope.reset = function(form) {
        $scope.form.category = $scope.category[0];
        $scope.form.distance = '';
        $scope.form.dis_unit = $scope.unit[0];
        $scope.form.where = 'loc_curr';
        $scope.form.location = '';
        Autocomplete_control.searchText = "";
        form.$setPristine();
        form.$setUntouched();

        $scope.detail_result_searchpage = "";
        $scope.detail_result_favoritepage = "";
        $scope.btn_result_click();
        $scope.view = "";
        $scope.error = "";
        sharedService.sethightlight_search("");
        sharedService.sethightlight_favorite("");
        $("#spinner").hide();
        $("#spinner1").hide();
    }


    // local storage
    // localStorage.removeItem("favorite");
    // localStorage.removeItem("favorite_id");
    $scope.local_fav = JSON.parse(localStorage.getItem("favorite"));
    $scope.local_fav_id = JSON.parse(localStorage.getItem("favorite_id"));
    if ($scope.local_fav == undefined || $scope.local_fav == null) {
        $scope.local_fav = [];
    }
    if ($scope.local_fav_id == undefined || $scope.local_fav_id == null) {
        $scope.local_fav_id = [];
    }
    console.log("$scope.local_fav", $scope.local_fav);

    $scope.addfavorite = function (data) {
        $scope.local_fav = JSON.parse(localStorage.getItem("favorite"));
        $scope.local_fav_id = JSON.parse(localStorage.getItem("favorite_id"));
        if ($scope.local_fav == undefined || $scope.local_fav == null) {
            $scope.local_fav = [];
        }
        if ($scope.local_fav_id == undefined || $scope.local_fav_id == null) {
            $scope.local_fav_id = [];
        }
        console.log("add: $scope.local_fav", $scope.local_fav);
        for (var i = 0; i < $scope.local_fav.length; i++) {
            if (data.id == $scope.local_fav[i].id) {
                return;
            }
        }
        $scope.local_fav.push(data);
        $scope.local_fav_id.push(data.id);
        localStorage.setItem("favorite", JSON.stringify($scope.local_fav));
        localStorage.setItem("favorite_id", JSON.stringify($scope.local_fav_id));
        console.log("local_fav", $scope.local_fav);
        console.log("local_fav_id", $scope.local_fav_id);
    }

    $scope.removefavorite = function (data) {
        $scope.local_fav = JSON.parse(localStorage.getItem("favorite"));
        $scope.local_fav_id = JSON.parse(localStorage.getItem("favorite_id"));
        for (var i = 0; i < $scope.local_fav.length; i++) {
            if (data.id == $scope.local_fav[i].id) {
                $scope.local_fav.splice(i, 1);
                $scope.local_fav_id.splice(i, 1);
                break;
            }
        }
        localStorage.setItem("favorite", JSON.stringify($scope.local_fav));
        localStorage.setItem("favorite_id", JSON.stringify($scope.local_fav_id));
        console.log("local_fav", $scope.local_fav);
        console.log("local_fav_id", $scope.local_fav_id);
    }



    // event detail -> event tab (main)
    $scope.clickEvent = function(data, from_page) {
        $scope.detail_result = {};
        $http.get('/detailResult', {
            params: {
                event_id: data.id
            }}).
            then(function(response) {
                active_page_detail();
                $("#spinner1").show();
                $scope.detail_result.name = response.data.name;
                $timeout(function() {
                    $("#spinner1").hide();
                    $timeout(function() {
                    $scope.detail_result = response.data;
                    $scope.detail_result.search_res = data;
                    $scope.detail_result.id = data.id;
                    $scope.detail_result.tweet = encodeURI("Check out " + response.data.name + " located at" + response.data.event.venue.value 
                        + ". Website: " + response.data.event.url.value) + "%20%23CSCI571EventSearch";
                    event_team();
                    event_venue();
                    event_upcoming();
                    if (from_page == 'search') {
                        $scope.detail_result.from_page = from_page;
                        $scope.detail_result_searchpage = JSON.parse(JSON.stringify($scope.detail_result));
                        sharedService.sethightlight_search('#event_'+data.id);
                    } else {
                        $scope.detail_result.from_page = from_page;
                        $scope.detail_result_favoritepage = JSON.parse(JSON.stringify($scope.detail_result));
                        sharedService.sethightlight_favorite('#event_favorite'+data.id);
                    }
                    console.log("shared.hightlight(controller)", sharedService.hightlight.search, sharedService.hightlight.favorite);
                    console.log("detail_result:", response.data);
                    }, 100);
                }, 1000);
            }).catch(function(response) {
                console.error('detail_result error ', response);
                $("#spinner1").hide();
                $scope.view = "error_detail";
            });
            active_page_detail();
    }

    // event detail -> team tab
    function event_team() {
        $scope.team_result = {};
        // google photo
        for (var i = 0; i < $scope.detail_result.team.length; i++) {
            $scope.team_result[i] = {};
            $scope.team_result[i].name = $scope.detail_result.team[i];
            if (i == 0) {
                $scope.team_result[0].empty = true;
            }
            $http.get('/teamResult_google', {
                params: {
                    team: $scope.detail_result.team[i],
                    index: i
                }}).
                then(function(response) {
                    console.log("google index", response.data);
                    $scope.team_result[response.data.index].google = response.data;
                    if (response.data != undefined && response.data.length != 0) {
                        $scope.team_result[0].empty = false;
                    }
                    console.log("teamResult_google", response.data);
                }).catch(function(response) {
                    console.error('teamResult_google error ', response);
                });
        }
        // spotify
        if ($scope.detail_result.category == "Music") {
            for (var i = 0; i < $scope.detail_result.team.length; i++) {
                $http.get('/teamResult_spotify', {
                    params: {
                        team: $scope.detail_result.team[i],
                        index: i
                    }}).
                    then(function(response) {
                        $scope.team_result[response.data.index].spotify = response.data;
                        if (response.data != undefined && response.data.name != undefined) {
                            $scope.team_result[0].empty = false;
                        }
                        console.log("teamResult_spotify", response.data);
                    }).catch(function(response) {
                        console.error('teamResult_spotify error ', response);
                    });
            }
        }
    }

    // event detail -> venue tab
    function event_venue() {
        $http.get('/venueResult', {
            params: {
                venue: $scope.detail_result.event.venue.value
            }}).
            then(function(response) {
                $scope.venue_result = response.data;
                var loc = {lat: parseFloat($scope.venue_result.lat), lng: parseFloat($scope.venue_result.lon)};
                map = new google.maps.Map(
                document.getElementById('map'), {zoom: 14, center: loc});
                marker = new google.maps.Marker({position: loc, map: map});
                console.log("venue_result:", response.data);
            }).catch(function(response) {
                console.error('venue_result error ', response);
            });
    }

    // event detail -> upcoming event tab 
    function event_upcoming() {
        $http.get('/upcomingResult', {
            params: {
                venue: $scope.detail_result.event.venue.value
            }}).
            then(function(response) {
                $scope.upcoming_result = response.data;
                $scope.upcoming_result_default = JSON.parse(JSON.stringify(response.data));
                console.log("upcoming_result:", response.data);
            }).catch(function(response) {
                console.error('upcoming_result error ', response);
            });
    }

    $scope.btn = {};
    $scope.upcoming_category = [
        {value: 'default', name: 'Default'},
        {value: 'name', name: 'Event Name'},
        {value: 'date', name: 'Time'},
        {value: 'artist', name: 'Artist'},
        {value: 'type', name: 'Type'},
    ];
    $scope.upcoming_order = [
        {value: 'asc', name: 'Ascending'},
        {value: 'des', name: 'Descending'},
    ];
    $scope.btn.btn_upcoming_category = $scope.upcoming_category[0];
    $scope.btn.btn_upcoming_order = $scope.upcoming_order[0];

    $scope.upcoming_limit = 5;

    $scope.upcoming_limit_more = function () {
        $scope.animate_show_moreless = true;
        $timeout(function () {
            $scope.upcoming_limit = $scope.upcoming_result.length;
        }, 300);
    }
    $scope.upcoming_limit_less = function () {
        $scope.animate_show_moreless = true;
        $timeout(function () {
            $scope.upcoming_limit = 5;
        }, 300);
    }

    $scope.btn_upcoming_sort_change = function () {
        $scope.animate_show_moreless = false;
        $timeout(function () {
            if ($scope.btn.btn_upcoming_category.value == 'default') {
                $scope.upcoming_result = JSON.parse(JSON.stringify($scope.upcoming_result_default));
            } else if ($scope.btn.btn_upcoming_category.value == 'name') {
                if ($scope.btn.btn_upcoming_order.value == 'asc') {
                    $scope.upcoming_result.sort(sortByNameAsc);
                } else {
                    $scope.upcoming_result.sort(sortByNameDes);
                }
            } else if ($scope.btn.btn_upcoming_category.value == 'date') {
                if ($scope.btn.btn_upcoming_order.value == 'asc') {
                    $scope.upcoming_result.sort(sortByDateAsc);
                } else {
                    $scope.upcoming_result.sort(sortByDateDes);
                }
            } else if ($scope.btn.btn_upcoming_category.value == 'artist') {
                if ($scope.btn.btn_upcoming_order.value == 'asc') {
                    $scope.upcoming_result.sort(sortByArtistAsc);
                } else {
                    $scope.upcoming_result.sort(sortByArtistDes);
                }
            } else if ($scope.btn.btn_upcoming_category.value == 'type') {
                if ($scope.btn.btn_upcoming_order.value == 'asc') {
                    $scope.upcoming_result.sort(sortByTypeAsc);
                } else {
                    $scope.upcoming_result.sort(sortByTypeDes);
                }
            }
        }, 300);
        console.log("change", $scope.btn.btn_upcoming_category, $scope.btn.btn_upcoming_order.value);
        function sortByNameAsc(a, b) {
            return ('' + a.name).localeCompare(b.name);
        }
        function sortByDateAsc(a, b) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        function sortByArtistAsc(a, b) {
            return ('' + a.artist).localeCompare(b.artist);
        }
        function sortByTypeAsc(a, b) {
            return ('' + a.type).localeCompare(b.type);
        }
        function sortByNameDes(a, b) {
            return ('' + b.name).localeCompare(a.name);
        }
        function sortByDateDes(a, b) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        function sortByArtistDes(a, b) {
            return ('' + b.artist).localeCompare(a.artist);
        }
        function sortByTypeDes(a, b) {
            return ('' + b.type).localeCompare(a.type);
        }
        console.log("upcoming_result", $scope.upcoming_result);
        console.log("upcoming_result_default", $scope.upcoming_result_default);

    }
    
}]);