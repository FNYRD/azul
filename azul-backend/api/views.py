from django.db.models import Count, Prefetch
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from .models import Saga, Book, Character, Place, Thing, Word
from .serializers import (
    SagaInLibrarySerializer, SagaDetailSerializer, SagaWriteSerializer,
    BookDetailSerializer, BookOverviewSerializer, BookWriteSerializer,
    CharacterSerializer, CharacterWriteSerializer,
    PlaceSerializer, PlaceWriteSerializer,
    ThingSerializer, ThingWriteSerializer,
    WordSerializer, WordWriteSerializer,
    MentionSagaSerializer, MentionBookSerializer,
)

SEP = "\n\n---\n\n"


def _annotate_element_counts(qs):
    return qs.annotate(
        char_count=Count("characters", distinct=True),
        place_count=Count("places", distinct=True),
        thing_count=Count("things", distinct=True),
        word_count=Count("words", distinct=True),
    )


def _append_description(obj, text):
    obj.description = (obj.description + SEP + text) if obj.description.strip() else text
    obj.save(update_fields=["description"])
    return obj


# ── Library ────────────────────────────────────────────────────────────────────

class LibraryView(APIView):
    def get(self, request):
        sagas = Saga.objects.prefetch_related(
            Prefetch("saga_books", queryset=Book.objects.only(
                "id", "title", "start_date", "end_date", "saga_id"
            ))
        ).all()
        standalone = _annotate_element_counts(Book.objects.filter(saga__isnull=True))
        return Response({
            "sagas": SagaInLibrarySerializer(sagas, many=True).data,
            "standalone_books": BookOverviewSerializer(standalone, many=True).data,
        })


# ── Sagas ──────────────────────────────────────────────────────────────────────

class SagaViewSet(GenericViewSet):
    def create(self, request):
        ser = SagaWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        saga = ser.save()
        saga.books_list = []
        return Response(SagaInLibrarySerializer(saga).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        saga = Saga.objects.prefetch_related(
            Prefetch("saga_books", queryset=_annotate_element_counts(Book.objects.all()))
        ).get(pk=pk)
        return Response(SagaDetailSerializer(saga).data)

    def partial_update(self, request, pk=None):
        saga = Saga.objects.get(pk=pk)
        ser = SagaWriteSerializer(saga, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        saga.refresh_from_db()
        return Response(SagaInLibrarySerializer(saga).data)

    def destroy(self, request, pk=None):
        Saga.objects.get(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def append(self, request, pk=None):
        saga = Saga.objects.get(pk=pk)
        text = (request.data.get("text") or "").strip()
        if not text:
            return Response({"error": "text required"}, status=400)
        _append_description(saga, text)
        return Response({"id": str(saga.id), "description": saga.description})

    @action(detail=True, methods=["post"], url_path="books")
    def create_book(self, request, pk=None):
        saga = Saga.objects.get(pk=pk)
        ser = BookWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.validated_data.pop("saga_id", None)
        if not ser.validated_data.get("author") and saga.author:
            ser.validated_data["author"] = saga.author
        book = ser.save(saga=saga)
        book = _annotate_element_counts(Book.objects.filter(pk=book.pk)).first()
        return Response(BookOverviewSerializer(book).data, status=status.HTTP_201_CREATED)


# ── Books ──────────────────────────────────────────────────────────────────────

class BookViewSet(GenericViewSet):
    def create(self, request):
        ser = BookWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        saga_id = ser.validated_data.pop("saga_id", None)
        saga = Saga.objects.get(pk=saga_id) if saga_id else None
        book = ser.save(saga=saga)
        book = _annotate_element_counts(Book.objects.filter(pk=book.pk)).first()
        return Response(BookOverviewSerializer(book).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        book = Book.objects.prefetch_related(
            "characters", "places", "things", "words"
        ).get(pk=pk)
        return Response(BookDetailSerializer(book).data)

    def partial_update(self, request, pk=None):
        book = Book.objects.get(pk=pk)
        ser = BookWriteSerializer(book, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        saga_id = ser.validated_data.pop("saga_id", ...)
        if saga_id is not ...:
            book.saga = Saga.objects.get(pk=saga_id) if saga_id else None
        ser.save()
        book.refresh_from_db()
        book = _annotate_element_counts(Book.objects.filter(pk=book.pk)).first()
        return Response(BookOverviewSerializer(book).data)

    def destroy(self, request, pk=None):
        Book.objects.get(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def append(self, request, pk=None):
        book = Book.objects.get(pk=pk)
        text = (request.data.get("text") or "").strip()
        if not text:
            return Response({"error": "text required"}, status=400)
        _append_description(book, text)
        return Response({"id": str(book.id), "description": book.description})

    @action(detail=True, methods=["post"], url_path="characters")
    def add_character(self, request, pk=None):
        book = Book.objects.get(pk=pk)
        ser = CharacterWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        char = ser.save(book=book)
        return Response(CharacterSerializer(char).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="places")
    def add_place(self, request, pk=None):
        book = Book.objects.get(pk=pk)
        ser = PlaceWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        place = ser.save(book=book)
        return Response(PlaceSerializer(place).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="things")
    def add_thing(self, request, pk=None):
        book = Book.objects.get(pk=pk)
        ser = ThingWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        thing = ser.save(book=book)
        return Response(ThingSerializer(thing).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="words")
    def add_word(self, request, pk=None):
        book = Book.objects.get(pk=pk)
        ser = WordWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        word = ser.save(book=book)
        return Response(WordSerializer(word).data, status=status.HTTP_201_CREATED)


# ── Element update / delete / append ──────────────────────────────────────────

class ElementViewSet(GenericViewSet):
    model = None
    serializer_class = None
    write_serializer_class = None

    def _get_obj(self, pk):
        return self.model.objects.get(pk=pk)

    def partial_update(self, request, pk=None):
        obj = self._get_obj(pk)
        ser = self.write_serializer_class(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(self.serializer_class(obj).data)

    def destroy(self, request, pk=None):
        self._get_obj(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def append(self, request, pk=None):
        obj = self._get_obj(pk)
        text = (request.data.get("text") or "").strip()
        if not text:
            return Response({"error": "text required"}, status=400)
        _append_description(obj, text)
        return Response(self.serializer_class(obj).data)


class CharacterViewSet(ElementViewSet):
    model = Character
    serializer_class = CharacterSerializer
    write_serializer_class = CharacterWriteSerializer


class PlaceViewSet(ElementViewSet):
    model = Place
    serializer_class = PlaceSerializer
    write_serializer_class = PlaceWriteSerializer


class ThingViewSet(ElementViewSet):
    model = Thing
    serializer_class = ThingSerializer
    write_serializer_class = ThingWriteSerializer


class WordViewSet(ElementViewSet):
    model = Word
    serializer_class = WordSerializer
    write_serializer_class = WordWriteSerializer


# ── Mention entities ───────────────────────────────────────────────────────────

class MentionEntitiesView(APIView):
    def get(self, request):
        sagas = Saga.objects.only("id", "name")
        books = Book.objects.only("id", "title").prefetch_related(
            Prefetch("characters", queryset=Character.objects.only("id", "name")),
            Prefetch("places", queryset=Place.objects.only("id", "name")),
            Prefetch("things", queryset=Thing.objects.only("id", "name")),
            Prefetch("words", queryset=Word.objects.only("id", "word")),
        )
        return Response({
            "sagas": MentionSagaSerializer(sagas, many=True).data,
            "books": MentionBookSerializer(books, many=True).data,
        })


# ── Global search ──────────────────────────────────────────────────────────────

class SearchView(APIView):
    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if not q:
            return Response([])

        hits = []
        q_lower = q.lower()

        def excerpt(text):
            if not text:
                return None
            idx = text.lower().find(q_lower)
            if idx == -1:
                return None
            start = max(0, idx - 40)
            end = min(len(text), idx + len(q) + 60)
            return ("..." if start > 0 else "") + text[start:end] + ("..." if end < len(text) else "")

        def matches(*fields):
            return any(f and q_lower in f.lower() for f in fields)

        for saga in Saga.objects.all():
            if matches(saga.name, saga.author, saga.description):
                hits.append({
                    "type": "saga", "label": "Saga",
                    "name": saga.name, "sub": saga.author or None,
                    "excerpt": excerpt(saga.description), "age": None,
                    "nav": {"view": "saga", "sagaId": str(saga.id)},
                })

        for book in Book.objects.prefetch_related("characters", "places", "things", "words").all():
            if matches(book.title, book.author, book.description):
                hits.append({
                    "type": "book", "label": "Book",
                    "name": book.title, "sub": book.author or None,
                    "excerpt": excerpt(book.description), "age": None,
                    "nav": {
                        "view": "book", "bookId": str(book.id),
                        "sagaId": str(book.saga_id) if book.saga_id else None,
                    },
                })

            def add_elements(items, etype, label, name_key):
                for el in items:
                    name = getattr(el, name_key)
                    if matches(name, el.description, getattr(el, "age", None)):
                        hits.append({
                            "type": etype, "label": label,
                            "name": name,
                            "sub": book.title,
                            "excerpt": excerpt(el.description),
                            "age": getattr(el, "age", None) or None,
                            "nav": {
                                "view": "book", "bookId": str(book.id),
                                "sagaId": str(book.saga_id) if book.saga_id else None,
                                "tab": etype + "s",
                            },
                        })

            add_elements(book.characters.all(), "character", "Character", "name")
            add_elements(book.places.all(),     "place",     "Place",     "name")
            add_elements(book.things.all(),     "thing",     "Object",    "name")
            add_elements(book.words.all(),      "word",      "Word",      "word")

        return Response(hits)
