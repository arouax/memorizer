from django.views.generic import View
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
from django.utils.decorators import method_decorator
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError


class HomeView(View):
    def get(self, request):
        if request.user.is_authenticated:
            wordcount = Word.objects.filter(user=request.user).count()
            context = {'wordcount': wordcount}
        else:
            context = {'form': LoginForm}
        return render(request, 'memo/home.html', context)


class RegisterView(View):
    template = 'registration/register.html'
    form = UserCreationForm

    def get(self, request):
        if request.user.is_authenticated():
            return render(request, self.template, {})
        else:
            return render(request, self.template, {'form': self.form()})

    def post(self, request):
        if request.user.is_authenticated():
            return render(request, self.template, {})
        else:
            form = self.form(request.POST)
            if form.is_valid():
                new_user = form.save()
                new_user = authenticate(
                    username=form.cleaned_data['username'],
                    password=form.cleaned_data['password1'],
                )
                login(request, new_user)
                return redirect('home')
            return render(request, self.template, {'form': form})


# AJAX
class DataView(View):
    """ If request is get, provides a list of dictionaries to a view 
    if POST - changes the database """

    def get(self, request):
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


    def post(self, request):
        if request.is_ajax() and request.user.is_authenticated():
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
class AddWord(View):
    def post(self, request):
        if request.is_ajax() and request.user.is_authenticated():
            data = json.loads(request.body.decode('utf-8'))
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
class DeleteWord(View):
    def post(self, request):
        if request.is_ajax() and request.user.is_authenticated():
            pk = json.loads(request.body.decode('utf-8'))
            word = get_object_or_404(Word, pk=pk)
            if word.user == request.user:
                word.delete()
                return HttpResponse(json.dumps({'success': 'Deleted'}))
        raise Http404


# AJAX - Edit word
class EditWord(View):
    def post(self, request):
        if request.is_ajax() and request.user.is_authenticated():
            values = json.loads(request.body.decode('utf-8'))
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
                    return HttpResponse(json.dumps({'success': 'Deleted'}))
        raise Http404


@method_decorator(login_required(login_url='login'), name='dispatch')
class WordList(View):
    def get(self, request):
        words = Word.objects.filter(user=request.user).order_by('-date_added')
        context = {
            'words': words,
            'word_active': True,
            'pos_choices': Word.POS_CHOICES,
        }
        return render(request, 'memo/word_list.html', context)
