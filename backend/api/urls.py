from django.urls import path
from . import views

urlpatterns = [
    path('forum/', views.forum),
    path('forum/posts/', views.forum_posts),
    path('weather/', views.weather),
    path('market/', views.market),
    path('notifications/', views.notifications),
]
