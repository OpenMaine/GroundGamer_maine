<?php

	$google_api_key = 'AIzaSyDxvSHxYEcCAseWokSJ4HyTE0g9xA0IH0w';

	$district_dictionary = file_get_contents('data/legislators/district_dictionary.js');

?><!DOCTYPE html>
<html>
	<head>
		<meta name="viewport" content="initial-scale=1.0, user-scalable=no">
		<meta charset="utf-8">
		<title>Maine - Interactive Legislative Map!</title>

		<!-- APP CONFIG -->
		<script>
			google_api_key = "<?php echo $google_api_key; ?>";
		</script>
		
		<!-- APP DATA - THE REST LOADS VIA AJAX -->
		<script>
			var districtDictionary = <?php echo $district_dictionary; ?>;
		</script>
		
		<!-- JS LIBRARIES: jQuery -->
		<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>

		<!-- LOAD CSS -->

		<!-- Google Fonts: Roboto, Material Icons -->
		<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons">

		<!-- Bootstrap / Material Design -->
	<!-- 	<link rel="stylesheet" href="https://unpkg.com/bootstrap-material-design@4.0.0-beta.3/dist/css/bootstrap-material-design.min.css" integrity="sha384-k5bjxeyx3S5yJJNRD1eKUMdgxuvfisWKku5dwHQq9Q/Lz6H8CyL89KF52ICpX4cL" crossorigin="anonymous"> -->
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">

		<!-- App Styles -->
		<link rel="stylesheet" href="groundgame.css" />

	</head>
	<body>
		<div id="map"></div>
		<div id="contentFrame" style="display: none">
			
			<div id="button_frame" class="clearfix">
				
				<div class="btn-group btn-group-sm" role="group" aria-label="..." style="float: left;" id="body_toggle">
					<button type="button" class="btn btn-primary House_toggle" onclick="toggleBody('House')" style="font-weight: bold">House</button>
					<button type="button" class="btn btn-default Senate_toggle" onclick="toggleBody('Senate')" style="font-weight: bold">Senate</button>
				</div>

				<div class="ui_toggle btn-group btn-group-sm" style="float: right">
					<button type="button" class="btn btn-primary search" onclick="toggleUI('search')"><span class="glyphicon glyphicon-search"></span></button>
					<button type="button" class="btn btn-default list" onclick="toggleUI('list')"><span class="glyphicon glyphicon-th-list"></span></button>
					<button type="button" class="btn btn-default feature" onclick="toggleUI('feature')"><span class="glyphicon glyphicon-user"></span></button>
				</div>
			</div>

			<div id="output"></div>
		</div>

		


		

		<!-- APP SCRIPT -->
		<script src="groundgame.js?v=<?php echo time(); ?>"></script>
		

		
		<!-- REMAINING LIBRARIES: Google Maps API, Popper.js (?), Bootstrap / Material Design -->
		<script async defer src="https://maps.googleapis.com/maps/api/js?key=<?php echo $google_api_key; ?>&callback=initMap"></script>

	<!-- 	<script src="https://unpkg.com/popper.js@1.12.5/dist/umd/popper.js" 
				integrity="sha384-KlVcf2tswD0JOTQnzU4uwqXcbAy57PvV48YUiLjqpk/MJ2wExQhg9tuozn5A1iVw" crossorigin="anonymous"></script>
 -->
	<!-- 	<script src="https://unpkg.com/bootstrap-material-design@4.0.0-beta.3/dist/js/bootstrap-material-design.js" 
				integrity="sha384-hC7RwS0Uz+TOt6rNG8GX0xYCJ2EydZt1HeElNwQqW+3udRol4XwyBfISrNDgQcGA" crossorigin="anonymous"></script>				
		<script>$(document).ready(function() { $('body').bootstrapMaterialDesign(); });</script>
 -->


	

	</body>
</html>