(function executeRule(current, previous /*null when async*/ ) {

    /*
    This app will be triggered when a new "Additional Comment" will be added to an incident.
    The comment must be formatted in this way:
    	device: deviceHostname
    	command: CLI command
    Example of a valid comment:
    	device: PDX-M
    	command: show ip int bri
    The app will obtain a Cisco DNA Center token, identify the device UUID for the specified device,
    it will send the command with the command runner APIs and retrieve the output.
    It will post the command output in the incident.
    */

    // retrieve the last comment from incident

    var lastComment = current.comments.getJournalEntry(1);
    gs.info("DNA Custom Workflow --  last comment: \n" + lastComment);

    lastCommentList = lastComment.split("\n");

	// retrieve the Cisco DNA Center IP address from current table and preconfigured controllers

    var dnacIpAddress = current.x_caci_cisco_dna_cisco_dna_center_ip_address;
    gs.info("DNA Custom Workflow --  Cisco DNA Center:  " + dnacIpAddress);

	// find out the username, password in midserver for the DNAC

	var prop = new GlideRecord('x_caci_cisco_dna_cisco_dna_controller');
        prop.addQuery('ip_address_of_dna_engine_controller', dnacIpAddress);

        prop.query();
        while (prop.next()) {

            //var password = prop.password_of_the_dna_engine_controller.getDecryptedValue();
            var username = prop.getValue('user_name');
            var midserver = prop.getDisplayValue('mid_server_used_to_conenct_to_dnac');
		}
	gs.info("DNA Custom Workflow --  Cisco DNA Center username :  " + username);
	gs.info("DNA Custom Workflow --  Cisco DNA Center MID server :  " + midserver);
	//gs.info("DNA Custom Workflow --  Cisco DNA Center password :  " + password);

	var password = "***REMOVED***";

    // verify the last comment includes the device hostname

    if ("device" == (lastCommentList[1].split(":"))[0]) {

        // parse the device hostname and command
        deviceHostname = (lastCommentList[1].replace(" ", "")).split(":")[1];
        gs.info("DNA Custom Workflow --  Device hostname:  " + deviceHostname);
        command = (lastCommentList[2].replace(" ", "")).split(":")[1];
        gs.info("DNA Custom Workflow --  Command:  " + command);

        try {

            // API call to obtain the Cisco DNA Center token

            gs.info("DNA Custom Workflow  --  Calling the GET Auth Token API");
            var getToken = new sn_ws.RESTMessageV2();
            getToken.setEndpoint("https://" + dnacIpAddress + "/dna/system/api/v1/auth/token");
            getToken.setHttpMethod("POST");
            getToken.setBasicAuth(username, password);
            getToken.setRequestHeader("Accept", "application/json");
            getToken.setRequestHeader("Content-Type", "application/json");
            getToken.setMIDServer(midserver);
            var responseToken = getToken.execute();
            var bodyGetToken = responseToken.getBody();
            var HttpStatusGetToken = responseToken.getStatusCode();

            gs.info("DNA Custom Workflow --  GET Token Status Code:  " + HttpStatusGetToken);

            var dnacToken = JSON.parse(bodyGetToken).Token;
            //gs.info("DNA Custom Workflow --  Token:  " + dnacToken);

            // API to get the device uuid using the device hostname

            gs.info("DNA Custom Workflow  --  Calling the GET device API");
            var getDevice = new sn_ws.RESTMessageV2();
            getDevice.setEndpoint("https://" + dnacIpAddress + "/dna/intent/api/v1/network-device?hostname=" + deviceHostname);
            getDevice.setHttpMethod("GET");
            getDevice.setRequestHeader("Accept", "application/json");
            getDevice.setRequestHeader("Content-Type", "application/json");
            getDevice.setRequestHeader("x-auth-token", dnacToken);
            getDevice.setMIDServer(midserver);
            var responseGetDevice = getDevice.execute();
            var bodyGetDevice = responseGetDevice.getBody();
            var HttpStatusGetDevice = responseGetDevice.getStatusCode();

            gs.info("DNA Custom Workflow --  GET Device Status Code:  " + HttpStatusGetDevice);
            //gs.info("DNA Custom Workflow --  GET device details:  " + bodyGetDevice);

            var deviceId = JSON.parse(bodyGetDevice).response[0].id;
            gs.info("DNA Custom Workflow --  Device Id:  " + deviceId);

            // API call to Command Runner

            gs.info("DNA Custom Workflow  --  Calling the POST command runner API");

            var CRtoDNAC = {
                "commands": [
                    command
                ],
                "deviceUuids": [
                    deviceId
                ]
            };

            var postCommandRunner = new sn_ws.RESTMessageV2();
            postCommandRunner.setEndpoint("https://" + dnacIpAddress + "/dna/intent/api/v1/network-device-poller/cli/read-request");
            postCommandRunner.setHttpMethod("POST");
            postCommandRunner.setRequestHeader("Accept", "application/json");
            postCommandRunner.setRequestHeader("Content-Type", "application/json");
            postCommandRunner.setRequestHeader("x-auth-token", dnacToken);
            postCommandRunner.setMIDServer(midserver);
            postCommandRunner.setRequestBody(JSON.stringify(CRtoDNAC));
            var responsePostCommandRunner = postCommandRunner.execute();
            var bodyPostCommandRunner = responsePostCommandRunner.getBody();
            var HttpStatusPostCommandRunner = responsePostCommandRunner.getStatusCode();

            gs.info("DNA Custom Workflow --  POST Command Runner Status Code:  " + HttpStatusPostCommandRunner);
            //gs.info("DNA Custom Workflow --  Command Runner Response:  " + bodyPostCommandRunner);

            var taskId = JSON.parse(bodyPostCommandRunner).response.taskId;
            gs.info("DNA Custom Workflow --  Task Id:  " + taskId);

			// wait for 2 seconds

            var sleepTimer = 2000; // 2 seconds

            var endSleep = new GlideDuration().getNumericValue() + sleepTimer;
            while (new GlideDuration().getNumericValue() < endSleep) {
                //wait
            }

            // GET the task Id status

            var getTask = new sn_ws.RESTMessageV2();
            getTask.setEndpoint("https://" + dnacIpAddress + "/dna/intent/api/v1/task/" + taskId);
            getTask.setHttpMethod("GET");
            getTask.setRequestHeader("Accept", "application/json");
            getTask.setRequestHeader("Content-Type", "application/json");
            getTask.setRequestHeader("x-auth-token", dnacToken);
            getTask.setMIDServer(midserver);
            var requestGetTask = getTask.execute();
            var bodyGetTask = requestGetTask.getBody();
            var HttpStatusGetTask = requestGetTask.getStatusCode();

            gs.info("DNA Custom Workflow --  GET Task Status Code:  " + HttpStatusGetTask);
            //gs.info("DNA Custom Workflow --  GET Task Response:  " + bodyGetTask);

			var status = JSON.parse(bodyGetTask).response.progress;
			var fileId =  JSON.parse(status).fileId;
			gs.info("DNA Custom Workflow --  File Id:  " + fileId);

			// GET the content for the file Id

            var getFile = new sn_ws.RESTMessageV2();

            getFile.setEndpoint("https://" + dnacIpAddress + "/dna/intent/api/v1/file" + fileId);
            getFile.setHttpMethod("GET");
            getFile.setRequestHeader("Accept", "application/json");
            getFile.setRequestHeader("Content-Type", "application/json");
            getFile.setRequestHeader("x-auth-token", dnacToken);
            getFile.setMIDServer(midserver);
            var responseGetFile = getFile.execute();
            var bodyGetFile = responseGetFile.getBody();
            var HttpStatusGetFile = responseGetFile.getStatusCode();

            gs.info("DNA Custom Workflow --  GET File Status Code:  " + HttpStatusGetFile);
            //gs.info("DNA Custom Workflow --  GET File Response:  " + bodyGetFile);

			var commandOutputJson = JSON.parse(bodyGetFile);
			var commandOutput = commandOutputJson[0].commandResponses.SUCCESS[command];

			gs.info("DNA Custom Workflow --  Command Output:  \n" + commandOutput);

			//update incident with the command output

			current.comments = "Command Output:\n\n" + commandOutput;
			current.update();

            gs.info("DNA Custom Workflow --  End of Commmand Runner App");

        } catch (ex) {
            var message = ex.getMessage();
        }
    }

})(current, previous);