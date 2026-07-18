from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_creature"),
    ]

    operations = [
        migrations.CreateModel(
            name="Fact",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("content", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now)),
                ("book", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="facts", to="api.book")),
            ],
            options={
                "ordering": ["created_at"],
            },
        ),
    ]
