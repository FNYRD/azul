import uuid
from django.db import models


class Author(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Saga(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    author = models.ForeignKey(Author, related_name='sagas', on_delete=models.CASCADE)

    class Meta:
        unique_together = [['author', 'name']]
        ordering = ['name']

    def __str__(self):
        return f'{self.author.name} / {self.name}'


class Book(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    author = models.ForeignKey(Author, related_name='books', on_delete=models.CASCADE)
    saga = models.ForeignKey(
        Saga, null=True, blank=True, related_name='saga_books', on_delete=models.SET_NULL
    )

    class Meta:
        unique_together = [['author', 'title']]
        ordering = ['title']

    def __str__(self):
        return f'{self.author.name} / {self.title}'


class Character(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    age = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    book = models.ForeignKey(Book, related_name='characters', on_delete=models.CASCADE)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.book.title} / {self.name}'


class Place(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    book = models.ForeignKey(Book, related_name='places', on_delete=models.CASCADE)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.book.title} / {self.name}'


class Thing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    book = models.ForeignKey(Book, related_name='things', on_delete=models.CASCADE)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.book.title} / {self.name}'


class Word(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    word = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    book = models.ForeignKey(Book, related_name='words', on_delete=models.CASCADE)

    class Meta:
        ordering = ['word']

    def __str__(self):
        return f'{self.book.title} / {self.word}'
