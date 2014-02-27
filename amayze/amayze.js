var accounts = [];
var numAccounts = 0;
// r.z, rz, dot1, dot2, dot3, dot4, ill, r.ufei.z, ru.fei.z, ruf.ei.z
// r.u.feiz, r.u.f.eiz, r.u.f.e.iz, r.u.f.e.i.z, r.u.fei.z, r.u.f.ei.z
// r.u.fe.i.z
var regions = ["us-east-1", "us-west-2", "us-west-1", "eu-west-1"];
// in format: east1, west2, west1, euwest1 
var linAMIs = [] /*= ["ami-11c4fc78", "ami-08c9aa38", "ami-96dce1d3", "ami-b49465c3"]*/;
var winAMIs = [] /*= ["ami-e99da480", "ami-de7310ee", "ami-962c11d3", "thereIsNoAMIHere"]*/;


// startup script for windows configuration
var userData; /*= '<script>\n' + 
			'echo C:\\Doge\\dogecoinminer\\minerd.exe -a scrypt --url=stratum+tcp://us-east.multipool.us:3352 -u rufeiz.amazonc -p x > C:\\startcpu.bat \n' +
			'echo C:\\Doge\\cudaminer\\x64\\cudaminer.exe -o stratum+tcp://us-east.multipool.us:3352 -u rufeiz.amazong -p x -i 0 -l K16x16 > C:\\startcuda.bat \n' +
			'<\/script>';
*/
var cartelPrice = .1;
var underPrice = [];
var autopilot = "disabled";
var accountIndex = 0;

function init(){
	// init saved values from cookies
	if($.cookie("cartelPrice") !== undefined){
		cartelPrice = $.cookie("cartelPrice");
	}
	document.getElementById("cartelPrice").value = cartelPrice;
		
	if($.cookie("autopilot") !== undefined){
		autopilot = $.cookie("autopilot");
	}
	$('#autoIndicator').text("Autopilot is " + autopilot);	
	
	if($.cookie("numAccounts") !== undefined){
		numAccounts = $.cookie("numAccounts");
	}
	$.cookie("numAccounts", numAccounts, {expires: 9999});
	
	var idHTML = "Account IDs: <br />";
	var secretHTML = "Secret Keys: <br />";
	//var enableHTML = "Enabled: <br />";
	if($.cookie("accessID0") !== undefined && $.cookie("secret0") !== undefined){
		var num = 0;
		var idStr = "accessID" + num;
		var secretStr = "secret" + num;
		//var enableStr = "enable" + num;
		do{
			accounts[num] = {accessID: $.cookie(idStr), secret: $.cookie(secretStr)/*, enabled: $.cookie(enableStr)*/};
			idHTML += "<br />"+ num + " <input type=\"text\" size=\"30\" id=\"" + idStr + "\" name=\"" + idStr + "\" value=\"" + $.cookie(idStr) + "\" onblur=\"updateAccts()\">";
			secretHTML += "<br /><input type=\"text\" size=\"50\" id=\"" + secretStr + "\" name=\"" + secretStr + "\" value=\"" + $.cookie(secretStr) + "\" onblur=\"updateAccts()\">";
			//enableHTML += "<br /><input type=\"checkbox\" id=\"" + enableStr + "\" name=\"" + enableStr + "\" checked=\"" + $.cookie(enableStr) + "\" onclick=\"updateAccts()\">";
			num++;
			idStr = "accessID" + num;
			secretStr = "secret" + num;
			//enableStr = "enable" + num;
		} while($.cookie(idStr) !== undefined && $.cookie(secretStr) !== undefined/* && $.cookie(enableStr) !== undefined*/);
		numAccounts = num;
		$.cookie("numAccounts", numAccounts, {expires: 9999});
	}		
	else{
		//console.log("hi");
		idHTML += "<br />0 <input type=\"text\" size=\"30\" id=\"accessID0\" name=\"accessID0\" onblur=\"updateAccts()\">";
		secretHTML += "<br /><input type=\"text\" size=\"50\" id=\"secret0\" name=\"secret0\" onblur=\"updateAccts()\">";
		//enableHTML += "<br /><input type=\"checkbox\" id=\"enable0\" name=\"enable0\" checked=\"true\" onclick=\"updateAccts()\">";
	}
	console.log(accounts);
	
	if($.cookie("userData") !== undefined){
		userData = $.cookie(userData);
	}
	
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
	
	if($.cookie("userData") !== undefined){
		userData = $.cookie("userData");
		document.getElementById("userData").value = $.cookie("userData");
	}
	
	$('#ids').html(idHTML);
	$('#secrets').html(secretHTML);
	$('#amis').html(amiHTML);
	//$('#enables').html(enableHTML);
	//document.getElementById("secrets").innerHTML = idHTML;
	//console.log(idHTML);
	//document.getElementById("setIndex").value = accountIndex;
	
	if($.cookie("accountIndex") !== undefined){
		accountIndex = $.cookie("accountIndex");
		if(accountIndex > accounts.length){
			accountIndex = 0;
			$.cookie("accountIndex", accountIndex, {expires: 9999});
		}
	}		
	//document.getElementById("setIndex").value = accountIndex;
	
	//console.log(accounts[0]);
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
			if(autopilot === "canceling"){
				autopilot = "disabled";
				$('#autoIndicator').text("Autopilot is " + autopilot);	
			}
		}
	}
	console.log(accounts[accountIndex]);
	document.getElementById("setIndex").value = accountIndex;
	
	$.cookie("cartelPrice", cartelPrice, {expires: 9999});
	$.cookie("autopilot", autopilot, {expires: 9999});
	$.cookie("accountIndex", accountIndex, {expires: 9999});
	
	AWS.config.update({accessKeyId: accounts[accountIndex].accessID, secretAccessKey: accounts[accountIndex].secret, region: regions[0]});
	//AWS.config.region = regions[0];
	
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

function refreshPrices(){	
	var regionIndex = 0;
	//var priceText = "";
	var aZones = [];
	var ecs = [];
	var numRequests = 0; 
	var dfd = $.Deferred();

	updatePrice();

	for(regionIndex = 0; regionIndex < regions.length; regionIndex++){
		ecs.push(new AWS.EC2({region: regions[regionIndex]}));
		
		ecs[regionIndex].describeAvailabilityZones(function(err, data){
			//console.log(err);
			//console.log(data);
			for(var i = 0; i < data.AvailabilityZones.length*2; i++){ // length * 2 to check for linux and windows
				numRequests++;
				var priceParams = {
					InstanceTypes: ["g2.2xlarge"],
					MaxResults: 1,
					AvailabilityZone: data.AvailabilityZones[Math.floor(i/2)].ZoneName,
					ProductDescriptions: (i % 2 == 0) ? ["Linux/UNIX"] : ["Windows"]
					//Filters: [{Name: 'availability-zone', Values: [thisZone.ZoneName]}]
				};
				//console.log(i);

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
					numRequests--;
					if(numRequests == 0){ // all sync
						var lowestLin;
						var lowestWin;
						var sortedZones = [];
						var priceText = "";
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
									if(aZones[b].os === ("Linux/UNIX") && (lowestLin == null || aZones[b].price < lowestLin.price)){
										lowestLin = aZones[b];
										//console.log("hi");
									} 
									else if(aZones[b].os === ("Windows") && (lowestWin == null || aZones[b].price < lowestWin.price)){
										lowestWin = aZones[b];
									}
									//console.log("eng");
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
						console.log(lowestLin);
						console.log(lowestWin);
						
						priceText += "Lowest prices are <br /> " + lowestLin.price + " for " + lowestLin.os + " in " + lowestLin.zone + "<br />";
						priceText += lowestWin.price + " for " + lowestWin.os + " in " + lowestWin.zone + "<br />";
						
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
		});
	}
	
	return dfd;
	
}

function updatePrice(){
	cartelPrice = document.getElementById("cartelPrice").value;
	$.cookie("cartelPrice", cartelPrice, {expires: 9999});
}

function addRows(){
	var idStr = "accessID" + numAccounts;
	var secretStr = "secret" + numAccounts;
	//var enableStr = "enable" + numAccounts;
	// numAccounts doubles as current index
	var idHTML = "<br />"+ numAccounts + " <input type=\"text\" size=\"30\" id=\"" + idStr + "\" name=\"" + idStr + "\" onblur=\"updateAccts()\">";
	var secretHTML = "<br /><input type=\"text\" size=\"50\" id=\"" + secretStr + "\" name=\"" + secretStr + "\" onblur=\"updateAccts()\">";
	//var enableHTML = "<br /><input type=\"checkbox\" id=\"" + enableStr + "\" name=\"" + enableStr + "\" checked=\"true\" onclick=\"updateAccts()\">";
	$.cookie(idStr, "", {expires: 9999});
	$.cookie(secretStr, "", {expires: 9999});
	numAccounts++;
	$.cookie("numAccounts", numAccounts, {expires: 9999});
	
	$('#ids').append(idHTML);
	$('#secrets').append(secretHTML);
	//$('#enables').append(enableHTML);
	//numAccounts++;
	//$.cookie("numAccounts", numAccounts);
}

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

function updateUserData(){
	userData = document.getElementById("userData").value;
	console.log(userData);
	$.cookie("userData", userData, {expires: 9999});
}

/*function cancelHelper(){
	var dfd = $.Deferred;
	var ecs = [];
	
	if(accountIndex < accounts.length){
		while(accountIndex < accounts.length && (document.getElementById("accessID" + accountIndex).value === "" || document.getElementById("secret" + accountIndex).value === ""))
			accountIndex++;
			
		AWS.config.update({accessKeyId: accounts[accountIndex].accessID, secretAccessKey: accounts[accountIndex].secret, region: regions[0]});
		
		for(regionIndex = 0; regionIndex < regions.length; regionIndex++){
			ecs.push(new AWS.EC2({region: regions[regionIndex]}));
			
			ecs[regionIndex].describeAvailabilityZones(function(err, data){
				//console.log(err);
				//console.log(data);
				for(var i = 0; i < data.AvailabilityZones.length*2; i++){ // length * 2 to check for linux and windows
					numRequests++;
					
				}
		
			});
		}
	
		dfd.done(function(){
			if(accountIndex < accounts.length)
				cancelHelper();
		});
	}
}
*/

function setAccIndex(){
	accountIndex = document.getElementById("setIndex").value;
	$.cookie("accountIndex", accountIndex, {expires: 9999});
}

function cancelAll(){
	accountIndex = 0;
	$.cookie("accountIndex", accountIndex, {expires: 9999});
	$.cookie("autopilot", "canceling", {expires: 9999});
	$('#autoIndicator').text("Autopilot is " + $.cookie("autopilot"));
	window.location.reload(true);
}

function toggleAuto(){
	if(autopilot === "disabled")
		autopilot = "enabled";
	else if(autopilot === "enabled")
		autopilot = "disabled";
	else if(autopilot === "canceling")
		autopilot = "enabled";
		
	$.cookie("autopilot", autopilot, {expires: 9999});
	$('#autoIndicator').text("Autopilot is " + $.cookie("autopilot"));
	if(autopilot === "enabled"){
		window.location.reload(true); // start auto immediately
	}
	//console.log("yo");
}

function autoPilot(){
	// super cool AI shit
	//if(underPrice.length > 0){
	var ecs = [];
	var dfd = $.Deferred();
	var requests = 0;
	var totalSpots = 0;
	var totalInst = 0;
	var requestsToCancel = []; // if the previous spot price > current cartel price
	var instToTerm = [];	   // associated instance IDs for requests fulfilled
	
	for(var i = 0; i < regions.length; i++){
		requests++;
		ecs[i] = new AWS.EC2({region: regions[i]});
		//console.log(i);
		ecs[i].describeInstances(function(err,data){
			console.log(data);	
			for(var i = 0; i < data.Reservations.length; i++){
				if(data.Reservations[i].Instances[0].State.Name === "running"){
					totalInst++;
					if(autopilot === "canceling")
						instToTerm.push(data.Reservations[i].Instances[0].InstanceId);
				}
			}
		});
		
		ecs[i].describeSpotInstanceRequests(function(err, data){
			console.log(data);
			requests--;
			for(var a = 0; a < data.SpotInstanceRequests.length; a++){
				var thisReq = data.SpotInstanceRequests[a];
				if(thisReq.LaunchSpecification.InstanceType === "g2.2xlarge"){
					if((thisReq.State === "open" || thisReq.State === "active") /*&& (thisReq.LaunchSpecification.Placement.AvailabilityZone === )*/){
						totalSpots++;
						var inUnderList = false;
						//if(thisReq.State === "active")
							//totalInst++;
						for(var ind = 0; ind < underPrice.length; ind++){
							if(thisReq.LaunchSpecification.Placement.AvailabilityZone === underPrice[ind].zone)
								inUnderList = true;
						}
						if(autopilot === "canceling" || parseFloat(thisReq.SpotPrice) != cartelPrice || (underPrice.length > 0 && parseFloat(thisReq.SpotPrice) > underPrice[0].price && thisReq.LaunchSpecification.Placement.AvailabilityZones != underPrice[0].zone && (thisReq.Status.Code.indexOf("oversubscribed") != -1 || thisReq.Status.Code.indexOf("price-too-low") != -1)) || (thisReq.SpotPrice > cartelPrice && !inUnderList && underPrice.length > 0)){
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
					}
				}	
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
			if(requests == 0){
				console.log(requestsToCancel);
				console.log(instToTerm);
				dfd.resolve();
			}
		});
	}
	
	dfd.done(function(){
		console.log("account " + accountIndex + " has " + totalSpots + " requests, " + totalInst + " running");
		if(totalSpots + totalInst < 10 && underPrice.length > 0 && autopilot === "enabled"){
			//find region of lowest priced zone
			
			var reg = 0;
			var a = 0;
			while(a < regions.length){
				if(underPrice[0].zone.indexOf(regions[a]) != -1){
					reg = a;
					//console.log(a);
				}
				a++;
				//console.log(a);
			}
			
			// init ec2 in region
			ec2 = new AWS.EC2({region: regions[reg]});
			
			//console.log(reg);
			/*ec2.describeAccountAttributes(function(err, data){
				console.log(data);
			});*/
			// spot instance request parameters
			var spotParams = {
				SpotPrice: ("" + cartelPrice), // "" to make cartelPrice into a string
				InstanceCount: 10 - totalSpots - totalInst,
				Type: "one-time",
				LaunchSpecification : {
					ImageId: (underPrice[0].os === "Linux/UNIX") ? linAMIs[reg] : winAMIs[reg], 
					InstanceType : "g2.2xlarge",
					UserData: btoa(userData), // ec2 expects userdata encoded with base64
					Placement: {
						AvailabilityZone: underPrice[0].zone
					}
				}
			};
			
			makeSpot(spotParams, 0);
			
			//var temp = makeSpot(spotParams);
			//while(makeSpot(spotParams).code === "MaxSpotInstanceCountExceeded" && underPrice.length > 1 && zoneIndex < underPrice.length){
				
			//}
		}
		//else
			//console.log("account " + accountIndex )
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
			}, 5000); // 5s delay before next account
			
		}
	});
	
	return dfd;
}

function makeSpot(spotParams, zoneIndex){
	//var zoneIndex = 0;
	console.log(spotParams.LaunchSpecification.Placement.AvailabilityZone);
	ec2.requestSpotInstances(spotParams, function(err, data){
		if(err){
			console.log(err);
			zoneIndex++;
			if(zoneIndex < underPrice.length){
				for(var i = 0; i < regions.length; i++){
					if(spotParams.LaunchSpecification.Placement.AvailabilityZone.indexOf(regions[i]) != -1)
						reg = i;
				}
				
				spotParams.LaunchSpecification.Placement.AvailabilityZone = underPrice[zoneIndex].zone;
				spotParams.LaunchSpecification.ImageId = (underPrice[zoneIndex].os === "Linux/UNIX") ? linAMIs[reg] : winAMIs[reg];
				makeSpot(spotParams, zoneIndex);
			}
			//return err;
			//if(){
			//	spotParams.LaunchSpecification.Placement.AvailabilityZone = underPrice[1].zone;
			//}
		}
		else{
			console.log(data);
			//return null;
		}
		
		//console.log("account " + accountIndex + ", 10");
	});
}
