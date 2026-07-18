from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_character_created_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="Creature",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, default="")),
                ("book", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="creatures", to="api.book")),
            ],
            options={
                "ordering": ["name"],
            },
        ),
    ]
