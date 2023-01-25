 /*
 *  This application is included in the scoped app: "Cisco DNA Custom Workflows". This App is in development.
 *  The script is triggered when a new "Additional Comment" is added to an incident.
 *  The comment must be formatted in this way:
 *      device: deviceHostname
 *      command: CLI command
 *
 *  Example of a valid additional comment:
 *      device: PDX-M
 *      command: show ip int bri
 *
 *  The app will call the Cisco DNA Center REST APIs to:
 *  - obtain a Cisco DNA Center token
 *  - identify the device UUID for the device with the hostname
 *  - send the CLI command to device with the command runner APIs
 *  - retrieve the command output
 *  - post the command output in the incident notes
 *
 *  All application logs start with "DNA Custom Workflow --  "
 *  @author gabi@cisco.com (Gabriel Zapodeanu)
 *  Thank you szapodeanu19@gmail.com (Stephan Zapodeanu) for your contributions to this app development.
 */

(function executeRule(current, previous /*null when async*/ ) {
    // Retrieve the last comment from incident
    var lastComment = current.comments.getJournalEntry(1);
    gs.info("DNA Custom Workflow --  last comment: \n" + lastComment);

    lastCommentList = lastComment.split("\n");

	// Retrieve the Cisco DNA Center IP address from current table of preconfigured controllers
    var dnacIpAddress = current.x_caci_cisco_dna_cisco_dna_center_ip_address;
    gs.info("DNA Custom Workflow --  Cisco DNA Center:  " + dnacIpAddress);

	// Get the username and midserver for the DNAC
	var prop = new GlideRecord('x_caci_cisco_dna_cisco_dna_controller');
        prop.addQuery('ip_address_of_dna_engine_controller', dnacIpAddress);
        prop.query();
        while (prop.next()) {
            var username = prop.getValue('user_name');
            var midserver = prop.getDisplayValue('mid_server_used_to_conenct_to_dnac');
            //var password = prop.password_of_the_dna_engine_controller.getDecryptedValue();
		}
	gs.info("DNA Custom Workflow --  Cisco DNA Center username :  " + username);
	gs.info("DNA Custom Workflow --  Cisco DNA Center MID server :  " + midserver);

    // Set password (for demo)
	var PASSWORD = "***REMOVED***";

    // Verify the last comment includes the device hostname
    if ("device" === (lastCommentList[1].split(":"))[0]) {

        // Parse the device hostname and command
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
            getToken.setBasicAuth(username, PASSWORD);
            getToken.setRequestHeader("Accept", "application/json");
            getToken.setRequestHeader("Content-Type", "application/json");
            getToken.setMIDServer(midserver);
            var responseToken = getToken.execute();
            var bodyGetToken = responseToken.getBody();
            var HttpStatusGetToken = responseToken.getStatusCode();

            gs.info("DNA Custom Workflow --  GET Token Status Code:  " + HttpStatusGetToken);

            var dnacToken = JSON.parse(bodyGetToken).Token;  // Cisco DNA Center Token valid for 60 minutes

            //gs.info("DNA Custom Workflow --  Token:  " + dnacToken); // For Troubleshooting

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
            //gs.info("DNA Custom Workflow --  GET device details:  " + bodyGetDevice); // For Troubleshooting

            var deviceId = JSON.parse(bodyGetDevice).response[0].id;
            gs.info("DNA Custom Workflow --  Device Id:  " + deviceId);

            // Payload for API call to Command Runner
            gs.info("DNA Custom Workflow  --  Calling the POST command runner API");

            var CRtoDNAC = {
                "commands": [
                    command
                ],
                "deviceUuids": [
                    deviceId
                ]
            };

            // API call to Command Runner
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
            //gs.info("DNA Custom Workflow --  Command Runner Response:  " + bodyPostCommandRunner); // For Troubleshooting

            var taskId = JSON.parse(bodyPostCommandRunner).response.taskId;
            gs.info("DNA Custom Workflow --  Task Id:  " + taskId);

			// Update incident with the status
			current.comments = "Command:  " + command + ",    Sent to device:  " + deviceHostname;
			current.update();

			// 3 second timer (in ms), wait for execution of command runner to complete
            var sleepTimer = 3000;
            var endSleep = new GlideDuration().getNumericValue() + sleepTimer;
            while (new GlideDuration().getNumericValue() < endSleep) {
                // Wait
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
            //gs.info("DNA Custom Workflow --  GET Task Response:  " + bodyGetTask); // For Troubleshooting

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
            //gs.info("DNA Custom Workflow --  GET File Response:  " + bodyGetFile); // For Troubleshooting

			var commandOutputJson = JSON.parse(bodyGetFile);
			var commandOutput = commandOutputJson[0].commandResponses.SUCCESS[command];
			gs.info("DNA Custom Workflow --  Command Output:  \n" + commandOutput);

			// Update incident with the command output
			current.comments = "Command Output:\n\n" + commandOutput;
			current.update();

            gs.info("DNA Custom Workflow --  End of Command Runner App");

        } catch (ex) {
            var message = ex.getMessage();

            // If error occurs, log to application logs
            gs.info("DNA Custom Workflow --  Error: " + message);
            current.comments = "DNA Custom Workflow --  Error:\n\n" + message;
            current.update();
        }
    }

})(current, previous);