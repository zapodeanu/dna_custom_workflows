(function executeRule(current, previous /*null when async*/) {

	var util = new DNA_Utils();
	//var instance_name = gs.getProperty('x_caci_cisco_dna.servicenow_instance');
	var instance_name = gs.getProperty('glide.servlet.uri');
	var launch_link = instance_name + "nav_to.do?uri=incident.do?sys_id=" + current.sys_id;
	gs.info("Launch_link :"+ launch_link);
	/*
	var alertsPointingToIncident = new GlideRecord("em_alert");
	alertsPointingToIncident.addQuery("incident", current.sys_id);
	alertsPointingToIncident.query();
	while( alertsPointingToIncident.next() ) {
		gs.info("Inside Glide Method");
		var parser = new global.JSON();
		var parsed = parser.decode( alertsPointingToIncident.additional_info);
		var eventId = parsed.eventId;
		util.sendStateDetails("Incident",current.state.getDisplayValue(),current.sys_id, current.number,current.short_description,launch_link, eventId, current.sys_updated_on);
		util.debugLog("Capturing entity id to send to DNA. Event id = " + eventId );
	}*/

	var title = '';
	var severity = '';
	var enrichmentInfo = launch_link;
	var workflowIndicator = 'Incident';
	var id = current.x_caci_cisco_dna_cisco_dna_comments ;
	var domain = current.x_caci_cisco_dna_issue_category ;

	var gdtime = new GlideDateTime();
	gdtime.setValue(current.getValue('sys_updated_on'));
	gdtime.add(1000);
	var statusTime = gdtime.getNumericValue();
	statusTime = Number(statusTime);
	gs.info("Updated time: "+ statusTime);

	var ip_address = current.x_caci_cisco_dna_cisco_dna_center_ip_address;

	util.sendIncidentDetails(current.state.getDisplayValue(),current.sys_id, current.number,current.short_description,enrichmentInfo , id,  statusTime,current.priority.getDisplayValue(), current.assigned_to.getDisplayValue(), current.cmdb_ci.getDisplayValue(), domain ,current.category, title, severity, workflowIndicator, ip_address);
	util.debugLog("Capturing entity id to send to DNA. Event id = " + current.x_caci_cisco_dna_cisco_dna_comments );
	util.debugLog("Capturing entity id to send to DNA. Entity id = " + current.number );
	util.debugLog("Capturing state change to send to DNA. State = " + current.state.getDisplayValue() );
	util.debugLog("Capturing entity id to send to DNA. Entity Sys id = " + current.sys_id );
	util.debugLog("Capturing Description to send to DNA. Description = " + current.short_description );


})(current, previous);
// DNA utils
