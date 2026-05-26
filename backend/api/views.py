import json
import os
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATA_DIR = os.path.join(BASE, 'data')


def read_json(name):
    p = os.path.join(DATA_DIR, name)
    if not os.path.exists(p):
        return None
    with open(p, 'r', encoding='utf8') as f:
        return json.load(f)


def write_json(name, data):
    p = os.path.join(DATA_DIR, name)
    with open(p, 'w', encoding='utf8') as f:
        json.dump(data, f, indent=2)


def forum(request):
    data = read_json('forum.json') or []
    return JsonResponse(data, safe=False)


@csrf_exempt
def forum_posts(request):
    if request.method == 'GET':
        data = read_json('forum_posts.json') or []
        return JsonResponse(data, safe=False)
    if request.method == 'POST':
        try:
            payload = json.loads(request.body)
        except Exception:
            return HttpResponseBadRequest('invalid body')
        existing = read_json('forum_posts.json') or []
        existing.insert(0, payload)
        write_json('forum_posts.json', existing)
        return JsonResponse({'success': True})


def weather(request):
    data = read_json('weather.json') or {}
    return JsonResponse(data, safe=False)


def market(request):
    data = read_json('market.json') or {}
    return JsonResponse(data, safe=False)


def notifications(request):
    data = read_json('notifications.json') or []
    return JsonResponse(data, safe=False)
