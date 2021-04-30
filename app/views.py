from django.shortcuts import render
from django.http import Http404
from django.http import HttpResponse
def index(request):
    return render(request, 'chat1.html')


