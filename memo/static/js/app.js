var wordsDict = {};
var wordsIndex = 0;
var waitingForInput = false;
var inProgress = false; // True when progress bar is shown
var answerGiven = false;
var errorList = {};
var waitingForStart = false;
var waitingForNext = false;
var message = $('#message')
var answer = ''
var loopingProgress = true;


function addError() {
};

// If progressbar ends without user input, i.e. time runs out:
// Hides progressbar, input field, shows the translation and continuation message
// sets waiting for next
function progressBarEnd() {
	//$('#progressBar').remove();
	inProgress = false;
	$('#userinput').css('display', 'none');
	$('#translation').html(wordsDict[wordsIndex].translation);
	message.html('Press Enter to continue');
	waitingForNext = true;
};


function progress(timeleft, timetotal, $element) {
	inProgress = true;
	var progressBarWidth = timeleft * $element.width() / timetotal;
	$element.find('div').animate({ width: progressBarWidth }, timeleft == timetotal ? 0 : 1000, 'linear');
	if ( timeleft >= 0 ) {
		if (window.timer) {
			clearTimeout(window.timer);
		}
		window.timer = setTimeout(function() {
			progress(timeleft - 1, timetotal, $element);
		}, 1000);
	} else {
		progressBarEnd();
		inProgress = false;
	};
    
};










	function getWords() {
		$.ajax({
			type: "GET",
			url: "ajax/getdata",
			success: function(result) {
				wordsDict = result.data;
				wordsIndex = 0;
				message.empty();
				displayQuestion();
			},
			error: function() {
				message.html('Could not reach server');
			},
		});
	};

	function displayQuestion() {
		message.empty()
		$('#target').html(wordsDict[wordsIndex].wordcontent);
		$('#userinput').css('display', 'initial').val('').focus();
		waitingForInput = true;
		answerGiven = false;
		//$('body').append('<div id="progressBar"><div></div></div>');
		progress(5, 5, $('#progressBar'));
	};

	function endQuestioning() {
		waitingForInput = false;
		wordsDict = {};
		wordsIndex = 0;
		$('#target').html('');
		message.empty();
	};




	function nextWord() {
		wordsIndex += 1
		$('#translation').html('');
		if ( waitingForInput == true && inProgress == false ) {
			if ( wordsIndex < wordsDict.length ) {
				displayQuestion();
			} else {
				endQuestioning();
			};
		};
	};


	function rightAnswerGiven() {
		answerGiven = true;
		$('#userinput').css('display', 'none');
		inProgress = false;
		message.html('Press Enter to continue');
		waitingForNext = true;
	};







// Document starts here --------------------------------------
$("document").ready(function() {

	$('#start').click(function() {
		message.html('Press Enter to begin');
		waitingForStart = true;
		//displayQuestion();
	});


	$('#userinput').keydown(function(e) {
		var key = e.which;
		if ( key == 13 ) {
			answer = $('#userinput').val();
			if ( answer == wordsDict[wordsIndex].translation ) {
				//$('#progressBar').remove();
				rightAnswerGiven();
			};
		};
	});


	// if waitingForStart runs getWords
	// if waitingForNext runs nextWord
	$(document).keypress(function(e) {
		if ( e.which ==	13 ) {
			if ( waitingForStart == true ) {
				if ( waitingForInput == false ) {
					getWords();
				};
				waitingForStart = false;
			};
			if ( waitingForNext == true ) {
				nextWord();
				waitingForNext = false;
			};
		};
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
