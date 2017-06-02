var wordsDict = [];
var wordsIndex = 0;
var waitingForInput = false;
var inProgress = false; // True when progress bar is shown
var answerGiven = false;
var errorList = [];
var errorsToSend = [];
var waitingForStart = false;
var waitingForNext = false;
var message = $('#message')
var answer = ''
var loopingProgress = true;
var firstRound = true;
var rightAnswersList = [];

function listVars() {
	var a = 'waitingForInput = ' + waitingForInput + '\n';
	a += 'inProgress = ' + inProgress + '\n';
	a += 'answerGiven = ' + answerGiven + '\n';
	a += 'errorList = ' + errorList + '\n';
	a += 'errorsToSend = ' + errorsToSend + '\n';
	a += 'waitingForStart = ' + waitingForStart + '\n';
	a += 'waitingForNext = ' + waitingForNext + '\n';
	a += 'answer = ' + answer + '\n';
	a += 'loopingProgress = ' + loopingProgress + '\n';
	a += 'firstRound = ' + firstRound + '\n';
	alert(a);
};


// If progressbar ends without user input, i.e. time runs out:
// Hides progressbar, input field, shows the translation and continuation message
// sets waiting for next
function progressBarEnd() {
	//$('#progressBar').remove();
	inProgress = false;
	$('#userinput').css('display', 'none');
	$('#translation').html(wordsDict[wordsIndex].wordcontent);
	errorList.push(wordsDict[wordsIndex]);
	message.html('Press Enter to continue');
	waitingForNext = true;
};


function progress(timeleft, timetotal, $element) {
	//$element.css('display', 'block');
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
		$element.css('display', 'none')
	};
    
};




	function checkData() {
		if ( wordsDict.length == 0 ) {
			message.html('No words received. Database is empty?');
		} else {
			displayQuestion();
		};
	};






	function getWords() {
		$.ajax({
			type: "GET",
			url: "ajax/getdata",
			success: function(result) {
				errorList = [];
				rightAnswersList = [];
				errorsToSend = [];
				wordsDict = result.data;
				wordsIndex = 0;
				message.empty();
				firstRound = true;
				checkData();
			},
			error: function() {
				message.html('Could not reach server');
			},
		});
	};

	function displayQuestion() {
		message.empty();
		$('#translation').empty();
		$('#target').html(wordsDict[wordsIndex].translation);
		$('#userinput').css('display', 'initial').val('').focus();
		waitingForInput = true;
		answerGiven = false;
		//$('body').append('<div id="progressBar"><div></div></div>');
		$('#progressBar').css('display', 'block');
		progress(5, 5, $('#progressBar'));
	};




	// gets errorList and firstRound
	function endQuestioning() {
		
		// cleanup
		$('#progressBar').css('display', 'none');
		$('#target').html('');
		clearTimeout(window.timer);
		waitingForInput = false;
		message.empty();

		if ( errorList.length > 0 ) {
			if ( firstRound == true ) {
				errorsToSend = errorList.slice();
			};
			wordsDict = errorList.slice();
		} else {
			wordsDict = [];
		};
		wordsIndex = 0;
		errorList = [];
		firstRound = false;
		if ( wordsDict.length > 0 ) {
			displayQuestion();
		};
		// all rounds end - send results
		if ( wordsDict.length == 0 ) {
				sendResults();
				showMistakes();
		};

	};


	function showMistakes() {
		$('#startAnotherRound').show();
		if ( errorsToSend.length > 0 ) {
			$('#training').prepend('<div id="mistakes"></div>');
			$('#mistakes').html('<table id="mistakesTable" class="table table-hover"></table>');
			$('#mistakesTable').append('<caption>Done. Unfortunately there were mistakes:</caption>');
			$('#mistakesTable').append('<thead><tr><th>#</th><th>Word</th><th>Translation</th></tr></thead><tbody>');
			for ( i = 0; i < errorsToSend.length; i++ ) {
				var tableIndex = i + 1;
				var line = '<tr><th scope="row">' + tableIndex  + '</th><td>' + errorsToSend[i].wordcontent + '</td><td>' + errorsToSend[i].translation + '</td></tr>'
				$('#mistakesTable').append(line);
			};
			$('#mistakesTable').append('</tbody>');
		} else {
			$('#training').prepend('<div id="mistakes"><p>No mistakes! Congratulations!</p></div>');
		};
	};


	function sendResults() {
		var data = [];
		for (i = 0; i < errorsToSend.length; i++ ) {
			data.push(errorsToSend[i].pk);
		};
		$.ajax({
			type: "POST",
			url: "ajax/setdata",
			dataType: "json",
			data: {'wrong': data, 'right': rightAnswersList},
			error: function() { message.html('An error occurred'); },
		});
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
		if (firstRound == true) {
			rightAnswersList.push(wordsDict[wordsIndex].pk);
		};
		answerGiven = true;
		$('#userinput').css('display', 'none');
		inProgress = false;
		//message.html('Press Enter to continue');
		//waitingForNext = true;
		nextWord();
	};

	function wrongAnswerGiven() {
		inProgress = false;
		errorList.push(wordsDict[wordsIndex]);
		$('#translation').html(wordsDict[wordsIndex].wordcontent);
		answerGiven = true;
		$('#userinput').css('display', 'none');
		message.html('Press Enter to continue');
		//alert('In progress is false, waiting for next');
		waitingForNext = true;
	};







// Document starts here --------------------------------------
$("document").ready(function() {

	$('#startAnotherRound').click(function() {
		//listVars();
		message.html('Press Enter to begin');
		waitingForStart = true;
		$(this).hide();
		$('#mistakes').remove();
	});


	$('#startFromHello').click(function() {
		//listVars();
		$('#hello').remove();
		$('#training').css('display', 'block');
		message.html('<h3>Press Enter to begin</h3>');
		waitingForStart = true;
		$(this).hide();
	});



	$('#userinput').keydown(function(e) {
		var key = e.which;
		if ( key == 13 ) {
			//listVars();
			inProgress = false;
			$('#progressBar').css('display', 'none');
			answer = $('#userinput').val();
			if ( answer == wordsDict[wordsIndex].wordcontent ) {
				//$('#progressBar').remove();
				rightAnswerGiven();
			} else {
				//alert('Wrong');
				wrongAnswerGiven();
			};
		};
	});


	// if waitingForStart runs getWords
	// if waitingForNext runs nextWord
	$(document).keypress(function(e) {
		if ( e.which ==	13 && e.target.id != 'userinput' ) {
			//listVars();
			message.html('');
			$('#translation').html('');
			if ( waitingForStart == true ) {
				if ( waitingForInput == false ) {
					getWords();
				};
				waitingForStart = false;
			};
			if ( waitingForNext == true ) {
				//alert('next');
				//listVars();
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
