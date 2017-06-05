$("document").ready(function() {

	// ------------------ Adding words to the database ---------------------
	// Grabbing input fields
	$wordcontent = $('#input-wordcontent');
	$translation = $('#input-translation');
	$pos = $('#input-pos option:selected');
	$context = $('#input-context');


	function escapeHTML(arg) {
    return arg.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	};

	
	//Clears the fields and puts focus on wordcontent
	function clearInputs() {
		$wordcontent.val('').focus();
		$translation.val('');
		$context.val('');
	};


	//Clearing input fields if one of them's not empty
	$('#btn-clear-word').click(function() {
		btnClearWord();
	});
	
	function btnClearWord() {
		if ( $wordcontent.val() || $translation.val() || $context.val() ) {
			clearInputs();
		};
	};

	$('#btn-add-word').click(function() {
		btnAddWord();
	});

	// Key 'Add': Sends data to server
	function btnAddWord() {
		// wordcontent, translation and pos are required
		if ( $wordcontent.val() && $translation.val() && $('#input-pos option:selected').text() ) {

			// Need to add input data validation here: only a-zа-я

			var data = {
				wordcontent: $wordcontent.val(),
				translation: $translation.val(),
				pos: $('#input-pos option:selected').attr('data-pos'),
			};
			// context is optional
			if ( $context.val() ) {
				data.context = $context.val();
			};

			// Grab POS verbose name 
			// so that there's no need to retrieve it from the db:
			var posVerbose = $('#input-pos option:selected').text()

			// On success clearing the inputs and adding data on the page
			function addWordSuccess(data, posVerbose, result) {
				// If result contains a pk then object is successfully added to
				// the db, so we add it on the page:
				if ( result.pk ) {
					clearInputs();
					var tableRow = '<tr data-word-pk="' + result.pk + '">'
					tableRow += '<th class="inner-table" scope="row"></th>';
					tableRow += '<td>' + data.wordcontent + '</td>';
					tableRow += '<td>' + data.translation + '</td>';
					tableRow += '<td>' + posVerbose + '</td><td>';
					if ( data.context ) {
						tableRow += data.context;
					};
					tableRow += '</td><td>0</td><td>0</td><td>0</td>';
					tableRow +=	'<td><button class="btn btn-success btn-xs edit-word">Edit</button></td>';
					tableRow += '<td><button class="btn btn-danger btn-xs delete-word">Delete</button></td>';
					$('tbody').prepend(tableRow);
					$('.delete-word').off('click').on('click', function(e) {
						deleteWord(e);
					});
					$('.edit-word').off('click').on('click', function(e) {
						editWord(e);
					});
				} else if (result.error ) {
					console.log(result.error);
				};
			};

			// Send data to the db
			$.ajax({
				type: "POST",
				url: "../ajax/addword",
				dataType: "json",
				data: JSON.stringify(data),
				processData: false,
				success: function(result) {
					addWordSuccess(data, posVerbose, result);
				},
				error: function() { console.log('Error Bill Murray'); },
			});

		};
	};

	// Deleting words from the database ----------------------------------

	// Callback of successful ajax operation
	// If ajax result contains a success key (var), the provided row is deleted
	function deleteWordSuccess(result, row) {
		if (result.success) {
			row.remove();
		};
	};


	// Key "Delete"
	$(".delete-word").attr('disabled', false).click(function(e) {
		deleteWord(e);
	});
		
		
	function deleteWord(e) {
		// Grabbing the PK of the object
		var row = $(e.target).closest('tr');
		var pk = row.data('word-pk');

		// Send data to the db
		$.ajax({
			type: "POST",
			url: "../ajax/deleteword",
			dataType: "json",
			data: JSON.stringify(pk),
			processData: false,
			success: function(result) {
				deleteWordSuccess(result, row);
			},
			error: function() { console.log('Error Bill Murray'); },
		});
	};
		
	// End of deletion ------------------------------------------	


	// Edit word ----------------------------
	//
	$(".edit-word").attr('disabled', false).on('click', function(e) {
		editWord(e);
	});


	function editWord(e) {
		// Creating an object with selections and initial values
		var initial = {};
		initial.$tr = $(e.target).closest('tr');
		// Making wordcontent editable:
		initial.$wordcontent = initial.$tr.children(':nth-child(2)');
		initial.$wordcontent.addClass('edit-word');
		initial.wordcontent = initial.$wordcontent.text();
		initial.$wordcontent.html('<input type="text"></input>');
		initial.$wordcontent.find('input').val(initial.wordcontent).focus();
		// Making translation editable
		initial.$translation = initial.$tr.children(':nth-child(3)');
		initial.$translation.addClass('edit-word');
		initial.translation = initial.$translation.text();
		initial.$translation.html('<input type="text"></input>');
		initial.$translation.find('input').val(initial.translation);
		// Making pos editable
		initial.$pos = initial.$tr.children(':nth-child(4)'); // find the td
		initial.$pos.addClass('edit-word'); // add class to td
		initial.pos = initial.$pos.text(); // save initial value
		selectBoxHTML = $('#input-pos').parent().html(); // grab select box from the page
		initial.$pos.html(selectBoxHTML); // paste it into the td
		initial.$pos.find('select').removeAttr('id'); // remove id from select box
		find_text = 'option:contains("' + initial.pos +'")'; // prepare the search string
		initial.$pos.find(find_text).attr('selected', 'selected'); // find option with initial value and make it selected
		// making context editable
		initial.$context = initial.$tr.children(':nth-child(5)');
		initial.$context.addClass('edit-word');
		initial.context = initial.$context.text();
		initial.$context.html('<input type="text"></input>');
		initial.$context.find('input').val(initial.context);

		// Make all other buttons unactive
		$(".delete-word").off('click').attr('disabled', true);
		$(".edit-word").off('click').attr('disabled', true);
		$("#btn-clear-word").off('click').attr('disabled', true);
		$("#btn-add-word").off('click').attr('disabled', true);

		// Adding buttons for undo and apply
		initial.$undo = initial.$tr.children(':nth-child(9)');
		initial.undo = initial.$undo.html()
		initial.$undo.html('<button class="btn btn-warning btn-xs undo-edit-word">Undo</button>');
		initial.$save = initial.$tr.children(':nth-child(10)');
		initial.save = initial.$save.html()
		initial.$save.html('<button class="btn btn-warning btn-xs save-edit-word">Apply</button>');

		$('.undo-edit-word').click(function() {
			undoEditWord(initial);
		});

		$('.save-edit-word').click(function() {
			saveEditWord(initial);
		});

	};


	// Set values to initial and reassign onclick events
	function undoEditWord(initial) {
		// Set values back to initial:
		initial.$wordcontent.html(initial.wordcontent).removeClass('edit-word');
		initial.$translation.html(initial.translation).removeClass('edit-word');
		initial.$pos.html(initial.pos).removeClass('edit-word');
		initial.$context.html(initial.context).removeClass('edit-word');
		initial.$undo.html(initial.undo);
		initial.$save.html(initial.save);
		// reassign onclick events:
		$(".delete-word").attr('disabled', false).click(function(e) {
			deleteWord(e);
		});
		$(".edit-word").attr('disabled', false).click(function(e) {
			editWord(e);
		});
		$("#btn-clear-word").attr('disabled', false).click(function() {
			btnClearWord();
		});
		$("#btn-add-word").attr('disabled', false).click(function() {
			btnAddWord();
		});
	};

	function saveEditWord(initial) {
		// Grab new values:
		var newdata = {};
		// If value is changed and not empty, add it to newdata:
		var inputWordcontent = initial.$wordcontent.find('input').val();
		var inputTranslation = initial.$translation.find('input').val();
		var inputPos = initial.$pos.find('option:selected').val();
		var inputPosData = initial.$pos.find('option:selected').attr('data-pos');
		var inputContext = initial.$context.find('input').val();

		// Wordcontent, translation and pos should not be empty:
		if ( inputWordcontent != '' && inputTranslation != '' && inputPos != '' ) {

			// wordcontent:
			if ( inputWordcontent != initial.wordcontent ) {
				newdata.wordcontent = inputWordcontent;
			};
			// translation:
			if ( inputTranslation != initial.translation ) {
				newdata.translation = inputTranslation;
			};
			// pos:
			if ( inputPos != initial.pos ) {
				newdata.pos = inputPosData;
			};
			// context:
			if ( inputContext != initial.context ) {
				newdata.context = inputContext;
			};

			// If new data is not empty, then we can send it:
			if (jQuery.isEmptyObject(newdata) == false ) {
				newdata.pk = initial.$tr.data('word-pk');

				function editWordSuccess(result, initial) {
					if ( result.success ) {

						// Set all the values to input values
						initial.$wordcontent.html(initial.wordcontent)
							.text(inputWordcontent).removeClass('edit-word');

						initial.$translation.html(initial.translation)
							.text(inputTranslation).removeClass('edit-word');

						initial.$pos.html(initial.pos).text(inputPos)
							.removeClass('edit-word');

						initial.$context.html(initial.context)
							.text(inputContext).removeClass('edit-word');

						// Redisplay buttons
						initial.$undo.html(initial.undo);
						initial.$save.html(initial.save);

						// reassign onclick events:
						$(".delete-word").attr('disabled', false).click(function(e) {
							deleteWord(e);
						});
						$(".edit-word").attr('disabled', false).click(function(e) {
							editWord(e);
						});
						$("#btn-clear-word").attr('disabled', false).click(function() {
							btnClearWord();
						});
						$("#btn-add-word").attr('disabled', false).click(function() {
							btnAddWord();
						});

					};
				};
				
				// Send data to the db
				$.ajax({
					type: "POST",
					url: "../ajax/editword",
					dataType: "json",
					data: JSON.stringify(newdata),
					processData: false,
					success: function(result) {
						editWordSuccess(result, initial);
					},
					error: function() { console.log('Error Bill Murray'); },
				});// end ajax
			}; // endif

		};
	};





















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

// End of file
});
