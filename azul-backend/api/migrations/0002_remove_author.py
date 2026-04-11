from django.db import migrations, models


def copy_author_names(apps, schema_editor):
    Saga = apps.get_model("api", "Saga")
    Book = apps.get_model("api", "Book")
    for saga in Saga.objects.select_related("author").all():
        saga.author_text = saga.author.name if saga.author_id else ""
        saga.save(update_fields=["author_text"])
    for book in Book.objects.select_related("author").all():
        book.author_text = book.author.name if book.author_id else ""
        book.save(update_fields=["author_text"])


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="saga",
            name="author_text",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="book",
            name="author_text",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.RunPython(copy_author_names, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name="saga",
            unique_together=set(),
        ),
        migrations.AlterUniqueTogether(
            name="book",
            unique_together=set(),
        ),
        migrations.RemoveField(model_name="saga", name="author"),
        migrations.RemoveField(model_name="book", name="author"),
        migrations.RenameField(model_name="saga", old_name="author_text", new_name="author"),
        migrations.RenameField(model_name="book", old_name="author_text", new_name="author"),
        migrations.DeleteModel(name="Author"),
        migrations.AlterUniqueTogether(
            name="saga",
            unique_together={("author", "name")},
        ),
        migrations.AlterUniqueTogether(
            name="book",
            unique_together={("author", "title")},
        ),
    ]
