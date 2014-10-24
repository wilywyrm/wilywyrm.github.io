/*** 
 Amayze.js
 This is a script designed to automatically manage multiple Amazon Web Services (AWS) accounts and use them to launch Elastic
 Compute Cloud (EC2) instances at the lowest possible price across multiple AWS regions. Optional Autopilot mode cycles through
 each account and load balances instance requests across regions to run the most instances at the lowest possible price at or 
 under the user-set price.
 
 This script is meant to be used in conjunction with a HTML page front-end for users to input account credentials, instance configurations 
 (Amazon Machine Images, User Data, etc.), and instance price. These are all stored client-side using cookies
 
 NOT MEANT to be used in a production environment. Personal project.
 Requires: jQuery, jQuery cookie plugin, full AWS Javascript SDK
 ***/

var accounts = []; // holder of user account objects (contains account ID and secret keys)
var numAccounts = 0; 
var regions = ["us-east-1", "us-west-2", "us-west-1", "eu-west-1"]; // name of AWS regions, hard coded for now
var linAMIs = []; // IDs of linux Amazon Machine Images
var winAMIs = []; // IDs of windows AMIs


var userData; // user data to configure Windows AMIs
var cartelPrice = .1; // the default user-set max instance price
var underPrice = []; // the availability zone/region pairs that fall under the set price
var autopilot = "disabled"; // the status of the autopilot ("disabled", "enabled", or "canceling")
var accountIndex = 0; // the index of the account we are on


// init() reads all data from cookies we store client-side
function init(){
	// read and set user-set price
	if($.cookie("cartelPrice") !== undefined){
		cartelPrice = $.cookie("cartelPrice");
	}
	document.getElementById("cartelPrice").value = cartelPrice;
		
	// read and set autopilot state
	if($.cookie("autopilot") !== undefined){
		autopilot = $.cookie("autopilot");
	}
	$('#autoIndicator').text("Autopilot is " + autopilot);	
	
	// read and set number of accounts
	if($.cookie("numAccounts") !== undefined){
		numAccounts = $.cookie("numAccounts");
	}
	$.cookie("numAccounts", numAccounts, {expires: 9999});
	
	// html holder for the user credential forms
	var idHTML = "Account IDs: <br />";
	var secretHTML = "Secret Keys: <br />";
	// if there are valid credentials stored in cookies, read them into our array and display them on the HTML form
	if($.cookie("accessID0") !== undefined && $.cookie("secret0") !== undefined){
		var num = 0;
		var idStr = "accessID" + num;
		var secretStr = "secret" + num;
		
		do{
			accounts[num] = {accessID: $.cookie(idStr), secret: $.cookie(secretStr)/*, enabled: $.cookie(enableStr)*/};
			idHTML += "<br />"+ num + " <input type=\"text\" size=\"30\" id=\"" + idStr + "\" name=\"" + idStr + "\" value=\"" + $.cookie(idStr) + "\" onblur=\"updateAccts()\">";
			secretHTML += "<br /><input type=\"text\" size=\"50\" id=\"" + secretStr + "\" name=\"" + secretStr + "\" value=\"" + $.cookie(secretStr) + "\" onblur=\"updateAccts()\">";
			num++;
			idStr = "accessID" + num;
			secretStr = "secret" + num;
			
		} while($.cookie(idStr) !== undefined && $.cookie(secretStr) !== undefined);
		numAccounts = num;
		$.cookie("numAccounts", numAccounts, {expires: 9999});
	}		
	else{
		// make an empty form, this is probably first run
		idHTML += "<br />0 <input type=\"text\" size=\"30\" id=\"accessID0\" name=\"accessID0\" onblur=\"updateAccts()\">";
		secretHTML += "<br /><input type=\"text\" size=\"50\" id=\"secret0\" name=\"secret0\" onblur=\"updateAccts()\">";
	}
	//console.log(accounts);
	
	// read and set user data for AMI configuration
	/*if($.cookie("userData") !== undefined){
		userData = $.cookie(userData);
	}*/
	
	// read and set AMI IDs for Linux and Windows
	var amiHTML = "AMIs (Linux, Windows):<br />";
	for(var i = 0; i < regions.length; i++){
		var linStr = regions[i] + "lin";
		var winStr = regions[i] + "win";
		if($.cookie(linStr) !== undefined){ // for linux AMI
			linAMIs[i] = $.cookie(linStr);
		}
		else{
			linAMIs[i] = ""; // ternary would work great here but eh
		}
		if($.cookie(winStr) !== undefined){ // for windows AMI
			winAMIs[i] = $.cookie(winStr);
		}
		else{
			winAMIs[i] = "";
		}
		amiHTML += "<br />" + regions[i] + ": <input type=\"text\" id=\"" + linStr + "\" value=\"" + linAMIs[i] + "\" onblur=\"updateAMIs()\">";
		amiHTML += "<input type=\"text\" id=\"" + winStr + "\" value=\"" + winAMIs[i] + "\" onblur=\"updateAMIs()\">";
		//$.cookie("numAccounts", numAccounts);
	}
	
	// read and set user data for AMI configuration
	if($.cookie("userData") !== undefined){
		userData = $.cookie("userData");
		document.getElementById("userData").value = $.cookie("userData");
	}
	
	// write all HTML holders to their respective divs on the HTML document 
	$('#ids').html(idHTML);
	$('#secrets').html(secretHTML);
	$('#amis').html(amiHTML);
	//$('#enables').html(enableHTML);
	//document.getElementById("secrets").innerHTML = idHTML;
	//console.log(idHTML);
	//document.getElementById("setIndex").value = accountIndex;
	
	// read and set index of account we are working with
	if($.cookie("accountIndex") !== undefined){
		accountIndex = $.cookie("accountIndex");
		if(accountIndex > accounts.length){
			accountIndex = 0;
			$.cookie("accountIndex", accountIndex, {expires: 9999});
		}
	}		
	//document.getElementById("setIndex").value = accountIndex;
	
	// handle infinite loop case of user filling in credentials and then erasing
	var stop = false;
	//console.log(!stop);
	//console.log(!(document.getElementById("accessID" + accountIndex).value === "" || document.getElementById("secret" + accountIndex).value === ""));
	while(/*accounts[accountIndex].enabled != "true" &&*/accounts.length > 0 && !stop && (document.getElementById("accessID" + accountIndex).value === "" || document.getElementById("secret" + accountIndex).value === "")){
		//console.log("hi");
		accountIndex++;
		if(accountIndex >= accounts.length){
			accountIndex = 0;
			stop = true; // yeah this doesn't really function as it should, it doesn't cycle through all accounts before stopping, just need to stop the infinite loop
			//console.log("hi");
			if(autopilot === "canceling"){ // if we were canceling instances, stop the process once we loop back to account 0
				autopilot = "disabled";
				$('#autoIndicator').text("Autopilot is " + autopilot);	
			}
		}
	}
	console.log(accounts[accountIndex]);
	document.getElementById("setIndex").value = accountIndex;
	
	// set variables in cookies
	$.cookie("cartelPrice", cartelPrice, {expires: 9999});
	$.cookie("autopilot", autopilot, {expires: 9999});
	$.cookie("accountIndex", accountIndex, {expires: 9999});
	
	// configure the AWS SDK to use the credentials we loaded
	AWS.config.update({accessKeyId: accounts[accountIndex].accessID, secretAccessKey: accounts[accountIndex].secret, region: regions[0]});
	
	// display prices for instances in each availablity zone in each region
	var deferred = refreshPrices();
	deferred.done(function(){
		if(!(autopilot === "disabled")){
			autoPilot();
		}
		setTimeout(function(){
			window.location.reload(true);
		}, 60000);
		//else if(autopilot === "canceling"){
		//	accountIndex = 0;
		//	cancelHelper();
		//}
	});
}

// get prices for g2.2xlarge instances in each zone/region, sort them by descending price, and 
function refreshPrices(){	
	var regionIndex = 0;
	var aZones = []; // availability zones
	var ecs = [];	// separate AWS EC2 objects to query each AWS region
	var numRequests = 0; // number of requests we make
	var dfd = $.Deferred(); // deferred object to return and be handled
	var priceText = "";	// "Lowest price is: "

	// get the latest price of Dogecoin relative to Bitcoin (this script was originally written to mine dogecoin on EC2)
	$.getJSON("http://pubapi.cryptsy.com/api.php?method=marketdatav2", function(data){
		//console.log(data/*.return.markets."DOGE/BTC"*/);
		$('#dogePrice').html("Doge = " + Math.round(data['return']['markets']['DOGE\/BTC'].lasttradeprice * 100000000) + " satoshi (Cryptsy) <br /><br />");
		//console.log(Math.round(data['return']['markets']['DOGE\/BTC'].lasttradeprice * 100000000));
		/*$.each(data, function(key, val){
			if(key === "return"){
				console.log(val);
			}
		});*/
	});
	
	// update the prices displayed
	updatePrice();

	// sort prices by zone and place zones cheaper than the user-set price into a separate array
	for(regionIndex = 0; regionIndex < regions.length; regionIndex++){
		ecs.push(new AWS.EC2({region: regions[regionIndex]}));
		
		ecs[regionIndex].describeAvailabilityZones(function(err, data){
			if(data != null){
			//console.log(err);
			//console.log(data);
				for(var i = 0; i < data.AvailabilityZones.length*2; i++){ // length * 2 to check for linux and windows
					numRequests++;	// increment number of requests outstanding
					var priceParams = {
						InstanceTypes: ["g2.2xlarge"],
						MaxResults: 1,
						AvailabilityZone: data.AvailabilityZones[Math.floor(i/2)].ZoneName,
						ProductDescriptions: (i % 2 == 0) ? ["Linux/UNIX"] : ["Windows"]
						//Filters: [{Name: 'availability-zone', Values: [thisZone.ZoneName]}]
					};

					var index = $.inArray(data.AvailabilityZones[0].RegionName, regions);
					ecs[index].describeSpotPriceHistory(priceParams, function(err, spots){
						if(!err){
							//console.log(spots);
							var zoneName = spots.SpotPriceHistory[0].AvailabilityZone;
							var price = parseFloat(spots.SpotPriceHistory[0].SpotPrice); // price is given as a string, turn it into a number
							//console.log(price);
							var OS = spots.SpotPriceHistory[0].ProductDescription;
							//priceText += "Zone: " + zoneName + ", " + price + " (" + OS + ")\n";
							aZones.push({
								zone: zoneName,
								price: price,
								os: OS
							});
						}
					}).on('complete', function(){
						numRequests--;	// the request finished, so we decrease the count of outstanding requests
						if(numRequests == 0){ // if all requests have finished, sort the zones
							var lowestLin;
							var lowestWin;
							var sortedZones = [];	
							
							for(var a = 0; a < regions.length; a++){
								var regionStr = regions[a];
								var regionZones = [];
								for(var b = 0; b < aZones.length; b++){
									if(aZones[b].zone.indexOf(regionStr) != -1){
										//console.log("hi");
										var index = 0;
										// = regionZones.length;
										while(index < regionZones.length && regionZones[index].price < aZones[b].price){
											index++;
										}
										regionZones.splice(index, 0, aZones[b]);
										// placement of this isn't crucial, would evaluate outside of if, 
										// 	but this causes less comparisons
										/*
										if(aZones[b].os === ("Linux/UNIX") && (lowestLin == null || aZones[b].price < lowestLin.price)){
											lowestLin = aZones[b];
											//console.log("hi");
										} 
										else if(aZones[b].os === ("Windows") && (lowestWin == null || aZones[b].price < lowestWin.price)){
											lowestWin = aZones[b];
										
										}
										*/
									}
								}
								sortedZones.push(regionZones);
							}
							underPrice = [];
							for(var c = 0; c < aZones.length; c++){
								if(aZones[c].price <= cartelPrice){
									var d = 0;
									while(d < underPrice.length && underPrice[d].price < aZones[c].price){
											d++;
									}
									underPrice.splice(d, 0, aZones[c]);
								}
							}
							console.log(sortedZones);
							console.log(underPrice);
							//console.log(lowestLin);
							//console.log(lowestWin);
							priceText += "Prices at or below the threshold are: <br /> ";
							// + lowestLin.price + " for " + lowestLin.os + " in " + lowestLin.zone + "<br />";
							for(var c = 0; c < underPrice.length; c++){
								priceText += underPrice[c].price + " for " + underPrice[c].os + " in " + underPrice[c].zone + "<br />";
							}
							
							//priceText += lowestWin.price + " for " + lowestWin.os + " in " + lowestWin.zone + "<br />";
							
							for(var c = 0; c < sortedZones.length; c++){
								priceText += "<br />Region: " + regions[c] + "<br />";
								for(var d = 0; d < sortedZones[c].length; d++){
									priceText += "	Zone: " + sortedZones[c][d].zone + ", $" + sortedZones[c][d].price + " (" + sortedZones[c][d].os + ")<br />";
								}
							}
							 $('#prices').html(priceText);
							 dfd.resolve();
						}
					});
				}
			}
		});
	}
	
	return dfd;
	
}

// update the user-set price and set it in a cookie
function updatePrice(){
	cartelPrice = document.getElementById("cartelPrice").value;
	$.cookie("cartelPrice", cartelPrice, {expires: 9999});
}

// add rows to add more user credentials on a click of the "add rows button"
function addRows(){
	var idStr = "accessID" + numAccounts;
	var secretStr = "secret" + numAccounts;
	//var enableStr = "enable" + numAccounts;
	// numAccounts doubles as current index
	var idHTML = "<br />"+ numAccounts + " <input type=\"text\" size=\"30\" id=\"" + idStr + "\" name=\"" + idStr + "\" onblur=\"updateAccts()\">";
	var secretHTML = "<br /><input type=\"text\" size=\"50\" id=\"" + secretStr + "\" name=\"" + secretStr + "\" onblur=\"updateAccts()\">";
	
	$.cookie(idStr, "", {expires: 9999});
	$.cookie(secretStr, "", {expires: 9999});
	numAccounts++;
	$.cookie("numAccounts", numAccounts, {expires: 9999});
	
	$('#ids').append(idHTML);
	$('#secrets').append(secretHTML);
}

// update account credentials
function updateAccts(){
	var num = 0;
	var idStr = "accessID" + num;
	var secretStr = "secret" + num;
	//var enableStr = "enable" + num;
	var idHTML = "Account IDs: <br />";
	var secretHTML = "Secret Keys: <br />";
	//var enableHTML = "Enabled: <br />";
	while($('#' + idStr).length != 0 && $('#' + secretStr).length != 0){
		//console.log("num");
		accounts[num] = {accessID: document.getElementById(idStr).value, secret: document.getElementById(secretStr).value/*, enabled: document.getElementById(enableStr).checked*/};
		$.cookie(idStr, document.getElementById(idStr).value, {expires: 9999});
		$.cookie(secretStr, document.getElementById(secretStr).value, {expires: 9999});
		//console.log($.cookie(idStr));
		//$.cookie(enableStr, document.getElementById(enableStr).checked);
		//console.log(document.getElementById(enableStr).checked);
		idHTML += "<br />"+ num + " <input type=\"text\" size=\"30\" id=\"" + idStr + "\" name=\"" + idStr + "\" value=\"" + document.getElementById(idStr).value + "\" onblur=\"updateAccts()\">";
		secretHTML += "<br /><input type=\"text\" size=\"50\" id=\"" + secretStr + "\" name=\"" + secretStr + "\" value=\"" + document.getElementById(secretStr).value + "\" onblur=\"updateAccts()\">";
		//enableHTML += "<br /><input type=\"checkbox\" id=\"" + enableStr + "\" name=\"" + enableStr + "\" checked=\"" + document.getElementById(enableStr).checked + "\" onclick=\"updateAccts()\">";
		num++;
		idStr = "accessID" + num;
		secretStr = "secret" + num;
		//enableStr = "enable" + num;
		
	} 
	numAccounts = num;
	$.cookie("numAccounts", numAccounts, {expires: 9999});
	$('#ids').html(idHTML);
	$('#secrets').html(secretHTML);
	//$('#enables').html(enableHTML);
	console.log(accounts);
	return {id: idHTML, secret: secretHTML/*, enable: enableHTML*/};
}

// update AMIs on HTML page
function updateAMIs(){
	var amiHTML = "AMIs (Linux, Windows):";
	for(var i = 0; i < regions.length; i++){
		var linStr = regions[i] + "lin";
		var winStr = regions[i] + "win";
		if(document.getElementById(linStr) !== ""){ // for linux AMI
			linAMIs[i] = document.getElementById(linStr).value;
			$.cookie(linStr, linAMIs[i], {expires: 9999});
		}
		if(document.getElementById(winStr) !== ""){ // for linux AMI
			winAMIs[i] = document.getElementById(winStr).value;
			$.cookie(winStr, winAMIs[i], {expires: 9999});
		}
		amiHTML += "<br />" + regions[i] + ": <input type=\"text\" id=\"" + linStr + "\" value=\"" + linAMIs[i] + "\" onblur=\"updateAMIs()\">";
		amiHTML += "<input type=\"text\" id=\"" + winStr + "\" value=\"" + winAMIs[i] + "\" onblur=\"updateAMIs()\">";
		//$.cookie("numAccounts", numAccounts);
	}
	$('#amis').html(amiHTML);
}

// 
function updateUserData(){
	userData = document.getElementById("userData").value;
	console.log(userData);
	$.cookie("userData", userData, {expires: 9999});
}

//
function setAccIndex(){
	accountIndex = document.getElementById("setIndex").value;
	$.cookie("accountIndex", accountIndex, {expires: 9999});
}

// set autopilot to cancel mode on button press
function cancelAll(){
	accountIndex = 0;
	$.cookie("accountIndex", accountIndex, {expires: 9999});
	$.cookie("autopilot", "canceling", {expires: 9999});
	$('#autoIndicator').text("Autopilot is " + $.cookie("autopilot"));
	window.location.reload(true);
}

// toggle autopilot mode between enabled/disabled
function toggleAuto(){
	if(autopilot === "disabled" || autopilot === "canceling")
		autopilot = "enabled";
	else if(autopilot === "enabled")
		autopilot = "disabled";
	/*else if(autopilot === "canceling")
		autopilot = "enabled";
	*/	
	$.cookie("autopilot", autopilot, {expires: 9999});
	$('#autoIndicator').text("Autopilot is " + $.cookie("autopilot"));
	if(autopilot === "enabled"){
		window.location.reload(true); // start auto immediately
	}
	//console.log("yo");
}

// autopilot runs in the background, making instance requests and canceling requests that don't get fulfilled
// we request information about the account's current requests, if any, and only count requests that are either 
// fulfilled or open to be fulfilled, not canceled. We cancel the requests that are open because of a "capacity-oversubscribed"
// (not enough room in region) error or "price-too-low", and make more requests in regions with more room or lower prices
function autoPilot(){
	// super cool AI stuff
	//if(underPrice.length > 0){
	var ecs = [];
	var clouds = [];
	var dfd = $.Deferred();
	var requests = 0;
	var totalSpots = 0;
	var totalInst = 0;
	var allInst = [];
	var requestsToCancel = []; // if the previous spot price > current user-set price
	var instToTerm = [];	   // associated instance IDs for requests fulfilled
	
	for(var i = 0; i < regions.length; i++){
		requests++;
		ecs[i] = new AWS.EC2({region: regions[i]});
		clouds[i] = new AWS.CloudWatch({region: regions[i]});
		//clouds[i].listMetrics({Namespace: "AWS/EC2", MetricName: "CPUUtilization"},function(err,data){
		//	console.log(data);
		//});
		//console.log(i);
		
		// filter AWS's account information responses to only these kinds of instances to reduce sort time on our end
		var filterParams = {
			Filters: [
				{
					"Name": "instance-type",
					"Values": ["g2.2xlarge"]
				},
				{
					"Name": "instance-lifecycle",
					"Values": ["spot"]
				},
				{
					"Name": "instance-state-name",
					"Values": ["running", "pending"]
				}
			]
		};
		
		// unfinished monitoring of instances to restart them when they go below 100% utilization
		ecs[i].describeInstances(filterParams, function(err,data){
			//console.log(data);
			//console.log(err);
			if(data != null){ // handle 503/5xx errors which happen when a region goes down
				if(data.Reservations.length > 0){
					console.log(data.Reservations[0].Instances[0].Placement.AvailabilityZone, data);	
				}
				
				for(var i = 0; i < data.Reservations.length; i++){
					//if(data.Reservations[i].Instances[0].InstanceType === "g2.2xlarge" && data.Reservations[i].Instances[0].State.Name === "running"){
					allInst.push(data.Reservations[i].Instances[0].InstanceId);
					totalInst++;
					if(autopilot === "canceling")
						instToTerm.push(data.Reservations[i].Instances[0].InstanceId);
					//}
				}
				var params = {
					Namespace: "AWS/EC2",
					MetricName: "CPUUtilization",
					Dimensions: [
						{
							"Name": "InstanceId",
							"Value": ""
						}
					],
					Period: 300, // 5 minutes
					Statistics: ["Average"],
					Unit: "Percent"
				};
				/*clouds[i].getMetricStatistics(params, function(err, data){
					console.log(err);
					console.log(data);
					// how do we prevent the restart-loop, where we detect <50% CPU usage and restart,
					// then next time we check (worst case 1 minute), we restart again because the restart just took place
					// since it takes 15 minutes for windows instances to reach full CPU usage?
				});*/
			}
		});
		
		filterParams = {
			Filters: [
				{
					"Name": "launch.instance-type",
					"Values": ["g2.2xlarge"]
				},
				{
					"Name": "state",
					"Values": ["open", "active"]
				}
			]
		};
		
		ecs[i].describeSpotInstanceRequests(filterParams, function(err, data){
			if(data != null){ // handle 503/5xx errors which happen when a region goes down
				if(data.SpotInstanceRequests.length > 0){
					console.log(data.SpotInstanceRequests[0].LaunchSpecification.Placement.AvailabilityZone, data);
					for(var a = 0; a < data.SpotInstanceRequests.length; a++){
						var thisReq = data.SpotInstanceRequests[a];
						//if(thisReq.LaunchSpecification.InstanceType === "g2.2xlarge"){
							//if((thisReq.State === "open" || thisReq.State === "active") /*&& (thisReq.LaunchSpecification.Placement.AvailabilityZone === )*/){
								totalSpots++;
								var inUnderList = false;
								//if(thisReq.State === "active")
									//totalInst++;
								for(var ind = 0; ind < underPrice.length; ind++){
									if(thisReq.LaunchSpecification.Placement.AvailabilityZone === underPrice[ind].zone)
										inUnderList = true;
								}
								if(autopilot === "canceling" || parseFloat(thisReq.SpotPrice) != cartelPrice ||
										(underPrice.length > 0 && parseFloat(thisReq.SpotPrice) > underPrice[0].price && // same condition
										thisReq.LaunchSpecification.Placement.AvailabilityZones != underPrice[0].zone && // same condition
										(thisReq.Status.Code.indexOf("oversubscribed") != -1 || thisReq.Status.Code.indexOf("price-too-low") != -1)) || // same condition
									(thisReq.SpotPrice > cartelPrice && !inUnderList && underPrice.length > 0)){
										
									totalSpots--;
									requestsToCancel.push(thisReq.SpotInstanceRequestId);
									if(autopilot === "canceling" && thisReq.State === "active"){
										//console.log(thisReq.InstanceId);
										instToTerm.push(thisReq.InstanceId);
									}
									/*if(parseFloat(thisReq.SpotPrice) > cartelPrice && thisReq.InstanceId != undefined){
										instToTerm.push(thisReq.InstanceId);
									}*/
								}
							//}
						//}	
					}
					// super dirty brute force mass cancel all instances on all regions
					// we're gonna get a lot of 400 (Bad Request) errors, but thats ok
					if(requestsToCancel.length > 0){
						for(var b = 0; b < ecs.length; b++){
							ecs[b].cancelSpotInstanceRequests({SpotInstanceRequestIds: requestsToCancel}, function(err, data){
								//console.log(err);
								//console.log(data);
							});
						}
					}
					if(instToTerm.length > 0){
						for(var c = 0; c < ecs.length; c++){
							ecs[c].terminateInstances({InstanceIds: instToTerm}, function(err, data){
								//console.log(err);
								//console.log(data);
							});
						}
					}
				}
				
				requests--;
				
				if(requests == 0){
					console.log("cancelling requests: ", requestsToCancel);
					console.log("cancelling instances: ", instToTerm);
					dfd.resolve();
				}
			}
			else{
				requests--;
				
				if(requests == 0){
					console.log("cancelling requests: ", requestsToCancel);
					console.log("cancelling instances: ", instToTerm);
					dfd.resolve();
				}
			}
		});
	}
	
	// when analysis of accounts and active requests is finished, make requests if the prices are acceptable
	dfd.done(function(){
		var maxRequests = 40; // goes from 0 to 40, used to scale back requests
		console.log("account " + accountIndex + " has " + totalSpots + " requests, " + totalInst + " running");
		if(totalSpots < maxRequests && underPrice.length > 0 && autopilot === "enabled"){
			//find region of lowest priced zone
			
			var reg = 0;
			var aZone = 0;
			var a = 0;
			
			// check to see if all the regions with acceptable prices have the same price
			var allSame = true;
			for(var b = 0; b < underPrice.length; b++){
				for(var c = b+1; c < underPrice.length; c++){
					if(underPrice[b].price != underPrice[c].price)
						allSame = false;
				}
				//console.log("hi");
			}
			
			if(allSame){ // if all acceptable regions have the same price, pick a random zone and make instances in it
				aZone = Math.floor(Math.random() * underPrice.length);
				console.log("All same price, we used zone " + underPrice[aZone].zone);
			}
			
			while(a < regions.length){
				if(underPrice[aZone].zone.indexOf(regions[a]) != -1){
					reg = a;
					//console.log(a);
				}
				a++;
				//console.log(a);
			}
			
			// init ec2 in region
			ec2 = new AWS.EC2({region: regions[reg]});
			
			// spot instance request parameters
			var spotParams = {
				SpotPrice: ("" + cartelPrice), // "" to make cartelPrice into a string
				//InstanceCount: 3 - totalSpots,
				Type: "one-time",
				LaunchSpecification : {
					ImageId: (underPrice[aZone].os === "Linux/UNIX") ? linAMIs[reg] : winAMIs[reg], 
					InstanceType : "g2.2xlarge",
					UserData: btoa(userData), // ec2 expects userdata encoded with base64
					Placement: {
						AvailabilityZone: underPrice[aZone].zone
					}
				}
			};
			
			// make spot instance requests
			// this makeSpot() function call is recursive on request failures
			// so it starts requesting a total of "maxRequests - totalSpots" requests
			// and decrements until it succeeds making requests or the counter reaches 0
			makeSpot(spotParams, maxRequests - totalSpots);
		}
		else{
			console.log("Didn't bother making instances."); // on !(totalSpots < maxRequests && underPrice.length > 0 && autopilot === "enabled")
		}

		accountIndex++;
		if(accountIndex >= accounts.length){
			//console.log("hi");
			accountIndex = 0;
			if(autopilot === "canceling"){
				autopilot = "disabled";
			}
		}
		$.cookie("accountIndex", accountIndex, {expires: 9999});
		$.cookie("autopilot", autopilot, {expires: 9999});
		
		if(autopilot === "canceling"){
			setTimeout(function(){
				window.location.reload(true);
			}, 5000); // 5s delay before refresh and move onto next account
			
		}
	});
	
	return dfd;
}

// recursive spot instance request helper
function makeSpot(spotParams, numSpots){
	//var zoneIndex = 0;
	//var reg = 0;
	//console.log(spotParams.LaunchSpecification.Placement.AvailabilityZone);
	spotParams.InstanceCount = numSpots;
	ec2.requestSpotInstances(spotParams, function(err, data){
		if(err && numSpots > 1){ // make more requests for less instances on an error
			console.log(err);
			/*zoneIndex++;
			if(zoneIndex < underPrice.length){
				for(var i = 0; i < regions.length; i++){
					if(spotParams.LaunchSpecification.Placement.AvailabilityZone.indexOf(regions[i]) != -1)
						reg = i;
				}
				
				spotParams.LaunchSpecification.Placement.AvailabilityZone = underPrice[zoneIndex].zone;
				spotParams.LaunchSpecification.ImageId = (underPrice[zoneIndex].os === "Linux/UNIX") ? linAMIs[reg] : winAMIs[reg];
				makeSpot(spotParams, zoneIndex);
			}*/
			//spotParams.InstanceCount = numSpots - 1;
			if(numSpots > 20){
				makeSpot(spotParams, numSpots - 10);
			}
			else{
				setTimeout(function(){
					makeSpot(spotParams, numSpots - 1);
				}, 2000);
			}
			
			//return err;
			//if(){
			//	spotParams.LaunchSpecification.Placement.AvailabilityZone = underPrice[1].zone;
			//}
		}
		else if(numSpots > 1){ // log to console on successful request
			console.log("made " + numSpots + " requests: ", data);
		}
		else if(err){ // log to console thta we couldn't make any instances
			console.log("Failed to make instances");
		}
	});
}
