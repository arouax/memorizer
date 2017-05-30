from django.shortcuts import render
import json
from django.http import Http404, HttpResponse
from .models import Word


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
    if request.is_ajax() and request.user.is_authenticated():
        words = Word.objects.all()
        dictionaries = [obj.as_dict() for obj in words]
        data = json.dumps({'data': dictionaries})
        return HttpResponse(data, content_type='application/json')
    else:
        raise Http404


def setdata(request):
    if (request.is_ajax() and
        request.method == 'POST' and
        request.user.is_authenticated()):
        print(request.user)
        print(request.POST.get('pk'))
        data = json.dumps({'data': 'Okay'})
        return HttpResponse(data)
    else:
        raise Http404
