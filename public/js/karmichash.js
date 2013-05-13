
$(document).ready(function() {
	console.log(subreddit);

	$('.karmic-thumb').click(function(e) {
		$('#relevance').val(3);
		$('#relevanceLabel').html("Mostly the Same");
		$('#controls').show();
		var karmicHash = $(this).data('hash');
		var karmicFile = $(this).data('file');
		$('#portrait').attr('src','/images/' + subreddit + '/' + karmicFile);
		$('#portrait').data('hash',karmicHash);
		$('.karmic-thumb').hide();
		$.ajax('/matches/' + subreddit + '/' + karmicHash + '/' + 3)
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
		$('#relevanceLabel').html(relevance);
	});
});