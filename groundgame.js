

// Ground Game 
//	- (c) 2018 - Rob Korobkin, rob.korobkin@gmail.com




// Expected from UI Loader: legislatorsRaw [<Legislator>, ...]
// Geo Data comes from APIs



// APP STATE
gg = {

	"active_body" : "House",

	"selected_list" : false,

	"display_candidates" : false,

	"selected_district" : false,
	
	"selected" : {
		"dnum" : 0,
		"district" : false,		// <District>
		"here" : false 			// { simple : { "lat" : 0, "lng" : 0}, google : <Google Point>, marker : <Google Marker> }
	},

	"loaded" : {
		"House" : false,
		"Senate" : false
	},

	featured_map : false 		// <Google Map>
}


// FINISH BUILDING OUT DISTRICT OBJECTS
for(var body in districtDictionary){
	for(var dnum in districtDictionary[body]){
		districtDictionary[body][dnum].geo = {
			polygonsRaw : [], 
			polygonsGoogle : []
		}
	}
}




function initMap() {

	gg.featured_map = new google.maps.Map(document.getElementById('map'), {
		zoom: 7,
		center: {lat: 45.57232036821944, lng: -69.01743741963369},
		mapTypeId: 'terrain'
	});
	$('#contentFrame').show(500);
	toggleBody('House');

}


function toggleBody(body){

	// remove old polygons
	var districts = districtDictionary[gg.active_body];
	$.each(districts, function(dnum, d){
		$.each(d.geo.polygonsGoogle, function(i, g){
			g.setMap(null);
		});
	});


	// update app state
	gg.active_body = body;


	// update ui
	$('#body_toggle button').removeClass('btn-primary').addClass('btn-default');
	$('.' + body + '_toggle').addClass('btn-primary');
	
	
	// if you already have the geo data, re-activate the polygons
	if(gg.loaded[gg.active_body] != false){
		var districts = districtDictionary[gg.active_body];
		$.each(districts, function(dnum, d){
			$.each(d.geo.polygonsGoogle, function(i, g){
				g.setMap(gg.featured_map);
			});
		});

		// IF POINT SELECTED, LOAD DISTRICT
		if(gg.selected.here){
			dnum = findDistrict(gg.selected.here.google);
			loadDistrict(dnum);
		}
		else toggleUI('list');
		
	}


	// fetch data from api and load
	else {
		$.getJSON('data/turfs/' + body.toLowerCase() + '_districts.js', function(response){
			gg.loaded[gg.active_body] = true;
			loadDistrictGeography(response);

			// IF POINT SELECTED, LOAD DISTRICT
			if(gg.selected.here){
				dnum = findDistrict(gg.selected.here.google);
				loadDistrict(dnum);
			}
			else toggleUI('search');

		});		
	}
}


// TAKES API RESPONSE AND WRITES IT TO DISTRICT DICTIONARY
function loadDistrictGeography(districts_raw){


	// parse raw data
	for(var districtNumber in districts_raw){
		
		var polygons = districts_raw[districtNumber];

		var d = districtDictionary[gg.active_body][districtNumber]

		for(var i = 0; i < polygons.length; i++){
			pointsRaw = polygons[i].split(',0 ');
			var points = [];
			for(var i = 0; i < pointsRaw.length; i++){
				var p = pointsRaw[i].split(',');
				var point = {
					lat: parseFloat(p[1]),
					lng: parseFloat(p[0])
				}
				points.push(point);
			}

			d.geo.polygonsRaw.push(points);
		}

	}


	// build google polygons
	$.each(districtDictionary[gg.active_body], function(dnum, district){

		var leg = district.legislator;
		if(leg.party == 'REPUBLICAN') {
			c = (leg.flipped != "true") ? '#ff0000' : '#ff69b4';
		}
		else if(leg.party == 'DEMOCRATIC') {
			c = (leg.flipped != "true") ? '#0000ff' : '#1fdee3';	
		} 
		else c = "#888888";


		$.each(district.geo.polygonsRaw, function(polygonIndex, polygon){

			var districtPolygon = new google.maps.Polygon({
				paths: polygon,
				strokeColor: c,
				strokeOpacity: 0.8,
				strokeWeight: 1,
				fillColor: c,
				fillOpacity: 0.35
			});

			districtPolygon.districtNumber = dnum;

			district.geo.polygonsGoogle.push(districtPolygon);

			districtPolygon.setMap(gg.featured_map);

			districtPolygon.addListener('click', clickRegion);

		});

	});


	toggleUI('list')
}







// This example creates a simple polygon representing the Bermuda Triangle.

function clickRegion(){

	if(gg.selected.here){
		gg.selected.here.marker.setMap(null);
		gg.selected.here = false;	
	} 

	loadDistrict(this.districtNumber);

}

function loadDistrict(dnum){

	// update toggle
	$('.ui_toggle button').removeClass('btn-primary').addClass('btn-default');
	$('.ui_toggle .feature').addClass('btn-primary');


	if(!dnum){
		$('#output').html(
			'<p style="margin-top: 40px;">Nothing to see here yet... Click a region on the map or <a onclick="toggleUI(\'search\')">put in your address</a>.');
		return;
	}


	// ToDo: de-select district before loading the new one.

	if(gg.selected.district){

		var c;
		var leg = gg.selected.district.legislator;

		if(leg.party == 'REPUBLICAN') {
			c = (leg.flipped != 'true') ? '#ff0000' : '#ff69b4';
		}
		else if(leg.party == 'DEMOCRATIC') {
			c = (leg.flipped != 'true') ? '#0000ff' : '#1fdee3';	
		} 
		else c = "#888888";

		$.each(gg.selected.district.geo.polygonsGoogle, function(i, polygon){
			polygon.setOptions({strokeWeight: 1, fillColor: c});
		});
	}

	var district = districtDictionary[gg.active_body][dnum];

	gg.selected.dnum = dnum;
	gg.selected.district = district;

	
	var legislator = district.legislator;


	// GET TOWN LINE - ADD EXPANDER WITH ELIPSES IF NEEDED
	var town_line = district.towns; //(gg.active_body == 'Senate') ? legislator.legal_residence : legislator.towns;
	if(town_line.length > 120) {
		var str1 = town_line.substr(0, 120);
		var str2 = town_line.substr(120);
		town_line = str1 + '<a style="color: #337ab7; cursor:pointer; font-weight: bold" id="elipses" ' + 
					'onclick="$(\'#extra_towns\').show(); $(\'#elipses\').hide(); ">...</a>' + 
					'<span id="extra_towns" style="display: none">' + str2 + '</span>';
	}


	// UPDATE HTML
	var html =	'<div class="feature_frame">' +
					'<div class="districtTitle">District ' + dnum + '</div>' +
					'<div class="districtTowns">' + town_line + '</div>' +

					// LIST LEGISLATORS
					_listLegislatorOnFeature(district.legislator, dnum);

					district.this_year.forEach(function(c){
						html += _listLegislatorOnFeature(c);
					})

					if(district.former_legislator){
						html += _listLegislatorOnFeature(district.former_legislator);	
					}

	html += 	'</div>'; 

	$('#output').html(html);


	// Highlight District
	$.each(district.geo.polygonsGoogle, function(i, polygon){
		polygon.setOptions({strokeWeight: 2.0, fillColor: 'green'});
	});


	// Calculate Bounds
	var bounds = new google.maps.LatLngBounds(); 
	$.each(district.geo.polygonsRaw, function(i, polygon){
		$.each(polygon, function(j, point){
	    	bounds.extend(point);
	    });
	});

	// Center and Position Map
	gg.featured_map.panTo(bounds.getCenter());
	gg.featured_map.fitBounds(bounds, 0);

}


function _listLegislatorOnFeature(legislator, dnum){
	var title = legislator.title;


	var money_line = ("TotalContributions" in legislator) ? _getMoneyLine(legislator) : '';


	// IMAGE
	if("img2" in legislator){
		var img_url = legislator.img2;
	}
	else if("photo_url" in legislator){
		var img_url = 'assets/legislator-photos/' + legislator.photo_url;
	}
	else if(legislator.title == "NEWLY ELECTED" || legislator.title == "NEWLY RE-ELECTED"){
		var img_url = 'assets/legislator-photos/new.png';
	}
	else var img_url = '';

	if(img_url != '') img_url = '<div class="mug_shot" style="background-image: url(\'' + img_url + '\');"></div>';
 

	// GET SCORES

	if ('mpaScore' in legislator){



		var score_link = (gg.active_body == 'Senate') ? 'sldu-' + dnum : 'sldl-' + dnum;

		var score_lines = 'MPA: <a class="mpa_link" href="http://mpascorecard.org/legislators/' + score_link + '" target="_blank">' + 
								legislator.mpaScore + 
							'%</a><br />' +
							'Maine AFL-CIO: <a class="mpa_link" href=" http://maineaflcio.openscorecard.org/legislators/' + score_link + 
												'" target="_blank">' + 
								legislator.aflscore +
							'%</a>' +
							'<br /><a href="' + legislator.url + '" target="_blank">More Info</a>';

	}
	else score_lines = '';


	
	var html = 	'<div class="leg_card clearfix">' +
					'<div class="party_header ' + legislator.party[0] + '">' + legislator.title + '</div>' + 
					img_url +
					'<div class="contact_details">' + 
						'<div class="name">' + legislator.firstName + ' ' + legislator.lastName + '</div>' +
						//legislator.phone + 
						// '<br />' + legislator.email + 
						// '<br />' + legislator.address + 
						money_line +
						score_lines +
					'</div>' +
				'</div>';
            

	return html;
}



function _getMoneyLine(candidate){

	var code = (candidate.FinanceType == "Maine Clean Election Act Financed") ? 'C' : 'T';

	if(!candidate.TotalContributions) candidate.TotalContributions = 0;
	if(!candidate.TotalExpenditures) candidate.TotalExpenditures = 0;



	var committee_name = candidate.lastName + ', ' + candidate.firstName + ' - (2018)';
	
	var committee_slug = encodeURIComponent(committee_name);
	
	var table_page = 'table.php?'



	return '<div class="money">' + 
				code + ': ' +
				'<a class="contributions" target="_blank" href="table.php?c=' + committee_slug + '">' + 
					candidate.TotalContributions.formatMoney() + 
				'</a>' +
				' <span class="divider">-</span> ' +
				'<a class="expenditures" target="_blank" href="table.php?e=' + committee_slug + '">' + 
					candidate.TotalExpenditures.formatMoney() + 
				'</a>' +
			'</div>';
}

function toggleUI(ui_name){

	// update toggle
	$('.ui_toggle button').removeClass('btn-primary').addClass('btn-default');
	$('.ui_toggle .' + ui_name).addClass('btn-primary');


	switch(ui_name){

		case "search" :
			showSearch();
		break;

		case "list" :
			showList();
		break;

		case "feature" :

			if(!gg.selected_district){
				loadDistrict(false);
				return;
			}

			loadDistrict(gg.selected.district);
		break;

	}

}

function showSearch(){

	// ToDo: Restore search string value.

	var html =
		'<div class="search_frame">' +
			'<div class="header">Welcome to GroundGamer.org!</div>' +
			'<div class="subhead">There are three ways to start.</div>' +
			
			'<label class="title">1. Put in your address!</label>' +
			'<input class="form-control" id="address_input" onkeyup="checkForEnter(event)">' + 
			'<a onclick="lookupAddress()" class="button">Search</a>' +
			
			'<div class="title" style="font-weight: normal">' +
				'<b>2. Click a district</b> on the map to find out more about who represents that district in the Maine legislature.</div>' +

			'<div class="title">3. Search / Browse <a onclick="toggleUI(\'list\')">the list</a> of legislators:</div>' +
			'<a class="trigger" onclick="showWhosNew()">Want to know who\'s new?</a>' +
			'<a class="trigger" onclick="showWhatFlipped()">Want to see what flipped?</a>' +

			'<a class="title" style="margin-top: 20px; display: block; text-align: right; font-weight: normal" target="_blank"' + 
				'href="https://github.com/OpenMaine/GroundGamer_maine">More Info?</a>'

		'</div>';

	$('#output').html(html);

	// ToDo: Re-Attach Material Design events.

}

function checkForEnter(e){
	if($.Event(e).which == 13) {
        lookupAddress();
    }
}

function showWhosNew(){
	toggleUI('list');
	$('#list_selector').val('whos_new');
	toggleSelectedList();
}


function showWhatFlipped(){
	toggleUI('list');
	$('#list_selector').val('what_flipped');
	toggleSelectedList();
}



function toggleDisplayCandidates(){
	gg.display_candidates = $('#show_candidates_toggle')[0].checked;
	showList();
}

function showList(){
	var html = '<div id="address_frame">' +
					'<input class="form-control" id="search_input" onkeyup="filterList()" placeholder="Search...">' +
				'</div>' +
				'<div id="list_candidate_toggle">' +
					'<input type="checkbox" id="show_candidates_toggle" onchange="toggleDisplayCandidates()" /> ' +
					'<label for="show_candidates_toggle">&nbsp;&nbsp;Show Candidates?</div>' +
				'</div>' +
				'<div id="list_selector_frame">' +
					'<select id="list_selector" onchange="toggleSelectedList()">' +
						'<option value="">Select a list...</option>' +
						'<option value="what_flipped">What flipped?</option>' +
						'<option value="whos_new">Who\'s new?</option>' +
						'<option value="was_open_d">Open Dem seats?</option>' +
						'<option value="was_open_r">Open GOP seats?</option>' +
						'<option value="just_dems">Just the Dems</option>' +
						'<option value="just_gop">Just the GOP</option>' +
					'</select>' +
				'</div>' +
				'<div class="leg_card_frame">';

	if(!gg.display_candidates){

		$.each(districtDictionary[gg.active_body], function(dnum, district){
			var l = district.legislator;

			var geo_str = (gg.active_body == 'House') ? district.towns : district.legal_residence;

			var photo_url = (l.photo_url == undefined) ? 'new.png' : l.photo_url;

			var leg_card = '<div class="leg_card clearfix" id="leg_' + dnum +'" onclick="loadDistrict(' + dnum + ')">' +
								'<div class="mug_shot" style="background-image: url(\'assets/legislator-photos/' + photo_url + '\');"></div>' +
								'<div class="name">' + l.firstName + ' ' + l.lastName + '</div>' +
								'<div class="district">District ' + dnum + ' - ' + geo_str + '</div>' +

							'</div>';

			html += leg_card;
		});
	}

	else {

		$.each(districtDictionary[gg.active_body], function(dnum, district){
			var l = district.legislator;

			var geo_str = (gg.active_body == 'House') ? district.towns : district.county;

			html += '<div class="candidate_district" onclick="loadDistrict(' + dnum + ')" id="leg_' + dnum + '">' +

						'<div class="districtDivider">' +
							'<div class="dNum">DISTRICT ' + dnum + '</div>' +
							'<div class="geography">- ' + geo_str + '</div>' +
						'</div>';

			
			var party = l.party.split('')[0];
			html += '<div class="candidate">' + l.firstName + ' ' + l.lastName + ' (' + party + ') *</div>';

			district.this_year.forEach(function(candidate){
				var party = candidate.party.split('')[0];
				html += '<div class="candidate">' + candidate.firstName + ' ' + candidate.lastName + ' (' + party + ')</div>';
			});

			if(district.former_legislator){
				var f = district.former_legislator;
				var party = f.party.split('')[0];
				html += '<div class="candidate former">' + f.firstName + ' ' + f.lastName + ' (' + party + ')</div>';
			};


			html += '</div>';

		});
	}

	html += '</div>';

	$('#output').html(html);

	if(gg.display_candidates) {
		$('#show_candidates_toggle').prop('checked', true);
	}

	if(gg.selected_list) $('#list_selector').val(gg.selected_list)
}

function toggleSelectedList(){
	var selected_list = $('#list_selector').val();
	if(selected_list == '') selected_list = false;
	gg.selected_list = selected_list;
	filterList();
}

function filterList(){
	var search_term = $('#search_input').val();

	var to_show = {};

	$.each(districtDictionary[gg.active_body], function(dnum, district){
		var l = district.legislator;
		

		// START BY HIDING EVERYTHING
		to_show[dnum] = false;


		// THEN SHOW JUST THE THINGS THAT PASS THE SEARCH BAR FILTER
		if(search_term == '') to_show[dnum] = false;

		if(l.lastName.toUpperCase().indexOf(search_term.toUpperCase()) == 0) to_show[dnum] = true;
		if(l.firstName.toUpperCase().indexOf(search_term.toUpperCase()) == 0) to_show[dnum] = true;
		
		if(district.towns.toUpperCase().indexOf(search_term.toUpperCase()) != -1){
			to_show[dnum] = true;
		} 
		if(district.county.toUpperCase().indexOf(search_term.toUpperCase()) != -1) to_show[dnum] = true;
		if(district.dnum.toString().indexOf(search_term) != -1) to_show[dnum] = true;

		if(gg.display_candidates){
			district.this_year.forEach(function(candidate){
				if(candidate.lastName.toUpperCase().indexOf(search_term.toUpperCase()) == 0) to_show[dnum] = true;
				if(candidate.firstName.toUpperCase().indexOf(search_term.toUpperCase()) == 0) to_show[dnum] = true;
			});

			if(district.former_legislator){
				if(district.former_legislator.lastName.toUpperCase().indexOf(search_term.toUpperCase()) == 0) to_show[dnum] = true;
				if(district.former_legislator.firstName.toUpperCase().indexOf(search_term.toUpperCase()) == 0) to_show[dnum] = true;
			}
		}

		// THEN RE-HIDE THE ONES THAT FAIL THE SELECTED LIST
		if(gg.selected_list){
			switch(gg.selected_list){

				case "what_flipped" :
					if(l.flipped != "true") to_show[dnum] = false;
				break;

				case "whos_new" :
					if(l.title != 'NEWLY ELECTED') to_show[dnum] = false;
				break;

				case "just_dems" :
					if(l.party != 'DEMOCRATIC') to_show[dnum] = false;
				break;

				case "just_gop" :
					if(l.party != 'REPUBLICAN') to_show[dnum] = false;
				break;

				case 'was_open_r' : 
					var f = district.former_legislator;
					if(!(f && f.title == 'FORMERLY HELD BY' && f.party == 'REPUBLICAN')){
						to_show[dnum] = false;
					}
				break;

				case 'was_open_d' :
					var f = district.former_legislator;
					if(!(f && f.title == 'FORMERLY HELD BY' && f.party == 'DEMOCRATIC')){
						to_show[dnum] = false;
					}
				break;

			}
		}

	});


	for(var dnum in to_show){
		if(to_show[dnum]) {
			$('#leg_' + dnum).show();
			var map = gg.featured_map;
		}
		else {
			$('#leg_' + dnum).hide();
			var map = null;	
		}

		districtDictionary[gg.active_body][dnum].geo.polygonsGoogle.forEach(function(polygon){
			polygon.setMap(map)
		});
	}	
}


function lookupAddress(){

	if(gg.selected.here) gg.selected.here.marker.setMap(map);

	var address = $('#address_input').val();

	var url  = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + 
				encodeURI(address) + '&key=' + google_api_key;

	$.get(url, function(response){

		// ToDo: Handle bad input. / Out of state etc.
		var hereLL = response.results[0].geometry.location;

		
		// SET "HERE"
		gg.selected.here = {
			simple : hereLL,
			google : new google.maps.LatLng(hereLL.lat, hereLL.lng),
			marker : new google.maps.Marker({
						position: hereLL,
						map: gg.featured_map,
						title: 'Your Address'
			        })
		}

		// ToDo: Handle if district can't be found.
		dnum = findDistrict(gg.selected.here.google);
		


		// LOAD DISTRICT
		loadDistrict(dnum);
	})
}


function findDistrict(point){

	var districts = districtDictionary[gg.active_body];

	for(dnum in districts){
		
		var polygons = districts[dnum].geo.polygonsGoogle;

		for(var i = 0; i < polygons.length; i++){
			var contains = google.maps.geometry.poly.containsLocation(point, polygons[i]);
			if(contains) return dnum;

		}
	}
}



// function setColor(el){
// 	color = el.style.backgroundColor;
// 	selectedColor = color;
// 	document.getElementById('selected_swatch').style.background = color;
// }



Number.prototype.formatMoney = function(){
    var n = this, 
    c = 0, 
    d = ".", 
    t = ",", 
    s = n < 0 ? "-$" : "$", 
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))), 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };