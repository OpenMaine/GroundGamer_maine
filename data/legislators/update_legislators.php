<?php

	$legislators = json_decode(file_get_contents('legislators.js'));
	
// 	$afl_legislators_raw = json_decode(file_get_contents('afl_legislators.js'));
// 	foreach($afl_legislators_raw as $l){
// 		$afl_legislators[$l -> ocdId] = $l;
// 	}

// 	foreach($legislators as $k => $l){
// 		unset($legislators[$k] -> votes);

// 		$legislators[$k] -> legiscan_data = $afl_legislators[$l -> ocdId] -> legiscan_data;

// 		$legislators[$k] -> aflscore = $afl_legislators[$l -> ocdId] -> aflscore;
 
// 	}

	
// 	echo json_encode($legislators, JSON_PRETTY_PRINT);


// exit();

	// SCRAPE NEW SITE: http://legislature.maine.gov/house/house/MemberProfiles/ListAlpha

	// $txt = file_get_contents('new_site.txt');
	// $new_legislators_raw = explode('<td>', $txt);

	// foreach($new_legislators_raw as $n){
	// 	$new_legislators[] = array(
	// 		"img" => 'http://legislature.maine.gov' . explode('"', explode('src="', $n)[1])[0],
	// 		"link" => 'http://legislature.maine.gov' . explode('"', explode('href="', $n)[1])[0],
	// 		"name" => strip_tags(explode('<br />', $n)[1])
	// 	);

	// }
	// echo json_encode($new_legislators, JSON_PRETTY_PRINT);


	function sortByName($a, $b){
		return($a -> name -> lastName > $b -> name -> lastName );
	}

	usort($legislators, 'sortByName');
	foreach($legislators as $l) {
		if($l -> legislative_chamber == 'House') $house[] = $l;
		else $senate[] = $l;
	}


	$new_site = json_decode(file_get_contents('new_site.js'));

	foreach($new_site as $k => $l){
		//echo $house[$k] -> name -> firstName . ' ' . $house[$k] -> name -> lastName . ' - ' . $l -> name;
		$house[$k] -> url = $l -> link;
		$house[$k] -> img2 = $l -> img;
	}

	$legislators = array_merge($house, $senate);
	echo json_encode($legislators, JSON_PRETTY_PRINT);

	exit();



	function validateJson(){
		switch (json_last_error()) {
	        case JSON_ERROR_NONE:
	            echo ' - No errors';
	        break;
	        case JSON_ERROR_DEPTH:
	            echo ' - Maximum stack depth exceeded';
	        break;
	        case JSON_ERROR_STATE_MISMATCH:
	            echo ' - Underflow or the modes mismatch';
	        break;
	        case JSON_ERROR_CTRL_CHAR:
	            echo ' - Unexpected control character found';
	        break;
	        case JSON_ERROR_SYNTAX:
	            echo ' - Syntax error, malformed JSON';
	        break;
	        case JSON_ERROR_UTF8:
	            echo ' - Malformed UTF-8 characters, possibly incorrectly encoded';
	        break;
	        default:
	            echo ' - Unknown error';
	        break;
	    }
	}



	// UPDATE PHOTO URLS

	// foreach($legislators as $k => $l){
	// 	$photo_url = ($l -> legislative_chamber == 'House') ? 'sldl' : 'sldu';
	// 	$photo_url .= '.' . $l -> districtNum . '.jpg';
	// 	$legislators[$k] -> photo_url = $photo_url;
	// }



	// GET NEW HOUSE

	$url = 'https://mainecampaignfinance.com/api///Organization/GetCandidateComparision?officeId=11&year=2018&districtId=&electionId=32&jurisdictionId=&pageSize=2147483647';

	$legislators = json_decode(file_get_contents($url));
	

	// GET NEW SENATE

	// $url = 'https://mainecampaignfinance.com/api///Organization/GetCandidateComparision?officeId=12&year=2018&districtId=&electionId=32&jurisdictionId=&pageSize=2147483647';

	// $legislators = json_decode(file_get_contents($url));
	echo json_encode($legislators, JSON_PRETTY_PRINT);
	exit();



	// BUILD HOUSE HASH
	$fields = array("TotalCashonHand", "TotalContributions", "TotalExpenditures");



	$new_house_raw = json_decode(file_get_contents('new_senate.js'));
	$new_house = array();
	foreach($new_house_raw as $h){
		foreach($fields as $f){
			$new_house[$h -> IDNumber][$f] = $h -> $f;
		}
	}



	$str = file_get_contents('2018_senate.js');
	$house_2018 = json_decode($str);
	
	foreach($house_2018 as $districtNum => $district){
		foreach($district as $party => $candidate){

			$IDNumber = $candidate -> IDNumber;

			$newTotals = $new_house[$IDNumber];
			

			foreach($newTotals as $k => $v){
				$house_2018 -> $districtNum -> $party -> $k = $v;
			}
		}
	}

	
	echo json_encode($house_2018, JSON_PRETTY_PRINT);







	//echo json_encode($legislators, JSON_PRETTY_PRINT);



