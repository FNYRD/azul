from rest_framework import serializers
from .models import Saga, Book, Character, Place, Thing, Word


# ── Element serializers ────────────────────────────────────────────────────────

class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ["id", "name", "age", "description"]


class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ["id", "name", "description"]


class ThingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thing
        fields = ["id", "name", "description"]


class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = ["id", "word", "description"]


# ── Book serializers ───────────────────────────────────────────────────────────

class BookInSagaSerializer(serializers.ModelSerializer):
    saga_id = serializers.UUIDField(read_only=True, allow_null=True)

    class Meta:
        model = Book
        fields = ["id", "title", "start_date", "end_date", "saga_id"]


class BookOverviewSerializer(serializers.ModelSerializer):
    element_count = serializers.SerializerMethodField()
    saga_id = serializers.UUIDField(read_only=True, allow_null=True)

    class Meta:
        model = Book
        fields = ["id", "title", "author", "description", "start_date", "end_date", "saga_id", "element_count"]

    def get_element_count(self, obj):
        return (
            getattr(obj, "char_count", 0) +
            getattr(obj, "place_count", 0) +
            getattr(obj, "thing_count", 0) +
            getattr(obj, "word_count", 0)
        )


class BookDetailSerializer(serializers.ModelSerializer):
    saga_id = serializers.UUIDField(read_only=True, allow_null=True)
    characters = CharacterSerializer(many=True, read_only=True)
    places = PlaceSerializer(many=True, read_only=True)
    things = ThingSerializer(many=True, read_only=True)
    words = WordSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            "id", "title", "author", "description", "start_date", "end_date",
            "saga_id", "characters", "places", "things", "words",
        ]


# ── Saga serializers ───────────────────────────────────────────────────────────

class SagaInLibrarySerializer(serializers.ModelSerializer):
    books = BookInSagaSerializer(source="saga_books", many=True, read_only=True)

    class Meta:
        model = Saga
        fields = ["id", "name", "author", "description", "books"]


class SagaDetailSerializer(serializers.ModelSerializer):
    books = BookOverviewSerializer(source="saga_books", many=True, read_only=True)

    class Meta:
        model = Saga
        fields = ["id", "name", "author", "description", "books"]


# ── Write serializers ──────────────────────────────────────────────────────────

class SagaWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Saga
        fields = ["name", "author", "description"]


class BookWriteSerializer(serializers.ModelSerializer):
    saga_id = serializers.UUIDField(allow_null=True, required=False)

    class Meta:
        model = Book
        fields = ["title", "author", "description", "start_date", "end_date", "saga_id"]

    def validate_saga_id(self, value):
        if value is None:
            return None
        try:
            Saga.objects.get(pk=value)
        except Saga.DoesNotExist:
            raise serializers.ValidationError("Saga not found.")
        return value


class CharacterWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ["name", "age", "description"]


class PlaceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ["name", "description"]


class ThingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thing
        fields = ["name", "description"]


class WordWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = ["word", "description"]


# ── Mention entities ───────────────────────────────────────────────────────────

class MentionWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = ["id", "word"]


class MentionCharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ["id", "name"]


class MentionPlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ["id", "name"]


class MentionThingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thing
        fields = ["id", "name"]


class MentionBookSerializer(serializers.ModelSerializer):
    characters = MentionCharacterSerializer(many=True, read_only=True)
    places = MentionPlaceSerializer(many=True, read_only=True)
    things = MentionThingSerializer(many=True, read_only=True)
    words = MentionWordSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = ["id", "title", "characters", "places", "things", "words"]


class MentionSagaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Saga
        fields = ["id", "name"]
