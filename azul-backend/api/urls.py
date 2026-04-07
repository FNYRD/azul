from django.urls import path
from . import views

# Manual URL patterns — clearer than a Router for these mixed-method viewsets

author = views.AuthorViewSet.as_view
saga   = views.SagaViewSet.as_view
book   = views.BookViewSet.as_view
char_  = views.CharacterViewSet.as_view
place_ = views.PlaceViewSet.as_view
thing_ = views.ThingViewSet.as_view
word_  = views.WordViewSet.as_view

urlpatterns = [
    # ── Authors ────────────────────────────────────────────────────────────────
    path('authors/',                   author({'get': 'list',     'post': 'create'})),
    path('authors/<uuid:pk>/',         author({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('authors/<uuid:pk>/append/',  author({'post': 'append'})),
    path('authors/<uuid:pk>/sagas/',   author({'post': 'create_saga'})),
    path('authors/<uuid:pk>/books/',   author({'post': 'create_book'})),

    # ── Sagas ──────────────────────────────────────────────────────────────────
    path('sagas/<uuid:pk>/',           saga({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('sagas/<uuid:pk>/append/',    saga({'post': 'append'})),
    path('sagas/<uuid:pk>/books/',     saga({'post': 'create_book'})),

    # ── Books ──────────────────────────────────────────────────────────────────
    path('books/<uuid:pk>/',           book({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('books/<uuid:pk>/append/',    book({'post': 'append'})),
    path('books/<uuid:pk>/characters/', book({'post': 'add_character'})),
    path('books/<uuid:pk>/places/',    book({'post': 'add_place'})),
    path('books/<uuid:pk>/things/',    book({'post': 'add_thing'})),
    path('books/<uuid:pk>/words/',     book({'post': 'add_word'})),

    # ── Elements ───────────────────────────────────────────────────────────────
    path('characters/<uuid:pk>/',      char_({'patch': 'partial_update', 'delete': 'destroy'})),
    path('characters/<uuid:pk>/append/', char_({'post': 'append'})),
    path('places/<uuid:pk>/',          place_({'patch': 'partial_update', 'delete': 'destroy'})),
    path('places/<uuid:pk>/append/',   place_({'post': 'append'})),
    path('things/<uuid:pk>/',          thing_({'patch': 'partial_update', 'delete': 'destroy'})),
    path('things/<uuid:pk>/append/',   thing_({'post': 'append'})),
    path('words/<uuid:pk>/',           word_({'patch': 'partial_update', 'delete': 'destroy'})),
    path('words/<uuid:pk>/append/',    word_({'post': 'append'})),

    # ── Special ────────────────────────────────────────────────────────────────
    path('mention-entities/',          views.MentionEntitiesView.as_view()),
    path('search/',                    views.SearchView.as_view()),
]
