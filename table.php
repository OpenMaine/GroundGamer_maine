<?php


	// PARSE REQUEST
	$mode = false;


	// CONTRIBUTIONS FOR CAMPAIGN
	if(isset($_GET['c'])){
		$mode = 'CON';
		$modename = "Contributions to ";
		$committee_name = $_GET['c'];
		$headers = array('Date', 'Amount', 'Name', 'Employer', 'Profession', 'City', 'State', 'Address');
		$fields = array('date', 'amount_display', 'name', 'employer', 'profession', 'city', 'state', 'full_address');

		// REQUEST
		$request = array(
			"CommitteeName" => $committee_name, // rough match
			"TransactionType" =>	$mode,	// "EXP"
			"pageSize" =>	10000 // keep it nice and high, so you don't max out
		);

	}


	// EXPENDITURES BY CAMPAIGN
	if(isset($_GET['e'])){
		$mode = 'EXP';
		$modename = "Expenditures by ";
		$committee_name = $_GET['e'];

		$headers = array('Date', 'Amount', 'Name', 'City', 'State', 'Description', 'Category');
		$fields = array('date', 'amount_display', 'name', 'city', 'state', 'description', 'category');

		// REQUEST
		$request = array(
			"CommitteeName" => $committee_name, // rough match
			"TransactionType" =>	$mode,	// "EXP"
			"pageSize" =>	10000 // keep it nice and high, so you don't max out
		);

	
	}



	// DONATIONS FROM DONOR
	if(isset($_GET['d'])){
		$mode = 'CON';
		$modename = "Donations from ";
		$donor_name = $_GET['d'];

		$headers = array('Date', 'Amount', "Campaign", 'Name', 'Employer', 'Profession', 'City', 'State');
		$fields = array('date', 'amount_display', "campaign", 'name', 'employer', 'profession', 'city', 'state');


		// {
		// 		"ContributorPayeeName" : "BIEL, STEVEN",
		// 		"ElectionYear" 		: "2018"
		// 		"pageSize" 			: "10",
		// 		"TransactionType" 	: "CON"
		// }
	
		// REQUEST
		$request = array(
			"ContributorPayeeName" => $donor_name,
			"TransactionType" =>	$mode,	// "EXP"
			"pageSize" =>	10000 // keep it nice and high, so you don't max out
		);

	}



	if(!$mode){
		echo 'Sorry, please specify a committee name.';
		exit();
	}

	//echo $mode . ' ' . $committee_name;



	
	$data_string = json_encode($request);                                                                                   
	                                                                                                                     
	$ch = curl_init('https://mainecampaignfinance.com/api///Search/TransactionSearchInformation');                                                                      
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");                                                                     
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);                                                                  
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);                                                                      
	curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
	    'Content-Type: application/json',                                                                                
	    'Content-Length: ' . strlen($data_string))                                                                       
	);                                                                                                                   
	                                                                                                                     
	$result = json_decode(curl_exec($ch));
	if(!$result) {
		echo "Unable to fetch data."; exit();
	}



	function orderByAmount($a, $b){
		return ($a -> Amount < $b -> Amount);
	}

	usort($result, 'orderByAmount');


//	print_r($result);

	$dictionary = array(
		"date" => "TransactionDate",
		"amount" => "Amount",
		"name" => "ContributorPayeeName",
		"employer" => "Employer",
		"profession" => "Occupation",
		"city" => "City",
		"state" => "StateName",
		"full_address" => "Address",
		"description" => "Description",
		"category" => "TransactionPurposeDescription",
		"campaign" => "Name"
		
	);



	$transactions = array();
	$total = 0;
	foreach($result as $r){
		$t = array();
		foreach($dictionary as $k => $v) $t[$k] = $r -> $v;
		$t['timestamp'] = strtotime($t["date"]);
		$t['date'] = date("M j, Y", $t['timestamp']);

		$t['amount_display'] = "$" . number_format($t['amount'], 2);

		if(explode('.', $t['amount_display'])[1] == '00') $t['amount_display'] = explode('.', $t['amount_display'])[0];

		$transactions[] = $t;

		$total += $t['amount'];
	}

//print_r($transactions);



?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title><?php echo $mode . ' - ' . $committee_name; ?></title>
	<style>
		body { font-family: sans-serif; }
		table { border-collapse: collapse; width: 1200px;}
		th 		{ text-align: left; font-size: 13px; }
		td 		{ border: solid 1px #ccc; padding: 5px; font-size: 12px; line-height: 18px}
		tbody tr:hover { background: #333; color: white; } 	
		tr th:hover { cursor: pointer; text-decoration: underline;  }	
		input { display: block; width: 250px; height: 40px; line-height: 40px; font-size: 16px; border: solid 1px #ccc; margin: 20px 0; padding: 0 8px;}
	</style>

	<!-- JS LIBRARIES: jQuery -->
	<script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>

	<script>
		var transactions = <?php echo json_encode($transactions); ?>;
		transactions.forEach(function(t){
			t.display = true;
		});

		var fields = <?php echo json_encode($fields); ?>

		var orders = {};
		fields.forEach(function(f){ orders[f] = 1; })
		orders.amount = 1;
		orders.timestamp = 1;


		// (RE)LOAD TABLE
		function loadTable(){
			var html = '';
			transactions.forEach(function(t){
				if(t.display){
					html += '<tr>';
					fields.forEach(function(f){ html += '<td>' + t[f] + '</td>'; })
					html += '</tr>';
				}
			})
			$('#tbody').html(html);
		}


		// SORT TABLE
		function sortBy(field){
			if(field == 'Date') field = "timestamp";
			field = field.toLowerCase();

			if(orders[field] == 1){
				transactions.sort(function(a, b){ return a[field] < b[field]; });				
			}
			else {
				transactions.sort(function(a, b){ return a[field] > b[field]; });
			}
			orders[field] = -1 * orders[field];
			loadTable();
		}


		// FILTER TABLE BY SEARCH STRING
		function filter(search_str){
			transactions.forEach(function(t){
				t.display = false;
				fields.forEach(function(f){
					if(t[f] && t[f].toLowerCase().indexOf(search_str.toLowerCase()) != -1) t.display = true;
				})
			})
			loadTable();
		}

		$(function(){
			// loadTable();
		})
	</script>

</head>
<body>
	<b><?php echo $modename . $committee_name; ?></b> - <?php echo "$" . number_format($total, 2); ?><br /><br />

	<input placeholder="Search..." onkeyup="filter(this.value)">

	<table>
		<thead>
			<tr>
				<?php
					foreach($headers as $h){
						echo '<th onclick="sortBy(\'' . $h . '\');">' . $h . '</th>';
					}
				?>
			</tr>
		</thead>
		<tbody id="tbody">
			<?php 
				foreach($transactions as $t){
					echo '<tr>';						
						foreach($fields as $f) echo '<td>' . $t[$f] . '</td>';
					echo '</tr>';
				}
			?>
		</tbody>
</body>
</html>

