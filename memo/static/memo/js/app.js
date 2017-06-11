$("document").ready(function() {
	
	
	// Removes div#hello, shows div#training
	$('#startFromHello').click(function() {
		$('#hello').remove();
		$('#training').show();
		$('#message').html('Press Enter to start');
		// Start listening for Enter
		$(document).keypress(function(e) {
			if ( e.key === 'Enter' ) {
				// Stop listening for Enter
				$(document).unbind('keypress');
				startTheGame();
			};
		});
	});
	
function startTheGame() {

	$('#startFromHello').remove();
	

	var state = {
		// if true, then start event can be activated
		gameInProgress: false, // is set true by pressing #start... buttons
		wordList: [],
		errorList: [],
		cursor: 0,
		firstRound: true,
		stop: false,
		rightAnswersList: [],
		errorsToSend: [],
	};

	getData();



	// gets data from server
	function getData() {
		state.gameInProgress = true;
		// Get the data, and on success start
		$.ajax({
			type: "GET",
			url: "ajax/data",
			success: function(result) {
				state.wordList = result.data;
				state.cursor = 0
				state.round = 1
				displayQuestion();
			},
			error: function() {
				data = 'Could not reach server';
			},
		});
	};



	function displayQuestion() {
		$('#message').empty();
		$('#answer').empty();
		$('#question').empty();
		// If cursor < wordList capacity, display question
		if ( state.cursor < state.wordList.length ) {
		// Clear message and answer
			$('#question').html(state.wordList[state.cursor].translation)
			$('#userinput').val('').show().focus().keypress(function(e) {
			if ( e.key === 'Enter' && e.target.id === 'userinput' ) {
				$('#userinput').unbind('keypress');
				state.stop = true;
				$('#progressBar').find('div').stop();
				$('#progressBar').hide();
				answerGiven($('#userinput').val());
			};
			});
			state.stop = false;
			$('#progressBar').show();
			progress(5, 5, $('#progressBar'));
		} else {
			endQuestioning();
		};
	}



	function answerGiven(answer) {
		// Hide userinput
		$('#userinput').unbind('keypress');
		$('#userinput').hide();
		// Process the answer
		if ( answer === state.wordList[state.cursor].wordcontent ) {
			// Answer is right
			if ( state.firstRound ) {
				state.rightAnswersList.push(state.wordList[state.cursor].pk);
			};
			state.cursor++;
			displayQuestion();
		} else {
			// Answer is wrong
			if ( state.firstRound ) {
				state.errorsToSend.push(state.wordList[state.cursor]);
			};
			state.errorList.push(state.wordList[state.cursor]);
			$('#message').html('Press any key');
			$('#answer').html(state.wordList[state.cursor].wordcontent);
			// Increment cursor and display next question after Enter is pressed
			state.cursor++;
			$(document).keypress(function(evt) {
				if ( evt.key === 'Enter' && evt.target.id != 'userinput' ) {
					$(document).unbind('keypress');
					displayQuestion();
				};
			});
		};
	};



	function endQuestioning() {
		$('#message').empty();
		$('#answer').empty();
		$('#question').empty();
		state.firstRound = false;
		if ( state.errorList.length > 0 ) {
			state.wordList = state.errorList.slice();
			state.errorList = [];
			state.cursor = 0;
			displayQuestion();
		} else {
			sendResults();
			showMistakes();
		};
	};


	function progress(timeleft, timetotal, $element) {
		var progressBarWidth = timeleft * $element.width() / timetotal;
		// Don't animate if state.stop is true
		if ( !state.stop ) {
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
			};
		};
	};

	function progressBarEnd() {
		$('#progressBar').hide();
		if ( state.firstRound ) {
			state.errorsToSend.push(state.wordList[state.cursor]);
		};
		state.errorList.push(state.wordList[state.cursor]);
		// Show answer
		$('#answer').html(state.wordList[state.cursor].wordcontent);
		// Hide userinput
		$('#userinput').unbind('keypress');
		$('#userinput').hide();
		// Increment the cursor
		state.cursor ++;
		$('#message').html('Press any key continue');
		$(document).keypress(function(e) {
			if ( e.key === 'Enter' ) {
				$(document).unbind('keypress');
				displayQuestion();
			};
		});
	};

	function sendResults() {
		var errorData = [];
		for ( i = 0; i < state.errorsToSend.length; i++ ) {
			errorData.push(state.errorsToSend[i].pk);
		}
		$.ajax({
			type: "POST",
			url: "ajax/data",
			dataType: "json",
			data: {'wrong': errorData, 'right': state.rightAnswersList},
			error: function() { message.html('An error occurred'); },
		});
	};



	function showMistakes() {
		if ( state.errorsToSend.length > 0 ) {
			$('#training').prepend('<div id="mistakes"></div>');
			$('#mistakes').html('<table id="mistakesTable" class="table table-hover"></table>');
			$('#mistakesTable').append('<caption>Done. Unfortunately there were mistakes:</caption>');
			$('#mistakesTable').append('<thead><tr><th>#</th><th>Word</th><th>Translation</th></tr></thead><tbody>');
			for ( i = 0; i < state.errorsToSend.length; i++ ) {
				var tableIndex = i + 1;
				var line = '<tr><th scope="row">' + tableIndex  + '</th><td>' + state.errorsToSend[i].wordcontent + '</td><td>' + state.errorsToSend[i].translation + '</td></tr>'
				$('#mistakesTable').append(line);
			};
			$('#mistakesTable').append('</tbody>');
		} else {
			$('#training').prepend('<div id="mistakes"><p>No mistakes! Congratulations!</p></div>');
		};
		$('#training').append('<a href="#" id="startFromHello" class="btn btn-lg btn-default">Start one more round</a>');
		$('#startFromHello').click(function() {
			$('#mistakes').remove();
			startTheGame();
		});
	};


	$('#startAnotherRound').click(function() {
		//listVars();
		message.html('Press Enter to begin');
		waitingForStart = true;
		$(this).hide();
		$('#mistakes').remove();
	});





	$('#userinput--').keydown(function(e) {
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
	//$(document).keypress(function(e) {
		//if ( e.which ==	13 && e.target.id != 'userinput' ) {
			////listVars();
			//message.html('');
			//$('#translation').html('');
			//if ( waitingForStart == true ) {
				//if ( waitingForInput == false ) {
					//getWords();
				//};
				//waitingForStart = false;
			//};
			//if ( waitingForNext == true ) {
				////alert('next');
				////listVars();
				//nextWord();
				//waitingForNext = false;
			//};
		//};
	//});

















	// Retrieve from the database
	$('#getdata').click(function() {
		$.ajax({
			type: "GET",
			url: "ajax/data",
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
			url: "ajax/data",
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





};
});
