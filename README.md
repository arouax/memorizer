# Word Memorizer
## An open-source vocabulary exerciser

As of now, consists of the following features:
+ User registration / login system (implemented on top of django.contrib.auth).
+ Basic CRUD system to populate the word database (single-page, AJAX).
+ An interactive excercise game, that displays user a word and asks for a translation, with a countdown timer. Words are retrieved from the database randomly, with a priority for those ones, that user previously got wrong. Hits and misses are stored in the database.

To do:
+ Tags/lists.
+ Import/Export system.
+ A mechanism to extract words from uploaded texts, lemmatize and positionally tag them.

Django, JQuery, Bootstrap. A work in progress.
