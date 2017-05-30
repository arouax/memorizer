	var wordsDict = {};
	var wordsIndex = 0;
	var waitingForInput = false;
	var inProgress = false;

function progress(timeleft, timetotal, $element) {
	inProgress = true;
	$('#progressBar').css('display', 'block');
	var progressBarWidth = timeleft * $element.width() / timetotal;
	$element.find('div').animate({ width: progressBarWidth }, timeleft == timetotal ? 0 : 100, 'linear');
	if(timeleft > 0) {
		setTimeout(function() {
			progress(timeleft - 1, timetotal, $element);
		}, 100);
	} else {
		$('#progressBar').css('display', 'none');
		$('#userinput').css('display', 'none');
		inProgress = false;
		$('#translation').html(wordsDict[wordsIndex - 1].translation);
	}
    
};








$("document").ready(function() {


	function getWords() {
		$.ajax({
			type: "GET",
			url: "ajax/getdata",
			success: function(result) {
				wordsDict = result.data;
				wordsIndex = 0;
				displayQuestion();
			},
			error: function() {
				alert('Error');
			},
		});
	};

	function displayQuestion() {
		$('#target').html(wordsDict[wordsIndex].wordcontent);
		$('#userinput').css('display', 'initial');
		waitingForInput = true;
		wordsIndex += 1;
		progress(50, 50, $('#progressBar'));
	};

	function endQuestioning() {
		waitingForInput = false;
		wordsDict = {};
		wordsIndex = 0;
		$('#target').html('');
	};


	$('#next').click(function() {
		$('#translation').html('');
		if ( waitingForInput == true && inProgress == false ) {
			if ( wordsIndex < wordsDict.length ) {
				displayQuestion();
			} else {
				endQuestioning();
			};
		};
	});


	$('#start').click(function() {
		if ( waitingForInput == false ) {
			getWords();
		};
		//displayQuestion();
	});





















	// Retrieve from the database
	$('#getdata').click(function() {
		$.ajax({
			type: "GET",
			url: "ajax/getdata",
			success: function(result) {
				for (var i = 0; i < result.data.length; i++) {
					var r = result.data[i];
					$('#result').append('<li>' + r.wordcontent + ' ' + r.translation + '</li>');
				};
			},
			error: function() {
				alert('Error');
			},
		});


	});


	// Change the database
	$('#setdata').click(function() {
		$.ajax({
			type: "POST",
			url: "ajax/setdata",
			dataType: "json",
			data: {"pk": 1},
			success: function(result) { alert("Success! " + result.data); },
			error: function() { alert("Error!"); },
		});

	});

	//CSRF
	// using jQuery
	function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
			var cookies = document.cookie.split(';');
			for (var i = 0; i < cookies.length; i++) {
				var cookie = jQuery.trim(cookies[i]);
				// Does this cookie string begin with the name we want?
				if (cookie.substring(0, name.length + 1) === (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
    }
    return cookieValue;
	}
	var csrftoken = getCookie('csrftoken');



	function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
	}
	$.ajaxSetup({
    beforeSend: function(xhr, settings) {
			if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
				xhr.setRequestHeader("X-CSRFToken", csrftoken);
			}
    }
	});






});
