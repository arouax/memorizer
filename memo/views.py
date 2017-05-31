from django.shortcuts import render
import json
from django.http import Http404, HttpResponse
from .models import Word
from random import shuffle


def home(request):
    if request.user.is_authenticated():
        name = request.user.username
    else:
        name = 'stranger'
    context = {
        'name': name,
    }
    return render(request, 'memo/home.html', context)


def getdata(request):
    """ A GET request that provides a list of dictionaries to a view """

    if request.is_ajax() and request.user.is_authenticated():
        unlearned_words = Word.objects.filter(known=False)[:20]
        word_list = [obj.as_dict() for obj in unlearned_words]
        uw_count = len(word_list)

        # If there is not enough unlearned words, add some of the known
        if uw_count < 20:
            additional_words = Word.objects.filter(known=True)[:20 - uw_count]
            additional_list = [obj.as_dict() for obj in additional_words]
            word_list.extend(additional_list)
        # Shuffle the result
        shuffle(word_list)
        # Pack'em and send
        data = json.dumps({'data': word_list})
        return HttpResponse(data, content_type='application/json')
    else:
        raise Http404


def setdata(request):
    if (request.is_ajax() and request.method == 'POST' and request.user.is_authenticated()):
        # We receive two lists of pk's:
        wrong_pk_list = request.POST.getlist('wrong[]')
        right_pk_list = request.POST.getlist('right[]')
        # Update the DB, marking progress and incrementing the showing
        for pk in wrong_pk_list:
            word = Word.objects.get(pk=pk)
            word.known = False
            word.shown += 1
            word.save()
        for pk in right_pk_list:
            word = Word.objects.get(pk=pk)
            word.known = True
            word.shown += 1
            word.save()

        data = json.dumps({'data': ''})
        return HttpResponse(data)
    else:
        raise Http404
