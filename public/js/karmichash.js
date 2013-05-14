
$(document).ready(function() {
	var App = {};
    App.socket = io.connect();

	App.socket.on("global:broadcast", function(data) {
		$('#broadcast').html(data.message);
	});	

	App.socket.on("global:function", function(data) {
		$('#function').html(data.message);
	});	

	App.socket.on("global:status", function(data) {
		$('#status').html(data.message);
	});	

	App.socket.on(subreddit + ':done', function(data) {
		data.images.forEach(function(image,index,array) {
			$('#images').append('<img src="/thumbs/' + subreddit + '/' + image.link +'" data-file="' + image.link +'" data-hash="' + image.hash +'" data-score="' + image.score + '" class="karmic-thumb"/>')
		});
	});

	$('.karmic-thumb').on('click',function(e) {
		$('#relevance').val(23);
		$('#relevanceLabel').html('Relevance Factor: 23');
		$('#controls').show();
		var karmicHash = $(this).data('hash');
		var karmicFile = $(this).data('file');
		$('#portrait').attr('src','/images/' + subreddit + '/' + karmicFile);
		$('#portrait').data('hash',karmicHash);
		$('.karmic-thumb').hide();
		$.ajax('/matches/' + subreddit + '/' + karmicHash + '/' + 23)
			.done(function(data) {
				$('.karmic-thumb').removeClass('featured');
				if (data.length > 0) {
					data.forEach(function(pic,index,array) {
						$('.karmic-thumb[data-hash=' + pic.hash + ']').addClass('featured');
					});
					$('.featured').fadeIn(); 
					$('#message').html(data.length + ' Matches Found');
				} else {
					$('#message').html('No Matches Found');
				}
			});
	});

	$('#relevance').mouseup(function(e) {
		var karmicHash = $('#portrait').data('hash');
		var relevance = $(this).val();
		$.ajax('/matches/' + subreddit + '/' + karmicHash + '/' + relevance)
			.done(function(data) {
				$('.karmic-thumb').removeClass('featured');
				if (data.length > 0) {
					data.forEach(function(pic,index,array) {
						$('.karmic-thumb[data-hash=' + pic.hash + ']').addClass('featured');
					});
					$('.karmic-thumb').hide();
					$('.featured').fadeIn(); 
					$('#message').html(data.length + ' Matches Found');
				} else {
					$('.karmic-thumb').fadeOut();
					$('#message').html('No Matches Found');
				}
			});
	});
	$('#relevance').change(function(e) {
		var relevance = $(this).val();
		console.log(relevance);
		$('#relevanceLabel').html('Relevance Factor: ' + relevance);
	});
});