/**
 * Documentation for these functions is in a KB article here:
 *  /nav_to.do?uri=%2Fkb_view.do%3Fsys_kb_id%3D485eeafddb57ba00f27978b5ae961955
 */

var DNA_Utils = Class.create();

DNA_Utils.prototype = {
    initialize: function() {},



    buildRESTMessage: function(whichMethod, ip_address) {
        var r = new sn_ws.RESTMessageV2('x_caci_cisco_dna.DNA', whichMethod);
        //r.setStringParameterNoEscape('cluster_ip', gs.getProperty('x_caci_cisco_dna.cluster_ip_port'));
        var prop = new GlideRecord('x_caci_cisco_dna_cisco_dna_controller');

        prop.addQuery('ip_address_of_dna_engine_controller', ip_address);
        prop.query();

        while (prop.next()) {

            var dnac_ip = prop.getValue('ip_address_of_dna_engine_controller');
        }
        r.setStringParameterNoEscape('cluster_ip', dnac_ip);
        r.setEccParameter('skip_sensor', true);
        return r;
    },



    getAuthToken: function() {

        var r = this.buildRESTMessage('getCASTicket');
        r.setBasicAuth(gs.getProperty('x_caci_cisco_dna.cluster_username'), gs.getProperty('x_caci_cisco_dna.cluster_password'));

        var response = r.execute();
        var responseBody = response.getBody();
        if (gs.getProperty('x_caci_cisco_dna.extended_debugging') == 'true') {
            gs.info('DNA_Utils.getAuthToken returned: ' + responseBody);
        }
        var httpStatus = response.getStatusCode();
        var parser = new global.JSON();
        var parsed = parser.decode(responseBody);
        var authToken = parsed.Token;
        return authToken;


    },


    getAuthToken1: function(ip_address) {

        gs.info("Ip address of Cisco DNAC :" + ip_address);

        var r = this.buildRESTMessage('getCASTicket', ip_address);

        var prop = new GlideRecord('x_caci_cisco_dna_cisco_dna_controller');
        prop.addQuery('ip_address_of_dna_engine_controller', ip_address);

        prop.query();
        while (prop.next()) {

            var dnac_password = prop.password_of_the_dna_engine_controller.getDecryptedValue();
            var dnac_username = prop.getValue('user_name');
            var dnac_midserver = prop.getDisplayValue('mid_server_used_to_conenct_to_dnac');


            // gs.info("User Name : " + dnac_username);
            // gs.info("Password : " + dnac_password);
            gs.info("Mid Server : " + dnac_midserver);

            r.setBasicAuth(dnac_username, dnac_password);
            r.setMIDServer(dnac_midserver);
            r.setEccParameter('skip_sensor', true);

            var response = r.execute();
            var responseBody = response.getBody();
            if (gs.getProperty('x_caci_cisco_dna.extended_debugging') == 'true') {
                gs.info('DNA_Utils.getAuthToken returned: ' + responseBody);
            }
            var httpStatus = response.getStatusCode();
            var parser = new global.JSON();
            var parsed = parser.decode(responseBody);
            var authToken = parsed.Token;

            return authToken;

        }
    },



    sendIncidentDetails: function(status, incidentITSMSystemId, incidentITSMEntityId, description, enrichmentInfo, id, statusTime, priority, assignedTo, actualServiceId, domain, category, title, severity, workflowIndicator, ip_address) {
        var authToken = this.getAuthToken1(ip_address);
        //var authToken = this.getAuthToken();
        var r = new sn_ws.RESTMessageV2('x_caci_cisco_dna.DNA', 'captureIncidentStateChange');
        // var cluster_ip_port = gs.getProperty('x_caci_cisco_dna.cluster_ip_port');

        var prop = new GlideRecord('x_caci_cisco_dna_cisco_dna_controller');

        prop.addQuery('ip_address_of_dna_engine_controller', ip_address);
        prop.query();
        while (prop.next()) {

            var dnac_ip = prop.getValue('ip_address_of_dna_engine_controller');
            var dnac_midserver = prop.getDisplayValue('mid_server_used_to_conenct_to_dnac');
        }
        var cluster_ip_port = dnac_ip;
        r.setStringParameterNoEscape('cluster_ip', cluster_ip_port);
        r.setStringParameterNoEscape('incidentITSMEntityId', incidentITSMEntityId);
        r.setStringParameterNoEscape('description', description);
        r.setStringParameterNoEscape('incidentITSMSystemId', incidentITSMSystemId);
        r.setStringParameterNoEscape('status', status);
        r.setStringParameterNoEscape('enrichmentInfo', enrichmentInfo);
        r.setStringParameterNoEscape('id', id);
        r.setStringParameterNoEscape('statusTime', statusTime);
        r.setStringParameterNoEscape('severity', severity);
        r.setStringParameterNoEscape('actualServiceId', actualServiceId);
        r.setStringParameterNoEscape('priority', priority);
        r.setStringParameterNoEscape('domain', domain);
        r.setStringParameterNoEscape('category', category);
        r.setStringParameterNoEscape('assignedTo', assignedTo);
        r.setStringParameterNoEscape('title', title);
        r.setStringParameterNoEscape('authToken', authToken);
        r.setStringParameterNoEscape('workflowIndicator', workflowIndicator);
        r.setMIDServer(dnac_midserver);
        r.setEccParameter('skip_sensor', true);
        var response = r.execute(); //Synchronously calls the rest message
        var responseBody = response.getBody();
        var httpStatus = response.getStatusCode();
        gs.info("sendIncidentDetails Http response code :" + httpStatus);
        gs.info("sendIncidentDetails Response :" + responseBody);
    },


    sendProblemDetails: function(status, problemITSMSystemId, problemITSMEntityId, title, enrichmentInfo, id, statusTime, description, assignedTo, actualServiceId, domain, priority, category, incidentITSMSystemId, workflowIndicator, ip_address, state_update_status) {
        //var authToken = this.getAuthToken();
        var authToken = this.getAuthToken1(ip_address);
        var r = new sn_ws.RESTMessageV2('x_caci_cisco_dna.DNA', 'captureProblemStateChange');
        //var cluster_ip_port = gs.getProperty('x_caci_cisco_dna.cluster_ip_port');

        var prop = new GlideRecord('x_caci_cisco_dna_cisco_dna_controller');

        prop.addQuery('ip_address_of_dna_engine_controller', ip_address);
        prop.query();
        while (prop.next()) {

            var dnac_ip = prop.getValue('ip_address_of_dna_engine_controller');
            var dnac_midserver = prop.getDisplayValue('mid_server_used_to_conenct_to_dnac');
        }
        var cluster_ip_port = dnac_ip;

        r.setStringParameterNoEscape('cluster_ip', cluster_ip_port);
        r.setStringParameterNoEscape('problemITSMEntityId', problemITSMEntityId);
        r.setStringParameterNoEscape('problemITSMSystemId', problemITSMSystemId);
        r.setStringParameterNoEscape('description', description);
        r.setStringParameterNoEscape('incidentITSMSystemId', incidentITSMSystemId);
        r.setStringParameterNoEscape('status', status);
        r.setStringParameterNoEscape('enrichmentInfo', enrichmentInfo);
        r.setStringParameterNoEscape('id', id);
        r.setStringParameterNoEscape('statusTime', statusTime);
        r.setStringParameterNoEscape('actualServiceId', actualServiceId);
        r.setStringParameterNoEscape('title', title);
        r.setStringParameterNoEscape('domain', domain);
        r.setStringParameterNoEscape('priority', priority);
        r.setStringParameterNoEscape('category', category);
        r.setStringParameterNoEscape('assignedTo', assignedTo);
        r.setStringParameterNoEscape('state_update_status', state_update_status);
        r.setStringParameterNoEscape('authToken', authToken);
        r.setStringParameterNoEscape('workflowIndicator', workflowIndicator);
        r.setMIDServer(dnac_midserver);
        r.setEccParameter('skip_sensor', true);
        var response = r.execute(); //Synchronously calls the rest message
        var responseBody = response.getBody();
        var httpStatus = response.getStatusCode();
        gs.info("sendProblemDetails Http response code :" + httpStatus);
        gs.info("sendProblemDetails Response of Update ITSM Problem Details :" + responseBody);
    },

    sendChangeDetails: function(RFCITSMSystemId, RFCITSMEntityId, enrichmentInfo, title, description, id, name, domain, category, priority, status, statusTime, risk, plannedStartTime, plannedEndTime, assignedTo, actualServiceId, approval, approvalStatus, phase, phaseTime, incidentITSMSystemId, problemITSMSystemId, workflowIndicator, ip_address, state_update_status) {
        //var authToken = this.getAuthToken();
        var authToken = this.getAuthToken1(ip_address);
        var r = new sn_ws.RESTMessageV2('x_caci_cisco_dna.DNA', 'captureChangeStateChange');
        //var cluster_ip_port = gs.getProperty('x_caci_cisco_dna.cluster_ip_port');

        var prop = new GlideRecord('x_caci_cisco_dna_cisco_dna_controller');

        prop.addQuery('ip_address_of_dna_engine_controller', ip_address);
        prop.query();
        while (prop.next()) {

            var dnac_ip = prop.getValue('ip_address_of_dna_engine_controller');
            var dnac_midserver = prop.getDisplayValue('mid_server_used_to_conenct_to_dnac');
        }
        var cluster_ip_port = dnac_ip;

        r.setStringParameterNoEscape('cluster_ip', cluster_ip_port);
        r.setStringParameterNoEscape('RFCITSMSystemId', RFCITSMSystemId);
        r.setStringParameterNoEscape('RFCITSMEntityId', RFCITSMEntityId);
        r.setStringParameterNoEscape('enrichmentInfo', enrichmentInfo);
        r.setStringParameterNoEscape('title', title);
        r.setStringParameterNoEscape('description', description);
        r.setStringParameterNoEscape('name', name);
        r.setStringParameterNoEscape('id', id);
        r.setStringParameterNoEscape('domain', domain);
        r.setStringParameterNoEscape('category', category);
        r.setStringParameterNoEscape('priority', priority);
        r.setStringParameterNoEscape('status', status);
        r.setStringParameterNoEscape('statusTime', statusTime);
        r.setStringParameterNoEscape('risk', risk);
        r.setStringParameterNoEscape('plannedStartTime', plannedStartTime);
        r.setStringParameterNoEscape('plannedEndTime', plannedEndTime);
        r.setStringParameterNoEscape('assignedTo', assignedTo);
        r.setStringParameterNoEscape('actualServiceId', actualServiceId);
        r.setStringParameterNoEscape('approval', approval);
        r.setStringParameterNoEscape('approvalStatus', approvalStatus);
        r.setStringParameterNoEscape('phase', phase);
        r.setStringParameterNoEscape('phaseTime', phaseTime);
        r.setStringParameterNoEscape('phase', phase);
        r.setStringParameterNoEscape('incidentITSMSystemId', incidentITSMSystemId);
        r.setStringParameterNoEscape('problemITSMSystemId', problemITSMSystemId);
        r.setStringParameterNoEscape('state_update_status', state_update_status);
        r.setStringParameterNoEscape('authToken', authToken);
        r.setStringParameterNoEscape('workflowIndicator', workflowIndicator);
        r.setMIDServer(dnac_midserver);
        r.setEccParameter('skip_sensor', true);
        gs.info("Calling the captureChangeStateChange method");
        var response = r.execute(); //Synchronously calls the rest message
        var responseBody = response.getBody();
        var httpStatus = response.getStatusCode();
        gs.info("sendChangeDetails Http response code :" + httpStatus);
        gs.info("sendChangeDetails Response of Update ITSM Change Details :" + responseBody);
    },

    debugLog: function(message) {
        if (gs.getProperty('x_caci_cisco_dna.extended_debugging') == 'true') {
            gs.info(message);
        }

    },

    sendCMDBSyncDetails: function(success_count, failure_count, cisco_dna_center_ip_address, devices_successfully_synced, devices_failed_to_sync, enrichmentInfo, total_count) {
        var authToken = this.getAuthToken1(cisco_dna_center_ip_address);
        var r = new sn_ws.RESTMessageV2('x_caci_cisco_dna.DNA', 'cmdbSyncStatus');
        //var cluster_ip_port = gs.getProperty('x_caci_cisco_dna.cluster_ip_port');

        var prop = new GlideRecord('x_caci_cisco_dna_cisco_dna_controller');

        prop.addQuery('ip_address_of_dna_engine_controller', cisco_dna_center_ip_address);
        prop.query();
        while (prop.next()) {

            var dnac_ip = prop.getValue('ip_address_of_dna_engine_controller');
            var dnac_midserver = prop.getDisplayValue('mid_server_used_to_conenct_to_dnac');
        }
        var cluster_ip_port = dnac_ip;

        r.setStringParameterNoEscape('cluster_ip', cluster_ip_port);
        r.setStringParameterNoEscape('success_count', success_count);
        r.setStringParameterNoEscape('failure_count', failure_count);
        r.setStringParameterNoEscape('devices_successfully_synced', devices_successfully_synced);
        r.setStringParameterNoEscape('devices_failed_to_sync', devices_failed_to_sync);
        r.setStringParameterNoEscape('enrichmentInfo', enrichmentInfo);
        r.setStringParameterNoEscape('total_count', total_count);
        r.setStringParameterNoEscape('authToken', authToken);
        r.setMIDServer(dnac_midserver);
        r.setEccParameter('skip_sensor', true);
        gs.info("Calling the CMDB Sync Status method");
        var response = r.execute(); //Synchronously calls the rest message
        var responseBody = response.getBody();
        var httpStatus = response.getStatusCode();
        gs.info("sendCMDBSyncDetails Http response code :" + httpStatus);
        gs.info("sendCMDBSyncDetails Response :" + responseBody);
    },


    getEnrichmentDetails: function(networkUserId, deviceDetails, issueCategory, sysId) {
        // var callbackURL = gs.getProperty('x_caci_cisco_dna.incident_enrichment_callback_url');

        var instance_name = gs.getProperty('glide.servlet.uri');
        var callbackURL = instance_name + 'api/now/import/x_caci_cisco_dna_incident_dna_import';
        //var cluster_ip_port = gs.getProperty('x_caci_cisco_dna.cluster_ip_port');
        var prop = new GlideRecord('x_caci_cisco_dna_cisco_dna_controller');
        prop.query();
        var ipList = new Array();
        var ip = {};
        var i = 0;
        while (prop.next()) {
            ipList[i++] = prop.getValue('ip_address_of_dna_engine_controller'); + '';
            //ipList.push(ip);
        }
        gs.info('ipList' + ipList);
        if (deviceDetails) {
            deviceDetails = deviceDetails.replace(/(\r\n|\n|\r|\t)/gm, '');
        }
        for (var ips in ipList) {
            try {
                var authToken = this.getAuthToken1(ipList[ips]);
                gs.info("Token generated: " + authToken);

                prop.addQuery('ip_address_of_dna_engine_controller', ipList[ips]);
                prop.query();
                while (prop.next()) {


                    var dnac_midserver = prop.getDisplayValue('mid_server_used_to_conenct_to_dnac');
                }
                var cluster_ip_port = ipList[ips];


                var r = new sn_ws.RESTMessageV2('x_caci_cisco_dna.DNA', 'getEnrichmentDetails');
                r.setStringParameterNoEscape('cluster_ip', cluster_ip_port);
                r.setStringParameterNoEscape('snow_id', sysId);
                r.setStringParameterNoEscape('issueCategory', issueCategory);
                r.setStringParameterNoEscape('deviceDetails', deviceDetails);
                r.setStringParameterNoEscape('networkUserId', networkUserId);
                r.setStringParameterNoEscape('callbackURL', callbackURL);
                r.setStringParameterNoEscape('authToken', authToken);
                r.setMIDServer(dnac_midserver);
                r.setEccParameter('skip_sensor', true);
                var response = r.execute(); //Synchronously calls the rest message
                var responseBody = response.getBody();
                var httpStatus = response.getStatusCode();

                gs.info("Http response code :" + httpStatus);
                gs.info("Response :" + responseBody);
            } catch (ex) {
                gs.info("Error occured while requesting enrichment details for " + ipList[ips] + " : " + ex);
            }
            // return responseBody;
        }
        return "Get Enrichment Detail Process Completed Successfully";
    },

    closeRejectedChangeRequest: function(current, previous) {
        var PluginStatus = GlidePluginManager.isActive('com.snc.best_practice.problem.madrid');
        gs.info("Plugin install status :" + PluginStatus);
        if (PluginStatus == true) {
			gs.info("Trying to cancel a RFC that was rejected");
            if (current.state != '0' || current.state != '3') {

                current.state = '4';
                current.close_code = 'unsuccessful';
                current.close_notes += 'CR Rejected and hence ticket cancelled';
            }
        } else {

            current.state = '4';
            current.close_code = 'unsuccessful';

            current.close_notes += 'CR Rejected and hence ticket cancelled';
        }

        gs.info("Auto cancelling Rejected CR");


    },


    type: 'DNA_Utils'
};

