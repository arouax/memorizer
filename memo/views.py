from django.shortcuts import render, redirect
import json
from django.http import Http404, HttpResponse
from .models import Word
from random import shuffle
from .forms import UserForm
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User


def home(request):
    return render(request, 'memo/home.html', {})


def register(request):
    if request.user.is_authenticated():
        return render(request, 'registration/register.html', {})
    else:
        form = UserCreationForm(request.POST or None)
        if form.is_valid():
            print(form.cleaned_data['username'])
            # form.save()
            return redirect('home')
        return render(request, 'registration/register.html', {'form': form})


# AJAX
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


# AJAX
def setdata(request):
    if (request.is_ajax() and request.method == 'POST' and request.user.is_authenticated()):
        # We receive two lists of pk's:
        print(request.POST)
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
