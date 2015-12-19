<!doctype html>
<html>
<head>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>

	<script src="js/helpers.js"></script>
	<script src="js/h_notification.js"></script>
</head>
<body>
	<button id="notifyme">Notify</button>
	
	<script>

		var n = new H_Notification({log_events: true});
		
		$('#notifyme').on('click', function(e) {
			e.preventDefault();
			
			setTimeout( function() {
				n.say('Test !', 'Well, this is kinda cool isnt it ?');
			}, 500);
			
			return false;
		});

	</script>
</body>