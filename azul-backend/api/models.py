import uuid
from django.db import models


class Saga(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, default="")
    description = models.TextField(blank=True, default="")

    class Meta:
        unique_together = [["author", "name"]]
        ordering = ["author", "name"]

    def __str__(self):
        return f"{self.author} / {self.name}" if self.author else self.name


class Book(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True, default="")
    description = models.TextField(blank=True, default="")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    saga = models.ForeignKey(
        Saga, null=True, blank=True, related_name="saga_books", on_delete=models.SET_NULL
    )

    class Meta:
        unique_together = [["author", "title"]]
        ordering = ["author", "title"]

    def __str__(self):
        return f"{self.author} / {self.title}" if self.author else self.title


class Character(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    age = models.CharField(max_length=100, blank=True, default="")
    description = models.TextField(blank=True, default="")
    book = models.ForeignKey(Book, related_name="characters", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.book.title} / {self.name}"


class Place(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    book = models.ForeignKey(Book, related_name="places", on_delete=models.CASCADE)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.book.title} / {self.name}"


class Thing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    book = models.ForeignKey(Book, related_name="things", on_delete=models.CASCADE)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.book.title} / {self.name}"


class Word(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    word = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    book = models.ForeignKey(Book, related_name="words", on_delete=models.CASCADE)

    class Meta:
        ordering = ["word"]

    def __str__(self):
        return f"{self.book.title} / {self.word}"


class Creature(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    book = models.ForeignKey(Book, related_name="creatures", on_delete=models.CASCADE)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.book.title} / {self.name}"


class Fact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    book = models.ForeignKey(Book, related_name="facts", on_delete=models.CASCADE)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.book.title} / fact"
