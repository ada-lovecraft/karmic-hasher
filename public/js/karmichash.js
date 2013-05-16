
$(document).ready(function() {
	String.prototype.trunc = 
      function(n){
          return this.substr(0,n-1)+(this.length>n?'...':'');
      };

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
			$('#images').append('<img src="/thumbs/' + subreddit + '/' + image.link +'" data-file="' + image.link +'" data-hash="' + image.hash +'" data-score="' + image.score + '" data-comments="' + image.reddit_comments+ '" data-title="' + image.title + '" class="karmic-thumb"/>')
		});
	});

	$('#images').on('click','.karmic-thumb',function(e) {

			
			$('#relevance').val(23);
			$('#relevanceLabel').html('Relevance Factor: 23');
			$('#controls').show();
			var karmicHash = $(this).data('hash');
			var karmicFile = $(this).data('file');
			var karmicComments = $(this).data('comments');
			var karmicTitle = $(this).data('title');
			$('#portrait').attr('src','/images/' + subreddit + '/' + karmicFile);
			$('#comment-link').attr('href','http://reddit.com' + karmicComments).html(karmicTitle);
			$('#portrait').data('hash',karmicHash);
			$('')
			$.ajax('/matches/' + subreddit + '/' + karmicHash + '/' + 23)
				.done(function(data) {
					displayResults(data);
				}
			);
	});

	$('#relevance').mouseup(function(e) {
		var karmicHash = $('#portrait').data('hash');
		var relevance = $(this).val();
		$.ajax('/matches/' + subreddit + '/' + karmicHash + '/' + relevance)
			.done(function(data) {
				displayResults(data);		
			}
		);
	});
	$('#relevance').change(function(e) {
		var relevance = $(this).val();
		console.log(relevance);
		$('#relevanceLabel').html('Relevance Factor: ' + relevance);
	});

	function displayResults(data) {
		$('.karmic-thumb').hide();
		$('.karmic-thumb').removeClass('featured');
		if (data.length > 0) {
			var chartData = new Array();
			var total = 0;
			var average = 0;
			data.forEach(function(pic,index,array) {
				total += pic.score;
				chartData.push({type: 'column', name: pic.title.trunc(25), data:[pic.score]});
				$('.karmic-thumb[data-hash=' + pic.hash + ']').addClass('featured');

			});
			average = Math.floor(total / data.length);
			chartData.push({
				type: 'line'
				, name: 'Average'
				, data: [average]
				,marker: {
                	lineWidth: 2,
                	lineColor: Highcharts.getOptions().colors[1],
                	fillColor: 'white'
                }
			});

			$('.featured').fadeIn(); 
			$('#message').html(data.length + ' Matches Found');	
			var h=new Highcharts.Chart({
				chart: {
					title: "Relevance vs Karma"
					, renderTo:'chart'
				},
				legend: {
					layout: 'horizontal',
					itemWidth: 200
				},
				title: {
					text: 'Karmic Scores'
				},
				xAxis: {
					categories: ['Karma']
				},
				yAxis: {
					title: {
						text: 'Karmic Score'
					}
				},
				series: chartData

			});
		} else {
			$('#message').html('No Matches Found');
		}
	}


});