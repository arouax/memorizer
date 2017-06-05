from django.shortcuts import render, redirect, get_object_or_404
import json
from django.http import Http404, HttpResponse
from .models import Word
from random import shuffle
from .forms import LoginForm
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError


def home(request):
    if request.user.is_authenticated:
        wordcount = Word.objects.filter(user=request.user).count()
        context = {'wordcount': wordcount}
    else:
        context = {'form': LoginForm}
    return render(request, 'memo/home.html', context)


def register(request):
    if request.user.is_authenticated():
        return render(request, 'registration/register.html', {})
    else:
        form = UserCreationForm(request.POST or None)
        if form.is_valid():
            print(form.cleaned_data)
            new_user = form.save()
            # messages.info(request, "Thanks for registering. You are now logged in.")
            new_user = authenticate(
                username=form.cleaned_data['username'],
                password=form.cleaned_data['password1'],
            )
            login(request, new_user)
            return redirect('home')
        return render(request, 'registration/register.html', {'form': form})


# AJAX
def getdata(request):
    """ A GET request that provides a list of dictionaries to a view """

    if request.is_ajax() and request.user.is_authenticated():
        unlearned_words = Word.objects.filter(user=request.user,
                                              known=False)[:20]
        word_list = [obj.as_dict() for obj in unlearned_words]
        uw_count = len(word_list)

        # If there is not enough unlearned words, add some of the known
        if uw_count < 20:
            additional_words = Word.objects.filter(user=request.user,
                                                   known=True)[:20 - uw_count]
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
        wrong_pk_list = request.POST.getlist('wrong[]')
        right_pk_list = request.POST.getlist('right[]')
        # Update the DB, marking progress and incrementing the showing
        for pk in wrong_pk_list:
            word = Word.objects.get(pk=pk)
            word.known = False
            word.shown += 1
            word.misses += 1
            word.save()
        for pk in right_pk_list:
            word = Word.objects.get(pk=pk)
            word.known = True
            word.shown += 1
            word.hits += 1
            word.save()

        data = json.dumps({'data': ''})
        return HttpResponse(data)
    else:
        raise Http404


# AJAX - Word creation
def addword(request):
    if (request.is_ajax() and request.method == 'POST' and request.user.is_authenticated()):
        data = json.loads(request.body.decode('utf-8'))
        print(data)
        word = Word(wordcontent=data['wordcontent'].lower(),
                    translation=data['translation'].lower(),
                    pos=data['pos'],
                    user=request.user,
                   )
        if data.get('context'):
            word.context = data['context'].lower()
        try:
            word.save()
        except IntegrityError:
            return HttpResponse(json.dumps({'error': 'Already in the DB'}))
        return HttpResponse(json.dumps({'pk': word.pk}))
    raise Http404


# AJAX - Word deletion
def deleteword(request):
    if (request.is_ajax() and request.method == 'POST' and request.user.is_authenticated()):
        pk = json.loads(request.body.decode('utf-8'))
        word = get_object_or_404(Word, pk=pk)
        if word.user == request.user:
            word.delete()
            print('Deleted an object')
            return HttpResponse(json.dumps({'success': 'Deleted'}))
    raise Http404



# AJAX - Edit word
def editword(request):
    if (request.is_ajax() and request.method == 'POST' and request.user.is_authenticated()):
        values = json.loads(request.body.decode('utf-8'))
        print(values)
        if values.get('pk'):
            instance = get_object_or_404(Word, pk=values.get('pk'))
            if instance.user == request.user:
                if values.get('wordcontent'):
                    instance.wordcontent = values.get('wordcontent').lower()
                if values.get('translation'):
                    instance.translation = values.get('translation').lower()
                if values.get('pos'):
                    instance.pos = values.get('pos')
                if values.get('context') or values.get('context') == '':
                    instance.context = values.get('context').lower()
                instance.save()
                print('Object updated')
                return HttpResponse(json.dumps({'success': 'Deleted'}))
    raise Http404




@login_required(login_url='login')
def wordlist(request):
    words = Word.objects.filter(user=request.user).order_by('-date_added')
    context = {
        'words': words,
        'word_active': True,
        'pos_choices': Word.POS_CHOICES,
    }
    return render(request, 'memo/word_list.html', context)
