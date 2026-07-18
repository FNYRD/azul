from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_remove_author"),
    ]

    operations = [
        migrations.AddField(
            model_name="character",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AlterModelOptions(
            name="character",
            options={"ordering": ["created_at"]},
        ),
    ]
