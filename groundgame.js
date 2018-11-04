

// Ground Game 
//	- (c) 2018 - Rob Korobkin, rob.korobkin@gmail.com



// DISTRICT DICTIONARY 
districtDictionary = {
	"House" : {
		// <dnum> : <District>,
	},

	Senate : { }
}

// Expected from UI Loader: legislatorsRaw [<Legislator>, ...]
// Geo Data comes from APIs



// APP STATE
gg = {

	"active_body" : "House",
	
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


District = function(legislator){
	this.legislator = legislator;
	this.body 		= legislator.legislative_chamber;
	this.dnum 		= legislator.districtNum;
	this.geo 		= { polygonsRaw : [], "polygonsGoogle" : []}
}



// Use Legislators files to build District Dictionary
$.each(legislatorsRaw, function(i, l){
	l.is_incumbent = false;
	districtDictionary[l.legislative_chamber][l.districtNum] = new District(l);
})

$.each(senators_2018, function(dnum, this_year){
	var d = districtDictionary['Senate'][dnum];
	d.this_year = this_year;
	$.each(this_year, function(party, candidate){
		candidate.fin_summary_link = 'https://mainecampaignfinance.com/#/exploreDetails/' + candidate.IDNumber + '/12/' + candidate.district + '/32/2018';
		if(candidate.incumbentFlag) {
			d.legislator.is_incumbent = true;
			d.legislator.incumbent_info = candidate;
			delete d.this_year[party];
		}
	})
})

$.each(house_2018, function(dnum, this_year){
	var d = districtDictionary['House'][dnum];
	d.this_year = this_year;

	$.each(this_year, function(party, candidate){
		candidate.fin_summary_link = 'https://mainecampaignfinance.com/#/exploreDetails/' + candidate.IDNumber + '/11/' + candidate.district + '/32/2018';
		if(candidate.incumbentFlag) {
			d.legislator.is_incumbent = true;
			d.legislator.incumbent_info = candidate;
			delete d.this_year[party];
		}
	})
})



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
		
	}


	// fetch data from api and load
	else {
		$.getJSON('data/turfs/' + body + '_districts.js', function(response){
			gg.loaded[gg.active_body] = true;
			loadDistrictGeography(response);

			// IF POINT SELECTED, LOAD DISTRICT
			if(gg.selected.here){
				dnum = findDistrict(gg.selected.here.google);
				loadDistrict(dnum);
			}
		});		
	}
}



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
		if(leg.party == 'Republican') {
			c = (leg.is_incumbent) ? '#ff0000' : '#ff69b4';
		}
		else if(leg.party == 'Democrat') {
			c = (leg.is_incumbent) ? '#0000ff' : '#1fdee3';	
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


	// ToDo: de-select district before loading the new one.

	if(gg.selected.district){

		var c;
		var leg = gg.selected.district.legislator;

		if(leg.party == 'Republican') {
			c = (leg.is_incumbent) ? '#ff0000' : '#ff69b4';
		}
		else if(leg.party == 'Democrat') {
			c = (leg.is_incumbent) ? '#0000ff' : '#1fdee3';	
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

	var title = (legislator.is_incumbent) ? 'INCUMBENT - ' + legislator.term_limited : 'SITTING - ' + legislator.term_limited;

	console.log(legislator)

	var money_line = (legislator.is_incumbent) ? _getMoneyLine(legislator.incumbent_info) : '';

	var mpa_link = (gg.active_body == 'Senate') ? 'sldu-' + dnum : 'sldl-' + dnum;

	var town_line = (gg.active_body == 'Senate') ? legislator.legal_residence : legislator.towns;
	
	var html =	'<div class="feature_frame">' +
					'<div class="districtTitle">District ' + legislator.districtNum + '</div>' +
					'<div class="districtTowns">' + town_line + '</div>' +

					'<div class="leg_card clearfix">' +
						'<div class="party_header ' + legislator.party[0] + '">' + title + '</div>' + 
						'<div class="mug_shot" style="background-image: url(\'assets/legislator-photos/' + legislator.photo_url + '\');"></div>' +
						'<div class="contact_details">' + 
							'<div class="name">' + legislator.name.fullName + '</div>' +
							//legislator.phone + 
							// '<br />' + legislator.email + 
							// '<br />' + legislator.address + 
							money_line +
							'MPA: <a class="mpa_link" href="http://mpascorecard.org/legislators/' + mpa_link + '" target="_blank">' + legislator.mpaScore + '%</a>' +
							'<br /><a href="' + legislator.url + '" target="_blank">More Info</a>' +
						'</div>' +
					'</div>';

	console.log(district);
            

	$.each(district.this_year, function(party, candidate){

		console.log(candidate);

		html += '<div class="challenger leg_card">' + 
					'<div class="party_header ' + party[0] + '">' + party + '</div>' + 
					'<div class="name">' + candidate.firstName +  ' ' + candidate.lastName + '</div>' +
					'<div class="contact_details">' +
					 	_getMoneyLine(candidate) +
					 '</div>' +
				'</div>';
	});

	html += '</div>'; // end .feature_frame

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


function _getMoneyLine(candidate){

	var code = (candidate.FinanceType == "Maine Clean Election Act Financed") ? 'C' : 'T';

	if(!candidate.TotalContributions) candidate.TotalContributions = 0;
	if(!candidate.TotalExpenditures) candidate.TotalExpenditures = 0;



	var committee_name = candidate.lastName + ', ' + candidate.firstName + ' - (2018)';
	console.log(committee_name);

	var committee_slug = encodeURIComponent(committee_name);
	console.log(committee_slug);

	var table_page = 'table.php?'



	return '<div class="money">' + 
				code + ': ' +
				'<a class="contributions" target="_blank" href="table.php?c=' + committee_slug + '">' + candidate.TotalContributions.formatMoney() + '</a>' +
				' <span class="divider">-</span> ' +
				'<a class="expenditures" target="_blank" href="table.php?e=' + committee_slug + '">' + candidate.TotalExpenditures.formatMoney() + '</a>' +
				' <span class="divider">-</span> <a href="' + candidate.fin_summary_link + '" target="_blank">summary</a>' +
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
			loadDistrict(gg.selected.district);
		break;

	}

}

function showSearch(){

	// ToDo: Restore search string value.

	var html =
		'<div class="search_frame">' +
			'<div id="address_frame">' +
				'<label for="address_input">Enter your address:</label>' +
				'<input class="form-control" id="address_input" >' + 
				'<a onclick="lookupAddress()" class="button">Search</a>' +
			'</div>' +
			'<div id="output">' +
				'Click a district at right to find out more about who represents that district in the Maine legislature...' +
			'</div>' +
		'</div>';

	$('#output').html(html);

	// ToDo: Re-Attach Material Design events.

}


function showList(){
	var html = '<div id="address_frame">' +
					'<input class="form-control" id="search_input" onkeyup="filterList()" placeholder="Search...">' +
				'</div>' +
				'<div class="leg_card_frame">';

	$.each(districtDictionary[gg.active_body], function(dnum, district){
		var l = district.legislator;

		var leg_card = '<div class="leg_card clearfix" id="leg_' + dnum +'" onclick="loadDistrict(' + dnum + ')">' +
							'<div class="mug_shot" style="background-image: url(\'assets/legislator-photos/' + l.photo_url + '\');"></div>' +
							'<div class="name">' + l.name.fullName + '</div>' +
							'<div class="district">District ' + dnum + ' - ' + l.towns + '</div>' +

						'</div>';

		html += leg_card;
	});

	html += '</div>';

	$('#output').html(html);
}

function filterList(){
	var search_term = $('#search_input').val();
	$.each(districtDictionary[gg.active_body], function(dnum, district){
		var l = district.legislator;
		var row = $('#leg_' + dnum);
		row.hide();

		if(search_term == '') row.show();

		if(l.name.lastName.toUpperCase().indexOf(search_term.toUpperCase()) == 0) row.show();
		if(l.name.firstName.toUpperCase().indexOf(search_term.toUpperCase()) == 0) row.show();
		if(l.towns.toUpperCase().indexOf(search_term.toUpperCase()) != -1) row.show();

	});
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