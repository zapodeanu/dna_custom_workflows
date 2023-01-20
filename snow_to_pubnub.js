
(function executeRule(current, previous /*null when async*/) {

	var lastComment;
	var lastCommentList;
	var uuid = 'Snow_to_PubNub';
	var ticket = current.number.toString();
	var deviceHostname;
	var commandType;
	var commands;

	//Display an information message for each change to the record
	var gru = GlideScriptRecordUtil.get(current);

	//Convert to JavaScript Arrays
    gs.include('j2js');
    changedFields = j2js(gru.getChangedFields());
    changedValues = j2js(gru.getChanges());

	for(var i = 0; i < changedFields.length; i++){
		if (changedFields[i] == "Additional comments" ){
			lastComment = changedValues[i];
		}
	}
	lastCommentList = lastComment.split( "\n" );

	if ("device" == (lastCommentList[0].split( ":" ))[0]){

		deviceHostname = (lastCommentList[0].replace(" ", "")).split(":")[1];
		commandType = (lastCommentList[1].replace(" ", "")).split(":")[1];
		commands = (lastCommentList[2].replace(" ", "")).split(":")[1];

		var dataToPubNub = {
			"source_uuid" : uuid,
			"incident" : ticket,
			"command_type" : commandType,
			"device" : deviceHostname,
			"commands" : commands
		};

		try {
			var request = new sn_ws.RESTMessageV2('PubNub_REST_POST', 'post');
			request.setStringParameterNoEscape('pubkey', '***REMOVED***');
			request.setStringParameterNoEscape('uuid', uuid);
			request.setStringParameterNoEscape('subkey', '***REMOVED***');
			request.setStringParameterNoEscape('channel', 'IOS_XE_PUBNUB');
			request.setRequestBody(JSON.stringify(dataToPubNub));
			var response = request.execute();
			var responseBody = response.getBody();
			var httpStatus = response.getStatusCode();
		}
		catch(ex) {
			var message = ex.getMessage();
		}
	}
})(current, previous);