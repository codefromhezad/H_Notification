var H_Notification = function(h_user_options) {
	
	this.notification = window.Notification || window.mozNotification || window.webkitNotification;
	this.notification_instance = null;
	
	this.granted = false;

	this.overriden_native_events = ['show'];

	this.h_options = {
		log_events: false,
		
		autoclose: true,
		autoclose_time: 4000,

		events: {
			supported: function() {},
			unsupported: function() {},
			permission_granted: function() {},
			permission_denied: function() {},
			show: function() {},
			click: function() {},
			error: function() {}
		}
	}

	if( h_user_options !== undefined && h_user_options.constructor == Object ) {
		obj_merge(this.h_options, h_user_options);
	}

	this.boot = function() {
		// Check browser support for notifications
		if( 'undefined' === typeof this.notification ) {
			this.trigger('unsupported');
			return false;
		} else {
			this.trigger('supported');
		}

		if( this.h_options.use_push_notifications ) {

			

			if( this.h_options.use_push_notifications ) {
				// Init Push worker
				var that = this;
				navigator.serviceWorker.register(this.h_options.push_worker_file).then(function(reg) {
				    if(reg.installing) {
				        that.trigger('push_worker_installing');
				    } else if(reg.waiting) {
				        that.trigger('push_worker_waiting');
				    } else if(reg.active) {
				        that.trigger('push_worker_active');
				    }

			    	that.initialize_push_state(reg);
				});
			}
		}

		return true;
	}

	this.initialize_push_state = function(reg) {
		var that = this;

		var useNotifications = true;

		if ( ! (reg.showNotification)) {  
		    this.trigger('push_worker_notifications_unsupported');
		    useNotifications = false;  
		} else {
			this.trigger('push_worker_notifications_supported');
		    useNotifications = true; 
		}

		// Check the current Notification permission.  
		// If its denied, it's a permanent block until the  
		// user changes the permission  
		// if (Notification.permission === 'denied') {  
		// 	console.log('The user has blocked notifications.');  
		// 	return;  
		// }
		// /\ TODO ?

		navigator.serviceWorker.ready.then(function(reg) {  

		    reg.pushManager.getSubscription()  
		      	.then(function(subscription) {    
			        $('#push-subscribe').attr('disabled', null);

			        if (! subscription ) {  
			          console.log('Not yet subscribed to Push')
			          // We aren't subscribed to push, so set UI to allow the user to enable push  
			          return;  
			        }

			        // Set your UI to show they have subscribed for  push messages  
			        $('#push-subscribe').text('Unsubscribe from Push Messaging');  
			        that.push_subscribed = true;  
			        
			        // initialize status, which includes setting UI elements for subscribed status
			        // and updating Subscribers list via push
			        console.log(subscription.toJSON());
			        var endpoint = subscription.endpoint;
			        var key = subscription.getKey('p256dh');
			        console.log(key);
			        updateStatus(endpoint, key, 'init');
		      	})  
		      	.catch(function(err) {  
		        	console.log('Error during getSubscription()', err);  
		    	}); 

		      	// set up a message channel to communicate with the SW
		      	var channel = new MessageChannel();
				channel.port1.onmessage = function(e) {
					console.log(e);
					handleChannelMessage(e.data);
				}
		      
		      	var mySW = reg.active;
		      	mySW.postMessage('hello', [channel.port2]);
		  }); 
	}

	this.trigger = function(event_name, event_data) {
		if( this.h_options.log_events ) {
			console.log("%c(H_Notification) " + "%ctriggered " + "%c" + event_name + " %cevent.", "color: green;", "color: black;", "color: blue; font-style: italic;", "color: black; font-style: normal;");
		}

		if( this.h_options.events[event_name] !== undefined ) {
			this.h_options.events[event_name](event_data);
		}
	}

	this.handle_autoclose = function() {
		if( this.h_options.autoclose && this.h_options.autoclose_time > 0 ) {
			var that = this;
			
			setTimeout( function() {
				that.notification_instance.close();
			}, this.h_options.autoclose_time);
		}
	}

	this.on = function(event_name, callback) {
		this.h_options.events[event_name] = callback;
	}

	this.check_permissions = function() {
		if( ! ( this.notification.permission === "granted" ) ) {
			var that = this;
			this.notification.requestPermission(function(permission) {
				if( permission === "granted" ) {
					that.granted = true;
					that.trigger('permission_granted');
				} else {
					that.granted = false;
					that.trigger('permission_denied');
				}
			});
		} else {
			this.granted = true;
		}

		return this.granted;
	}

	this.bind_native_events = function() {
		if( this.h_options.events && this.h_options.events.constructor == Object) {
			var that = this;
			for(var event_name in this.h_options.events) {
				if( this.notification_instance['on'+event_name] === undefined ||
					this.overriden_native_events.indexOf(event_name) !== -1) {
					continue;
				}
				
				( function(event_name) {
					that.notification_instance['on'+event_name] = function(event_data) {
						that.trigger(event_name, event_data);
					}
				} ) (event_name);
			}
		}
	}

	this.say = function(title, message, user_options) {
		// Default options
		var options = {
			body: message,
			dir: 'auto',
			lang: 'EN',
			tag: 'notification',
			icon: ''
		}

		// Merge options if necessary
		if( user_options !== undefined && user_options.constructor == Object ) {
			merge(options, user_options);
		}

		// Do the thing !
		if( this.check_permissions() ) {
			// Spawn new native Notification instance
			this.notification_instance = new this.notification(title, options);
			this.bind_native_events();
			this.handle_autoclose();
			this.trigger('show');
		}
	}


	/* Finally, run the "boot" method */
	if( ! this.boot() ) {
		return false;
	}
}
 